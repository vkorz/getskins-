var User = require('../models/user');

exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.send({ success: false, err: 'Unauthorized' });
  }
};

exports.tradelink = function(req, res) {
  req.assert('link', 'INVALID_LINK').isTradelink();

  var errs = req.validationErrors();
  if (errs) {
    return res.send({ success: false, errs });
  }
  req.sanitize('link').toTradeToken();

  req.user.save({
    trade_link: req.body.link[0],
    trade_token: req.body.link[1]
  })
  .then(function(user) {
    res.send({ success: true, msg: 'CHANGE_LINK_SUCCESS' });
  })
  .catch(function(err) {
    res.send({ success: false, err });
  });
};
