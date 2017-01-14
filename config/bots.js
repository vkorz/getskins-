var Bot = require('../models/bot');

module.exports = function(callback) {
  var result = [];
  Bot.fetchAll()
  .then(function(bots) {
    bots = bots.toArray();
    for (var bot of bots) {
      result.push({
        id: bot.id,
        filename: bot.get('filename'),
        type: bot.get('type'),
        accountName: bot.get('account_name'),
        password: bot.get('password'),
        shared_secret: bot.get('shared_secret'),
        identity_secret: bot.get('identity_secret')
      });
    }
    callback(result);
  });
};
