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
    const days = {};
    for (const activity of activities) {
        const date = startOfDay(activity.from).getTime();
        if (!days[date]) {
            days[date] = [];
        }
        days[date].push(activity);
    }
    return Object.entries(days).map(([k, v]) => ({
        day: parseInt(k),
        activities: v
    }));
}

const getSleptTotal = activities =>
    Math.round(
        activities
            .filter(x => x.type === 'sleep')
            .reduce((cur, next) => cur + getDuration(next), 0) * 100
    ) / 100;

const activitiesFromToday = activities =>
    activities
        .filter(x => sameDate(x.to, new Date()))
        .sort((a, b) => a.from - b.from);

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

const dateOfYear = date =>
    dateOfYear.toLocaleString('sv-SE', {
        day: 'numeric',
        month: 'numeric'
    });

const formatTime = date => date.toLocaleString('sv-SE').substr(10, 6);

const toLocalTimeString = date => {
    let dateString = new Date(
        date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
    dateString = dateString.substr(0, dateString.length - 8);
    return dateString;
};
