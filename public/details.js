let activities = [];

const eatForm = document.forms[0];
const eatInput = eatForm.elements['eat'];
const sleepForm = document.forms[1];
const sleepFromInput = sleepForm.elements['sleepFrom'];
const sleepToInput = sleepForm.elements['sleepTo'];
const error = document.querySelector('#error');
const eatToday = document.querySelector('#eatToday');
const sleepToday = document.querySelector('#sleepToday');
const babyNames = document.querySelectorAll('.babyName');
const graph = document.querySelector('#graph');

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
    days = {};
    for (const activity of activities) {
        date = datePart(activity.from);
        if (!days[date]) {
            days[date] = [];
        }
        days[date].push(activity);
    }
    return days;
}

const getSleptTotal = activities =>
    Math.round(
        activities
            .filter(x => x.type === 'sleep')
            .reduce((cur, next) => cur + getDuration(next), 0) * 100
    ) / 100;

function initializeInputs() {
    let now = toLocalTimeString(new Date());
    eatInput.value = now;
    sleepToInput.value = now;
    sleepFromInput.value = now;
}

function renderActivities() {
    renderGraph();
    renderTodayLists();
}

function renderName(name) {
    babyNames.forEach(x => (x.innerText = name));
}

function getNode(n, v) {
    n = document.createElementNS('http://www.w3.org/2000/svg', n);
    for (var p in v) n.setAttributeNS(null, p, v[p]);
    return n;
}

function renderGraph() {
    let byDay = groupByDay(activities),
        barWidth = 17,
        margin = 3,
        headerHeight = 20,
        minHeight = 2,
        bars = 0;
    const timeToPixel = date =>
        headerHeight + date.getHours() * 10 + date.getMinutes() / 6;
    graph.innerHTML = '';

    const svg = getNode('svg', { width: '100%', height: '400' });
    const style = getNode('style');
    svg.appendChild(style);
    style.textContent =
        '.small { color:black; font: italic 13px sans-serif; } .medium { color:black; font: 16px sans-serif; }';

    for (const [date, activities] of Object.entries(byDay).slice(-5)) {
        var weekday = getNode('text', {
            class: 'small',
            x: `${(margin + barWidth) * bars}%`,
            y: 10
        });
        weekday.textContent = dayOfWeek(activities[0].from);
        svg.appendChild(weekday);
        for (const activity of activities) {
            fromPixel = timeToPixel(activity.from);
            toPixel = timeToPixel(activity.to);
            var r = getNode('rect', {
                x: `${bars * (barWidth + margin)}%`,
                y: fromPixel,
                width: barWidth + '%',
                height: Math.max(toPixel - fromPixel, minHeight),
                fill: activity.type === 'sleep' ? 'cyan' : 'pink'
            });
            svg.appendChild(r);
        }
        const sleptTotal = getSleptTotal(activities);
        const ateTotal = activities.filter(x => x.type === 'eat').length;
        const sleptTotalText = getNode('text', {
            class: 'small',
            x: bars * (barWidth + margin) + margin + '%',
            y: 300
        });
        const ateTotalText = getNode('text', {
            class: 'small',
            x: bars * (barWidth + margin) + margin + '%',
            y: 320
        });
        sleptTotalText.textContent = sleptTotal + ' h';
        ateTotalText.textContent = ateTotal + ' ggr';
        svg.appendChild(sleptTotalText);
        svg.appendChild(ateTotalText);
        bars++;
    }
    graph.appendChild(svg);
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

const sameDate = (date1, date2) =>
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
const datePart = date =>
    date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    });
const startOfDay = date => new Date(`${datePart(date)}T00:00:00`);
const toEndOfDay = date => new Date(`${datePart(date)}T23:59:59`);
const getDuration = activity => (activity.to - activity.from) / 36e5;
const formatDate = date =>
    date.toLocaleDateString('sv-SE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });
const dayOfWeek = date =>
    date.toLocaleDateString('sv-SE', {
        weekday: 'short'
    });
const formatTime = date => 'kl. ' + date.toLocaleString('sv-SE').substr(10, 6);
const toLocalTimeString = date => {
    let dateString = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
    dateString = dateString.substr(0, dateString.length - 8);
    return dateString;
};

initializeInputs();
fetchBaby();
fetchActivities();
