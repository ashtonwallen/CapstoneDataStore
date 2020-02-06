//alert('Grrr.')
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   const re = new RegExp('bear', 'gi')
//   const matches = document.documentElement.innerHTML.match(re)
//   sendResponse({count: matches.length})
// })

//to get inner html
//const matches = document.documentElement.innerHTML || []

//THIS IS WHERE I SENT DATA FROM PAGE TO BACKGROUND SCRIPT

chrome.runtime.sendMessage({
  url: window.location.href,
  html: document.documentElement.innerHTML || []
})