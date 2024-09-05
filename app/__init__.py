from flask import Flask
from .config import Config
from .pocketbase_client import PocketBaseClient, get_pb_client

def create_app():
    app = Flask(__name__, template_folder="public/templates", static_folder="public/static")
    app.config.from_object(Config)
    
    with app.app_context():
        try:
            PocketBaseClient.ping()
        except ConnectionError as e:
            app.logger.error(f"Failed to connect to PocketBase: {str(e)}")
            raise
    
    from .routes import main
    app.register_blueprint(main)
    
    return app