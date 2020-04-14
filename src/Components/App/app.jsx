import React, { Component, Fragment } from 'react';
import { BrowserRouter as Router, Link, Route, Switch } from 'react-router-dom';
import './app.css';
import Main from '../Main/main';
import HeaderLoggedOut from '../Header/HeaderLoggedOut/headerLoggedOut';
import HeaderLoggedIn from '../Header/HeaderLoggedIn/headerLoggedIn';
import Footer from '../Footer/footer';
import EditPortfolio from '../EditPortfolio/editPortfolio';


class App extends Component {
    render() {
        let temp = 1;
        if (temp === 1 /* jos ei kirjauduttu sisään */) {
            return (
                <Fragment>
                    <HeaderLoggedOut />
                    <EditPortfolio />
                    <Footer />
                </Fragment>
            );
        } else {
            return (
                <div className="app">
                    <Router>
                        <nav id="nav" className="navbar navbar-expand-lg" onMouseEnter={this.heightUp} onMouseLeave={this.heightDown}>
                            <ul className="navbar-nav mr-auto ml-auto">
                                <li><Link id="etusivuLink" to={"/"} className="nav-link">Main</Link></li>
                            </ul>
                        </nav>
                        <Switch>
                            <Route exact path="/" component={Main} />
                        </Switch>
                    </Router>
                </div>
            );
        }

    }
}

export default App;