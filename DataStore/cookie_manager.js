// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.



// MIGHT NEED TO PLACE SOME IN BACKGROUND SCRIPT SO IT KEEP SHIT OUT

window.blocked_cookies = []
window.blocked_domains = []
window.blocked_all = false;

expanded_domains = []

function storeSettings() {

  var key = 'userSettings'
  var prefs = "";
  var json = {};

  //TODO da way this be saving gets foinked up
  prefs += JSON.stringify({
    'blocked_cookies': window.blocked_cookies,
    'blocked_domains': window.blocked_domains,
    'blocked_all': window.blocked_all
  });

  json[key] = prefs;

  chrome.storage.sync.set(json, function() {
    console.log('Saved', key, prefs);
  });
}

function retreiveSettings(callback) {

  chrome.storage.sync.get('userSettings', function(result) {
    result = result['userSettings'];
    result = JSON.parse(result);

    //setblockedall
    window.blocked_all = result['blocked_all']

    if (window.blocked_all) {
      document.getElementById('block_all_check').click()
    } else {
      document.getElementById('block_some_check').click()
    }

    //set blockedcookies
    window.blocked_cookies.push(result['blocked_cookies']);
    window.blocked_cookies.filter(onlyUnique);

    //set blocked domains
    window.blocked_domains.push(result['blocked_domains']);
    window.blocked_domains.filter(onlyUnique);

  });

}

function clearSettings() {
  var key = 'userSettings'
  var prefs = "";
  var json = {};

  prefs += JSON.stringify({
    'blocked_cookies': [],
    'blocked_domains': [],
    'blocked_all': false
  });

  json[key] = prefs;

  chrome.storage.sync.set(json, function() {
    console.log('Saved', key, prefs);
  });
}

// A simple Timer class.
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

function removeCookie(cookie) {
  var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
    cookie.path;
  chrome.cookies.remove({
    "url": url,
    "name": cookie.name
  });
  cache.remove(cookie)
}

function removeCookiesForDomain(domain) {
  if (cache.getCookies(domain))
    cache.getCookies(domain).forEach(function(cookie) {
      removeCookie(cookie);
    });

}

function removeCookiesBlocked() {
   cache.getDomains().forEach(function(domain)
   {
    cache.getCookies(domain).forEach(function(cookie){
      if (window.blocked_cookies.includes(cookie))
      {
        alert('foundthebasetsdf');
        removeCookie(cookie);
      }
    });
   });

  window.blocked_domains.forEach(function(domain){
    removeCookiesForDomain(domain)
  });
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
    row.insertCell(-1).innerText = domain;

    var cell = row.insertCell(-1);
    cell.innerText = cookies.length;
    cell.setAttribute("class", "cookie_count");

    var block_button = document.createElement("button");
    block_button.innerText = "block";
    block_button.onclick = (function() {
      removeCookiesForDomain(domain);
      window.blocked_domains.push(domain);
      window.blocked_domains.filter(onlyUnique);
    });
    var cell = row.insertCell(-1);
    cell.appendChild(block_button);
    cell.setAttribute("class", "button");


    //Expand button
    optId = "row" + domain;
    row.setAttribute("id", optId);
    var expand_button = document.createElement("button");
    expand_button.innerText = "expand";
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


function logArray(arr) {
  console.log("Size: " + arr.length)
  arr.forEach(elem => console.log("LOGARRAY: " + elem));
}

function expandSection(row) {
  domain = row.id.slice(3)
  cookies = cache.getCookies(domain)

  subtable = document.getElementById(row.id + "subtable")

  if (subtable) {
    row.removeChild(subtable);
  } else {
    var subtable = document.createElement("TABLE");
    subtableId = row.id + "subtable"
    subtable.setAttribute("class", "subtable")
    subtable.setAttribute("id", subtableId)

    cookies.forEach(function(cookie) {
      var subrow = subtable.insertRow(-1);
      subrow.insertCell(-1).innerText = domain + "." + cookie.name;

      var subbutton = document.createElement("button");
      subbutton.innerText = "block";
      subbutton.onclick = (function() {
        window.blocked_cookies.push(cookie);
        window.blocked_cookies.filter(onlyUnique);
        removeCookie(cookie);
        reloadCookieTable();
      });

      subrow.appendChild(subbutton);
      row.appendChild(subtable);
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
  window.blocked_cookies.forEach(function(cookie) {
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
        window.blocked_all = true;
      } else {
        startListening();
      }

      checkbox_some.addEventListener('change', function() {
        if (checkbox_some.checked) {
          if (checkbox_all.checked)
            checkbox_all.click();
          stopListening();
          continuousDeleteList();
          window.blocked_all = false;
        } else {
          startListening();
        }
      });
    });


  } // combine these somehow

  if (checkbox_some) {

  }
}

//THIS IS ALL THEY ARE DOING TO GET THE COOKIES
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
  document.querySelector('#refresh_table_debug').addEventListener(
    'click', reloadCookieTable);
  document.getElementById('save_settings_button').addEventListener(
    'click', storeSettings);
  document.getElementById('clear_settings_button').addEventListener(
    'click', clearSettings);


  checkbox_all = document.getElementById('block_all_check');
  checkbox_some = document.getElementById('block_some_check');

  setupCheckboxes(checkbox_all, checkbox_some);


  //switch to data manager
  switchToData = document.getElementById('data_switch_button')

  switchToData.addEventListener('click', function() {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabs) {
      chrome.tabs.update({
        url: "options.html"
      });
    })
  });
});