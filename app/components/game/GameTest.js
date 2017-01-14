import React from 'react';
import { connect } from 'react-redux';

class Game extends React.Component {
  constructor(props) {
    super(props);
    var game = this.props.game[this.props.gameName];
    this.state = {
      game_id: game.id,
      fund: game.fund,
      items_count: game.items_count,
      players: game.players,
      bets: game.bets,
      max_items: game.max_items,
      timer: game.timer
    };
  }

  componentDidMount() {
    window.socket.on('new_bet', function(data) {
      console.log(data);
      var _bets = this.state.bets.slice();
      _bets.unshift(data.bet);
      this.setState({
        fund: this.state.fund + data.price,
        items_count: this.state.items_count + data.items_count,
        players: data.players,
        bets: _bets
      });
    }.bind(this));
    window.socket.on('timer', function(data) {
      if (data.game === this.props.gameName) {
        this.setState({ timer: data.timer });
      }
    }.bind(this));
  }

  render() {
    const formatTime = (time) => {
      var m = Math.floor(time / 60), s = time - m*60;
      return m+':'+s;
    };
    const { game_id, fund, items_count, players, bets, max_items } = this.state;
    var listPlayers = [];
    console.log(players);
    for (var playerId in players) {
      var player = players[playerId];
      listPlayers.push(
        <div key={playerId} className="infoUser">
          <img className="avatarHazard" src={player.avatar} /> 
          <span className="L-b">{player.chance}%</span>
        </div>
      );
    }
    var listBets = [], i = 1;
    console.log(bets);
    for (var bet of bets) {
      var listItems = [], j = 1;
      for (var item of bet.items) {
        listItems.push(
          <div key={j} className="itemBlock">
            <img src={item.icon} />
            <hr style={{ backgroundColor: item.color }} />
            <h3>{item.price} руб</h3>
          </div>
        );
        j++;
      }
      listBets.push(
        <div key={i} className="blockItem">
          <div className="infoItem">
            <div className="contentP">
              <img src={bet.avatar} className="avatar" />
              <div className="infoPlayer">
                <h1>{bet.name}</h1>
                <h2>Шанс на победу <span>50%</span></h2>
              </div>
              <div className="infoRandom">
                <h2>Билеты от #{bet.first_ticket} до #{bet.last_ticket}</h2>
              </div>
            </div>
          </div>
          <div className="itemGame">
            <div className="contentP">
              <hr/>
              {listItems}
            </div>  
          </div>
        </div>
      );
      i++;
    }
    return (
      <div className="blockGame">
        <div className="header">
          <div className="contentP">
            <h1 className="L-r">На кону: <span>{fund}</span> руб</h1>
            <a href="#" className="logSteam">
              <div>
                <span className="L-b">Войти чтобы начать игру</span>
                <img src="/img/steam.png" />
              </div>
            </a>
          </div>
        </div>
        <div className="gradient"></div>
        <div className="contentP">
          <div className="load"></div>
          <div className="infoGame">
            <div className="block">
              <h1 className="L-r">Игра #{game_id}</h1>
              <a href="#">
                <div className="btn-bet L-r">сделать ставку</div>
              </a>  
            </div>
            <div className="block">
              <h1 className="L-b">Предметы</h1>
              <span>{items_count}/{max_items}</span>
            </div>
            <div className="block">
              <h1 className="L-b">Таймер</h1>
              <span>{formatTime(this.state.timer)}</span>
            </div>
          </div>
        </div>
        <div className="gradient"></div>
        {listPlayers.length > 0 &&
          <div className="blockHazard">
            {listPlayers}
          </div>
        }
        <div className="gradient"></div>
          {listBets} 
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    game: state.game
  };
};

export default connect(mapStateToProps)(Game);
