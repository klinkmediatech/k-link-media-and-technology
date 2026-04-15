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

function renderServices() {
  let container = document.getElementById("serviceList");
  container.innerHTML = "";

  services.forEach((service, index) => {
    let div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      ${service}
      <br><br>
      <button onclick="deleteService(${index})">Delete</button>
    `;

    container.appendChild(div);
  });

  localStorage.setItem("services", JSON.stringify(services));
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

// first load
renderServices();
