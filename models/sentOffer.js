var bookshelf = require('../config/bookshelf');

var SentOffer = bookshelf.Model.extend({
  tableName: 'sent_offers'
});

module.exports = SentOffer;
