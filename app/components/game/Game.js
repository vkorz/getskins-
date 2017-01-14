import React from 'react';
import { connect } from 'react-redux';

class Game extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      game: this.props['game_' + this.props.game]
    };
  }

  componentDidMount() {
    
  }

  render() {
    const { game } = this.state;
    return (
      <div className="blockGame">
        <div className="header">
          <div className="contentP">
            <h1 className="L-r">На кону: <span>{game.fund}</span> руб</h1>
          </div>
        </div>
        <div className="gradient"></div>
        
        <div className="contentP">
          <div className="line"></div>
          <div className="StartGame">
            <div className="blockUser">
              <img src="/img/avatar.jpeg"/>
            </div>
            <div className="blockUser">
              <img src="/img/avatar.jpeg"/>
            </div>
            <div className="blockUser">
              <img src="/img/avatar.jpeg"/>
            </div>
            <div className="blockUser">
              <img src="/img/avatar.jpeg"/>
            </div>
            <div className="blockUser">
              <img src="/img/avatar.jpeg"/>
            </div>
            <div className="blockUser">
              <img src="/img/avatar.jpeg"/>
            </div>
            <div className="blockUser">
              <img src="/img/avatar.jpeg"/>
            </div>
          </div>
          <div className="line"></div>
        </div>
        
        <div className="gradient"></div>
        
        <div className="infoStartGame">
          <div className="contentP">

             <div className="leftInfo">
               <h2>Выйгранный билет: #<span>345332</span></h2>
               <h2>Последний победитель: <span>User name</span></h2>
               <h1>в игре:<span>340 689</span>руб</h1>
             </div>
             
             <div className="rightInfo">
               <h1>Новая игра <span>
                <div>50</div></span>
              </h1>

              <a href="#">
                <div className="btn-game">
                  <h1>Сделать ставку</h1>
                </div>
              </a>

             </div>

          </div>
        </div>

        <div className="gradient"></div>


          <div className="blockItem">

          <div className="contentP">
            <div className="infoItem">
              <img src="/img/avatar.jpeg" className="avatar" />
              <div className="infoPlayer">
                <h1>User name</h1>
              </div>
              <div className="infoRandom">
                <h2>Билеты от #405 до #443521</h2>
              </div>
            </div>
          </div>  


            <div className="itemGame">
              <div className="contentP">
                <hr/>
                <div className="itemBlock">
                  <img src="/img/knife.png"/>
                  <hr/>
                  <h3>24 000 руб</h3>
                </div>
                <div className="itemBlock">
                  <img src="/img/knife.png"/>
                  <hr/>
                  <h3>24 000 руб</h3>
                </div>
              </div>
          </div>

        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    game_csgo: state.game_csgo,
    game_dota: state.game_dota
  };
};


export default connect(mapStateToProps)(Game);
