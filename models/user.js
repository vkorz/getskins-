var bookshelf = require('../config/bookshelf');
var Item = require('./item');

var User = bookshelf.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  items: function(itemsId) {
    if (!itemsId) return this.hasMany(Item);
    return this.hasMany(Item)
    .fetch()
    .then(function(items) {
      var _items = [];
      for (var itemId of itemsId) {
        var _item = items.get(itemId);
        if (!_item) return Promise.reject('HASNT_ITEMS');
        items.remove(_item);
        _items.push(_item);
      }
      return _items;
    });
  },
  bets: function(Bet, gameId) {
    if (!gameId) return this.hasMany(Bet);
    return Bet.where({
      game_id: gameId,
      user_id: this.id
    })
    .fetchAll();
    // return Bet.query({
    //   where: { game_id: gameId },
    //   andWhere: { user_id: this.id }
    // })
    // .fetchAll();
  }
});

module.exports = User;
