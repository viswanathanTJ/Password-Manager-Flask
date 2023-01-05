from flask import Flask, session, redirect
from functools import wraps
from flask.templating import render_template
import pymongo
import os

client = pymongo.MongoClient(os.environ.get('DB_URL'))

def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get("SECRET_KEY")

    from .routes import routes
    app.register_blueprint(routes, url_prefix='/')
    
    return app

