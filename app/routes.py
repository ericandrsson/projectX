from flask import Blueprint, render_template, abort
from .pocketbase_client import get_pb_client

main = Blueprint('main', __name__)

@main.route('/')
def index():    
    return render_template('index.html')

@main.route("/<place_name>")
def place(place_name):
    return render_template('place.html')


@main.route('/components/inline_form', methods=['GET'])
def inline_form():
    options = [
        {"value": "5", "label": "👍 Recommend"},
        {"value": "1", "label": "🚫 Avoid"}
    ]
    return render_template('components/inline_form.html', options=options)

@main.route('/components/close_form', methods=['GET'])
def close_form():
    return '', 204  # Return an empty response with a 204 No Content status