const firebaseConfig = {
  apiKey: "AIzaSyD6gcLxMY3jBeEjUrt4JsGicNsR1jaqJFw",
  authDomain: "ebus-management-2f2e0.firebaseapp.com",
  projectId: "ebus-management-2f2e0",
  storageBucket: "ebus-management-2f2e0.firebasestorage.app",
  messagingSenderId: "294315373334",
  appId: "1:294315373334:web:431f2ca54a91e19c941637",
  measurementId: "G-7QJ27JBYP5"
};
firebase.initializeApp(firebaseConfig);

function adminLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => alert("Login successful"))
    .catch(err => alert(err.message));
}

function submitBusInfo() {
  const busNo = document.getElementById("busNo").value;
  const busType = document.getElementById("busType").value;
  const route = document.getElementById("route").value;
  const contact = document.getElementById("contact").value;

  firebase.database().ref("buses/" + busNo).set({
    busType,
    route,
    contact
  });
  alert("Bus Info Saved");
}

function userLogin() {
  const email = document.getElementById("userEmail").value;
  const password = document.getElementById("userPassword").value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => alert("User login successful"))
    .catch(err => alert(err.message));
}


function searchBus() {
  const source = document.getElementById("source").value;
  const destination = document.getElementById("destination").value;

  firebase.database().ref("buses").once("value", snapshot => {
    const buses = snapshot.val();
    for (let key in buses) {
      const bus = buses[key];
      if (bus.route.includes(source) && bus.route.includes(destination)) {
        alert(`Found: Bus ${key}, Type: ${bus.busType}, Contact: ${bus.contact}`);
        break;
      }
    }
  });
}
function registerUser() {
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Registration successful!");
      logAction(email, "User registered");
    })
    .catch(err => alert(err.message));
}

// Optional logging function
function logAction(user, action) {
  firebase.database().ref("logs").push({
    user,
    action,
    timestamp: Date.now()
  });
}
let locationInterval;

function startTracking() {
  const busNo = document.getElementById("trackBusNo").value;

  if (!busNo) {
    alert("Please enter the bus number.");
    return;
  }

  if (!navigator.geolocation) {
    alert("Geolocation is not supported by this browser.");
    return;
  }

  locationInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude, longitude } = position.coords;

      firebase.database().ref("locations/" + busNo).set({
        lat: latitude,
        lng: longitude,
        timestamp: Date.now()
      });

      logAction(busNo, `Updated location: (${latitude}, ${longitude})`);
    });
  }, 10000); // Update every 10 seconds

  alert("Tracking started. Keep this tab open to continue sending location.");
}
function stopTracking() {
  clearInterval(locationInterval);
  alert("Tracking stopped.");
}
function showBusLocation() {
  const busNo = document.getElementById("liveBusNo").value;

  firebase.database().ref("locations/" + busNo).on("value", snapshot => {
    const location = snapshot.val();

    if (location) {
      const latLng = { lat: location.lat, lng: location.lng };

      const map = new google.maps.Map(document.getElementById("map"), {
        center: latLng,
        zoom: 15
      });

      new google.maps.Marker({
        position: latLng,
        map,
        title: "Live Bus Location"
      });

    } else {
      alert("Location not found for bus: " + busNo);
    }
  });
}
function estimateArrival() {
  const busNo = document.getElementById("liveBusNo").value;
  const destination = document.getElementById("destinationPlace").value;

  if (!busNo || !destination) {
    alert("Please enter both Bus Number and Destination.");
    return;
  }

  firebase.database().ref("locations/" + busNo).once("value", snapshot => {
    const location = snapshot.val();
    if (!location) {
      alert("Bus location not found.");
      return;
    }

    const origin = `${location.lat},${location.lng}`;

    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [origin],
      destinations: [destination],
      travelMode: 'DRIVING',
      unitSystem: google.maps.UnitSystem.METRIC
    }, (response, status) => {
      if (status === 'OK') {
        const result = response.rows[0].elements[0];
        const duration = result.duration.text;
        const distance = result.distance.text;

        document.getElementById("etaResult").innerHTML =
          `<strong>Estimated Arrival:</strong> ${duration} (${distance})`;
      } else {
        console.error("Distance Matrix error:", status);
        alert("Could not estimate arrival time.");
      }
    });
  });
}
// In showBusLocation(), store the map and marker in global scope
let map, marker;

function showBusLocation() {
  const busNo = document.getElementById("liveBusNo").value;

  firebase.database().ref("locations/" + busNo).on("value", snapshot => {
    const location = snapshot.val();
    if (location) {
      const latLng = { lat: location.lat, lng: location.lng };

      if (!map) {
        map = new google.maps.Map(document.getElementById("map"), {
          center: latLng,
          zoom: 15
        });
        marker = new google.maps.Marker({
          position: latLng,
          map,
          title: "Live Bus Location"
        });
      } else {
        marker.setPosition(latLng);
        map.setCenter(latLng);
      }
    } else {
      alert("Location not found for bus: " + busNo);
    }
  });
}
