import React, { Component } from 'react';
import './questbook.css';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';
import Axios from 'axios';

class Questbook extends Component {
    constructor(props) {
        super(props);
        this.state = {
            Firstname: "",
            Lastname: "",
            Company: "",
            Message: "",
            ShowModal: false
        }
        this.closeNewMessageModal = this.closeNewMessageModal.bind(this);
        this.contentToDatabase = this.contentToDatabase.bind(this);
        this.convertDate = this.convertDate.bind(this);
        this.deleteMessage = this.deleteMessage.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);
        this.openNewMessageModal = this.openNewMessageModal.bind(this);
    }

    // Close modal window  for adding a new message
    closeNewMessageModal() {
        this.setState({
            ShowModal: false
        });
    }

    // New message to database
    contentToDatabase() {
        // Timestamp to message
        let now = Date.now();
        let timestamp = new Date(now);

        // Object for request
        const messageObj = {
            VisitorFirstname: this.state.Firstname,
            VisitorLastname: this.state.Lastname,
            VisitorCompany: this.state.Company,
            Message: this.state.Message,
            VisitationTimestamp: timestamp.toISOString()
        }

        // Settings for request
        const settings = {
            url: 'https://localhost:5001/api/questbook/' + this.props.userId,
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: messageObj
        };

        // Request
        Axios(settings)
            .then((response) => {
                console.log("Message post: " + response.data);
                alert("Message has sent succesfully to portfolio!");
            })
            .catch(error => {
                console.log("Message post error: " + error.data);
                alert("Problems!!")
            })
    }

    // Converts timestamp to different datetime format
    convertDate(date) {
        // Convert datetime to date format
        let datetime = new Date(date + 'Z');
        let formatedDate = datetime.toLocaleDateString('fi-FI', {
            day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric'
        });
        return formatedDate;
    }

    // Delete message from database
    deleteMessage(e) {
        // Message ID from the tables hidden column
        let buttonId = e.target.id;
        let buttonIdLength = buttonId.length;
        let number = buttonId.slice(9, buttonIdLength)
        let messageId = document.getElementById("tdMessageId" + number).textContent;

        // Settings for request
        const settings = {
            url: 'https://localhost:5001/api/questbook/' + messageId,
            method: 'DELETE',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        };

        // Request
        Axios(settings)
            .then((response) => {
                console.log("Message delete: " + response.data);
                alert("Message has deleted succesfully!");
                window.location.reload();
            })
            .catch(error => {
                console.log("Message delete error: " + error.data);
                alert("Problems!!")
            })
    }

    handleSubmit() {
        this.contentToDatabase();
    }

    // Sets modal window input values to states
    handleValueChange(e) {
        let input = e.target.id;

        // Depending on input, update the right state
        switch (input) {
            case "questFirstnameInput":
                this.setState({
                    Firstname: e.target.value
                })
                break;

            case "questLastnameInput":
                this.setState({
                    Lastname: e.target.value
                })
                break;

            case "questCompanyInput":
                this.setState({
                    Company: e.target.value
                })
                break;

            case "questMessageTextarea":
                this.setState({
                    Message: e.target.value
                })
                break;

            default:
                break;
        }
    }

    // Open modal window for adding a new message
    openNewMessageModal() {
        this.setState({
            ShowModal: true
        });
    }

    render() {
        // Background styling object
        const background = {
            background: "url(" + this.props.questbookPicUrl + ")",
            backgroundSize: "100% 100%"
        }

        // Headers for table
        let thead = <tr>
            <th hidden></th>
            <th>Visitor name</th>
            <th>Visitor company</th>
            <th>Date/Time</th>
            <th>Message</th>
            <th className="deleteBtnTd"></th>
        </tr>;

        // Body for table
        let tbody = [];
        if (this.props.messages.length > 0) {
            for (let index = 0; index < this.props.messages.length; index++) {
                const element = this.props.messages[index];
                // Generate ID for message ID td and delete button with running number
                let tdId = "tdMessageId" + index;
                let buttonId = "removeBtn" + index;
                tbody.push(
                    <tr key={element.messageId}>
                        <td id={tdId} hidden>{element.messageId}</td>
                        <td>{element.firstname + " " + element.lastname}</td>
                        <td>{element.company}</td>
                        <td>{this.convertDate(element.visitationTimestamp)}</td>
                        <td>{element.message}</td>
                        <td className="deleteBtnTd">
                            <button className="removeBtn">
                                <span id={buttonId} className="fas fa-trash-alt" onClick={this.deleteMessage}></span>
                            </button>
                        </td>
                    </tr>
                );
            }
        }

        return (
            <section id="questbook" className="questbook" style={background}>
                <Container>
                    <Row>
                        <Col id="questbookCol">
                            <div id="deleteButtondiv">
                                <button id="newMessageBtn" onClick={this.openNewMessageModal}>NEW MESSAGE</button>
                            </div>
                            <table id="messageTbl">
                                <thead>{thead}</thead>
                                <tbody>{tbody}</tbody>
                            </table>
                        </Col>
                    </Row>
                </Container>

                {/* Modal window for adding a new skill */}
                <Modal id="newQuestbookMessageModal" show={this.state.ShowModal} onHide={this.closeNewMessageModal} centered>
                    <Modal.Header>
                        <Modal.Title>
                            <div id="headerDiv">
                                New message
                            </div>
                        </Modal.Title>
                    </Modal.Header>
                    <form onSubmit={this.handleSubmit}>
                        <Modal.Body>
                            <div id="formDiv">
                                <input id="questFirstnameInput" className="questbookMessageInput" type="text" placeholder="Firstname" onChange={this.handleValueChange}></input><br />
                                <input id="questLastnameInput" className="questbookMessageInput" type="text" placeholder="Lastname" onChange={this.handleValueChange}></input><br />
                                <input id="questCompanyInput" className="questbookMessageInput" type="text" placeholder="Company" onChange={this.handleValueChange}></input><br />
                                <textarea id="questMessageTextarea" className="questbookMessageInput" type="text" placeholder="Message" onChange={this.handleValueChange}></textarea><br />
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <div id="questbookMessageModalBtnDiv">
                                <button id="sendQuestbookMessageBtn" type="submit">SEND</button>
                                <button id="cancelQuestbookMessageBtn" type="button" onClick={this.closeNewMessageModal}>CANCEL</button>
                            </div>
                        </Modal.Footer>
                    </form>
                </Modal>
            </section>
        );
    }
}

export default Questbook;