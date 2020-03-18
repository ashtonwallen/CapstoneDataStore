
document.getElementById('fileinput').addEventListener('change', function(){
    var file = this.files[0];
    console.log("size : " + file.size);
    console.log("type : " + file.type); 

    //verify type and ensure it is in correct format, then do firebase
}, false);