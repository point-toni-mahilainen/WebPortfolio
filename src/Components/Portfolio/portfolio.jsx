import React, { Component, Fragment } from 'react';
import './portfolio.css';
import './theme.scss';
import Home from './Home/home';
import IAm from './IAm/iAm';
import ICan from './ICan/iCan';
import Questbook from './Questbook/questbook';
import Contact from './Contact/contact';
import AuthService from '../LoginHandle/AuthService';
import Axios from 'axios';
import Background from '../../Images/mainBackground.jpg';
import MobileBackground from '../../Images/mainBackgroundMobile.jpg';

class Portfolio extends Component {
    constructor() {
        super();
        this.state = {
            Profile: "",
            Content: "",
            Emails: "",
            Skills: "",
            QuestbookMessages: "",
            SocialMediaLinks: "",
            ThemeId: "",
            ProfilePicUrl: "",
            HomePicUrl: "",
            IamPicUrl: "",
            IcanPicUrl: "",
            QuestbookPicUrl: "",
            ContactPicUrl: ""
        }
        this.changeTheme = this.changeTheme.bind(this);
        this.getContent = this.getContent.bind(this);
        this.updateImageStates = this.updateImageStates.bind(this);
        this.Auth = new AuthService();
    }

    componentDidMount() {
        document.getElementById("backgroundWrapper").style.backgroundImage = "unset";
        // Classname to header
        let header = document.getElementById("header");
        if (window.screen.width >= 991) {
            header.style.background = "rgba(51,3,0,0.4)";
        } else {
            header.style.background = "rgba(51,3,0,0.6)";
        }

        // Re-position a footer
        let footer = document.getElementById("footer");
        if (!footer.classList.contains("relative")) {
            footer.className = "relative";
        }

        // Checks if user is already logged in and then sets users profile (or null) into state variable according to logged in status
        if (!this.Auth.loggedIn()) {
            this.setState({
                Profile: null
            });
        }
        else {
            try {
                const profile = this.Auth.getProfile()
                this.setState({
                    Profile: profile
                }, this.getContent);
            }
            catch (err) {
                this.Auth.logout()
            }
        }
    }

    changeTheme() {
        let backgroundWrapper = document.getElementById("backgroundWrapper");
        switch (this.state.ThemeId) {
            case 1:
                backgroundWrapper.classList.remove("dark");
                backgroundWrapper.classList.add("light");
                break;

            case 2:
                backgroundWrapper.classList.remove("light");
                backgroundWrapper.classList.add("dark");
                break;

            default:
                break;
        }
    }

    componentWillUnmount() {
        if ((window.screen.width > window.screen.height) && window.innerHeight <= 768) {       // Landscape
            document.getElementById("backgroundWrapper").style.backgroundImage = "url(" + MobileBackground + ")";
        } else if ((window.screen.width < window.screen.height) && window.innerWidth <= 768) {  // Portrait
            document.getElementById("backgroundWrapper").style.backgroundImage = "url(" + MobileBackground + ")";
        } else {
            document.getElementById("backgroundWrapper").style.backgroundImage = "url(" + Background + ")";
        }

        let backgroundWrapper = document.getElementById("backgroundWrapper");
        document.getElementById("footer").classList.add("transparent");
        backgroundWrapper.classList.remove("light");
        backgroundWrapper.classList.remove("dark");
    }

    // Build url for state of image depending on type ID
    updateImageStates(data) {
        let sasToken = "?" + this.Auth.getSas();
        for (let index = 0; index < data.length; index++) {
            let typeId = data[index].typeId;
            switch (typeId) {
                case 1:
                    this.setState({
                        ProfilePicUrl: data[index].url + sasToken
                    })
                    break;

                case 2:
                    this.setState({
                        HomePicUrl: data[index].url + sasToken
                    })
                    break;

                case 3:
                    this.setState({
                        IamPicUrl: data[index].url + sasToken
                    })
                    break;

                case 4:
                    this.setState({
                        IcanPicUrl: data[index].url + sasToken
                    })
                    break;

                case 5:
                    this.setState({
                        QuestbookPicUrl: data[index].url + sasToken
                    })
                    break;

                case 6:
                    this.setState({
                        ContactPicUrl: data[index].url + sasToken
                    })
                    break;

                default:
                    break;
            }
        }
    }

    // Get all content for portfolio
    getContent() {
        // Settings for requests
        const contentSettings = {
            url: 'https://webportfolioapi.azurewebsites.net/api/portfoliocontent/content/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const emailSettings = {
            url: 'https://webportfolioapi.azurewebsites.net/api/portfoliocontent/emails/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const skillsSettings = {
            url: 'https://webportfolioapi.azurewebsites.net/api/skills/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const questbookSettings = {
            url: 'https://webportfolioapi.azurewebsites.net/api/questbook/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const socialMediaSettings = {
            url: 'https://webportfolioapi.azurewebsites.net/api/socialmedia/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const imagesSettings = {
            url: 'https://webportfolioapi.azurewebsites.net/api/images/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        // Requests
        const contentGet = Axios(contentSettings);
        const emailGet = Axios(emailSettings);
        const skillsGet = Axios(skillsSettings);
        const questbookGet = Axios(questbookSettings);
        const socialMediaGet = Axios(socialMediaSettings);
        const imagesGet = Axios(imagesSettings);

        // Promises
        Promise.all([contentGet, emailGet, skillsGet, questbookGet, socialMediaGet, imagesGet])
            .then((responses) => {
                this.updateImageStates(responses[5].data);
                this.setState({
                    Content: responses[0].data[0],
                    Emails: responses[1].data,
                    Skills: responses[2].data,
                    QuestbookMessages: responses[3].data,
                    SocialMediaLinks: responses[4].data,
                    ThemeId: responses[0].data[0].themeId
                }, this.changeTheme)
            })
            .catch(errors => {
                console.log("Content error: " + errors[0]);
                console.log("Email error: " + errors[1]);
                console.log("Skills error: " + errors[2]);
                console.log("Questbook error: " + errors[3]);
                console.log("Social media error: " + errors[4]);
            })
    }

    render() {
        return (
            <Fragment>
                <main id="portfolio">
                    {/* Render a component when state(s) are not null */}
                    {/* Home */}
                    {this.state.Content.punchline ?
                        <Home
                            punchline={this.state.Content.punchline}
                            homePicUrl={this.state.HomePicUrl}
                        /> : null}
                    {/* I am */}
                    {this.state.Content && this.state.Emails ?
                        <IAm
                            content={this.state.Content}
                            emails={this.state.Emails}
                            profilePicUrl={this.state.ProfilePicUrl}
                            iamPicUrl={this.state.IamPicUrl}
                        /> : null}
                    {/* I can */}
                    {this.state.Skills ?
                        <ICan
                            skills={this.state.Skills}
                            icanPicUrl={this.state.IcanPicUrl}
                        /> : null}
                    {/* Questbook */}
                    {this.state.QuestbookMessages && this.state.Profile ?
                        <Questbook
                            messages={this.state.QuestbookMessages}
                            questbookPicUrl={this.state.QuestbookPicUrl}
                            userId={this.state.Profile.nameid}
                        /> : null}
                    {/* Contact */}
                    {this.state.SocialMediaLinks ?
                        <Contact
                            links={this.state.SocialMediaLinks}
                            contactPicUrl={this.state.ContactPicUrl}
                            email={this.state.Emails[0].emailAddress}
                        /> : null}
                </main>
            </Fragment>
        );
    }
}

export default Portfolio;