const background = chrome.extension.getBackgroundPage();

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.greeting == "hello")
            sendResponse({ farewell: "goodbye" });
    });

document.addEventListener('DOMContentLoaded', function() {
    var display = document.getElementById('display_view');
    var content = document.getElementById('view_content');
    var title = document.getElementById('display_title');
    var save = document.getElementById('save_edited');

    var key = Object.keys(background.temp_data)[0];
    var data = background.temp_data[key];

    save.onclick = (function() {

        background.collected_data['session'].forEach(function(obj) {
            if (obj.id == data.id) {
                obj['html_data'] = content.textContent;
            }
        })
    });

    if (key == 'session') {
        save.style.visibility = "visible";
        title.innerHTML = '<b>' + data['url'] + "<br> Session:</b> " + data['id'] + '</b><br>' + content.innerHTML +
            "<b>Location: </b>" + data['location'] + "<br><b>Date Time: </b>" + data['datetime'] + "<br><b> HTML Content: </b>";
        content.textContent = data['html_data'];
    } else {
        save.style.visibility = "hidden";
        title.innerHTML = '<b>' + key + '</b><br>';
        document.getElementById('maintitle').innerText = 'View Collected Data'

        if (data.length > 1) {
            data.forEach(function(data) {
                content.innerHTML += JSON.stringify(data) + '<hr>';
            });
        } else {
            content.innerHTML += '<b>Waiting on data... Check back soon</br>';
        }

    }
});