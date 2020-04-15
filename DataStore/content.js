/**
DataStore Capstone Project

Author: Ashton Allen
Email: aashton482@gmail.com

content.js

Grabs data from window and passes to background for processing
**/

//This is where new dynamic, page relate datapoints can be collected and sent to our background script

chrome.runtime.sendMessage({
    url: window.location.href,
    html: document.documentElement.innerHTML || []
})