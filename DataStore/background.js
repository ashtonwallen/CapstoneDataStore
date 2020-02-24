//data
window.blocked_all = false;
window.blocked_cookies = [];
window.blocked_domains = [];
window.trackable_datapoints = {};
window.track_none = true;
window.collected_data;
window.temp_data = "";
var last_position = "";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
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
		}
	}
	if (request.saveData) {
		saveUserSettings(request.saveData);
	}
})

//cookies
chrome.cookies.onChanged.addListener(function(info) {
	if (blocked_all)
		removeCookie(info.cookie);
	return;
	if (blocked_cookies.includes(info.cookie)) {
		removeCookie(info.cookie)
	}
	if (blocked_domains.includes(info.cookie.domain)) {
		removeCookie(info.cookie)
	}
});

function clearSavedData() {
	window.collected_data = {
		'session': [],
		'bookmarks': [],
		'top-sites': []
	}
}

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

function getFirstTimeData() {
	getBookmarks();
	getTopSites();
	console.log("data!" + window.collected_data['top-sites'])
	console.log("bookmarkdata!" + window.collected_data['bookmarks'])
}

function saveUserSettings() {
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

	chrome.storage.sync.set(json, function() {
		// TODO CONFIRM FOR USER
	});
	console.log("Saved", prefs, json)
}

function retreiveSettings(callback) {
	chrome.storage.sync.get('userSettings', function(result) {
		if (result['userSetting'] != null) {
			result = result['userSettings'];
			result = JSON.parse(result);

			window.trackable_datapoints = result['trackable_datapoints'];
			window.track_none = result['track_none'];

			window.blocked_all = result['blocked_all']


			window.blocked_cookies.push(result['blocked_cookies']);
			window.blocked_cookies.filter(onlyUnique);


			window.blocked_domains.push(result['blocked_domains']);
			window.blocked_domains.filter(onlyUnique);

		}
	});
}

function getUrl(requestUrl) {
	if (window.trackable_datapoints['urls'])
		return requestUrl;
	else
		return 'URL not provided';
}

function getBookmarks() {
	if (window.trackable_datapoints['bookmarks']) {
		let nodes = []
		chrome.bookmarks.getTree(function(itemTree) {
			itemTree.forEach(function(item) {
				nodes.push(processNode(item));
			});
		});
		
	}
}

//callback for getbookmarks
function processNode(node) {
	if (node.children) {
		node.children.forEach(function(child) {
			processNode(child);
		});
	}
	return node.url
}


function getLocation() {
	var id;
	if (window.trackable_datapoints['location_data']) {
		if (navigator.geolocation)
			navigator.geolocation.getCurrentPosition(savePosition);
	} else {
		last_position = "not provided"
	}
}

function getTopSites() {
	if (window.trackable_datapoints['top-sites']) {
		chrome.topSites.get(storeTopSites);
	}
}

//callback for gettopsites
function storeTopSites(topSites) {
	window.collected_data['top-sites'] = topSites;
}

function savePosition(position) {
	last_position = position.coords.latitude + ', ' + position.coords.longitude;
}

function getDateTime() {
	return new Date().toLocaleString().replace(",", "").replace(/:.. /, " ");
}

function removeCookie(cookie) {
	var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
		cookie.path;
	chrome.cookies.remove({
		"url": url,
		"name": cookie.name
	});
}

function setDatapoints() {
	window.trackable_datapoints = {
		'urls': false,
		'html_data': false,
		'location_data': false,
		'bookmarks': false,
		'downloads': false,
		'top-sites': false
	}
}

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

function getHtmlData(request) {
	if (window.trackable_datapoints['html_data'])
		return request.html;
	else
		return "not provided"
}

clearSavedData();
retreiveSettings();
setDatapoints();
getFirstTimeData();