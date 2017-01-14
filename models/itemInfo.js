var bookshelf = require('../config/bookshelf');
var moment = require('moment');

var ItemInfo = bookshelf.Model.extend({
  tableName: 'items_info',
  hasTimestamps: true,
  price: function(isLoop) {
    var self = this;
    if (self.get('price') === 0 || moment().diff(moment(self.get('updated_at')), 'days') > 5) {
      return getPrice(self.get('market_hash_name'))
      .then(function(price) {
        return self.set('price', price).save();
      })
      .then(function(itemInfo) {
        if (isLoop) return itemInfo;
        return itemInfo.get('price');
      });
    } else {
      if (isLoop) return Promise.resolve(self);
      return Promise.resolve(self.get('price'));
    }
  }
});

var getPrice = function(name) {
  return Promise.resolve(4.81);
};

module.exports = ItemInfo;
