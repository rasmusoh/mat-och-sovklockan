let activities = [];

const eatForm = document.forms[0];
const eatInput = eatForm.elements['eat'];
const sleepForm = document.forms[1];
const sleepFromInput = sleepForm.elements['sleepFrom'];
const sleepToInput = sleepForm.elements['sleepTo'];
const error = document.querySelector('#error');
const eatHistory = document.querySelector('#eatHistory');
const sleepHistory = document.querySelector('#sleepHistory');
const eatToday = document.querySelector('#eatToday');
const sleepToday = document.querySelector('#sleepToday');
const babyNames = document.querySelectorAll('.babyName');

function groupByDay(activities) {
    if (activities.length === 0) return [];
    activities = activities
        .map(x =>
            x.from.getDate() !== x.to.getDate()
                ? [
                      { type: x.type, from: x.from, to: toEndOfDay(x.from) },
                      { type: x.type, from: startOfDay(x.to), to: x.to }
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

function renderActivities() {
    renderTodayLists();
    renderHistory();
}

function renderName(name) {
    babyNames.forEach(x => (x.innerText = name));
}

function renderTodayLists() {
    sleepToday.innerHTML = '';
    eatToday.innerHTML = '';
    var today = new Date();
    var activitiesFromToday = activities
        .filter(x => sameDate(x.to, today))
        .sort((a, b) => a.from - b.from);
    for (const activity of activitiesFromToday) {
        const newListItem = document.createElement('li');
        const text = document.createElement('span');
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'X';
        deleteButton.onclick = () => deleteActivity(activity);
        newListItem.appendChild(text);
        newListItem.appendChild(deleteButton);
        newListItem.id = 'activity-' + activity.id;
        if (activity.type === 'eat') {
            text.innerText = `${formatTime(activity.from)}`;
            eatToday.appendChild(newListItem);
        } else {
            text.innerText = `Från ${formatTime(
                activity.from
            )} till ${formatTime(activity.to)}`;
            sleepToday.appendChild(newListItem);
        }
    }
}

function renderHistory() {
    sleepHistory.innerHTML = '';
    eatHistory.innerHTML = '';
    var byDay = groupByDay(activities);
    byDay.pop();
    for (const day of byDay) {
        const newListItem = document.createElement('li');
        const sleptTotal = day
            .filter(x => x.type === 'sleep')
            .reduce((cur, next) => cur + getDuration(next), 0);
        newListItem.innerText =
            formatDate(day[0].from) +
            ' sov hon ' +
            Math.round(sleptTotal * 10) / 10 +
            ' timmar.';
        sleepHistory.appendChild(newListItem);
    }
    for (const day of byDay) {
        const newListItem = document.createElement('li');
        const sleptTotal = day.filter(x => x.type === 'eat').length;
        newListItem.innerText =
            formatDate(day[0].from) +
            ' åt hon ' +
            Math.round(sleptTotal * 10) / 10 +
            ' gånger.';
        eatHistory.appendChild(newListItem);
    }
}

const removeActivity = activity => {
    const listItem = document.getElementById('activity-' + activity.id);
    listItem.parentNode.removeChild(listItem);
};

eatForm.onsubmit = event => {
    event.preventDefault();

    const data = {
        type: 'eat',
        from: new Date(eatInput.value),
        to: new Date(eatInput.value)
    };
    sendActivity(data);

    eatInput.value = toLocalTimeString(new Date());
    eatInput.focus();
};

sleepForm.onsubmit = event => {
    event.preventDefault();

    const data = {
        type: 'sleep',
        from: new Date(sleepFromInput.value),
        to: new Date(sleepToInput.value)
    };

    sendActivity(data);
};

async function fetchBaby() {
    error.style.display = 'none';
    const result = await fetch(window.location + '/baby', {});
    if (result.ok) {
        const body = await result.json();
        renderName(body.name);
    } else {
        error.style.display = '';
    }
}

async function fetchActivities() {
    error.style.display = 'none';
    const result = await fetch(window.location + '/activities', {});
    if (result.ok) {
        const body = await result.json();
        activities = body.map(row => ({
            id: row.id,
            type: row.type,
            from: new Date(row.from),
            to: new Date(row.to)
        }));
        renderActivities();
    } else {
        error.style.display = '';
    }
}

async function sendActivity(activity) {
    error.style.display = 'none';
    const response = await fetch(window.location + '/activities', {
        method: 'POST',
        body: JSON.stringify(activity),
        headers: { 'Content-Type': 'application/json' }
    });
    if (response.ok) {
        const body = await response.json();
        console.log(JSON.stringify(body));
        activity.id = body.id;
        activities.push(activity);
        renderActivities();

        sleepFromInput.value = toLocalTimeString(new Date());
        sleepToInput.value = toLocalTimeString(new Date());
        sleepFromInput.focus();
    } else {
        error.style.display = '';
    }
}

async function deleteActivity(activity) {
    if (confirm('vill du ta bort den här raden?')) {
        error.style.display = 'none';
        const response = await fetch(window.location + '/activities', {
            method: 'DELETE',
            body: JSON.stringify(activity),
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            activities.splice(activities.indexOf(activity), 1);
            renderActivities();
        } else {
            error.style.display = '';
        }
    }
}

function sameDate(date1, date2) {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

function startOfDay(date) {
    return new Date(`${date.toISOString().substr(0, 10)}T00:00:00`);
}

function toEndOfDay(date) {
    return new Date(`${date.toISOString().substr(0, 10)}T23:59:59`);
}

function getDuration(activity) {
    return (activity.to - activity.from) / 36e5;
}

function formatDate(date) {
    return date.toLocaleDateString('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
}

function formatTime(date) {
    return 'kl. ' + date.toLocaleString('sv-SE').substr(10, 6);
}

fetchBaby();
fetchActivities();
