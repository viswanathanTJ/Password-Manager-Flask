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
  reg = True
  return render_template('auth.html', reg=reg)

@routes.route('/signin', methods=['GET'])
def register():
  session.clear()
  reg=False
  return render_template('auth.html', reg=reg)

@routes.route('/edit', methods=['GET'])
@login_required
def edit():
  return render_template('edit.html')


# AUTHENTICATION
@routes.route('/user/register', methods=['POST'])
def gotoSignup():
    return AUTH.signup()
    
@routes.route('/user/signout', methods=['GET','POST'])
@login_required
def gotoSignOut():
    session.clear()
    return AUTH.signout()

@routes.route('/user/login', methods=['GET', 'POST'])
def gotoSignIn():
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
def categiries():
    username = session['username']
    return render_template('categories.html', username=username)


@routes.route('/categorieswithprivate/get', methods=['GET', 'POST'])
def classReturnAll():
    return APIs.returnAll()

@routes.route('/logins/save', methods=['POST'])
def classSave():
    return APIs.save()

@routes.route('/logins/<name>', methods=['GET', 'POST'])
def classGetLogin(name):
    return APIs.send_saved(name)

@routes.route('/logins/get', methods=['GET', 'POST'])
def classGetCategories():
    return APIs.get_logins()

@routes.route('/logins/delete/<uid>', methods=['GET', 'POST'])
def deleteLogin(uid):
    return APIs.delete_login(uid)

@routes.route('/categories/get', methods=['GET', 'POST'])
def classGetCategoriesData():
    return APIs.categories_data()

@routes.route('/categories/delete', methods=['GET', 'POST'])
def deleteCategoriesData():
    return APIs.cat_save()

@routes.route('/categories/save/', methods=['GET', 'POST'])
def classCatSave():
    return APIs.cat_save()