/*
    DataStore Capstone Project
   
    Author: Ashton Allen
    Email: aashton482@gmail.com

    platform.js
    Script for running the main page, grabs data from firebase and displays it
*/

//init firebase
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

// get listing data from firebase and display
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
            demo = data.demo;
            meta = data.meta;
            size = data.size;

            row = document.createElement('div');
            row.setAttribute('class', 'row');

            card = document.createElement('div');
            card.setAttribute('class', 'card');


            card2 = document.createElement('div');
            card2.setAttribute('class', 'card');


            p = document.createElement('p');
            p.innerHTML += '<b>Demographics</b><hr>';
            p.innerHTML += "<a href=\"mailto:" + demo['Email Address'] + "\">" + demo['Email Address'] + "</a><br>";
            Object.keys(demo).forEach(function(key) {
                if (key != 'Email Address')
                    p.innerHTML += key + ': ' + demo[key] + '<br>';
            })

            p2 = document.createElement('p');
            p2.innerHTML += '<b>Metadata</b><hr>';

            size_p = document.createElement('p');
            size_p.innerHTML = "<b>" + size + " bytes" + "</b>";

            Object.keys(meta).forEach(key => p2.innerHTML += '' + meta[key] + '<br>');

            card.appendChild(p);
            card2.appendChild(size_p);
            card2.appendChild(p2);


            row.appendChild(card);
            row.appendChild(card2);


            listview.appendChild(row);

        })

    }, function(error) {
        console.log("Error: " + error.code);
    });
}