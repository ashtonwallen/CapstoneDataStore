var background = chrome.extension.getBackgroundPage();

function saveOptions() {
    background.saveUserSettings();
    background.getFirstTimeData();
    location.reload();
}

function resetSettings() {
    var answer = window.confirm("Reset tracker settings?")
    if (answer) {
        background.track_none = true;
        background.setDatapoints();
        saveOptions();
    }
}

function getNumRecords() {
    var recCollected = 0;
    if (background.collected_data) {
        Object.keys(background.collected_data).forEach(function(key) {
            if (background.collected_data[key] && background.collected_data[key].length > 1) {
                recCollected += 1;
                if (key == 'session') {
                    recCollected += background.collected_data[key].length;
                }
            }
        })
        return recCollected - 1;
    }
}


function setUpTrackers(div_url, tracked_data) {
    numRecords = getNumRecords();
    record_div = document.createElement('span');
    record_div.setAttribute('id', 'record_num');
    var text = "<b>" + "Collected records " + "</b>"
    if (numRecords > 0 && !background.track_none)
        text += "including: ";

    record_div.innerHTML += text + "<hr>"
    tracked_data.appendChild(record_div);

    //set up tracker all
    var datapoint_all = select('track_any_check');
    datapoint_all.onclick = (function() {
        background.track_none = !background.track_none
        toggleAll(background.track_none)
    });

    //set up trackers
    Object.keys(background.trackable_datapoints).forEach(function(datapoint) {
        var datapoint_element = document.createElement('p');
        var datapoint_toggle = document.createElement('input');

        var label = document.createElement("label");
        label.setAttribute("class", "switch");


        datapoint_toggle.setAttribute('type', 'checkbox');
        datapoint_toggle.setAttribute('id', datapoint + '_id');
        datapoint_toggle.setAttribute('class', 'options_checkbox form-control');
        console.log(datapoint_toggle)

        datapoint_toggle.onclick = (function() {
            background.trackable_datapoints[datapoint] = !background.trackable_datapoints[datapoint];
            var areFalse = allFalse();

            select('track_any_check').checked = areFalse;
            background.track_none = areFalse;
            toggleAll(background.track_none);
        });

        datapoint_element.textContent = datapoint;

        label.appendChild(datapoint_toggle);
        var span = document.createElement('span');
        span.setAttribute('class', 'slider round');
        label.appendChild(span)
        datapoint_element.appendChild(label);
        datapoint_element.appendChild(document.createElement('hr'));
        div_url.appendChild(datapoint_element);

        if (numRecords > 0 && background.trackable_datapoints[datapoint])
            tracked_data.appendChild(setupMetaView(datapoint));

    });

    if (numRecords > 0) {
        const view_button = document.createElement('button');
        view_button.setAttribute('id', "dataexpand_button");
        view_button.onclick = (function() {
            expandData();
        });
        view_button.innerHTML = 'expand';

        tracked_data.appendChild(view_button);
    }

    background.retreiveSettings();

    if (background.track_none) {
        toggle = select('track_any_check')
        toggle.checked = true;
        toggleAll(background.track_none)
    } else {
        Object.keys(background.trackable_datapoints).forEach(function(datapoint) {
            if (background.trackable_datapoints[datapoint]) {
                select(datapoint + '_id').checked = true;
            }
        })
    }

}


function toggleAll(checked) {
    if (checked) {
        var elms = document.querySelectorAll('.options_checkbox');
        elms.forEach(function(elem) {
            elem.checked = false;
            elem.disabled = true;
        });

    } else {
        background.trackable_datapoints['Urls'] = true;
        select('Urls_id').checked = true;
        var elms = document.querySelectorAll('.options_checkbox');
        elms.forEach(elem => elem.disabled = false)
    }
}

function allFalse() {
    var retval = true;
    Object.keys(background.trackable_datapoints).forEach(function(key) {
        if (background.trackable_datapoints[key])
            retval = false;
    });

    return retval;
}


function clearStoredData() {
    var answer = window.confirm("Clear stored data and reset tracker settings?")
    if (answer) {
        background.clearSavedData();
        resetSettings();
        location.reload();
    }

}

function setupMetaView(datapoint) {
    const data_info = document.createElement('p');
    data_info.textContent = datapoint;

    return data_info;
}

function expandData() {
    var parent = select('expanded_data');
    var table_id = 'dataview_table';
    var table = select(table_id);

    if (table) {
        table.remove()
        return;
    }

    table = document.createElement("TABLE");
    table.setAttribute('id', table_id);
    var header = table.createTHead();

    if (background.collected_data) {
        Object.keys(background.collected_data).forEach(function(key) {
            if (key != 'session') {
                if (background.collected_data[key].length > 0) {
                    row = table.insertRow(0)
                    var row = table.insertRow(-1);
                    row.setAttribute('class', 'table_row');
                    row.insertCell(-1).innerText = key;
                    row.onclick = (function() {
                        createExternalView(key, background.collected_data[key]);
                    });
                }
            }
        });


        background.collected_data['session'].forEach(function(data) {
            row = table.insertRow(0)
            var row = table.insertRow(-1);
            row.setAttribute('class', 'table_row');
            if (data.url.length > 100)
                row.insertCell(-1).innerText = data.url.slice(0, (data.url.length - (data.url.length - 100)));
            else
                row.insertCell(-1).innerText = data.url;
            row.onclick = (function() {
                createExternalView('session', data);
            });
        });
    }
    parent.appendChild(table);
}


function createExternalView(key, data) {
    background.temp_data = {};
    background.temp_data[key] = data;
    chrome.tabs.create({
        url: chrome.runtime.getURL("view_content.html"),
    });
}

//generate listing id and append to file extennsion for firebase listings
function downloadFile() { //can do zip file if needed
    var fileName = 'data.json';
    var content = getUserContent();

    if (content.header.metaData == [] || content.header.userDemographics['Email Address'] == '')
        alert("Please ensure you have collected personal data or provided an email address in the user demographics section")
    else {
        console.log()
        var fileToSave = new Blob([JSON.stringify(content)], {
            type: 'application/json',
            name: fileName
        });

        url = window.URL.createObjectURL(fileToSave);

        chrome.downloads.download({
            url: url,
            filename: fileName
        })
    }
}

function getUserContent() {
    var retVal = {};

    var header = getMetaData();

    var content = {}
    Object.keys(background.collected_data).forEach(function(key) {
        content[key] = background.collected_data[key]
    });

    retVal['header'] = header;
    retVal['content'] = content;
    return retVal;
}

function getMetaData() {
    retVal = {};
    var filtered = Object.keys(background.trackable_datapoints).reduce(function(filtered, key) {
        if (background.trackable_datapoints[key]) filtered.push(key)
        return filtered;
    }, []);

    retVal['metaData'] = filtered
    retVal['userDemographics'] = background.demographics;

    return retVal;
}

function postStoredData() {
    downloadFile();

    //go to listing site once live ----------------------------------------------
    // chrome.tabs.create({
    //     url: chrome.runtime.getURL("../DataStorePlatform/new_listing.html"),
    // });
}

document.addEventListener('DOMContentLoaded', function() {
    const tracked_data_element = select('tracked_data');
    const div_url = select('data_selection')




    setUpTrackers(div_url, tracked_data_element);

    select('save_datamanager').onclick = saveOptions;
    select('reset_datamanager').onclick = resetSettings;
    select('clear_tracked').onclick = clearStoredData;
    select('post_button').onclick = postStoredData;

}, false)


function select(id) {
    return document.getElementById(id);
}