var bookshelf = require('../config/bookshelf');
var Item = require('./item');
var User = require('./user');

module.exports = function(name) {
  var Bet = bookshelf.Model.extend({
    tableName: 'bets' + name,
    hasTimestamps: true,
    items: function() {
      var itemsId = JSON.parse(this.get('items')), _ps = [];
      for (var itemId of itemsId) {
        _ps.push(new Item({ id: itemId }).fetch());
      }
      return Promise.all(_ps);
    },
    user: function() {
      return this.belongsTo(User);
    }
  });

  return Bet;
};
