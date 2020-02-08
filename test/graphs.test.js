const { ResponsiveGraph } = require('../public/graphs');
test('toX, toY', () => {
    const graph = new ResponsiveGraph({
        xFrom: 10,
        xTo: 20,
        xAxisWidthPrecentage: 10,
        yFrom: 4000,
        yTo: 10000,
        yAxisHeight: 20,
        totalHeight: 400
    });
    expect(graph.getX(10)).toBe('10%');
    expect(graph.getX(15)).toBe('55%');
    expect(graph.getX(20)).toBe('100%');
    expect(graph.getY(4000)).toBe(400);
    expect(graph.getY(10000)).toBe(20);
    expect(graph.getY(7000)).toBe(210);
});
