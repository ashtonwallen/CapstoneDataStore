const parsed = jsonText => JSON.parse(jsonText);
const fr = new FileReader();
var fileInput = select('fileinput');

const config = {
    apiKey: "AIzaSyAJywW-CmK5QH5lIcOoHSBNJrTkSDbQmRc",
    authDomain: "datastore-3d399.firebaseapp.com",
    databaseURL: "https://datastore-3d399.firebaseio.com",
    projectId: "datastore-3d399",
    storageBucket: "datastore-3d399.appspot.com",
    messagingSenderId: "202616377876",
    appId: "1:202616377876:web:e74721aeedadbfcb4dcd01",
    measurementId: "G-Z8V4LGF219"
};
firebase.initializeApp(config);
var database = firebase.database();


function writeInfo(data) {
    var data_div = select('meta_info');
    var demo_div = select('demo_info');
    var demographics = data['userDemographics'];
    var metaData = data['metaData'];

    var filesize_div = document.createElement('div');
    filesize_div.innerHTML = '<p>' + '<b>' + fileInput.files[0].size.toString() + ' bytes including:</b>\t'
    data_div.append(filesize_div)

    displayData(metaData, data_div);
    displayData(demographics, demo_div);


    var uploadButton = select('upload_button');

    uploadButton.addEventListener("click", function() {
        writeUserData(generateId(), data);
    });
};

function displayData(data, div) {
    Object.keys(data).forEach(function(key) {
        if (data[key] == '' || !data[key] || data[key] == 'NA')
            data[key] = 'Not Provided'

        if (data[key]) {
            var child = document.createElement('div');
            if (!isNaN(key))
                child.innerHTML = '<p>' + '<b>' + data[key].toString() + '</b></p>'
            else
                child.innerHTML = '<p>' + '<b>' + key + '</b>&nbsp;&nbsp;' + data[key].toString() + '</p>'

            div.append(child)
        }

    });
}


function handleFileSelect(evt) {
    fr.readAsText(evt.target.files[0])
};

fr.onload = e => {
    writeInfo(parsed(e.target.result));
};

function writeUserData(id, json) {

    console.log(json.userDemographics)
    firebase.database().ref('listings/' + id).set({
        'meta': json.metaData,
        'demo': json.userDemographics
    });
}


function generateId() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8));
    });
    return uuid;
}

function select(id) {
    return document.getElementById(id);
}

document.addEventListener('DOMContentLoaded', function() {
    fileInput.addEventListener('change', handleFileSelect, false);

}, false)