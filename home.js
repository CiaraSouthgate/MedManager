$(document).ready(function() {
  $("#addMed").click(function() {
    $("#modal").css("display", "block");
  });

  $("#cancel").click(function() {
    $("#modal").css("display", "none");
  });

  allMeds = [];

  function retrieveAllMeds(){
    var userId = firebase.auth().currentUser.uid;
    var medsRef = firebase.database().ref('/users/' + userId + "/meds/");
      medsRef.once('value', function (snap) {
        snap.forEach(function (childSnap) {
          allMeds.push(childSnap.val());
        });
      });
  }

  $("#ok").click(function() {
    var medName = $("#drugName").val();
    var genericOrBrand = $("input[name='genericOrBrand']:checked").val();
    var genericName = $("#genericName").val();
    var strength = $("#strength").val();
    var unit = $("#unit").val();
    var frequency = $("#frequency").val();
    var timeUnit = $("#timeUnit").val();
    var auxWarnings = $("#auxWarnings").val();

    var database = firebase.database();
    firebase.auth().onAuthStateChanged(function(user){
      firebase.database().ref("users/" + user.uid + "/meds/" + medName).update( {
        "medName": medName,
        "genericOrBrand": genericOrBrand,
        "genericName": genericName,
        "strength": strength,
        "unit": unit,
        "frequency": frequency,
        "timeUnit": timeUnit,
        "auxWarnings": auxWarnings
      });
    });
    // console.log(medName);
    // console.log(genericOrBrand);
    // console.log(genericName);
    // console.log(strength);
    // console.log(unit);
    // console.log(frequency);
    // console.log(timeUnit);
    // console.log(auxWarnings);
    retrieveAllMeds();
    console.log(allMeds);
    $("#modal").css("display", "none");
  });

  function populateTimes() {
    var dosingTimes = 0;
    dosingTimes = $("#frequency option:selected").text();
    for (var i = 1; i <= dosingTimes; i++) {
      $("#times").append("<div class='timeSlot'><input type='time'><input type='radio' name='amPm' value='am'> am <input type='radio' name='amPm' value='pm'> pm<br/></div>");
    }
  }

  $("#frequency").change(function() {
    $("#times").html("");
    $("#frequency option:selected").each(function() {
      if (asNeeded == false) {
        populateTimes();
      }
    });
  });

  var asNeeded = false;
  $('#asNeeded').change(function(){
     $("#times").html("");
     if (asNeeded == false) {
       asNeeded = true;
     } else {
       asNeeded = false;
       populateTimes();
     }
     });

  $("#test").click(function() {
  var aft = document.getElementById("afternoon");
  var timeBlock = document.createElement("div");
  var time = "3:00 pm";
  var timeSpot = document.createElement("h3");
  timeSpot.innerHTML = time;
  var med = document.createElement("div");
  $(med).addClass("med");
  var name = "Ibuprofen";
  var notes = "Take with food";
  med.innerHTML = "<input type=\"checkbox\">"
  var nameSpot = document.createElement("span");
  var notesSpot = document.createElement("p");
  nameSpot.innerHTML = name;
  notesSpot.innerHTML = notes;
  aft.appendChild(timeBlock);
  timeBlock.appendChild(timeSpot);
  timeBlock.appendChild(med);
  med.appendChild(nameSpot);
  med.appendChild(notesSpot);
  });

  $("#logout").click(function() {
    firebase.auth().signOut().then(function() {
      window.location = "index.html";
    });
  });
});
