from functools import wraps
from flask.globals import session
from flask.templating import render_template
from werkzeug.utils import redirect
from pm.api import AUTH, APIs
from flask import Blueprint


routes = Blueprint('api', __name__)

# Decorators
def login_required(f):
  @wraps(f)
  def wrap(*args, **kwargs):
    if 'logged_in' in session:
      return f(*args, **kwargs)
    else:
      return redirect('/')
  
  return wrap

# VIEWS GET
@routes.route('/', methods=['GET'])
def auth():
  session.clear()
  reg = False
  return render_template('auth.html', reg=reg)

@routes.route('/register', methods=['GET'])
def register():
  session.clear()
  reg=True
  return render_template('auth.html', reg=reg)

@routes.route('/edit', methods=['GET', 'POST'])
@login_required
def edit():
  username = session['username']
  return render_template('edit.html', username=username)


# AUTHENTICATION
@routes.route('/user/register', methods=['POST'])
def signup():
    return AUTH.signup()
    
@routes.route('/user/signout', methods=['GET','POST'])
@login_required
def signout():
    session.clear()
    return AUTH.signout()

@routes.route('/user/login', methods=['GET', 'POST'])
def login():
    return AUTH.login()

@routes.route('/user/edit', methods=['GET', 'POST'])
def gotoEdit():
    return AUTH.edit()

# HOME 
@routes.route('/home', methods=['GET'])
@login_required
def home():
    username = session['username']
    return render_template('home.html', username=username)

@routes.route('/categories', methods=['GET', 'POST'])
@login_required
def categories():
    username = session['username']
    return render_template('categories.html', username=username)

@routes.route('/categories/get', methods=['GET', 'POST'])
@routes.route('/categorieswithprivate/get', methods=['GET', 'POST'])
def returnCategories():
    return APIs.returnCategories()

@routes.route('/logins/save', methods=['POST'])
def addLogin():
    return APIs.addLogin()

@routes.route('/logins/<id>', methods=['GET', 'POST'])
def send_saved(id):
    return APIs.send_saved(id)

@routes.route('/logins/get', methods=['GET', 'POST'])
def get_logins():
    return APIs.get_logins()

@routes.route('/logins/delete/<uid>', methods=['GET', 'POST'])
def deleteLogin(uid):
    return APIs.delete_login(uid)


@routes.route('/categories/delete', methods=['GET', 'POST'])
@routes.route('/categories/save/', methods=['GET', 'POST'])
def classCatSave():
    return APIs.category_modify()