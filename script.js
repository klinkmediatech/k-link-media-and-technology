const firebaseConfig = {
  apiKey: "AIzaSyCzFUy1GlE3bl69co_7vG9iVTjOJZbkeNs",
  authDomain: "k-link-media.firebaseapp.com",
  projectId: "k-link-media",
  storageBucket: "k-link-media.firebasestorage.app",
  messagingSenderId: "911623086211",
  appId: "1:911623086211:web:f67ab63e5d0bb0f55efbb6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function showMessage() {
  document.getElementById("msg").innerText =
    "✔ K-Link Media & Technology is active!";
}

// Load saved services
let services = JSON.parse(localStorage.getItem("services")) || [
  "Web Design",
  "IT Support",
  "Media Production"
];

let isAdmin = false;

function renderServices() {
  let container = document.getElementById("serviceList");
  container.innerHTML = "";

  services.forEach((item) => {
    let div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      ${item.name}
      <br><br>
      ${isAdmin ? `<button onclick="deleteService('${item.id}')">Delete</button>` : ""}
    `;

    container.appendChild(div);
  });
}

function addService() {
  let input = document.getElementById("serviceInput");
  if (input.value.trim() !== "") {
    services.push(input.value);
    input.value = "";
    renderServices();
  }
}

function deleteService(index) {
  services.splice(index, 1);
  renderServices();
}

function showAdmin() {
  let pass = prompt("Enter admin password:");

  if (pass === "1234") {
    isAdmin = true;
    document.getElementById("adminPanel").style.display = "block";
    renderServices(); // refresh to show delete buttons
  } else {
    alert("Wrong password");
  }
}

// first load
renderServices();
