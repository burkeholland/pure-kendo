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