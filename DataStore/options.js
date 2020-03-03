var background = chrome.extension.getBackgroundPage();

function saveOptions() {
  background.saveUserSettings();
  background.getFirstTimeData();
  location.reload();
}


function setBox(elem) {
  elem.checked = true;
}

function resetSettings() {
  background.track_none = true;
  background.setDatapoints();
  saveOptions();
}


function setUpTrackers(div_url, tracked_data) {
  numRecords = background.collected_data['session'].length;
  record_div = document.createElement('span');
  record_div.setAttribute('id', 'record_num');
  var text = "<b>" + numRecords + " records " + "</b>"
  if (numRecords > 0 && !background.track_none)
    text += "including: ";

  record_div.innerHTML += text + "<hr>"
  tracked_data.appendChild(record_div);


  //set up trackers
  Object.keys(background.trackable_datapoints).forEach(function(datapoint) {
    var datapoint_element = document.createElement('p');
    var datapoint_toggle = document.createElement('input');

    var label = document.createElement("label");
    label.setAttribute("class", "switch");


    datapoint_toggle.setAttribute('type', 'checkbox');
    datapoint_toggle.setAttribute('id', datapoint + '_id');
    datapoint_toggle.setAttribute('class', 'options_checkbox');
    datapoint_toggle.setAttribute('class', 'form-control');


    datapoint_toggle.onclick = (function() {
      background.trackable_datapoints[datapoint] = !background.trackable_datapoints[datapoint];
      var areFalse = allFalse();

      select('track_any_check').checked = areFalse;
      background.track_none = areFalse;

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
    setBox(toggle);
    toggleAll(background.track_none)
  } else {
    Object.keys(background.trackable_datapoints).forEach(function(datapoint) {
      if (background.trackable_datapoints[datapoint]) {
        toggle = select(datapoint + '_id');
        setBox(toggle)
      }

    })
  }

}

function allFalse() {
  retval = true;
  Object.keys(background.trackable_datapoints).forEach(function(key) {
    if (background.trackable_datapoints[key])
      retval = false;
  });

  return retval;
}

function toggleAll(checked) {
  if (checked) {
    background.track_none = true;
    var elms = document.querySelectorAll('.options_checkbox');
    elms.forEach(elem => elem.disabled = true);

  } else {
    background.track_none = false;
    background.trackable_datapoints['urls'] = true;
    select('urls_id').checked = true;
    var elms = document.querySelectorAll('.options_checkbox');
    elms.forEach(elem => elem.disabled = false)
  }
}

function clearStoredData() {
  var answer = window.confirm("Clear stored data?")
  if (answer) {
    background.clearSavedData();
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

  background.collected_data['session'].forEach(function(data) {
    row = table.insertRow(0)
    var row = table.insertRow(-1);
    row.setAttribute('class', 'table_row');
    row.insertCell(-1).innerText = data.url;
    row.onclick = (function() {
      createExternalView(data);
    });
    parent.appendChild(table);

  });
}


function createExternalView(data) {
  background.temp_data = data;
  chrome.tabs.create({
    url: chrome.runtime.getURL("view_content.html"),
  });
}


function downloadFile() { //can do zip file if needed
  fileName = "userdata/userData.txt";
  content = getUserContent();
  var blob = new Blob([content], {  
    type: "text/plain;charset=UTF-8"
  });
  url = window.URL.createObjectURL(blob);

  chrome.downloads.download({
    url: url,
    filename: fileName
  })
}

function getUserContent() {
  retval = '';

  background.collected_data['session'].forEach(function(data) {

    Object.keys(data).forEach(function(key) {
      retval += key + ': ' + data[key] + '\n';
    })
  });

  return retval;
}

document.addEventListener('DOMContentLoaded', function() {
  const tracked_data_element = select('tracked_data');
  const div_url = select('data_selection')

  select('store_tracked').onclick = downloadFile;

  //set up trackers
  var datapoint_all = select('track_any_check');
  datapoint_all.onclick = (function() {
    toggleAll(datapoint_all.checked);
  });

  setUpTrackers(div_url, tracked_data_element);

  select('save_datamanager').onclick = saveOptions;
  select('reset_datamanager').onclick = resetSettings;
  select('clear_tracked').onclick = clearStoredData;
  select('post_button').onclick = storeToFirebase;

}, false)


function storeToFirebase() {
chrome.runtime.sendMessage({command: "add", collection: "users", data: {name: "user"}}, (msg) => {
  console.log("response", msg)
});
}



function select(id) {
  return document.getElementById(id);
}