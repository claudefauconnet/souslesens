/**
 * Created by claud on 23/01/2017.
 */

var currentMouseOverCoords;
var dragListener;

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


}

function commonDnD(){
    dragListener = d3.behavior.drag().on("dragstart", function (d) {
     var xxx=d3.select(this);
        var e = d3.event;

        if (e.ctrlKey) {
            // eventFactory.showNodeInfo(d);
            return;
        }


    }).on("drag", function (d) {
        var xxx=d3.select(this);


    }).on("dragend", function (d) {
        var xxx=d3.select(this);
        return;

    });

}


function showThumbnails(nodes){

    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i][0][0];
        var nodeData = node.__data__;
        var position = {x: nodeData.x, y: nodeData.y};
        if (nodeData.neoAttrs && nodeData.neoAttrs.path) {
            var xxx = d3.select(node);
            d3.select(node).append("svg:image")
                .on("mouseover", function (d) {

                    d3.select(this).attr("width", 200).style('opacity', CodeFlower.imgOpacityStrong)
                        .attr("x", function (d) {
                            return 0;
                        })
                        .attr("y", function (d) {
                            return 0;
                        });
                    d3.select(this).moveToFront();
                })
                .on("mouseout", function (d) {
                    d3.select(this).attr("width", 60).style('opacity', CodeFlower.imgOpacityWeak)
                        .attr("x", function (d) {
                            return 0
                        })
                        .attr("y", function (d) {
                            return 0
                        });
                    d3.select(this).moveToBack();
                })
                .attr("xlink:href", function (d) {
                    //   console.log(d.neoAttrs.path);

                    //return "http://127.0.0.1:3002/JAVATHEQUE"+encodeURIComponent(d.neoAttrs.path);
                    var str = nodeData.neoAttrs.path.replace("--", "/");
                    return encodeURI(Gparams.imagesRootPath + str);
                    //   return encodeURI(d.neoAttrs.path);

                })
                .attr("x", function (d) {
                    return -30
                })
                .attr("y", function (d) {
                    return -25
                }).on("click", function (d) {
                d3.select(this).attr("transform", function (d) {
                    return "rotate(-90)";
                })

            })
                .style('opacity', CodeFlower.imgOpacityStrong)
                .attr("class", "d3NodeImage")
                .attr("width", "60")
        }
    }
}
function highlightNode(id ) {
    var www=  d3.selectAll("#P_" + id);
    d3.selectAll("#P_" + id).each(function (d) {

        d3.select(this).select("circle").style("stroke-width","3px").style("stroke","red")

        //console.log(JSON.stringify(d))
        /*if (d.__data__.id == id) {
            var xx = "a"
        }*/
    })
}


function splitTextInLines(g,text, box, fontSize) {
    var charsByLine = box.w / fontSize;
    var array = [];
    var index = 0;
    var str=""
    while (index  < text.length) {
        str+=text[index];
        index++;
        if (index >= charsByLine || index>= text.length) {
            array.push("" + str);
            str="";
            index=0;
        }
    }
    console.log(JSON.stringify(array));


}





