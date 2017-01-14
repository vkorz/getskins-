import React from 'react';
import { IndexRoute, Route, IndexRedirect } from 'react-router';
import App from './components/App';
import Game from './components/game/Game';
import GameTest from './components/game/GameTest';
import ProfileTest from './components/Profile';
import NotFound from './components/NotFound';
import Profile from './components/game/Profile';

export default function getRoutes(store) {
  const ensureAuthenticated = (nextState, replace) => {
    if (!store.getState().user.id) {
      replace('/csgo');
    }
  };
  const clearMessages = () => {
    store.dispatch({
      type: 'CLEAR_MESSAGES'
    });
  };
  var Wrap = (Component, props) => {
    return React.createClass({
      render: function() { return <Component {...props} children={this.props.children} />; }
    });
  };
  return (
    <div>
      <Route path="/profile" component={ProfileTest} onEnter={ensureAuthenticated} onLeave={clearMessages}/>
      <Route path="/csgo" component={Wrap(App, { game: 'csgo' })}>

        <IndexRoute component={GameTest} />
        <Route path="profile" component={Profile} />

      </Route>
      <Route path="/dota" component={Wrap(App, { game: 'dota' })}>
        <IndexRoute component={GameTest} />
        <Route path="/profile" component={Profile} />


      </Route>
    </div>
  );
}
