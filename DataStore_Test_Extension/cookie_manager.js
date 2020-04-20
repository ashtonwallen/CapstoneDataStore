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

// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function CustomException(message) {
    const error = new Error(message);
    return error;
}

CustomException.prototype = Object.create(Error.prototype);

const background = chrome.extension.getBackgroundPage();
expanded_domains = []

function storeSettings() {
    background.saveUserSettings();
    location.reload();
}


function retreiveSettings(callback) {
    background.retreiveSettings();

    if (background.blocked_all) {
        select('#block_all_check').click()
    } else {
        select('#block_some_check').click()
    }
}

function clearSettings() {
    try {
        background.blocked_cookies = [];
        background.blocked_domains = [];
        background.blocked_all = false;

        storeSettings();

        if (background.blocked_cookies != [] || background.blocked_domains != [] || background.blocked_all != false)
            throw new CustomException('Settings were not cleared')
    } catch (e) { console.log("Test clearSettings() in cookie_manager failed: " + e) }


}

// simple Timer class
function Timer() {
    this.start_ = new Date();

    this.elapsed = function() {
        return (new Date()) - this.start_;
    }

    this.reset = function() {
        this.start_ = new Date();
    }
}

// Compares cookies for "key" (name, domain, etc.) equality, but not "value"
// equality.
function cookieMatch(c1, c2) {
    return (c1.name == c2.name) && (c1.domain == c2.domain) &&
        (c1.hostOnly == c2.hostOnly) && (c1.path == c2.path) &&
        (c1.secure == c2.secure) && (c1.httpOnly == c2.httpOnly) &&
        (c1.session == c2.session) && (c1.storeId == c2.storeId);
}

// Returns an array of sorted keys from an associative array.
function sortedKeys(array) {
    var keys = [];
    for (var i in array) {
        keys.push(i);
    }
    keys.sort();
    return keys;
}

// Shorthand for document.querySelector.
function select(selector) {
    return document.querySelector(selector);
}

// An object used for caching data about the browser's cookies, which we update
// as notifications come in.
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

    // Returns a sorted list of cookie domains that match |filter|. If |filter| is
    //  null, returns all domains.
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


function removeAllForFilter() {
    var filter = select("#filter").value;
    var timer = new Timer();
    cache.getDomains(filter).forEach(function(domain) {
        removeCookiesForDomain(domain);
    });
}

function removeAll() {
    try {
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

        chrome.cookies.getAll({}, function(cookies) {
            if (cookies.length > 0)
                throw new CustomException("All cookies not removed")
        });
    } catch (e) { console.log("Test removeAll failed: " + e) }
}

function removeCookie(cookie) {
    try {
        var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
            cookie.path;
        chrome.cookies.remove({
            "url": url,
            "name": cookie.name
        });

        chrome.cookies.get({ "url": url, "name": cookie.name }, function(cookie) {
            if (cookie)
                throw new CustomException("Blocked cookie not removed")
        });

        console.log("Test removeCookie() passed")
    } catch (e) { console.log("Test removeCookie() failed: " + e) }

}

function removeCookiesForDomain(domain) {
    try {
        if (cache.getCookies(domain))
            cache.getCookies(domain).forEach(function(cookie) {
                removeCookie(cookie);
            });

        if (cache.getCookies(domain))
            throw new CustomException("Domain cookies not removed")
    } catch (e) { console.log("removeCookiesForDomain() failed: " + e) }

}

function removeCookiesBlocked() {
    try {
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

    } catch (e) { console.log("Test removeCookiesBlocked() failed: " + e) }
}

function resetTable() {
    var table = select("#cookies");
    while (table.rows.length > 1) {
        table.deleteRow(table.rows.length - 1);
    }
}

var reload_scheduled = false;

function scheduleReloadCookieTable() {
    if (!reload_scheduled) {
        reload_scheduled = true;
        setTimeout(reloadCookieTable, 250);
    }
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}


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
    }); // end domains foreach
}

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

function startListening() {
    chrome.cookies.onChanged.addListener(listener);
}

function stopListening() {
    chrome.cookies.onChanged.removeListener(listener);
    chrome.cookies.onChanged.removeListener(block_all_listener);
    chrome.cookies.onChanged.removeListener(block_specific_listener);
}

function continuousDeleteAll() {
    chrome.cookies.onChanged.addListener(block_all_listener);
}

function continuousDeleteList() {
    chrome.cookies.onChanged.addListener(block_specific_listener);
}

function block_all_listener(info) {
    removeCookie(info.cookie);
    reloadCookieTable();
}

function listener(info) {
    cache.remove(info.cookie);
    if (!info.removed) {
        cache.add(info.cookie);
    }
    scheduleReloadCookieTable();
}

//still need to remove specific domains
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