var _Game = require('./game');

module.exports = function(req, res, next) {
  _Game('_csgo').init(req)
  .then(function(_req) {
    return _Game('_dota').init(_req);
  })
  .then(function(_req) {
    req = _req;
    next();
  });
};
