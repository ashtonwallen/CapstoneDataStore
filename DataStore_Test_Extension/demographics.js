/**
DataStore Capstone Project

Author: Ashton Allen
Email: aashton482@gmail.com

demographics.js

Allows user to fill out and save demographic information
Email is required for platform usage

**/

var background = chrome.extension.getBackgroundPage();


function CustomException(message) {
    const error = new Error(message);
    return error;
}

CustomException.prototype = Object.create(Error.prototype);

function select(id) {
    return document.getElementById(id);
}

document.addEventListener('DOMContentLoaded', function() {
    select('save_demo').onclick = saveAnswers;
    select('reset_demo').onclick = resetDemo;
    retreiveSettings();
});




function saveAnswers() {
    var date_reg = /^[0-9]{2}[\/][0-9]{2}[\/][0-9]{4}$/g;
    var email_reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

    if (email_reg.test(select('Email Address').value)) {
        storeSettings();
        background.getDemographics();
       // location.reload(); commented out to keep output
    } else {
        alert('Please enter valid email address')
    }


}


function retreiveSettings(callback) {
        chrome.storage.local.get('userDemographics', function(result) {
            try {
            result = JSON.parse(result['userDemographics']);

            var elms = document.querySelectorAll('.question_input');
            elms.forEach(function(elem) {
                if (result[elem.id])
                    elem.value = result[elem.id];
            })
            console.log("Retreive settings passed")
        } catch (e) {console.log("Retreive settings failed -- ignore if this is first time setup")}
        })
}

function storeSettings() {
    try {
        var key = 'userDemographics'
        var json = {};
        var questionsWithAnswers = {}

        var elms = document.querySelectorAll('.question_input');
        elms.forEach(function(elem) {
            questionsWithAnswers[elem.id] = elem.value
        })

        var prefs = JSON.stringify(questionsWithAnswers);

        json[key] = prefs;


        chrome.storage.local.set(json, function() {
            console.log('StoreDemographic Settings Passed')
        });

        background.getDemographics();
    }
    catch (e) {console.log("Store Demographic Settings Failed: " + e)}
}

function resetDemo() {
    var answer = window.confirm("Clear stored demographic information?")
    if (answer) {
        var elms = document.querySelectorAll('.question_input');
        elms.forEach(function(elem) {
            elem.value = '';
        })
        storeSettings();
    }
}