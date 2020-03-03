const firebaseConfig = {
	apiKey: "AIzaSyAJywW-CmK5QH5lIcOoHSBNJrTkSDbQmRc",
	authDomain: "datastore-3d399.firebaseapp.com",
	databaseURL: "https://datastore-3d399.firebaseio.com",
	projectId: "datastore-3d399",
	storageBucket: "datastore-3d399.appspot.com",
	messagingSenderId: "202616377876",
	appId: "1:202616377876:web:e74721aeedadbfcb4dcd01",
	measurementId: "G-Z8V4LGF219"
};

firebase.initializeApp(firebaseConfig);



window.addEventListener('DOMContentLoaded', (event) => {
	getListingData();
});

function getListingData() {
	var ref = firebase.database().ref();

	ref.on("value", function(snapshot) {
		obj = snapshot.val().listings

		listview = document.getElementById('listing_list')
		listview.innerHTML = ""
		p = document.createElement('p')

		listview.appendChild(p)

		Object.keys(obj).forEach(function(data) {
			data = obj[data];
			demo = data.demographics;
			meta = data.metadata;


			row = document.createElement('div')
			row.setAttribute('class','row')

			card = document.createElement('div')
			card.setAttribute('class','card')


			card2= document.createElement('div')
			card2.setAttribute('class','card')


			p = document.createElement('p')
			p.innerHTML += '<b>Demographics</b><br>'
			p.innerHTML += "<a href=\"mailto:" + demo['email'] + "\">" + demo['email'] + "</a><br>"
			Object.keys(demo).forEach(function(key){
				if (key != 'email')
					p.innerHTML += key + ': ' + demo[key] + '<br>'
			
				
			})

			p2 = document.createElement('p')
			p2.innerHTML += '<b>Metadata</b><br>'


			Object.keys(meta).forEach(key => p2.innerHTML += ''+key+'' + ': ' + meta[key] + '<br>')

			card.appendChild(p)
			card2.appendChild(p2)

			row.appendChild(card);
			row.appendChild(card2);


			listview.appendChild(row);

		})

	}, function(error) {
		console.log("Error: " + error.code);
	});
}
