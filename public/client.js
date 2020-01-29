const eatForm = document.forms[0];
const eatInput = eatForm.elements["eat"];
const sleepForm = document.forms[1];
const sleepFromInput = sleepForm.elements["sleepFrom"];
const sleepToInput = sleepForm.elements["sleepTo"];
const eatList = document.querySelector("#eatList");
const sleepList = document.querySelector("#sleepList");

function toLocalTimeString(date) {
  let dateString = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  ).toISOString();
  dateString = dateString.substr(0, dateString.length - 8);
  return dateString;
}

let now = toLocalTimeString(new Date());

eatInput.value = now;
sleepToInput.value = now;
sleepFromInput.value = now;

fetch("/activities", {})
  .then(res => res.json())
  .then(response => {
    response.forEach(row => {
      appendNewActivity(row);
    });
  });

const appendNewActivity = activity => {
  const newListItem = document.createElement("li");
  const text = document.createElement("span");
  const deleteButton = document.createElement("button");
  deleteButton.innerText = "X";
  deleteButton.onclick = () => deleteActivity(activity);
  newListItem.appendChild(text);
  newListItem.appendChild(deleteButton);
  newListItem.id = "activity-" + activity.id;
  if (activity.type === "ate") {
    text.innerText = `${formatDate(activity.from)}`;
    eatList.appendChild(newListItem);
  } else {
    text.innerText = `Från ${formatDate(activity.from)} till ${formatDate(activity.to)}`;
    sleepList.appendChild(newListItem);
  }


};

const removeActivity = activity => {
  if (confirm("vill du ta bort den här raden?")) {
      const listItem = document.getElementById("activity-" + activity.id);
      listItem.parentNode.removeChild(listItem);
  }
};

eatForm.onsubmit = event => {
  event.preventDefault();

  const data = { type: "ate", from: eatInput.value, to: eatInput.value };
  sendActivity(data);

  eatInput.value = toLocalTimeString(new Date());
  eatInput.focus();
};

sleepForm.onsubmit = event => {
  event.preventDefault();

  const data = {
    type: "slept",
    from: sleepFromInput.value,
    to: sleepToInput.value
  };

  sendActivity(data);

  sleepFromInput.value = toLocalTimeString(new Date());
  sleepToInput.value = toLocalTimeString(new Date());
  sleepFromInput.focus();
};

function sendActivity(activity) {
  fetch("/activities", {
    method: "POST",
    body: JSON.stringify(activity),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
      activity.id = response.id;
      appendNewActivity(activity);
    });
}

function deleteActivity(activity) {
  fetch("/activities", {
    method: "DELETE",
    body: JSON.stringify(activity),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
      removeActivity(activity);
    });
}

function formatDate(date) {
  return date.substr(5).replace('T', ' kl. ')
}