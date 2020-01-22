//data
window.urls = {}
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  window.urls[request.url] = request.html
})

chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.create({url: 'options.html'})
})



//cookies
chrome.cookies.onChanged.addListener(function(info) {
  console.log("onChanged" + JSON.stringify(info));
});

