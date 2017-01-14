var bookshelf = require('../config/bookshelf');

var Offer = bookshelf.Model.extend({
  tableName: 'offers',
  hasTimestamps: true
});

module.exports = Offer;
