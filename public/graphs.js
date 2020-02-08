function getNode(n, v) {
    n = document.createElementNS('http://www.w3.org/2000/svg', n);
    for (var p in v) n.setAttributeNS(null, p, v[p]);
    return n;
}

const textStyles = `.xsmall { color:black; font: italic 10px sans-serif; } 
        .small { color:black; font: italic 13px sans-serif; }`;

class ResponsiveGraph {
    constructor({
        xFrom,
        xTo,
        xStep,
        xGetLegend,
        xAxisWidthPrecentage,
        yFrom,
        yTo,
        yStep,
        yGetLegend,
        yAxisHeight,
        totalHeight,
        styles
    }) {
        if (this.xFrom >= this.xTo)
            throw new Error('xFrom cannot be smaller than xTo');
        if (this.yFrom >= this.yTo)
            throw new Error('yFrom cannot be smaller than yTo');
        this.xFrom = xFrom;
        this.xTo = xTo;
        this.xStep = xStep;
        this.xGetLegend = xGetLegend;
        this.xAxisWidthPrecentage = xAxisWidthPrecentage;
        this.yFrom = yFrom;
        this.yTo = yTo;
        this.yStep = yStep;
        this.yGetLegend = yGetLegend;
        this.styles = styles;
        this.yAxisHeight = yAxisHeight;
        this.totalHeight = totalHeight;
        this.bottomMargin = 10;
        this.graphElements = [];
    }

    getX(x) {
        return (
            this.xAxisWidthPrecentage +
            ((100 - this.xAxisWidthPrecentage) * (x - this.xFrom)) /
                (this.xTo - this.xFrom) +
            '%'
        );
    }
    getY(y) {
        const graphHeight = this.totalHeight - this.yAxisHeight;
        const positionOnGraph =
            graphHeight -
            (graphHeight * (y - this.yFrom)) / (this.yTo - this.yFrom);
        return this.yAxisHeight + positionOnGraph;
    }

    renderYAxis() {
        const container = getNode('g');
        for (var y = this.yFrom; y < this.yTo; y += this.yStep) {
            const legend = getNode('text', {
                class: 'xsmall',
                x: 0,
                y: this.getY(y) + 4
            });
            legend.textContent = this.yGetLegend(y);
            const line = getNode('line', {
                x1: this.xAxisWidthPrecentage + '%',
                x2: '100%',
                y1: this.getY(y),
                y2: this.getY(y),
                stroke: 'lightgrey'
            });
            container.appendChild(legend);
            container.appendChild(line);
        }
        return container;
    }

    renderXAxis() {
        const container = getNode('g');
        for (var x = this.xFrom; x <= this.xTo; x += this.xStep) {
            const legend = getNode('text', {
                class: 'xsmall',
                x: this.getX(x),
                y: this.yAxisHeight
            });
            legend.textContent = this.xGetLegend(x);
            container.appendChild(legend);
        }
        return container;
    }

    addBars(xs, ys, color) {
        const barWidth = 0.9 * ((100 - this.xAxisWidthPrecentage) / xs.length);
        const container = getNode('g');
        for (let i = 0; i < xs.length; i++) {
            const r = getNode('rect', {
                x: this.getX(xs[i]),
                y: this.getY(ys[i]),
                width: barWidth + '%',
                height: this.totalHeight,
                fill: color
            });
            container.appendChild(r);
        }
        this.graphElements.push(container);
    }

    render() {
        const svg = getNode('svg', {
            width: '100%',
            height: this.totalHeight + this.bottomMargin
        });
        const style = getNode('style');
        svg.appendChild(style);
        style.textContent = this.styles;
        svg.appendChild(this.renderYAxis());
        svg.appendChild(this.renderXAxis());
        for (const el of this.graphElements) {
            svg.appendChild(el);
        }

        return svg;
    }
}

function renderSleptTotalPlot(activities) {
    const byDay = groupByDay(activities);
    const days = Object.keys(byDay);
    const options = {
        xFrom: parseInt(days[0]),
        xTo: parseInt(days[days.length - 1]),
        xStep: 36e5 * 24,
        xGetLegend: x => dayOfWeek(new Date(x)),
        xAxisWidthPrecentage: 10,
        yFrom: 0,
        yTo: 24,
        yStep: 4,
        yGetLegend: y => y + ' h',
        yAxisHeight: 10,
        totalHeight: 260,
        styles: textStyles
    };
    var graph = new ResponsiveGraph(options);
    graph.addBars(days, Object.values(byDay).map(getSleptTotal), '#34aed4');
    return graph.render();
}

function renderAteTotalPlot(activities) {
    const byDay = groupByDay(activities);
    const days = Object.keys(byDay);
    const options = {
        xFrom: parseInt(days[0]),
        xTo: parseInt(days[days.length - 1]),
        xStep: 36e5 * 24,
        xGetLegend: x => dayOfWeek(new Date(x)),
        xAxisWidthPrecentage: 10,
        yFrom: 0,
        yTo: 20,
        yStep: 4,
        yGetLegend: y => y + ' ggr',
        yAxisHeight: 10,
        totalHeight: 260,
        styles: textStyles
    };
    var graph = new ResponsiveGraph(options);
    graph.addBars(
        days,
        Object.values(byDay).map(
            activities => activities.filter(x => x.type === 'eat').length
        ),
        '#d62972'
    );
    return graph.render();
}

function renderStackedBarsPlot(activities) {
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

    const svg = getNode('svg', {
        width: '100%',
        height: '400'
    });
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
    return svg;
}
