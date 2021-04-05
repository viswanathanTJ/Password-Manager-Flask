/**
 * Helper functions
 */

/**
 * Captilize the first letter in a string
 * Example: mystr = mystr.capitalizeFirstLetter();
 */
 String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

/*==========================================================

Initialization

==========================================================*/

/**
* Activates all inputs and widgets
*/
function init(el) {
if( el == 'undefined' ) {
  el = $('body');
}
// Activate plugins
activateDropdowns(el);
activateSelects(el);
activateTextareas(el);
activateTooltips(el);
setActiveFieldTypes(el);
activateSortable(el);
activateModals(el);
}

function activateDropdowns(el) { 
if( el == 'undefined' ) {
  el = $('body');
}
$('.dropdown-button', el).dropdown();
}

function activateSelects(el) {
if( el == 'undefined' ) {
  el = $('body');
}
$('select', el).not('.disabled').material_select();
}

function activateTextareas() {
Materialize.updateTextFields();
}

function activateTooltips(el) {
if( el == 'undefined' ) {
  el = $('body');
}
$('.tooltipped', el).tooltip({delay: 1000});
}

function activateModals(el) {
if( el == 'undefined' ) {
  el = $('body');
}
$('.modal', el).modal();
}

/**
* Activate sortable fields
*/
function activateSortable(el) {
if( el == 'undefined' ) {
  el = $('body');
}
$('.card-content-inner .fields-wrapper', el).sortable({
  handle: '.reorderHandle',
  animation: 150,
});
}

/**
* Add an "active" class to the current field type switcher option
*/
function setActiveFieldTypes(el) {
if( el == 'undefined' ) {
  el = $('body');
}
$('.field-type-picker', el).each(function() {
  var fieldType = '';
  if( $(this).parent().find('input[type="text"]').length > 0 ) {
    fieldType = 'text';
  } else if( $(this).parent().find('input[type="password"]').length > 0 ) {
    fieldType = 'password';
  } else {
    fieldType = 'textarea';
  }
  $('[data-type="' + fieldType + '"]', this).addClass('active');
});
}

/*==========================================================

Forms 

==========================================================*/

/**
* Set the form state in a card
* 
* @param boolean show set to true to show, false to hide
* @param object element
*/
function setFormState(show, el) {
if( show === true ) {
  // Make title editable
  $('.card-title', el).attr('contentEditable', true);
  // Hide snippet, show edit & delete forms
  $('.snippet', el).velocity('slideUp');
  $('.edit-form', el).velocity('slideDown');
  $('.delete-form', el).velocity('slideUp');
  activateTextareas();
} else {
  // Disable editability
  $('.card-title', el).attr('contentEditable', false);
  // Show snippet, hide edit & delete forms
  $('.snippet', el).velocity('slideDown');
  $('.edit-form', el).velocity('slideUp');
  $('.delete-form', el).velocity('slideUp');
}
}

/**
* Add or remove a loading indicator on a button
*
* @param boolean show set to true to show, false to hide
* @param object element
*/
function setButtonLoadingIndicator(show, el) {
if( show === true ) {
  // Add loading indicator
  var loadingIndicator = $( tmpl('loadingTemplateWhite', {}) );
  el.append( loadingIndicator ).addClass('expanded');
} else {
  // Remove loading indicator
  $('.preloader-wrapper', el).remove();
  el.removeClass('expanded');
}
}

/*==========================================================

Item Lists 

==========================================================*/

/**
* Get Item data in JSON format
*
* @param string itemType
* @param string csrf the CSRF security token
* @return object on success, boolean (false) on failure
*/

function getItemJSON(itemType, csrf, callback) {
var data = {};
var endpoint = itemType + '/get';

// Special endpoint for edit account mode
if( PassHub.mode == 'edit-account' ) {
    endpoint = 'edit-account/get';
}

$.post(baseUrl + '/' + endpoint, {csrf: csrf}, function(data) { 
  // Convert data string to JSON object
  var editedData = {};
  switch( itemType ) {
    case 'users':
      // Store groups and users for user-related pages
      editedData['groups'] = data.groups;
      editedData['users'] = data.users;
      break;
    case 'groups':
      // Store groups and users for user-related pages
      editedData['groups'] = data.groups;
      editedData['pages'] = data.pages;
      editedData['categories'] = data['categories'];
      editedData['permissions'] = data.permissions;
      break;
    default:
      // Store single array for other pages
      editedData[itemType] = data;
  }
  callback(editedData);
})
  .fail(function() {
    data = false;
    callback(data);
  });
}

/**
* Display items on the page
*
* @param string itemType
* @param boolean useTransition transition content or refresh instantly
* @param object data to pass to the template
*/

function showItems(itemType, useTransition, data) {
  if( data === false ) {
    console.log('failed to load ' + itemType);
    $('.itemsList').html('');
    Materialize.toast(language.notification_negative + ' ' + itemType + ' ' + language.notification_found_verb, 4000);
  } else {
    // Insert template with data
    var template = tmpl(itemType + 'Template', data);
    // Find the right container and insert the HTML
    if( $('.itemsList .card-content-inner').length > 0 ) {
      $('.itemsList .card-content-inner').html( template );
    } else {
      $('.itemsList').html( template );  
    }
    // Show new data
    if( useTransition === true) {
      // Transition in
      $('.itemsList')
        .hide()
        .delay(100)
        .velocity("transition.slideUpIn");
    } else {
      // Instant refresh
      $('.itemsList').show();
    }
    // Initialize controls
    init( $('.itemsList') );
  }
}

/**
* Delete an item (login or user)
*
* @param string type
*/
function deleteItem(type) {
type = typeof type !== 'undefined' ? type : false;
if(type) {
  var noun;
  switch(type) {
    case 'logins':
      noun = 'login';
      break;
    case 'users':
      noun = 'user';
      break;
    case 'edit-account':
      noun = 'user';
      break;
  }

  $('body').on('click', '.itemSingle .btnDelete', function(e) {
    e.preventDefault();
    var el = $(this).closest('.itemSingle'),
        id = el.attr('data-' + noun + '-id');

    // If type is "user", double confirm deleting if there's only 1 user
    if( type == 'users' && $('.itemSingle').length === 1 ) {
      if( ! confirm(language.notification_delete_last_user_confirm)) {
        return false;
      }
    }

    // If the item is new and hasn't been saved yet, just remove it from DOM
    if( id == '' ) {
      el.remove();
      Materialize.toast( titleize(noun) + ' ' + language.notification_delete_past_tense, 4000 );
    } else {
      $.post(baseUrl + '/' + type + '/delete/' + id, {csrf: csrf}, function() { 
        if( type == 'edit-account' ) {
          // account is deleted, redirect to log out
          window.location.replace(baseUrl + '/auth/logout');
          return false;
        }
        el.remove();
        Materialize.toast( titleize(noun) + ' ' + language.notification_delete_past_tense, 4000 );
      })
        .fail(function(jqxhr) {
          var error = '';
          if(jqxhr.responseText != '') {
            error = jqxhr.responseText;
          } else {
            error = language.notification_delete_failed + ' ' + noun;
          }
          Materialize.toast(error, 4000);
        });       
    }
  });
}
}

/*==========================================================

Logins 

==========================================================*/

/**
* Get and display list of logins
*/
function showLogins(searchMode) {
// If searchMode is not provided as a parameter, set default value of false
searchMode = typeof searchMode !== 'undefined' ? searchMode : false; 

var params = {};

// Focus search field
if( searchMode === false) {
  setTimeout(function(){
    $('#search').focus();
  }, 0);     
}

// Prepare search parameters
if(searchMode === true) {  
  params = {
    keyword: $('#search').val(),
    categoryId: $('#category').val(),
  };
}

// Add CSRF to parameters
$.extend(params);

// Get logins, add to DOM, and transition in
var jqxhr = $.post(baseUrl + '/logins/get', params, function(data) { 
  // Convert data string to JSON object
  console.log(params);
  categories = data['categories'];

  // Logins found, insert them
  if( 
    data['logins'] !== 'undefined' 
    && Object.size(data.logins) > 0
  ) {

    // Insert template with data
    var template = tmpl('loginsTemplate', data);
    $('#loginsList').html( template );

    // Remove search indicator
    if(searchMode === true) {      
      $('#loginsList').removeClass('loading');
    } else {
      // Transition in logins
      $('.loginSingle')
        .hide()
        .delay(100)
        .velocity("transition.slideUpIn", { drag: true });
    }

    // Init handlers for logins
    init( $('#loginsList') );

  } else {
    // Logins were not returned, show status message
    if(searchMode === true) {
      // No Matches  
      $('#loginsList').html('<p class="center-align">' + language.search_no_match + '</p>');
      if( $('#search').val() != '' ) {
        $('#loginsList p').append(' ' + language.search_for + ' "' + $('#search').val() + '"');
      }
      $('#loginsList p').append(' ' + language.search_in + ' ' + $('#category option:selected').text());
    } else {
      Materialize.toast(language.notification_no_logins, 4000);
    }
  }

})
  .fail(function(jqxhr) {
    var message = '';
    // Clear logins wrapper
    $('#loginsList').html('');
    // Determine the type of error
    if(jqxhr.status == '401') {
      // Access denied
      message = language.notification_no_access;
    } else {
      // Generic "failed to load"
      message = language.notification_logins_load_failed;
    }
    // Add message
    $('#loginsList').html('<p class="center-align">' + message + '</p>');
  });
}

/**
* Refresh login contents
*/
function refreshLogin(loginEl) {
var jqxhr = $.post(baseUrl + '/logins/' + loginEl.attr('data-login-id'), {csrf: csrf}, function(data) { 
  // rename logins to login for template
  data = {
    login: data['logins'],
    categories: data['categories']
  };

  // Insert template with data
  var template = $( tmpl('loginContentTemplate', data) );
  // Replace old content
  $('.card-content-inner', loginEl).html(template);            
  // Show edit form/hide snippet
  $('.snippet', loginEl).hide();
  $('.edit-form', loginEl).show();
  // Reactivate plugins
  activateSelects(loginEl);
  activateTooltips(loginEl);
  setActiveFieldTypes(loginEl);
  activateSortable(loginEl);
})
  .fail(function() {
    console.log('failed to refresh login');
  });
}

/*==========================================================

Users 

==========================================================*/

function refreshUser(itemEl) {
var jqxhr = $.post(baseUrl + '/users/' + itemEl.attr('data-user-id'), {csrf: csrf}, function(data) { 
  // Convert data string to JSON object
  data = JSON.parse(data);

  // rename for template
  data = {
    user: data.users[0],
    groups: data.groups
  };

  // Insert template with data
  var template = $( tmpl('userContentTemplate', data) );
  // Replace old content
  $('.card-content-inner', itemEl).html(template);            
  // Show edit form/hide snippet
  $('.snippet', itemEl).hide();
  $('.edit-form', itemEl).show();
  // Reactivate plugins
  init(itemEl);
})
  .fail(function() {
    console.log('failed to refresh user');
  });
}

/*==========================================================

Categories 

==========================================================*/

/**
* Submit new/updated categories data with AJAX
* 
* @param array fieldData
* @param string csrf the CSRF security token
* @param object save button DOM element
* @return jQuery XHR object
*/
function saveCategories(fieldData, csrf, saveButtonEl) {
var jqxhr = $.post(baseUrl + '/categories/save/', {categoryData: fieldData, csrf: csrf}, function(data) { 
  Materialize.toast(language.notification_categories_saved, 4000);
})
  .always(function() {
    // Save button return to normal state
    setButtonLoadingIndicator(false, saveButtonEl);
    // Get new data (including any new database IDs)
    getItemJSON('categories', csrf, function(data) {
      showItems('categories', false, data); // Refresh page content
    });
  })
  .fail(function() {
    console.log(jqxhr.statusText);
    if(jqxhr.responseText != '') {
      PassHub.error = jqxhr.responseText;
    } else {
      PassHub.error = language.notification_categories_save_failed;
    }
    Materialize.toast(PassHub.error, 4000);
  });

return jqxhr;
}
