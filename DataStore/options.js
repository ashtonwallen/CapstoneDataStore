document.addEventListener('DOMContentLoaded', function () {



  const background = chrome.extension.getBackgroundPage()
  Object.keys(background.urls).forEach(function (url) {
    const div_url = document.createElement('div')
    div_url.setAttribute("id","url_info")
    const div_html = document.createElement('div')
    div_html.setAttribute("id","html_info")
 
    div_url.innerHTML = '<b><p>' + url + '<p></b>'
    div_html.textContent = '<pre>' + background.urls[url] + '</pre>'

    document.body.appendChild(div_url)
    document.body.appendChild(div_html) 
  })

  switchToCookie = document.getElementById('cookie_switch_button')
  
  switchToCookie.addEventListener('click', function() {
         chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
      chrome.tabs.update({
      url: "cookie_html.html"
      });
    })
    });
}, false)