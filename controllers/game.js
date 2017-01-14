var RandomOrg = require('random-org');
var random = new RandomOrg({ apiKey: '4eb8bbb9-d10b-46b2-874d-0e44f460c954' });
var moment = require('moment');

var Setting = require('../models/setting');
var User = require('../models/user');
var _Game = require('../models/game');

var io;
exports.setIO = function(_io) {
  io = _io;
};



exports.newBet = function(req, res) {
  req.assert('game', 'INVALID_GAME').notEmpty();
  req.assert('items', 'INVALID_ITEMS').notEmpty();

  var errs = req.validationErrors();
  if (errs) {
    return res.send({ success: false, errs });
  }
  req.sanitize('items').toArray(',');

  var Game, appid;
  if (req.query.game === 'csgo') {
    Game = _Game('_csgo'); appid = 730;
  } else if (req.query.game === 'dota') {
    Game = _Game('_dota'); appid = 570;
  } else return res.send({ success: false, msg: 'INVALID_GAME' });

  var game, items, betPrice, serItems;
  Game.getCurrent()
  .then(function(_game) { game = _game;
    return req.user.items(req.query.items);
  })
  .then(function(_items) { items = _items;
    return Setting.get('max_items_in_bet')
    .then(function(value) {
      if (items.length > value) return Promise.reject('EXCEED_ITEMS_IN_BET');
    });
  })
  .then(function() {
    return Setting.get('max_items_in_game')
    .then(function(value) {
      return game.itemsCount()
      .then(function(itemsCount) {
        if (itemsCount + items.length > value) return Promise.reject('EXCEED_ITEMS_IN_GAME');
      });
    });
  })
  .then(function() {
    var _ps = [];
    for (var item of items) {
      _ps.push(item.info().fetch());
    }
    return Promise.all(_ps)
    .then(function(itemsInfo) {
      for (var itemInfo of itemsInfo) {
        if (itemInfo.get('appid') != appid) return Promise.reject('ITEM_APPID_ERROR');
      }
    });
  })
  .then(function() {
    var _ps = [];
    for (var item of items) {
      item.set('user_id', 0).save();
      _ps.push(item.info().fetch());
    }
    return Promise.all(_ps)
    .then(function(items) {
      betPrice = 0;
      serItems = [];
      for (var item of items) {
        betPrice += item.get('price');
        serItems.push({
          name: item.get('name'),
          icon: item.get('icon_url'),
          price: item.get('price'),
          color: getColor(item.get('rarity'))
        });
      }
    });
  })
  .then(function() {
    return game.related('bets').orderBy('last_ticket', 'DESC')
    .fetchOne()
    .then(function(bet) {
      if (!bet) return 0;
      return bet.get('last_ticket');
    });
  })
  .then(function(maxTicket) {
    game.set('fund', game.get('fund') + betPrice).save();
    return new game.Bet({
      game_id: game.id,
      user_id: req.user.id,
      items: JSON.stringify(items.map(function(item) { return item.id; })),
      items_count: items.length,
      price: betPrice,
      first_ticket: maxTicket + 1,
      last_ticket: maxTicket + betPrice * 100
    }).save();
  })
  .then(function(bet) {
    return game.related('bets')
    .fetch({ withRelated: 'user' })
    .then(function(bets) {
      var players = {};
      for (var bet of bets.models) {
        var user = bet.related('user');
        if (players.hasOwnProperty(user.id)) {
          players[user.id].betsPrice += bet.get('price');
          players[user.id].chance = Number((players[user.id].betsPrice / game.get('fund') * 100).toFixed(1));
          continue;
        }
        players[user.id] = {
          avatar: user.get('avatar'),
          betsPrice: bet.get('price'),
          chance: Number((bet.get('price') / game.get('fund') * 100).toFixed(1))
        }
      }
      return players;
    })
    .then(function(players) {
      io.emit('new_bet', {
        price: betPrice,
        items_count: items.length,
        bet: {
          name: req.user.get('username'),
          avatar: req.user.get('avatar'),
          first_ticket: bet.get('first_ticket'),
          last_ticket: bet.get('last_ticket'),
          items: serItems
        },
        players: players
      });
      res.send({ success: true, msg: 'BET_SUCCESS' });
      handleTimer(req.query.game);
    });
  })
  .catch(function(err) {
    res.send({ success: false, msg: err });
  });
};

var handleTimer = function(gameName) {
  var Game;
  if (gameName === 'csgo') {
    Game = _Game('_csgo');
  } else if (gameName === 'dota') {
    Game = _Game('_dota');
  } else return console.log('HandleTimer: game isn`t valid!');
  Game.getCurrent()
  .then(function(game) {
    var bets = game.related('bets'), users_id = [];
    for (var bet of bets.models) {
      var user_id = bet.get('user_id');
      if (users_id.indexOf(user_id) === -1) users_id.push(user_id);
    }
    if (users_id.length >= 2) {
      startTimer(gameName, game);
    }
  });
};

var startTimer = function(gameName, game) {
  Setting.get('game_timer')
  .then(function(timer) {
    game.set('status', 1).save();
    var taskTimer = setInterval(function() {
      timer--;
      io.emit('timer', {
        game: gameName,
        timer: timer
      });
      if (timer === 0) {
        clearInterval(taskTimer);
        handleEnd(game);
      }
    }, 1000);
  });
};

var handleEnd = function(game) {
  var rnd, winnerTicket, winnerId, winnerUser, betsPrice;
  game.related('bets')
  .orderBy('last_ticket', 'DESC')
  .fetchOne()
  .then(function(bet) {
    return bet.get('last_ticket');
  })
  .then(function(maxTicket) {
    return random.generateSignedIntegers({
      n: 1, min: 1, max: maxTicket
    });
  })
  .then(function(_rnd) { rnd = _rnd;
    winnerTicket = rnd.random.data[0];
    return new game.Bet({ game_id: game.id })
    .where('last_ticket', '>=', winnerTicket)
    .where('first_ticket', '<=', winnerTicket)
    .fetch()
    .then(function(bet) {
      if (!bet) return Promise.reject('NOT_FOUND_BET');
      return bet;
    });
  })
  .then(function(bet) {
    winnerId = bet.get('user_id');
    winnerUser = new User({ id: winnerId });
    if (winnerUser.isNew()) return Promise.reject('INVALID_USER');
    return winnerUser
    .bets(game.Bet, game.id)
    .then(function(bets) {
      betsPrice = 0;
      for (var bet of bets.models) {
        betsPrice += bet.get('price');
      }
    });
  })
  .then(function() {
    return Setting.get('commision_percent');
  })
  .then(function(commisionPercent) {
    return game.items()
    .then(function(items) {
      var _ps = [];
      for (var item of items) {
        _ps.push(item.price(true));
      }
      return Promise.all(_ps)
      .then(function(items) {
        items = sortItems(items);
        var commision = Math.round(game.get('fund') * commisionPercent) / 100;
        var wonItems = [], commisionItems = [], _commision = 0;
        for (var i = 0, l = items.length; i < l; i++) {
          item = items[i];
          if (
            commision <= _commision ||
            (item._price > commision - _commision && i !== l-1)
          ) {
            wonItems.push(item);
          } else {
            commisionItems.push(item);
            _commision += item._price;
          }
        }
        if (commision > _commision) commisionItems.push(items[l-2]);
        return { won: wonItems, commision: commisionItems };
      });
    });
  })
  .then(function(items) {
    for (var itemWon of items.won) {
      itemWon.set('user_id', winnerId).save();
    }
    for (var itemCom of items.commision) {
      itemCom.set('is_shop', 1).save();
    }
    return game.set({
      winner_id: winnerId,
      winner_ticket: winnerTicket,
      winner_chance: betsPrice / game.get('fund') * 100,
      won_items: JSON.stringify(items.won.map(function(item) { return item.id; })),
      commision_items: JSON.stringify(items.commision.map(function(item) { return item.id; })),
      status: 2,
      verify_random: JSON.stringify(rnd.random),
      verify_signature: rnd.signature,
      finished_at: moment().format()
    }).save();
  })
  .then(function(game) {
    io.emit('end_game', {
      game: game,
      user: winnerUser
    });
  });
};

setTimeout(function() {
  handleTimer('csgo');
  // handleTimer('dota');
}, 5000);



///////////////////////////////

var sortItems = function(a) {
  var n = a.length-1, e;
  for (var i = 0; i < n; i++) {
    for (var j = 0; j < n-i; j++) {
      if (a[j+1]._price > a[j]._price) {
        e = a[j+1]; a[j+1] = a[j]; a[j] = e;
      }
    }
  }
  return a;
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
