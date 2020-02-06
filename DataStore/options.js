const background = chrome.extension.getBackgroundPage();

function saveOptions() {
  var key = 'userSettingsData'
  var prefs = "";
  var json = {};
  var values;

  prefs = JSON.stringify({
    'trackable_datapoints': background.trackable_datapoints,
    'track_none': background.track_none
  });

  json[key] = prefs;

  chrome.storage.sync.set(json, function() {
    location.reload();
  });
  console.log("Saved")
}

function retreiveSettings(callback) {
  chrome.storage.sync.get('userSettingsData', function(result) {
    if (Object.keys(result['userSettingsData']).length > 0) {
      result = result['userSettingsData'];
      result = JSON.parse(result);

      background.trackable_datapoints = result['trackable_datapoints'];
      background.track_none = result['track_none'];
      console.log(background.trackable_datapoints)

      if (background.track_none) {
        toggle = select('track_any_check')
        setBox(toggle);
        toggleAll(background.track_none)
      } else {
        Object.keys(background.trackable_datapoints).forEach(function(datapoint) {
          if (background.trackable_datapoints[datapoint]) {
            console.log('hereshouldbesetting')
            toggle = select(datapoint + '_id');
            setBox(toggle)
          }

        })
      }
    }
  });

}

function setBox(elem) {
  elem.checked = true;
}

function resetSettings() {
  background.track_none = false;
  clearStoredData();
  resetTrackers();
  saveOptions();
}

function resetTrackers() {
  Object.keys(background.trackable_datapoints).forEach(function(datapoint) {
    background.trackable_datapoints[datapoint] = false;
    select(datapoint + '_id').checked = false;
  });
}


document.addEventListener('DOMContentLoaded', function() {
  background.setDatapoints();
  const tracked_data_element = select('tracked_data');
  const div_url = select('data_selection')

  select('store_tracked').onclick = downloadFile;

  var datapoint_all = select('track_any_check');
  datapoint_all.onclick = (function() {
    toggleAll(datapoint_all.checked);
  });

  setUpTrackers(div_url, tracked_data_element);

  switchToCookie = select('cookie_switch_button');

  switchToCookie.addEventListener('click', function() {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabs) {
      chrome.tabs.update({
        url: "cookie_html.html"
      });
    })
  });


  select('save_datamanager').onclick = saveOptions;
  select('reset_datamanager').onclick = resetSettings;

}, false)

function setUpTrackers(div_url, tracked_data) {
  Object.keys(background.trackable_datapoints).forEach(function(datapoint) {
    var datapoint_element = document.createElement('p');
    var datapoint_toggle = document.createElement('input');
    datapoint_toggle.setAttribute('type', 'checkbox');
    datapoint_toggle.setAttribute('id', datapoint + '_id');
    datapoint_toggle.setAttribute('class', 'options_checkbox');

    datapoint_toggle.onclick = (function() {
      background.trackable_datapoints[datapoint] = !background.trackable_datapoints[datapoint];
      console.log(background.trackable_datapoints)
    });

    datapoint_element.textContent = datapoint;

    datapoint_element.appendChild(datapoint_toggle);
    div_url.appendChild(datapoint_element);


    tracked_data.appendChild(setupMetaView(datapoint));

 });
  const view_button = document.createElement('button');
  view_button.setAttribute('id', "dataexpand_button");
  view_button.onclick = (function() {
    expandData();
  });
  view_button.innerHTML = 'expand';

  tracked_data.appendChild(view_button);

    retreiveSettings();
 
}

function toggleAll(checked) {
  if (checked) {
    background.track_none = true;
    var elms = document.querySelectorAll('.options_checkbox');
    elms.forEach(elem => elem.disabled = true);
    resetTrackers();
    clearStoredData();

  } else {
    background.track_none = false;
    var elms = document.querySelectorAll('.options_checkbox');
    elms.forEach(elem => elem.disabled = false)

  }
}

function clearStoredData() {
  background.collected_data = [];
}

function setupMetaView(datapoint) {
  const data_info = document.createElement('p');
  data_info.setAttribute('id', datapoint + "_metaview")

  numRecords = background.collected_data.length;
  data_info.textContent = datapoint + ": " + numRecords + " records"

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

  background.collected_data.forEach(function(data) {
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

function select(id) {
  return document.getElementById(id);
}

function downloadFile() {//can do zip file if needed
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

// TODO UPDATE FUNCTION
function getUserContent() {
  // retVal = ''

  // background.collected_data.forEach(function(data) {
  //   retVal += data.url + '\n';
  //   retVal += background.collected_data['urls'][url] + '\n\n';
  // });

  // return retVal;
}