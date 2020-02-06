chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    console.log("something happening from the extension");
    var data = request.data

    
});

document.addEventListener('DOMContentLoaded', function() {
  const background = chrome.extension.getBackgroundPage()
  optionsButton = document.getElementById('goto_options_page');
  optionsButton.onclick = (function(){
	chrome.tabs.create({
		url: 'options.html'
	});
  })

 });
