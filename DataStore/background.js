//data
window.blocked_all = false;
window.blocked_cookies = [];
window.blocked_domains = [];
window.trackable_datapoints = {};
window.demographics = {};
window.track_none = true;
window.collected_data;
window.temp_data = {};
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

function clearSavedData() {
    window.collected_data = {
        'session': [],
        'bookmarks': [],
        'downloads': [],
        'top-sites': []
    }
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

//GET FIRST TIME DATA 
function getFirstTimeData() {
    if (window.trackable_datapoints['Bookmarks']) {
        res = bookMarkAsync();
    }
    if (window.trackable_datapoints['Top Sites']) {
        res = topSiteAsync();
    }
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

//downloads
chrome.downloads.onChanged.addListener(handleDownload);

function handleDownload(downloadDelta) {
    if (downloadDelta && downloadDelta.filename) {
        var name = downloadDelta.filename.current;

        var index = name.lastIndexOf('\\');
        var result = name.substring(index + 1);

        window.collected_data['downloads'].push(result);
        window.collected_data['downloads'].filter(onlyUnique);
    }
}

//topsites ASYNC
const topSitePromise = new Promise((resolve, reject) => {
    chrome.topSites.get(function(sites) {
        resolve(sites)
    });
})

topSitePromise.then(function(sites) {
    window.collected_data['top-sites'] = sites;
    return sites;
})

const topSiteAsync = async function() {
    const result = await topSitePromise;
    return result;
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

    chrome.storage.sync.set(json, function() {});

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
    if (window.trackable_datapoints['Urls'])
        return requestUrl;
    else
        return 'URL not provided';
}


function getHtmlData(request) {

    if (window.trackable_datapoints['Html Data'])
        return request.html;
    else
        return "not provided"
}



function getLocation() {
    var id;
    if (window.trackable_datapoints['Location Data']) {
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



function getDemographics(callback) {
    console.log('called')
    chrome.storage.local.get('userDemographics', function(result) {
        if (result['userDemographics']) {
            window.demographics = JSON.parse(result['userDemographics'])
        }
    });
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



clearSavedData();
retreiveSettings();
setDatapoints();
getFirstTimeData();
getDemographics();