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
});
  
  
$("form[name=login_form]").submit(function (e) {
    var $form = $(this);
    var $error = $form.find(".error");
    var data = $form.serialize();
  
    $.ajax({
      url: "/user/login",
      type: "POST",
      data: data,
      dataType: "json",
      success: function (resp) {
        window.location.href = "/home";
      },
      error: function (resp) {   
          $icon = '<i class="material-icons left icon">error</i><p>'
          $error.html($icon+resp.responseJSON.error+"</p>").removeClass("error--hidden");
          $('.btn').prop('disabled', false);
          $('.btn').text('SIGN IN');    
      }
    });
    e.preventDefault();
  });
  
$("form[name=register_form]").submit(function (e) {

  var $form = $(this);
  var $error = $form.find(".error");
  var data = $form.serialize();
  $.ajax({
    url: "/user/register",
    type: "POST",
    data: data,
    dataType: "json",
    success: function (resp) {
      window.location.href = "/home";
    },
    error: function (resp) {   
        $icon = '<i class="material-icons left icon">error</i><p>'
        $error.html($icon+resp.responseJSON.error+"</p>").removeClass("error--hidden");
        $('.btn').prop('disabled', false);
        $('.btn').text('SIGN UP');    
    }
  });
  e.preventDefault();
});
