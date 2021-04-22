var PassHub             = {} // Global object
PassHub.baseUrl         = baseUrl;
PassHub.csrf            = csrf;
PassHub.permissionTypes = ['read', 'create', 'edit', 'delete'];
PassHub.error           = '';
PassHub.settings        = settings;

jQuery(function($){

  // Detect current mode
  PassHub.mode = $('body').attr('data-mode');

  // Activate mobile nav
  $('.button-collapse').sideNav({
      edge: 'right', // Choose the horizontal origin
  });
  // Close mobile nav when clicking away from it
  $('body').on('click', '.drag-target', function() { 
    $('.button-collapse').sideNav('hide');
  });

  // Run init function (except for authorization pages)
  if( PassHub.mode !== 'auth' ) {
    init();
    // Transition in common elements (if not already visible)
    if( $('nav').not(':visible') ) {
      $('nav').velocity("transition.fadeIn");
      $('.fixed-action-btn').delay(300).velocity("transition.expandIn");
    }
  }

  /**
   * Context buttons
   */ 
  $('body').on('click', '.itemSingle .btnContext', function(e) {
    e.preventDefault();
    var itemEl = $(this).closest('.itemSingle');
    var action = $(this).attr('data-action');
    switch(action) {
      case 'edit':
        setFormState(true, itemEl);
        break;
      case 'delete':
        $('.card-title', itemEl).attr('contenteditable', false);
        $('.snippet', itemEl).velocity('slideUp');
        $('.edit-form', itemEl).velocity('slideUp');
        $('.delete-form', itemEl).velocity('slideDown');
        break; 
    }
  });

  /**
   * Cancel edit/delete
   */
  $('body').on('click', '.itemSingle .btnCancel', function(e) {
    e.preventDefault();
    var itemEl = $(this).closest('.itemSingle');
    setFormState(false, itemEl);
  });

  // Fields IDs to delete
  // that's processed when user hits Save
  // then is cleared out
  var deleteFieldsQueue = [];
  // The category ID related to the fields in deleteFieldsQueue
  var fieldCategory = 0;

  // Select editable card title on click
  $('body').on('click', '.card-title[contenteditable="true"]', function() { 
    selectText ($(this) );
  });

  // Select editable label on click
  $('body').on('click', 'label[contenteditable="true"]', function() { 
    selectText ($(this) );
  });
  
  // =============================================================================================
  // Auth page
  // =============================================================================================

  if( PassHub.mode == 'auth' ) {
    
    // Sign in
    // -----------------------------------
    $('button').on('click', function() {
      var text = $(this).text();
      // Make disabled
      $(this).prop('disabled', true);
      // Update status
      $(this).text(text + '...');
      // Remove any extra indicators
      $('.preloader-wrapper').remove();
      // Insert loading indicator
      setButtonLoadingIndicator(true, $(this));
      // Submit the form
      $('form').submit();
    });

  }

  // =============================================================================================
  // Logins page
  // =============================================================================================

  if( PassHub.mode == 'logins' ) {

    var categories = [];

    // Get categories and store them in the global PassHub object
    getItemJSON('categorieswithprivate', PassHub.csrf, function(data) { 
      if( data === false ) {
        // error
        Materialize.toast(language.notification_no_categories_found, 4000);
      } else {
        // success
        data = { categories: data.categorieswithprivate }; // Rename key to "categories"
        PassHub.categories = data.categories; // Store categories in global object
        $('#searchForm').prepend( $(tmpl('searchTemplate', data)) ); // Insert search template
        init( $('#searchForm') );
        $('#searchForm').velocity("transition.slideUpIn", "easeOutExpo"); // Transition in search form
        showLogins();
      }
    });

    // Field action buttons
    // -----------------------------------                      
    $('body').on('click', '.itemSingle .actions button', function(e) {
      e.preventDefault();
      var itemEl = $(this).closest('.input-field');
      var action = $(this).attr('data-action');
      switch(action) {
        case 'addField':
          // Get field template 
          // and append to DOM
          dataObject = {
            fields: [{
              fieldIndex: '',
              fieldType: 'text',
              fieldName: 'New Field',
              fieldValue: ''
            }]
          };
          var template = $(tmpl('fieldTemplate', dataObject));
          template.insertAfter(itemEl);
          $('a[data-type="text"]', template).addClass('active');
          init(template);
          break;
        case 'deleteField':
          // Store field IDs to delete 
          // for later when user clicks save
          var fieldIndex = itemEl.attr('data-field-index');
          var categoryId = itemEl.closest('form').find('[name="category"]').val(); // Get the category from the select element
          if( fieldIndex != '' ) {
            deleteFieldsQueue.push(fieldIndex);
            fieldCategory = categoryId;
          }
          // Remove field from DOM
          itemEl.remove();
          // Clear out active tooltips
          $('.material-tooltip').remove();
          // Re-activate tooltips
          activateTooltips();
          break;
        case 'showPassword':
          // Toggle input type to text to reveal password
          var newType = '';
          if( $('input', itemEl).attr('type') == 'password' ) {
            newType = 'text';
          } else {
            newType = 'password';
          }
          $('input', itemEl).attr('type', newType);
          break;
        case 'generatePassword':
          // generate new password
          var hdl = new Jen(true);
          var password = hdl.password(10, 10);
          // put it in the field
          $('input', itemEl).val(password);
          // show it
          $('input', itemEl).attr('type', 'text');
          // focus the field
          $('input', itemEl).focus();
          break; 
      }
    });

    // Save changes
    // -----------------------------------
    $('body').on('click', '.loginSingle .btnSave', function(e) {
      e.preventDefault();
      var loginEl = $(this).closest('.loginSingle'),
          cardContentInnerEl = $('.card-content-inner', loginEl),
          saveButtonEl = $(this),
          loginData = {},
          fieldData = [];

      // Set login settings
      loginData = {
        loginId: loginEl.attr('data-login-id'),
        loginName: $('.card-title', loginEl).text(),
        loginCategoryId: $('option:selected', loginEl).val()
      };

      // Build list of fields and their settings
      $('.input-field', loginEl).each(function() {
        // Set field type and value
        var fieldType = '';
        var fieldValue = '';
        if( $('select', this).length > 0 ) {
          // select
          // skip category <select>
          return true;
        } else if( 
            $('input', this).length > 0 
            && $('[data-action="showPassword"]', this).length > 0
          ) {
          // password
          fieldType = 'password';
          fieldValue = $('input', this).val();
        } else if( $('input', this).length > 0 ) {
          // text
          fieldType = $('input', this).attr('type');
          fieldValue = $('input', this).val();
        } else if( $('textarea', this) ) {
          // textarea
          fieldType = 'textarea';
          fieldValue = $('textarea', this).val();
        }
        // Add field object
        fieldData.push({
          fieldIndex: $(this).attr('data-field-index'),
          fieldSorting: $(this).index(),
          fieldType: fieldType,
          fieldName: $('label', this).text(),
          fieldValue: fieldValue
        });
      });
      
      // If no fields exist, add a blank one
      if( $('.input-field', loginEl).length === 0 ) {
        fieldData.push({
          fieldIndex: '',
          fieldSorting: '',
          fieldType: 'text',
          fieldName: 'new-field',
          fieldValue: ''
        });
      }

      // Insert loading indicator
      setButtonLoadingIndicator(true, saveButtonEl);

      // Submit new/updated field data with AJAX
      // returns loginId
      var jqxhr = $.post(baseUrl + '/logins/save', {loginData: loginData, fieldData: fieldData}, function(data) { 
        // Set login-id on element in case it's a new login that doesn't have ID filled in yet
        loginEl.attr('data-login-id', data);
        
        Materialize.toast(language.notification_login_saved, 4000);
      })
        .always(function() {
          // Save button return to normal state
          setButtonLoadingIndicator(false, saveButtonEl);
        })
        .fail(function(jqxhr) {
          console.log(jqxhr.statusText);
          if(jqxhr.responseText != '') {
            PassHub.error = jqxhr.responseText;
          } else {
            PassHub.error = language.notification_login_save_failed;
          }
          Materialize.toast(PassHub.error, 4000);
        });

      // Process fields to delete
      if(deleteFieldsQueue.length > 0) {
        var jqxhr2 = $.post(
          baseUrl + '/fields/delete', 
          {deleteFieldsQueue: deleteFieldsQueue, fieldCategory: fieldCategory, csrf: PassHub.csrf}, 
          function() {})
            .always(function() {
              // Clear delete queue
              deleteFieldsQueue = [];
            })
            .fail(function(jqxhr2) {
              Materialize.toast(language.notification_fields_delete_failed, 4000);
            });
      }

      // Refresh login once both AJAX requests are done
      // Necessary to grab up-to-date IDs/data from the database
      $.when(jqxhr, jqxhr2).done(function() { 
        refreshLogin(loginEl);
      });

    });
   
    // Add login
    // -----------------------------------
    $('#btnAddLogin').on('click', function(e) {
      e.preventDefault();

      // Remove search state if applied
      $('#loginsList').removeClass('loading');
      $('#loginsList > p').remove();

      // Prepare blank fields
      data = { 
        logins: {
          1: {
            loginId: "",
            loginCategoryId: "1",
            loginName: "Untitled",
            fields: {
              1: {
                fieldId: "",
                fieldName: "username",
                fieldType: "text",
                fieldValue: ""
              },
              2: {
                fieldId: "",
                fieldName: "password",
                fieldType: "password",
                fieldValue: ""
              }
            }
          }
        },
        categories: PassHub.categories 
      };

      // Insert HTML template with data
      var template = $(tmpl('loginsTemplate', data));
      $('#loginsList').prepend( template );

      // Switch to edit mode
      setFormState(true, template);

      // Transition in
      template
        .hide()
        .delay(100)
        .velocity("transition.slideUpIn", "easeOutExpo");

      // Reactivate plugins
      init(template);

    });

    // Delete login
    // -----------------------------------
    deleteItem('logins');

    // Fields
    // -----------------------------------

    // Field type picker
    
    $('body').on('click', '.field-type-picker a', function(e) {
      e.preventDefault();

      var fieldEl   = $(this).closest('.input-field');
      var fieldIndex = fieldEl.attr('data-field-index'),
          fieldType = $(this).attr('data-type'),
          fieldName = $('label', fieldEl).text(),
          fieldValue= '';

      // Value
      if( $('input', fieldEl).length > 0 ) {
        fieldValue = $('input', fieldEl).val();
      } else {
        fieldValue = $('textarea', fieldEl).val();
      }
      // Switch to selected field 
      
      // Prepare data for template
      dataObject = {
        fields: [{
          fieldId: fieldIndex,
          fieldType: fieldType,
          fieldName: fieldName,
          fieldValue: fieldValue
        }]
      };

      // Update template
      var template = $(tmpl('fieldTemplate', dataObject));
      // Update DOM
      template.insertAfter(fieldEl);
      fieldEl.remove();
      // Update field picker nav
      $( 'a', template ).removeClass('active');
      $( 'a[data-type="' + fieldType + '"]', template ).addClass('active');
      // Re-activate tooltips & textareas
      activateTooltips(template);
      activateTextareas();
    });

    // Search
    // -----------------------------------
    function searchLogins() {
      $('#loginsList').addClass('loading');
      showLogins(true);
    }

    // Search logins when characters are typed into the text field
    // Throttled at 300ms/call to avoid overloading the server
    $('body').on('keyup', '#search', _.throttle(function() { 
      searchLogins();
    }, 300));

    // Search logins when category dropdown is updated
    $("body").on("change", "#category", function() { 
      $('#loginsList').addClass('loading');
      showLogins(true);
    });

    // Copy to clipboard (modern browsers)
    // -----------------------------------
    $('body').on('click', '.snippet .copy-button', function(e) {
      e.preventDefault();
      clip( $(this).attr('data-clipboard-text') );
      Materialize.toast(language.notification_copied, 4000);
    });

    // Snippet toggle showing password
    $('body').on('click', '.snippet [data-action="showPassword"]', function(e) { 
      e.preventDefault();
      var text = $(this).prev().attr('data-clipboard-text');
      // toggle state
      if( $(this).attr('data-state') != 'toggled' ) {
        // turn on
        $(this).attr('data-state', 'toggled');
        
        // Switch element type from link to span
        // Fixes Android issue of not being able to copy link text
        $(this).prev().changeElementType('span');

        $(this).prev().attr('contenteditable', true);
        $(this).prev().text(text);
        $(this).text('hide');
        // select text
        selectText($(this).prev());
      } else {
        // turn off
        $(this).attr('data-state', '');
        $(this).prev().changeElementType('a');
        $(this).prev().attr('contenteditable', false);
        $(this).prev().html( passwordMask(text) );
        // Activate clipboard for password field
        $(this).text('show');
      }     
    });

    // Snippet toggle selecting text
    $('body').on('click', '.snippet [data-action="select"]', function(e) { 
      e.preventDefault();
      var text = $(this).prev().attr('data-clipboard-text');
      $(this).prev().attr('contenteditable', true);
      $(this).prev().text(text);
      // select text
      selectText($(this).prev());
    });

  } // end logins page

  // =============================================================================================
  // Categories page
  // =============================================================================================
  
  if( PassHub.mode == 'categories' ) {

    // Transition in title
    $('#title').velocity("transition.slideUpIn", "easeOutExpo");

    // Get data and show page content
    getItemJSON('categories', PassHub.csrf, function(data) {
      showItems('categories', true, data); // Show page content
    });

    // Store queue of categories to delete
    // that's processed when user hits Save
    // then is cleared out
    var deleteCategoriesQueue = [];

    // Field action buttons
                            
    $('body').on('click', '.input-field .actions button', function(e) {
      e.preventDefault();
      var fieldEl = $(this).closest('.input-field');
      var action = $(this).attr('data-action');
      switch(action) {
        case 'addCategory':
          // Get field template 
          // and append to DOM
          dataObject = {
            categories: [{
              index: '',
              name: '',
            }]
          };
          var template = $(tmpl('fieldTemplate', dataObject));
          template.insertAfter(fieldEl);
          break;
        case 'deleteCategory':
          // Store field IDs to delete 
          // for later when user clicks save
          var fieldIndex = fieldEl.attr('data-category-index');
          if( fieldIndex != '' ) {
            deleteCategoriesQueue.push(fieldIndex);
          }
          // Remove field from DOM
          fieldEl.remove();
          break;
      }
      // Clear out active tooltips
      $('.material-tooltip').remove();
      // Re-initialize tooltips
      activateTooltips();
    });

    // Save changes
    // -----------------------------------
    $('body').on('click', '.btnSave', function(e) {
      e.preventDefault();
      var cardContentInnerEl = $('.card-content-inner'),
          saveButtonEl = $(this),
          fieldData = [];

      // Build list of fields and their settings
      $('.input-field', cardContentInnerEl).each(function() {
        // Add field object
        fieldData.push({
          fieldIndex: $(this).attr('data-category-index'),
          fieldSorting: $(this).index(),
          fieldValue: $('input', this).val(),
        });
      });

      // Insert loading indicator
      setButtonLoadingIndicator(true, saveButtonEl);

      // Process categories to delete
      if( deleteCategoriesQueue.length > 0 ) {
        var jqxhr = $.post(baseUrl + '/categories/delete', {deleteCategoriesQueue: deleteCategoriesQueue, csrf: PassHub.csrf}, function() { 
        })
          .always(function() {
            // Clear delete queue
            deleteCategoriesQueue = [];
          })
          .fail(function() {            
            console.log(jqxhr.statusText);
            if(jqxhr.responseText != '') {
              PassHub.error = jqxhr.responseText;
            } else {
              PassHub.error = language.notification_categories_delete_failed;
            }
            Materialize.toast(PassHub.error, 4000);
            // Stop save execution here if delete failed.
            // Continuing to the save AJAX request below
            // would introduce sorting problems.
            if(PassHub.error != '') {
              // Save button return to normal state
              setButtonLoadingIndicator(false, saveButtonEl);
              // Refresh page content
              getItemJSON('categories', PassHub.csrf, function(data) {
                showItems('categories', false, data); 
              });
              // Stop execution
              return false;  
            }
          });
      }

      // If the delete categories request is running, wait until it's done
      if( deleteCategoriesQueue.length > 0 ) {
        $.when(jqxhr).done(function() { 
          saveCategories(fieldData, PassHub.csrf, saveButtonEl);
        });
      } else {
        // If it never ran, continue on without waiting
        saveCategories(fieldData, PassHub.csrf, saveButtonEl);
      }

    });

  } // end categories page

  // =============================================================================================
  // Groups page
  // =============================================================================================
  
  if( PassHub.mode == 'groups' ) {

    // Transition in title
    $('#title').velocity("transition.slideUpIn", "easeOutExpo");

    // Get data and show page content
    getItemJSON('groups', PassHub.csrf, function(data) {
      /* 
      Pre-preocess categories to sort by "sorting" numbers.
      */
      sortedCategories = {};
      $.each( data.categories, function( key, category ) {
        sortedCategories[category.sorting] = category; 
      });

      PassHub.pages       = data.pages;
      PassHub.categories  = sortedCategories;

      showItems('groups', true, data); // Show page content
    });

    // Store queue of items to delete
    // that's processed when user hits Save
    // then is cleared out
    var deleteItemsQueue = [];

    // Field action buttons
    // -----------------------------------
    $('body').on('click', '.input-field .actions button', function(e) {
      e.preventDefault();
      var fieldEl = $(this).closest('.input-field');
      var action = $(this).attr('data-action');
      switch(action) {
        case 'toggleSettings':
          var settingsContainer = fieldEl.find('.settings-container');
          if(settingsContainer.is(":visible")) {
            settingsContainer.velocity("slideUp", "easeOutExpo");  
          } else {
            settingsContainer.velocity("slideDown", "easeOutExpo");
          }
          break;
        case 'addGroup':
          // Get field template 
          // and append to DOM
          dataObject = {
            groups: [{
              id: '',
              name: '',
            }],
            permissions: [],
            pages:       PassHub.pages, 
            categories:  PassHub.categories
          };
          var template = $(tmpl('fieldTemplate', dataObject));
          template.insertAfter(fieldEl);
          init(template);
          break;
        case 'deleteGroup':
          var itemIndex = parseInt(fieldEl.attr('data-item-index')); // Will result in NaN if no index is set
          // Prevent deleting default admin and user groups
          if(itemIndex <= 2 && isNaN(itemIndex) === false) {
            Materialize.toast(language.notification_wont_delete_admin, 4000);
            break;
          }
          // Confirm action if the group exists in the database (has an ID/index)
          if(isNaN(itemIndex) === false) {
            if( ! confirm(language.notification_group_delete_confirm)) {
              break;
            }
            // Instruct user what to do to finalize the deletion and cleanup affected users.
            var groupName = $('.name-field', fieldEl).val();
            Materialize.toast( language.notification_definite_article + ' "' + groupName + '" ' + language.notification_group_delete_info, 8000);  
            // Store field IDs to delete for later when user clicks save
            deleteItemsQueue.push(itemIndex);
          }
          // Remove field from DOM
          fieldEl.remove();
          break;
      }
      // Clear out active tooltips
      $('.material-tooltip').remove();
      // Re-initialize tooltips
      activateTooltips();
    });

    // Mark changed (aka "dirty") checkboxes
    // -----------------------------------
    $('body').on('click', '.settings-container input[type="checkbox"]', function() { 
      $(this).addClass('dirty-checkbox');
    });

    // Save changes
    // -----------------------------------
    $('body').on('click', '.btnSave', function(e) {
      e.preventDefault();
      var cardContentInnerEl = $('.card-content-inner'),
          saveButtonEl = $(this),
          saveData = {
            groups: { 'add': [], 'delete': deleteItemsQueue },
            groupPermissions: []
          };

      // Insert loading indicator
      setButtonLoadingIndicator(true, saveButtonEl);

      // Store each group's permissions
      $('.input-field', cardContentInnerEl).each(function() {
        // Add field object
        var permissions = {};
        // Set ID and Name
        permissions['id'] = $(this).attr('data-item-index');
        permissions['name'] = $('input[type="text"]', this).val();
        // Create placeholders for the resources
        permissions['types'] = {};
        permissions['types']['page'] = {};
        permissions['types']['category'] = {};
        // Store any changed permissions
        $('.dirty-checkbox', this).each(function() { 
          var permissionType = $(this).attr('data-type');
          var resourceType   = $(this).attr('data-resource');
          var resourceId     = $(this).closest('tr').attr('data-resource-id');
          var checked        = $(this).is(':checked');
          // Create object for the permission if not already present
          if(typeof permissions['types'][resourceType][resourceId] === 'undefined') {
            permissions['types'][resourceType][resourceId] = {};
          }
          // Store permission
          permissions['types'][resourceType][resourceId][permissionType] = checked;
        });
        // Push the group's changed permissions
        saveData.groupPermissions.push(permissions);
      });

      // Store new groups
      $('.input-field', cardContentInnerEl).each(function() {
        // Detect if it's a new group
        var itemIndex = $(this).attr('data-item-index');
        var isNewGroup = $(this).attr('data-new-group');
        var name = $('.name-field', this).val();
        if(isNewGroup == 'true' || itemIndex == 'undefined' || itemIndex == '0' || itemIndex == '') {
          saveData.groups.add.push({'id': itemIndex, 'name': name });
        }
      });
            
      // Submit new/updated field data with AJAX
      // returns loginId
      var jqxhr = $.post(baseUrl + '/groups/save/', {saveData: saveData, csrf: PassHub.csrf}, function(data) { 
        Materialize.toast(language.notification_groups_saved, 4000);
      })
        .always(function() {
          // Get new data (including new IDs)
          getItemJSON('groups', PassHub.csrf, function(data) {
            showItems('groups', false, data); // Refresh page content
          });
          // Clear delete queue
          deleteItemsQueue = [];
          // Save button return to normal state
          setButtonLoadingIndicator(false, saveButtonEl);
        })
        .fail(function() {
          console.log(jqxhr.statusText);
          if(jqxhr.responseText != '') {
            PassHub.error = jqxhr.responseText;
          } else {
            PassHub.error = language.notification_groups_save_failed;
          }
          Materialize.toast(PassHub.error, 4000);
        });

      // Process items to delete
      if( deleteItemsQueue.length > 0 ) {
        var jqxhr2 = $.post(baseUrl + '/groups/delete', {deleteItemsQueue: deleteItemsQueue, csrf: PassHub.csrf}, function() { 
          // Clear delete queue
          deleteItemsQueue = [];
        })
          .fail(function() {
            var error2 = '';
            console.log(jqxhr2.statusText);
            error2 = language.notification_groups_delete_failed;
            Materialize.toast(error2, 4000);
          });
      }

      // Refresh login once both AJAX requests are done
      // Necessary to grab up-to-date IDs/data from the database
      $.when(jqxhr, jqxhr2).done(function() { 
        getItemJSON('groups', PassHub.csrf, function(data) {
          showItems('groups', false, data);
        });
      });

    });

    // Select All/None Buttons
    $('body').on('click', '.select-btn', function(e) { 
      e.preventDefault();
      var type = $(this).attr('data-type');
      var aclTableEl = $(this).closest('.col').find('.acl-table');
      // Mark all boxes as changed
       $('input[type="checkbox"]', aclTableEl).addClass('dirty-checkbox');
      if(type == 'all') {
        // Check all boxes
        $('input[type="checkbox"]', aclTableEl).prop('checked', true);
      }
      if(type == 'none') {
        // Un-check all boxes 
        $('input[type="checkbox"]', aclTableEl).prop('checked', false);
      }
    });

  } // end groups page

  // =============================================================================================
  // Users page
  // =============================================================================================

  if( 
    PassHub.mode == 'users'
    || PassHub.mode == 'edit-account'
  ) {

    Materialize.toast('<i class="material-icons left">error_outline</i> Managing users is disabled in this demo', 4000);

    var groups = [];

    // Transition in title
    $('#title').velocity("transition.slideUpIn", "easeOutExpo");

    // Get data and show page content
    getItemJSON('users', PassHub.csrf, function(data) {
      PassHub.users = data.users;
      PassHub.groups = data.groups;
      showItems('users', true, data); // Show page content
      // Edit-account page
      // Open edit mode on page load
      if( PassHub.mode == 'edit-account') {
        // Go into edit mode
        setFormState(true, $('.userSingle'));
        // Remove extra buttons
        $('.userSingle form .input-field').first().remove();
        $('.delete-form p').first().text(language.notification_delete_account_confirm);
      }
    });

    // Field action buttons
    // -----------------------------------                      
    $('body').on('click', '.itemSingle .actions button', function(e) {
      e.preventDefault();
      var itemEl = $(this).closest('.input-field');
      var action = $(this).attr('data-action');
      switch(action) {
        case 'generatePassword':
          // generate new password
          var hdl = new Jen(true);
          var password = hdl.password(10, 10);
          // put it in the field
          $('input', itemEl).val(password);
          // show it
          $('input', itemEl).attr('type', 'text');
          // focus the field
          $('input', itemEl).focus();
          // warn to store password
          Materialize.toast(language.notification_password_reminder, 4000);
          break; 
      }
    });

    // Save changes
    // -----------------------------------
    $('body').on('click', '.itemSingle .btnSave', function(e) {
      e.preventDefault();
      var itemEl = $(this).closest('.itemSingle'),
          cardContentInnerEl = $('.card-content-inner', itemEl),
          saveButtonEl = $(this),
          itemData = {},
          endpoint = '/users/save';

      if( PassHub.mode == 'edit-account' ) {
        endpoint = '/edit-account/save';
      }
        
      itemData = {
        userId:       itemEl.attr('data-user-id'),
        userName:     $('.card-title', itemEl).text(),
        userGroupId:  $('select option:selected', itemEl).val(),
        userEmail:    $('[name="email"]', itemEl).val(),
        userPassword: $('[name="password"]', itemEl).val()
      };

      // Insert loading indicator
      setButtonLoadingIndicator(true, saveButtonEl);

      // Submit new/updated field data with AJAX
      // returns loginId on success
      var jqxhr = $.post(baseUrl + endpoint, {itemData: itemData, csrf: PassHub.csrf}, function(data) { 
        // Set id on element in case it's a new login that doesn't have ID filled in yet
        itemEl.attr('data-user-id', data);
        if(PassHub.mode == 'users') {
          refreshUser(itemEl);
          Materialize.toast(language.notification_user_saved, 4000);
        } else {
          Materialize.toast(language.notification_account_saved, 4000);
        }
      })
        .always(function() {
          // Save button return to normal state
          setButtonLoadingIndicator(false, saveButtonEl);
        })
        .fail(function(jqxhr) {
          console.log(jqxhr.statusText);
          if(jqxhr.responseText != '') {
            PassHub.error = jqxhr.responseText;
          } else {
            PassHub.error = language.notification_user_save_failed;
          }
          Materialize.toast(PassHub.error, 4000);
        });

    });

    // Add user
    // -----------------------------------
    $('#btnAddUser').on('click', function(e) {
      e.preventDefault();

      data = { 
        users: {
          1: {
            userId: "",
            userGroupId: "2",
            userName: "New User",
            userEmail: "",
            userPassword: "",
          }
        },
        groups: PassHub.groups 
      };

      // Insert template with data
      var template = $(tmpl('usersTemplate', data));
      $('#usersList').prepend( template );

      // Switch to edit mode
      setFormState(true, template);

      // Transition in
      template
        .hide()
        .delay(100)
        .velocity("transition.slideUpIn", "easeOutExpo");

      // Reactivate plugins
      init(template);
    });

    // Delete user
    // -----------------------------------
    deleteItem(PassHub.mode);

  } // end users page

  // =============================================================================================
  // Tools page
  // =============================================================================================
  
  if( PassHub.mode == 'tools' ) {

    // Transition in title
    $('#title').velocity("transition.slideUpIn", "easeOutExpo");

    // Transition in
        $('.card')
          .hide()
          .delay(100)
          .velocity("transition.slideUpIn");

  } // end tools page

  // =============================================================================================
  // Settings page
  // =============================================================================================

    // Transition in title
    $('#title').velocity("transition.slideUpIn", "easeOutExpo");

    // Transition in
        $('.card')
          .hide()
          .delay(100)
          .velocity("transition.slideUpIn");

    // Save changes
    // -----------------------------------
    $('body').on('click', '.btnSave', function(e) {
      e.preventDefault();
      var saveButtonEl = $(this),
          fieldData = [];

      // Build list of fields and their settings
      fieldData = $('form').serialize();

      // Insert loading indicator
      setButtonLoadingIndicator(true, saveButtonEl);
      

    });


}); // end of document ready
