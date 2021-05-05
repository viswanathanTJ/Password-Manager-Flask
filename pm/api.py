from pm import functions
import bcrypt
from flask import session, redirect, request, jsonify
from . import client
import time


def start_session(username, key):
    session['logged_in'] = True
    session['username'] = username
    session['key'] = str(key)
    return jsonify(username), 200


categories = {
    "1": {
        "id": "1",
        "sorting": "1",
        "name": "General"
    },
    "2": {
        "id": "2",
        "sorting": "2",
        "name": "My Logins"
    }
}


class AUTH:

    def signup():
        print(request.form)
        username = str(request.form.get('username'))
        password = str(request.form.get('password'))
        confirm = str(request.form.get('confirm'))

        if username == "" and password == "" and confirm == "":
            return jsonify({"error": "Enter all fields"}), 400
        if password != confirm:
            return jsonify({"error": "Password mismatch"}), 400

        try:
            if username in client.list_database_names():
                return jsonify({"error": "Name already in use"}), 400
            passwd = password.encode()
            hashed = bcrypt.hashpw(passwd, bcrypt.gensalt())

            db = client[username]
            collection = db.cred

            if collection.insert_one({"password": hashed, "key": hashed}):
                collection.insert_one(categories)
                return start_session(username, hashed)
        except:
            return jsonify({"error": "Some issue at backend"}), 400


        return jsonify({"error": "Signup failed"}), 400

    def signout():
        session.clear()
        return redirect('/')

    def login():
        username = str(request.form.get('username'))
        password = str(request.form.get('password'))
        if username == "" and password == "":
            return jsonify({"error": "Enter both fields"}), 400
        try:
            alldb = client.list_database_names()            
            if username in alldb:
                db = client[username]
                collection = db.cred
                x = collection.find_one()
                
                hashed = password.encode()

                if username and bcrypt.checkpw(hashed, x['password']):
                    return start_session(username, x['key'])

                return jsonify({"error": "Invalid login credentials"}), 401
            else:
                return jsonify({"error": "User not found, try signing up"}), 401
        except:
                return jsonify({"error": "Error at backend"}), 401

    def edit():
        print(request.form)
        d = request.form
        current = d['current']
        password = d['password']
        confirm = d['confirm']

        if password != confirm:
            return jsonify({"error": "Password Mismatch"}), 401
        try:
            alldb = client.list_database_names()     
            username = session['username']     
            if username in alldb:
                db = client[username]
                collection = db.cred
                x = collection.find_one()   
                print(x)             
                hashed = current.encode()
                if username and bcrypt.checkpw(hashed, x['password']):
                    print('success')
                    passwd = password.encode()
                    hashed = bcrypt.hashpw(passwd, bcrypt.gensalt())
                    query = { "_id": x['_id']}
                    new_pass = {"$set":{"password": hashed}}  
                    collection.update_one(query,new_pass)
                    print('success')
                    return jsonify({}), 201
                else:
                    return jsonify({"error": "Current password is wrong"}), 401

        except:
            return jsonify({"error": "Error at backend"}), 401

        # return redirect('/')


class APIs:
    logins = {}
    login_saved = {}

    def getCategories():
        db = client[session['username']]
        collection = db.cred
        cursor = collection.find({})
        categories = {}
        for i in cursor:
            for _ in i:
                categories.update(i)
        categories.pop('_id')
        categories.pop('password')
        categories.pop('key')
        return categories

    def returnCategories():
        return APIs.getCategories()

    def addLogin():
        data = request.form
        login, show, uid = functions.add_login(data, str(session['key']))
        show.pop('_id')
        APIs.login_saved = show
        db = client[session['username']]
        collection = db.db
        x = collection.find_one({'loginId': uid})
        if x:
            collection.update({"loginId": uid}, login)
        else:
            collection.insert_one(login, bypass_document_validation=True)
        return jsonify(uid), 200

    def send_saved(uid):
        logins = {'logins': APIs.login_saved,
                  'categories': APIs.getCategories()}
        print(APIs.login_saved)
        return logins

    def get_logins():
        d = request.form
        cat = APIs.getCategories()
        try:
            query = d['keyword']
            cid = d['categoryId']
            db = client[session['username']]
            collection = db.db
            login_dict = functions.get_loginss(collection, session['key'])

            if cid != '0' and not query:
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
                db = client[session['username']]
                collection = db.db
                login_dict = functions.get_loginss(collection, session['key'])
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
                db = client[session['username']]
                collection = db.db
                login_dict = functions.get_loginss(collection, session['key'])
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
            pass
        db = client[session['username']]
        collection = db.db
        logins_dict = functions.get_loginss(collection, session['key'])
        cat = APIs.getCategories()
        data = {"categories": cat}
        if logins_dict:
            data.update(logins_dict)
        return data

    def delete_login(uid):
        db = client[session['username']]
        collection = db.db
        collection.delete_one({'_id': uid})
        return jsonify({})

    def category_modify():
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
        collection.find_one_and_delete({}, sort=[('_id', -1)])
        collection.insert_one(categories)

        return jsonify({})
