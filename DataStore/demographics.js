var background = chrome.extension.getBackgroundPage();

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
        location.reload();
    } else {
        alert('Please enter valid email address')
    }


}


function retreiveSettings(callback) {
    chrome.storage.local.get('userDemographics', function(result) {

        result = JSON.parse(result['userDemographics'])

        var elms = document.querySelectorAll('.question_input');
        elms.forEach(function(elem) {
            if (result[elem.id])
                elem.value = result[elem.id]
        })
    });
}

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