import React from 'react';
import NotFound from './NotFound';
import Header from './Header';

class App extends React.Component {
  render() {
    return (
      <div className={this.props.game}>
        <Header />
        <div className="Content L-b">
          <div className="leftContent">
            <div className="blockMenu">
              <ul>
                <a href="#">
                  <li className="active">
                    <div className="gradient"></div>
                    <i className="fa fa-rouble"></i>
                    <p>Магазин</p>
                    <div className="gradient"></div>
                  </li>
                </a>
                <a href="#">
                  <li>
                    <div className="gradient"></div>
                    <i className="fa fa-rouble"></i>
                    <p>Магазин</p>
                    <div className="gradient"></div>
                  </li>
                </a>
              </ul>
            </div>
            <div className="marketingBlock">
              <div className="gradient"></div>
              <div className="info"></div>
              <div className="gradient"></div>
            </div>
          </div>
          <div className="rightContent">
            {this.props.children && React.cloneElement(this.props.children, { gameName: this.props.game })}
          </div>
        </div>
      </div> 
    );
  }
}

export default App;
