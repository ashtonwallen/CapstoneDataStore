/**
DataStore Capstone Project

Author: Ashton Allen
Email: aashton482@gmail.com

background.js

Main driver for the extension.
Gets passed session data, stores in collected_data object 
along with other approved tracked data.

Queries for things like bookmarks, topsites, location

Keeps an active copy of user settings to adjust mid-session 
Saves and retreives settings

**/

function CustomException(message) {
	const error = new Error(message);
	return error;
}

CustomException.prototype = Object.create(Error.prototype);

//Data is global so content scripts can pass data
window.blocked_all = false;
window.blocked_cookies = [];
window.blocked_domains = [];
window.trackable_datapoints = {};
window.demographics = {};
window.track_none = true;
window.collected_data;
window.temp_data = {};
var last_position = "";

//Listener for content script, creates session for each new datapoint
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	try {
		var testCount = window.collected_data['session'].length;
		if (request.url) {
			if (!window.track_none) {
				getLocation();
				window.collected_data['session'].push({
					'id': generateId().toString(16),
					'url': getUrl(request.url),
					'datetime': getDateTime(),
					'location': last_position,
					'html_data': request.html
				});

				if (window.collected_data['session'].length <= testCount)
					throw new CustomException("Session Data was not updated")
			}
		}
		if (request.saveData) {
			saveUserSettings(request.saveData);
		}
	} catch (e) { console.log("Test Message Listener Failed") }
})

//Listener to perform cookie operations per user settings
chrome.cookies.onChanged.addListener(function(info) {
	try {
		if (blocked_all)
			removeCookie(info.cookie);
		return;
		if (blocked_cookies.includes(info.cookie)) {
			removeCookie(info.cookie)
		}
		if (blocked_domains.includes(info.cookie.domain)) {
			removeCookie(info.cookie)
		}
	} catch (e) { console.log("Background cookie manager failed: " + e) }
});

//Reset all datapoints
function setDatapoints() {
	window.trackable_datapoints = {
		'Urls': false,
		'Html Data': false,
		'Location Data': false,
		'Bookmarks': false,
		'Downloads': false,
		'Top Sites': false
	}
}

//Reset all saved data
function clearSavedData() {
	window.collected_data = {
		'session': [],
		'bookmarks': [],
		'downloads': [],
		'top-sites': []
	}
}

//Filters list for only unique values
function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

// Get first time data, a user has enabled a setting on data that is not dynamically generated. So we go get it
function getFirstTimeData() {
	try {
		if (window.trackable_datapoints['Bookmarks']) {
			res = bookMarkAsync();
		}
		if (window.trackable_datapoints['Top Sites']) {
			res = topSiteAsync();
		}

		if (!res)
			throw new CustomException('First time data not accessible')

		console.log("Test getFirstTimeData() passed")
	} catch (e) { console.log("getFirstTimeData() failed" + e) }
}

//bookmarks ASYNC
const bookmarkPromise = new Promise((resolve, reject) => {
	chrome.bookmarks.getTree(function(itemTree) {
		resolve(flattenResult(itemTree));
	});
})

bookmarkPromise.then(function(tree) {
	window.collected_data['bookmarks'] = tree;
	return tree;
})

const bookMarkAsync = async function() {
	const result = await bookmarkPromise;
	return result;
}

// Used to flatten and store bookmark tree once it is returned
function flattenResult(tree) {
	var result = [],
	path = [],
	arrayForEach;

	arrayForEach = function(nodes) {
		nodes.forEach(function(node) {
			if (node.title && node.children) {
				path.push(node.title);
			}

			if (node.title && node.url) {
				node.path = path;
				result.push({
					node: node,
				});
			}

			if (node.children) {
				arrayForEach(node.children);
				path.pop();
			}
		});
	};

	if (Array.isArray(tree)) {
		arrayForEach(tree);
	}

	return result;
}

// Handles every time a user downloads something new, download info gets added to collected data
chrome.downloads.onChanged.addListener(handleDownload);

function handleDownload(downloadDelta) {
	try {
		var downloadLen = window.collected_data['downloads'].length;
		if (downloadDelta && downloadDelta.filename) {
			var name = downloadDelta.filename.current;

			var index = name.lastIndexOf('\\');
			var result = name.substring(index + 1);

			window.collected_data['downloads'].push(result);
			if (downloadLen >= window.collected_data['downloads'].length)
				throw new CustomException('Unable to process download')
			window.collected_data['downloads'].filter(onlyUnique);

		}
		console.log("Test handleDownload() passed");
	} catch (e) { console.log("Test handleDownload() failed: " + e) }

}

//topsites ASYNC
const topSitePromise = new Promise((resolve, reject) => {
	chrome.topSites.get(function(sites) {
		resolve(sites)
	});
})

// Once async completes, return our value
topSitePromise.then(function(sites) {
	window.collected_data['top-sites'] = sites;
	return sites;
})

// Async function to get topsites
const topSiteAsync = async function() {
	const result = await topSitePromise;
	return result;
}

// Save new user settings to Google Account
function saveUserSettings() {
	try {
		var key = 'userSettings'
		var prefs = "";
		var json = {};

		window.blocked_cookies.flat(1)
		window.blocked_domains.flat(1)

		prefs = JSON.stringify({
			'trackable_datapoints': window.trackable_datapoints,
			'track_none': window.track_none,
			'blocked_cookies': window.blocked_cookies,
			'blocked_domains': window.blocked_domains,
			'blocked_all': window.blocked_all
		});

		json[key] = prefs;


		chrome.storage.sync.set(json, function() {});


		console.log("Test saveUserSettings() passed")
	} catch (e) { console.log("Test saveUserSettings() failed" + e) }

}

// Retreive stored user settings and set up
function retreiveSettings(callback) {
	try {
		chrome.storage.sync.get('userSettings', function(result) {
			console.log(result)
			if (result['userSettings'] != null) {
				result = result['userSettings'];
				result = JSON.parse(result);

				window.trackable_datapoints = result['trackable_datapoints'];
				window.track_none = result['track_none'];

				window.blocked_all = result['blocked_all']


				window.blocked_cookies.push(result['blocked_cookies']);
				window.blocked_cookies.filter(onlyUnique);


				window.blocked_domains.push(result['blocked_domains']);
				window.blocked_domains.filter(onlyUnique);
				console.log("Test retreiveSettings() passed");

			} else {
			 throw new CustomException("Settings not retreived -- if this is first time running, ignore this failure")}
		});
		
	} catch (e) { console.log("Test retreiveSettings() failed: " + e) }

}

// Returns url from content script 
function getUrl(requestUrl) {
	if (window.trackable_datapoints['Urls'])
		return requestUrl;
	else
		return 'URL not provided';
}


// Gets html data from content script if user is collecting
function getHtmlData(request) {
	if (window.trackable_datapoints['Html Data'])
		return request.html;
	else
		return "not provided"
}


//Browser API call to get geolocation
function getLocation() {
	var id;
	if (window.trackable_datapoints['Location Data']) {
		if (navigator.geolocation)
			navigator.geolocation.getCurrentPosition(savePosition);
	} else {
		last_position = "not provided"
	}
}

// Callback to collect geolocation data
function savePosition(position) {
	last_position = position.coords.latitude + ', ' + position.coords.longitude;
}


function getDateTime() {
	return new Date().toLocaleString().replace(",", "").replace(/:.. /, " ");
}

// Remove cookie if it is detected in page and actively being blocked
// Needs to be in background so this can be done anywhere across the web
function removeCookie(cookie) {
	try {
		var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
		cookie.path;
		chrome.cookies.remove({
			"url": url,
			"name": cookie.name
		});

		chrome.cookies.get({ "url": url, "name": cookie.name }, function(cookie) {
			if (cookie)
				throw new CustomException("Blocked cookie not removed")
		});

		console.log("Test removeCookie() passed")
	} catch (e) { console.log("Test removeCookie() failed: " + e) }

}


// Grab the user demographics when needed
function getDemographics(callback) {

	chrome.storage.local.get('userDemographics', function(result) {
		if (result['userDemographics']) {
			window.demographics = JSON.parse(result['userDemographics'])
		}
	});
}

// Create a unique ID to differentiate sessions
// https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
function generateId() {
	var dt = new Date().getTime();
	var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = (dt + Math.random() * 16) % 16 | 0;
		dt = Math.floor(dt / 16);
		return (c == 'x' ? r : (r & 0x3 | 0x8));
	});
	return uuid;
}



clearSavedData();
retreiveSettings();
setDatapoints();
getFirstTimeData();
getDemographics();