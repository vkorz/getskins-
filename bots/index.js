var botsController = require('../controllers/bots');
var initBots = require('../config/bots');

// Load bots
exports.init = function() {
  initBots(function(bots) {
    for (var bot of bots) {
      require('./' + bot.filename)(bot);
    }
  });
  botsController.init();
};

// Event system
var listeners = {};

exports.on = function(eventName, callback) {
  if (!listeners.hasOwnProperty(eventName))
    listeners[eventName] = [];
  listeners[eventName] = listeners[eventName].concat(callback);
  return listeners[eventName].length;
};

exports.emit = function(eventName, data) {
  if (listeners.hasOwnProperty(eventName)) {
    for (var callback of listeners[eventName])
      callback(data);
    return true;
  }
  return false;
};
