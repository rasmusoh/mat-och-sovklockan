// client-side js
// run by the browser each time your view template referencing it is :o");

const dreams = [];

// define variables that reference elements on our page
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

fetch("/eats", {})
  .then(res => res.json())
  .then(response => {
    response.forEach(row => {
      appendNewAte(row.time)
    });
  });
fetch("/sleeps", {})
  .then(res => res.json())
  .then(response => {
    response.forEach(row => {
      appendNewSlept(row.from, row.to)
    });
  });

const appendNewActivity = activity => {
  const newListItem = document.createElement("li");
  newListItem.innerText = activity;
  activityList.appendChild(newListItem);
};

const appendNewAte = time => appendNewActivity(`Hon åt ${time}`);
const appendNewSlept = (from,to) => appendNewActivity(`Hon sov från ${from} till ${to}`);


eatForm.onsubmit = event => {
  event.preventDefault();

  const data = { time: eatInput.value };

  fetch("/eats", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
    });
  appendNewAte(data.time);

  // reset form
  eatInput.value = toLocalTimeString(new Date());
  eatInput.focus();
};

sleepForm.onsubmit = event => {
  event.preventDefault();

  const data = { from: sleepFromInput.value, to: sleepToInput.value };

  fetch("/sleeps", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
    });
  appendNewSlept(data.from, data.to);

  // reset form
  sleepFromInput.value = toLocalTimeString(new Date());
  sleepToInput.value = toLocalTimeString(new Date());
  sleepFromInput.focus();
};

