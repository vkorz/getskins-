import { combineReducers } from 'redux';
import messages from './messages';
import user from './user';
import game from './game';

export default combineReducers({
  messages,
  user,
  game
});
