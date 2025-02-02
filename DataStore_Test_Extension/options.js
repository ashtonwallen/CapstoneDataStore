function CustomException(message) {
    const error = new Error(message);
    return error;
}

CustomException.prototype = Object.create(Error.prototype);

var background = chrome.extension.getBackgroundPage();

function saveOptions() {

    try {
        background.saveUserSettings();
        background.getFirstTimeData();
        console.log("Test resetSettings() Passed")
    } catch (e) { console.log("Test resetSettings() Failed: " + e) }

}

function resetSettings() {
    try {
        var answer = window.confirm("Reset tracker settings?")
        if (answer) {
            background.track_none = true;
            background.setDatapoints();
            saveOptions();
        }

        Object.keys(background.trackable_datapoints).forEach(function(key) {
            if (background.trackable_datapoints[key])
                throw new CustomException('Settings Not Cleared');
        })

        console.log("Test resetSettings() Passed")
    } catch (e) { console.log("Test resetSettings() Failed: " + e) }

}

function getNumRecords() {
    try {
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
        console.log("Test getNumRecords() Passed")
    } catch (e) { console.log("Test getNumRecords() Failed: " + e) }
}


function setUpTrackers(div_url, tracked_data) {
    try {
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
                if (select(datapoint + '_id').checked != background.trackable_datapoints[datapoint])
                    throw new CustomException("Tracker setting was not updated!")
            })
        }
        console.log("Test setUpTrackers() Passed")
    } catch (e) { console.log("Test setUpTrackers() Failed: " + e) }

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
    try {
        var retval = true;
        Object.keys(background.trackable_datapoints).forEach(function(key) {
            if (background.trackable_datapoints[key])
                retval = false;
        });


        console.log("Test allFalse() passed")
        return retval;
    } catch (e) { console.log("Test allFalse() failed: " + e) }
}


function clearStoredData() {
    var answer = window.confirm("Clear stored data and reset tracker settings?")
    try {
        if (answer) {
            background.clearSavedData();
            resetSettings();
            //  location.reload();
            Object.keys(background.collected_data).forEach(function(key) {
                if (background.collected_data[key].length > 0)
                    throw new CustomException('Data Not Cleared')
            })
            console.log("Test clearStoredData passed")
        }
    } catch (e) { console.log("Test clearStoredData() Failed: " + e) }

}

function setupMetaView(datapoint) {
    const data_info = document.createElement('p');
    data_info.textContent = datapoint;

    return data_info;
}

function expandData() {
    try {
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
        console.log("Test expandData() Passed")
    } catch (e) { console.log("Test expandData() Failed: " + e) }

}


function createExternalView(key, data) {
    try {
        background.temp_data = {};
        background.temp_data[key] = data;
        chrome.tabs.create({
            url: chrome.runtime.getURL("view_content.html"),
        });
        if (background.temp_data[key] != data)
            throw new CustomException("External View Data Not Stored")

        console.log("Test createExternalView() Passed")
    } catch (e) { console.log("Test createExternalView failed: " + e) }


}


function downloadFile() {
    try {
        var fileName = 'data.json';
        var content = getUserContent();

        if (content.header.metaData == [] || content.header.userDemographics['Email Address'] == '')
            alert("Please ensure you have collected personal data or provided an email address in the user demographics section")
        else {

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
        console.log("Test downloadFile() Passed")
    } catch (e) { console.log("Test downloadFile() failed:" + e) }

}

function getUserContent() {
    try {
        var retVal = {};

        var header = getMetaData();

        var content = {}
        Object.keys(background.collected_data).forEach(function(key) {
            content[key] = background.collected_data[key]
        });

        retVal['header'] = header;
        retVal['content'] = content;

        if (!header || !content)
            throw new CustomException("Unable to query user content")

        return retVal;
        console.log("Test getUserContent Passed:")
    } catch (e) { console.log("Test getUserContent Failed:" + e) }

}

function getMetaData() {
    try {
        retVal = {};
        var filtered = Object.keys(background.trackable_datapoints).reduce(function(filtered, key) {
            if (background.trackable_datapoints[key]) filtered.push(key)
            return filtered;
        }, []);

        retVal['metaData'] = filtered
        retVal['userDemographics'] = background.demographics;

        if (!filtered || !background.demographics)
            throw new CustomException("Unable to query user metadata")

        console.log("Test getMetaData Passed:")
        return retVal;
    } catch (e) { console.log("Test getMetaData Failed: " + e) }

}

function postStoredData() {
    downloadFile();

    chrome.tabs.create({
        url: "http://datastoreproject.com/new_listing.html"
    });
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