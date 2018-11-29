// Makes add med window appear
$("#addMed").click(function() {
  $("#modal").css("display", "block");
  $("#modal-content h1").text("Add a medication");
  $("#add").val("ADD");
  $("#reset").css("display", "inline-block");
  $("#drugName").prop("readonly", false);
});

// Makes add med window disappear
$("#cancel").click(function() {
  $("#modal").css("display", "none");
  resetTimes();
});

// Hides or shows the generic name field depending on if the "generic" or "brand name" radio button is selected
$("input[name='genericOrBrand'").change(function() {
  if ($('#generic').prop('checked')) {
    $("#genericName").css("display", "none");
  } else if ($('#brandName').prop('checked')) {
    $("#genericName").css("display", "initial");
  }
});

//Takes frequency of med, makes coordinating amount of time slots appear
function populateTimes() {
  $("#times").empty();
  var dosingTimes = 0;
  dosingTimes = $("#frequency option:selected").text();
  for (let i = 1; i <= dosingTimes; i++) {
    $("#times").append("<div class='timeSlot'><input class='timepicker' placeholder='8:00 AM' readonly></div>");
  }
  enableTimepicker();
}

// When the frequency pulldown is changed, repopulates modal with the required amount of med time fields
$("#frequency").change(function() {
  $("#times").html("");
  $("#frequency option:selected").each(function() {
    if (medAsNeeded == false) {
      populateTimes();
    }
  });
});

//If med is "as needed", no times appear
var medAsNeeded = false;
$("#medAsNeeded").change(function(){
   $("#times").html("");
   if (medAsNeeded == false) {
     medAsNeeded = true;
   } else {
     medAsNeeded = false;
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

// Array other functions use to get data
var allMeds = [];

// Draws list of meds from database and populates page
function retrieveAllMeds(){
  allMeds = [];
  firebase.auth().onAuthStateChanged(function(){
    var userId = firebase.auth().currentUser.uid;
    var medsRef = firebase.database().ref("/users/" + userId + "/meds/");
    medsRef.once("value").then(function (snap) {
      snap.forEach(function (childSnap) { 
        allMeds.push(childSnap.val());
      });
      clearMeds();
      populateMeds();
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
  var auxWarnings = $("#auxWarnings").val();
  var times = [];
  var isTaken = [];
  
  if (medAsNeeded) {
    isTaken = false;
  }

  //Loops over time fields, adds to array within med object
  function getTimes() {
    var time = $(".timepicker");
    for (var i = 0; i < time.length; i++) {
      isTaken.push(false);
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
      "times": times,
      "auxWarnings": auxWarnings,
      "asNeeded": medAsNeeded,
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

// Submits med form to database
$("#medForm").submit(function(e) {
  e.preventDefault();
  $("#modal").css("display", "none");
  addMeds();
  $("#drugName").val("");
  $("#genericName").val("");
  $("#strength").val("");
  resetTimes();
});

function resetTimes() {
  $("#times").html("");
  $("#frequency option[value='1']").attr("selected", "selected");
  populateTimes();
}

$("#reset").click(function() {
  resetTimes();
})

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

//Parses string representing time, converts into array
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

//Checks if time exists in list of times, if not, adds it
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

// Auxiliary warnings
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

//Creates a div for each medication, adds it to its time
function createMedDiv(med) {
  var medDiv = $("<div></div>");
  let edit = $("<i class='fas fa-pencil-alt'></i>");
  let deleteMed = $("<i class='fas fa-times'></i>");
  let name = $("<div></div>");
  let lateAlert = $("<span></span>")
  let dueAlert = $("<span></span>")
  let medName = $("<h2></h2>");
  let gen = $("<span></span>");
  let dosage = $("<p></p>");
  let freq = $("<p></p>");
  let notes = $("<div></div>");
  let checkBox = $("<input></input>");
  
  $(checkBox).attr("type", "checkbox");

  $(medName).append(med.medName);
  $(gen).append(med.genericName);
  $(name).append(lateAlert);
  $(name).append(dueAlert);
  $(name).append(medName);
  $(name).append(gen);
  $(dosage).append(med.strength + " " + med.unit);
  $(medDiv).append(checkBox);
  $(medDiv).append(name);
  $(medDiv).append(edit);
  $(medDiv).append(deleteMed);
  $(notes).append(dosage);
  if (med.asNeeded) {
    $(notes).append(freq);
    $(freq).append(med.frequency + " time(s) per day");
  }
  
  $(medDiv).addClass("medDiv");
  $(medName).css("display", "inline-block");
  $(lateAlert).addClass("fas fa-exclamation");
  $(lateAlert).addClass("lateAlert");
  $(dueAlert).addClass("far fa-clock");
  $(dueAlert).addClass("dueAlert");
  $(name).addClass("medName");
  $(gen).addClass("generic");
  $(medName).addClass("specificMedName");
  $(dosage).addClass("dosage");
  $(notes).addClass("notes");
  $(checkBox).addClass("checkbox");
  $(edit).addClass("editIcon");
  $(deleteMed).addClass("deleteIcon");
  
  //If med has warnings, adds them to div
  try {
    for (let i = 0; i < med.auxWarnings.length; i++) {
      let note = $("<p></p>");
      $(note).append("&#8226; " + warnings[med.auxWarnings[i]]);
      $(notes).append(note);
    }
  } catch {}
  finally {
    $(medDiv).append(notes);
  }
  
  if (med.asNeeded) {
    $("#asNeeded").append(medDiv);
  } else {
    $.each(med.times, function(i, val) {
      time = med.times[i];
      time = parseTime(time);
      timeDiv = "#" + time[0] + "_" + time[1];
      $(medDiv).clone().appendTo(timeDiv);
    });
  }

  checkControl();
  
  // Edit and delete icons appear and reappear
  $(".medDiv").mouseenter(function() {
    $(this).find(".editIcon").css("display", "inline-block");
    $(this).find(".deleteIcon").css("display", "inline-block");
  });
  $(".medDiv").mouseleave(function() {
    $(this).find(".editIcon").css("display", "none");
    $(this).find(".deleteIcon").css("display", "none");
  });
  
  $(".editIcon").click(function() {
    var name = $(this).parent().find("h2").text();
    var index;
    for (let i = 0; i < allMeds.length; i++) {
      if (allMeds[i].medName == name) {
        index = i;
      }
    }
    resetTimes();
    populateTimes();
    editMed(index);
  });

  $(".deleteIcon").click(function() {
    var name = $(this).parent().find("h2").text();
    var index;
    for (let i = 0; i < allMeds.length; i++) {
      if (allMeds[i].medName == name) {
        index = i;
      }
    }
    medToDelete = allMeds[index].medName;
    deleteAMed();
  });
}

function isLate() {
  let divs = $(".medDiv");
  let date = new Date();
  let currentTime = date.getHours() * 60 + date.getMinutes();
  
  for (let i = 0; i < divs.length; i++) {
    let current = divs[i];
    let name = $(current).find(".specificMedName").text();
    let box = $(current).find(".checkbox");
    let time = $(current).parent().find("h3").text().toUpperCase();
    if (time) {
      let medTime = parseTime(time);
      if (medTime[0] > 24) {
        medTime[0] -= 24;
      }
      medTime = medTime[0] * 60 + medTime[1];

      if (!($(box).is(":checked"))) {
        if (currentTime > medTime) {
          $(current).addClass("late");
        } else if ((medTime - currentTime) < 30) {
          $(current).addClass("due");
        }
      } else {
        $(current).removeClass("late");
        $(current).removeClass("due");
      }
    }
  }
  setTimeout(isLate, 30000);
}

// Edit function
function editMed(index) {
  $("#modal").css("display", "block");
  $("#modal-content h1").text("Edit a medication");
  $("#add").val("EDIT");
  $("#reset").css("display", "none");
  $("#drugName").val(allMeds[index].medName);
  $("#drugName").prop("readonly", true);
  $("#genericName").val(allMeds[index].genericName);
  $("#strength").val(allMeds[index].strength);
  $("#unit").val(allMeds[index].unit);

  if (allMeds[index].genericOrBrand == "generic") {
    $("#generic").prop("checked", true).change();
    $("#brandName").prop("checked", false).change();
  } else {
    $("#brandName").prop("checked", true).change();
    $("#generic").prop("unchecked", false).change();
  }

  $("#frequency").val(allMeds[index].frequency).change();

  populateTimes();

  if (allMeds[index].times != undefined) {
    var timepickers = $(".timepicker");
    for (let i = 0; i < timepickers.length; i++) {
      $(timepickers[i]).val(allMeds[index].times[i]);
    }
  }

  if (allMeds[index].asNeeded === true) {
    $("#medAsNeeded").prop("checked", true);
    $("#times").html("");
    medAsNeeded = true;
  }
  if (allMeds[index].auxWarnings != undefined) {
    for (let i = 0; i < allMeds[index].auxWarnings.length; i++) {
      $("#auxWarnings").val(allMeds[index].auxWarnings[i]).prop("checked", true);
    }
  }
}

var medToDelete;

// Delete function
function deleteAMed() {
  $("#deleteModal").css("display", "block");
  $("#deleteMedName").text(medToDelete);
}

$("#deleteClose").click(function() {
  $("#deleteModal").css("display", "none");
});

// Removes med from database
$("#delete").click(function() {
  $("#deleteModal").css("display", "none");
  var userId = firebase.auth().currentUser.uid;
  var medsRef = firebase.database().ref("/users/" + userId + "/meds/" +   medToDelete)
  medsRef.remove();
  // Removes med from the allMeds array as well as database
  for (let i = 0; i < allMeds.length; i++) {
    if (allMeds[i].medName == medToDelete) {
      allMeds.splice(i, 1);
    }
  }
  clearMeds();
  populateMeds();
});

//Sets checkboxes to isTaken value from database; updates database
//when value is changed.
function checkControl() {
  let divs = $(".medDiv");
  var index;
  var taken;
  var done = "wait";
  
  for (let i = 0; i < divs.length; i++) {
    let current = divs[i];
    let name = $(current).find(".specificMedName").text();
    let box = $(current).find(".checkbox");
    let time = $(current).parent().find("h3").text().toUpperCase();
    
    var userId = firebase.auth().currentUser.uid;
    var medsRef = firebase.database().ref("/users/" + userId + "/meds/" + name);
  
    medsRef.once("value").then(function (snap) {
      let times = snap.val().times;
      taken = snap.val().isTaken;
      index = $.inArray(time, times);
        if (index > -1) {
          $(box).prop("checked", taken[index]);
        } else {
          $(box).prop("checked", taken);
        }
      
      updateBox(taken, index);
      
      //Updates database with value of checkbox
      function updateBox(taken, index) {
        $(box).change(function() {
          if (index > -1) {
            if ($(this).is(":checked")) {
              taken[index] = true;
            } else {
              taken[index] = false;
            }
          } else {
            if ($(this).is(":checked")) {
              taken = true;
            } else {
              taken = false;
            }
          }
          
          isLate();

          firebase.auth().onAuthStateChanged(function(user){
            firebase.database().ref("users/" + userId + "/meds/" + name ).update( {
              "isTaken": taken
            });
          });
        });
      }
    });
  }
  return;
}

//Clears meds from the page so it can be refreshed with an up-to-date list from the database
function clearMeds() {
  $("#morning").empty();
  $("#afternoon").empty();
  $("#night").empty();
  $("#asNeeded").empty();
  existingTimes = [];
}

//Populates screen with meds from database
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

retrieveAllMeds();

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

// Logout button
$("#logout").click(function() {
  firebase.auth().signOut().then(function() {
    window.location = "index.html";
  });
});

// setting up a clock
  function startTime() {
    var today = new Date();
    var h = today.getHours();
    var suffix;
    if (h > 12) {
      h -= 12;
      suffix = "PM";
    } else {
      suffix = "AM";
    }
    if (h == 0) {
      h = 12;
    }
    var m = today.getMinutes();
    if (m < 10) {
      m = "0" + m;
    }
    document.getElementById("time").innerHTML = h + ":" + m + " " + suffix;
    var t = setTimeout(startTime, 500);
  }

// Pharmacy info window controls
$("#pharmacy").click(function() {
  $("#pharmModal").css("display", "block");
});

$("#pharmClose").click(function() {
  $("#pharmModal").css("display", "none");
  $("#pharmForm").css("display", "none");
  if (!pharm) {
    $("#pharmMessage").css("display", "block");
  }
});

$("#addNewPharm").click(function() {
  $("#pharmForm").css("display", "block");
  $("#pharmMessage").css("display", "none");
});

$("#cancelAddNewPharm").click(function() {
  $("#pharmForm").css("display", "none");
  $("#pharmMessage").css("display", "block");
});

// Edits pharmacy information in database
$("#pharmEdit").click(function() {
  $("#pharmForm").css("display", "block");
  $("#pharmInfo").css("display", "none");
  $("#cancelAddNewPharm").css("display", "none");
  $("#cancelPharmEdit").css("display", "inline-block");
  $("#pharmClose").css("display", "none");
  $("#pharmEdit").css("display", "none");
  $("#pharmName").val(pharm.pharmName);
  $("#pharmStreet").val(pharm.pharmStreet);
  $("#pharmCity").val(pharm.pharmCity);
  $("#pharmProv").val(pharm.pharmProv);
  $("#pharmPC").val(pharm.pharmPC);
  $("#pharmPhone").val(pharm.pharmPhone);
  $("#pharmFax").val(pharm.pharmFax);
});

$("#cancelPharmEdit").click(function() {
  $("#pharmForm").css("display", "none");
  $("#pharmInfo").css("display", "block");
  $("#pharmClose").css("display", "inline-block");
  $("#pharmEdit").css("display", "inline-block");
});

// Sends pharmacy information to database, changes information in pharmacy modal
$("#pharmForm").submit(function(e) {
  e.preventDefault();
  $("#pharmForm").css("display", "none");
  $("#pharmInfo").css("display", "block");
  $("#pharmClose").css("display", "inline-block");
  $("#pharmInfo").html("<div></div>");
  pharmSubmit();
  retrievePharmacy();
});

// Sends pharmacy data to database
function pharmSubmit() {
  var pharmName = $("#pharmName").val();
  var pharmStreet = $("#pharmStreet").val();
  var pharmCity = $("#pharmCity").val();
  var pharmProv = $("#pharmProv").val();
  var pharmPC = $("#pharmPC").val();
  var pharmPhone = $("#pharmPhone").val();
  var pharmFax = $("#pharmFax").val();

  firebase.auth().onAuthStateChanged(function(user){
    firebase.database().ref("users/" + user.uid + "/pharmacy/").update( {
      "pharmName": pharmName,
      "pharmStreet": pharmStreet,
      "pharmCity": pharmCity,
      "pharmProv": pharmProv,
      "pharmPC": pharmPC,
      "pharmPhone": pharmPhone,
      "pharmFax": pharmFax
    });
  });
}

// Retrieves pharmacy data from database
var pharm = {};
function retrievePharmacy(){
  firebase.auth().onAuthStateChanged(function(){
    var userId = firebase.auth().currentUser.uid;
    var pharmRef = firebase.database().ref("/users/" + userId + "/pharmacy/");
    pharmRef.once("value").then(function (snap) {
        pharm = snap.val();
        if (pharm) {
          populatePharmacy();
        }
    });
  });
}

retrievePharmacy();

function populatePharmacy() {
  $("#pharmInfo").append("<h3>" + pharm.pharmName + "</h3><h6>Address</h6><p>" + pharm.pharmStreet + "<br/>" + pharm.pharmCity + "<br/>" + pharm.pharmProv + "<span></span>" + pharm.pharmPC + "</p><h6>Phone</h6><p>" + pharm.pharmPhone + "</p><h6>Fax</h6><p>" + pharm.pharmFax + "</p>");
  $("#pharmMessage").css("display", "none");
  $("#pharmEdit").css("display", "inline-block");
}

function greeting() {
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
 };

greeting();

setTimeout(isLate, 3000);