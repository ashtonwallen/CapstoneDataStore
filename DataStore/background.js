//data
window.blocked_all = false;
window.blocked_cookies = [];
window.blocked_domains = [];
window.trackable_datapoints = {};
window.track_none = true;

window.collected_data = []
window.temp_data = "";
var last_position = "";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.url) {
		if (!window.track_none)
		{
			getLocation();
			window.collected_data.push({
				'id': generateId().toString(16),
				'url': getUrl(request.url),
				'datetime': getDateTime(),
				'location': last_position,
				'html_data': getHtmlData(request.html)
			});
		}
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

function getUrl(requestUrl){
	if (window.trackable_datapoints['urls'])
		return requestUrl;
	else
		return 'URL not provided';
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
		'location_data': false
	}
}

// https://www.w3resource.com/javascript-exercises/javascript-math-exercise-23.php
function generateId() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8));
    });
    return uuid;
}

function getHtmlData(request) {
	 if (window.trackable_datapoints['html_data']) 
	 	return request.html;
	 else
		return "not provided"
}

setDatapoints();