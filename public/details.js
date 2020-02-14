let activities = [];
let noDaysOfHistory = 7;

const eatForm = document.forms[0];
const eatInput = eatForm.elements['eat'];
const sleepForm = document.forms[1];
const sleepFromInput = sleepForm.elements['sleepFrom'];
const sleepToInput = sleepForm.elements['sleepTo'];
const lookBackSelect = document.querySelector('#lookback');
const error = document.querySelector('#error');
const eatToday = document.querySelector('#eatToday');
const sleepToday = document.querySelector('#sleepToday');
const babyNames = document.querySelectorAll('.babyName');
const addToHomescreen = document.querySelector('#addToHomescreen');

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
    addToHomescreen.style.display = '';
    deferredPrompt = e;
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/serviceWorker.js').then(
            function(registration) {
                // Registration was successful
                console.log(
                    'ServiceWorker registration successful with scope: ',
                    registration.scope
                );
            },
            function(err) {
                // registration failed :(
                console.log('ServiceWorker registration failed: ', err);
            }
        );
    });
}

addToHomescreen.onclick = e => {
    deferredPrompt.promt();
    deferredPrompt.userChoice.then(result => {
        if (result.outcome === 'accepted') {
            addToHomescreen.style.display = 'none';
        }
    });
};

function initializeInputs() {
    let now = toLocalTimeString(new Date());
    eatInput.value = now;
    eatInput.setAttribute('max', new Date());

    sleepFromInput.value = now;
    sleepFromInput.setAttribute('max', toEndOfDay(new Date()));
    sleepFromInput.addEventListener('change', e => {
        if (sleepFromInput.value > sleepToInput.value) {
            sleepFromInput.setCustomValidity('Från måste vara innan till :)');
        } else {
            sleepFromInput.setCustomValidity('');
            sleepToInput.setCustomValidity('');
        }
    });

    sleepToInput.value = now;
    sleepToInput.setAttribute('max', toEndOfDay(new Date()));
    sleepToInput.addEventListener('change', e => {
        if (sleepFromInput.value > sleepToInput.value) {
            sleepToInput.setCustomValidity('Från måste vara innan till :)');
        } else {
            sleepFromInput.setCustomValidity('');
            sleepToInput.setCustomValidity('');
        }
    });
}

function renderActivities() {
    const activitiesByDay = groupByDay(activities).slice(-noDaysOfHistory);
    renderDaySchedulePlot('#daySchedule', activitiesByDay);
    renderSleptTotalPlot('#sleptTotal', activitiesByDay);
    renderAteTotalPlot('#ateTotal', activitiesByDay);
    renderSleptLongestPlot('#sleptLongest', activitiesByDay);

    renderTodayLists(activities);
}

function renderName(name) {
    babyNames.forEach(x => (x.innerText = name));
}

function renderTodayLists(activities) {
    sleepToday.innerHTML = '';
    eatToday.innerHTML = '';
    for (const activity of activitiesFromToday(activities)) {
        const newListItem = document.createElement('li');
        const text = document.createElement('span');
        const deleteButton = document.createElement('button');
        deleteButton.innerText = 'X';
        deleteButton.onclick = () => deleteActivity(activity);
        newListItem.appendChild(text);
        newListItem.appendChild(deleteButton);
        newListItem.id = 'activity-' + activity.id;
        if (activity.type === 'eat') {
            text.innerText = `kl. ${formatTime(activity.from)}`;
            eatToday.appendChild(newListItem);
        } else {
            text.innerText = `Från kl. ${formatTime(
                activity.from
            )} till kl. ${formatTime(activity.to)}`;
            sleepToday.appendChild(newListItem);
        }
    }
}

const removeActivity = activity => {
    const listItem = document.getElementById('activity-' + activity.id);
    listItem.parentNode.removeChild(listItem);
};

lookBackSelect.onchange = event => {
    noDaysOfHistory = parseInt(event.target.value);
    renderActivities();
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

initializeInputs();
fetchBaby();
fetchActivities();
