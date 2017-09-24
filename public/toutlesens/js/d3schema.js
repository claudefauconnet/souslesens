/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
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
var d3schema = (function () {
    var self = {};
    var dataLabels = [];
    var labelsMap = {}
    var dataRels = [];
    self.currentLabel;

    var y0 = 100;
    var x0 = 100;
    var id = 0;
    var links;
    var points;
    self.subGraph;

    var minOpacity = .8;

    self.graphDiv = "#graphDiv";
    self.currentNodeData;
    self.currentRelationData;
    self.inCreatingRelation = false;

    var palette = ['#0056B3', '#007DFF', '#A84F02', '#A8A302', '#B354B3',
        '#B35905', '#B37A00', '#B39BAB', '#B3B005', '#F5ED02', '#F67502',
        '#FF78FF', '#FF7D07', '#FFD900', '#FFDEF4', '#FFFB08',]


    self.drawNeoModel = function (subGraph, fromSchema, update) {
        self.subGraph = subGraph;
        function execute() {
            dataLabels = [];
            labelsMap = {}
            dataRels = [];
            initD3Nodes(fromSchema);
            setLabelsCoordinates();
            initD3rels(fromSchema);
            draw(self.graphDiv);
        }

        if (update)
            execute();
        else if (fromSchema)
            Schema.load(subGraph, function (err, json) {
                if (err) {
                    alert("error" + err);
                    return;
                }

                execute();
            })
        else {
            dataModel.initNeoModel(subGraph, function (data) {
                execute();

            });
        }
    }


    var initD3Nodes = function (fromSchema) {
        var labels;
        if (fromSchema)
            labels = Schema.schema.labels;
        else
            labels = dataModel.labels

        var i = 0;
        for (var key in labels) {
            var label = key;
            var color = palette[i];
            i++;
            if (label != null && label != "" && label != "null") {
                var obj = {
                    id: id++,
                    label: label,
                    name: label,
                    w: 100,
                    h: 30,

                    shape: "textBox",
                    size: 0,
                    color: "grey",
                    relsIn: [],
                    relsOut: [],
                    subGraph: subGraph,
                    color: color,
                    fields: labels[key]
                }
                var d3Attrs = labels[key].d3Attrs
                if (d3Attrs) {
                    obj.x = parseInt("" + d3Attrs.x);
                    obj.y = parseInt("" + d3Attrs.y);

                } else {
                    //   obj.x = x0;
                    //  obj.y = y0;
                    x0 += 20;
                    y0 += 20;

                }
                labelsMap[label] = obj;
                dataLabels.push(obj);
            }

        }
    }
    var setLabelsCoordinates = function () {// randomize position
        var w = $(graphDiv).width() / 2;
        var h = $(graphDiv).height() / 2;


        for (var i = 0; i < dataLabels.length; i++) {
            if (!dataLabels[i].x || !dataLabels[i].y) {


                var xSign = Math.round(Math.random()) * 2 - 1;
                var ySign = Math.round(Math.random()) * 2 - 1;
                x = (Math.round(Math.random() * 100000000 / 100000000 * (w - 50)) * xSign) + w;
                y = (Math.round(Math.random() * 100000000 / 100000000 * (h - 50)) * ySign) + h;
                dataLabels[i].x = x;
                dataLabels[i].y = y;
            }


        }
    }

    var initD3rels = function (fromSchema) {
        var relations;
        if (fromSchema) {
            var relations = Schema.schema.relations;
            for (var key in relations) {
                var relation = relations[key];
                if (labelsMap[relation.startLabel] && labelsMap[relation.endLabel]) {
                    var obj = {
                        id: id,
                        source: labelsMap[relation.startLabel],
                        target: labelsMap[relation.endLabel],
                        type: relation.type,
                        direction: "normal",
                        name: key
                    }
                    if (labelsMap[relation.startLabel])
                        labelsMap[relation.startLabel].relsOut.push(obj);
                    if (labelsMap[relation.endLabel])
                        labelsMap[relation.endLabel].relsIn.push(obj);

                    id++;
                    dataRels.push(obj);

                }
                else
                    console.log("no labels define for in schema.labels for " + labelsMap[relation.startLabel] + "or " + labelsMap[relation.endLabel])
            }


        }
        else {
            relations = dataModel.allRelations;


            for (var key in relations) {
                var rel = relations[key];
                for (var i = 0; i < rel.length; i++) {
                    if (rel[0] && rel[1] && rel[1].endLabel && rel[0].endLabel) {
                        var obj = {
                            id: id,
                            source: labelsMap[rel[0].endLabel],
                            target: labelsMap[rel[1].endLabel],
                            type: type,
                            direction: "normal",
                            name: key
                        }
                        labelsMap[rel[0].endLabel].relsOut.push(obj);
                        labelsMap[rel[1].endLabel].relsIn.push(obj);

                        id++;
                        dataRels.push(obj);

                    }
                }

            }
        }
    }


    var draw = function (graphDiv) {
        $(graphDiv).html("");
        var w = $(graphDiv).width();
        var h = $(graphDiv).height();
        var svgX = $(graphDiv).position().x ;
        var svgY = $(graphDiv).position().y ;
        d3.select("svg").selectAll("*").remove();
        svgGraph = d3.select(graphDiv).append("svg").attr("width", w).attr(
            "height", h);

        links = svgGraph.selectAll(".link").data(dataRels).enter().append("svg:g", "link").attr("id", function (d) {
            return "L_" + d.id;
        }).on("click", clickRel).style("opacity", minOpacity);


        links.each(function (d) {


            var path = [
                {x: d.source.x + (d.source.w / 2), y: d.source.y + (d.source.h / 2)},
                {x: d.target.x + (d.target.w / 2), y: d.target.y + (d.target.h / 2)}
            ]
            var aLine = d3.select(this).append("svg:path")
                .attr("id", "path_" + d.id)
                .attr("d", lineFunction(path))
                .style("stroke", function (d) {
                    return "brown";
                })/*.style("stroke-dasharray", function (d) {
                 var p = 2;// legendRelTypes[d.target.relType].index + 1;
                 return ";" + p + "," + p;
                 })*/.style("fill", "brown")
                .style("stroke-width",3)
                .on("mouseover", function (d) {
                    // overPath(d);
                }).on("mouseout", function (d) {
                    // outPath(d);
                });

            var relLabels = d3.select(this).append("text").attr("dy", -5)
                .append("textPath")
                .text(function (d) {
                    if (d.direction == "normal")
                        return d.type + " ->";
                    else
                        return "<- " + d.type;
                })
                .attr("xlink:href", "#path_" + d.id)
                .attr("marker-end", "url(#arrowhead)")
                .style("text-anchor", "middle") // place the text halfway on the arc
                .attr("startOffset", "50%")
                .style("font-size", "14px")
                .style("fill", "brown");

        });


        points = svgGraph.selectAll(".pointsRadar").data(dataLabels).enter().append(
            "svg:g").on("dblclick", dblclickPoint).on("click", clickPoint)
            .attr("class", "pointsRadar").attr("id", function (d) {
                return "P_" + d.id;
            });

        points.each(function (d) {
            var aPoint = d3.select(this);
            var shape;
            var size = d.size
            size = parseInt("" + size);
            // console.log(size+" "+ d.name)
            if (!size || typeof size != "number")
                size = 8;

            d.size2 = size;
            if (displayType && displayType == "textBox") {
                if (!d.w)
                    d.w = 100;
                if (!d.h)
                    d.h = 20;
            } else {
                if (!d.w)
                    d.w = size / 2;
                if (!d.h)
                    d.h = size / 2;
            }


            if (displayType && displayType == "textBox") {

                shape = aPoint.append('rect')
                    .attr("width", d.w).attr("height", d.h).attr("rx", 2).attr("ry", 2)
            }
            else if (!d.shape || d.shape == "circle") {
                shape = aPoint.append("circle").attr("cx", 0).attr("cy", 0).attr("r", size);
            }
            else if (d.shape == "triangleUp") {
                shape = aPoint.append('path')
                    .attr('d', tiangleUpPath);

            }
            else if (d.shape == "triangleDown") {
                shape = aPoint.append('path')
                    .attr('d', triangleDown);
            }
            else if (d.shape == "square") {
                shape = aPoint.append('rect')
                    .attr("x", -size / 2).attr("y", -size / 2).attr(
                        "width", size).attr("height", size).attr("rx", 0).attr("ry", 0)
            }

            else if (displayType = "textBox" || d.shape == "textBox") {
                shape = aPoint.append('rect')
                    .attr("x", -size / 2).attr("y", -size / 2).attr(
                        "width", size).attr("height", size).attr("rx", 10).attr("ry", 10)
            }

            shape.style(
                "stroke",
                function (d) {
                    return "000";

                })

                .style(
                    "fill",
                    function (d) {

                        return d.color;
                    })
                .attr("class", "shape")


            ;
        });
        points.append("text").attr("x", function (d) {

            if (displayType == "textBox")
                return (d.w / 2);
        }).attr("dy", function (d) {
            if (displayType == "textBox")
                return 20;
            return ".35em"
        })
            .text(function (d) {
                if (d.label > labelMaxSize)
                    return d.label.substring(0, labelMaxSize) + "..."
                return d.label;
            })
            .attr("text-anchor", function (d) {
                if (displayType == "textBox")
                    return "middle";
                return "left"
            })

            .style("fill", function (d) {
                if (d.textColor) return d.textColor;
                return "black"
            })
            .style("font-weight", function (d) {
                if (d.textBold) return "bold";
                return "normal"
            })
            // .style("font-size", "10px")
            .attr("class", "radarPointLabel");

        points.attr("transform", function (d) {
            // d.x=-d.x/2;d.y=-d.y/2;
            return "translate(" + d.x + "," + d.y + ")";
        });

        var dragPoints = d3.behavior
            .drag()
            .on("dragstart", function (d, x, y) {
                initZoneDrag(d);
                hoverHide()

            })
            .on("drag", function (d, sx, sa, sy, sz) {
                isDragging = true;
                if (isReadOnly) {
                    return;
                }
                if (isResizing) {


                    // oldRect =d;
                    var rect = dragRect.datum();
                    if (rect) {
                        /*
                         * var evtX = d3.event.sourceEvent.layerX; var evtY =
                         * d3.event.sourceEvent.layerY; // console.log(evtX+" :
                         * "+evtY); var newWidth = evtX - rect.x; var newHeight =
                         * evtY - rect.y;
                         */
                        var newWidth = round(d3.event.x - rect.x);
                        var newHeight = round(d3.event.y - rect.y);
                        if (newWidth > 0 && newHeight > 0) {


                            d3.select(".dragRect").datum().w = newWidth;
                            d3.select(".dragRect").datum().h = newHeight;
                            d3.select(".dragRect").attr("width", newWidth).attr("height", newHeight);

                        }
                    }


                } else {

                    var x = round(d3.event.x - dragDx);
                    var y = round(d3.event.y - dragDy);

                    var x = round(d3.event.x +svgX);
                    var y = round(d3.event.y+svgY);

                    var x = round(d3.event.dx +d.x);
                    var y = round(d3.event.dy+d.y);

                    d3.select(this).datum().x = x;
                    d3.select(this).datum().y = y;
                    d3.select(this).attr("transform", function (d) {

                        return "translate(" + x + "," + y + ")";
                    });
                }

            })
            .on(
                "dragend",
                function (d, sx, sa, sy, sz) {
                    var item = null;

                    if (isReadOnly) {
                        return;
                    }
                    var newWidth = 1;
                    var newHeight = 1;
                    var coefX = 1;
                    var coefY = 1;

                    var x;
                    var y;
                    var changePointOK = false;
                    if (isResizing) {
                        x = d.x;
                        y = d.y;
                        var rect = dragRect.datum();
                        if (rect) {
                            newWidth = parseInt(rect.w);
                            newHeight = parseInt(rect.h);
                            if (newWidth < minTextBoxSize)
                                newWidth = minTextBoxSize;
                            if (newHeight < minTextBoxSize)
                                newHeight = minTextBoxSize;
                            changePointOK = true;
                            d3.select(".dragRect").datum().w = 0;
                            d3.select(".dragRect").datum().h = 0;
                            d3.select(".dragRect").datum().x = 0;
                            d3.select(".dragRect").datum().y = 0;
                            d3.select(".dragRect").attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);


                        }


                    }
                    else {

                        x = d.x;// -dragDx;
                        y = d.y;// -dragDy;
                        var changePointOK = true;
                    }


                    var fieldJson = {};


                    // for(var i=0;i<selection.length;i++){
                    // var shape=d3.select(selection[i]);
                    var shape = d3.select(this);

                    if (isResizing) {
                        changePointOK = true;
                        shape.datum().w = newWidth;// le groupe
                        shape.datum().h = newHeight;
                        shape.attr("width", newWidth).attr("height", newHeight);

                        shape = d3.select(this).selectAll(".shape");// le
                        // rectangle
                        shape.attr("width", newWidth).attr("height", newHeight);

                        fieldJson.w = newWidth
                        fieldJson.h = newHeight;
                    } else {
                        if (!changePointOK) {
                            x = oldX;
                            y = oldY;
                        }

                        shape.datum().x = x;
                        shape.datum().y = y;
                        fieldJson.x = x
                        fieldJson.y = y;
                        shape.attr("x", x).attr("y", y);
                        shape.attr("transform", function (d) {
                            return "translate(" + x + "," + y + ")";
                        });
                    }
                    if (item) {// point changé de quadarant et OK
                        fieldJson[xfield] = item[xfield];
                        fieldJson[rfield] = item[rfield];
                        fieldJson.excluded = item.excluced;
                    }
                    if (changePointOK) {
                        /*
                         * proxy_updateItemFields(dbName, collectionName, { id :
                         * d.id }, fieldJson); setMessage("<font color=green>move
                         * saved</font>");
                         */

                    }


                    for (var i = 0; i < d.relsOut.length; i++) {
                        var id = d.relsOut[i].id;
                        var target = d3.select("#L_" + id).datum().target;
                        // path=[ {x:d.x,y:d.y},{x:target.x,y:target.y}]


                        var path = [
                            {x: d.x + (d.w / 2), y: d.y + (d.h / 2)},
                            {x: target.x + (target.w / 2), y: target.y + (target.h / 2)}
                        ]


                        d3.select("#path_" + id).attr("d", lineFunction(path))
                    }
                    for (var i = 0; i < d.relsIn.length; i++) {
                        var id = d.relsIn[i].id;
                        var source = d3.select("#L_" + id).datum().source;
                        target
                        path = [{x: source.x, y: source.y}, {x: d.x, y: d.y}]
                        var path = [
                            {x: source.x + (source.w / 2), y: source.y + (source.h / 2)},
                            {x: d.x + (d.w / 2), y: d.y + (d.h / 2)}
                        ]
                        d3.select("#path_" + id).attr("d", lineFunction(path))
                    }

                    savelabelCoordinates(d);


                    $(graphDiv).css('cursor', 'default');
                    isDragging = false;
                    isResizing = false;
                    d3.select(".dragRect").style("visibility", "hidden");
                    selection = [];
                }
            );

        d3.selectAll(".pointsRadar").call(dragPoints);
        points.on("mouseover", function (node) {
            if (displayType && displayType == "textBox") {

            }
            //   overCircle(node);
            return true;
        }).on("mouseout", function (node) {
            if (displayType && displayType == "textBox") {
                //   outCircle(node);
            }

            return true;
        });


    }

    function dblclickPoint(data) {

    }

    function clickRel(data) {
        self.currentRelationData = data;
        var str=data.source.label+"-["+data.type+"]->"+data.target.label;
        $("#currentRelationDiv").html(str);

    }


    function clickPoint(data) {
         self.currentLabel=data.label;
        var previousNodeData = self.currentNodeData;
        $("#currentLabelDiv").html(data.label);
        self.currentNodeData = data;
        if (self.inCreatingRelation && previousNodeData) {
            var type = prompt("relation Type")
            if (!type || type == "") {
                self.inCreatingRelation = false
                return;
            }
            var rel = {
                startLabel: previousNodeData.label,
                endLabel: data.label,
                type: type,

            }
            var name = type;
            var i = 1;
            while (Schema.schema.relations[name]) {
                name = type + "_" + i;
                i++;
            }
            rel.name = name
            Schema.schema.relations[name] = rel;
            var str= rel.startLabel+"-["+type+"]->"+rel.endLabel;
            $("#currentRelationDiv").html(type);
            self.drawNeoModel(self.subGraph, true, true)
            self.currentNodeData = null;
            self.currentRelationData = rel;

        }else{

            clearSelectOptions("#propertiesSelect");
            if (!Schema.schema.properties[data.label])
                Schema.schema.properties[data.label] = {};
            for (var key in Schema.schema.properties[data.label]) {
                $("#propertiesSelect").append($('<option>',
                    {
                        value: key,
                        text: key
                    }));
            }
        }


    }


    function initZoneDrag(zone) {
        var evtX = d3.event.sourceEvent.layerX;
        var evtY = d3.event.sourceEvent.layerY;

        dragDx = evtX - zone.x;
        dragDy = evtY - zone.y;
     //   dragDx = zone.x
      //  dragDy = zone.y
        oldX = zone.x;
        oldY = zone.y;
        hoverHide();
        isResizing = false;
        console.log("-------Resizing init " + zone.x + "  : " + zone.y);
        if (displayType && displayType == "textBox") {


            var oldX2 = zone.x + zone.w;
            var oldY2 = zone.y + zone.h;


            if (d3.select(".dragRect") && d3.select(".dragRect").__data__) {
                d3.select(".dragRect").datum().w = zone.w;
                d3.select(".dragRect").datum().h = zone.h;
                d3.select(".dragRect").datum().x = zone.x;
                d3.select(".dragRect").datum().y = zone.y;

                d3.select(".dragRect").attr("x", zone.x).attr("y", zone.y);
                if (evtX > (oldX2 - resizeSquare) && evtY > (oldY2 - resizeSquare)) {
                    isResizing = true;
                    $(graphDiv).css('cursor', 'default');
                    d3.select(".dragRect").style("visibility", "visible");

                } else {
                    isResizing = false;
                    $(graphDiv).css('cursor', 'default');
                    d3.select(".dragRect").style("visibility", "hidden");
                }
            }
        }

    }

    function hoverHide() {
        // return;
        /*
         * hoverRect.attr("visibility", "hidden"); hoverText.attr("visibility",
         * "hidden");
         */
    }

    var lineFunction = d3.svg.line()
        .x(function (d) {
            return d.x;
        })
        .y(function (d) {
            return d.y;
        })
        .interpolate("linear");


    var savelabelCoordinates = function (d) {
        var obj = Schema.schema.labels[d.label];
        if (obj) {
            if (!obj.d3Attrs)
                obj.d3Attrs = {}
            Schema.schema.labels[d.label].d3Attrs.x = d.x;
            Schema.schema.labels[d.label].d3Attrs.y = d.y;

        }

    }

    function round(value) {
        return Math.round(value / 5) * 5;
    }

    self.createRelation = function () {
        self.inCreatingRelation = true;
    }

    self.createLabel = function () {
        var name = prompt("label name");
        if (!name || name.length == "")
            return;

        var label = {icon: "default.png"};
        Schema.schema.labels[name] = label;
        Schema.schema.properties[name] = {};
        self.currentLabel = name;
        self.drawNeoModel(self.subGraph, true, true);

    }
    self.modifyLabel = function () {

        var name = prompt("#new label name");
        if (!name || name.length == "")
            return;
        var oldLabel = self.currentNodeData.label;
        Schema.schema.labels[name] = Schema.schema.labels[oldLabel];
        delete Schema.schema.labels[oldLabel];
        Schema.schema.properties[name] = Schema.schema.properties[oldLabel];
        delete Schema.schema.properties[oldLabel];


        $("#currentLabelDiv").html(name);
        self.drawNeoModel(self.subGraph, true, true);

    }

    self.modifyRelation = function () {

        var name = prompt("#new relation name");
        if (!name || name.length == "")
            return;
        var type = name;
        var i = 1;
        while (Schema.schema.relations[name]) {
            name = type + "_" + i;
            i++;
        }

        Schema.schema.relations[name]=Schema.schema.relations[self.currentRelationData.name];
        delete Schema.schema.relations[self.currentRelationData.name];
        Schema.schema.relations[name].name=name;
        Schema.schema.relations[name].type=type;
var str= Schema.schema.relations[name].startLabel+"-["+type+"]->"+Schema.schema.relations[name].endLabel;
        $("#currentRelationDiv").html(str);
        self.drawNeoModel(self.subGraph, true, true);

    }

    self.deleteLabel = function () {

        if (confirm("#delete label and its relations")) {
            delete Schema.schema.labels[self.currentNodeData.label];
            delete Schema.schema.properties[self.currentNodeData.label];
            var relations = Schema.getRelations(label, null);
            var invRelations = Schema.getRelations(null, label);
            for (var i = 0; i < relations.length; i++) {
                delete Schema.schema.relations[relations[i]];
            }
            for (var i = 0; i < invRelations.length; i++) {
                delete Schema.schema.relations[invRelations[i]];
            }
            $("#currentLabelDiv").html("");
            self.drawNeoModel(self.subGraph, true, true);
        }

    }

    self.deleteRelation = function () {
        if (confirm("#delete  relation")) {
            delete Schema.schema.relations[self.currentRelationData.name];
            self.drawNeoModel(self.subGraph, true, true);

        }

    }

    return self;

})
()


/***********************************************************************************************************************************************************************/

var old = function () {
    var r = 6;
    var w = 300;
    var h = 25;
    var point;

    var fontSize = "12px";
    var tiangleUpPath = "M0,6L-6,6L0,-6L6,6L0,6";
    var tiangleDownPath = "M0,-6L-6,-6L0,6L6,-6L0,-6";
    var rectPath = "M-6,-6L-6,6L6,6L6,-6L-6,-6";

    var minOpacity = .8;


    var palette = ['#0056B3', '#007DFF', '#A84F02', '#A8A302', '#B354B3',
        '#B35905', '#B37A00', '#B39BAB', '#B3B005', '#F5ED02', '#F67502',
        '#FF78FF', '#FF7D07', '#FFD900', '#FFDEF4', '#FFFB08',]

    var labelMaxSize = 20;

    var x0, y0 = 0;
    var svgGraph = null;
    var svgGraphLegend = null;
    var isDragging = false;

    var hoverRect;
    var hoverText;
    var currentRadarNode = null;
    var yLegendOffset = 0;
    var hoverRect;
    var hoverText;
    var isResizing = false;
    var resizeSquare = 20;
    var minTextBoxSize = 20;
    var selection = [];

    var links;

    var dragDx;
    var dragDy;
    var oldX, oldY;


    var displayType = "textBox";
    var dataModel = {
        labels: {},
        relations: {},
        allRelations: {},
        allProperties: [""],
        allRelationsArray: [""],
        allLabels: [""]
    }

    var currentSubGraph;

    var isReadOnly = false;

    function drawNeoModel(subGraph) {
        dataModel.initNeoModel(subGraph, drawNeoModel2);
    }


    function drawNeoModel2(subGraph) {


        var dataLabels = [];
        var labelsMap = {}
        var dataRels = [];
        var y = 100;
        var x = 100;
        var id = 0;
        var i = 0;

        for (var key in dataModel.labels) {
            var label = key;
            var color = palette[i];
            i++;
            if (label != null && label != "" && label != "null") {
                var obj = {
                    id: id++,
                    label: label,
                    name: label,
                    w: 100,
                    h: 30,
                    x: x,
                    y: y,
                    shape: "textBox",
                    size: 0,
                    color: "grey",
                    relsIn: [],
                    relsOut: [],
                    subGraph: subGraph,
                    color: color,
                    fields: dataModel.labels[key]
                }
                y += 20;
                x += 20;
                labelsMap[label] = obj;
                dataLabels.push(obj);
            }

        }
        loadLabelsCoordinates(subGraph, labelsMap, function (result) {

            for (var key in dataModel.allRelations) {
                var rel = dataModel.allRelations[key];
                for (var i = 0; i < rel.length; i++) {
                    if (rel[0] && rel[1] && rel[1].endLabel && rel[0].endLabel) {
                        var obj = {
                            id: id,
                            source: labelsMap[rel[0].endLabel],
                            target: labelsMap[rel[1].endLabel],
                            type: key,
                            direction: "normal"
                        }
                        labelsMap[rel[0].endLabel].relsOut.push(obj);
                        labelsMap[rel[1].endLabel].relsIn.push(obj);


                        id++;
                        /*  var startLabel = labelsMap[dataModel.allRelations[key][i].startLabel];
                         var endLabel = labelsMap[dataModel.allRelations[key][i].endLabel];
                         var direction = dataModel.allRelations[key][i].direction;
                         if (startLabel && endLabel) {
                         // console.log(key+" "+startLabel.label+" "+endLabel.label);
                         var obj = {
                         id: id,
                         source: startLabel,
                         target: endLabel,
                         type: key,
                         direction: direction
                         }*/

                        dataRels.push(obj);

                        //   startLabel.count = dataModel.allRelations[key][i].count1;
                        // startLabel.relsOut.push(obj);
                        // endLabel.relsIn.push(obj);
                    }
                }

            }

            draw(dataLabels, dataRels);
        });


    }


    function draw(data, dataRels) {

        var lineFunction = d3.svg.line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            .interpolate("linear");

        if (true || !svgGraph) {
            $(graphDiv).html("");
            var w = $(graphDiv).width();
            var h = $(graphDiv).height();
            d3.select("svg").selectAll("*").remove();
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


        /*  var resetButton = svgGraph.append("g").on("click", resetLabelsPosition).attr("transform", function (d) {
         var d = {x: 10, y: 30};
         return "translate(" + d.x + "," + d.y + ")";
         });

         resetButton.append("rect").attr("width", 100).attr("height", 20).attr("rx", 10).attr("ry", 10)
         .style("fill", "white");
         resetButton.append("text").text("reset").attr("width", 40).attr("height", 20).attr("dy", 15);*/


        /*   var infoZone = svgGraph.append("g").on("click", onLabelInfoClick).attr("transform", function (d) {
         var d = {x: 10, y: 5};
         return "translate(" + d.x + "," + d.y + ")";
         });

         infoZone.append("rect").attr("width", 800).attr("height", 20).attr("rx", 10).attr("ry", 10)
         .style("fill", "white");
         infoZone.append("text").text("infos :").attr("id", "infoZone").attr("width", 800).attr("height", 20).attr("dy", 15);*/


        links = svgGraph.selectAll(".link").data(dataRels).enter().append("svg:g", "link").attr("id", function (d) {
            return "L_" + d.id;
        })
            .style("opacity", minOpacity);

        ;


        // .on("dblclick", dblclickPoint).on("click", clickPoint)


        links.each(function (d) {


            var path = [
                {x: d.source.x + (d.source.w / 2), y: d.source.y + (d.source.h / 2)},
                {x: d.target.x + (d.target.w / 2), y: d.target.y + (d.target.h / 2)}
            ]
            var aLine = d3.select(this).append("svg:path")
                .attr("id", "path_" + d.id)
                .attr("d", lineFunction(path))
                .style("stroke", function (d) {
                    return "brown";
                })/*.style("stroke-dasharray", function (d) {
                 var p = 2;// legendRelTypes[d.target.relType].index + 1;
                 return ";" + p + "," + p;
                 })*/.style("fill", "brown")
                .on("mouseover", function (d) {
                    // overPath(d);
                }).on("mouseout", function (d) {
                    // outPath(d);
                });

            var relLabels = d3.select(this).append("text").attr("dy", -5)
                .append("textPath")
                .text(function (d) {
                    if (d.direction == "normal")
                        return d.type + " ->";
                    else
                        return "<- " + d.type;
                })
                .attr("xlink:href", "#path_" + d.id)
                .attr("marker-end", "url(#arrowhead)")
                .style("text-anchor", "middle") // place the text halfway on the arc
                .attr("startOffset", "50%")
                .style("font-size", "10px")
                .style("fill", "brown");

        });


        points = svgGraph.selectAll(".pointsRadar").data(data).enter().append(
            "svg:g").on("dblclick", dblclickPoint).on("click", clickPoint)
            .attr("class", "pointsRadar").attr("id", function (d) {
                return "P_" + d.id;
            });

        points.each(function (d) {
            var aPoint = d3.select(this);
            var shape;
            var size = d.size
            size = parseInt("" + size);
            // console.log(size+" "+ d.name)
            if (!size || typeof size != "number")
                size = 8;

            d.size2 = size;
            if (displayType && displayType == "textBox") {
                if (!d.w)
                    d.w = 100;
                if (!d.h)
                    d.h = 20;
            } else {
                if (!d.w)
                    d.w = size / 2;
                if (!d.h)
                    d.h = size / 2;
            }


            if (displayType && displayType == "textBox") {

                shape = aPoint.append('rect')
                    .attr("width", d.w).attr("height", d.h).attr("rx", 2).attr("ry", 2)
            }
            else if (!d.shape || d.shape == "circle") {
                shape = aPoint.append("circle").attr("cx", 0).attr("cy", 0).attr("r", size);
            }
            else if (d.shape == "triangleUp") {
                shape = aPoint.append('path')
                    .attr('d', tiangleUpPath);

            }
            else if (d.shape == "triangleDown") {
                shape = aPoint.append('path')
                    .attr('d', triangleDown);
            }
            else if (d.shape == "square") {
                shape = aPoint.append('rect')
                    .attr("x", -size / 2).attr("y", -size / 2).attr(
                        "width", size).attr("height", size).attr("rx", 0).attr("ry", 0)
            }

            else if (displayType = "textBox" || d.shape == "textBox") {
                shape = aPoint.append('rect')
                    .attr("x", -size / 2).attr("y", -size / 2).attr(
                        "width", size).attr("height", size).attr("rx", 10).attr("ry", 10)
            }

            shape.style(
                "stroke",
                function (d) {
                    return "000";

                })

                .style(
                    "fill",
                    function (d) {
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
        points.append("text").attr("x", function (d) {

            if (displayType == "textBox")
                return (d.w / 2);
        }).attr("dy", function (d) {
            if (displayType == "textBox")
                return 20;
            return ".35em"
        })
            .text(function (d) {
                if (d.label > labelMaxSize)
                    return d.label.substring(0, labelMaxSize) + "..."
                return d.label;
            })
            .attr("text-anchor", function (d) {
                if (displayType == "textBox")
                    return "middle";
                return "left"
            })

            .style("fill", function (d) {
                if (d.textColor) return d.textColor;
                return "black"
            })
            .style("font-weight", function (d) {
                if (d.textBold) return "bold";
                return "normal"
            })
            // .style("font-size", "10px")
            .attr("class", "radarPointLabel");

        points.attr("transform", function (d) {
            // d.x=-d.x/2;d.y=-d.y/2;
            return "translate(" + d.x + "," + d.y + ")";
        });


        hoverRect = svgGraph.append("rect").attr("x", 100).attr("y", 100).attr(
            "width", 100).attr("height", 20).attr("rx", 10).attr("ry", 10)
            .style("fill", "FFF78C").attr("visibility", "hidden").style(
                "opacity", 1);
        hoverText = svgGraph.append("text").attr("x", 100).attr("y", 100).attr(
            "dy", ".35em").text("ABBBBBA").attr("class", "textHover").style(
            "fill", "black").attr("visibility", "hidden").style("font-weight",
            "bold");
        // **************************DragRect************************

        var dataRect = [{
            x: 1,
            y: 1,
            w: 2,
            h: 2,

        }];
        dragRect = svgGraph.selectAll().data(dataRect).enter().append("rect").attr("width", function (d) {
            return d.w;
        }).attr("height", function (d) {
            return d.h;
        }).attr("x", function (d) {
            return d.x;
        }).attr("y", function (d) {
            return d.y;
        }).style("z-index", 100).style("stroke", "black").style("fill", "transparent").attr("class", "dragRect");

        var str = "";

        var dragPoints = d3.behavior
            .drag()
            .on("dragstart", function (d, x, y) {
                initZoneDrag(d);
                hoverHide()

            })
            .on("drag", function (d, sx, sa, sy, sz) {
                isDragging = true;
                if (isReadOnly) {
                    return;
                }
                if (isResizing) {


                    // oldRect =d;
                    var rect = dragRect.datum();
                    if (rect) {
                        /*
                         * var evtX = d3.event.sourceEvent.layerX; var evtY =
                         * d3.event.sourceEvent.layerY; // console.log(evtX+" :
                         * "+evtY); var newWidth = evtX - rect.x; var newHeight =
                         * evtY - rect.y;
                         */
                        var newWidth = round(d3.event.x - rect.x);
                        var newHeight = round(d3.event.y - rect.y);
                        if (newWidth > 0 && newHeight > 0) {


                            d3.select(".dragRect").datum().w = newWidth;
                            d3.select(".dragRect").datum().h = newHeight;
                            d3.select(".dragRect").attr("width", newWidth).attr("height", newHeight);

                        }
                    }


                } else {

                    var x = round(d3.event.x - dragDx);
                    var y = round(d3.event.y - dragDy);

                    d3.select(this).datum().x = x;
                    d3.select(this).datum().y = y;
                    d3.select(this).attr("transform", function (d) {

                        return "translate(" + x + "," + y + ")";
                    });
                }

            })
            .on(
                "dragend",
                function (d, sx, sa, sy, sz) {
                    var item = null;

                    if (isReadOnly) {
                        return;
                    }
                    var newWidth = 1;
                    var newHeight = 1;
                    var coefX = 1;
                    var coefY = 1;

                    var x;
                    var y;
                    var changePointOK = false;
                    if (isResizing) {
                        x = d.x;
                        y = d.y;
                        var rect = dragRect.datum();
                        if (rect) {
                            newWidth = parseInt(rect.w);
                            newHeight = parseInt(rect.h);
                            if (newWidth < minTextBoxSize)
                                newWidth = minTextBoxSize;
                            if (newHeight < minTextBoxSize)
                                newHeight = minTextBoxSize;
                            changePointOK = true;
                            d3.select(".dragRect").datum().w = 0;
                            d3.select(".dragRect").datum().h = 0;
                            d3.select(".dragRect").datum().x = 0;
                            d3.select(".dragRect").datum().y = 0;
                            d3.select(".dragRect").attr("width", 0).attr("height", 0).attr("x", 0).attr("y", 0);


                        }


                    }
                    else {

                        x = d.x;// -dragDx;
                        y = d.y;// -dragDy;
                        var changePointOK = true;
                    }


                    var fieldJson = {};


                    // for(var i=0;i<selection.length;i++){
                    // var shape=d3.select(selection[i]);
                    var shape = d3.select(this);

                    if (isResizing) {
                        changePointOK = true;
                        shape.datum().w = newWidth;// le groupe
                        shape.datum().h = newHeight;
                        shape.attr("width", newWidth).attr("height", newHeight);

                        shape = d3.select(this).selectAll(".shape");// le
                        // rectangle
                        shape.attr("width", newWidth).attr("height", newHeight);

                        fieldJson.w = newWidth
                        fieldJson.h = newHeight;
                    } else {
                        if (!changePointOK) {
                            x = oldX;
                            y = oldY;
                        }

                        shape.datum().x = x;
                        shape.datum().y = y;
                        fieldJson.x = x
                        fieldJson.y = y;
                        shape.attr("x", x).attr("y", y);
                        shape.attr("transform", function (d) {
                            return "translate(" + x + "," + y + ")";
                        });
                    }
                    if (item) {// point changé de quadarant et OK
                        fieldJson[xfield] = item[xfield];
                        fieldJson[rfield] = item[rfield];
                        fieldJson.excluded = item.excluced;
                    }
                    if (changePointOK) {
                        /*
                         * proxy_updateItemFields(dbName, collectionName, { id :
                         * d.id }, fieldJson); setMessage("<font color=green>move
                         * saved</font>");
                         */

                    }


                    for (var i = 0; i < d.relsOut.length; i++) {
                        var id = d.relsOut[i].id;
                        var target = d3.select("#L_" + id).datum().target;
                        // path=[ {x:d.x,y:d.y},{x:target.x,y:target.y}]


                        var path = [
                            {x: d.x + (d.w / 2), y: d.y + (d.h / 2)},
                            {x: target.x + (target.w / 2), y: target.y + (target.h / 2)}
                        ]


                        d3.select("#path_" + id).attr("d", lineFunction(path))
                    }
                    for (var i = 0; i < d.relsIn.length; i++) {
                        var id = d.relsIn[i].id;
                        var source = d3.select("#L_" + id).datum().source;
                        target
                        path = [{x: source.x, y: source.y}, {x: d.x, y: d.y}]
                        var path = [
                            {x: source.x + (source.w / 2), y: source.y + (source.h / 2)},
                            {x: d.x + (d.w / 2), y: d.y + (d.h / 2)}
                        ]
                        d3.select("#path_" + id).attr("d", lineFunction(path))
                    }

                    savelabelCoordinates(d);


                    $(graphDiv).css('cursor', 'default');
                    isDragging = false;
                    isResizing = false;
                    d3.select(".dragRect").style("visibility", "hidden");
                    selection = [];
                }
            );

        d3.selectAll(".pointsRadar").call(dragPoints);
        points.on("mouseover", function (node) {
            if (displayType && displayType == "textBox") {

            }
            overCircle(node);
            return true;
        }).on("mouseout", function (node) {
            if (displayType && displayType == "textBox") {
                outCircle(node);
            }

            return true;
        });


    }


    function isPositionOk() {
        return true;

    }


// Define the zoom function for the zoomable tree
    function zoom() {
        svgGraph.attr("transform", "translate(" + d3.event.translate + ")scale("
            + d3.event.scale + ")");
    }

    function overCircle(node) {
        for (var i = 0; i < node.relsOut.length; i++) {
            var id = node.relsOut[i].id;
            d3.select("#L_" + id).style("opacity", 1);
            d3.select("#L_" + id).select("text").style("stroke", "purple");
            d3.select("#L_" + id).select("path").style("stroke", "purple");


        }
        for (var i = 0; i < node.relsIn.length; i++) {
            var id = node.relsIn[i].id;
            d3.select("#L_" + id).style("opacity", 1);
            d3.select("#L_" + id).select("text").style("stroke", "green");
            d3.select("#L_" + id).select("path").style("stroke", "green");
        }

    }

    function outCircle(node) {
        var xxx = d3.select(".link");

        links.each(function (d) {

            d3.select("#L_" + d.id).style("opacity", minOpacity);
            d3.select("#L_" + d.id).select("text").style("stroke", null);
            d3.select("#L_" + d.id).select("path").style("stroke", "brown");

        });

    }

    function hoverShow(x, y, text) {
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

    function hoverHide() {
        // return;
        /*
         * hoverRect.attr("visibility", "hidden"); hoverText.attr("visibility",
         * "hidden");
         */
    }

    function popupShow(x, y, text) {
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

    function popupHide() {
        // return;
        $("radarHoverPopup").css("visibility", "hidden");
        $("radarHoverPopup").css("visibility", "hidden");
    }

    function overPath(link) {
        var p = getMiddlePoint({
            x: link.source.x,
            y: link.source.y
        }, {
            x: link.target.x,
            y: link.target.y
        });
        hoverShow(p.x, p.y, "" + link.target.relType);

    }

    function clickBackground() {
        hoverHide();
    }

    function dblclickPoint(e) {
        // if (isDragging === false)
        // showRadarData(this.__data__);
        // getFormHTML(this.__data__);

    }

    function clickPoint(node) {

        var str = "";
        for (var i = 0; i < node.fields.length; i++) {
            if (i > 0)
                str += ","
            if (node.fields[i] != "subGraph")
                str += node.fields[i];
        }
        d3.select("#infoZone").text(node.label + " attributes : " + str);
    }

    function onLabelInfoClick(d) {

    }

    function setRadarPointsVisbility() {
        d3.selectAll(".pointsRadar").attr("visibility", function (d, i) {

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

    function drawLegendD3(data) {

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
                svgGraphLegend.append("text").attr("x", function (d) {
                    return 18;
                }).attr("dy", ".35em").text(d.type).attr("transform",
                    "translate(" + xLabel + "," + yLegendOffset + ")").attr(
                    "class", "legendType");
                yLegendOffset += 20;
            }

            svgGraphLegend.append("circle").attr("cx", xShape).attr("cy",
                yLegendOffset).attr("r", function () {
                if (d.size)
                    return d.size + "px";
                return 8;
            }).style("fill", function () {
                if (d.color)
                    return d.color;
                return "eee";
            }).style("stroke", "bbb");

            svgGraphLegend.append("text").attr("x", xLabel)
                .attr("y", yLegendOffset).text(function () {
                var str = "";
                str += d.label;
                return str;
            }).style("fill", "black").attr("class", "radarPointLabel");

            yLegendOffset += 20;

        }
        ;

    }

    function drawLegendD3Old(data) {
        // console.log(JSON.stringify(data));
        var x = 15;

        // var points =
        // svgGraph.selectAll("g").data(data).enter().append("svg:g").on("click",
        // click);
        points = svgGraphLegend.selectAll(".pointsLegend").data(data).enter()
            .append("svg:g").on("click", clickLegend).attr("class",
                "pointsLegend").attr("id", function (d) {
                return "P_" + d.label;
            });

        points.append("circle").attr("cx", 0).attr("cy", 0)
        /*
         * .attr("stroke", "007") .attr("stroke-width", 1)
         */
            .attr("r", function (d) {

                var size = d.size;
                if (size)
                    size = d.size.value
                else
                    size = 10;
                // y += size + 10;
                return size;
            })

            .style("fill", function (d) {
                var color = d.color;
                if (color)
                    return color.value;
                return "eee";
            }).style("stroke", "bbb");

        points.append("text").attr("x", function (d) {
            return 18;
        }).attr("dy", ".35em").text(function (d) {
            var str = "";
            str += d.label.value;

            return str;
        }).style("fill", "black").attr("class", "radarPointLabel"); // .style("font-size",
        // "10px");

        points.attr("transform", function (d) {
            // d.x=-d.x/2;d.y=-d.y/2;
            yLegendOffset += 20;
            return "translate(" + x + "," + yLegendOffset + ")";
        });

    }

    function drawLegendType(type) {
        var x = 5;
        yLegendOffset += 20;
        if (svgGraphLegend == null) {

            $("#legend").html("");
            // d3.select("svg").selectAll("*").remove();
            svgGraphLegend = d3.select("#legend").append("svg").attr("width", 200)
                .attr("height", 300);
        }

        svgGraphLegend.append("text").attr("x", function (d) {
            return 18;
        }).attr("dy", ".35em").text(type).attr("transform",
            "translate(" + x + "," + yLegendOffset + ")").attr("class",
            "legendType");

    }

    function clickLegend2(e) {
        var id = this.__data__.enumId.value;
        var currentEnum = radarXmls[radarModelName].Xml_getEnumeration(id);
        setMessage("legendId :" + currentEnum.label + " : " + !currentEnum.checked);
        showRightFilterDialog(id);

    }

    function forcePointColor(nodeIds, color_) {
        var colorField = radarXmls[radarModelName].XML_getFieldForRole("color");
        svgGraph.selectAll(".pointsRadar")
            .each(function (d) {
                if (false) {
                    d3.select(this).select(".shape").style("fill", function (d) {
                        if ($.inArray(d.id, nodeIds) > -1) {
                            return color_;
                        }
                        else {
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

                d3.select(this).select(".shape").style("stroke", function (d) {
                    if ($.inArray(d.id, nodeIds) > -1) {
                        return color_;
                    }
                    else {

                        return "black";
                    }
                })
                    .style("stroke-width", function (d) {
                        if ($.inArray(d.id, nodeIds) > -1) {
                            return "2px";
                        }
                        else {

                            return "1px";
                        }
                    });
                d3.select(this).style("opacity", function (d) {
                    if ($.inArray(d.id, nodeIds) > -1) {
                        return 1;
                    }
                    else if (d.textBold)
                        return .8;
                    else {

                        return 0.2;
                    }
                });

            });


    }

    function resetAllPointsOpacity(opacity) {
        d3.selectAll(".pointsRadar").style("opacity", function (d) {
            return opacity;
        });

    }

    function updateRadarPoint(node) {
        var sizeField = radarXmls[radarModelName].XML_getFieldForRole("size");
        var colorField = radarXmls[radarModelName].XML_getFieldForRole("color");


        var points = svgGraph
            .selectAll(".pointsRadar")
            .each(function (d) {
                if (d.id == node.id || d.id == node) {


                    d3.select(this)
                        .select(".shape")
                        .attr(
                            "r",
                            function (d) {
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
                            function (d) {
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

    function getRadarImg() {
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

    function initZoneDrag(zone) {
        var evtX = d3.event.sourceEvent.layerX;
        var evtY = d3.event.sourceEvent.layerY;

        dragDx = evtX - zone.x;
        dragDy = evtY - zone.y;
        dragDx=svgX;
        dragDy=svgY;

        oldX = zone.x;
        oldY = zone.y;
        hoverHide();
        isResizing = false;
        console.log("-------Resizing init " + zone.x + "  : " + zone.y);
        // var displayType=radarXmls[radarModelName].displayType
        if (displayType && displayType == "textBox") {


            var oldX2 = zone.x + zone.w;
            var oldY2 = zone.y + zone.h;
            // var evtX = d3.event.sourceEvent.offsetX;
            // var evtY = d3.event.sourceEvent.offsetY;

            console.log(JSON.stringify(d3.event.sourceEvent));
            console.log(oldX2 - resizeSquare);
            console.log(oldY2 - resizeSquare);


            d3.select(".dragRect").datum().w = zone.w;
            d3.select(".dragRect").datum().h = zone.h;
            d3.select(".dragRect").datum().x = zone.x;
            d3.select(".dragRect").datum().y = zone.y;

            d3.select(".dragRect").attr("x", zone.x).attr("y", zone.y);
            if (evtX > (oldX2 - resizeSquare) && evtY > (oldY2 - resizeSquare)) {
                isResizing = true;
                $(graphDiv).css('cursor', 'default');
                d3.select(".dragRect").style("visibility", "visible");

            } else {
                isResizing = false;
                $(graphDiv).css('cursor', 'default');
                d3.select(".dragRect").style("visibility", "hidden");
            }
        }

    }

    function round(value) {
        return Math.round(value / 5) * 5;
    }

    function getSVG(collectionName, id) {
        var svg = $("#graphDiv").html();
// var svg1=d3.select("svg").html();
// var svg2=d3.selectAll(svgGraph).html();
// svg='<svg xmlns="http://www.w3.org/2000/svg" width="860"
// height="560">'+svg+'</svg>';
        svg = svg.replace(/&nbsp;/, "");
        svg = svg.replace(/fill: transparent;/, "");
        return svg;
    }

    function setRadarLabel(label, className) {
        var xx = d3.selectAll("." + className).text(label);

    }


    function savelabelCoordinates(d) {


        query = "action=updateOrCreateMongoObj";

        var data = {

            dbName: "graphAdmin",
            collectionName: "labelsCoordinates",
            updateOrCreate: 1,
            query: JSON.stringify({
                subGraph: d.subGraph,
                label: d.label
            })

            ,
            data: JSON.stringify({
                subGraph: d.subGraph,
                label: d.label,
                x: d.x,
                y: d.y,
                w: d.w,
                h: d.h
            })

        };
        //submitMongo(query, data);
        callMongo("", data, function (data) {
        });


    }

    function loadLabelsCoordinates(subGraph, labelsMap, callback) {

        callback();
        return;

        var data = {
            find: 1,
            dbName: "graphAdmin",
            collectionName: "labelsCoordinates",
            mongoQuery: JSON.stringify({
                subGraph: subGraph,
            })

        };
        //callMongo(query, data, function(d){
        callMongo("", data, function (data) {
            for (var i = 0; i < data.length; i++) {
                var objCoords = data[i];
                var objLabel = labelsMap[objCoords.label];
                if (objLabel) {
                    labelsMap[objCoords.label].x = objCoords.x;
                    labelsMap[objCoords.label].y = objCoords.y;
                    labelsMap[objCoords.label].w = objCoords.w;
                    labelsMap[objCoords.label].h = objCoords.h;

                }
            }

            callNeoMatch(" MATCH (n) where n.subGraph=\"" + subGraph + "\" RETURN DISTINCT  LABELS(n) as label, COUNT(n) as count", null, function (stats) {
                for (var j = 0; j < stats.length; j++) {
                    var statObj = stats[j];
                    var objLabel = labelsMap[statObj.label];
                    if (objLabel) {
                        labelsMap[statObj.label].label = labelsMap[statObj.label].label + " (" + statObj.count + ")";
                    }

                    callback();
                }
            });

        });
    }


    function resetLabelsPosition() {


    }


}











