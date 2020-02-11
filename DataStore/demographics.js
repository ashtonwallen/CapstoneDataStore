document.addEventListener('DOMContentLoaded', function() {
	//question_div = select("demo_div");
	getData();

});

function select(id) {
	return document.getElementById(id);
}

function getData() {
	const url = chrome.runtime.getURL('questions.json');

	fetch(url, {
			headers: {
				'Content-Type': 'application/json',
				'Accept': 'application/json'
			}

		})
		.then((response) => response.json())
		.then((json) => setupQuestions(json));
}

function setupQuestions(json) {
	questions = json['questions'];
	parent = select('demo_div');
	console.log(questions)
	Object.keys(questions).forEach(function(question) {
		question_span = document.createElement('span');
		question_span.innerHTML = '<b>' + questions[question] + '</b>' + ' <input class=\'question_input\'></input><br>';
		parent.appendChild(question_span)

	})
}