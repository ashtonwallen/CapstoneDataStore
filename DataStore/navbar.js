 document.addEventListener('DOMContentLoaded', function() {
  switchToCookie = select_element('cookie_switch_button');
  switchToDemographics = select_element('demographics_button');
  switchToData = select_element('data_switch_button');

  switchToData.addEventListener('click', function() {
    switchWindow('options.html')
  });

 switchToCookie.addEventListener('click', function() {
    switchWindow('cookie_html.html')
  });

  switchToDemographics.addEventListener('click', function() {
    switchWindow('demographics.html');
  });
});

  function switchWindow(dest) {
     chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabs) {
      chrome.tabs.update({
        url: dest
      });
    });
}


function select_element(id) {
  return document.getElementById(id);
}

