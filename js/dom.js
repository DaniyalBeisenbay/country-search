export function el(tag, className = '', text) {
    const node = document.createElement(tag);
    if (className)
        node.className = className;
    if (text !== undefined)
        node.textContent = text;
    return node;
}
export function button(className, text, onClick) {
    const node = el('button', className, text);
    node.type = 'button';
    node.addEventListener('click', onClick);
    return node;
}
export function link(text, href) {
    const node = el('a', '', text);
    node.href = href;
    node.target = '_blank';
    node.rel = 'noopener noreferrer';
    return node;
}
const namespace = 'http://www.w3.org/2000/svg';
function shape(tag, attributes) {
    const node = document.createElementNS(namespace, tag);
    for (const [key, value] of Object.entries(attributes))
        node.setAttribute(key, value);
    return node;
}
export function globe() {
    const svg = shape('svg', { viewBox: '0 0 300 300', class: 'globe', 'aria-hidden': 'true' });
    svg.append(shape('circle', {
        cx: '150',
        cy: '150',
        r: '125',
        fill: '#eaf0df',
        stroke: 'currentColor',
        'stroke-width': '1',
    }));
    for (const radius of ['95', '52']) {
        svg.append(shape('ellipse', {
            cx: '150',
            cy: '150',
            rx: radius,
            ry: '125',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '.7',
        }));
    }
    for (const y of [75, 112, 150, 188, 225]) {
        const radius = Math.sqrt(125 ** 2 - (y - 150) ** 2);
        svg.append(shape('ellipse', {
            cx: '150',
            cy: String(y),
            rx: String(radius),
            ry: '12',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '.7',
        }));
    }
    svg.append(shape('line', {
        x1: '150',
        y1: '25',
        x2: '150',
        y2: '275',
        stroke: 'currentColor',
        'stroke-width': '.7',
    }));
    svg.append(shape('circle', {
        cx: '206',
        cy: '108',
        r: '7',
        fill: '#b69a4b',
        stroke: '#f7f6f0',
        'stroke-width': '4',
    }));
    svg.append(shape('path', {
        d: 'M55 214 Q90 60 206 108',
        fill: 'none',
        stroke: '#b69a4b',
        'stroke-width': '1.5',
        'stroke-dasharray': '4 4',
    }));
    return svg;
}
export function searchIcon() {
    const svg = shape('svg', {
        viewBox: '0 0 24 24',
        class: 'search-icon',
        fill: 'none',
        stroke: 'currentColor',
        'stroke-width': '1.5',
        'aria-hidden': 'true',
    });
    svg.append(shape('circle', { cx: '10.5', cy: '10.5', r: '6.5' }));
    svg.append(shape('path', { d: 'm16 16 5 5' }));
    return svg;
}
//# sourceMappingURL=dom.js.map