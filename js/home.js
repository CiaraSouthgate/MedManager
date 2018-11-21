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
  for (let i = 1; i <= dosingTimes; i++) {
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

//Creates variable for each field, stores to database
function addMeds(){
  var medName = $("#drugName").val();
  var genericOrBrand = $("input[name='genericOrBrand']:checked").val();
  var genericName = $("#genericName").val();
  var strength = $("#strength").val();
  var unit = $("#unit").val();
  var frequency = $("#frequency").val();
  var timeUnit = $("#timeUnit").val();
  var auxWarnings = $("#auxWarnings").val();
  var times = [];
  var isTaken = false;

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
      "asNeeded": asNeeded,
      "isTaken": isTaken
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

var existingTimes = [];

//Sorts existing time array
function Comparator(a, b) {
  if (a[0] < b[0]) return -1;
  else if (a[0] > b[0]) return 1;
  else {
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    return 0;
  }
}

function parseTime(time) {
  if (time.length < 8) {
      time = "0" + time;
    }
    let hr = parseInt(time.substring(0, 2));
    let min = parseInt(time.substring(3, 5));
    if (time.substring(6, 8) == "PM" && hr < 12) {
      hr += 12;
    } else if (time.substring(6, 8) == "AM" && hr == 12) {
      hr = 0;
    }
    if (hr < 6) {
      hr += 24;
    }
  return [hr, min, time];
}

function setTimes(medTimes) {
  for (let j = 0; j < medTimes.length; j++) {
    let time = medTimes[j];
    var medTime = parseTime(time);
    hr = medTime[0];
    min = medTime[1];
    time = medTime[2];
    var found;
    for (let k = 0; k < existingTimes.length; k++) {
      found = false;
      let check = existingTimes[k];
      if (check[0] == hr && check[1] == min) {
        found = true;
        break;
      }
    }
    if (!found) {
      existingTimes.push(medTime);
    }
  }
}

//Creates divs for all times that need meds
function createTimeDivs() {
  existingTimes.sort(Comparator);
  for (let i = 0; i < existingTimes.length; i++) {
    let time = existingTimes[i];
    let hr = time[0];
    let min = time[1];
    let str = time[2];
    let idName = hr + "_" + min;
    if (str[0] == 0) {
      str = str.substring(1);
    }
    let timeDiv = document.createElement("div");
    $(timeDiv).addClass("timeDiv");
    $(timeDiv).attr("id", idName);
    let divHead = document.createElement("h3");
    divHead.innerHTML = str.toLowerCase();
    timeDiv.append(divHead);
    rawTime = hr + (min / 60);
    if (rawTime >= 6 && rawTime < 12) {
      $("#morning").append(timeDiv);
    } else if (rawTime >= 12 && rawTime < 22) {
      $("#afternoon").append(timeDiv);
    } else {
      $("#night").append(timeDiv);
    }
  }
}

var warnings = {
  takeWithFood: "Take with food",
  takeEmptyStomach: "Take on an empty stomach",
  doNotCrush: "Do not split or crush",
  takeWithWater: "Take with plenty of water",
  drowsy: "May cause drowsiness",
  fridge: "Keep in refrigerator",
  shake: "Shake well",
  noAlcohol: "Do not drink alcohol while taking this medication",
  external: "For external use only",
  inhale: "For inhalation only"
}

function createMedDiv(med) {
  var medDiv = $("<div></div>");
  let name = $("<h2></h2>");
  let gen = $("<span></span>");
  let dosage = $("<p></p>");
  let notes = $("<div></div>");
  let checkBox = $("<input></input>");
  
  $(checkBox).attr("type", "checkbox");
  
  $(name).append(med.medName);
  $(gen).append(med.genericName);
  $(name).append(gen);
  $(dosage).append(med.strength + " " + med.unit);
  $(medDiv).append(checkBox);
  $(medDiv).append(name);
  $(notes).append(dosage);
  
  $(medDiv).addClass("medDiv");
  $(name).addClass("medName");
  $(dosage).addClass("dosage");
  $(notes).addClass("notes");
  $(checkBox).addClass("checkbox");
  
  try {
    for (let i = 0; i < med.auxWarnings.length; i++) {
      let note = $("<p></p>");
      $(note).append(warnings[med.auxWarnings[i]]);
      $(notes).append(note);
    }
  } catch {}
  finally {
    $(medDiv).append(notes);
  }

  checkBox.checked = med.isTaken;
  checkControl(checkBox, med);
  
  if (med.asNeeded) {
    $("#asNeeded").append(medDiv);
  } else {
    $.each(med.times, function(i, val) {
      time = med.times[i];
      time = parseTime(time);
      timeDiv = "#" + time[0] + "_" + time[1];
      console.log(medDiv);
      $(medDiv).clone().appendTo(timeDiv);
    });
  }
}

function checkControl(checkBox, med) {
  $(checkBox).change(function() {
  if ($(this).is(":checked")) {
      firebase.auth().onAuthStateChanged(function(user){
        firebase.database().ref("users/" + user.uid + "/meds/" + med.medName).update( {
          "isTaken": true
        });
      });                                                                             
    } else {
      firebase.auth().onAuthStateChanged(function(user){
        firebase.database().ref("users/" + user.uid + "/meds/" + med.medName).update( {
          "isTaken": false
        });
      });
    }
  });
}


function populateMeds() {
  for (let i = 0; i < allMeds.length; i++) {
    let current = allMeds[i];
    if (current.asNeeded) {
      createMedDiv(current);
    } else {
      setTimes(current.times);
    }
  }
  createTimeDivs();
  for (let j = 0; j < allMeds.length; j++) {
    if (!allMeds[j].asNeeded) {
      createMedDiv(allMeds[j]);
    }
  }
}

$.when(retrieveAllMeds()).then(populateMeds());

//Magical test button
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

//Logout button
$("#logout").click(function() {
  firebase.auth().signOut().then(function() {
    window.location = "index.html";
  });
});

window.setTimeout(populateMeds, 1000);
