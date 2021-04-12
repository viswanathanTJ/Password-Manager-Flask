from pm import add_login
import bcrypt
from flask import Flask, Blueprint, json, session, redirect, request, jsonify
from functools import wraps
from flask.templating import render_template
from . import categories_skel as categories
from . import client
import pymongo
import uuid


def start_session(username, key):
    session['logged_in'] = True
    session['username'] = username
    session['key'] = str(key)
    return jsonify(username), 200


class AUTH:

    def signup():
        print(request.form)
        # Create the user object
        username = str(request.form.get('username'))
        password = str(request.form.get('password'))
        confirm = str(request.form.get('confirm'))
        # Verify inputs
        if username == "" and password == "" and confirm == "":
            if password != confirm:
                return jsonify({"error": "Password mismatch"}), 400
            return jsonify({"error": "Enter all fields"}), 400
        # Encrypt the password
        passwd = password.encode()
        hashed = bcrypt.hashpw(passwd, bcrypt.gensalt())
        print('Hashed credentials')
        # Check for existing email address
        if username in client.list_database_names():
            return jsonify({"error": "Name already in use"}), 400

        db = client[username]
        collection = db.cred
        print('Connected to Database')
        print('Key is', hashed)
        if collection.insert_one({"password": hashed}):
            collection.insert_one(categories)
            return start_session(username, hashed)

        return jsonify({"error": "Signup failed"}), 400

    def signout():
        session.clear()
        return redirect('/')

    def login():
        username = str(request.form.get('username'))
        password = str(request.form.get('password'))
        # Verify inputs
        if username == "" and password == "":
            return jsonify({"error": "Enter both fields"}), 400

        db = client[username]
        if db:
            print('User exist')
        else:
            print('Not exists')
        print('Connected to Database')
        collection = db.cred
        x = collection.find_one()
        print('Fetched credential')
        hashed = password.encode()
        print('Key is', x['password'])
        if username and bcrypt.checkpw(hashed, x['password']):
            return start_session(username, x['password'])

        return jsonify({"error": "Invalid login credentials"}), 401

    def edit():
        print('Edit working')


class APIs:
    logins = {}
    login_saved = {}

    def getAll():
        db = client[session['username']]
        collection = db.cred
        cursor = collection.find({})
        category = {}
        for i in cursor:
            for x in i:
                category.update(i)
        category.pop('_id')
        category.pop('password')
        return category

    def returnAll():
        category = APIs.getAll()
        return category

    def save():
        data = request.form
        login, show, uid = add_login.add_login(data, str(session['key']))
        print('Printing raw data')
        show.pop('_id')
        APIs.login_saved = show
        print('Saved', APIs.login_saved)
        db = client[session['username']]
        collection = db.db
        x = collection.find_one({'loginId': uid})
        if x:
            collection.update({"loginId": uid}, login)
        else:
            collection.insert_one(login, bypass_document_validation=True)
        return jsonify(uid), 200

    def send_saved(uid):
        print('Sending')
        print(APIs.login_saved)
        category = APIs.getAll()
        logins = {'logins': APIs.login_saved, 'categories': category}
        print('Logins are')
        print(logins)
        return logins

    def get_logins():
        d = request.form
        cat = APIs.getAll()
        try:
            query = d['keyword']
            cid = d['categoryId']
            print(query, cid)
            db = client[session['username']]
            collection = db.db
            login_dict = add_login.get_loginss(collection, session['key'])

            if cid != '0' and not query:
                print('CID executed')
                key = []
                output = []
                logins = login_dict['logins']
                for i in range(0, len(logins)):
                    if logins[i]['loginCategoryId'] == cid:
                        key.append(i)
                for i in key:
                    output.append(logins[i])

                new_dict = {"logins": output,
                            "categories": cat}
                return new_dict

            if query and cid == '0':
                print('Query executed')
                db = client[session['username']]
                collection = db.db
                login_dict = add_login.get_loginss(collection, session['key'])
                logins = login_dict['logins']
                key = []
                output = []
                for i in range(0, len(logins)):
                    if query.lower() in logins[i]['loginName'].lower():
                        key.append(i)
                for i in key:
                    output.append(logins[i])

                new_dict = {"logins": output,
                            "categories": cat}

                return new_dict

            if query and cid != '0':
                print('Both executed')
                db = client[session['username']]
                collection = db.db
                login_dict = add_login.get_loginss(collection, session['key'])
                logins = login_dict['logins']
                key = []
                output = []
                for i in range(0, len(logins)):
                    if query in logins[i]['loginName'].lower() and logins[i]['loginCategoryId'] == cid:
                        key.append(i)
                for i in key:
                    output.append(logins[i])

                new_dict = {"logins": output,
                            "categories": cat}

                return new_dict
        except:
            print('Except error')
        db = client[session['username']]
        collection = db.db
        logins_dict = add_login.get_loginss(collection, session['key'])
        APIs.getAll()
        data = {"categories": cat}
        print(logins_dict)
        if logins_dict:
            data.update(logins_dict)
        print(data)
        return data

    def delete_login(uid):
        db = client[session['username']]
        collection = db.db
        collection.delete_one({'_id': uid})
        return jsonify({})

    def categories_data():
        category = APIs.getAll()
        return category

    def categories_delete():
        d = request.form
        print(d)
        categories = {}
        new_category = {}
        print(len(d))
        length = int((len(d))/3)
        for i in range(0, length):
            index = 'categoryData['+str(i)+'][fieldSorting]'
            cat_index = int(d[index]) + 1
            value = 'categoryData['+str(i)+'][fieldValue]'
            cat_value = d[value]
            new_category['id'] = str(cat_index)
            new_category['sorting'] = str(cat_index)
            print('sort', new_category['sorting'])
            new_category['name'] = cat_value
            print('value', cat_value)
            k = str(i+1)
            categories[k] = new_category
            new_category = {}
        print(categories)
        db = client[session['username']]
        collection = db.cred
        print('Deleting category')
        # categories get do
        collection.find_one_and_delete({}, sort=[('_id', -1)])
        collection.insert_one(categories)
        return jsonify({})

    def cat_save():
        d = request.form
        print(d)
        categories = {}
        new_category = {}
        print(len(d))
        length = int((len(d))/3)
        for i in range(0, length):
            index = 'categoryData['+str(i)+'][fieldSorting]'
            cat_index = int(d[index]) + 1
            value = 'categoryData['+str(i)+'][fieldValue]'
            cat_value = d[value]
            new_category['id'] = str(cat_index)
            new_category['sorting'] = str(cat_index)
            print('sort', new_category['sorting'])
            new_category['name'] = cat_value
            print('value', cat_value)
            k = str(i+1)
            categories[k] = new_category
            new_category = {}
        print(categories)
        db = client[session['username']]
        collection = db.cred
        print('Connected category')
        # categories get do
        collection.find_one_and_delete({}, sort=[('_id', -1)])
        collection.insert_one(categories)

        return jsonify({})
