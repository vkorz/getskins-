var express = require('express');
var path = require('path');
var logger = require('morgan');
var compression = require('compression');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var dotenv = require('dotenv');
var React = require('react');
var ReactDOM = require('react-dom/server');
var Router = require('react-router');
var Provider = require('react-redux').Provider;
var sass = require('node-sass-middleware');
var webpack = require('webpack');
var config = require('./webpack.config');

// Load environment variables from .env file
dotenv.load();

// ES6 Transpiler
require('babel-core/register');
require('babel-polyfill');

// Bots
var botsManager = require('./bots');
botsManager.init();

// Models
var modelsLoader = require('./models');
var User = require('./models/user');

// Controllers
var contactController = require('./controllers/contact');
var userController = require('./controllers/user');
var gameController = require('./controllers/game');
var botsController = require('./controllers/bots');

// React and Server-Side Rendering
var routes = require('./app/routes');
var configureStore = require('./app/store/configureStore').default;

// Passport and SteamStrategy
var passport = require('passport');
var SteamStrategy = require('passport-steam').Strategy;

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  new User({ id: id })
  .fetch()
  .then(function(user) {
    done(null, user);
  })
  .catch(function(err) {
    done(err);
  });
});
passport.use(new SteamStrategy({ // 94.180.85.254
  returnURL: 'http://localhost:8080/auth/steam/return',
  realm: 'http://localhost:8080/',
  apiKey: 'A83D1AE7595BD6A0CCCCF8B226A86507'
}, function(identifier, profile, done) {
  new User({ steamid: profile.id })
  .fetch()
  .then(function(user) {
    if (user) {
      done(null, user);
    } else {
      new User({
        steamid: profile.id,
        username: profile.displayName,
        avatar: profile.photos[2].value
      }).save()
      .then(function(user) {
        done(null, user);
      })
      .catch(function(err) {
        done(err);
      });
    }
  })
  .catch(function(err) {
    done(err);
  });
}));

// Express initalize
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var compiler = webpack(config);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3000);
app.use(compression());
app.use(sass({ src: path.join(__dirname, 'public'), dest: path.join(__dirname, 'public') }));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator(require('./config/customValidator')));
app.use(cookieParser('5a99143b5c9ae09e3a77e6afbd'));
app.use(cookieSession({
  name: 'gss',
  secret: '5a99143b5c9ae09e3a77e6afbd',
  maxAge: 24 * 60 * 60 * 1000
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use(modelsLoader);
// app.use(function(req, res, next) {
//   req.io = io;
//   next();
// });
gameController.setIO(io);

if (app.get('env') === 'development') {
  app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }));
  app.use(require('webpack-hot-middleware')(compiler));
}

// Authentication
app.get('/auth/steam', passport.authenticate('steam', {
  failureRedirect: '/failure'
}));
app.get('/auth/steam/return', passport.authenticate('steam', {
  failureRedirect: '/failure',
  successRedirect: '/'
}));
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

// Http requests
app.post('/contact', contactController.contactPost);
app.post('/tradelink', userController.ensureAuthenticated, userController.tradelink);
app.get('/new_bet', userController.ensureAuthenticated, gameController.newBet);
app.get('/withdraw_items', userController.ensureAuthenticated, botsController.withdrawItems);
app.get('/buy_items', userController.ensureAuthenticated, botsController.buyItems);
app.get('/load_to_shop', userController.ensureAuthenticated, botsController.loadToShop);

// React server rendering
app.get('/', function(req, res) { res.redirect('/csgo'); });
app.use(function(req, res) {
  var initialState = {
    messages: {},
    user: req.user,
    game: {
      csgo: req.game_csgo,
      dota: req.game_dota
    }
  };

  var store = configureStore(initialState);

  Router.match({
    routes: routes.default(store),
    location: req.url
  }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message);
    } else if (redirectLocation) {
      res.status(302).redirect(redirectLocation.pathname + redirectLocation.search);
    } else if (renderProps) {
      var html = ReactDOM.renderToString(React.createElement(Provider, { store: store },
        React.createElement(Router.RouterContext, renderProps)
      ));
      res.render('layout', {
        html: html,
        initialState: store.getState()
      });
    } else {
      res.sendStatus(404);
    }
  });
});

// Production error handler
if (app.get('env') === 'production') {
  app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.sendStatus(err.status || 500);
  });
}

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;
