const background = chrome.extension.getBackgroundPage();
received_data = '';

document.addEventListener('DOMContentLoaded', function() {
	display = document.getElementById('display_view');
	content = document.getElementById('view_content');
	title = document.getElementById('display_title');
	save = document.getElementById('save_edited').onclick = (function(){
		element['html_data'] = content.textContent;
	});

	title.innerHTML = '<b>' + background.temp_data['url'] + " - Session: " + background.temp_data['id'] + '</b><br>' + content.innerHTML +
		"<b>Location: </b>" + background.temp_data['location'] + "<br><b>Date Time: </b>" + background.temp_data['datetime'] + "<br><b> HTML Content: </b>";

	content.textContent = background.temp_data['html_data'];
});