// $(document).ready(function() {
  $("#addMed").click(function() {
    $("#modal").css("display", "block");
  });

  $("#cancel").click(function() {
    $("#modal").css("display", "none");
  });

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

  retrieveAllMeds();

  $("#ok").click(function() {
    var medName = $("#drugName").val();
    var genericOrBrand = $("input[name='genericOrBrand']:checked").val();
    var genericName = $("#genericName").val();
    var strength = $("#strength").val();
    var unit = $("#unit").val();
    var frequency = $("#frequency").val();
    var timeUnit = $("#timeUnit").val();
    var auxWarnings = $("#auxWarnings").val();
    var times = [];
    var amPm = [];

    function getTimes() {
      var time = $(".timepicker");
      for (var i = 0; i < time.length; i++) {
      times.push(time[i].value);
      }
    }

    getTimes();

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
    $("#modal").css("display", "none");
  });

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

  $("#logout").click(function() {
    firebase.auth().signOut().then(function() {
      window.location = "index.html";
    });
  });