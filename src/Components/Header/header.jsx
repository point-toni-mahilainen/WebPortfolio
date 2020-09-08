import React, { Component } from 'react';
import './header.css';
import { Navbar, Modal, Nav } from 'react-bootstrap';
import md5 from 'md5';
import AuthService from '../LoginHandle/AuthService';
import { withRouter } from 'react-router-dom';
import logo from '../../Images/logo.png';

class Header extends Component {
    constructor() {
        super();
        this.state = {
            Username: "",
            Password: "",
            ShowModal: false
        }
        this.closeSignInModal = this.closeSignInModal.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);
        this.openSignInModal = this.openSignInModal.bind(this);
        this.toEditPortfolio = this.toEditPortfolio.bind(this);
        this.toPortfolio = this.toPortfolio.bind(this);
        this.Auth = new AuthService();
    }

    componentDidMount() {
        // Checks if user is already logged in and then replace the path according to logged in status
        if (!this.Auth.loggedIn()) {
            this.props.history.replace('/')
        }
        else {
            try {
                // If user logins for the first time, edit portfolio page is rendered
                if (this.Auth.getFirstLoginMark() !== null | this.Auth.getEditingMark() !== null) {
                    this.props.history.replace('/editportfolio')
                } else {
                    this.props.history.replace('/portfolio')
                }
            }
            catch (err) {
                this.Auth.logout()
                this.props.history.replace('/')
            }
        }
    }

    closeSignInModal() {
        this.setState({
            ShowModal: false
        });
    }

    handleLogout() {
        this.Auth.logout();
        // Remove a mark for editing and first login
        this.Auth.removeEditingMark();
        this.Auth.removeFirstLoginMark();
        this.props.history.replace('/')
    }

    handleSubmit(e) {
        e.preventDefault();
        this.Auth.login(this.state.Username, this.state.Password)
            .then(res => {
                // If login is succeeded, clear username and password states
                this.setState({
                    Username: "",
                    Password: ""
                });
                this.props.history.replace('/portfolio');
                this.closeSignInModal();
            })
            .catch(err => {
                alert(err);
            })
    }

    handleValueChange(input) {
        // Depending input field, the right state will be updated
        let inputId = input.target.id;

        switch (inputId) {
            case "usernameInput":
                this.setState({
                    Username: input.target.value
                });
                break;

            case "passwordInput":
                this.setState({
                    Password: md5(input.target.value)
                });
                break;

            default:
                break;
        }
    }

    openSignInModal() {
        this.setState({
            ShowModal: true
        });
    }

    toPortfolio() {
        // Remove a mark for editing and first login
        this.Auth.removeEditingMark();
        this.Auth.removeFirstLoginMark();
        this.Auth.removeBasicsSavedMark();
        this.Auth.removeSkillsAddedMark();
        this.Auth.removeImagesAddedMark();
        this.props.history.replace('/portfolio');
    }

    toEditPortfolio() {
        // Add a mark for editing
        this.Auth.setEditingMark();
        this.props.history.replace('/editportfolio');
    }

    render() {
        // Depending on logged in status, right header is rendered
        if (this.Auth.loggedIn()) {
            if (this.props.location.pathname === "/editportfolio") {
                return (
                    <header id="header">
                        <Navbar>
                            <Navbar.Brand href="/" className="mr-auto">
                                <img src={logo} alt="WebPortfolio logo" />
                            </Navbar.Brand>
                            <button id="backToPortfolioBtn" onClick={this.toPortfolio}><b>BACK TO PORTFOLIO</b></button>
                            <span id="or">or</span>
                            <button id="editPortfolioLogOutBtn" onClick={this.handleLogout}><b>LOG OUT</b></button>
                        </Navbar>
                    </header>
                );
            } else {
                return (
                    <header id="header">
                        <Navbar>
                            <Navbar.Brand href="/" className="mr-auto">
                                <img src={logo} alt="WebPortfolio logo" />
                            </Navbar.Brand>
                            <Nav className="mr-auto">
                                <Nav.Item>
                                    <Nav.Link className="navLink" href="#home"><b>HOME</b></Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link className="navLink" href="#iAm"><b>I AM</b></Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link className="navLink" href="#iCan"><b>I CAN</b></Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link className="navLink" href="#questbook"><b>QUESTBOOK</b></Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                    <Nav.Link className="navLink" href="#contact"><b>CONTACT</b></Nav.Link>
                                </Nav.Item>
                            </Nav>
                            <button id="toEditPortfolioBtn" onClick={this.toEditPortfolio}><b>EDIT PORTFOLIO</b></button>
                            <span id="or">or</span>
                            <button id="portfolioLogOutBtn" onClick={this.handleLogout}><b>LOG OUT</b></button>
                        </Navbar>
                    </header>
                );
            }
        } else {
            return (
                <header id="header">
                    <Navbar variant="dark">
                        <Navbar.Brand className="mr-auto">
                            <img src={logo} alt="WebPortfolio logo" />
                        </Navbar.Brand>
                        <button id="signInBtn" onClick={this.openSignInModal}><b>SIGN IN</b></button>
                    </Navbar>

                    {/* Modal window for signing in */}
                    <Modal show={this.state.ShowModal} onHide={this.closeSignInModal} centered>
                        <Modal.Header id="signInModalHeader" closeButton>
                            <Modal.Title>Sign In</Modal.Title>
                        </Modal.Header>
                        <form onSubmit={this.handleSubmit}>
                            <Modal.Body id="signInModalBody">
                                Username <br />
                                <input id="usernameInput" type="text" onChange={this.handleValueChange} /><br />
                                Password <br />
                                <input id="passwordInput" type="password" onChange={this.handleValueChange} /><br />
                            </Modal.Body>
                            <Modal.Footer id="signInModalFooter">
                                <button id="signInModalBtn" type="submit">Sign In</button>
                                <button id="cancelSignIinModalBtn" type="button" onClick={this.closeSignInModal}>Cancel</button>
                            </Modal.Footer>
                        </form>
                    </Modal>
                </header>
            );
        }
    }
}

export default withRouter(Header);