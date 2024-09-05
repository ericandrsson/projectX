import requests
from flask import current_app
from pocketbase import PocketBase

class PocketBaseClient:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = PocketBase(current_app.config['POCKETBASE_URL'])
            cls.ping()
        return cls._instance

    @classmethod
    def ping(cls):
        try:
            response = requests.get(f"{current_app.config['POCKETBASE_URL']}/api/health")
            response.raise_for_status()
            if response.json().get('code') != 200:
                raise ConnectionError("PocketBase health check failed")
        except requests.RequestException as e:
            raise ConnectionError(f"Failed to connect to PocketBase: {str(e)}")

def get_pb_client():
    return PocketBaseClient.get_instance()