;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
(function ($, kendo) {
  'use strict';

  var itemBase, separator, idField, id;

  kendo.data.extensions = kendo.data.extensions || {};

  // Function to create a quasi-unique GUID for localStorage
  var getGuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
  };

  // Obtains the list of keys from localStorage
  var getKeys = function () {
    var keysList = localStorage.getItem(itemBase);
    return keysList ? keysList.split(',') : [];
  };

  // Checks the localStorage key list for the current id and,
  // if it doesn't exist, adds that key to the list and saves
  // the list back to localStorage.
  var addKeyIfNew = function (id) {
    var keys = getKeys(),
      matchingKey = $.grep(keys, function (key) { return key === id; });

    if (!matchingKey.length) {
      keys.push(id);
      localStorage.setItem(itemBase, keys.join(','));
    }
  };

  // Fetches an array of objects from localStorage
  var getFromLocalStorage = function () {
    var keys = getKeys(),
      todos = [];

    $.each(keys, function (index, value) {
      var item = localStorage.getItem(itemBase + separator + value);

      if (item) {
        todos.push(JSON.parse(item));
      }
    });

    return todos;
  };

  // Saves the current item to localStorage
  var saveToLocalStorage = function (data) {
    if (!data[idField]) {
      data[idField] = getGuid();
    }

    addKeyIfNew(data[idField]);
    localStorage.setItem(itemBase + separator + data[idField], JSON.stringify(data));
  };

  // Removes the current item from localStorage
  var removeFromLocalStorage = function (data) {
    var keys = getKeys();

    var index = keys.indexOf(data[idField]);

    if (index >= 0) {
      keys.splice(index, 1);
      localStorage.setItem(itemBase, keys.join(','));

      localStorage.removeItem(itemBase + separator + data[idField]);
    }
  };

  // Specify a CRUD transport object for our custom Kendo DataSource
  var localTransports = {
    read: function (options) {
      var todos = getFromLocalStorage();

      options.success(todos);
    },
    create: function (options) {
      saveToLocalStorage(options.data);

      options.success(options.data);
    },
    update: function (options) {
      saveToLocalStorage(options.data);

      options.success(options.data);
    },
    destroy: function (options) {
      removeFromLocalStorage(options.data);

      options.success(options.data);
    }
  };

  // Create the custom DataSource by extending a kendo.data.DataSource
  // and specify an init method that wires up needed functionality.
  kendo.data.extensions.LocalStorageDataSource = kendo.data.DataSource.extend({
    init: function (options) {
      // DataSource consumers can specify custom itemBase and separator
      // strings when initializing the DataSource. These values are
      // used when saving records to localStorage.
      itemBase = options.itemBase || 'kendo-ds';
      separator = options.separator || '-';
      idField = options.schema.model.idField;
      id = options.schema.model.id;

      // The idField is required. If not specified on the model, throw an error
      if (!idField && !id) {
        throw new Error('An id field is required in order to work with localStorage. Please specify an id on your Model.');
      }

      // Call the "base" DataSource init function and provide our custom transport object
      kendo.data.DataSource.fn.init.call(this, $.extend(true, {}, { transport: localTransports }, options));
    }
  });
})($, kendo);
},{}],2:[function(require,module,exports){
module.exports = (function() {

  'use strict';

  var viewModel = kendo.observable({
    loading: false
  });

  kendo.bind('.loading', viewModel);

  var set = function(loading) {
    viewModel.set("loading", loading);
  };

  return set;

}(jQuery, kendo));
},{}],3:[function(require,module,exports){
(function ($, kendo) {

  'use strict';

  // require all the necessary files
  var feed = require("./feed.js");
  var yql = 'http://query.yahooapis.com/v1/public/yql';

  feed.init('#menu', '#add-feed-window', yql);

}(jQuery, kendo));
},{"./feed.js":4}],4:[function(require,module,exports){
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

},{"./posts.js":5,"./local.js":6,"./loading.js":2}],6:[function(require,module,exports){
module.exports = (function() {

  'use strict';

  // require the kendo ui localstorage shim
  require('./kendo.data.localstorage.js');

  // Todo Model Object
  var model = kendo.data.Model.define({
    id: 'id',
    fields: {
      name: { type: 'string' },
      url: { type: 'string' }
    }
  });

  return new kendo.data.extensions.LocalStorageDataSource({
    itemBase: 'pure-reader',
    schema: {
      model: model
    }
  });
  
}(jQuery, kendo));
},{"./kendo.data.localstorage.js":1}],5:[function(require,module,exports){
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
},{"./loading.js":2}]},{},[3,4,1,2,6,5])
;