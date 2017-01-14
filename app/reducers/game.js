export default function game_csgo(state = {}, action) {
  switch (action.type) {
    case 'NEW_PLAYER':
      return Object.assign({}, state, action.player);
    default:
      return state;
  }
}
