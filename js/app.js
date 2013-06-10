(function ($, kendo) {

  'use strict';

  // require all the necessary files
  var feed = require("./feed.js");
  var yql = 'http://query.yahooapis.com/v1/public/yql';

  feed.init('#menu', '#add-feed-window', yql);

}(jQuery, kendo));