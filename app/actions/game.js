export function newPlayer(player) {
  return (dispatch) => {
    dispatch({
      type: 'NEW_PLAYER',
      player: player
    });
  };
}