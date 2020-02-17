  const background = chrome.extension.getBackgroundPage();

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  	console.log("something happening from the extension");
  	var data = request.data
  });

  document.addEventListener('DOMContentLoaded', function() {

  	optionsButton = document.getElementById('goto_options_page');
  	optionsButton.onclick = (function() {
  		chrome.tabs.create({
  			url: 'options.html'
  		});
  	});
  	cookieToggle = document.getElementById('cookies_popup_toggle');
  	dataToggle = document.getElementById('data_popup_toggle');
  	cookieText = document.getElementById('cookie_text');

  	dataToggle.checked = !background.track_none
  	cookieToggle.checked = background.blocked_all

  	//retreive settings and set accordingly
  	//wire up toggles to background script
  	dataToggle.onclick = (function() {
  		if (!dataToggle.checked)
  			background.track_none = true;
  		else {
  			background.track_none = false;
  				background.trackable_datapoints['urls'] = true;
  		}
  		saveSwitches();
  	});

  	cookieToggle.onclick = (function() {
  		if (cookieToggle.checked)
  			background.blocked_all = true;
  		else
  			background.blocked_all = false;

  		saveSwitches();
  	});

  	recordsNum = document.getElementById('popup_record_text');
  	recordsNum.innerHTML = background.collected_data.length + " records collected";


  });

  function saveSwitches() {
  	var key = 'userSettings'
  	var key2 = 'userSettingsData'
  	var prefs = "";
  	var prefs2 = "";
  	var json = {};

  	//TODO da way this be saving gets foinked up
  	prefs += JSON.stringify({
  		'blocked_cookies': background.blocked_cookies,
  		'blocked_domains': background.blocked_domains,
  		'blocked_all': background.blocked_all
  	});

  	prefs2 += JSON.stringify({
  		'trackable_datapoints': background.trackable_datapoints,
  		'track_none': background.track_none
  	});

  	json[key] = prefs;
  	json[key2] = prefs2;

  	chrome.storage.local.set(json, function() {
  		console.log('updatedsettings');
  	});

  	chrome.tabs.query({
  		active: true,
  		currentWindow: true
  	}, function(tabs) {
  		chrome.tabs.update(tabs[0].id, {
  			url: tabs[0].url
  		});
  	});
  }