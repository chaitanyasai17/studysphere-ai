import os
import json
import logging
from bson import ObjectId
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ConfigurationError
from app.config import Config

logger = logging.getLogger(__name__)

import time
from flask import has_app_context, g

def measure_db_time(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        res = func(*args, **kwargs)
        duration = time.time() - start
        if has_app_context():
            g.db_query_time = getattr(g, "db_query_time", 0.0) + duration
        return res
    return wrapper

class JSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle ObjectIds and datetime objects."""
    def default(self, o):
        if isinstance(o, ObjectId):
            return str(o)
        if isinstance(o, datetime):
            return o.isoformat()
        return super().default(o)

class MockCollection:
    """Mock PyMongo collection using a local JSON file for persistence."""
    def __init__(self, db_manager, collection_name):
        self.db_manager = db_manager
        self.name = collection_name

    def _get_data(self):
        return self.db_manager._load_data().setdefault(self.name, [])

    def _save_data(self, data):
        all_data = self.db_manager._load_data()
        all_data[self.name] = data
        self.db_manager._write_data(all_data)

    def _matches(self, doc, query):
        if not query:
            return True
        for key, val in query.items():
            doc_val = doc.get(key)
            # Handle ObjectId conversions
            if key == "_id" or key.endswith("_id"):
                if isinstance(val, ObjectId):
                    val = str(val)
                doc_val = str(doc_val) if doc_val else None

            # Handle basic comparison
            if isinstance(val, dict):
                # Simple operator support (e.g., $gt, $in)
                for op, op_val in val.items():
                    if op == "$in":
                        if doc_val not in op_val:
                            return False
                    elif op == "$gt":
                        if doc_val is None or doc_val <= op_val:
                            return False
                    elif op == "$lt":
                        if doc_val is None or doc_val >= op_val:
                            return False
                    elif op == "$ne":
                        if doc_val == op_val:
                            return False
            else:
                if doc_val != val:
                    return False
        return True

    @measure_db_time
    def find(self, query=None, sort=None):
        docs = self._get_data()
        query = query or {}
        results = [doc for doc in docs if self._matches(doc, query)]
        # Simple sorting if sort is passed (e.g., [('created_at', -1)])
        if sort:
            for field, order in reversed(sort):
                results.sort(key=lambda x: x.get(field) or "", reverse=(order == -1))
        return results

    @measure_db_time
    def find_one(self, query=None):
        docs = self._get_data()
        query = query or {}
        for doc in docs:
            if self._matches(doc, query):
                return doc
        return None

    @measure_db_time
    def insert_one(self, document):
        docs = self._get_data()
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        else:
            document["_id"] = str(document["_id"])
            
        # Convert any datetime elements to isoformat or store them as is (load handles dates)
        for k, v in document.items():
            if isinstance(v, datetime):
                document[k] = v.isoformat()
            elif isinstance(v, ObjectId):
                document[k] = str(v)
                
        docs.append(document)
        self._save_data(docs)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(document["_id"])

    @measure_db_time
    def insert_many(self, documents):
        docs = self._get_data()
        inserted_ids = []
        for document in documents:
            if "_id" not in document:
                document["_id"] = str(ObjectId())
            else:
                document["_id"] = str(document["_id"])
                
            for k, v in document.items():
                if isinstance(v, datetime):
                    document[k] = v.isoformat()
                elif isinstance(v, ObjectId):
                    document[k] = str(v)
                    
            docs.append(document)
            inserted_ids.append(document["_id"])
            
        self._save_data(docs)
        
        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = inserted_ids
        return InsertManyResult(inserted_ids)

    @measure_db_time
    def update_one(self, query, update, upsert=False):
        docs = self._get_data()
        target_doc = None
        for doc in docs:
            if self._matches(doc, query):
                target_doc = doc
                break

        if not target_doc:
            if upsert:
                # Basic upsert
                new_doc = query.copy()
                if "$set" in update:
                    new_doc.update(update["$set"])
                self.insert_one(new_doc)
                return True
            return False

        # Apply update operations ($set, $push, etc.)
        updated = False
        if "$set" in update:
            for k, v in update["$set"].items():
                if isinstance(v, datetime):
                    target_doc[k] = v.isoformat()
                elif isinstance(v, ObjectId):
                    target_doc[k] = str(v)
                else:
                    target_doc[k] = v
            updated = True
            
        if "$push" in update:
            for k, v in update["$push"].items():
                target_doc.setdefault(k, [])
                if isinstance(v, datetime):
                    val = v.isoformat()
                elif isinstance(v, ObjectId):
                    val = str(v)
                else:
                    val = v
                target_doc[k].append(val)
            updated = True

        if "$inc" in update:
            for k, v in update["$inc"].items():
                target_doc[k] = target_doc.get(k, 0) + v
            updated = True
            
        if updated:
            self._save_data(docs)
        return True

    @measure_db_time
    def update_many(self, query, update, upsert=False):
        docs = self._get_data()
        updated_count = 0
        for doc in docs:
            if self._matches(doc, query):
                updated = False
                if "$set" in update:
                    for k, v in update["$set"].items():
                        if isinstance(v, datetime):
                            doc[k] = v.isoformat()
                        elif isinstance(v, ObjectId):
                            doc[k] = str(v)
                        else:
                            doc[k] = v
                    updated = True
                if updated:
                    updated_count += 1
                    
        if updated_count > 0:
            self._save_data(docs)
            
        class UpdateResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
        return UpdateResult(updated_count)

    @measure_db_time
    def delete_one(self, query):
        docs = self._get_data()
        for idx, doc in enumerate(docs):
            if self._matches(doc, query):
                docs.pop(idx)
                self._save_data(docs)
                return True
        return False

    @measure_db_time
    def delete_many(self, query):
        docs = self._get_data()
        initial_count = len(docs)
        remaining_docs = [doc for doc in docs if not self._matches(doc, query)]
        self._save_data(remaining_docs)
        
        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(initial_count - len(remaining_docs))

    @measure_db_time
    def count_documents(self, query):
        docs = self._get_data()
        return sum(1 for doc in docs if self._matches(doc, query))

class DatabaseManager:
    """Manages connection to MongoDB Atlas, falling back to local file DB."""
    def __init__(self):
        self.client = None
        self.db = None
        self.is_mock = False
        
        # Local mock database path
        os.makedirs(Config.LOG_DIR, exist_ok=True)
        self.mock_file_path = os.path.join(Config.LOG_DIR, "db_store.json")
        
        # Try to connect to MongoDB Atlas
        if Config.MONGODB_URI:
            try:
                self.client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=3000)
                # Verify connection
                self.client.admin.command('ping')
                self.db = self.client.get_default_database()
                logger.info("Successfully connected to MongoDB Atlas.")
                # Create production indexes for query speedups
                try:
                    self.db["pdf_chunks"].create_index([("pdf_id", 1)])
                    self.db["pdf_chunks"].create_index([("chunk_id", 1)])
                    self.db["pdf_jobs"].create_index([("pdf_id", 1)])
                    self.db["gemini_cache"].create_index([("_id", 1)])
                except Exception as index_err:
                    logger.warning(f"Failed to create production collection indexes: {index_err}")
            except (ConnectionFailure, ConfigurationError, Exception) as e:
                logger.warning(f"MongoDB connection failed: {e}. Falling back to Local JSON Database.")
                self.is_mock = True
        else:
            logger.info("No MONGODB_URI set in .env. Falling back to Local JSON Database.")
            self.is_mock = True

    def _load_data(self):
        if not os.path.exists(self.mock_file_path):
            return {}
        try:
            with open(self.mock_file_path, "r") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_data(self, data):
        try:
            with open(self.mock_file_path, "w") as f:
                json.dump(data, f, cls=JSONEncoder, indent=2)
        except Exception as e:
            logger.error(f"Failed to write mock db data: {e}")

    def get_collection(self, name):
        if self.is_mock:
            return MockCollection(self, name)
        return CollectionWrapper(self.db[name])

class CollectionWrapper:
    """Wrapper around a PyMongo collection to trace DB execution timing in request context."""
    def __init__(self, collection):
        self._collection = collection

    def __getattr__(self, name):
        attr = getattr(self._collection, name)
        if callable(attr):
            def wrapper(*args, **kwargs):
                start = time.time()
                res = attr(*args, **kwargs)
                duration = time.time() - start
                if has_app_context():
                    g.db_query_time = getattr(g, "db_query_time", 0.0) + duration
                return res
            return wrapper
        return attr

# Global DB Instance
db_manager = DatabaseManager()

def get_db():
    return db_manager
