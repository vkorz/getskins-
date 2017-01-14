var bookshelf = require('../config/bookshelf');

var Bot = bookshelf.Model.extend({
  tableName: 'bots'
});

module.exports = Bot;
