var d3graphCreation = (function () {
        var self = {};

        var self = {};
        self.graphDiv = "#graphDiv";
        var svgGraph = null;
        var nodesMap = {};
        var relationsMap = {};

        var idNode = 10000;
        var idRel = 10000;
        self.data = {nodes: [], rels: []};
        self.isDrawingRel = false;


        var svgInited = false;


        var getNewId = function () {
            return Math.round(Math.random() * 10000000);
        }

        var lineFunction = d3.svg.line()
            .x(function (d) {
                return d.x;
            })
            .y(function (d) {
                return d.y;
            })
            .interpolate("linear");


        self.initGraph = function (graphDiv, force) {
            idNode = 10000;
            idRel = 10000;
            if (graphDiv)
                self.graphDiv = graphDiv;

            if (svgInited && !force)
                return;

            svgInited = true;

            $(self.graphDiv).html("");
            var w = $(self.graphDiv).width();
            var h = $(self.graphDiv).height();
            var svgX = $(self.graphDiv).position().x;
            var svgY = $(self.graphDiv).position().y;
            d3.select("svg").selectAll("*").remove();
            svgGraph = d3.select(self.graphDiv).append("svg").attr("width", w).attr(
                "height", h);


        }

        self.addNode = function (label, properties) {
            if (!properties.name)
                properties.name = properties.nom;
            properties.labelNeo = label;
            self.data.nodes.push(self.getD3Node(label, properties));
            self.draw(self.data);
        }

        self.addRelation = function (relation) {
            self.data.rels.push(self.getD3Rel(relation));
            self.draw(self.data);
        }


        self.getD3Node = function (label, neoNode) {

            var x0 = 100;
            var y0 = 100;

            var color = nodeColors[label];

            var obj = {
                id: idNode,
                label: label,
                name: neoNode[Gparams.defaultNodeNameProperty],
                w: 100,
                h: 30,

                shape: "circle",
                size: 0,
                color: "grey",
                relsIn: [],
                relsOut: [],
                subGraph: subGraph,
                color: color,
                //   fields: labels[key]
            }

            x0 += 20;
            y0 += 20;


            nodesMap[idNode] = obj;
            idNode++;
            return obj;


        }
        self.getD3Rel = function (relation) {

            var id = 1000000000000;

            var obj = {
                id: id,
                source: nodesMap[relation.startNode.id],
                target: nodesMap[relation.endNode.id],
                type: relation.type,
                direction: relation.direction,
                properties: relation.properties,

            }
            if (nodesMap[relation.startLabel])
                nodesMap[relation.startLabel].relsOut.push(obj);
            if (nodesMap[relation.endLabel])
                nodesMap[relation.endLabel].relsIn.push(obj);


            relationsMap[id] = obj;

            id++;
            return obj;
        }

        self.setLabelsCoordinates = function () {// randomize position
            var w = $(self.graphDiv).width() / 2;
            var h = $(self.graphDiv).height() / 2;


            for (var key in nodesMap) {
                var node = nodesMap[key];
                if (!node.x || !node.y) {


                    var xSign = Math.round(Math.random()) * 2 - 1;
                    var ySign = Math.round(Math.random()) * 2 - 1;
                    x = (Math.round(Math.random() * 100000000 / 100000000 * (w - 50)) * xSign) + w;
                    y = (Math.round(Math.random() * 100000000 / 100000000 * (h - 50)) * ySign) + h;
                    node.x = x;
                    node.y = y;
                }


            }
        }


        self.processRelCreation = function (startNode, x, y) {
            var xxx = data
            svgGraph.selectAll(".node").each(function (d) {
                var node = this;

                /*  var aX1 = parseInt(node.attributes.x.value);
                  var aY1 = parseInt(node.attributes.y.value);*/
                var aX1 = d.x;
                var aY1 = d.y;
                var aX2 = aX1 + d.w;
                var aY2 = aY1 + d.h;
                startNode.labelNeo = startNode.label;
                d.labelNeo = d.label;
                if (x > aX1 && x < aX2 && y > aY1 && y < aY2) {
                    toutlesensController.currentRelationData = {sourceNode: startNode, targetNode: d}
                    mainMenu.showCreateRelationDialog();

                }
                svgGraph.selectAll(".relCreationLine").remove();


            })


        }


        self.draw = function (data) {
            $(self.graphDiv).html("");
            var w = $(self.graphDiv).width();
            var h = $(self.graphDiv).height();
            var svgX = $(self.graphDiv).position().x;
            var svgY = $(self.graphDiv).position().y;
            d3.select("svg").selectAll("*").remove();
            svgGraph = d3.select(self.graphDiv).append("svg").attr("width", w).attr(
                "height", h);

            links = svgGraph.selectAll(".link").data(data.rels).enter().append("svg:g", "link").attr("id", function (d) {
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
                    .style("stroke-width", 3)
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


            points = svgGraph.selectAll(".node").data(data.nodes).enter().append(
                "svg:g").on("dblclick", dblclickPoint).on("click", clickPoint)
                .attr("class", "node").attr("id", function (d) {
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

            /*   points.attr("transform", function (d) {
                   // d.x=-d.x/2;d.y=-d.y/2;
                   return "translate(" + d.x + "," + d.y + ")";
               });*/

            var dragPoints = d3.behavior
                .drag()
                .on("dragstart", function (d, x, y) {
                    //  initZoneDrag(d);
                    //   hoverHide()

                    if (d3.event.sourceEvent.ctrlKey) {
                        var x = d3.event.sourceEvent.offsetX;
                        var y = d3.event.sourceEvent.offsetY;
                        var line = [{x: x, y: y}];
                        self.isDrawingRel = svgGraph.selectAll(".relCreationLine").data(line).enter().append("line")
                            .style("stroke", "black")  // colour the line
                            .attr("x1", x)     // x position of the first end of the line
                            .attr("y1", y)      // y position of the first end of the line
                            .attr("x2", x)     // x position of the second end of the line
                            .attr("y2", y);
                        return;


                    } else {
                        self.isDrawingRel = null;
                    }

                })
                .on("drag", function (d, sx, sa, sy, sz) {
                    isDragging = true;
                    if (false && isReadOnly) {
                        return;
                    }

                    if (self.isDrawingRel) {
                        var x = round(d3.event.x);
                        var y = round(d3.event.y);
                        self.isDrawingRel.attr("x2", x)
                        self.isDrawingRel.attr("y2", y)
                        return;

                    }
                    else {
                        var x = round(d3.event.x);
                        var y = round(d3.event.y);

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

                        if (self.isDrawingRel) {
                            var x = d3.event.sourceEvent.offsetX;
                            var y = d3.event.sourceEvent.offsetY;
                            self.processRelCreation(d, x, y);
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


                        $(self.graphDiv).css('cursor', 'default');
                        isDragging = false;
                        isResizing = false;
                        d3.select(".dragRect").style("visibility", "hidden");
                        selection = [];
                    }
                );

            d3.selectAll(".node").call(dragPoints);
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
            var str = data.source.label + "-[" + data.type + "]->" + data.target.label;
            $("#currentRelationDiv").html(str);

        }


        function clickPoint(data) {
            self.currentLabel = data.label;
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
                var str = rel.startLabel + "-[" + type + "]->" + rel.endLabel;
                $("#currentRelationDiv").html(type);
                self.drawNeoModel(self.subGraph, true, true)
                self.currentNodeData = null;
                self.currentRelationData = rel;

            } else {

                //   clearSelectOptions("#propertiesSelect");

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
                        $(self.graphDiv).css('cursor', 'default');
                        d3.select(".dragRect").style("visibility", "visible");

                    } else {
                        isResizing = false;
                        $(self.graphDiv).css('cursor', 'default');
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

            Schema.schema.relations[name] = Schema.schema.relations[self.currentRelationData.name];
            delete Schema.schema.relations[self.currentRelationData.name];
            Schema.schema.relations[name].name = name;
            Schema.schema.relations[name].type = type;
            var str = Schema.schema.relations[name].startLabel + "-[" + type + "]->" + Schema.schema.relations[name].endLabel;
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

    }
)
()