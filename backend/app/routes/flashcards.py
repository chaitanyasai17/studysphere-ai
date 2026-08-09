import datetime
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.utils.db import get_db
from app.services.ai_service import get_ai

flashcards_bp = Blueprint("flashcards", __name__, url_prefix="/api/flashcards")

@flashcards_bp.route("/decks", methods=["GET"])
@token_required
def get_decks():
    db = get_db()
    flash_col = db.get_collection("flashcards")
    decks = flash_col.find({"user_id": g.user_id}, sort=[("created_at", -1)])
    return jsonify(decks), 200

@flashcards_bp.route("/generate", methods=["POST"])
@token_required
def generate_deck():
    data = request.get_json() or {}
    category = data.get("category", "General Study")
    text_input = data.get("text_input", "")
    
    ai = get_ai()
    try:
        cards_data = ai.generate_flashcards(category, text_input)
    except Exception as e:
        return jsonify({"message": f"Failed to generate flashcards: {str(e)}"}), 500
        
    db = get_db()
    flash_col = db.get_collection("flashcards")
    
    # Format cards to match schemas
    formatted_cards = []
    for card in cards_data.get("cards", []):
        formatted_cards.append({
            "front": card.get("front", ""),
            "back": card.get("back", ""),
            "is_bookmarked": False,
            "status": "new"  # new, learning, mastered
        })
        
    deck_doc = {
        "user_id": g.user_id,
        "category": category,
        "cards": formatted_cards,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    res = flash_col.insert_one(deck_doc)
    deck_doc["_id"] = str(res.inserted_id)
    
    return jsonify(deck_doc), 201

@flashcards_bp.route("/decks/<deck_id>", methods=["DELETE"])
@token_required
def delete_deck(deck_id):
    db = get_db()
    flash_col = db.get_collection("flashcards")
    res = flash_col.delete_one({"_id": deck_id, "user_id": g.user_id})
    if not res:
        return jsonify({"message": "Flashcard deck not found."}), 404
    return jsonify({"message": "Flashcard deck deleted successfully."}), 200

@flashcards_bp.route("/decks/<deck_id>/cards/<card_idx>/bookmark", methods=["POST"])
@token_required
def bookmark_card(deck_id, card_idx):
    db = get_db()
    flash_col = db.get_collection("flashcards")
    deck = flash_col.find_one({"_id": deck_id, "user_id": g.user_id})
    if not deck:
        return jsonify({"message": "Deck not found."}), 404
        
    idx = int(card_idx)
    cards = deck.get("cards", [])
    if idx < 0 or idx >= len(cards):
        return jsonify({"message": "Invalid card index."}), 400
        
    # Toggle bookmark
    cards[idx]["is_bookmarked"] = not cards[idx].get("is_bookmarked", False)
    
    flash_col.update_one({"_id": deck_id}, {"$set": {"cards": cards}})
    return jsonify({"card": cards[idx]}), 200

@flashcards_bp.route("/decks/<deck_id>/cards/<card_idx>/status", methods=["POST"])
@token_required
def update_card_status(deck_id, card_idx):
    data = request.get_json() or {}
    status = data.get("status", "learning")  # new, learning, mastered
    
    if status not in ["new", "learning", "mastered"]:
        return jsonify({"message": "Invalid status."}), 400
        
    db = get_db()
    flash_col = db.get_collection("flashcards")
    deck = flash_col.find_one({"_id": deck_id, "user_id": g.user_id})
    if not deck:
        return jsonify({"message": "Deck not found."}), 404
        
    idx = int(card_idx)
    cards = deck.get("cards", [])
    if idx < 0 or idx >= len(cards):
        return jsonify({"message": "Invalid card index."}), 400
        
    cards[idx]["status"] = status
    
    flash_col.update_one({"_id": deck_id}, {"$set": {"cards": cards}})
    return jsonify({"card": cards[idx]}), 200
