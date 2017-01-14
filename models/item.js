var bookshelf = require('../config/bookshelf');
var ItemInfo = require('./itemInfo');

var Item = bookshelf.Model.extend({
  tableName: 'items',
  hasTimestamps: true,
  info: function() {
    return this.belongsTo(ItemInfo, 'item_id');
  },
  price: function(isLoop) {
    var model = this;
    return this.info()
    .fetch()
    .then(function(info) {
      if (!info) return Promise.reject('HASNT_ITEM_INFO');
      if (!isLoop) return info.price();
      return info.price()
      .then(function(price) {
        model._price = price;
        return model;
      });
    });
  }
}, {
  fromSteamItem: function(attrs, callback) {
    new ItemInfo({ market_hash_name: attrs.market_hash_name })
    .fetch()
    .then(function(itemInfo) {
      if (itemInfo) {
        new Item({
          item_id: itemInfo.id,
          user_id: attrs.user_id,
          bot_id: attrs.bot_id,
          appid: attrs.appid,
          is_shop: attrs.is_shop,
          assetid: attrs.assetid
        }).save()
        .then(function() { callback(); });
      } else {
        var tags = formatTags(attrs.appid, attrs.tags);
        new ItemInfo({
          appid: attrs.appid,
          name: attrs.name,
          market_hash_name: attrs.market_hash_name,
          icon_url: 'https://steamcommunity-a.akamaihd.net/economy/image/' + attrs.icon_url,
          rarity: tags.rarity,
          quality: tags.quality,
          type: tags.type,
          special: tags.special
        }).save()
        .then(function(itemInfo) {
          new Item({
            item_id: itemInfo.id,
            user_id: attrs.user_id,
            bot_id: attrs.bot_id,
            appid: attrs.appid,
            is_shop: attrs.is_shop,
            assetid: attrs.assetid
          }).save()
          .then(function() { callback(); });
        });
      }
    });
  }
});

var formatTags = function(appid, tags) {
  var _tags = {};
  if (appid === 730) {
    for (var tag of tags) {
      if (tag.category === 'Rarity') _tags.rarity = tag.internal_name;
      if (tag.category === 'Exterior') _tags.quality = tag.internal_name;
      if (tag.category === 'Type') _tags.type = tag.internal_name;
      if (tag.category === 'Quality') _tags.special = tag.internal_name;
    }
  } else if (appid === 570) {
    for (var tag1 of tags) {
      if (tag1.category === 'Rarity') _tags.rarity = tag1.internal_name;
      if (tag1.category === 'Quality') _tags.quality = tag1.internal_name;
      if (tag1.category === 'Type') _tags.type = tag1.internal_name;
      if (tag1.category === 'Hero') _tags.special = tag1.internal_name;
    }
  }
  return _tags;
};

module.exports = Item;
