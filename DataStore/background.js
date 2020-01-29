//data
window.urls = {};
blocked_cookies = [];
blocked_domains = [];
blocked_all = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.html)
		window.urls[request.url] = request.html
	else
	{
		blocked_cookies = request.blocked_cookies;
		blocked_domains = request.blocked_domains;
		blocked_all = request.blocked_all;
	}
	
})

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.create({
		url: 'options.html'
	})
})



//cookies
chrome.cookies.onChanged.addListener(function(info) {
	if (blocked_all)
		removeCookie(info.cookie);

	if (blocked_cookies.includes(info.cookie)) {
		removeCookie(cookie)
	}
	if (blocked_domains.includes(info.cookie.domain)) {;
		removeCookie(cookie)
	}


});



function removeCookie(cookie) {
	var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
		cookie.path;
	chrome.cookies.remove({
		"url": url,
		"name": cookie.name
	});
}