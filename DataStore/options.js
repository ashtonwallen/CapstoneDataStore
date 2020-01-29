trackable_datapoints = {
  'urls': false,
  'html_data': false,
  'html_metadata': false,
  'location_data': false
}

document.addEventListener('DOMContentLoaded', function() {
  const background = chrome.extension.getBackgroundPage()
  const tracked_data_element = select('tracked_data');
  const div_url = select('data_selection')

  Object.keys(trackable_datapoints).forEach(function(datapoint) {
    const datapoint_element = document.createElement('p'); //might need to set an id
    const datapoint_toggle = document.createElement('input');

    datapoint_toggle.setAttribute('type', 'checkbox');
    datapoint_toggle.setAttribute('id', datapoint + '_id');
    datapoint_element.textContent = datapoint;

    datapoint_element.appendChild(datapoint_toggle);
    div_url.appendChild(datapoint_element);

    //set metadata view
    tracked_data_element.appendChild(setupMetaView(datapoint, background));


  });



  switchToCookie = document.getElementById('cookie_switch_button')

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

}, false)



function setupMetaView(datapoint, background) {
  const data_info = document.createElement('p');
  data_info.setAttribute('id', datapoint + "_metaview")
  const view_button = document.createElement('button');
  view_button.setAttribute('id', datapoint + "_button");
  view_button.setAttribute('class', 'expand_button_meta');
  view_button.onclick = (function() {
    expandSelection(datapoint, background, data_info);
  });
  view_button.innerHTML = 'expand';

  switch (datapoint) {
    case 'urls':
      data_info.textContent = datapoint + ": " + Object.keys(background.urls).length + " records"
      data_info.appendChild(view_button);
      break;
    case 'html_data':
      data_info.textContent = datapoint + ": " + Object.keys(background.urls).length + " records"
      data_info.appendChild(view_button);
      break;
    default:
  }



  return data_info;
}

//need a way to know if it is already expanded
function expandSelection(datapoint, background, parent) {
  var table_id = datapoint + '_table';
  var table = select(table_id);

  if (table) {
    table.remove()
    return;
  }

  table = document.createElement("TABLE");
  table.setAttribute('id', datapoint + '_table');
  table.setAttribute('class', 'datapoint_table');
  var header = table.createTHead();

  //figure out better way than repeating switches
  switch (datapoint) {
    case 'urls':
      if (Object.keys(background.urls).length > 0) {
        Object.keys(background.urls).forEach(function(url) {
            row = table.insertRow(0)
            var row = table.insertRow(-1);
            row.setAttribute('class', 'table_row');
            // row.onclick = (function(){
            //           chrome.tabs.create({
            //     url: chrome.runtime.getURL("view_html_content.html"),
            //   }, function(win) {
            // win.getElementById('display_view')
            // win.innerHTML = background.urls[url];

            //TODO launch html data some way
            //   });
            // })
            row.insertCell(-1).innerText = url;
            row.onclick = (function(){
              ExternalViewData(background.urls[url]);
               chrome.tabs.create({
               url: chrome.runtime.getURL("view_html_content.html"),
            });
        });
        parent.appendChild(table);
        });
      }



      break;
    case 'html_data':
      break;
    default:
  }


}

function ExternalViewData(data, background){    

}

function select(id) {
  return document.getElementById(id);
}

//  const div_url = document.createElement('div')
//  div_url.setAttribute("id","url_info")
//  const div_html = document.createElement('div')
//  div_html.setAttribute("id","html_info")

// div_url.innerHTML = '<b><p>' + url + '<p></b>'
//  div_html.textContent = '<pre>' + background.urls[url] + '</pre>'

//  display collected data
// document.body.appendChild(div_url)
// document.body.appendChild(div_html) 


// Object.keys(background.urls).forEach(function (url) {})