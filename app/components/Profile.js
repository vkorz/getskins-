import React from 'react';
import { connect } from 'react-redux';
import { changeTradelink } from '../actions/user';
import Messages from './Messages';

class Profile extends React.Component {
  constructor(props) {
    super(props);
    this.state = { link: this.props.user.trade_link };
  }

  _handleChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  _handleChangeTradelink(event) {
    event.preventDefault();
    this.props.dispatch(changeTradelink(this.state.link));
  }

  render() {
    var { user } = this.props;
    return (
      <div className="container">
        <h3>Profile</h3>
        <Messages messages={this.props.messages}/>
        <span>Name: {user.username}</span>
        <br/>
        <img src={user.avatar} alt={user.username} title={user.username}/>
        <br/>
        <form onSubmit={this._handleChangeTradelink.bind(this)}>
          <label htmlFor="link">Link</label>
          <input type="text" name="link" id="link" value={this.state.link} onChange={this._handleChange.bind(this)} autoFocus/>
          <br/>
          <button type="submit">Send</button>
        </form>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    messages: state.messages,
    user: state.user
  };
};

export default connect(mapStateToProps)(Profile);
