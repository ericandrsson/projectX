from flask import Flask
from .config import Config

def create_app():
    app = Flask(__name__, template_folder="public/templates", static_folder="public/static")
    app.config.from_object(Config)
    
    from .routes import main
    app.register_blueprint(main)
    
    return app