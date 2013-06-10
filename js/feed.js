module.exports = (function($, kendo) {

  'use strict';

  // we need the posts module
  var posts = require("./posts.js");
  var local = require("./local.js");
  var loading = require("./loading.js");

  var el, add, pub, yql, listview, add;

  // simple jQuery AJAX get to retrieve a single post details
  var getTitle = function(url) {

    var dfrd = $.Deferred();

    $.get(yql + "?q=select%20channel.title%20from%20xml%20where%20url%20%3D%20%27" + encodeURIComponent(url) + "%27",
      { format: 'json' }, 
      function(data) {
        dfrd.resolve(data.query.results.rss.channel);
      }, 'jsonp');

    return dfrd;
  };

  // the view model
  var viewModel = kendo.observable({
    url: '',
    list: local,
    add: function() {
      add.center().open();
    },
    save: function() {
      var url = this.get('url');
      var feeds = this.get('list');
      // close the window before we even get done
      add.close();
      // show the loader
      loading(true);
      getTitle(url).then(function(newFeed) {
        // add the new item to the feed
        local.add({ name: newFeed.title, url: url });
        // sync the local storage
        local.sync();
        // clear the selected
        viewModel.set("selected", "");
        // hide the loader
        loading(false);
      });
    },
    remove: function(e) {
      // get the datasource
      feeds = this.get("list");
      // remove the item from the datasource
      feeds.remove(feeds.getByUid(this.get("selected")));
      // clear the posts since the feed is gone
      posts.clear();
      // remove from local storage with sync
      feeds.sync();
    },
    select: function(e) {
      var selected = (e.sender.select());
      // set the selected item
      this.set('selected', selected.data('uid'));
      // hide the posts
      this.set('loading', true);
      // set the url for the datasource
      posts.url = $('a', selected).data('url');
      // let the datasource read
      posts.dataSource.read();
    },
    selected: "",
    visible: function() {
      this.get(selected).length > 0 ? true : false
    }
  })

  pub = {
    init: function(selector, win, yqlurl) {
      // set the yqlurl
      yql = yqlurl;
      // select the listview element from the dom
      el = $(selector);
      // initialize the posts module
      posts.init('#posts-list', yql, '#post-item-template');
      // bind the DOM
      kendo.bind(el, viewModel);
      // get a reference to the window element
      add = $(win).kendoWindow({
        title: 'Add Feed',
        visible: false,
        modal: true
      }).getKendoWindow();
      // store a reference to the listview
      listview = $('#feeds', el).getKendoListView();
    }
  }

  return pub;

}(jQuery, kendo));
