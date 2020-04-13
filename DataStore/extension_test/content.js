/**
DataStore Capstone Project

Author: Ashton Allen
Email: aashton482@gmail.com

content.js

Grabs data from window and passes to background for processing
**/

//THIS IS WHERE I SENT DATA FROM PAGE TO BACKGROUND SCRIPT

chrome.runtime.sendMessage({
    url: window.location.href,
    html: document.documentElement.innerHTML || []
})