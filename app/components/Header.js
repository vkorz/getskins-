import React from 'react';

class Header extends React.Component {
  render() {
    return (
      <header className="L-b">
        <div className="logo">
          <h1><span>A</span>VAPA.COM</h1>
          <h2>МЫ подкручиваем азазаза</h2>
          <a href="#">МЕНЮ</a>
        </div>

        <div className="Block-B">
          <div className="gradient"></div>
          <div className="button">
            <img src="/img/csgo3.jpeg" className="block"/>
            <h1 className="L-r">CSGO</h1>
          </div>  

          <div className="button">
            <h1 className="L-r">CSGO</h1>
            <img src="/img/dota.jpeg" className="block"/>
            <div className="noActive block"></div>
          </div>

          <div className="gradient"></div>
        </div>

        <div className="ProfileSteam">
          <div className="SteamInfo">
            <img src="/img/avatar.jpeg" className="avatar"/>          
            <span className="Name" >USER NAME</span>
            <span className="Balance">Баланс: <b>2500</b><img src="/img/money.png"/></span>
            <a href="/logout" className="logOut">Выйти</a>
          </div>
          <img src="/img/avatar.jpeg" className="avatar"/>
        </div>
      </header>
    );
  }
}

export default Header;
