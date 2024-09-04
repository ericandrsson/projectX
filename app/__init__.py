from flask import Flask

def create_app():
    app = Flask(__name__, template_folder="public/templates", static_folder="public/static")
    
    from .routes import main
    app.register_blueprint(main)
    
    return app