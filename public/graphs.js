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
        const ys = [];
        if (this.yFrom < this.yTo) {
            for (var y = this.yFrom; y < this.yTo; y += this.yStep) {
                ys.push(y);
            }
        } else {
            for (var y = this.yFrom; y > this.yTo; y -= this.yStep) {
                ys.push(y);
            }
        }
        for (const y of ys) {
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
                y: this.yAxisHeight / 2
            });
            legend.textContent = this.xGetLegend(x);
            container.appendChild(legend);
        }
        return container;
    }

    addStackedBars(xs, yFroms, yTos, color) {
        const barWidth = 0.9 * ((100 - this.xAxisWidthPrecentage) / xs.length);
        const container = getNode('g');
        for (let i = 0; i < xs.length; i++) {
            for (let j = 0; j < yFroms[i].length; j++) {
                const r = getNode('rect', {
                    x: this.getX(xs[i]),
                    y: this.getY(yFroms[i][j]),
                    width: barWidth + '%',
                    height: this.getY(yTos[i][j]) - this.getY(yFroms[i][j]),
                    fill: color
                });
                container.appendChild(r);
            }
        }
        this.graphElements.push(container);
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
        yAxisHeight: 30,
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
    const byDay = groupByDay(activities);
    const days = Object.keys(byDay).map(x => parseInt(x));
    const options = {
        xFrom: days[0],
        xTo: days[days.length - 1],
        xStep: 36e5 * 24,
        xGetLegend: x => dayOfWeek(new Date(x)),
        xAxisWidthPrecentage: 10,
        yFrom: 24,
        yTo: 0,
        yStep: 4,
        yGetLegend: y => ('00' + y).slice(-2) + ':00',
        yAxisHeight: 30,
        totalHeight: 260,
        styles: textStyles
    };
    var graph = new ResponsiveGraph(options);
    graph.addStackedBars(
        days,
        Object.values(byDay).map(day =>
            day
                .filter(x => x.type === 'sleep')
                .map(x => x.from.getHours() + x.from.getMinutes() / 60)
        ),
        Object.values(byDay).map(day =>
            day
                .filter(x => x.type === 'sleep')
                .map(x => x.to.getHours() + x.to.getMinutes() / 60)
        ),
        '#34aed4'
    );
    graph.addStackedBars(
        days,
        Object.values(byDay).map(day =>
            day
                .filter(x => x.type === 'eat')
                .map(x => x.from.getHours() + x.from.getMinutes() / 60)
        ),
        Object.values(byDay).map(day =>
            day
                .filter(x => x.type === 'eat')
                .map(x => x.to.getHours() + (x.to.getMinutes() + 20) / 60)
        ),
        '#d62972'
    );
    return graph.render();
}
