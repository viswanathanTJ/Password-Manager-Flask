from flask import Flask, session, redirect
from functools import wraps
from flask.templating import render_template
import pymongo

client = pymongo.MongoClient("mongodb+srv://viswa:5900@cluster0.pbyko.mongodb.net/test?retryWrites=true&w=majority")

def create_app():
    app = Flask(__name__)
    app.secret_key = b'\xcc^\x91\xea\x17-\xd0W\x03\xa7\xf8J0\xac8\xc5'

    from .routes import routes
    app.register_blueprint(routes, url_prefix='/')
    
    return app

