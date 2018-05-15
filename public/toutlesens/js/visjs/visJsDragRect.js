

// create a network
var container = null;

var canvas;
var ctx;
var rect = {}, drag = false;
var drawingSurfaceImageData;

function saveDrawingSurface() {
    if(!ctx){
        document.body.oncontextmenu = function() {return false;};
      //  network = new vis.Network(container[0], data, options);
     canvas = visjsGraph.network.canvas.frame.canvas;
     //   canvas = $("#graphDiv").find("canvas")[0],
            ctx = canvas.getContext("2d");
      //  ctx = canvas.getContext('2d');
    /*    ctx =visjsGraph.context
        canvas = visjsGraph.context.canvas*/
    }
    return;
    console.log(canvas.width)
    var image = new Image();
    image.crossOrigin = 'anonymous';
  drawingSurfaceImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    drawingSurfaceImageData.crossOrigin = "Anonymous";
}

function restoreDrawingSurface() {
   // ctx.putImageData(drawingSurfaceImageData, 0, 0);
}

function selectNodesFromHighlight() {
    var fromX, toX, fromY, toY;
    var nodesIdInDrawing = [];
    var xRange = getStartToEnd(rect.startX, rect.w);
    var yRange = getStartToEnd(rect.startY, rect.h);

   // var allNodes = nodes.get();
    var allNodes = visjsGraph.nodes.get();
    for (var i = 0; i < allNodes.length; i++) {
        var curNode = allNodes[i];
        var nodePosition = visjsGraph.network.getPositions([curNode.id]);
        var nodeXY = visjsGraph.network.canvasToDOM({x: nodePosition[curNode.id].x, y: nodePosition[curNode.id].y});
        if (xRange.start <= nodeXY.x && nodeXY.x <= xRange.end && yRange.start <= nodeXY.y && nodeXY.y <= yRange.end) {
            nodesIdInDrawing.push(curNode.id);
        }
    }
    visjsGraph.network.selectNodes(nodesIdInDrawing);
    var position={x: rect.startX+( rect.w/2),y: rect.startY+( rect.h/2)}
   onRectSelection(nodesIdInDrawing,position);
}

function onRectSelection(nodeIds, position){
    for(var i=0;i<nodeIds.length;i++){
        nodeIds[i]=parseInt(nodeIds[i]);
    }
    toutlesensData.setSearchByPropertyListStatement("_id",nodeIds,function(){
        toutlesensController.generateGraph(null);
        ctx=null;
    })

}

function getStartToEnd(start, theLen) {
    return theLen > 0 ? {start: start, end: start + theLen} : {start: start + theLen, end: start};
}

//$(document).ready(function() {
onVisjsGraphReady=function(){
    container=$("#graphDiv");
    container.on("mousemove", function(e) {
        if (drag) {
            restoreDrawingSurface();
            rect.w = (e.pageX - this.offsetLeft) - rect.startX;
            rect.h = (e.pageY - this.offsetTop) - rect.startY ;

            ctx.setLineDash([5]);
            ctx.strokeStyle = "rgb(0, 102, 0)";
            ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
            ctx.setLineDash([]);
            ctx.fillStyle = "rgba(0, 255, 0, 0.2)";
            ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
        }
    });

    container.on("mousedown", function(e) {
        if (e.button == 2) {
            selectedNodes = e.ctrlKey ? network.getSelectedNodes() : null;
          //  saveDrawingSurface();
            var that = this;
            rect.startX = e.pageX - this.offsetLeft;
            rect.startY = e.pageY - this.offsetTop;
            drag = true;
            container[0].style.cursor = "crosshair";
        }
    });

    container.on("mouseup", function(e) {
        if (e.button == 2) {
           // restoreDrawingSurface();
            drag = false;

            container[0].style.cursor = "default";
            selectNodesFromHighlight();
        }
    });

    document.body.oncontextmenu = function() {return false;};
  //  network = new vis.Network(container[0], data, options);
    canvas = visjsGraph.network.canvas.frame.canvas;
    ctx = canvas.getContext('2d');

};