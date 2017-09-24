/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

var d3modifiableGraph = (function(){
 var self = {};
//moved  var r = 6;
//moved  var w = 300;
//moved  var h = 25;
//moved  var point;

//moved  var fontSize = "12px";
//moved  var tiangleUpPath = "M0,6L-6,6L0,-6L6,6L0,6";
//moved  var tiangleDownPath = "M0,-6L-6,-6L0,6L6,-6L0,-6";
//moved  var rectPath = "M-6,-6L-6,6L6,6L6,-6L-6,-6";

//moved  var minOpacity=.2;


/*moved  var palette0 = [ '#0056B3', '#007DFF', '#A84F02', '#A8A302', '#B354B3',
    '#B35905', '#B37A00', '#B39BAB', '#B3B005', '#F5ED02', '#F67502',
    '#FF78FF', '#FF7D07', '#FFD900', '#FFDEF4', '#FFFB08', ]*/

//moved  var labelMaxSize = 20;

//moved  //moved  var x0, y0 = 0;
//moved  var svgGraph = null;
//moved  var svgGraphLegend = null;
//moved  var isDragging = false;

//moved  var hoverRect;
//moved  var hoverText;
//moved  var currentRadarNode = null;
//moved  var yLegendOffset = 0;
//moved  var hoverRect;
//moved  var hoverText;
//moved  var isResizing = false;
//moved  var resizeSquare = 20;
//moved  var minTextBoxSize=20;
//moved  var selection=[];

//moved  var  links ;

//moved  var dragDx;
//moved  var dragDy;
//moved  //moved  var oldX,oldY;

//moved  var displayType="textBox";


//moved  var isReadOnly=false;


   self.drawModifiableGraph=function(json){
    var resultArray=cachedResultArray;
    var dataLabels=[];
    var labelsMap={};

    var dataRels=[];
    var y=100;
    var x=100;
    var id=0;
    var i=0;


    for (var i = 0; i < resultArray.length; i++) {

        var nodes = resultArray[i].row[1];
        var ids = resultArray[i].row[2];
        var labels = resultArray[i].row[3];
        for (var j = 0; j < nodes.length; j++) {
            var objNode=labelsMap[nodes[j][Gparams.defaultnodeNameField]];
            if(!objNode){
                var objNode={
                    id:ids[j],
                    label:nodes[j][Gparams.defaultnodeNameField],
                    w:100,
                    h:30,
                    x:x,
                    y:y,
                    shape:"textBox",
                    size:0,
                    color:"grey",
                    relsIn:[],
                    relsOut:[],
                    subGraph:subGraph,
                    color:nodeColors[labels[j]]

                }
                labelsMap[nodes[j][Gparams.defaultnodeNameField]]=objNode;
                dataLabels.push(objNode);
                y+=20;
                x+=20;
            }



            if(j<nodes.length-1){
                var startLabel= nodes[j][Gparams.defaultnodeNameField];
                var endLabel= nodes[j+1][Gparams.defaultnodeNameField];

                var direction="normal";




            }


        }
    }

    for (var i = 0; i < resultArray.length; i++) {

        var rels = resultArray[i].row[0];
        var nodes = resultArray[i].row[1];

        for (var j = 0; j < nodes.length; j++) {
            if(j<nodes.length-1){
                var startLabel= nodes[j][Gparams.defaultnodeNameField];
                var endLabel= nodes[j+1][Gparams.defaultnodeNameField];
                var relType=rels[j];
                var direction="normal";


                var objRel={
                    id:i,
                    source:labelsMap[startLabel],
                    target:labelsMap[endLabel],
                    type:relType,
                    direction:direction
                }

                dataRels.push(objRel);


                labelsMap[startLabel].relsOut.push(objRel);
                labelsMap[endLabel].relsIn.push(objRel);

            }

        }



    }
self.loadLabelsCoordinates(subGraph,labelsMap)
self.draw(dataLabels,dataRels);



}








   self.draw=function(dataNodes,dataRels) {

    var lineFunction = d3.svg.line()
        .x(function(d) { return d.x; })
        .y(function(d) { return d.y; })
        .interpolate("linear");

    if (true || !svgGraph) {
        $(graphDiv).html("");
        var w = $(graphDiv).width();
        var h = $(graphDiv).height();
        d3.select("#graphDiv").html("");

        svgGraph = d3.select(graphDiv).append("svg").attr("width", w).attr(
            "height", h);
    }

	/*
	 * hoverRect = svgGraph.append("rect").attr("x", 100).attr("y", 100).attr(
	 * "width", 100).attr("height", 20).attr("rx", 10).attr("ry", 10) .style("fill",
	 * "yellow").attr("visibility", "hidden"); hoverText =
	 * svgGraph.append("text").attr("x", 100).attr("y", 100).attr( "dy",
	 * ".35em").text("ABBBBBA").attr("class", "textHover").style( "fill",
	 * "black").attr("visibility", "hidden");
	 */


    var resetButton =svgGraph.append("g").on("click",resetLabelsPosition).attr("transform", function(d) {
        var d={x:10,y:30};
        return "translate(" + d.x + "," + d.y + ")";
    });

	/*	resetButton.append("rect").attr("width", 100).attr("height", 20).attr("rx", 10).attr("ry", 10)
	 .style("fill", "white");
	 resetButton.append("text").text("reset").attr("width", 40).attr("height", 20).attr("dy",15);


	 var infoZone =svgGraph.append("g").on("click",onLabelInfoClick).attr("transform", function(d) {
	 var d={x:10,y:5};
	 return "translate(" + d.x + "," + d.y + ")";
	 });

	 infoZone.append("rect").attr("width", 800).attr("height", 20).attr("rx", 10).attr("ry", 10)
	 .style("fill", "white");
	 infoZone.append("text").text("infos :").attr("id","infoZone").attr("width", 800).attr("height", 20).attr("dy",15);

	 */



	/*	var force = d3.layout.force().size([ w, h - 160 ]).linkDistance(distance)
	 .charge(charge).on("tick", tick);
	 force.start();*/


    links = svgGraph.selectAll(".link").data(dataRels).enter().append("svg:g", "link").attr("id", function(d) {
        return "L_" + d.id;
    })
        .style("opacity",minOpacity );

    ;


    // .on("dblclick", dblclickPoint).on("click", clickPoint)


    links.each(function (d){


        var path=[
            {x:d.source.x+(d.source.w/2),y:d.source.y+(d.source.h/2)},
            {x:d.target.x+(d.target.w/2),y:d.target.y+(d.target.h/2)}
        ]
        var aLine =d3.select(this).append("svg:path")
            .attr("id", "path_"+d.id)
            .attr("d",lineFunction(path))
            .style("stroke", function(d) {
                return "brown";
            }).style("stroke-dasharray", function(d) {
                var p =2;// legendRelTypes[d.target.relType].index + 1;
                return ";" + p + "," + p;
            }).style("fill", "brown")
            .on("mouseover", function(d) {
                // overPath(d);
            }).on("mouseout", function(d) {
                // outPath(d);
            });

        var  relLabels = d3.select(this).append("text")	.attr("dy", -5)
            .append("textPath")
            .text(function(d){
                if(d.direction=="normal")
                    return d.type+ " ->";
                else
                    return  "<- "+d.type;
            })
            .attr("xlink:href", "#path_"+d.id)
            .attr("marker-end", "url(#arrowhead)")
            .style("text-anchor", "middle") // place the text halfway on the arc
            .attr("startOffset", "50%")
            .style("font-size", "10px")
            .style("fill", "brown");

    });





    points = svgGraph.selectAll(".pointsRadar").data(dataNodes).enter().append(
        "svg:g").on("dblclick", dblclickPoint).on("click", clickPoint)
        .attr("class", "pointsRadar").attr("id", function(d) {
            return "P_" + d.id;
        });

    points.each(function (d){
        var aPoint =d3.select(this);
        var shape;
        var size =d.size
        size =  parseInt(""+size);
        // console.log(size+" "+ d.name)
        if (!size  ||  typeof size!="number")
            size = 8;

        d.size2 = size;
        if( displayType && displayType=="textBox" ){
            if(!d.w)
                d.w=100;
            if(!d.h)
                d.h=20;
        }else{
            if(!d.w)
                d.w=size/2;
            if(!d.h)
                d.h=size/2;
        }




        if( displayType && displayType=="textBox" ){

            shape= aPoint.append('rect')
                .attr("width", d.w).attr("height", d.h).attr("rx", 2).attr("ry", 2)
        }
        else if(!d.shape || d.shape=="circle"){
            shape=aPoint.append("circle").attr("cx", 0).attr("cy", 0).attr("r",size);
        }
        else if(d.shape=="triangleUp"){
            shape= aPoint.append('path')
                .attr('d', tiangleUpPath);

        }
        else if(d.shape=="triangleDown"){
            shape= aPoint.append('path')
                .attr('d', triangleDown);
        }
        else if( d.shape=="square"){
            shape= aPoint.append('rect')
                .attr("x",- size/2).attr("y", - size/2).attr(
                    "width", size).attr("height", size).attr("rx", 0).attr("ry", 0)
        }

        else if( displayType="textBox" || d.shape=="textBox"){
            shape= aPoint.append('rect')
                .attr("x",- size/2).attr("y", - size/2).attr(
                    "width", size).attr("height", size).attr("rx", 10).attr("ry", 10)
        }

        shape.style(
            "stroke",
            function(d) {
                return "000";

            })

            .style(
                "fill",
                function(d) {
					/*
					 * return
					 * radarXmls[radarModelName].Xml_getRealValue("color",
					 * "color", d.color);
					 */

                    return d.color;
                })
            .attr("class", "shape")


        ;
    });
    points.append("text").attr("x", function(d) {

        if(displayType=="textBox")
            return (d.w / 2) ;
    }).attr("dy", function(d){
        if(displayType=="textBox")
            return 20;
        return ".35em"})
        .text(function(d) {
            if (d.label > labelMaxSize)
                return d.label.substring(0, labelMaxSize) + "..."
            return d.label;
        })
        .attr("text-anchor", function(d){
            if(displayType=="textBox")
                return "middle";
            return "left"})

        .style("fill", function(d){
            if(d.textColor) return d.textColor;
            return "black"})
        .style("font-weight", function(d){
            if(d.textBold) return "bold";
            return "normal"})
        // .style("font-size", "10px")
        .attr("class", "radarPointLabel");

    points.attr("transform", function(d) {
        // d.x=-d.x/2;d.y=-d.y/2;
        return "translate(" + d.x + "," + d.y + ")";
    });



    // ajustement de la box à la largeur du texte
    points.each(function(d){

        var bBox=d3.select(this).select("text").node().getBBox();
        d3.select(this).select("rect").attr("x",bBox.x-5).attr("width", bBox.width+10);

    })

    hoverRect = svgGraph.append("rect").attr("x", 100).attr("y", 100).attr(
        "width", 100).attr("height", 20).attr("rx", 10).attr("ry", 10)
        .style("fill", "FFF78C").attr("visibility", "hidden").style(
            "opacity", 1);
    hoverText = svgGraph.append("text").attr("x", 100).attr("y", 100).attr(
        "dy", ".35em").text("ABBBBBA").attr("class", "textHover").style(
        "fill", "black").attr("visibility", "hidden").style("font-weight",
        "bold");
    // **************************DragRect************************

    var dataRect = [ {
        x : 1,
        y : 1,
        w : 2,
        h : 2,

    } ];
    dragRect = svgGraph.selectAll().data(dataRect).enter().append("rect").attr("width", function(d) {
        return d.w;
    }).attr("height", function(d) {
        return d.h;
    }).attr("x", function(d) {
        return d.x;
    }).attr("y", function(d) {
        return d.y;
    }).style("z-index", 100).style("stroke", "black").style("fill", "transparent").attr("class", "dragRect");

    var str="";

    var dragPoints = d3.behavior
        .drag()
        .on("dragstart", function(d, x, y) {
self.initZoneDrag(d);
self.hoverHide()

        })
        .on("drag", function(d, sx, sa, sy, sz) {
            isDragging = true;
            if (isReadOnly) {
                return;
            }
            if (isResizing) {


                // oldRect =d;
                var rect=dragRect.datum();
                if(rect){
					/*
					 * var evtX = d3.event.sourceEvent.layerX; var evtY =
					 * d3.event.sourceEvent.layerY; // console.log(evtX+" :
					 * "+evtY); var newWidth = evtX - rect.x; var newHeight =
					 * evtY - rect.y;
					 */
self.round(d3.event.x-rect.x);
self.round(d3.event.y-rect.y);
                    if(newWidth>0 && newHeight>0){


                        d3.select(".dragRect").datum().w=newWidth;
                        d3.select(".dragRect").datum().h=newHeight;
                        d3.select(".dragRect").attr("width", newWidth).attr("height", newHeight);

                    }
                }


            } else {

self.round(d3.event.x-dragDx);
self.round(d3.event.y-dragDy);

                d3.select(this).datum().x=x;
                d3.select(this).datum().y=y;
                d3.select(this).attr("transform", function(d) {

                    return "translate(" + x + "," + y + ")";
                });
            }

        })
        .on(
            "dragend",
            function(d, sx, sa, sy, sz) {
                var item=null;

                if (isReadOnly) {
                    return;
                }
                var newWidth = 1;
                var newHeight = 1;
                var coefX = 1;
                var coefY =1;

                var x ;
                var y ;
                var changePointOK=false;
                if (isResizing) {
                    x=d.x;
                    y=d.y;
                    var rect=dragRect.datum();
                    if(rect){
                        newWidth = parseInt(rect.w);
                        newHeight = parseInt(rect.h);
                        if(newWidth<minTextBoxSize)
                            newWidth=minTextBoxSize;
                        if(newHeight<minTextBoxSize)
                            newHeight=minTextBoxSize;
                        changePointOK=true;
                        d3.select(".dragRect").datum().w=0;
                        d3.select(".dragRect").datum().h=0;
                        d3.select(".dragRect").datum().x=0;
                        d3.select(".dragRect").datum().y=0;
                        d3.select(".dragRect").attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);


                    }


                }
                else{

                    x=d.x;// -dragDx;
                    y=d.y;// -dragDy;
                    var  changePointOK=true;
                }


                var fieldJson = {
                };


                // for(var i=0;i<selection.length;i++){
                // var shape=d3.select(selection[i]);
                var shape=d3.select(this);

                if(isResizing){
                    changePointOK=true;
                    shape.datum().w=newWidth;// le groupe
                    shape.datum().h=newHeight;
                    shape.attr("width",newWidth).attr("height",newHeight);

                    shape=d3.select(this).selectAll(".shape");// le
                    // rectangle
                    shape.attr("width",newWidth).attr("height",newHeight);

                    fieldJson.w=newWidth
                    fieldJson.h=newHeight;
                }else{
                    if(!changePointOK){
                        x=oldX;
                        y=oldY;
                    }

                    shape.datum().x=x;
                    shape.datum().y=y;
                    fieldJson.x=x
                    fieldJson.y=y;
                    shape.attr("x",x).attr("y",y);
                    shape.attr("transform", function(d) {return "translate(" + x + "," + y + ")";});
                }
                if(item){// point changé de quadarant et OK
                    fieldJson[xfield] = item[xfield];
                    fieldJson[rfield] = item[rfield];
                    fieldJson.excluded = item.excluced;
                }
                if(changePointOK){
					/*
					 * proxy_updateItemFields(dbName, collectionName, { id :
					 * d.id }, fieldJson); setMessage("<font color=green>move
					 * saved</font>");
					 */

                }



                for( var i=0;i<d.relsOut.length;i++){
                    var id=d.relsOut[i].id;
                    var target=d3.select( "#L_" + id).datum().target;
                    // path=[ {x:d.x,y:d.y},{x:target.x,y:target.y}]


                    var path=[
                        {x:d.x+(d.w/2),y:d.y+(d.h/2)},
                        {x:target.x+(target.w/2),y:target.y+(target.h/2)}
                    ]


                    d3.select("#path_" + id).attr("d",lineFunction(path))
                }
                for( var i=0;i<d.relsIn.length;i++){
                    var id=d.relsIn[i].id;
                    var source=d3.select( "#L_" + id).datum().source;
                    target
                    path=[{x:source.x,y:source.y}, {x:d.x,y:d.y}]
                    var path=[
                        {x:source.x+(source.w/2),y:source.y+(source.h/2)},
                        {x:d.x+(d.w/2),y:d.y+(d.h/2)}
                    ]
                    d3.select("#path_" + id).attr("d",lineFunction(path))
                }

self.savelabelCoordinates(d);




                $(graphDiv).css('cursor', 'default');
                isDragging = false;
                isResizing = false;
                d3.select(".dragRect").style("visibility","hidden");
                selection=[];
            }





        );

    d3.selectAll(".pointsRadar").call(dragPoints);
    points.on("mouseover", function(node) {
        if( displayType && displayType=="textBox" ){

        }
self.overCircle(node);
        return true;
    }).on("mouseout", function(node) {
        if( displayType && displayType=="textBox" ){
self.outCircle(node);
        }

        return true;
    });




}



   self.isPositionOk=function(){
    return true;

}























// Define the zoom function for the zoomable tree
function zoom() {
    svgGraph.attr("transform", "translate(" + d3.event.translate + ")scale("
        + d3.event.scale + ")");
}
   self.overCircle=function(node) {
    for( var i=0;i<node.relsOut.length;i++){
        var id=node.relsOut[i].id;
        d3.select( "#L_" + id).style("opacity",1);
        d3.select( "#L_" + id).select("text").style("stroke", "purple");
        d3.select( "#L_" + id).select("path").style("stroke", "purple");


    }
    for( var i=0;i<node.relsIn.length;i++){
        var id=node.relsIn[i].id;
        d3.select( "#L_" + id).style("opacity",1);
        d3.select( "#L_" + id).select("text").style("stroke", "green");
        d3.select( "#L_" + id).select("path").style("stroke", "green");
    }

}

   self.outCircle=function(node) {
    var xxx= d3.select( ".link");

    links.each(function(d){

        d3.select( "#L_" + d.id).style("opacity",minOpacity);
        d3.select( "#L_" + d.id).select("text").style("stroke",null);
        d3.select( "#L_" + d.id).select("path").style("stroke", "brown");

    });

}

   self.hoverShow=function(x, y, text) {
    if (!text.length)
        return;
	/*
	 * hoverRect.attr("x", x + 7); hoverRect.attr("y", y - 7);
	 * hoverRect.attr("width", 8 * text.length); hoverText.attr("x", x + 12);
	 * hoverText.attr("y", y + 3); hoverText.text(text);
	 * hoverRect.attr("visibility", "visible"); hoverText.attr("visibility",
	 * "visible");
	 */
}

   self.hoverHide=function() {
    // return;
	/*
	 * hoverRect.attr("visibility", "hidden"); hoverText.attr("visibility",
	 * "hidden");
	 */
}

   self.popupShow=function(x, y, text) {
    if (!text.length)
        return;
    // radar width: 1040;
    // radar height: 600;
    if (y > 180)
        y = 180;
    if (x > 540)
        x = 540;
    $("radarHoverPopup").draggable();
    $("radarHoverPopup").html(text);
    $("radarHoverPopup").css("visibility", "visible");
    $("radarHoverPopup").css("top", "" + (y - 10) + "px");
    $("radarHoverPopup").css("left", "" + (x + 5 - 230) + "px");

}

   self.popupHide=function() {
    // return;
    $("radarHoverPopup").css("visibility", "hidden");
    $("radarHoverPopup").css("visibility", "hidden");
}

   self.overPath=function(link) {
    var p = getMiddlePoint({
        x : link.source.x,
        y : link.source.y
    }, {
        x : link.target.x,
        y : link.target.y
    });
self.hoverShow(p.x, p.y, "" + link.target.relType);

}

   self.clickBackground=function() {
self.hoverHide();
}
   self.dblclickPoint=function(e) {
    // if (isDragging === false)
    // showRadarData(this.__data__);
    // getFormHTML(this.__data__);

}

   self.clickPoint=function( node) {

    var str="";
    for(var i=0;i<node.fields.length;i++){
        if(i>0)
            str+=","
        if(node.fields[i]!="subGraph")
            str+=node.fields[i];
    }
    d3.select("#infoZone").text(node.label+" proprietees : "+str);
}

   self.onLabelInfoClick=function(d){

}

   self.setRadarPointsVisbility=function() {
    d3.selectAll(".pointsRadar").attr("visibility", function(d, i) {

        var isVisible = true;
        if (d.visible === false)
            isVisible = false;
        if (d.excluded === true && !showExcludedRadarPoints)
            isVisible = false;
        if (isVisible)
            return "visible";
        else
            return "hidden";

    });
}

   self.drawLegendD3=function(data) {

    var xShape = 15;
    var xLabel = 35;
    yLegendOffset += 25;
    if (svgGraphLegend == null) {
        $("#legend").html("");
        // d3.select("svg").selectAll("*").remove();
        svgGraphLegend = d3.select("#legend").append("svg").attr("width", 200)
            .attr("height", 300);
    }
	/*
	 * points = svgGraphLegend.selectAll(".pointsLegend").data(data).enter()
	 * .append("svg:g").on("click", clickLegend).attr("class",
	 * "pointsLegend").attr("id", function(d) { return "P_" + d.label; });
	 */
    var currentType = "XXXXX";
    for (var i = 0; i < data.length; i++) {
        var d = data[i];
        if (currentType != d.type) {// draw type
            currentType = d.type;
            svgGraphLegend.append("text").attr("x", function(d) {
                return 18;
            }).attr("dy", ".35em").text(d.type).attr("transform",
                "translate(" + xLabel + "," + yLegendOffset + ")").attr(
                "class", "legendType");
            yLegendOffset += 20;
        }

        svgGraphLegend.append("circle").attr("cx", xShape).attr("cy",
            yLegendOffset).attr("r", function() {
            if (d.size)
                return d.size + "px";
            return 8;
        }).style("fill", function() {
            if (d.color)
                return d.color;
            return "eee";
        }).style("stroke", "bbb");

        svgGraphLegend.append("text").attr("x", xLabel)
            .attr("y", yLegendOffset).text(function() {
            var str = "";
            str += d.label;
            return str;
        }).style("fill", "black").attr("class", "radarPointLabel");

        yLegendOffset += 20;

    }
    ;

}

   self.drawLegendD3Old=function(data) {
    // console.log(JSON.stringify(data));
    var x = 15;

    // var points =
    // svgGraph.selectAll("g").data(data).enter().append("svg:g").on("click",
    // click);
    points = svgGraphLegend.selectAll(".pointsLegend").data(data).enter()
        .append("svg:g").on("click", clickLegend).attr("class",
            "pointsLegend").attr("id", function(d) {
            return "P_" + d.label;
        });

    points.append("circle").attr("cx", 0).attr("cy", 0)
	/*
	 * .attr("stroke", "007") .attr("stroke-width", 1)
	 */
        .attr("r", function(d) {

            var size = d.size;
            if (size)
                size = d.size.value
            else
                size = 10;
            // y += size + 10;
            return size;
        })

        .style("fill", function(d) {
            var color = d.color;
            if (color)
                return color.value;
            return "eee";
        }).style("stroke", "bbb");

    points.append("text").attr("x", function(d) {
        return 18;
    }).attr("dy", ".35em").text(function(d) {
        var str = "";
        str += d.label.value;

        return str;
    }).style("fill", "black").attr("class", "radarPointLabel"); // .style("font-size",
    // "10px");

    points.attr("transform", function(d) {
        // d.x=-d.x/2;d.y=-d.y/2;
        yLegendOffset += 20;
        return "translate(" + x + "," + yLegendOffset + ")";
    });

}
   self.drawLegendType=function(type) {
    var x = 5;
    yLegendOffset += 20;
    if (svgGraphLegend == null) {

        $("#legend").html("");
        // d3.select("svg").selectAll("*").remove();
        svgGraphLegend = d3.select("#legend").append("svg").attr("width", 200)
            .attr("height", 300);
    }

    svgGraphLegend.append("text").attr("x", function(d) {
        return 18;
    }).attr("dy", ".35em").text(type).attr("transform",
        "translate(" + x + "," + yLegendOffset + ")").attr("class",
        "legendType");

}

   self.clickLegend3=function(e) {
    var id = this.__data__.enumId.value;
    var currentEnum = radarXmls[radarModelName].Xml_getEnumeration(id);
    setMessage("legendId :" + currentEnum.label + " : " + !currentEnum.checked);
    showRightFilterDialog(id);

}

   self.forcePointColor=function(nodeIds, color_) {
    var colorField=radarXmls[radarModelName].XML_getFieldForRole("color");
    svgGraph.selectAll(".pointsRadar")
        .each(function(d) {
            if(false){
                d3.select(this).select(".shape").style("fill",function(d) {
                    if ($.inArray(d.id,nodeIds)>-1) {
                        return color_;
                    }
                    else{
                        var color = "eef";
                        if (d.color) {
                            color = radarXmls[radarModelName]
                                .Xml_getRealValue(
                                    "color",
                                    null,
                                    d[colorField]);
                        }
                        return color;
                    }
                });
            }

            d3.select(this).select(".shape").style("stroke",function(d) {
                if ($.inArray(d.id,nodeIds)>-1) {
                    return color_;
                }
                else{

                    return "black";
                }
            })
                .style("stroke-width",function(d) {
                    if ($.inArray(d.id,nodeIds)>-1) {
                        return "2px";
                    }
                    else{

                        return "1px";
                    }
                });
            d3.select(this).style("opacity",function(d) {
                if ($.inArray(d.id,nodeIds)>-1) {
                    return 1;
                }
                else if(d.textBold)
                    return .8;
                else{

                    return 0.2;
                }
            });

        });


}
   self.resetAllPointsOpacity=function(opacity){
    d3.selectAll(".pointsRadar").style("opacity",function(d) {
        return opacity;
    });

}

   self.updateRadarPoint=function(node) {
    var sizeField = radarXmls[radarModelName].XML_getFieldForRole("size");
    var colorField=radarXmls[radarModelName].XML_getFieldForRole("color");


    var points = svgGraph
        .selectAll(".pointsRadar")
        .each(function(d) {
            if (d.id == node.id || d.id == node) {


                d3.select(this)
                    .select(".shape")
                    .attr(
                        "r",
                        function(d) {
                            var size = 8;
                            if (d.size) {
                                if (sizeField) {
                                    size = radarXmls[radarModelName]
                                        .Xml_getRealValue(
                                            "size",
                                            null,
                                            node[sizeField]);
                                }
                            }
                            return size;
                        })
                    .style(
                        "fill",
                        function(d) {
                            var color = "eef";
                            if (d.color) {
                                color = radarXmls[radarModelName]
                                    .Xml_getRealValue(
                                        "color",
                                        null,
                                        node[colorField]);
                            }
                            return color;
                        });
            }

        });

}

   self.getRadarImg=function() {
    var html = d3.select("svg").attr("version", 1.1).attr("xmlns",
        "http://www.w3.org/2000/svg").node().parentNode.innerHTML;
    d3.select("testIMG").html(html);

    // injection des styles (Ã  revoir pas propre !!!)
    var style = ".radarPointLabel {fill: fff;font: Consolas, verdana, sans-serif;font-size: 12px;font-weight: normal;pointer-events: none;}";
    style += ".radarAxisTitle {font-size: 28, text-anchor: start, fill: 00f}";
    style += ".title {position: relative;top: 5px;left: 10px;font-size: 18px;font-family: serif;font-weight: bold;}";
    var styleDef = '<defs><style type="text/css"><![CDATA[' + style
        + ']]></style></defs>';
    var p = html.indexOf(">");
    html = html.substring(0, p + 1) + styleDef + html.substring(p);
    return html;
    var imgSrc = 'data:image/svg+xml;base64,' + btoa(html);
    return imgSrc;

}


// *****************resize,

   self.initZoneDrag=function(zone) {
    var evtX = d3.event.sourceEvent.layerX;
    var evtY = d3.event.sourceEvent.layerY;
    dragDx=evtX-zone.x;
    dragDy=evtY-zone.y;
    oldX=zone.x;
    oldY=zone.y;
self.hoverHide();
    isResizing=false;
    console.log("-------Resizing init "+zone.x+ "  : " + zone.y);
    // var displayType=radarXmls[radarModelName].displayType
    if( displayType && displayType=="textBox" ){



        var oldX2 = zone.x + zone.w;
        var oldY2 = zone.y + zone.h;
        // var evtX = d3.event.sourceEvent.offsetX;
        // var evtY = d3.event.sourceEvent.offsetY;



        d3.select(".dragRect").datum().w=zone.w;
        d3.select(".dragRect").datum().h=zone.h;
        d3.select(".dragRect").datum().x=zone.x;
        d3.select(".dragRect").datum().y=zone.y;

        d3.select(".dragRect").attr("x", zone.x).attr("y", zone.y);
        if (evtX > (oldX2 - resizeSquare) && evtY > (oldY2 - resizeSquare)) {
            isResizing = true;
            $(graphDiv).css('cursor', 'default');
            d3.select(".dragRect").style("visibility","visible");

        } else {
            isResizing = false;
            $(graphDiv).css('cursor', 'default');
            d3.select(".dragRect").style("visibility","hidden");
        }
    }

}

   self.round=function(value){
    return Math.round(value/5)*5;
}

function getSVG(collectionName, id){
    var svg=$("#graphDiv").html();
// var svg1=d3.select("svg").html();
// var svg2=d3.selectAll(svgGraph).html();
// svg='<svg xmlns="http://www.w3.org/2000/svg" width="860"
// height="560">'+svg+'</svg>';
    svg=svg.replace(/&nbsp;/,"");
    svg=svg.replace(/fill: transparent;/,"");
    return svg;
}

   self.setRadarLabel=function(label,className){
    var xx=d3.selectAll("."+className).text(label);

}




   self.savelabelCoordinates=function(d){


    query="action=updateOrCreateMongoObj";

    var data={

        mongoDB:"graphAdmin",
        collection:"labelsCoordinates",

        query:{
            subGraph:d.subGraph,
            label:d.label
        }
        ,
        obj:{
            subGraph:d.subGraph,
            label:d.label,
            x:d.x,
            y:d.y,
            w:d.w,
            h:d.h
        }

    };
self.submitMongo(query, data);

}

   self.loadLabelsCoordinates=function(subGraph,labelsMap){
    query="action=getData";

    var data={
        mongoDB:"graphAdmin",
        collection:"labelsCoordinates",
        query:{
            subGraph:subGraph,
        }

    };
self.submitMongo(query, data, function(d){
        for(var i=0;i<d.length;i++){
            var objCoords=d[i];
            var objLabel=labelsMap[objCoords.label];
            if(objLabel){
                labelsMap[objCoords.label].x=objCoords.x;
                labelsMap[objCoords.label].y=objCoords.y;
                labelsMap[objCoords.label].w=objCoords.w;
                labelsMap[objCoords.label].h=objCoords.h;

            }
        }



    });
}

   self.submitMongo=function(){
    return ;
}


   self.resetLabelsPosition=function(){


}












 return self;
})()