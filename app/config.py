import os

class Config:
    SECRET_KEY = 'your-secret-key'  # Change this to a random secret key
    POCKETBASE_URL = os.getenv('POCKETBASE_URL', 'http://localhost:8090')
    # Add other configuration settings as needed