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