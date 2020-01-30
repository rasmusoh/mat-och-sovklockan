let activities = [];

const eatForm = document.forms[0];
const eatInput = eatForm.elements["eat"];
const sleepForm = document.forms[1];
const sleepFromInput = sleepForm.elements["sleepFrom"];
const sleepToInput = sleepForm.elements["sleepTo"];
const eatHistory = document.querySelector("#eatHistory");
const sleepLHistory = document.querySelector("#sleepHistory");
const eatToday = document.querySelector("#eatToday");
const sleepToday = document.querySelector("#sleepToday");
const statisticsPerDay = document.querySelector('#statisticsPerDay');

function groupByDay(activities) {
  if (activities.length === 0) return [];
  activities = activities
    .map(x => x.from.getDate() !== x.to.getDate()
         ? [{type:x.type, from:x.from, to:toEndOfDay(x.from)},
            {type:x.type, from:startOfDay(x.to), to:x.to}
           ]
         : x
        )
    .flat()
    .sort((a, b) => a.from - b.from);
  let day = [activities[0]],
    days = [day],
    date = activities[0].from.getDate();
  for (var i = 1; i < activities.length; i++) {
    var next = activities[i];
    var last = activities[i - 1];
    if (next.to.getDate() > date) {
      date = next.to.getDate();
      day = [];
      days.push(day);
    }
    day.push(next);
  }
  return days;
}

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
    activities = response.map(row => ({
      id: row.id,
      type: row.type,
      from: new Date(row.from),
      to: new Date(row.to)
    }));
    renderActivities();
  });

function renderActivities() {
  renderTodayLists();
  renderStatistics();
}

function renderTodayLists() {
  sleepList.innerHTML = "";
  eatList.innerHTML = "";
  for (const activity of activities) {
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
      text.innerText = `Från ${formatDate(activity.from)} till ${formatDate(
        activity.to
      )}`;
      sleepList.appendChild(newListItem);
    }
  }
}

function renderStatistics() {
    statisticsPerDay.innerHTML = "";
    var byDay = groupByDay(activities);
  for (const day of byDay) {
        const newListItem = document.createElement("li");
        const sleptTotal = day.filter(x => x.type === 'slept').reduce((cur,next) => cur+getDuration(next),0)
        newListItem.innerText = formatDate(day[0].from).substr(0,5) +' sov hon '+Math.round(sleptTotal*10)/10+' timmar.';
        statisticsPerDay.appendChild(newListItem);
  }
}

const removeActivity = activity => {
  const listItem = document.getElementById("activity-" + activity.id);
  listItem.parentNode.removeChild(listItem);
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
      activities.push(activity);
      renderActivities();
    });
}

function deleteActivity(activity) {
  if (confirm("vill du ta bort den här raden?")) {
    fetch("/activities", {
      method: "DELETE",
      body: JSON.stringify(activity),
      headers: { "Content-Type": "application/json" }
    })
      .then(res => res.json())
      .then(response => {
        console.log(JSON.stringify(response));
        activities.splice(activities.indexOf(activity));
        renderActivities();
      });
  }
}

function startOfDay(date) {
  return new Date(`${date.toISOString().substr(0,10)}T00:00:00`);
}


function toEndOfDay(date) {
  return new Date(`${date.toISOString().substr(0,10)}T23:59:59`);
}

function getDuration(activity) {
   return (activity.to - activity.from) / 36e5;
}

function formatDate(date) {
  return date.toLocaleString('sv-SE').substr(5).replace(" ", " kl. ");
}
