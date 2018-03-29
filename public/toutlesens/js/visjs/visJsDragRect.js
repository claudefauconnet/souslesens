const nodes = new vis.DataSet([
    { id: 1, label: 'Node 1' },
    { id: 2, label: 'Node 2' },
    { id: 3, label: 'Node 3' },
    { id: 4, label: 'Node 4' },
    { id: 5, label: 'Node 5' }
]);

const edges = new vis.DataSet([
    { from: 1, to: 3 },
    { from: 1, to: 2 },
    { from: 2, to: 4 },
    { from: 2, to: 5 }
]);

const options = {
    layout: { randomSeed: 2 },
    interaction:{
        hover: true,
        multiselect: true
    }
};

// Everything is in there
const makeMeMultiSelect = function(container, network, nodes)  {
    const NO_CLICK = 0;
    const RIGHT_CLICK = 3;

    // Disable default right-click dropdown menu
    container[0].oncontextmenu = function() {return false};

    // State

    var drag = false, DOMRect = {};

    // Selector

    const canvasify = function(DOMx, DOMy) {
        var obj = network.DOMtoCanvas({ x: DOMx, y: DOMy });
        return obj;
    };

    const correctRange = (start, end) =>
    start < end ? [start, end] : [end, start];

    const selectFromDOMRect = function() {
        const s = canvasify(DOMRect.startX, DOMRect.startY);
        const e = canvasify(DOMRect.endX, DOMRect.endY);
        const seX = correctRange(s.x, e.y);
        const seY= correctRange(s.x, e.y);

        network.selectNodes(nodes.get().reduce(
            (selected, { id }) => {
            const { x, y } = network.getPositions(id)[id];
        return (startX <= x && x <= endX && startY <= y && y <= endY) ?
            selected.concat(id) : selected;
    }, []
    ));
    }

    // Listeners

    container.on("mousedown", function({ which, pageX, pageY }) {
        // When mousedown, save the initial rectangle state
        if(which === RIGHT_CLICK) {
            Object.assign(DOMRect, {
                startX: pageX - this.offsetLeft,
                startY: pageY - this.offsetTop,
                endX: pageX - this.offsetLeft,
                endY: pageY - this.offsetTop
            });
            drag = true;
        }
    });

    container.on("mousemove", function({ which, pageX, pageY }) {
        // Make selection rectangle disappear when accidently mouseupped outside 'container'
        if(which === NO_CLICK && drag) {
            drag = false;
            network.redraw();
        }
        // When mousemove, update the rectangle state
        else if(drag) {
            Object.assign(DOMRect, {
                endX: pageX - this.offsetLeft,
                endY: pageY - this.offsetTop
            });
            network.redraw();
        }
    });

    container.on("mouseup", function({ which }) {
        // When mouseup, select the nodes in the rectangle
        if(which === RIGHT_CLICK) {
            drag = false;
            network.redraw();
            selectFromDOMRect();
        }
    });

    // Drawer

    network.on('afterDrawing', ctx => {
        if(drag) {
            const [startX, startY] = canvasify(DOMRect.startX, DOMRect.startY);
            const [endX, endY] = canvasify(DOMRect.endX, DOMRect.endY);

            ctx.setLineDash([5]);
            ctx.strokeStyle = 'rgba(78, 146, 237, 0.75)';
            ctx.strokeRect(startX, startY, endX - startX, endY - startY);
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(151, 194, 252, 0.45)';
            ctx.fillRect(startX, startY, endX - startX, endY - startY);
        }
    });
}; // end makeMeMultiSelect

$(document).ready(function() {
    const container = $("#network");
const network = new vis.Network(container[0], { nodes, edges }, options);
makeMeMultiSelect(container, network, nodes);
});

