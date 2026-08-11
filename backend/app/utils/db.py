import os
import json
import logging
import sqlite3
import time
from bson import ObjectId
from datetime import datetime
from flask import has_app_context, g
from app.config import Config

logger = logging.getLogger(__name__)

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

class DatabaseConnectionError(Exception):
    """Custom exception raised when SQLite connection fails (fallback helper)."""
    pass

class SqliteCollection:
    """Wrapper that emulates a PyMongo collection using SQLite JSON storage."""
    def __init__(self, db_manager, collection_name):
        self.db_manager = db_manager
        self.name = collection_name

    def _get_all(self):
        cursor = self.db_manager.conn.cursor()
        cursor.execute("SELECT data FROM documents WHERE collection = ?", (self.name,))
        rows = cursor.fetchall()
        docs = []
        for r in rows:
            try:
                docs.append(json.loads(r["data"]))
            except Exception:
                pass
        return docs

    def _save_doc(self, doc):
        doc_id = str(doc.get("_id", doc.get("id")))
        doc_json = json.dumps(doc, cls=JSONEncoder)
        with self.db_manager.conn:
            self.db_manager.conn.execute(
                "INSERT OR REPLACE INTO documents (collection, id, data) VALUES (?, ?, ?)",
                (self.name, doc_id, doc_json)
            )

    def _delete_doc(self, doc_id):
        with self.db_manager.conn:
            self.db_manager.conn.execute(
                "DELETE FROM documents WHERE collection = ? AND id = ?",
                (self.name, str(doc_id))
            )

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
        docs = self._get_all()
        query = query or {}
        results = [doc for doc in docs if self._matches(doc, query)]
        # Simple sorting if sort is passed (e.g., [('created_at', -1)])
        if sort:
            for field, order in reversed(sort):
                results.sort(key=lambda x: x.get(field) or "", reverse=(order == -1))
        return results

    @measure_db_time
    def find_one(self, query=None):
        docs = self._get_all()
        query = query or {}
        for doc in docs:
            if self._matches(doc, query):
                return doc
        return None

    @measure_db_time
    def insert_one(self, document):
        if "_id" not in document:
            document["_id"] = str(ObjectId())
        else:
            document["_id"] = str(document["_id"])
            
        # Convert any datetime elements to isoformat
        for k, v in document.items():
            if isinstance(v, datetime):
                document[k] = v.isoformat()
            elif isinstance(v, ObjectId):
                document[k] = str(v)
                
        self._save_doc(document)
        
        class InsertResult:
            def __init__(self, inserted_id):
                self.inserted_id = inserted_id
        return InsertResult(document["_id"])

    @measure_db_time
    def insert_many(self, documents):
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
                    
            self._save_doc(document)
            inserted_ids.append(document["_id"])
            
        class InsertManyResult:
            def __init__(self, inserted_ids):
                self.inserted_ids = inserted_ids
        return InsertManyResult(inserted_ids)

    @measure_db_time
    def update_one(self, query, update, upsert=False):
        docs = self.find(query)
        target_doc = docs[0] if docs else None

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
            self._save_doc(target_doc)
        return True

    @measure_db_time
    def update_many(self, query, update, upsert=False):
        docs = self.find(query)
        updated_count = 0
        for doc in docs:
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
                self._save_doc(doc)
                updated_count += 1
                
        class UpdateResult:
            def __init__(self, modified_count):
                self.modified_count = modified_count
        return UpdateResult(updated_count)

    @measure_db_time
    def delete_one(self, query):
        doc = self.find_one(query)
        if doc:
            self._delete_doc(doc["_id"])
            return True
        return False

    @measure_db_time
    def delete_many(self, query):
        docs = self.find(query)
        deleted_count = 0
        for doc in docs:
            self._delete_doc(doc["_id"])
            deleted_count += 1
            
        class DeleteResult:
            def __init__(self, deleted_count):
                self.deleted_count = deleted_count
        return DeleteResult(deleted_count)

    @measure_db_time
    def count_documents(self, query):
        docs = self.find(query)
        return len(docs)

class DatabaseManager:
    """Manages connection to SQLite database."""
    def __init__(self):
        self.conn = None
        self.is_mock = False  # Keep property for status interface fallback
        
        # SQLite DB path
        db_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data")
        try:
            os.makedirs(db_dir, exist_ok=True)
        except Exception:
            pass
        self.db_path = os.path.join(db_dir, "studysphere.db")
        
        try:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
            self._init_db()
            logger.info(f"Successfully connected to SQLite database at {self.db_path}.")
        except Exception as e:
            logger.critical(f"SQLite initialization failed: {e}")
            raise DatabaseConnectionError(f"SQLite initialization failed: {e}")

    def _init_db(self):
        with self.conn:
            self.conn.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    collection TEXT,
                    id TEXT,
                    data TEXT,
                    PRIMARY KEY (collection, id)
                )
            """)

    def get_collection(self, name):
        return SqliteCollection(self, name)

# Global DB Instance
db_manager = DatabaseManager()

def get_db():
    return db_manager
