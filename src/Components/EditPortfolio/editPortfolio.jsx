import React, { Component, Fragment } from 'react';
import './editPortfolio.css';
import { Container, Row, Col, Modal } from 'react-bootstrap';
import AuthService from '../LoginHandle/AuthService';
import Axios from 'axios';
import md5 from 'md5';
import background from '../../Images/mainBackground.jpg';

class PictureEdit extends Component {
    constructor(props) {
        super();
        this.state = {
            ProfilePicObj: null,
            HomePicObj: null,
            IamPicObj: null,
            IcanPicObj: null,
            QuestbookPicObj: null,
            ContactPicObj: null,
            ProfilePicUrl: props.profilePicUrl,
            HomePicUrl: props.homePicUrl,
            IamPicUrl: props.iamPicUrl,
            IcanPicUrl: props.icanPicUrl,
            QuestbookPicUrl: props.questbookPicUrl,
            ContactPicUrl: props.contactPicUrl,
            CurrentProfilePic: "",
            CurrentHomePic: "",
            CurrentIamPic: "",
            CurrentIcanPic: "",
            CurrentQuestbookPic: "",
            CurrentContactPic: "",
            FirstUpload: false,
            CreateSpaceResponse: "",
            SendPicsResponse: "",
            DeletePicsResponse: "",
            ShowPreviewModal: false,
            UrlForModal: ""
        }
        this.checkStatus = this.checkStatus.bind(this);
        this.closeImagePreviewModal = this.closeImagePreviewModal.bind(this);
        this.deletePicturesFromAzure = this.deletePicturesFromAzure.bind(this);
        this.filenameToInput = this.filenameToInput.bind(this);
        this.getPictureNames = this.getPictureNames.bind(this);
        this.getRightFileInput = this.getRightFileInput.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);
        this.handleImageSave = this.handleImageSave.bind(this);
        this.handleAzureStorage = this.handleAzureStorage.bind(this);
        this.createSpaceForPictures = this.createSpaceForPictures.bind(this);
        this.imageUrlsFromDatabase = this.imageUrlsFromDatabase.bind(this);
        this.imageUrlToDatabase = this.imageUrlToDatabase.bind(this);
        this.openImagePreviewModal = this.openImagePreviewModal.bind(this);
        this.sendPicturesToAzure = this.sendPicturesToAzure.bind(this);
        this.updateFilenameStates = this.updateFilenameStates.bind(this);
        this.Auth = new AuthService();
    }

    componentDidMount() {
        // If the first login mark exists, the request is not sent
        this.getPictureNames();
        if (this.Auth.getFirstLoginMark()) {
            this.imageUrlsFromDatabase();
        }
    }

    // Close modal window for image preview
    closeImagePreviewModal() {
        this.setState({
            ShowPreviewModal: false
        });
    }

    // Open modal window for image preview
    openImagePreviewModal(event) {
        // The URL of the image to preview
        switch (event.target.id) {
            case "profilePreviewBtn":
                this.setState({
                    UrlForModal: this.state.ProfilePicUrl
                })
                break;

            case "homePreviewBtn":
                this.setState({
                    UrlForModal: this.state.HomePicUrl
                })
                break;

            case "iamPreviewBtn":
                this.setState({
                    UrlForModal: this.state.IamPicUrl
                })
                break;

            case "icanPreviewBtn":
                this.setState({
                    UrlForModal: this.state.IcanPicUrl
                })
                break;

            case "questbookPreviewBtn":
                this.setState({
                    UrlForModal: this.state.QuestbookPicUrl
                })
                break;

            case "contactPreviewBtn":
                this.setState({
                    UrlForModal: this.state.ContactPicUrl
                })
                break;

            default:
                break;
        }
        this.setState({
            ShowPreviewModal: true
        });
    }

    // Get names for users current pictures and sets them to state variables
    getPictureNames() {
        let userId = this.props.userId;
        let sasToken = "sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
        let uri = "https://webportfolio.file.core.windows.net/images/" + userId + "?restype=directory&comp=list&" + sasToken;
        const settings = {
            url: uri,
            method: 'GET',
            headers: {
                "x-ms-date": "now",
                "x-ms-version": "2019-07-07"
            }
        }

        Axios(settings)
            .then(response => {
                // Response from Azure is in XML format so it needs to parse from text string into an XML DOM object 
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(response.data, "text/xml");
                // Update filename -states with function
                for (let index = 0; index < 6; index++) {
                    // If a user doesn't have any images yet, only a message to the log will be written
                    if (xmlDoc.getElementsByTagName("Name")[index] !== undefined) {
                        let filename = xmlDoc.getElementsByTagName("Name")[index].childNodes[0].nodeValue;
                        this.updateFilenameStates(filename);
                    } else {
                        console.log("getPictureNames(): All the image names has loaded.");
                        // Little bit of math so that the loop not loops unnecessarily
                        let currentIndex = index;
                        index = index + (6 - currentIndex);
                    }
                }
            })
            .catch(err => {
                console.log("getPictureNames error: " + err);
            })
    }

    // Set a chosen filename to the value of file input
    filenameToInput(input) {
        let path = input.value;
        let splittedPath = path.split("\\");
        let filename = splittedPath[splittedPath.length - 1];
        document.getElementById(input.id + "Lbl").innerHTML = filename;
    }

    // Update the filenames for the current picture states
    updateFilenameStates(filename) {
        let filenameSplitted = filename.split(".")
        switch (filenameSplitted[0]) {
            case "profile":
                this.setState({
                    CurrentProfilePic: filename
                })
                break;

            case "home":
                this.setState({
                    CurrentHomePic: filename
                })
                break;

            case "iam":
                this.setState({
                    CurrentIamPic: filename
                })
                break;

            case "ican":
                this.setState({
                    CurrentIcanPic: filename
                })
                break;

            case "questbook":
                this.setState({
                    CurrentQuestbookPic: filename
                })
                break;

            case "contact":
                this.setState({
                    CurrentContactPic: filename
                })
                break;

            default:
                break;
        }
    }

    // Sets states when the file inputs values change
    handleValueChange(input) {
        // Depending input field, the right state will be updated
        let inputId = input.target.id;
        // File input to the filenameToInput -function
        let fileInput = document.getElementById(inputId);
        this.filenameToInput(fileInput);
        // Name of the file is always the same depending on which picture is at issue
        // Only type of the file depends on users file
        let filename = "";
        let file = document.getElementById(inputId).files[0];
        // If a user press the cancel button on a "choose file"-window (file === undefined), 
        // a real name of the current picture will be the text content of a file inputs label
        if (file) {
            let filenameArray = file.name.split(".");
            console.log("filenameArray: " + file.name);
            let fileType = "." + filenameArray[1];
            let fileSize = file.size;
            // Convert a file to file-like object (raw data) -- from start (0) to the end of the file (fileSize)
            let blob = new Blob([file].slice(0, fileSize));
            // User ID
            let userId = this.props.userId;
            // New instance of FileReader
            let reader = new FileReader();
            // Url for image
            let imageUrl = "";
            // Read content of a blob and depending the input, set it and image url to the right state variables
            reader.readAsArrayBuffer(blob);

            switch (inputId) {
                case "profilePicInput":
                    filename = "profile" + fileType;
                    imageUrl = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename;
                    reader.onloadend = (evt) => {
                        if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                            // Create an object and set it to the object array state variable
                            let profilePicObj = {
                                RealFileName: file.name,
                                CurrentFilename: this.state.CurrentProfilePic,
                                NewFilename: filename,
                                FileSize: fileSize,
                                BinaryString: evt.target.result
                            };
                            this.setState({
                                ProfilePicUrl: imageUrl,
                                ProfilePicObj: profilePicObj
                            });
                        };
                    }
                    break;

                case "homePicInput":
                    filename = "home" + fileType;
                    imageUrl = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename;
                    reader.onloadend = (evt) => {
                        if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                            let homePicObj = {
                                RealFileName: file.name,
                                CurrentFilename: this.state.CurrentHomePic,
                                NewFilename: filename,
                                FileSize: fileSize,
                                BinaryString: evt.target.result
                            };
                            this.setState({
                                HomePicUrl: imageUrl,
                                HomePicObj: homePicObj
                            });
                        };
                    }
                    break;

                case "iamPicInput":
                    filename = "iam" + fileType;
                    imageUrl = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename;
                    reader.onloadend = (evt) => {
                        if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                            let iamPicObj = {
                                RealFileName: file.name,
                                CurrentFilename: this.state.CurrentIamPic,
                                NewFilename: filename,
                                FileSize: fileSize,
                                BinaryString: evt.target.result
                            };
                            this.setState({
                                IamPicUrl: imageUrl,
                                IamPicObj: iamPicObj
                            });
                        };
                    }
                    break;

                case "icanPicInput":
                    filename = "ican" + fileType;
                    imageUrl = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename;
                    reader.onloadend = (evt) => {
                        if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                            let icanPicObj = {
                                RealFileName: file.name,
                                CurrentFilename: this.state.CurrentIcanPic,
                                NewFilename: filename,
                                FileSize: fileSize,
                                BinaryString: evt.target.result
                            };
                            this.setState({
                                IcanPicUrl: imageUrl,
                                IcanPicObj: icanPicObj
                            });
                        };
                    }
                    break;

                case "questbookPicInput":
                    filename = "questbook" + fileType;
                    imageUrl = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename;
                    reader.onloadend = (evt) => {
                        if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                            let questbookPicObj = {
                                RealFileName: file.name,
                                CurrentFilename: this.state.CurrentQuestbookPic,
                                NewFilename: filename,
                                FileSize: fileSize,
                                BinaryString: evt.target.result
                            };
                            this.setState({
                                QuestbookPicUrl: imageUrl,
                                QuestbookPicObj: questbookPicObj
                            });
                        };
                    }
                    break;

                case "contactPicInput":
                    filename = "contact" + fileType;
                    imageUrl = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename;
                    reader.onloadend = (evt) => {
                        if (evt.target.readyState === FileReader.DONE) { // DONE == 2
                            let contactPicObj = {
                                RealFileName: file.name,
                                CurrentFilename: this.state.CurrentContactPic,
                                NewFilename: filename,
                                FileSize: fileSize,
                                BinaryString: evt.target.result
                            };
                            this.setState({
                                ContactPicUrl: imageUrl,
                                ContactPicObj: contactPicObj
                            });
                        };
                    }
                    break;

                default:
                    break;
            }
        } else {
            switch (inputId) {
                case "profilePicInput":
                    document.getElementById(inputId + "Lbl").textContent = this.state.ProfilePicObj.RealFileName;
                    break;

                case "homePicInput":
                    document.getElementById(inputId + "Lbl").textContent = this.state.HomePicObj.RealFileName;
                    break;

                case "iamPicInput":
                    document.getElementById(inputId + "Lbl").textContent = this.state.IamPicObj.RealFileName;
                    break;

                case "icanPicInput":
                    document.getElementById(inputId + "Lbl").textContent = this.state.IcanPicObj.RealFileName;
                    break;

                case "questbookPicInput":
                    document.getElementById(inputId + "Lbl").textContent = this.state.QuestbookPicObj.RealFileName;
                    break;

                case "contactPicInput":
                    document.getElementById(inputId + "Lbl").textContent = this.state.ContactPicObj.RealFileName;
                    break;

                default:
                    break;
            }
        }
    }

    handleImageSave(event) {
        event.preventDefault();
        let btnId = event.target.id;
        let imageObj = "";
        // Callback for setState
        let callbackFunctions = (imageObjForDatabase, imageObjForAzure, saveBtnId) => {
            this.imageUrlToDatabase(imageObjForDatabase);
            this.handleAzureStorage(imageObjForAzure, saveBtnId);
        };

        switch (btnId) {
            case "profileSaveBtn":
                // If the user has not selected an image, the alert will be displayed
                if (this.state.ProfilePicObj) {
                    // Create an object for the request
                    imageObj = {
                        Profile: [{
                            TypeID: 1,
                            Url: this.state.ProfilePicUrl
                        }]
                    }

                    // If the props.---PicUrl is empty, it is the first upload on that type of the image --> state.FirstUpload === true/false
                    if (!this.props.profilePicUrl) {
                        this.setState({
                            FirstUpload: true
                        }, () => callbackFunctions(imageObj, this.state.ProfilePicObj, btnId))
                    } else {
                        this.setState({
                            FirstUpload: false
                        }, () => callbackFunctions(imageObj, this.state.ProfilePicObj, btnId))
                    }
                } else {
                    alert("Please choose the profile image first.")
                }
                break;

            case "homeSaveBtn":
                if (this.state.HomePicObj) {
                    imageObj = {
                        Home: [{
                            TypeID: 2,
                            Url: this.state.HomePicUrl
                        }]
                    }

                    if (!this.props.homePicUrl) {
                        this.setState({
                            FirstUpload: true
                        }, () => callbackFunctions(imageObj, this.state.HomePicObj, btnId))
                    } else {
                        this.setState({
                            FirstUpload: false
                        }, () => callbackFunctions(imageObj, this.state.HomePicObj, btnId))
                    }
                } else {
                    alert("Please choose the image for the 'Home'-section first.")
                }
                break;

            case "iamSaveBtn":
                if (this.state.IamPicObj) {
                    imageObj = {
                        Iam: [{
                            TypeID: 3,
                            Url: this.state.IamPicUrl
                        }]
                    }

                    if (!this.props.iamPicUrl) {
                        this.setState({
                            FirstUpload: true
                        }, () => callbackFunctions(imageObj, this.state.IamPicObj, btnId))
                    } else {
                        this.setState({
                            FirstUpload: false
                        }, () => callbackFunctions(imageObj, this.state.IamPicObj, btnId))
                    }
                } else {
                    alert("Please choose the image for the 'I am'-section first.")
                }
                break;

            case "icanSaveBtn":
                if (this.state.IcanPicObj) {
                    imageObj = {
                        Ican: [{
                            TypeID: 4,
                            Url: this.state.IcanPicUrl
                        }]
                    }

                    if (!this.props.icanPicUrl) {
                        this.setState({
                            FirstUpload: true
                        }, () => callbackFunctions(imageObj, this.state.IcanPicObj, btnId))
                    } else {
                        this.setState({
                            FirstUpload: false
                        }, () => callbackFunctions(imageObj, this.state.IcanPicObj, btnId))
                    }
                } else {
                    alert("Please choose the image for the 'I can'-section first.")
                }
                break;

            case "questbookSaveBtn":
                if (this.state.QuestbookPicObj) {
                    imageObj = {
                        Questbook: [{
                            TypeID: 5,
                            Url: this.state.QuestbookPicUrl
                        }]
                    }

                    if (!this.props.questbookPicUrl) {
                        this.setState({
                            FirstUpload: true
                        }, () => callbackFunctions(imageObj, this.state.QuestbookPicObj, btnId))
                    } else {
                        this.setState({
                            FirstUpload: false
                        }, () => callbackFunctions(imageObj, this.state.QuestbookPicObj, btnId))
                    }
                } else {
                    alert("Please choose the image for the 'Guestbook'-section first.")
                }
                break;

            case "contactSaveBtn":
                if (this.state.ContactPicObj) {
                    imageObj = {
                        Contact: [{
                            TypeID: 6,
                            Url: this.state.ContactPicUrl
                        }]
                    }

                    if (!this.props.contactPicUrl) {
                        this.setState({
                            FirstUpload: true
                        }, () => callbackFunctions(imageObj, this.state.ContactPicObj, btnId))
                    } else {
                        this.setState({
                            FirstUpload: false
                        }, () => callbackFunctions(imageObj, this.state.ContactPicObj, btnId))
                    }
                } else {
                    alert("Please choose the image for the 'Contact'-section first.")
                }
                break;

            default:
                break;
        }
    }

    // Sends the image URL to the database
    imageUrlToDatabase(imageObj) {
        let userId = this.props.userId;
        let settings = "";

        // Settings for axios requests
        settings = {
            url: 'https://localhost:5001/api/images/' + userId,
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: imageObj
        };

        Axios(settings)
            .then((response) => {
                if (response.status >= 200 && response.status < 300) {
                    console.log("Save URLs: " + response.data);
                } else {
                    console.log("Save URLs error: " + response.data);
                }
            })
    }

    // Image URLs from the database for image previews when a user has logged in at the first time. Otherwise URLs came from props
    imageUrlsFromDatabase() {
        let userId = this.props.userId;

        // Settings for axios requests
        const imagesSettings = {
            url: 'https://localhost:5001/api/images/' + userId,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        Axios(imagesSettings)
            .then((response) => {
                // Image URLs to the states
                for (let index = 0; index < response.data.length; index++) {
                    const element = response.data[index];
                    switch (element.typeId) {
                        case 1:
                            this.setState({
                                ProfilePicUrl: element.url
                            })
                            break;

                        case 2:
                            this.setState({
                                HomePicUrl: element.url
                            })
                            break;

                        case 3:
                            this.setState({
                                IamPicUrl: element.url
                            })
                            break;

                        case 4:
                            this.setState({
                                IcanPicUrl: element.url
                            })
                            break;

                        case 5:
                            this.setState({
                                QuestbookPicUrl: element.url
                            })
                            break;

                        case 6:
                            this.setState({
                                ContactPicUrl: element.url
                            })
                            break;

                        default:
                            break;
                    }
                }
            })
            .catch(error => {
                console.log("Save URL's error: " + error);
            })
    }

    getRightFileInput(btnId) {
        let name = btnId.split("SaveBtn");
        return name[0] + "PicInputLbl";
    }

    /* 
        Handles the upload of an image to the Azure

        When it's not about the first load of that type of picture (e.g., first load of the profile image),
        the delete function is called and then the normal POST to the Azure File Storage
    */
    async handleAzureStorage(picObj, btnId) {
        if (this.state.FirstUpload) {
            // Other Azure functions
            await this.sendPicturesToAzure(picObj);

            // If every responses has succeeded - "Images added succesfully!" -alert will be showed
            if (this.checkStatus(this.state.CreateSpaceResponse) &&
                this.checkStatus(this.state.SendPicsResponse)) {
                // Green color to the save button indicates the succesfull image upload
                document.getElementById(this.getRightFileInput(btnId)).classList.add("saveSuccess");
                // Name of the users images to the states in case of the user wants to load same type of the image without page reload
                this.getPictureNames();
                setTimeout(
                    () => { document.getElementById(this.getRightFileInput(btnId)).classList.remove("saveSuccess") }
                    , 8000);
            } else {
                // Red color to the save button indicates the unsuccesfull image upload
                document.getElementById(this.getRightFileInput(btnId)).classList.add("saveNotSuccess");
                setTimeout(
                    () => { document.getElementById(this.getRightFileInput(btnId)).classList.remove("saveNotSuccess") }
                    , 8000);
            }
        } else {
            await this.deletePicturesFromAzure(picObj);

            // Other Azure functions
            await this.sendPicturesToAzure(picObj);

            // If every responses has succeeded - "Images added succesfully!" -alert will be showed
            if (this.checkStatus(this.state.DeletePicsResponse) &&
                this.checkStatus(this.state.SendPicsResponse)) {
                // Green color to the save button indicates the succesfull image upload
                document.getElementById(this.getRightFileInput(btnId)).classList.add("saveSuccess");
                // Name of the users images to the states in case of the user wants to load same type of the image without page reload
                this.getPictureNames();
                setTimeout(
                    () => { document.getElementById(this.getRightFileInput(btnId)).classList.remove("saveSuccess") }
                    , 8000);
            } else {
                // Red color to the save button indicates the unsuccesfull image upload
                document.getElementById(this.getRightFileInput(btnId)).classList.add("saveNotSuccess");
                setTimeout(
                    () => { document.getElementById(this.getRightFileInput(btnId)).classList.remove("saveNotSuccess") }
                    , 8000);
            }
        }
    }

    // Deletes the image from Azure File Storage
    async deletePicturesFromAzure(picObj) {
        // Variables for URI and request
        let userId = this.props.userId;
        let sasToken = "sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
        let filename = picObj.CurrentFilename;
        let uri = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename + "?" + sasToken;

        // Settings for axios requests
        const settings = {
            url: uri,
            method: 'DELETE',
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
                "x-ms-date": "now",
                "x-ms-version": "2017-07-29"
            }
        }

        // Request
        await Axios(settings)
            .then(response => {
                this.setState({
                    DeletePicsResponse: response.status
                });
            })
            .catch(err => {
                this.setState({
                    DeletePicsResponse: err.status
                });
            })
    }

    // Sends the image to Azure File Storage
    async sendPicturesToAzure(picObj) {
        // First call the function to create the free space to the file
        await this.createSpaceForPictures(picObj);

        // Variables for the URI and the request
        let userId = this.props.userId;
        let sasToken = "sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
        let filename = picObj.NewFilename;
        let rangeMaxSize = picObj.FileSize - 1;
        let picData = picObj.BinaryString;
        let uri = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename + "?comp=range&" + sasToken;

        // Settings for axios requests
        const settings = {
            url: uri,
            method: 'PUT',
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "x-ms-file-attributes": "None",
                "x-ms-file-creation-time": "now",
                "x-ms-file-last-write-time": "now",
                "x-ms-file-permission": "inherit",
                "x-ms-range": "bytes=0-" + rangeMaxSize,
                "x-ms-write": "update"
            },
            data: picData
        }

        // Request
        await Axios(settings)
            .then(response => {
                this.setState({
                    SendPicsResponse: response.status
                });
            })
            .catch(err => {
                this.setState({
                    SendPicsResponse: err.status
                });
            })
    }

    // Creates a space to Azure for the file
    async createSpaceForPictures(picObj) {
        // Variables for URI and request
        let userId = this.props.userId;
        let sasToken = "?sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
        let fileSize = picObj.FileSize;
        let filename = picObj.NewFilename;
        let uri = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename + sasToken;

        // Settings for axios requests
        const settings = {
            url: uri,
            method: 'PUT',
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "x-ms-content-length": fileSize,
                "x-ms-file-attributes": "None",
                "x-ms-file-creation-time": "now",
                "x-ms-file-last-write-time": "now",
                "x-ms-file-permission": "inherit",
                "x-ms-type": "file"
            }
        }

        // Request
        await Axios(settings)
            .then(response => {
                console.log("createSpaceForPictures: " + response.data);
                this.setState({
                    CreateSpaceResponse: response.status
                });
            })
            .catch(err => {
                console.log("createSpaceForPictures error: " + err.response.data);
                this.setState({
                    CreateSpaceResponse: err.status
                });
            })
    }

    // Checks the status of the response
    checkStatus(response) {
        return response >= 200 && response < 300;
    }

    render() {
        // SAS token for the GET requests to Azure File Storage
        let sasToken = "?sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
        return (
            <form id="imagesForm">
                <Container id="imagesContainer">
                    <Row id="imagesUpperRow">
                        <Col id="imagesCol">
                            <h4>Images</h4>
                            <Row>
                                <Col>
                                    <div className="imageControlsDiv">
                                        <label><b>Profile</b></label>
                                        <input id="profilePicInput" type="file" onChange={this.handleValueChange} />
                                        <label id="profilePicInputLbl" className="fileInput" htmlFor="profilePicInput">Choose a file</label>
                                        <button className="imagePreviewBtn" type="button" title="Show image preview" onClick={this.openImagePreviewModal}>
                                            <span id="profilePreviewBtn" className="fas fa-eye"></span>
                                        </button>
                                        <button className="imageSaveBtn" type="button" title="Save an image" onClick={this.handleImageSave}>
                                            <span id="profileSaveBtn" className="fas fa-save"></span>
                                        </button>
                                    </div>
                                    <div className="imageControlsDiv">
                                        <label><b>Home - background</b></label>
                                        <input id="homePicInput" type="file" onChange={this.handleValueChange} />
                                        <label id="homePicInputLbl" className="fileInput" htmlFor="homePicInput">Choose a file</label>
                                        <button className="imagePreviewBtn" type="button" title="Show image preview" onClick={this.openImagePreviewModal}>
                                            <span id="homePreviewBtn" className="fas fa-eye"></span>
                                        </button>
                                        <button className="imageSaveBtn" type="button" title="Save an image" onClick={this.handleImageSave}>
                                            <span id="homeSaveBtn" className="fas fa-save"></span>
                                        </button>
                                    </div>
                                    <div className="imageControlsDiv">
                                        <label><b>I am - background</b></label>
                                        <input id="iamPicInput" type="file" onChange={this.handleValueChange} />
                                        <label id="iamPicInputLbl" className="fileInput" htmlFor="iamPicInput">Choose a file</label>
                                        <button className="imagePreviewBtn" type="button" title="Show image preview" onClick={this.openImagePreviewModal}>
                                            <span id="iamPreviewBtn" className="fas fa-eye"></span>
                                        </button>
                                        <button className="imageSaveBtn" type="button" title="Save an image" onClick={this.handleImageSave}>
                                            <span id="iamSaveBtn" className="fas fa-save"></span>
                                        </button>
                                    </div>
                                    <div className="imageControlsDiv">
                                        <label><b>I can - background</b></label>
                                        <input id="icanPicInput" type="file" onChange={this.handleValueChange} />
                                        <label id="icanPicInputLbl" className="fileInput" htmlFor="icanPicInput">Choose a file</label>
                                        <button className="imagePreviewBtn" type="button" title="Show image preview" onClick={this.openImagePreviewModal}>
                                            <span id="icanPreviewBtn" className="fas fa-eye"></span>
                                        </button>
                                        <button className="imageSaveBtn" type="button" title="Save an image" onClick={this.handleImageSave}>
                                            <span id="icanSaveBtn" className="fas fa-save"></span>
                                        </button>
                                    </div>
                                    <div className="imageControlsDiv">
                                        <label><b>Guestbook - background</b></label>
                                        <input id="questbookPicInput" type="file" onChange={this.handleValueChange} />
                                        <label id="questbookPicInputLbl" className="fileInput" htmlFor="questbookPicInput">Choose a file</label>
                                        <button className="imagePreviewBtn" type="button" title="Show image preview" onClick={this.openImagePreviewModal}>
                                            <span id="questbookPreviewBtn" className="fas fa-eye"></span>
                                        </button>
                                        <button className="imageSaveBtn" type="button" title="Save an image" onClick={this.handleImageSave}>
                                            <span id="questbookSaveBtn" className="fas fa-save"></span>
                                        </button>
                                    </div>
                                    <div className="imageControlsDiv">
                                        <label><b>Contact - background</b></label>
                                        <input id="contactPicInput" type="file" onChange={this.handleValueChange} />
                                        <label id="contactPicInputLbl" className="fileInput" htmlFor="contactPicInput">Choose a file</label>
                                        <button className="imagePreviewBtn" type="button" title="Show image preview" onClick={this.openImagePreviewModal}>
                                            <span id="contactPreviewBtn" className="fas fa-eye"></span>
                                        </button>
                                        <button className="imageSaveBtn" type="button" title="Save an image" onClick={this.handleImageSave}>
                                            <span id="contactSaveBtn" className="fas fa-save"></span>
                                        </button>
                                    </div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>

                {/* Modal window for the image preview */}
                <Modal id="imagePreviewModal" show={this.state.ShowPreviewModal} onHide={this.closeImagePreviewModal} centered>
                    <button id="closePreviewModalBtn" type="button" title="Close">
                        <span className="fas fa-times-circle" onClick={this.closeImagePreviewModal}></span>
                    </button>
                    <img src={this.state.UrlForModal + sasToken} alt="" />
                </Modal>
            </form>
        )
    }
}

class SkillsEdit extends Component {
    constructor() {
        super();
        this.state = {
            Number: -1,
            Skill: "",
            SkillLevel: 0,
            ShowAddSkillModal: false,
            ShowProjectsModal: false,
            SkillIdToModal: "",
            SkillNameToModal: "",
            ProjectNumbers: []
        }
        this.addNewProject = this.addNewProject.bind(this);
        this.addNewSkillToDatabase = this.addNewSkillToDatabase.bind(this);
        this.addNewSkillToScreen = this.addNewSkillToScreen.bind(this);
        this.deleteProject = this.deleteProject.bind(this);
        this.deleteSkill = this.deleteSkill.bind(this);
        this.closeAddSkillModal = this.closeAddSkillModal.bind(this);
        this.closeProjectsModal = this.closeProjectsModal.bind(this);
        this.clearDiv = this.clearDiv.bind(this);
        this.openAddSkillModal = this.openAddSkillModal.bind(this);
        this.openProjectsModal = this.openProjectsModal.bind(this);
        this.generateNumber = this.generateNumber.bind(this);
        this.existingSkillsToScreen = this.existingSkillsToScreen.bind(this);
        this.projectNumbersToState = this.projectNumbersToState.bind(this);
        this.updatedSkillsToDatabase = this.updatedSkillsToDatabase.bind(this);
        this.projectsToDatabase = this.projectsToDatabase.bind(this);
        this.skillLevelToSpan = this.skillLevelToSpan.bind(this);
        this.skillLevelToModalSpanAndState = this.skillLevelToModalSpanAndState.bind(this);
        this.updatedSkillsFromDatabase = this.updatedSkillsFromDatabase.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleModalSkillChange = this.handleModalSkillChange.bind(this);
        this.getProjects = this.getProjects.bind(this);
        this.Auth = new AuthService();
    }

    componentDidMount() {
        // If the first login and skills added marks exists, all the added skills fetched from database. Otherwise skills came from props
        if (this.Auth.getFirstLoginMark() === null) {
            this.existingSkillsToScreen(this.props.skills);
        } else if (this.Auth.getFirstLoginMark() !== null && this.Auth.getSkillsAddedMark() !== null) {
            this.updatedSkillsFromDatabase();
        }
    }

    // Adds skills that the user already has
    // Set a number to state depending on an index which is used to identify divs, inputs etc.
    existingSkillsToScreen(skills) {
        // Users skills and skill levels
        for (let index = 0; index < skills.length; index++) {
            const element = skills[index];
            this.addNewSkillToScreen(element.skillId, element.skill, element.skillLevel, index)
            this.setState({
                Number: index
            });
        }
    }

    // Add a new skill to database
    addNewSkillToDatabase() {
        let skill = document.getElementById("skillInput").value;
        let skillLevel = document.getElementById("inputSkillLevelModal").value;
        let skillArray = [];

        let skillObj = {
            SkillId: 0,
            Skill: skill,
            SkillLevel: skillLevel
        };

        // Object to array. This is because the backend
        skillArray.push(skillObj);

        // Skill name, level and projects to object
        let skillsObj = {
            Skills: skillArray
        };

        // Settings for axios requests
        let userId = this.props.userId;

        const settings = {
            url: 'https://localhost:5001/api/skills/' + userId,
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: skillsObj
        };

        // Requests
        const skillPost = Axios(settings);

        Promise.all([skillPost])
            .then((responses) => {
                if (responses[0].status >= 200 && responses[0].status < 300) {
                    this.updatedSkillsFromDatabase();
                    if (this.Auth.getFirstLoginMark() !== null) {
                        this.Auth.setSkillsAddedMark();
                    }
                    this.setState({
                        ShowAddSkillModal: false
                    });
                } else {
                    console.log(responses[0].data);
                    this.setState({
                        ShowAddSkillModal: false
                    });
                    alert("Problems!!")
                }
            })
    }

    // Appends inputs and buttons to skills div
    async addNewSkillToScreen(skillId, skill, skillLevel, number) {
        console.log("addNewSkillToScreen");
        // Raises the number -state for one so every new field gets a different class/id
        await this.generateNumber();
        // Skills and project div
        let skillsDiv = document.getElementById("skills");
        // divs
        let addSkillDiv = document.createElement("div");
        let buttonsDiv = document.createElement("div");
        // inputs
        let inputSkill = document.createElement("input");
        let inputSkillLevel = document.createElement("input");
        // spans
        let spanPercent = document.createElement("label");
        let spanSkillId = document.createElement("span");
        let spanAdd = document.createElement("span");
        let spanShow = document.createElement("span");
        let spanDelete = document.createElement("span");
        // buttons
        let deleteSkillBtn = document.createElement("button");
        // Attributes
        inputSkill.setAttribute("type", "text");
        inputSkillLevel.setAttribute("type", "range");
        inputSkillLevel.setAttribute("min", "0");
        inputSkillLevel.setAttribute("max", "100");
        inputSkillLevel.setAttribute("step", "1");
        inputSkillLevel.setAttribute("value", "0");
        // If the user already have some skills and projects, parameters sets the values and different buttons will be showed
        // Class/id gets a tail number from number -parameter. If skill/project is new, tail number comes from the state
        if (skill !== undefined && skillLevel !== undefined) {
            // Button
            let showProjectButton = document.createElement("button");
            // Add class/id
            addSkillDiv.id = "skill" + number;
            inputSkill.id = "skillInput" + number;
            inputSkillLevel.id = "inputSkillLevel" + number;
            spanSkillId.id = "spanSkillId" + number;
            spanPercent.id = "spanSkillLevelPercent" + number
            showProjectButton.id = "showProjectsBtn" + number;
            deleteSkillBtn.id = "deleteSkillBtn" + number;
            addSkillDiv.className = "skill";
            buttonsDiv.className = "buttonsDiv";
            spanSkillId.className = "spanSkillId";
            inputSkillLevel.className = "inputSkillLevel";
            spanPercent.className = "spanSkillLevelPercent"
            inputSkill.className = "skillInput";
            showProjectButton.className = "showProjectsBtn";
            deleteSkillBtn.className = "deleteSkillBtn";
            // Attributes
            spanSkillId.setAttribute("hidden", "hidden");
            spanAdd.setAttribute("class", "fas fa-plus-circle");
            spanShow.setAttribute("class", "fas fa-arrow-alt-circle-right");
            spanDelete.setAttribute("class", "fas fa-trash-alt");
            showProjectButton.setAttribute("type", "button");
            showProjectButton.setAttribute("title", "Show projects");
            showProjectButton.setAttribute("style", "outline:none;");
            deleteSkillBtn.setAttribute("type", "button");
            deleteSkillBtn.setAttribute("title", "Delete the skill");
            deleteSkillBtn.setAttribute("style", "outline:none;");
            // Text (Skill ID) to span
            spanSkillId.textContent = skillId;
            // Values to inputs
            inputSkill.value = skill;
            inputSkillLevel.value = skillLevel;
            spanPercent.textContent = skillLevel + " %"
            // Events
            showProjectButton.onclick = () => { this.openProjectsModal(skillId, skill); }
            deleteSkillBtn.onclick = () => { this.deleteSkill(skillId, number); }
            inputSkillLevel.onchange = () => { this.skillLevelToSpan(number); }
            // Append spans to buttons
            showProjectButton.appendChild(spanShow)
            deleteSkillBtn.appendChild(spanDelete);
            // Append buttons to div
            buttonsDiv.appendChild(showProjectButton);
            buttonsDiv.appendChild(deleteSkillBtn);
            // Append to div
            addSkillDiv.appendChild(spanSkillId);
            addSkillDiv.appendChild(inputSkill);
            addSkillDiv.appendChild(inputSkillLevel);
            addSkillDiv.appendChild(spanPercent);
            addSkillDiv.appendChild(buttonsDiv);
        } else {
            // Because a skill is new, "projects" and "skillId" are undefined
            skillId = undefined;
            // Add class/id
            addSkillDiv.id = "skill" + this.state.Number;
            inputSkill.id = "skillInput" + this.state.Number;
            inputSkillLevel.id = "inputSkillLevel" + this.state.Number;
            spanSkillId.id = "spanSkillId" + this.state.Number;
            spanPercent.id = "spanSkillLevelPercent" + this.state.Number;
            deleteSkillBtn.id = "deleteSkillBtn" + this.state.Number;
            addSkillDiv.className = "skill";
            buttonsDiv.className = "buttonsDiv";
            spanSkillId.className = "spanSkillId";
            inputSkillLevel.className = "inputSkillLevel";
            spanPercent.className = "spanSkillLevelPercent"
            inputSkill.className = "skillInput";
            deleteSkillBtn.className = "deleteSkillBtn";
            // Attributes
            spanSkillId.setAttribute("hidden", "hidden");
            spanAdd.setAttribute("class", "fas fa-plus-circle");
            spanDelete.setAttribute("class", "fas fa-trash-alt");
            deleteSkillBtn.setAttribute("type", "button");
            deleteSkillBtn.setAttribute("title", "Delete the skill");
            // Text (Skill ID) to span
            spanSkillId.textContent = 0;
            // Values of inputs
            inputSkill.value = this.state.Skill;
            inputSkillLevel.value = this.state.SkillLevel;
            spanPercent.textContent = this.state.SkillLevel + " %";
            // Events
            deleteSkillBtn.onclick = () => { this.deleteSkill(skillId, this.state.Number); }
            inputSkillLevel.onchange = () => { this.skillLevelToSpan(this.state.Number); }
            // Append text to button
            deleteSkillBtn.appendChild(spanDelete);
            // Append buttons to div
            buttonsDiv.appendChild(deleteSkillBtn);
            // Close Modal window
            this.closeAddSkillModal();
            // Append to div
            addSkillDiv.appendChild(spanSkillId);
            addSkillDiv.appendChild(inputSkill);
            addSkillDiv.appendChild(inputSkillLevel);
            addSkillDiv.appendChild(spanPercent);
            addSkillDiv.appendChild(buttonsDiv);
        }
        // Append to div
        skillsDiv.appendChild(addSkillDiv);
    }

    // Close the modal window for adding a new skill
    closeAddSkillModal() {
        this.setState({
            ShowAddSkillModal: false
        });
    }

    // Open the modal window for adding a new skill
    openAddSkillModal() {
        this.setState({
            ShowAddSkillModal: true
        });
    }

    // Close the modal window for showing the projects of the skill
    closeProjectsModal() {
        this.setState({
            ShowProjectsModal: false
        });
    }

    // Open the modal window for showing the projects of the skill
    openProjectsModal(skillId, skillName) {
        this.setState({
            SkillIdToModal: skillId,
            SkillNameToModal: skillName,
            ShowProjectsModal: true
        }, this.getProjects(skillId));
    }

    // Delete single project
    deleteProject(projectId, projectNumber) {
        // If the project, which user is going to delete is new, the request is not sent to backend 
        if (projectId !== undefined) {
            const settings = {
                url: 'https://localhost:5001/api/projects/' + projectId,
                method: 'DELETE',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            };

            Axios(settings)
                .then((response) => {
                    console.log("Link delete: " + response.data);
                    // Remove deleted service div
                    let projectsDiv = document.getElementById("projects");
                    let projectDiv = document.getElementById("project" + projectNumber);
                    projectsDiv.removeChild(projectDiv);
                    // Generate new id´s for elements
                    let projectDivs = document.getElementsByClassName("projectDiv");
                    let projectIdSpans = document.getElementsByClassName("projectIdSpan");
                    let projectNumberSpans = document.getElementsByClassName("projectNumberSpan");
                    let projectNameInputs = document.getElementsByClassName("inputProjectName");
                    let projectLinkInputs = document.getElementsByClassName("inputProjectLink");
                    let projectDescriptionAreas = document.getElementsByClassName("textareaProjectDescription");
                    let deleteBtns = document.getElementsByClassName("deleteProjectBtn");

                    for (let index = 0; index < projectDivs.length; index++) {
                        const projectDiv = projectDivs[index];
                        const projectIdSpan = projectIdSpans[index];
                        const projectNumberSpan = projectNumberSpans[index];
                        const projectNameInput = projectNameInputs[index];
                        const projectLinkInput = projectLinkInputs[index];
                        const projectDescriptionArea = projectDescriptionAreas[index];
                        const deleteBtn = deleteBtns[index];

                        projectDiv.id = "project" + index;
                        projectIdSpan.id = "projectIdSpan" + index;
                        projectNumberSpan.id = "projectNumberSpan" + index;
                        projectNameInput.id = "inputProjectName" + index;
                        projectLinkInput.id = "inputProjectLink" + index;
                        projectDescriptionArea.id = "textareaProjectDescription" + index;
                        projectNumberSpan.textContent = index;
                        // Update function parameters to onClick event in case of user deletes a project from the list between the first and the last
                        deleteBtn.onclick = () => { this.deleteProject(projectIdSpan.textContent, projectNumberSpan.textContent); }
                    }
                    // Remove the last added project number so the count of an array is correct
                    let projectNumbersArray = this.state.ProjectNumbers;
                    projectNumbersArray.pop();
                    this.setState({
                        ProjectNumbers: projectNumbersArray
                    });
                })
                .catch(error => {
                    console.log("Project delete error: " + error.data);
                })
        } else {
            // Remove deleted project div
            let projectsDiv = document.getElementById("projects");
            let projectDiv = document.getElementById("project" + projectNumber);
            projectsDiv.removeChild(projectDiv);
            // Remove last added project number
            let projectNumbersArray = this.state.ProjectNumbers;
            projectNumbersArray.pop();
            this.setState({
                ProjectNumbers: projectNumbersArray
            });
        }
    }

    // Delete a skill and all the projects of that skill
    deleteSkill(skillId, number) {
        // If the skill, which user is going to delete is new, the request is not sent to backend 
        if (skillId !== undefined) {
            const settings = {
                url: 'https://localhost:5001/api/skills/' + skillId,
                method: 'DELETE',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            };

            Axios(settings)
                .then((response) => {
                    console.log("Skill delete: " + response.data);
                    // Remove a div of the deleted skill
                    let skillsDiv = document.getElementById("skills");
                    let skillDiv = document.getElementById("skill" + number);
                    skillsDiv.removeChild(skillDiv);
                    // Generate new id´s for the elements
                    let skillDivs = document.getElementsByClassName("skill");
                    let skillIdSpans = document.getElementsByClassName("spanSkillId");
                    let skillInputs = document.getElementsByClassName("skillInput");
                    let skillLevelInputs = document.getElementsByClassName("inputSkillLevel");
                    let skillLevelPercentSpans = document.getElementsByClassName("spanSkillLevelPercent");
                    let showProjectsBtns = document.getElementsByClassName("showProjectsBtn");
                    let deleteBtns = document.getElementsByClassName("deleteSkillBtn");

                    for (let index = 0; index < skillDivs.length; index++) {
                        const skillDiv = skillDivs[index];
                        const skillIdSpan = skillIdSpans[index];
                        const skillInput = skillInputs[index];
                        const skillLevelInput = skillLevelInputs[index];
                        const skillLevelPercentSpan = skillLevelPercentSpans[index];
                        const showProjectsBtn = showProjectsBtns[index];
                        const deleteBtn = deleteBtns[index];

                        skillDiv.id = "skill" + index;
                        skillIdSpan.id = "spanSkillId" + index;
                        skillInput.id = "skillInput" + index;
                        skillLevelInput.id = "inputSkillLevel" + index;
                        skillLevelPercentSpan.id = "spanSkillLevelPercent" + index;
                        showProjectsBtn.id = "showProjectsBtn" + index;
                        // Update function parameters to events in case of user deletes a skill from the list between the first and the last
                        showProjectsBtn.onclick = () => { this.openProjectsModal(skillIdSpan.textContent, skillInput.value); }
                        deleteBtn.onclick = () => { this.deleteSkill(skillIdSpan.textContent, index); }
                        skillLevelInput.onchange = () => { this.skillLevelToSpan(index); }
                    }
                    /*  
                        If user deletes all of his/her skills, reduce the Number state variable for one 
                        so that the next new skill div + other elements gets the right ID´s
                    */
                    this.setState({
                        Number: this.state.Number - 1
                    });
                })
                .catch(error => {
                    console.log("Skill delete error: " + error.data);
                })
        } else {
            // Remove a div of the deleted skill
            let skillsAndProjetcsDiv = document.getElementById("skills");
            let skillDiv = document.getElementById("skill" + number);
            skillsAndProjetcsDiv.removeChild(skillDiv);
            // Reduce the Number state variable for one so that the next new skill div + other elements gets the right ID´s
            this.setState({
                Number: this.state.Number - 1
            });
        }
    }

    // Sets the range input value (skill level) to the span element
    skillLevelToSpan(number) {
        let skillLevelInput = document.getElementById("inputSkillLevel" + number);
        let span = document.getElementById("spanSkillLevelPercent" + number);
        span.textContent = skillLevelInput.value + " %";
    }

    // Sets the new skill level to the modal windows span tag and to the state variable
    skillLevelToModalSpanAndState(e) {
        let span = document.getElementById("labelSkillLevelPercentModal");
        span.textContent = e.target.value + " %";
        this.setState({
            SkillLevel: e.target.value
        })
    }

    // Raises the number -state for one
    generateNumber() {
        let number = this.state.Number + 1
        this.setState({
            Number: number
        });
    }

    // Appends inputs to the projects div
    addNewProject(project, projectNumber) {
        let projectsDiv = document.getElementById("projects");
        // div's
        let projectDiv = document.createElement("div");
        let inputsDiv = document.createElement("div");
        // inputs
        let inputProjectName = document.createElement("input");
        let inputProjectLink = document.createElement("input");
        let textareaProjectDescription = document.createElement("textarea");
        // Button
        let deleteProjectBtn = document.createElement("button");
        // Spans
        let dotSpan = document.createElement("span");
        let projectIdSpan = document.createElement("span");
        let projectNumberSpan = document.createElement("span");
        let deleteProjectBtnSpan = document.createElement("span");
        // Class/Id
        deleteProjectBtn.className = "deleteProjectBtn";
        deleteProjectBtnSpan.className = "fas fa-trash-alt"
        // If the user is adding a new project (project === null)
        if (project !== null) {
            // Class/Id
            projectDiv.id = "project" + projectNumber;
            projectDiv.className = "projectDiv";
            inputsDiv.className = "inputsDiv";
            dotSpan.className = "fas fa-ellipsis-v";
            projectIdSpan.id = "projectIdSpan" + projectNumber;
            projectIdSpan.className = "projectIdSpan";
            projectNumberSpan.id = "projectNumberSpan" + projectNumber;
            projectNumberSpan.className = "projectNumberSpan";
            inputProjectName.id = "inputProjectName" + projectNumber;
            inputProjectName.className = "inputProjectName";
            inputProjectLink.id = "inputProjectLink" + projectNumber;
            inputProjectLink.className = "inputProjectLink";
            textareaProjectDescription.id = "textareaProjectDescription" + projectNumber;
            textareaProjectDescription.className = "textareaProjectDescription";
            deleteProjectBtn.id = "deleteProjectBtn" + projectNumber;
            // Content to spans
            projectIdSpan.textContent = project.projectId;
            projectNumberSpan.textContent = projectNumber;
            // Values to inputs
            inputProjectName.value = project.name;
            inputProjectLink.value = project.link;
            textareaProjectDescription.value = project.description;
            // Event to button
            deleteProjectBtn.onclick = () => { this.deleteProject(project.projectId, projectNumber); }
        } else {
            let projectNumbers = this.state.ProjectNumbers;
            let lastProjectNumber = projectNumbers.slice(-1)[0];
            let projectNumber = 0;
            if (lastProjectNumber !== undefined) {
                projectNumber = parseInt(lastProjectNumber) + 1;
            }
            // Class/Id
            projectDiv.id = "project" + projectNumber;
            projectDiv.className = "projectDiv";
            inputsDiv.className = "inputsDiv";
            dotSpan.className = "fas fa-ellipsis-v";
            projectIdSpan.id = "projectIdSpan" + projectNumber;
            projectIdSpan.className = "projectIdSpan";
            projectNumberSpan.id = "projectNumberSpan" + projectNumber;
            projectNumberSpan.className = "projectNumberSpan";
            inputProjectName.id = "inputProjectName" + projectNumber;
            inputProjectName.className = "inputProjectName";
            inputProjectLink.id = "inputProjectLink" + projectNumber;
            inputProjectLink.className = "inputProjectLink";
            textareaProjectDescription.id = "textareaProjectDescription" + projectNumber;
            textareaProjectDescription.className = "textareaProjectDescription";
            deleteProjectBtn.id = "deleteProjectBtn" + projectNumber;
            // Text (Project ID) to span
            projectIdSpan.textContent = 0;
            projectNumberSpan.textContent = projectNumber;
            // Add values
            inputProjectName.value = "";
            inputProjectLink.value = "";
            textareaProjectDescription.value = "";
            // Event to button
            deleteProjectBtn.onclick = () => { this.deleteProject(undefined, projectNumber); }
        }
        // Attributes
        projectIdSpan.setAttribute("hidden", "hidden");
        projectNumberSpan.setAttribute("hidden", "hidden");
        inputProjectName.setAttribute("type", "text");
        inputProjectName.setAttribute("placeholder", "Name of the project");
        inputProjectLink.setAttribute("type", "url");
        inputProjectLink.setAttribute("placeholder", "Website of the project (https://...)");
        textareaProjectDescription.setAttribute("type", "text");
        textareaProjectDescription.setAttribute("placeholder", "Description of the project");
        deleteProjectBtn.setAttribute("type", "button");
        deleteProjectBtn.setAttribute("title", "Delete the project");
        deleteProjectBtn.setAttribute("style", "outline:none;");
        // Span to button
        deleteProjectBtn.appendChild(deleteProjectBtnSpan);
        // Appends
        projectDiv.appendChild(dotSpan);
        projectDiv.appendChild(projectIdSpan);
        projectDiv.appendChild(projectNumberSpan);
        inputsDiv.appendChild(inputProjectName);
        inputsDiv.appendChild(inputProjectLink);
        projectDiv.appendChild(inputsDiv);
        projectDiv.appendChild(textareaProjectDescription);
        projectDiv.appendChild(deleteProjectBtn);
        projectsDiv.appendChild(projectDiv);

        this.projectNumbersToState();
    }

    // Gets all projects for the skill from database and sends those to the addNewProject -function
    getProjects(skillId) {
        const projectsSettings = {
            url: 'https://localhost:5001/api/projects/' + skillId,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        Axios(projectsSettings)
            .then((response) => {
                for (let index = 0; index < response.data.length; index++) {
                    const element = response.data[index];
                    this.addNewProject(element, index)
                }
            })
            .catch(error => {
                console.log("Projects error: " + error);
            })
    }

    // Sets a new skill name to state variable
    handleModalSkillChange(e) {
        this.setState({
            Skill: e.target.value
        })
    }

    handleSubmit(event) {
        event.preventDefault();
        if (event.target.id === "saveProjectsModalBtn") {
            this.projectsToDatabase();
        } else {
            this.updatedSkillsToDatabase();
        }
    }

    // Sets the existing project numbers to the state array
    projectNumbersToState() {
        // Get every text content of project number spans to the state
        let projectNumberSpans = document.getElementsByClassName("projectNumberSpan");
        let projectNumberArray = [];
        for (let index = 0; index < projectNumberSpans.length; index++) {
            const element = projectNumberSpans[index];
            projectNumberArray.push(element.textContent)
        }
        this.setState({
            ProjectNumbers: projectNumberArray
        })
    }

    // Posts all the projects for the specific skill to database
    projectsToDatabase() {
        let obj = "";
        // Count of projects
        let projectInputs = document.getElementsByClassName("projectDiv");
        for (let index = 0; index < projectInputs.length; index++) {
            let projectObj = "";
            let projectsArray = [];
            // Right inputs with the index number
            let projectIdSpan = document.getElementsByClassName("projectIdSpan");
            let nameInputs = document.getElementsByClassName("inputProjectName");
            let linkInputs = document.getElementsByClassName("inputProjectLink");
            let descriptionInputs = document.getElementsByClassName("textareaProjectDescription");

            // All projects for the skill to object
            for (let index = 0; index < nameInputs.length; index++) {
                projectObj = {
                    ProjectId: projectIdSpan[index].textContent,
                    Name: nameInputs[index].value,
                    Link: linkInputs[index].value,
                    Description: descriptionInputs[index].value
                };

                // Object to the array
                projectsArray.push(projectObj);
            }

            // Projects to the object
            obj = {
                Projects: projectsArray
            }
        }

        // Settings for the request
        const settings = {
            url: 'https://localhost:5001/api/projects/' + this.state.SkillIdToModal,
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: obj
        };

        // Requests
        const projectPost = Axios(settings);

        Promise.all([projectPost])
            .then((response) => {
                if (response[0].status >= 200 && response[0].status < 300) {
                    alert("Projects saved succesfully!")
                    this.closeProjectsModal();
                } else {
                    console.log(response[0].data);
                    alert("Problems!!")
                }
            })
    }

    // Posts all the skills with a new data to database
    updatedSkillsToDatabase() {
        let skillArray = [];
        // Count of skills
        let skillInputs = document.getElementsByClassName("skillInput");
        // All skills with projects to array
        for (let index = 0; index < skillInputs.length; index++) {
            let skillsObj = "";
            // Right inputs with index number
            let skillNameInput = document.getElementById("skillInput" + [index]);
            let skillLevelInput = document.getElementById("inputSkillLevel" + [index]);
            let skillIdSpan = document.getElementById("spanSkillId" + [index]);

            // Skill name, level and projects to object
            skillsObj = {
                SkillId: skillIdSpan.textContent,
                Skill: skillNameInput.value,
                SkillLevel: skillLevelInput.value
            }

            // Object to array
            skillArray.push(skillsObj);
        }

        // Skills to database
        // Object for requests
        const skillsObj = {
            Skills: skillArray
        }

        // Settings for axios requests
        let userId = this.props.userId;

        const settings = {
            url: 'https://localhost:5001/api/skills/' + userId,
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: skillsObj
        };

        // Requests
        const skillPost = Axios(settings);

        Promise.all([skillPost])
            .then((responses) => {
                if (responses[0].status >= 200 && responses[0].status < 300) {
                    alert("Skills saved succesfully!")
                    window.location.reload();
                } else {
                    console.log(responses[0].data);
                    alert("Problems!!")
                }
            })
    }

    // Clear a div
    clearDiv(id) {
        document.getElementById(id).innerHTML = "";
    }

    // Updated skills from database when a user have added a new one
    updatedSkillsFromDatabase() {
        let userId = this.props.userId;

        const skillsSettings = {
            url: 'https://localhost:5001/api/skills/' + userId,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        // Requests
        const skillsGet = Axios(skillsSettings);

        // Promise
        Promise.all([skillsGet])
            .then((response) => {
                // Clear the skills div
                this.clearDiv("skills");
                // Render the updated skills to the screen
                this.existingSkillsToScreen(response[0].data)
            })
            .catch(errors => {
                console.log("Skills error: " + errors[0]);
            })
    }

    render() {
        return (
            <form id="skillsForm" onSubmit={this.handleSubmit}>
                <Container id="skillsContainer">
                    <Row id="skillsUpperRow">
                        <Col id="skillsCol">
                            <Row id="skillsColUpperRow">
                                <Col id="skillsHeaderCol">
                                    <h4>Skills</h4>
                                    <button id="addNewSkillBtn" type="button" title="Add a new skill" onClick={this.openAddSkillModal}><span className="fas fa-plus"></span></button><br /><br />
                                </Col>
                            </Row>
                            <Row id="skillsColLowerRow">
                                <Col>
                                    <div id="skills"></div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row id="skillsLowerRow">
                        <Col className="saveChangesCol">
                            <button id="skillsSaveChangesBtn" className="saveChangesBtn" type="submit"><b>SAVE CHANGES</b></button>
                        </Col>
                    </Row>
                </Container>

                {/* Modal window for adding a new skill */}
                <Modal id="addNewSkillModal" show={this.state.ShowAddSkillModal} onHide={this.closeAddSkillModal} centered>
                    <Modal.Header id="addSkillModalHeader" closeButton>
                        <Modal.Title>Add a new skill</Modal.Title>
                    </Modal.Header>
                    <form>
                        <Modal.Body>
                            <b>Skill</b><br />
                            <input type="text" id="skillInput" onChange={this.handleModalSkillChange}></input><br />
                            <b>Skill level</b><br />
                            <input id="inputSkillLevelModal" type="range" min="0" max="100" step="1" defaultValue="0" onChange={this.skillLevelToModalSpanAndState} />
                            <label id="labelSkillLevelPercentModal">0 %</label><br />
                        </Modal.Body>
                        <Modal.Footer id="addSkillModalFooter">
                            <button id="addSkillModalBtn" type="button" onClick={this.addNewSkillToDatabase}>ADD</button>
                            <button id="cancelAddSkillModalBtn" type="button" onClick={this.closeAddSkillModal}>CANCEL</button>
                        </Modal.Footer>
                    </form>
                </Modal>

                {/* Modal window for showing the projects of the skill */}
                <Modal id="projectsModal" show={this.state.ShowProjectsModal} onHide={this.closeProjectsModal} centered>
                    <Modal.Header id="addSkillModalHeader">
                        <Modal.Title id="projectsModalTitle">
                            <label>Projects - {this.state.SkillNameToModal}</label>
                            <button id="addProjectModalBtn" type="button" title="Add a new project" onClick={() => this.addNewProject(null)}>
                                <span className="fas fa-plus"></span>
                            </button>
                        </Modal.Title>
                    </Modal.Header>
                    <form>
                        <Modal.Body>
                            <div id="projects"></div>
                        </Modal.Body>
                        <Modal.Footer id="addSkillModalFooter">
                            <button id="saveProjectsModalBtn" type="button" onClick={this.handleSubmit}>SAVE</button>
                            <button id="cancelProjectsModalBtn" type="button" onClick={this.closeProjectsModal}>CLOSE</button>
                        </Modal.Footer>
                    </form>
                </Modal>
            </form>
        )
    }
}

class InfoEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            Number: -1,
            Basics: "",
            Emails: "",
            Firstname: "",
            Lastname: "",
            DateOfBirth: "",
            City: "",
            Country: "",
            Phonenumber: "",
            Punchline: "",
            BasicKnowledge: "",
            Education: "",
            WorkHistory: "",
            LanguageSkills: ""
        }
        this.addNewSocialMediaService = this.addNewSocialMediaService.bind(this);
        this.addExistingSocialMediaLinks = this.addExistingSocialMediaLinks.bind(this);
        this.addValuesToInputs = this.addValuesToInputs.bind(this);
        this.basicInfoFromDatabase = this.basicInfoFromDatabase.bind(this);
        this.contentToDatabase = this.contentToDatabase.bind(this);
        this.deleteSocialMediaService = this.deleteSocialMediaService.bind(this);
        this.generateNumber = this.generateNumber.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.Auth = new AuthService();
    }

    componentDidMount() {
        // If the "first login" -mark exists, the request is not sent
        // If the "first login" -mark & "basics saved" -mark exists, basic info which has saved while the first login, will be fetched from database
        if (this.Auth.getFirstLoginMark() === null) {
            this.addValuesToInputs();
            this.addExistingSocialMediaLinks(this.props.links);
            this.updateStates();
        } else if (this.Auth.getFirstLoginMark() !== null && this.Auth.getBasicsSavedMark() !== null) {
            this.basicInfoFromDatabase();
        } else {
            this.setState({
                Basics: this.props.content,
                Emails: this.props.emails
            }, this.updateStates)
        }
    }

    // Converts a datetime to a date format which is correct to date input field
    convertToDate(date) {
        console.log(date);
        let birthdate = new Date(date);
        let splitted = birthdate.toISOString().split("T")

        return splitted[0];
    }

    // Adds social media links that the user already has
    // Set a number to state depending on an index which is used to identify divs, inputs etc.
    addExistingSocialMediaLinks(links) {
        // Social media selects/link inputs with values
        for (let index = 0; index < links.length; index++) {
            const element = links[index];
            this.addNewSocialMediaService(element.linkId, element.serviceId, element.link, index)
            this.setState({
                Number: index
            });
        }
    }

    // Sets values to basicInfo inputs
    addValuesToInputs() {
        if (this.Auth.getBasicsSavedMark() === null) {
            // Values to basic inputs
            document.getElementById("firstnameInput").value = this.props.content.firstname
            document.getElementById("lastnameInput").value = this.props.content.lastname
            document.getElementById("birthdateInput").value = this.convertToDate(this.props.content.birthdate)
            document.getElementById("cityInput").value = this.props.content.city
            document.getElementById("countryInput").value = this.props.content.country
            document.getElementById("phoneInput").value = this.props.content.phonenumber
            document.getElementById("emailIdSpan1").textContent = this.props.emails[0].emailId
            document.getElementById("email1Input").value = this.props.emails[0].emailAddress
            document.getElementById("emailIdSpan2").textContent = this.props.emails[1].emailId
            document.getElementById("email2Input").value = this.props.emails[1].emailAddress
            document.getElementById("punchlineInput").value = this.props.content.punchline
            document.getElementById("basicInput").value = this.props.content.basicKnowledge
            document.getElementById("educationInput").value = this.props.content.education
            document.getElementById("workHistoryInput").value = this.props.content.workHistory
            document.getElementById("languageinput").value = this.props.content.languageSkills
        } else {
            // Values to basic inputs
            document.getElementById("firstnameInput").value = this.state.Basics.firstname
            document.getElementById("lastnameInput").value = this.state.Basics.lastname
            document.getElementById("birthdateInput").value = this.convertToDate(this.state.Basics.birthdate)
            document.getElementById("cityInput").value = this.state.Basics.city
            document.getElementById("countryInput").value = this.state.Basics.country
            document.getElementById("phoneInput").value = this.state.Basics.phonenumber
            document.getElementById("emailIdSpan1").textContent = this.state.Emails[0].emailId
            document.getElementById("email1Input").value = this.state.Emails[0].emailAddress
            document.getElementById("emailIdSpan2").textContent = this.state.Emails[1].emailId
            document.getElementById("email2Input").value = this.state.Emails[1].emailAddress
            document.getElementById("punchlineInput").value = this.state.Basics.punchline
            document.getElementById("basicInput").value = this.state.Basics.basicKnowledge
            document.getElementById("educationInput").value = this.state.Basics.education
            document.getElementById("workHistoryInput").value = this.state.Basics.workHistory
            document.getElementById("languageinput").value = this.state.Basics.languageSkills
        }
    }

    // Appends inputs and buttons to socialMediaServices div
    async addNewSocialMediaService(linkId, serviceId, link, number) {
        // Raises the number -state for one so every new field gets a different class/id
        await this.generateNumber();
        // div
        let socialMediaServicesDiv = document.getElementById("socialMediaServices");
        let serviceDiv = document.createElement("div");
        // input
        let inputServiceLink = document.createElement("input");
        // select
        let serviceSelect = document.createElement("select");
        // option
        let optionFacebook = document.createElement("option");
        let optionInstagram = document.createElement("option");
        let optionTwitter = document.createElement("option");
        let optionGithub = document.createElement("option");
        let optionYoutube = document.createElement("option");
        let optionLinkedin = document.createElement("option");
        // spans
        let spanLinkId = document.createElement("span");
        let spanDelete = document.createElement("span");
        // button
        let deleteBtn = document.createElement("button");
        // button attribute
        deleteBtn.setAttribute("type", "button");
        deleteBtn.setAttribute("title", "Delete the service");
        deleteBtn.setAttribute("style", "outline:none;");
        // span attribute
        spanLinkId.setAttribute("hidden", "hidden");
        spanDelete.setAttribute("class", "fas fa-trash-alt");
        // input attribute
        inputServiceLink.setAttribute("type", "url");
        // select attribute
        serviceSelect.setAttribute("type", "select");
        // add label to option
        optionFacebook.setAttribute("label", "Facebook");
        optionInstagram.setAttribute("label", "Instagram");
        optionTwitter.setAttribute("label", "Twitter");
        optionGithub.setAttribute("label", "GitHub");
        optionYoutube.setAttribute("label", "Youtube");
        optionLinkedin.setAttribute("label", "LinkedIn");
        // add value to option
        optionFacebook.setAttribute("value", "1");
        optionInstagram.setAttribute("value", "2");
        optionTwitter.setAttribute("value", "3");
        optionGithub.setAttribute("value", "4");
        optionYoutube.setAttribute("value", "5");
        optionLinkedin.setAttribute("value", "6");
        // append options to select
        serviceSelect.appendChild(optionFacebook);
        serviceSelect.appendChild(optionInstagram);
        serviceSelect.appendChild(optionTwitter);
        serviceSelect.appendChild(optionGithub);
        serviceSelect.appendChild(optionYoutube);
        serviceSelect.appendChild(optionLinkedin);
        // If user already have links to social media, parameters sets the values
        if (serviceId !== undefined && link !== undefined) {
            // Add class/id
            serviceDiv.id = "service" + number;
            serviceSelect.id = "socialMediaSelect" + number;
            inputServiceLink.id = "socialMedia1Input" + number;
            spanLinkId.id = "spanLinkId" + number;
            spanLinkId.className = "spanLinkId";
            serviceDiv.className = "service";
            serviceSelect.className = "socialMediaSelect";
            inputServiceLink.className = "socialMedia1Input";
            deleteBtn.className = "deleteSocialMediaBtn";
            // Click event to button
            deleteBtn.onclick = () => { this.deleteSocialMediaService(linkId, number); }
            // Values
            spanLinkId.textContent = linkId;
            serviceSelect.value = serviceId;
            inputServiceLink.value = link;
        } else {
            linkId = undefined;
            // Add class/id
            serviceDiv.id = "service" + this.state.Number;
            serviceSelect.id = "socialMediaSelect" + this.state.Number;
            inputServiceLink.id = "socialMedia1Input" + this.state.Number;
            spanLinkId.id = "spanLinkId" + this.state.Number;
            spanLinkId.className = "spanLinkId";
            serviceDiv.className = "service"
            serviceSelect.className = "socialMediaSelect";
            inputServiceLink.className = "socialMedia1Input";
            deleteBtn.className = "deleteSocialMediaBtn";
            // Click event to button
            deleteBtn.onclick = () => { this.deleteSocialMediaService(linkId, this.state.Number); }
            // Values
            spanLinkId.textContent = 0;
            serviceSelect.value = 1;
            inputServiceLink.value = "http://";
        }
        // append textnode to button
        deleteBtn.appendChild(spanDelete);
        // Append elements to div
        serviceDiv.appendChild(spanLinkId);
        // serviceDiv.appendChild(textNodeService);
        serviceDiv.appendChild(serviceSelect);
        // serviceDiv.appendChild(textNodeServiceLink);
        serviceDiv.appendChild(inputServiceLink);
        serviceDiv.appendChild(deleteBtn);
        socialMediaServicesDiv.appendChild(serviceDiv);
    }

    // Deletes social media service link
    deleteSocialMediaService(linkId, number) {
        console.log(number);
        if (linkId !== undefined) {
            const settings = {
                url: 'https://localhost:5001/api/socialmedia/' + linkId,
                method: 'DELETE',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            };

            Axios(settings)
                .then((response) => {
                    console.log("Link delete: " + response.data);
                    // Remove deleted service div
                    let servicesDiv = document.getElementById("socialMediaServices");
                    let serviceDiv = document.getElementById("service" + number);
                    servicesDiv.removeChild(serviceDiv);
                    // Generate new id´s for elements
                    let serviceDivs = document.getElementsByClassName("service");
                    let linkIdSpans = document.getElementsByClassName("spanLinkId");
                    let serviceSelects = document.getElementsByClassName("socialMediaSelect");
                    let linkInputs = document.getElementsByClassName("socialMedia1Input");
                    let deleteBtns = document.getElementsByClassName("deleteSocialMediaBtn");

                    for (let index = 0; index < serviceDivs.length; index++) {
                        const serviceDiv = serviceDivs[index];
                        const spanLinkId = linkIdSpans[index];
                        const socialMediaSelect = serviceSelects[index];
                        const socialMedia1Input = linkInputs[index];
                        const deleteBtn = deleteBtns[index];

                        serviceDiv.id = "service" + index;
                        spanLinkId.id = "spanLinkId" + index;
                        socialMediaSelect.id = "socialMediaSelect" + index;
                        socialMedia1Input.id = "socialMedia1Input" + index;
                        // Update function parameters to onClick event in case of user deletes a service from the list between the first and the last
                        deleteBtn.onclick = () => { this.deleteSocialMediaService(spanLinkId.textContent, index); }
                    }
                    /*  
                        If user deletes all of his/her services, reduce the Number state variable for one 
                        so that the next new service div + other elements gets the right ID´s
                    */
                    this.setState({
                        Number: this.state.Number - 1
                    });
                })
                .catch(error => {
                    console.log("Link delete error: " + error.data);
                })
        } else {
            let servicesDiv = document.getElementById("socialMediaServices");
            let serviceDiv = document.getElementById("service" + number);
            servicesDiv.removeChild(serviceDiv);
            // Reduce the Number state variable for one so that the next new service div + other elements gets the right ID´s
            this.setState({
                Number: this.state.Number - 1
            });
        }
    }

    // Raises the number -state for one
    generateNumber() {
        let number = this.state.Number + 1
        this.setState({
            Number: number
        });
    }

    // Sets basicInfo inputs values to states
    handleValueChange(input) {
        // Depending on input field, the right state will be updated
        let inputId = input.target.id;

        switch (inputId) {
            case "firstnameInput":
                this.setState({
                    Firstname: input.target.value
                });
                break;

            case "lastnameInput":
                this.setState({
                    Lastname: input.target.value
                });
                break;

            case "birthdateInput":
                this.setState({
                    DateOfBirth: input.target.value
                });
                break;

            case "cityInput":
                this.setState({
                    City: input.target.value
                });
                break;

            case "countryInput":
                this.setState({
                    Country: input.target.value
                });
                break;

            case "phoneInput":
                this.setState({
                    Phonenumber: input.target.value
                });
                break;

            case "punchlineInput":
                this.setState({
                    Punchline: input.target.value
                });
                break;

            case "basicInput":
                this.setState({
                    BasicKnowledge: input.target.value
                });
                break;

            case "educationInput":
                this.setState({
                    Education: input.target.value
                });
                break;

            case "workHistoryInput":
                this.setState({
                    WorkHistory: input.target.value
                });
                break;

            case "languageinput":
                this.setState({
                    LanguageSkills: input.target.value
                });
                break;

            default:
                break;
        }
    }

    // Sends all the content to database
    contentToDatabase() {
        let emailsArray = [];
        let emailSpans = document.getElementsByClassName("emailIDSpan");
        let emailInputs = document.getElementsByClassName("emailInput");

        for (let index = 0; index < emailSpans.length; index++) {
            let emailObj = "";
            if (emailSpans[index].textContent == null) {
                if (emailInputs[index].value !== "") {
                    emailObj = {
                        EmailAddress: emailInputs[index].value
                    };
                }
            } else {
                emailObj = {
                    EmailId: emailSpans[index].textContent,
                    EmailAddress: emailInputs[index].value
                };
            }

            emailsArray.push(emailObj);
        }

        // Content and social media links to database
        // Objects for requests
        const contentObj = {
            Firstname: this.state.Firstname,
            Lastname: this.state.Lastname,
            Birthdate: this.state.DateOfBirth,
            City: this.state.City,
            Country: this.state.Country,
            Phonenumber: this.state.Phonenumber,
            Punchline: this.state.Punchline,
            BasicKnowledge: this.state.BasicKnowledge,
            Education: this.state.Education,
            WorkHistory: this.state.WorkHistory,
            LanguageSkills: this.state.LanguageSkills
        };

        const emailsObj = {
            Emails: emailsArray
        };

        // All added links to social media services to array
        let servicesArray = [];
        let serviceSelects = document.getElementsByClassName("socialMediaSelect");
        for (let index = 0; index < serviceSelects.length; index++) {
            let servicesObj = "";
            let serviceSelect = document.getElementById("socialMediaSelect" + [index]);
            let serviceLinkInput = document.getElementById("socialMedia1Input" + [index]);
            let linkIdSpan = document.getElementById("spanLinkId" + [index]);

            servicesObj = {
                LinkId: linkIdSpan.textContent,
                ServiceId: serviceSelect.value,
                Link: serviceLinkInput.value
            };
            servicesArray.push(servicesObj);
        };

        const servicesObj = {
            Services: servicesArray
        };

        // Settings for axios requests
        let userId = this.props.userId;

        const contentSettings = {
            url: 'https://localhost:5001/api/portfoliocontent/content/' + userId,
            method: 'PUT',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: contentObj
        };

        const emailsSettings = {
            url: 'https://localhost:5001/api/portfoliocontent/emails/',
            method: 'PUT',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: emailsObj
        };


        const socialMediaSettings = {
            url: 'https://localhost:5001/api/socialmedia/' + userId,
            method: 'POST',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            data: servicesObj
        };

        // Requests
        const contentPost = Axios(contentSettings);
        const emailPost = Axios(emailsSettings);
        const socialMediaPost = Axios(socialMediaSettings);

        Promise.all([contentPost, emailPost, socialMediaPost])
            .then((responses) => {
                alert("The Content has saved succesfully!");
                if (this.Auth.getFirstLoginMark() === null) {
                    window.location.reload();
                } else {
                    this.Auth.setBasicsSavedMark();
                }
            })
            .catch(errors => {
                alert("There is a problem saving the content.\r\nPlease login again and see if the problem disappears.");
                console.log("Content error: " + errors[0]);
                console.log("Email error: " + errors[1]);
                console.log("Social media error: " + errors[2]);
            })
    }

    handleSubmit(e) {
        e.preventDefault();
        this.contentToDatabase();
    }

    // Updates states when user is going to edit his/her portfolio
    updateStates() {
        if (this.Auth.getFirstLoginMark()) {
            this.setState({
                Firstname: this.state.Basics.firstname,
                Lastname: this.state.Basics.lastname,
                DateOfBirth: this.convertToDate(this.state.Basics.birthdate),
                City: this.state.Basics.city,
                Country: this.state.Basics.country,
                Phonenumber: this.state.Basics.phonenumber,
                Punchline: this.state.Basics.punchline,
                BasicKnowledge: this.state.Basics.basicKnowledge,
                Education: this.state.Basics.education,
                WorkHistory: this.state.Basics.workHistory,
                LanguageSkills: this.state.Basics.languageSkills
            }, this.addValuesToInputs)
        } else {
            this.setState({
                Firstname: this.props.content.firstname,
                Lastname: this.props.content.lastname,
                DateOfBirth: this.convertToDate(this.props.content.birthdate),
                City: this.props.content.city,
                Country: this.props.content.country,
                Phonenumber: this.props.content.phonenumber,
                Emails: this.props.emails,
                Punchline: this.props.content.punchline,
                BasicKnowledge: this.props.content.basicKnowledge,
                Education: this.props.content.education,
                WorkHistory: this.props.content.workHistory,
                LanguageSkills: this.props.content.languageSkills
            }, this.addValuesToInputs)
        }
    }

    // Basic info from database when the first login is on
    basicInfoFromDatabase() {
        let userId = this.props.userId;

        // Settings for requests
        const basicsSettings = {
            url: 'https://localhost:5001/api/portfoliocontent/content/' + userId,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const emailSettings = {
            url: 'https://localhost:5001/api/portfoliocontent/emails/' + userId,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const socialMediaSettings = {
            url: 'https://localhost:5001/api/socialmedia/' + userId,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        // Requests
        const basicsGet = Axios(basicsSettings);
        const emailGet = Axios(emailSettings);
        const socialMediaGet = Axios(socialMediaSettings);

        // Promise
        Promise.all([basicsGet, emailGet, socialMediaGet])
            .then((response) => {
                // Render the updated skills to the screen
                this.setState({
                    Basics: response[0].data[0],
                    Emails: response[1].data
                }, this.updateStates)
                this.addExistingSocialMediaLinks(response[2].data)
            })
            .catch(errors => {
                console.log("Basics error: " + errors);
            })
    }

    render() {
        return (
            <form id="basicInfoForm" onSubmit={this.handleSubmit}>
                <Container id="basicInfoContainer">
                    <Row id="basicInfoUpperRow">
                        <Col id="personalCol">
                            <h4>Personal</h4>
                            <div id="scrollablePersonalDiv">
                                <Row>
                                    <Col>
                                        <Row>
                                            <Col>
                                                <b>Firstname</b> <br />
                                                <input id="firstnameInput" type="text" onChange={this.handleValueChange} /><br />
                                                <b>Lastname</b> <br />
                                                <input id="lastnameInput" type="text" onChange={this.handleValueChange} /><br />
                                                <b>Date of birth</b> <br />
                                                <input id="birthdateInput" type="date" onChange={this.handleValueChange} /><br />
                                                <b>City</b> <br />
                                                <input id="cityInput" type="text" onChange={this.handleValueChange} /><br />
                                            </Col>
                                            <Col>
                                                <b>Country</b> <br />
                                                <input id="countryInput" type="text" onChange={this.handleValueChange} /><br />
                                                <b>Phonenumber</b> <br />
                                                <input id="phoneInput" type="tel" onChange={this.handleValueChange} /><br />
                                                <span id="emailIdSpan1" className="emailIDSpan" hidden></span>
                                                <b>Email 1</b> <br />
                                                <input id="email1Input" className="emailInput" type="email" onBlur={this.handleValueChange} /><br />
                                                <span id="emailIdSpan2" className="emailIDSpan" hidden></span>
                                                <b>Email 2</b> <br />
                                                <input id="email2Input" className="emailInput" type="email" onBlur={this.handleValueChange} /><br />
                                            </Col>
                                        </Row>
                                    </Col>
                                </Row>
                                <Row>
                                    <Col>
                                        <b>Punchline to homepage</b> <br />
                                        <textarea id="punchlineInput" type="text" onChange={this.handleValueChange} /><br />
                                    </Col>
                                </Row>
                            </div>
                        </Col>
                        <Col id="basicCol">
                            <h4>Basic</h4>
                            <div id="scrollableBasicDiv">
                                <b>Basic Knowledge</b> <br />
                                <textarea id="basicInput" type="text" onChange={this.handleValueChange} /><br />
                                <b>Education</b> <br />
                                <textarea id="educationInput" type="text" onChange={this.handleValueChange} /><br />
                                <b>Work History</b> <br />
                                <textarea id="workHistoryInput" type="text" onChange={this.handleValueChange} /><br />
                                <b>Language Skills</b> <br />
                                <textarea id="languageinput" type="text" onChange={this.handleValueChange} /><br />
                            </div>
                        </Col>
                        <Col id="servicesCol">
                            <Row id="servicesUpperRow">
                                <Col id="servicesHeaderCol">
                                    <h4>Social media services</h4>
                                    <button id="addServiceBtn" type="button" title="Add a new service" onClick={this.addNewSocialMediaService}><span className="fas fa-plus"></span></button>
                                </Col>
                            </Row>
                            <Row id="servicesLowerRow">
                                <Col>
                                    <div id="socialMediaServices"></div>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                    <Row id="basicInfoLowerRow">
                        <Col className="saveChangesCol">
                            <button id="basicsSaveChangesBtn" className="saveChangesBtn" type="submit"><b>SAVE CHANGES</b></button>
                        </Col>
                    </Row>
                </Container>
            </form>
        )
    }
}

class AccountEdit extends Component {
    constructor(props) {
        super(props);
        this.state = {
            NewPassword: "",
            ConfirmedNewPassword: "",
            PasswordMatch: true,
            PicNameArray: []
        }
        this.checkPasswordSimilarity = this.checkPasswordSimilarity.bind(this);
        this.deleteAccount = this.deleteAccount.bind(this);
        this.deleteDirectoryFromAzure = this.deleteDirectoryFromAzure.bind(this);
        this.deletePicturesFromAzure = this.deletePicturesFromAzure.bind(this);
        this.getPictureNames = this.getPictureNames.bind(this);
        this.handleAzureDelete = this.handleAzureDelete.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleValueChange = this.handleValueChange.bind(this);
        this.Auth = new AuthService();
    }

    componentDidMount() {
        // If the first login mark exists, the request is not sent
        if (this.Auth.getFirstLoginMark() === null) {
            this.getPictureNames();
        }
    }

    // Checks the similarity of password and confirmed password
    checkPasswordSimilarity() {
        let small = document.getElementById("passwordChangeMatchWarning");
        if (this.state.NewPassword === this.state.ConfirmedNewPassword) {
            small.setAttribute("hidden", "hidden");
            this.setState({
                PasswordMatch: true
            });
        } else if (this.state.ConfirmedNewPassword === "" || this.state.NewPassword === "") {
            small.setAttribute("hidden", "hidden");
            this.setState({
                PasswordMatch: false
            });
        } else {
            small.removeAttribute("hidden");
            this.setState({
                PasswordMatch: false
            });
        }
    }

    // Get names of the pictures from Azure
    getPictureNames() {
        let userId = this.props.userId;
        let sasToken = "sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
        let uri = "https://webportfolio.file.core.windows.net/images/" + userId + "?restype=directory&comp=list&" + sasToken;
        const settings = {
            url: uri,
            method: 'GET',
            headers: {
                "x-ms-date": "now",
                "x-ms-version": "2019-07-07"
            }
        }

        Axios(settings)
            .then(response => {
                // Response from Azure is in XML format so it needs to parse from text string into an XML DOM object 
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(response.data, "text/xml");
                // Update filenames to PicNameArray state
                let picNameArray = [];
                for (let index = 0; index < 6; index++) {
                    let filename = xmlDoc.getElementsByTagName("Name")[index].childNodes[0].nodeValue;
                    picNameArray.push(filename);
                }
                this.setState({
                    PicNameArray: picNameArray
                })
            })
            .catch(err => {
                console.log(err.data);
            })
    }

    // Handles all what is needed to delete an account
    deleteAccount() {
        let confirmed = window.confirm("Are you sure you want to delete your account and all the content of it?");

        if (confirmed === true) {
            const settings = {
                url: 'https://localhost:5001/api/user/' + this.props.userId,
                method: 'DELETE',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            }

            Axios(settings)
                .then(response => {
                    this.handleAzureDelete();
                })
                .catch(error => {
                    alert("Problems!")
                })
        }
    }

    // After all of the users pics has deleted, the directory can be removed
    deleteDirectoryFromAzure() {
        console.log("deleteDirectoryFromAzure");
        // Variables for URI
        let userId = this.props.userId;
        let sasToken = "sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
        let uri = "https://webportfolio.file.core.windows.net/images/" + userId + "/?restype=directory&" + sasToken;

        // Settings for axios requests
        const settings = {
            url: uri,
            method: 'DELETE',
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
                "x-ms-date": "now",
                "x-ms-version": "2017-07-29"
            }
        }

        // Request
        Axios(settings)
            .then(response => {
                console.log("Delete dir status: " + response.status);
                // Remove all marks from localStorage
                this.Auth.logout();
                this.Auth.removeEditingMark();
                this.Auth.removeFirstLoginMark();
                this.Auth.removeBasicsSavedMark();
                this.Auth.removeSkillsAddedMark();
                this.Auth.removeFolderCreatedMark();

                alert("Your account and all the content has been deleted.\r\nThank you for using Web Portfolio..\r\nWe hope to get you back soon!");
                window.location.reload();
            })
            .catch(err => {
                console.log("Delete dir error status: " + err.response.status);
            })
    }

    // Removes all user pictures from Azure File Storage
    deletePicturesFromAzure() {
        let picNameArray = this.state.PicNameArray;
        let requestArray = []
        for (let index = 0; index < picNameArray.length; index++) {
            // Variables for URI
            let userId = this.props.userId;
            let sasToken = "sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
            let filename = picNameArray[index];
            let uri = "https://webportfolio.file.core.windows.net/images/" + userId + "/" + filename + "?" + sasToken;

            // Settings for axios requests
            const settings = {
                url: uri,
                method: 'DELETE',
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                    "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
                    "x-ms-date": "now",
                    "x-ms-version": "2017-07-29"
                }
            }

            // Request
            requestArray.push(Axios(settings));
        }
        Promise.all(requestArray)
                .then(responses => {
                    for (let index = 0; index < responses.length; index++) {
                        const element = responses[index];
                        console.log("Delete pic status: " + element.status);
                    }
                    this.deleteDirectoryFromAzure(); 
                })
                .catch(err => {
                    for (let index = 0; index < err.length; index++) {
                        const element = err[index];
                        console.log("Delete pic error status: " + element.response.status);
                    }
                })

    }
    
    // Handles delete from Azure (pics first, then directory)
    async handleAzureDelete() {
        this.deletePicturesFromAzure();
    }

    // Form submit for updating a password
    handleSubmit(e) {
        e.preventDefault();
        // Check if the new and confirmed password will match
        if (this.state.PasswordMatch) {
            // Get old password straight from the input, so it will not stored anywhere on a clients memory
            let oldPassword = md5(document.getElementById("oldPasswordInput").value);

            // Data for request
            const passwordObj = {
                OldPassword: oldPassword,
                NewPassword: this.state.ConfirmedNewPassword
            }

            // Settings for request
            const settings = {
                url: 'https://localhost:5001/api/user/' + this.props.userId,
                method: 'PUT',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                data: passwordObj
            }

            // Request
            Axios(settings)
                .then((response) => {
                    alert("The password has updated succesfully!");
                })
                .catch(error => {
                    if (error.response.status === 404) {
                        let small = document.getElementById("incorrectOldPasswordWarning");
                        small.removeAttribute("hidden");
                    } else {
                        alert("Problems!")
                    }
                })
        } else {
            alert("The new password and the confirmed password do not match.\r\nPlease type the right passwords and try again.")
        }

    }

    handleValueChange(input) {
        // Depending on input field, the right state will be updated
        let inputId = input.target.id;

        switch (inputId) {
            case "oldPasswordInput":
                let small = document.getElementById("incorrectOldPasswordWarning");
                small.setAttribute("hidden", "hidden");
                break;
            case "newPasswordInput":
                if (input.target.value === "") {
                    this.setState({
                        NewPassword: input.target.value
                    }, this.checkPasswordSimilarity);
                } else {
                    this.setState({
                        NewPassword: md5(input.target.value)
                    }, this.checkPasswordSimilarity);
                }
                break;

            case "confirmNewPasswordInput":
                if (input.target.value === "") {
                    this.setState({
                        ConfirmedNewPassword: input.target.value
                    }, this.checkPasswordSimilarity);
                } else {
                    this.setState({
                        ConfirmedNewPassword: md5(input.target.value)
                    }, this.checkPasswordSimilarity);
                }
                break;

            default:
                break;
        }
    }

    render() {
        return (
            <Container>
                <Row>
                    <Col id="changePasswordCol">
                        <form onSubmit={this.handleSubmit}>
                            <h4>Change password</h4>
                            <input id="oldPasswordInput" type="password" placeholder="Old password" onChange={this.handleValueChange} />
                            <small hidden id="incorrectOldPasswordWarning">The old password is incorrect!</small>
                            <input id="newPasswordInput" type="password" placeholder="New password" onChange={this.handleValueChange} />
                            <input id="confirmNewPasswordInput" type="password" placeholder="Confirm new password" onChange={this.handleValueChange} />
                            <small hidden id="passwordChangeMatchWarning">The paswords doesn't match!</small>
                            <button id="changePasswordBtn" type="submit">CHANGE PASSWORD</button>
                        </form>
                    </Col>
                    <Col id="deleteAccountCol">
                        <h4>Delete an account</h4>
                        <button id="deleteAccountBtn" type="button" onClick={this.deleteAccount}>DELETE</button>
                    </Col>
                </Row>
            </Container>
        )
    }
}

class EditPortfolio extends Component {
    constructor() {
        super();
        this.state = {
            Profile: "",
            BasicInfoBool: true,
            SkillsBool: false,
            PicturesBool: false,
            AccountBool: false,
            Content: "",
            Emails: "",
            Skills: "",
            SocialMediaLinks: "",
            ProfilePicUrl: "",
            HomePicUrl: "",
            IamPicUrl: "",
            IcanPicUrl: "",
            QuestbookPicUrl: "",
            ContactPicUrl: ""
        };
        this.createFolderToAzureFileStorage = this.createFolderToAzureFileStorage.bind(this);
        this.getBasicContent = this.getBasicContent.bind(this);
        this.getContent = this.getContent.bind(this);
        this.handleNavClick = this.handleNavClick.bind(this);
        this.Auth = new AuthService();
    }

    componentDidMount() {
        // Classname to header
        let header = document.getElementById("header");
        header.className = "sticky";
        header.style.background = "transparent";
        // Background image to the root div
        document.getElementById("root").style.backgroundImage = "url(" + background + ")";
        document.getElementById("root").style.backgroundSize = "100% 100%";

        // re-position a footer
        let footer = document.getElementById("footer");
        if (!footer.classList.contains("absolute")) {
            footer.className = "absolute";
            footer.style.backgroundColor = "transparent";
        }

        /*
            If the first login mark exists, the basic content request is sent and the folder will be created to Azure

            If a user reloads the page during the first login, 
            the folder is already created and thats why only the basic content request will be sent.
        */
        if (this.Auth.getFirstLoginMark() !== null && this.Auth.getFolderCreatedMark() === null) {
            const callbackFunctions = () => {
                this.getBasicContent();
                this.createFolderToAzureFileStorage();
            };
            this.setState({
                Profile: this.Auth.getProfile()
            }, callbackFunctions);
        } else if (this.Auth.getFirstLoginMark() !== null && this.Auth.getFolderCreatedMark() !== null) {
            this.setState({
                Profile: this.Auth.getProfile()
            }, this.getBasicContent);
        } else {
            this.setState({
                Profile: this.Auth.getProfile()
            }, this.getContent);
        }
    }

    // Build the url for the state of image depending on type ID
    updateImageStates(data) {
        for (let index = 0; index < data.length; index++) {
            let typeId = data[index].typeId;
            switch (typeId) {
                case 1:
                    this.setState({
                        ProfilePicUrl: data[index].url
                    })
                    break;

                case 2:
                    this.setState({
                        HomePicUrl: data[index].url
                    })
                    break;

                case 3:
                    this.setState({
                        IamPicUrl: data[index].url
                    })
                    break;

                case 4:
                    this.setState({
                        IcanPicUrl: data[index].url
                    })
                    break;

                case 5:
                    this.setState({
                        QuestbookPicUrl: data[index].url
                    })
                    break;

                case 6:
                    this.setState({
                        ContactPicUrl: data[index].url
                    })
                    break;

                default:
                    break;
            }
        }
    }

    // Create a folder to Azure File Storage for users images
    createFolderToAzureFileStorage() {
        // Variables for URI
        let userId = this.state.Profile.nameid;
        let sasToken = "sv=2019-10-10&ss=bfqt&srt=sco&sp=rwdlacu&se=2020-09-30T16:28:04Z&st=2020-05-05T08:28:04Z&spr=https,http&sig=ITXbiBLKA3XX0lGW87pl3gLk5VB62i0ipWfAcfO%2F2dA%3D";
        let uri = "https://webportfolio.file.core.windows.net/images/" + userId + "?restype=directory&" + sasToken;

        // Settings for axios requests
        const settings = {
            url: uri,
            method: 'PUT',
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
                "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
                "x-ms-date": "now",
                "x-ms-version": "2017-07-29"
            }
        };

        // Create folder request
        Axios(settings)
            .then(response => {
                console.log("Create folder to Azure: " + response.data);
                this.Auth.setFolderCreatedMark();
            })
            .catch(error => {
                console.log("Create folder to Azure error: " + error.response.data);
            })
    }

    // Get the basic content for edit forms when user has logged in for the first time
    getBasicContent() {
        // Settings for requests
        const contentSettings = {
            url: 'https://localhost:5001/api/portfoliocontent/content/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const emailSettings = {
            url: 'https://localhost:5001/api/portfoliocontent/emails/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        // Requests
        const contentGet = Axios(contentSettings);
        const emailGet = Axios(emailSettings);

        // Promises
        Promise.all([contentGet, emailGet])
            .then((responses) => {
                this.setState({
                    Content: responses[0].data[0],
                    Emails: responses[1].data,
                });
            })
            .catch(errors => {
                console.log("Content error: " + errors[0]);
                console.log("Email error: " + errors[1]);
            })
    }

    // Get all the content for edit forms
    getContent() {
        // Settings for requests
        const contentSettings = {
            url: 'https://localhost:5001/api/portfoliocontent/content/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const emailSettings = {
            url: 'https://localhost:5001/api/portfoliocontent/emails/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const skillsSettings = {
            url: 'https://localhost:5001/api/skills/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const questbookSettings = {
            url: 'https://localhost:5001/api/questbook/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const socialMediaSettings = {
            url: 'https://localhost:5001/api/socialmedia/' + this.state.Profile.nameid,
            method: 'GET',
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            }
        }

        const imagesSettings = {
            url: 'https://localhost:5001/api/images/' + this.state.Profile.nameid,
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
                    SocialMediaLinks: responses[4].data
                });
            })
            .catch(errors => {
                console.log("Content error: " + errors[0]);
                console.log("Email error: " + errors[1]);
                console.log("Skills error: " + errors[2]);
                console.log("Questbook error: " + errors[3]);
                console.log("Social media error: " + errors[4]);
            })
    }

    // Controls which form (info/skills/pictures/account) will be rendered
    handleNavClick(btn) {
        let btnId = btn.target.id;
        if (btnId === "basicInfoNavBtn") {
            this.setState({
                BasicInfoBool: true,
                SkillsBool: false,
                PicturesBool: false,
                AccountBool: false
            });
        } else if (btnId === "skillsNavBtn") {
            this.setState({
                BasicInfoBool: false,
                SkillsBool: true,
                PicturesBool: false,
                AccountBool: false
            });
        } else if (btnId === "picturesNavBtn") {
            this.setState({
                BasicInfoBool: false,
                SkillsBool: false,
                PicturesBool: true,
                AccountBool: false
            });
        } else if (btnId === "accountNavBtn") {
            this.setState({
                BasicInfoBool: false,
                SkillsBool: false,
                PicturesBool: false,
                AccountBool: true
            });
        } else {
            alert("Error happened. Please refresh the page.");
        }
    }

    render() {
        if (this.Auth.getFirstLoginMark() === null) {
            return (
                <main className="editPortfolio">
                    <Container>
                        <Row id="navRow">
                            <Col id="navCol">
                                <button id="basicInfoNavBtn" onClick={this.handleNavClick}>BASIC INFO</button>
                                <button id="skillsNavBtn" onClick={this.handleNavClick}>SKILLS</button>
                                <h3>Edit portfolio</h3>
                                <button id="picturesNavBtn" onClick={this.handleNavClick}>IMAGES</button>
                                <button id="accountNavBtn" onClick={this.handleNavClick}>ACCOUNT</button>
                            </Col>
                        </Row>
                        <Fragment>
                            {/* InfoEdit */}
                            {this.state.BasicInfoBool && this.state.Content && this.state.Emails && this.state.SocialMediaLinks ?
                                <InfoEdit
                                    userId={this.state.Profile.nameid}
                                    content={this.state.Content}
                                    emails={this.state.Emails}
                                    links={this.state.SocialMediaLinks}
                                /> : null}
                            {/* SkillsEdit */}
                            {this.state.SkillsBool && this.state.Skills ?
                                <SkillsEdit
                                    userId={this.state.Profile.nameid}
                                    skills={this.state.Skills}
                                /> : null}
                            {/* PictureEdit */}
                            {this.state.PicturesBool ?
                                <PictureEdit
                                    userId={this.state.Profile.nameid}
                                    homePicUrl={this.state.HomePicUrl}
                                    profilePicUrl={this.state.ProfilePicUrl}
                                    iamPicUrl={this.state.IamPicUrl}
                                    icanPicUrl={this.state.IcanPicUrl}
                                    questbookPicUrl={this.state.QuestbookPicUrl}
                                    contactPicUrl={this.state.ContactPicUrl}
                                /> : null}
                            {/* AccountEdit */}
                            {this.state.AccountBool ?
                                <AccountEdit
                                    userId={this.state.Profile.nameid}
                                /> : null}
                        </Fragment>
                    </Container>
                </main>
            );
        } else {
            return (
                <main className="editPortfolio">
                    <Container>
                        <Row id="navRow">
                            <Col id="navCol">
                                <button id="basicInfoNavBtn" onClick={this.handleNavClick}>BASIC INFO</button>
                                <button id="skillsNavBtn" onClick={this.handleNavClick}>SKILLS</button>
                                <h3>Edit portfolio</h3>
                                <button id="picturesNavBtn" onClick={this.handleNavClick}>IMAGES</button>
                                <button id="accountNavBtn" onClick={this.handleNavClick}>ACCOUNT</button>
                            </Col>
                        </Row>
                        <Fragment>
                            {/* InfoEdit */}
                            {this.state.BasicInfoBool && this.state.Content && this.state.Emails ?
                                <InfoEdit
                                    userId={this.state.Profile.nameid}
                                    content={this.state.Content}
                                    emails={this.state.Emails}
                                /> : null}
                            {/* SkillsEdit */}
                            {this.state.SkillsBool ?
                                <SkillsEdit
                                    userId={this.state.Profile.nameid}
                                /> : null}
                            {/* PictureEdit */}
                            {this.state.PicturesBool ?
                                <PictureEdit
                                    userId={this.state.Profile.nameid}
                                /> : null}
                            {/* AccountEdit */}
                            {this.state.AccountBool ?
                                <AccountEdit
                                    userId={this.state.Profile.nameid}
                                /> : null}
                        </Fragment>
                    </Container>
                </main>
            );
        }

    }
}

export default EditPortfolio;