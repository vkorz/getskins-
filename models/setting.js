var bookshelf = require('../config/bookshelf');

var Setting = bookshelf.Model.extend({
  tableName: 'settings'
}, {
  get: function(name) {
    return new Setting({ name: name })
    .fetch()
    .then(function(setting) {
      if (!setting) return Promise.reject('INVALID_SETTING');
      return setting.get('value');
    });
  },
  init: function(req) {
    return Setting.get('max_items_in_game')
    .then(function(value) {
      req.max_items = value;
      return req;
    });
  }
});

module.exports = Setting;
