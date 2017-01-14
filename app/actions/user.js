export function changeTradelink(link) {
  return (dispatch) => {
    return fetch('/tradelink', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        link: link
      })
    })
    .then(res => {
      res.json().then(data => {
        console.log(data);
      });
    });
  };
}
