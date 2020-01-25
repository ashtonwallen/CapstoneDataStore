//data
window.urls = {}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	window.urls[request.url] = request.html
})

chrome.browserAction.onClicked.addListener(function(tab) {
	chrome.tabs.create({
		url: 'options.html'
	})
})



//cookies
chrome.cookies.onChanged.addListener(function(info) {;
			if (window.blocked_all) {
				console.log('bloinkinall');
				chrome.cookies.getAll({}, function(cookies) {
					for (var i in cookies) {
						removeCookie(cookies[i]);
					}
				});
			} else {
				if (window.blocked_cookies.includes(info.cookie) || window.blocked_domains.includes(info.cookie.domain)) {
					console.log('bloinkinsome');
					removeCookie(cookie)
				}

			}
		});



		function removeCookie(cookie) {
			var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
				cookie.path;
			chrome.cookies.remove({
				"url": url,
				"name": cookie.name
			});
			cache.remove(cookie);
		}