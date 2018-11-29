(function() {
  
  var firebase = app_firebase;
 
  var welcome = document.getElementById("welcome");
  var userName = "";

  firebase.auth().onAuthStateChanged(function(user){
    if (user){
      userName=user.displayName;
      
    } else {
      userName="test";
    }
        welcome.innerText = "Welcome, " + userName;
    });

 
 })();