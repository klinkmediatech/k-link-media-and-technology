function addService() {
  let service = document.getElementById("service").value;

  let div = document.createElement("div");
  div.className = "card";
  div.innerText = service;

  document.getElementById("serviceList").appendChild(div);
    }
