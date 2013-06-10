// extends a base panel bar to be bound to data
module.exports = (function($, kendo) {

  'use strict';

  var loading = require("./loading.js");

  var pub, el, panelbar, datasource, tmpl, yql, url;

  var previewWindow = $('<div><iframe src="" frameborder="0"></iframe></div>').kendoWindow({
    modal: true,
    visible: false,
    title: 'Preview',
    iframe: true
  }).getKendoWindow();

  var change = function(e) {
    // clear out the panelbar
    clear();
    // loop through the datasource for this item and 
    $.each(this.view(), function() {
      // render the template html
      var html = template(this.channel.item);
      // append a new item to the panelbar
      panelbar.append({
        text: this.channel.item.title,
        encoded: true,
        content: html
      });
    });
  };

  var activate = function(e) {
    // show the loader
    loading(true);
    // clear out any existing content from this panel
    $('.content').empty();
    // get the post contents
    getPost($('a', e.item).data('url')).then(function(post) {
      $('.content', e.item).append(post.description);
      // hide the loader
      loading(false);
    });
  };

  var clear = function() {
    // remove all the existing items from the panelbar
    $('.k-item', el).remove();
  };

  var dataSource = new kendo.data.DataSource({
    transport: {
      read: {
        url: function() {
          return yql + "?q=select%20channel.item%20from%20xml%20where%20url%20%3D%20%27" + encodeURIComponent(pub.url) + "%27";
        },
        dataType: 'jsonp'
      }, 
      parameterMap: function() {
        return { 
          format: 'json'
        };
      }
    },
    schema: {
      data: "query.results.rss"
    },
    change: change
  });

  var getPost = function(link) {
    var dfrd = $.Deferred();

    var query = "select%20channel.item%20from%20xml%20where%20url%20%3D%20%27" + encodeURIComponent(pub.url) +
                "%27%20and%20channel.item.link%20%3D%20%27" + encodeURIComponent(link) + "%27";
                
    $.get(yql + "?q=" + query, {
      format: 'json' },
      function(data) {
        dfrd.resolve(data.query.results.rss.channel.item);
      }, 'jsonp');

    return dfrd;
  };

  pub = {

    init: function(selector, yqlurl, tmpl) {

      // select the item by selector
      el = $(selector);

      // initialize this module
      kendo.init(el);

      // get the panelbar reference and store it
      panelbar = el.getKendoPanelBar();
      // set the locaction of yql
      yql = yqlurl;
      // store the datasource reference
      datasource = datasource;
      // compile the template
      template = kendo.template($(tmpl).html().trim());
    
      // bind to events
      panelbar.bind('activate', function(e) {
        activate(e);
      });

      // add a click handler to the container for the posts
      $(el).on('click', 'a', function(e) {
        
        var uid = $(e.target).data('uid');
        var url = $(e.target).data('url');

        // set the url of the window iframe
        previewWindow.setOptions({ width: $(document.body).width() - 200,
                                   height: $(document.body).height() - 200,
                                   content: url });

        previewWindow.center().open();
      });
    
    },
    dataSource: dataSource,
    url: url,
    clear: clear
  };

  return pub;

}(jQuery, kendo));