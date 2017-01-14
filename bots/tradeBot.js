var botsManager = require('./');
var botId = -1;

var winston = require('winston');
var logger;

var SteamCommunity = require('steamcommunity');
var TradeOfferManager = require('steam-tradeoffer-manager');
var totp = require('steam-totp');

var Item = require('../models/item');
var Offer = require('../models/offer');
var SentOffer = require('../models/sentOffer');



// Init bot
var init = function(config) {
  botId = config.id;
  initLogger(config.id + '_' + Date.now());
  login(
    config.accountName,
    config.password,
    config.shared_secret,
    config.identity_secret,
    function() {
      console.log(config.filename + '(' + config.type + ') #' + config.id + ' logged into Steam! SteamID: ' + mySteamID);

      // manager.getUserInventoryContents('76561197986603983', 730, 2, true, function(err, inv) {
      //   console.log('CSGO');
      //   console.log(inv[0].tags);
      // });
      // manager.getUserInventoryContents('76561197986603983', 570, 2, true, function(err, inv) {
      //   console.log('Dota');
      //   console.log(inv[18].tags);
      // });

      // Test
      // botsManager.emit('addItems', {
      //   bot_id: botId,
      //   steamid: '76561198087530853',
      //   callback: function(err, callback) {
      //     if (err) return console.log(err);
      //     manager.getUserInventoryContents('76561197986603983', 730, 2, true, function(err, inv) {
      //       callback(inv.slice(1, 5));
      //     });
      //   }
      // });
    }
  );

  manager.on('newOffer', function(offer) {
    if (
      offer.state !== 2 ||
      offer.itemsToGive.length !== 0 ||
      offer.itemsToReceive.length === 0
    ) {
      offer.decline();
      return;
    }
    for (var item of offer.itemsToReceive) {
      if (item.appid !== 730 && item.appid !== 570) {
        offer.decline();
        return;
      }
    }
    var steamid = offer.partner.getSteamID64();
    botsManager.emit('addItems', {
      bot_id: botId,
      steamid: steamid,
      callback: function(err, callback) {
        if (err) {
          offer.decline();
          return logger.error(err);
        }
        offer.accept(false, function(err) {
          if (err) return logger.error(err);
          offer.getReceivedItems(false, function(err, items) {
            if (err) return logger.error(err);
            callback(items);
            logger.info(steamid + ' added ' + items.length + ' items.');
          });
        });
      }
    });
  });

  manager.on('sentOfferChanged', function(offer, oldState) {
    new SentOffer({ offerid: offer.id })
    .fetch()
    .then(function(sentOffer) {
      if (!sentOffer) return;
      return new Offer({ id: sentOffer.get('offer_id') }).fetch();
    })
    .then(function(offerModel) {
      if (!offerModel) return;
      if (offer.state === 3) offerModel.set('status', 3).save();
      else if (offer.state !== 2) {
        offerModel.set('status', 0).save();
        offer.decline();
      }
      logger.info(offer.partner.getSteamID64() + ' change offer state to ' + offer.state + ' OfferID: ' + offer.id);
    })
    .catch(function(err) { logger.error(err); });
  });

  botsManager.on('sendItems', function(data) {
    if (!data.offers.hasOwnProperty(botId)) return;

    var newOffer = manager.createOffer(data.steamid);
    newOffer.setToken(data.token);

    var fromItem = 1, toItem = 1;
    for (var _botId in data.offers) {
      var itemsCount = data.offers[_botId].length;
      if (_botId == botId) {
        toItem = fromItem + itemsCount - 1;
        break;
      }
      fromItem += itemsCount;
    }
    newOffer.setMessage(fromItem + '-' + toItem + ' All: ' + data.count);

    newOffer.addMyItems(data.offers[botId]);
    newOffer.send(function(err) {
      if (err) {
        data.callback(err);
        return logger.error(err);
      }
      data.callback(null, newOffer.id);
      logger.info(data.steamid + ' withdraw/buy ' + fromItem + '/' + toItem + ' items All: ' + data.count + '. OfferID: ' + newOffer.id);
    });
  });

  botsManager.on('loadToShop', function() {
    var load = function(appid, inv) {
      (function _(i) {
        var item = inv[i];
        new Item({ assetid: item.id })
        .fetch()
        .then(function(itemModel) {
          if (!itemModel) {
            Item.fromSteamItem({
              bot_id: botId,
              user_id: 0,
              appid: appid,
              assetid: item.id,
              name: item.name,
              market_hash_name: item.market_hash_name,
              icon_url: item.icon_url,
              tags: item.tags,
              is_shop: 1
            }, function() {
              if (i !== inv.length-1) _(++i);
            });
          }
        });
      })(0);
    };
    [730, 570].forEach(function(appid) {
      manager.getInventoryContents(appid, 2, true, function(err, inv) {
        if (err) return logger.error(err);
        load(appid, inv);
      });
    });
  });
};



// Init logger
var initLogger = function(filename) {
  logger = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        filename: './log/' + filename + '.log',
        json: false,
        timestamp: function() {
          return new Date();
        },
        formatter: function(options) {
          return options.timestamp() + ' [' + options.level.toUpperCase() + '] : ' + (options.message ? options.message : '') + (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '');
        }
      })
    ]
  });
};

// Steam
var client  = new SteamCommunity();
var manager = new TradeOfferManager({
  client: client,
  domain: 'localhost',
  language: 'ru'
});
var SteamID = TradeOfferManager.SteamID;
var mySteamID;

var login = function(accountName, password, shared_secret, identity_secret, callback) {
  client.login({
    accountName: accountName,
    password: password,
    twoFactorCode: totp.getAuthCode(shared_secret)
  }, function(err, sessionID, cookies) {
    if (err) return logger.error(err);
    mySteamID = client.steamID.getSteamID64();
    manager.setCookies(cookies, function(err) {
      if (err) return logger.error(err);
      client.startConfirmationChecker(1000, identity_secret);
      logger.info('Logged into Steam!');
      callback();
    });
  });
};

module.exports = init;
