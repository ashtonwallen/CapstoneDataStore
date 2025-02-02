/**
DataStore Capstone Project

Author: Ashton Allen
Email: aashton482@gmail.com

cookie_manager.js

Cookie manager allows for blocking of domains and cookies
Will remain consistent once user has set

Initially this was adapted from Chromium's cookies example, but has since completely changed in structure
The cookie table is still very similar to the Chromium Author's

**/

const background = chrome.extension.getBackgroundPage();
expanded_domains = []

// store user cookie settings by calling background's save settings 
function storeSettings() {
    background.saveUserSettings();
    location.reload();
}

//retreive stored cookie settings 
function retreiveSettings(callback) {
    background.retreiveSettings();

    if (background.blocked_all) {
        select('#block_all_check').click()
    } else {
        select('#block_some_check').click()
    }
}

//clear stored settings
function clearSettings() {
    background.blocked_cookies = [];
    background.blocked_domains = [];
    background.blocked_all = false;

    storeSettings();
}

//timer for automating table updates
function Timer() {
    this.start_ = new Date();

    this.elapsed = function() {
        return (new Date()) - this.start_;
    }

    this.reset = function() {
        this.start_ = new Date();
    }
}

//match every value of a cookie to ensure it is the same as one we are looking for
function cookieMatch(c1, c2) {
    return (c1.name == c2.name) && (c1.domain == c2.domain) &&
        (c1.hostOnly == c2.hostOnly) && (c1.path == c2.path) &&
        (c1.secure == c2.secure) && (c1.httpOnly == c2.httpOnly) &&
        (c1.session == c2.session) && (c1.storeId == c2.storeId);
}

//Sorts keys
function sortedKeys(array) {
    var keys = [];
    for (var i in array) {
        keys.push(i);
    }
    keys.sort();
    return keys;
}

//selector to simplify grabbing elements
function select(selector) {
    return document.querySelector(selector);
}

//Maintains the list of active cookies for display -- largely inspired by Chromium's Cookies Example
function CookieCache() {
    this.cookies_ = {};

    this.reset = function() {
        this.cookies_ = {};
    }

    this.add = function(cookie) {
        var domain = cookie.domain;
        if (!this.cookies_[domain]) {
            this.cookies_[domain] = [];
        }
        this.cookies_[domain].push(cookie);
    };

    this.remove = function(cookie) {
        var domain = cookie.domain;
        if (this.cookies_[domain]) {
            var i = 0;
            while (i < this.cookies_[domain].length) {
                if (cookieMatch(this.cookies_[domain][i], cookie)) {
                    this.cookies_[domain].splice(i, 1);
                } else {
                    i++;
                }
            }
            if (this.cookies_[domain].length == 0) {
                delete this.cookies_[domain];
            }
        }
    };


    this.getDomains = function(filter) {
        var result = [];
        sortedKeys(this.cookies_).forEach(function(domain) {
            if (!filter || domain.indexOf(filter) != -1) {
                result.push(domain);
            }
        });
        return result;
    }

    this.getCookies = function(domain) {
        return this.cookies_[domain];
    };
}


var cache = new CookieCache();

//Remove/block all cookies in filter -- DEPRECATED
function removeAllForFilter() {
    var filter = select("#filter").value;
    var timer = new Timer();
    cache.getDomains(filter).forEach(function(domain) {
        removeCookiesForDomain(domain);
    });
}

//Remove all active cookies from browser -- DEPRECATED
function removeAll() {
    var all_cookies = [];
    cache.getDomains().forEach(function(domain) {
        cache.getCookies(domain).forEach(function(cookie) {
            all_cookies.push(cookie);
        });
    });
    cache.reset();
    var count = all_cookies.length;
    var timer = new Timer();
    for (var i = 0; i < count; i++) {
        removeCookie(all_cookies[i]);
    }
    timer.reset();
    chrome.cookies.getAll({}, function(cookies) {
        for (var i in cookies) {
            cache.add(cookies[i]);
            removeCookie(cookies[i]);
        }
    });
}

// Remove a specific cookie
function removeCookie(cookie) {
    var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
        cookie.path;
    chrome.cookies.remove({
        "url": url,
        "name": cookie.name
    });
    cache.remove(cookie)
}

// Remove all cookies within domain
function removeCookiesForDomain(domain) {
    if (cache.getCookies(domain))
        cache.getCookies(domain).forEach(function(cookie) {
            removeCookie(cookie);
        });

}

// Remove any cookie that has been previously blocked if it tries to show up again
function removeCookiesBlocked() {
    cache.getDomains().forEach(function(domain) {
        cache.getCookies(domain).forEach(function(cookie) {
            if (background.blocked_cookies.includes(cookie)) {
                removeCookie(cookie);
            }
        });
    });

    background.blocked_domains.forEach(function(domain) {
        removeCookiesForDomain(domain)
    });
}

//Resets table
function resetTable() {
    var table = select("#cookies");
    while (table.rows.length > 1) {
        table.deleteRow(table.rows.length - 1);
    }
}

var reload_scheduled = false;
//automatically reloads cookie table
function scheduleReloadCookieTable() {
    if (!reload_scheduled) {
        reload_scheduled = true;
        setTimeout(reloadCookieTable, 250);
    }
}

//gets only unique values in list
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

//reloads cookie table with updated cookie info
function reloadCookieTable() {
    reload_scheduled = false;

    var filter = select("#filter").value;

    removeCookiesBlocked();
    var domains = cache.getDomains(filter);


    select("#filter_count").innerText = domains.length;
    select("#total_count").innerText = cache.getDomains().length;

    resetTable();
    var table = select("#cookies");


    domains.forEach(function(domain) {
        var cookies = cache.getCookies(domain);
        var row = table.insertRow(-1);
        row.insertCell(-1).innerText = domain.substring(1);

        var cell = row.insertCell(-1);
        cell.innerText = cookies.length;
        cell.setAttribute("class", "cookie_count");

        var block_button = document.createElement("button");
        block_button.innerText = "block";
        block_button.setAttribute('class', 'btn btn-danger');
        checkbox = select('#block_some_check');
        block_button.onclick = (function() {
            if (!checkbox.checked)
                checkbox.click();
            removeCookiesForDomain(domain);
            background.blocked_domains.push(domain);
            background.blocked_domains.filter(onlyUnique);

        });
        var cell = row.insertCell(-1);
        cell.appendChild(block_button);
        cell.setAttribute("class", "button");


        //Expand button
        optId = "row" + domain;
        row.setAttribute("id", optId);
        row.setAttribute("class", "cookie_row");
        var expand_button = document.createElement("button");
        expand_button.innerText = "expand";
        expand_button.setAttribute("class", "btn btn-secondary");
        expand_button.setAttribute("data-target", "#expandModal")
        expand_button.setAttribute("data-toggle", "modal")
        expand_button.onclick = (function() {
            expanded_domains.push(domain);
            expanded_domains = expanded_domains.filter(onlyUnique);

            expandSection(row);
        });

        row.appendChild(expand_button);

        if (expanded_domains.indexOf(domain) != -1) {
            expandSection(row);
        }
    });
}

// Expand a domain to reveal its cookies
function expandSection(row) {
    domain = row.id.slice(3)
    cookies = cache.getCookies(domain)

    subtable = document.getElementById(row.id + "subtable");


    if (subtable) {
        subtable.remove();
        expanded_domains.pop(domain)
        return;
    } else {
        var subtable = document.createElement("TABLE");
        subtableId = row.id + "subtable";
        subtable.setAttribute("class", "subtable");
        subtable.setAttribute("id", subtableId)

        cookies.forEach(function(cookie) {
            var subrow = subtable.insertRow(-1);
            subrow.setAttribute('class', 'cookie_subrow')
            subrow.insertCell(-1).innerText = domain + "." + cookie.name;

            var subbutton = document.createElement("button");
            subbutton.innerText = "block";
            subbutton.setAttribute('class', 'btn btn-danger');
            checkbox = select('#block_some_check');
            subbutton.onclick = (function() {
                if (!checkbox.checked)
                    checkbox.click();
                background.blocked_cookies.push(cookie);

                removeCookie(cookie);
                reloadCookieTable();
            });

            subrow.appendChild(subbutton);
            row.appendChild(subtable)
        });
    }



}


function focusFilter() {
    select("#filter").focus();
}

//Reset filter
function resetFilter() {
    var filter = select("#filter");
    filter.focus();
    if (filter.value.length > 0) {
        filter.value = "";
        reloadCookieTable();
    }
}

var ESCAPE_KEY = 27;
window.onkeydown = function(event) {
    if (event.keyCode == ESCAPE_KEY) {
        resetFilter();
    }
}

//sets up listener
function startListening() {
    chrome.cookies.onChanged.addListener(listener);
}

//stops listener
function stopListening() {
    chrome.cookies.onChanged.removeListener(listener);
    chrome.cookies.onChanged.removeListener(block_all_listener);
    chrome.cookies.onChanged.removeListener(block_specific_listener);
}
//sets up listener
function continuousDeleteAll() {
    chrome.cookies.onChanged.addListener(block_all_listener);
}

// continuously block cookies pr domains that have been blocked by user
function continuousDeleteList() {
    chrome.cookies.onChanged.addListener(block_specific_listener);
}

// block everything that comes in
function block_all_listener(info) {
    removeCookie(info.cookie);
    reloadCookieTable();
}

//simple listener, no action required only collect cookies
function listener(info) {
    cache.remove(info.cookie);
    if (!info.removed) {
        cache.add(info.cookie);
    }
    scheduleReloadCookieTable();
}

// Blocks cookies from entering browser if theyve been blocked by user
function block_specific_listener(info) {
    background.blocked_cookies.forEach(function(cookie) {
        if (cookieMatch(cookie, info.cookie)) {
            removeCookie(info.cookie)
            return;
        }
    });

    cache.remove(info.cookie);
    if (!info.removed) {
        cache.add(info.cookie);
    }
    scheduleReloadCookieTable();
}

// Sets up block alll/block specific checkboxes and creates listeners accordingly
function setupCheckboxes(checkbox_all, checkbox_some) {
    if (checkbox_all && checkbox_some) {
        checkbox_all.addEventListener('change', function() {
            if (checkbox_all.checked) {
                if (checkbox_some.checked)
                    checkbox_some.click();
                stopListening();
                removeAll();
                continuousDeleteAll();
                background.blocked_all = true;
            } else {
                stopListening();
                startListening();
                background.blocked_all = false;
            }

            checkbox_some.addEventListener('change', function() {
                if (checkbox_some.checked) {
                    if (checkbox_all.checked)
                        checkbox_all.click();
                    stopListening();
                    continuousDeleteList();
                    background.blocked_all = false;
                } else {
                    stopListening();
                    startListening();
                }
            });
        });
    }
}

// Gets settings and sets up page/cookie cache
function onload() {
    retreiveSettings();
    focusFilter();
    var timer = new Timer();
    chrome.cookies.getAll({}, function(cookies) {
        startListening();
        start = new Date();
        for (var i in cookies) {
            cache.add(cookies[i]);
        }
        timer.reset();
        scheduleReloadCookieTable();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    onload();
    document.body.addEventListener('click', focusFilter);
    document.querySelector('#filter_div input').addEventListener(
        'input', reloadCookieTable);
    document.querySelector('#filter_div button').addEventListener(
        'click', resetFilter);
    select('#save_settings_button').addEventListener(
        'click', storeSettings);
    select('#clear_settings_button').addEventListener(
        'click', clearSettings);

    checkbox_all = select('#block_all_check');
    checkbox_some = select('#block_some_check');

    setupCheckboxes(checkbox_all, checkbox_some);

});