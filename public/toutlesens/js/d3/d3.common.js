/**
 * Created by claud on 23/01/2017.
 */

var currentMouseOverCoords;


function d3CommonClick(d) {
    if (d.nodeType && d.nodeType == "label")
        return;
    var id = d.id;
    currentObject = d;
    if (Gparams.readOnly == true) {
        dispatchAction('nodeInfos');


    }

    else {
        var e = d3.event;
        var x = e.offsetX + 10;
        var y = e.offsetY + 100;
        ;
        if (e.offsetX < 50) {// IE
            var xy0 = $("#graphDiv").offset();
            var x = e.clientX - xy0.left + 10;
            var y = e.clientY - xy0.top + 100;

        }

        showPopupMenu(x, y);
    }

}

function d3CommonDblclick(d) {
    currentObject = d;
    dispatchAction('setAsRootNode');

}


function d3CommonMouseover(d) {


    if(d.neoAttrs && d.neoAttrs.path) {
        return;
    }
    var e = d3.event;
    var x = e.offsetX + 30 //+ 10;
    var y = e.offsetY// + 100;
    if (e.offsetX < 50) {// IE
        var xy0 = $("#graphDiv").offset();
        var x = e.clientX - xy0.left + 50// +0;
        var y = e.clientY - xy0.top// + 100;

    }
    currentObject = d;
    currentMouseOverCoords = {x: x, y: y}
    showPopupMenu(x, y, "nodeInfo");
    return;


};

function d3CommonMouseout(d) {
    if(d.neoAttrs && d.neoAttrs.path) {
        return;
    }
    var popupSize = {
        w: $("#popupMenuNodeInfoDiv").width(),
        h: $("#popupMenuNodeInfoDiv").height(),

    }
    var e = d3.event;
    var x = e.offsetX+ 20;
    var y = e.offsetY;
    if (e.offsetX < 50) {// IE
        var xy0 = $("#graphDiv").offset();
        var x = e.clientX - xy0.left + 40;
        var y = e.clientY - xy0.top;

    }
   if (x < currentMouseOverCoords.x -10)
        $("#popupMenuNodeInfoDiv").css('display', 'none');
    if (y < currentMouseOverCoords.y  -10 )
        $("#popupMenuNodeInfoDiv").css('display', 'none');


    //  $("#popupMenuNodeInfoDiv").style('display', 'none');


};