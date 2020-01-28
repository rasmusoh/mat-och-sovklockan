// client-side js
// run by the browser each time your view template referencing it is :o");

const dreams = [];

// define variables that reference elements on our page
const eatForm = document.forms[0];
const eatInput = eatForm.elements["ate"];
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
      appendNewActivity(row.dream);
    });
  });

const appendNewActivity = activity => {
  const newListItem = document.createElement("li");
  newListItem.innerText = activity;
  activityList.appendChild(newListItem);
};

eatForm.onsubmit = event => {
  event.preventDefault();

  const data = { time: eatInput.valueAsDate };

  fetch("/eats", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" }
  })
    .then(res => res.json())
    .then(response => {
      console.log(JSON.stringify(response));
    });
  // get dream value and add it to the list
  dreams.push(dreamInput.value);
  appendNewDream(dreamInput.value);

  // reset form
  dreamInput.value = "";
  dreamInput.focus();
};

