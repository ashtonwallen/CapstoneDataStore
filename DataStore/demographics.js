function select(id) {
	return document.getElementById(id);
}

document.addEventListener('DOMContentLoaded', function() {
	select('save_demo').onclick = saveAnswers;
	select('reset_demo').onclick = resetDemo;
	retreiveSettings();
});




function saveAnswers() {
	var date_reg = /^[0-9]{2}[\/][0-9]{2}[\/][0-9]{4}$/g;
	var email_reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

	if (email_reg.test(select('q1').value)) {
		storeSettings();
	} else {
		alert('Please enter valid email address')
	}


}

function storeSettings() {
	var key = 'userDemographics'
	var prefs = "";
	var json = {};
	var questionsWithAnswers = {}

	var elms = document.querySelectorAll('.question_input');
    elms.forEach(function(elem) {
		questionsWithAnswers[elem.id] = elem.value
    })

	prefs += JSON.stringify({
		'demo_answers': questionsWithAnswers
	});

	json[key] = prefs;

	chrome.storage.local.set(json, function() {
		console.log('Saved Demo', key, prefs);
	});
}

function resetDemo() {
	var elms = document.querySelectorAll('.question_input');
    elms.forEach(function(elem) {
		elem.value = '';
    })

    storeSettings();
}


function retreiveSettings(callback) {
	chrome.storage.local.get('userDemographics', function(result) {
		if (result['userDemographics']) {
			result = result['userDemographics'];
			result = JSON.parse(result);

			 var elms = document.querySelectorAll('.question_input');
			elms.forEach(function(elem) {
				if (result['demo_answers'][elem.id])
					elem.value = result['demo_answers'][elem.id]
			})
		}

	});

}