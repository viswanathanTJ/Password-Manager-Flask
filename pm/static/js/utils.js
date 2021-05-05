(function(){
  var cache = {};
 
  this.tmpl = function tmpl(str, data){
    // Figure out if we're getting a template, or if we need to
    // load the template - and be sure to cache the result.
    var fn = !/\W/.test(str) ?
      cache[str] = cache[str] ||
        tmpl(document.getElementById(str).innerHTML) :
     
      // Generate a reusable function that will serve as a template
      // generator (and which will be cached).
      new Function("obj",
        "var p=[],print=function(){p.push.apply(p,arguments);};" +
       
        // Introduce the data as local variables using with(){}
        "with(obj){p.push('" +
       
        // Convert the template into pure JavaScript
        str
          .replace(/[\r\t\n]/g, " ")
          .split("<%").join("\t")
          .replace(/((^|%>)[^\t]*)'/g, "$1\r")
          .replace(/\t=(.*?)%>/g, "',$1,'")
          .split("\t").join("');")
          .split("%>").join("p.push('")
          .split("\r").join("\\'")
      + "');}return p.join('');");
   
    // Provide some basic currying to the user
    return data ? fn( data ) : fn;
  };
})();

// Slugify a string
function slugify(text)
{
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

// Convert lowercase slug to capitalized and spaced text
function titleize(text) {
  return text.replace(/-/g, " ").replace(/\b[a-z]/g, function () {
      return arguments[0].toUpperCase();
    });
}

function passwordMask(text) {
  return text.replace(/./g, '&#9679;');
}

// clip-j
// A Flash free clipboard implementation.
function clip(text) {
  var copyElement = document.createElement('input');
  copyElement.setAttribute('type', 'text');
  copyElement.setAttribute('value', text);
  copyElement = document.body.appendChild(copyElement);
  copyElement.select();
  try {
    document.execCommand('copy');
  } catch (e) {
    copyElement.remove();
    console.log("document.execCommand('copy'); is not supported");
    prompt('Copy the text below. (ctrl c, enter)', text);
  } finally {
    if (typeof e == 'undefined') {
      copyElement.remove();
    }
  }
}

// Get number of items in an object
// example: var size = Object.size(myArray);
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// Select the text in provided element
function selectText(el) {
  var doc = document;
  if (doc.body.createTextRange) { // ms
      var range = doc.body.createTextRange();
      range.moveToElementText(el[0]);
      range.select();
  } else if (window.getSelection) { // moz, opera, webkit
      var selection = window.getSelection();            
      var range = doc.createRange();
      range.selectNodeContents(el[0]);
      selection.removeAllRanges();
      selection.addRange(range);
  }
}

// Change HTML element type jQuery plugin
(function($) {
    $.fn.changeElementType = function(newType) {
        var attrs = {};

        $.each(this[0].attributes, function(idx, attr) {
            attrs[attr.nodeName] = attr.nodeValue;
        });

        this.replaceWith(function() {
            return $("<" + newType + "/>", attrs).append($(this).contents());
        });
    };
})(jQuery);

"use strict";function JenFailsafe(){}function Jen(t){return this instanceof Jen?(this.hardened=t&&1==t?t:!1,this.dump=new Uint8Array(256),this.mode="",this.version="1.0.5-dev",void(1==_serverSide?(this.crypto=require("crypto"),this.mode="NodeJS CryptoAPI"):(this.crypto=window.crypto||window.msCrypto,window.crypto?(this.mode="W3C CryptoAPI",this.crypto=window.crypto):window.msCrypto&&(this.mode="Microsoft CryptoAPI",this.crypto=window.msCrypto),this.crypto||(this.mode="Failsafe",this.crypto=JenFailsafe)))):new Jen(t)}var _serverSide=!1;JenFailsafe.getRandomValues=function(t){t instanceof Uint8Array||(t=new Uint8Array(256));for(var e=0,r=0;r<t.length;r++){for(;;)if(e=Math.round(256*Math.random()),e>=0&&255>=e)break;t[r]=e}return t},Jen.prototype.engine=function(){return this.mode},Jen.prototype.fill=function(){1==_serverSide?this.dump=this.crypto.randomBytes(256):this.crypto.getRandomValues(this.dump)},Jen.prototype.randomBytes=function(t){if(0>=t&&(t=1),1==_serverSide)return this.crypto.randomBytes(t);var e=new Uint8Array(t);return this.crypto.getRandomValues(e),e},Jen.prototype.random=function(t){0>=t?t=4:t>2&&(t=4);var e=this.randomBytes(t);if(1==_serverSide)return 1==t?e.readUInt8(0):2==t?e.readUInt16LE(0):e.readUInt32LE(0);var r,n=new DataView(e.buffer);return r=1==t?n.getUint8(0):2==t?n.getUint16(0):n.getUint32(0)},Jen.prototype.hardening=function(t){this.hardened=!!t},Jen.prototype.password=function(t,e,r){var n=(new Date).getTime();r instanceof RegExp||(r=null),t=4>t?4:t,e=e>t?e:t;var o=0,i="",s=e;if(t!=e){s=0;for(var a=Math.ceil(Math.log(e)/Math.log(2)),d=Math.ceil(a/8),h=8*d;0==s;){var p=this.random(d)>>h-a;if(p>=t&&e>=p){s=p;break}}}for(o=0;s>o;){this.fill();for(var f=this.dump,m=0;m<f.length&&s>o;m++)f[m]>=48&&f[m]<=57||f[m]>=65&&f[m]<=90||f[m]>=97&&f[m]<=122?r?r.test(String.fromCharCode(f[m]))&&(i+=String.fromCharCode(f[m]),o++):(i+=String.fromCharCode(f[m]),o++):1==this.hardened&&(33==f[m]||35==f[m]||37==f[m]||40==f[m]&&f[m]<=47||58==f[m]&&f[m]<=64)&&(r?r.test(String.fromCharCode(f[m]))&&(i+=String.fromCharCode(f[m]),o++):(i+=String.fromCharCode(f[m]),o++))}return this.fill(),this._time=(new Date).getTime()-n,i},Jen.prototype.stats=function(){return this._time},"undefined"!=typeof module&&module.exports&&(_serverSide=!0,module.exports=Jen);