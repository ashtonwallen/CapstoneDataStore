document.addEventListener('DOMContentLoaded', function() {
 	const background = chrome.extension.getBackgroundPage();
 	console.log('got' + background.view_data)
	display = document.getElementById('display_view');

	//display.innerHtml = '<p>' + getData + '</p>';

});


function getData(callback) {

  }
