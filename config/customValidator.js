const tradelinkRegexp = /^https:\/\/steamcommunity\.com\/tradeoffer\/new\/\?partner=\d+&token=(\w+)$/;

module.exports = {
  customValidators: {
    isTradelink: function(link) {
      return tradelinkRegexp.test(link);
    }
  },
  customSanitizers: {
    toTradeToken: function(link) {
      return [ link, link.match(tradelinkRegexp)[1] ];
    },
    toArray: function(str, del) {
      return str.indexOf(del) !== -1 ? str.split(del) : [str];
    }
  }
};
