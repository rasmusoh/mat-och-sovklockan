
const eatForm = document.forms[0];
const eatInput = eatForm.elements["eat"];
const sleepForm = document.forms[1];
const sleepFromInput = sleepForm.elements["sleepFrom"];
const sleepToInput = sleepForm.elements["sleepTo"];
const activityList = document.querySelector('#activity');

function toLocalTimeString(date) {
  let dateString = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString();
  dateString = dateString.substr(0,dateString.length-8);
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
      appendNewActivity(row)
    });
  });

const appendNewActivity = activity => {
  
  const newListItem = document.createElement("li");
  if (activity.type === 'ate') {
      newListItem.innerText= `Hon åt ${activity.from}`;
  } else {
   newListItem.innerText= `Hon sov från ${activity.from} till ${activity.to}`;
  }
  activityList.appendChild(newListItem);
};

eatForm.onsubmit = event => {
  event.preventDefault();

  const data = { type:'ate',from: eatInput.value, to: eatInput.value };
  sendActivity(data);

  eatInput.value = toLocalTimeString(new Date());
  eatInput.focus();
};

sleepForm.onsubmit = event => {
  event.preventDefault();

  const data = {type:'slept', from: sleepFromInput.value, to: sleepToInput.value };

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
    });
  appendNewActivity(activity);
}