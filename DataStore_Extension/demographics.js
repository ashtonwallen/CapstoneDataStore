/**
DataStore Capstone Project

Author: Ashton Allen
Email: aashton482@gmail.com

demographics.js

Allows user to fill out and save demographic information
Email is required for platform usage

**/

var background = chrome.extension.getBackgroundPage();

//simple selector
function select(id) {
    return document.getElementById(id);
}

document.addEventListener('DOMContentLoaded', function() {
    select('save_demo').onclick = saveAnswers;
    select('reset_demo').onclick = resetDemo;
    retreiveSettings();
});



// Allows user to save demo answers assuming they have entered an email in the correct format
function saveAnswers() {
    var date_reg = /^[0-9]{2}[\/][0-9]{2}[\/][0-9]{4}$/g;
    var email_reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

    if (email_reg.test(select('Email Address').value)) {
        storeSettings();
        background.getDemographics();
        location.reload();
    } else {
        alert('Please enter valid email address')
    }


}

// Retreives previously stored demo info
function retreiveSettings(callback) {
    chrome.storage.local.get('userDemographics', function(result) {

       

        try {
            result = JSON.parse(result['userDemographics'])



            var elms = document.querySelectorAll('.question_input');
            elms.forEach(function(elem) {
                if (result[elem.id])
                    elem.value = result[elem.id]
            })
        } catch (e) {} //user has no stored data
    });
}

// Stores input demographic info
function storeSettings() {
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
        console.log('Saved Demo', key, prefs);
    });

    background.getDemographics();
}

//Resets stored demographic info
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