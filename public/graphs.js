function getNode(n, v) {
    n = document.createElementNS('http://www.w3.org/2000/svg', n);
    for (var p in v) n.setAttributeNS(null, p, v[p]);
    return n;
}

function renderGraph() {
    let byDay = groupByDay(activities),
        barWidth = 15,
        margin = 3,
        timeAxisWidth = 10,
        headerHeight = 20,
        minHeight = 2,
        pixelsPerHour = 10,
        bars = 0;
    const timeToPixel = date =>
        headerHeight +
        date.getHours() * pixelsPerHour +
        (date.getMinutes() * pixelsPerHour) / 60;
    graph.innerHTML = '';

    const svg = getNode('svg', { width: '100%', height: '400' });
    const style = getNode('style');
    svg.appendChild(style);
    style.textContent =
        '.xsmall { color:black; font: italic 10px sans-serif; } .small { color:black; font: italic 13px sans-serif; }';
    for (const hour of [4, 8, 12, 16, 20, 24]) {
        const y = headerHeight + hour * pixelsPerHour;
        const clockText = getNode('text', {
            class: 'xsmall',
            x: 0,
            y: y + 4
        });
        clockText.textContent = ('00' + hour).slice(-2) + ':00';
        const line = getNode('line', {
            x1: 45,
            x2: '100%',
            y1: y,
            y2: y,
            stroke: 'lightgrey'
        });
        svg.appendChild(clockText);
        svg.appendChild(line);
    }

    for (const [date, activities] of Object.entries(byDay).slice(-5)) {
        var weekday = getNode('text', {
            class: 'small',
            x: `${timeAxisWidth + (margin + barWidth) * bars}%`,
            y: 10
        });
        weekday.textContent = dayOfWeek(activities[0].from);
        svg.appendChild(weekday);
        for (const activity of activities) {
            fromPixel = timeToPixel(activity.from);
            toPixel = timeToPixel(activity.to);
            var r = getNode('rect', {
                x: `${timeAxisWidth + bars * (barWidth + margin)}%`,
                y: fromPixel,
                width: barWidth + '%',
                height: Math.max(toPixel - fromPixel, minHeight),
                fill: activity.type === 'eat' ? '#d62972' : '#34aed4'
            });
            svg.appendChild(r);
        }
        const sleptTotal = getSleptTotal(activities);
        const ateTotal = activities.filter(x => x.type === 'eat').length;
        const sleptTotalText = getNode('text', {
            class: 'small',
            x: timeAxisWidth + bars * (barWidth + margin) + '%',
            y: 300
        });
        const ateTotalText = getNode('text', {
            class: 'small',
            x: timeAxisWidth + bars * (barWidth + margin) + '%',
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
