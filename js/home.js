// Makes add med window appear
$("#addMed").click(function() {
  $("#modal").css("display", "block");
});

// Makes add med window disappear
$("#cancel").click(function() {
  $("#modal").css("display", "none");
});

//Takes frequency, makes coordinating amount of time slots appear
function populateTimes() {
  var dosingTimes = 0;
  dosingTimes = $("#frequency option:selected").text();
  for (var i = 1; i <= dosingTimes; i++) {
    $("#times").append("<div class='timeSlot'><input class='timepicker' placeholder='8:00 AM'></div>");
  }
  enableTimepicker();
}

$("#frequency").change(function() {
  $("#times").html("");
  $("#frequency option:selected").each(function() {
    if (asNeeded == false) {
      populateTimes();
    }
  });
});

//If med is "as needed", no times appear
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

// Creates timepicker
function enableTimepicker() {
  $('.timepicker').timepicker({
  timeFormat: 'h:mm p',
  interval: 30,
  minTime: '12:00am',
  maxTime: '11:30pm',
  defaultTime: '8:00am',
  startTime: '8:00am',
  dynamic: false,
  dropdown: true,
  scrollbar: true
  });
}

enableTimepicker();

var database = firebase.database();

var allMeds = [];

// Draws list of meds from database
function retrieveAllMeds(){
  allMeds = [];
  firebase.auth().onAuthStateChanged(function(user){
  var userId = firebase.auth().currentUser.uid;
  var medsRef = firebase.database().ref('/users/' + userId + "/meds/");
    medsRef.once('value', function (snap) {
      snap.forEach(function (childSnap) {
        allMeds.push(childSnap.val());
      });
    });
  });
}

// Calls above function to get med list once page loads
retrieveAllMeds();

// Takes form data from Add a medication window and pushes to database
function addMeds(){
  //Creates variable for each field, stores to database
  var medName = $("#drugName").val();
  var genericOrBrand = $("input[name='genericOrBrand']:checked").val();
  var genericName = $("#genericName").val();
  var strength = $("#strength").val();
  var unit = $("#unit").val();
  var frequency = $("#frequency").val();
  var timeUnit = $("#timeUnit").val();
  var auxWarnings = $("#auxWarnings").val();
  var times = [];

  //Loops over time fields, adds to array within med object
  function getTimes() {
    var time = $(".timepicker");
    for (var i = 0; i < time.length; i++) {
    times.push(time[i].value);
    }
  }

  getTimes();

  // Creates an object for each med in the database
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
      "times": times,
      "auxWarnings": auxWarnings,
      "asNeeded": asNeeded
    });
  });
  retrieveAllMeds();
}

// Checks if the med is already in the medication list
function checkMeds() {
  var thisMedName = $("#drugName").val();
  for (let i = 0; i < allMeds.length; i++) {
    if (allMeds[i].medName == thisMedName) {
      return true;
    }
  }
  return false;
}

// Prompts user if they want to overwrite a med if it already exists
// Adds a med, doesn't close window. 
$("#add").click(function() {
  if (checkMeds()) {
    alert("Medication already exists in your schedule. Overwrite?"); //Will change this to an actual window that does something rather than an alert
  }
  addMeds();
});

// Prompts user if they want to overwrite a med if it already exists
// Adds a med, closes window. 
$("#addClose").click(function() {
  if (checkMeds()) {
    alert("Medication already exists in your schedule. Overwrite?"); //Will change this to an actual window that does something rather than an alert
  }
  addMeds();
  $("#modal").css("display", "none");
});

function populateMeds() {

}

populateMeds();

//Magical test button
$("#test").click(function() {
  console.log(retrieveAllMeds());
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

//Logout button
$("#logout").click(function() {
  firebase.auth().signOut().then(function() {
    window.location = "index.html";
  });
});
