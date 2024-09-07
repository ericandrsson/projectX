from flask import Blueprint, jsonify, request
from .pocketbase_client import get_pb_client
from .utils import pb_to_dict
from math import radians, degrees, cos, sin, asin, sqrt

api = Blueprint('api', __name__)

@api.route('/reviews', methods=['GET', 'POST'])
def reviews():
    pb = get_pb_client()
    if request.method == 'GET':
        place_id = request.args.get('place')
        if not place_id:
            return jsonify({'error': 'Place ID is required'}), 400

        try:
            result = pb.collection('reviews').get_list(
                query_params={
                    'filter': f'place = "{place_id}"',
                    'sort': '-created',
                    'expand': 'place'
                }
            )
            print(result.items)
            return jsonify([pb_to_dict(item) for item in result.items]), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        # Add a new review
        data = request.json
        try:
            record = pb.collection('reviews').create(data)
            return jsonify(record.model_dump()), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@api.route('/reviews/<review_id>', methods=['GET', 'PUT', 'DELETE'])
def review(review_id):
    pb = get_pb_client()
    if request.method == 'GET':
        # Get a specific review
        try:
            record = pb.collection('reviews').get_one(review_id)
            return jsonify(record.model_dump()), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 404
    
    elif request.method == 'PUT':
        # Update a review
        data = request.json
        try:
            record = pb.collection('reviews').update(review_id, data)
            return jsonify(record.model_dump()), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        # Delete a review
        try:
            pb.collection('reviews').delete(review_id)
            return '', 204
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@api.route('/places', methods=['GET', 'POST'])
def places():
    pb = get_pb_client()
    if request.method == 'GET':
        name = request.args.get('name')
        if name:
            try:
                place = pb.collection('places').get_first_list_item(f'name="{name}"')
                return jsonify(pb_to_dict(place)), 200
            except Exception as e:
                return jsonify({'error': str(e)}), 404

        lat = request.args.get('lat')
        lng = request.args.get('lng')

        if lat and lng:
            lat = float(lat)
            lng = float(lng)
            radius = float(request.args.get('radius', 1000))  # Default radius: 1000 meters
            filter_str = f'haversine_distance({lat}, {lng}, lat, lng) <= {radius}'
            
            try:
                result = pb.collection('places').get_list(
                    query_params={
                        'filter': filter_str,
                        'sort': '-created'
                    }
                )
                return jsonify([pb_to_dict(item) for item in result.items]), 200
            except Exception as e:
                return jsonify({'error': str(e)}), 500

        return jsonify({'error': 'No latitude or longitude provided'}), 400
    
    elif request.method == 'POST':
        # Add a new place
        data = request.json
        try:
            record = pb.collection('places').create(data)
            return jsonify(pb_to_dict(record)), 201
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@api.route('/places/<place_id>', methods=['GET', 'PUT', 'DELETE'])
def place(place_id):
    pb = get_pb_client()
    if request.method == 'GET':
        # Get a specific place
        try:
            record = pb.collection('places').get_one(place_id)
            return jsonify(pb_to_dict(record)), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 404
    
    elif request.method == 'PUT':
        # Update a place
        data = request.json
        try:
            record = pb.collection('places').update(place_id, data)
            return jsonify(pb_to_dict(record)), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        # Delete a place
        try:
            pb.collection('places').delete(place_id)
            return '', 204
        except Exception as e:
            return jsonify({'error': str(e)}), 500