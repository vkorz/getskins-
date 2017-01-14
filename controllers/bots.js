var botsManager = require('../bots');
var User = require('../models/user');
var Item = require('../models/item');
var Offer = require('../models/offer');
var SentOffer = require('../models/sentOffer');

exports.init = function() {
  botsManager.on('addItems', function(data) {
    new User({ steamid: data.steamid })
    .fetch()
    .then(function(user) {
      if (!user) return data.callback('Can`t find user! SteamID: ' + data.steamid);
      data.callback(null, function(items) {
        (function _(i) {
          var item = items[i];
          Item.fromSteamItem({
            bot_id: data.bot_id,
            user_id: user.id,
            appid: item.appid,
            assetid: item.id,
            name: item.name,
            market_hash_name: item.market_hash_name,
            icon_url: item.icon_url,
            tags: item.tags,
            is_shop: 0
          }, function() {
            if (i !== items.length-1) _(++i);
          });
        })(0);
      });
    })
    .catch(function(err) {
      data.callback(err);
    });
  });
};

exports.buyItems = function(req, res) {
  req.assert('items', 'INVALID_ITEMS').notEmpty();

  var errs = req.validationErrors();
  if (errs) {
    return res.send({ success: false, errs });
  }
  req.sanitize('items').toArray(',');

  if (!req.user.get('trade_token')) {
    return res.send({ success: false, err: 'CANT_FIND_LINK' });
  }

  var items;
  Item.where('is_shop', 1)
  .fetchAll()
  .then(function(items) {
    var _items = [];
    for (var itemId of req.query.items) {
      var _item = items.get(itemId);
      if (!_item) return Promise.reject('HASNT_ITEMS_SHOP');
      items.remove(_item);
      _items.push(_item);
    }
    return _items;
  })
  .then(function(_items) { items = _items;
    var _ps = [];
    for (var item of items) {
      _ps.push(item.price());
    }
    return Promise.all(_ps)
    .then(function(prices) {
      var itemsPrice = 0;
      for (var price of prices) itemsPrice += price;
      return itemsPrice;
    });
  })
  .then(function(itemsPrice) {
    if (req.user.get('money') < itemsPrice) return Promise.reject('HASNT_MONEY');
    return req.user.set('money', req.user.get('money') - itemsPrice).save();
  })
  .then(function() {
    var offers = {};
    for (var item of items) {
      item.set('is_shop', 0).save();
      var botId = item.get('bot_id');
      if (!offers.hasOwnProperty(botId)) offers[botId] = [];
      offers[botId].push({
        appid: item.get('appid'),
        contextid: 2,
        assetid: item.get('assetid')
      });
    }
    new Offer({
      type: 2,
      user_id: req.user.id,
      items: JSON.stringify(items.map(function(item) { return item.id; })),
      status: 1
    }).save()
    .then(function(offer) {
      botsManager.emit('sendItems', {
        steamid: req.user.get('steamid'),
        token: req.user.get('trade_token'),
        count: items.length,
        offers: offers,
        callback: function(err, offerid) {
          if (err) return res.send({ success: true, msg: 'ERR_TRADE' });
          new SentOffer({
            offer_id: offer.id,
            offerid: offerid
          }).save()
          .then(function() {
            offer.set('status', 2).save();
            res.send({ success: true, msg: 'BUY_SUCCESS' });
          });
        }
      });
    });
  })
  .catch(function(err) {
    res.send({ success: false, msg: err });
  });
};

exports.withdrawItems = function(req, res) {
  req.assert('items', 'INVALID_ITEMS').notEmpty();

  var errs = req.validationErrors();
  if (errs) {
    return res.send({ success: false, errs });
  }
  req.sanitize('items').toArray(',');

  if (!req.user.get('trade_token')) {
    return res.send({ success: false, err: 'CANT_FIND_LINK' });
  }

  req.user.items(req.query.items)
  .then(function(items) {
    var offers = {};
    for (var item of items) {
      item.set('user_id', 0).save();
      var botId = item.get('bot_id');
      if (!offers.hasOwnProperty(botId)) offers[botId] = [];
      offers[botId].push({
        appid: item.get('appid'),
        contextid: 2,
        assetid: item.get('assetid')
      });
    }
    new Offer({
      type: 1,
      user_id: req.user.id,
      items: JSON.stringify(items.map(function(item) { return item.id; })),
      status: 1
    }).save()
    .then(function(offer) {
      botsManager.emit('sendItems', {
        steamid: req.user.get('steamid'),
        token: req.user.get('trade_token'),
        count: items.length,
        offers: offers,
        callback: function(err, offerid) {
          if (err) return res.send({ success: true, msg: 'ERR_TRADE' });
          new SentOffer({
            offer_id: offer.id,
            offerid: offerid
          }).save()
          .then(function() {
            offer.set('status', 2).save();
            res.send({ success: true, msg: 'SEND_SUCCESS' });
          });
        }
      });
    });
  })
  .catch(function(err) {
    res.send({ success: false, msg: err });
  });
};

exports.loadToShop = function(req, res) {
  if (req.user.get('is_admin') !== 1) return res.send({ success: false, msg: 'ISNT_ADMIN' });
  botsManager.emit('loadToShop');
};
