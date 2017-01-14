var bookshelf = require('../config/bookshelf');
var Setting = require('./setting');

module.exports = function(name) {
  var Bet = require('./bet')(name);
  var Game = bookshelf.Model.extend({
    tableName: 'games' + name,
    hasTimestamps: true,
    Bet: Bet,
    bets: function() {
      return this.hasMany(Bet, 'game_id');
    },
    items: function() {
      return this.bets()
      .fetch()
      .then(function(bets) {
        var _ps = [];
        for (var bet of bets.models) {
          _ps.push(bet.items());
        }
        return Promise.all(_ps)
        .then(function(betsItems) {
          var items = [];
          for (var betItems of betsItems) {
            items = items.concat(betItems);
          }
          return items;
        });
      });
    },
    itemsCount: function() {
      return this.bets()
      .fetch()
      .then(function(bets) {
        var itemsCount = 0;
        for (var bet of bets.models) {
          itemsCount += bet.get('items_count');
        }
        return itemsCount;
      });
    }
  }, {
    getCurrent: function() {
      return Game.count()
      .then(function(id) {
        if (id === 0) return new Game().save();
        return new Game({ id: id })
        .fetch({ withRelated: 'bets' })
        .then(function(game) {
          if (!game) return Promise.reject('GAME_ISNT_FOUND');
          if (game.get('status') == 2) return new Game().save();
          return game;
        });
      });
    },
    init: function(req) {
      var game, bets, betsItems;
      return Game.getCurrent()
      .then(function(_game) { game = _game;
        return game.bets().orderBy('created_at', 'DESC')
        .fetch({ withRelated: 'user' });
      })
      .then(function(_bets) { bets = _bets.models;
        var _ps = [];
        for (var bet of bets) {
          _ps.push(bet.items());
        }
        return Promise.all(_ps)
        .then(function(betsItems) {
          var _ps = [];
          for (var betItems of betsItems) {
            var _pss = [];
            for (var item of betItems) {
              _pss.push(item.info().fetch());
            }
            _ps.push(Promise.all(_pss));
          }
          return Promise.all(_ps);
        });
      })
      .then(function(_betsItems) { betsItems = _betsItems;
        var t = [], _ps = [];
        for (var betItems of betsItems) {
          for (var item of betItems) {
            if (t.indexOf(item.id) !== -1) continue;
            t.push(item.id);
            _ps.push(item.price(true));
          }
        }
        return Promise.all(_ps)
        .then(function(items) {
          var prices = {};
          for (var item of items) {
            prices[item.id] = item.get('price');
          }
          return prices;
        });
      })
      .then(function(prices) {
        var itemsCount = 0, players = {}, serBets = [];
        for (var i = 0, l = bets.length; i < l; i++) {
          var bet = bets[i];
          itemsCount += bet.get('items_count');
          var user = bet.related('user');
          var items = [];
          for (var item of betsItems[i]) {
            items.push({
              name: item.get('name'),
              icon: item.get('icon_url'),
              price: prices[item.id],
              color: getColor(item.get('rarity'))
            });
          }
          serBets.push({
            name: user.get('username'),
            avatar: user.get('avatar'),
            first_ticket: bet.get('first_ticket'),
            last_ticket: bet.get('last_ticket'),
            items: items
          });
          if (players.hasOwnProperty(user.id)) {
            players[user.id].betsPrice += bet.get('price');
            players[user.id].chance = Number((players[user.id].betsPrice / game.get('fund') * 100).toFixed(1));
            continue;
          }
          players[user.id] = {
            avatar: user.get('avatar'),
            betsPrice: bet.get('price'),
            chance: Number((bet.get('price') / game.get('fund') * 100).toFixed(1))
          };
        }
        var serGame = {
          id: game.id,
          fund: game.get('fund'),
          items_count: itemsCount,
          players: players,
          bets: serBets
        };
        return Setting.get('max_items_in_game')
        .then(function(value) {
          serGame.max_items = value;
          return Setting.get('game_timer');
        })
        .then(function(value) {
          serGame.timer = value;
          req['game' + name] = serGame;
          return req;
        });
      });
    }
  });

  return Game;
};

function getColor(rarity) {
  switch (rarity) {
    case 'Rarity_Common':
    case 'Rarity_Common_Weapon':
      return '#A0B8C7';
    case 'Rarity_Uncommon':
    case 'Rarity_Uncommon_Weapon':
      return '#0554BF';
    case 'Rarity_Rare':
    case 'Rarity_Rare_Weapon':
      return '#242CFF';
    case 'Rarity_Mythical':
    case 'Rarity_Mythical_Weapon':
      return '#600FB1';
    case 'Rarity_Legendary':
    case 'Rarity_Legendary_Weapon':
      return '#D51767';
    case 'Rarity_Ancient':
    case 'Rarity_Ancient_Weapon':
      return '#FF2929';
    case 'Rarity_Contraband_Weapon':
    case 'Rarity_Immortal_Weapon':
      return '#FFB100';
    case 'Rarity_Arcana_Weapon':
      return '#2DB704';
    default:
      return '#ffffff';
  }
}
