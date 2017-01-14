import React from 'react';
import { connect } from 'react-redux';

class Profile extends React.Component {
  render() {
    return (
    	<div className="blockGame">
	        <div className="header">
	          <div className="contentP">
	            <h1 className="L-r">Мой профиль</h1>
	          </div>
	        </div>
	        <div className="gradient"></div>
	        <div className="contentP">    	
	    		<div className="profile">
	    			<img href="/img/avatar.jpeg" className="avatar"/>
	    			<div className="infoProfile">
	    				<div className="block"> 
	    					<span>Макс. выйгрыш</span>
	    					<span>120 300 333 руб
	    						<hr/>
	    					</span>
	    				</div>
	    				<div className="block"> 
	    					<span>Всего игр</span>
	    					<span>120 300 333 руб

	    					</span>
	    				</div>
	    				<div className="block"> 
	    					<span>Всего достижения</span>
	    					<span>120 300 333 руб

	    					</span>
	    				</div>    				    				
	    			</div>
	    			<div className="name-user">
	    				<span>
	    					USER_NAME
	    				</span>
	    			</div>
	    			<div className="linkSteam">
	    				<h1>Ссылка STEAM на обмен</h1>
	    				<div>
	    					<form>
		    					<input type="text" placeholder="Введите ссылку на обмен"/>
		    					<input type="button"/>
		    				</form>	
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
    game: state.game
  };
};

export default connect(mapStateToProps)(Profile);