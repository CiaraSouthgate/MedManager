(function() {
  
  var firebase = app_firebase;
 
  var welcome = document.getElementById("welcome");
  var userName = "";

  firebase.auth().onAuthStateChanged(function(user){
    if (user){
      userName=user.displayName;
	  		//console.log (userName);
	  		// display quote from database 
      var dbRef = firebase.database().ref().child('message');
    } else {
      userName="my friend";
    }
        welcome.innerText = "Hello " + userName;
    });

 
 })();