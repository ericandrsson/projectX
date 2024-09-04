from flask import Blueprint, render_template, jsonify, request
from flask import current_app as app
from math import radians, degrees, cos, sin, asin, sqrt
from pocketbase import PocketBase

main = Blueprint('main', __name__)
client = PocketBase('http://127.0.0.1:8090')
user_data = client.collection("users").auth_with_password(
    "users15752", "12345678")

@main.route('/')
def index():    
    return render_template('index.html')

@main.route('/api/reviews', methods=['GET'])
def get_reviews():
    try:
        lat = float(request.args.get('lat'))
        lng = float(request.args.get('lng'))
        radius = float(request.args.get('radius', 10))  # Default to 10km if not provided
        
        # Haversine formula to calculate bounding box
        lat_rad = radians(lat)
        lng_rad = radians(lng)
        earth_radius = 6371  # km
        lat_delta = radius / earth_radius
        lng_delta = asin(sin(lat_delta) / cos(lat_rad))
        
        min_lat = lat - degrees(lat_delta)
        max_lat = lat + degrees(lat_delta)
        min_lng = lng - degrees(lng_delta)
        max_lng = lng + degrees(lng_delta)
        
        reviews = client.collection('reviews').get_list(1, 50, {
            'filter': f'lat >= {min_lat} && lat <= {max_lat} && lng >= {min_lng} && lng <= {max_lng}'
        })

        reviews_list = [{
            "id": item.id,
            "content": item.content,
            "rating": item.rating,
            "lat": item.lat,
            "lng": item.lng,
            "user": item.user,
            "place": item.place,
            "created": str(item.created),
            "updated": str(item.updated)
        } for item in reviews.items]
        
        return jsonify(reviews_list), 200
    except Exception as e:
        print(f"Error in get_reviews: {str(e)}")
        return jsonify({"error": str(e)}), 400

@main.route('/api/review', methods=['POST'])
def add_review():
    try:    
        data = request.json
        print(data)
        review_data = {
            "content": data.get('content'),
            "rating": int(data.get('rating')),
            "lat": float(data.get('lat')),
            "lng": float(data.get('lng')),
            "user": None,
            "place": None
        }
        
        review = client.collection('reviews').create(review_data)
        
        return jsonify({
            "id": review.id,
            "content": review.content,
            "rating": review.rating,
            "lat": review.lat,
            "lng": review.lng,
            "user": review.user,
            "place": review.place,
            "created": str(review.created),
            "updated": str(review.updated)
        }), 201
    except Exception as e:
        print(f"Error in lng: {str(e)}")
        return jsonify({"error": str(e)}), 400

@main.route('/api/review/<review_id>', methods=['GET'])
def get_review(review_id):
    try:
        review = client.collection('reviews').get_one(review_id)
        if review:
            return jsonify({
                "id": review.id,
                "content": review.content,
                "rating": review.rating,
                "lat": review.lat,
                "lng": review.lng,
                "user": review.user,
                "place": review.place,
                "created": str(review.created),
                "updated": str(review.updated)
            }), 200
        else:
            return jsonify({"error": "Review not found"}), 404
    except Exception as e:
        print(f"Error in get_review: {str(e)}")
        return jsonify({"error": str(e)}), 400

@main.route('/components/inline_form', methods=['GET'])
def inline_form():
    # In the future, you can fetch options from the database here
    options = [
        {"value": "5", "label": "👍 Recommend"},
        {"value": "1", "label": "🚫 Avoid"}
    ]
    return render_template('components/inline_form.html', options=options)

@main.route('/components/close_form', methods=['GET'])
def close_form():
    return '', 204  # Return an empty response with a 204 No Content status