/**
 * Created by claud on 23/11/2017.
 */
var paint = (function () {
        var self = {};
        self.colorsPalette;
        self.currentColor = "";
        self.currentLabel;
        self.currentRelType;
        self.currentNodes;

        self.initialNodesattrs = {};
        self.initialLinksattrs = {};
        self.currentBIproperty = null;
        var currentAction = "";

        var clickedLegendItem = false;
        var scale;
        var domain;
        var scaleType;
        var ticksColors = [];
        var currentLabelSize = 18;
        var currentLabelSized = "";
        var currentClusterProperty;

        var ordinalLegendMap = {}


        /* self.init = function (data) {
             var labels = []
             for (var i = 0; i < data.length; i++) {
                 var filterObj = data[i];
                 for (var k = 0; k < filterObj.labels.length; k++) {
                     var label = filterObj.labels[k][0];

                     if (labels.indexOf(label) < 0)
                         labels.push(label);

                 }

             }
             labels.splice(0, 0, "");
             common.fillSelectOptionsWithStringArray(paintDialog_labelSelect, labels);
             common.fillSelectOptionsWithStringArray(paint_showNodeNamesForLabelSelect, labels);
             filters.initLabelProperty("", paintDialog_propertySelect);
             $("#paintDialog_propertySelect").val(Schema.getNameProperty())
             self.initColorsPalette(10, "paintDialogPalette");
             self.onActionTypeSelect("outline")
             $("#paintDialog_valueInput").css("visibility", "visible");
             $("#paintDialog_operatorSelect").css("visibility", "visible")
         }*/


        self.showPaintDialog = function (label, relType) {
            self.currentLabel = label;
            self.currentRelType = relType;


            // $( "#dialog" ).css("left",totalWidth-350);
            // $( "#dialog" ).css("top",100);
            //   $("#dialog").dialog("option", "title", "Graph paint attributes");
            $("#dialog").html("");
            //  $("#dialog").css("font-size","12px");
            /*   $("#dialog").height(200);
               $("#dialog").width(150);*/

            $("#dialog").load("htmlSnippets/paintDialog.html", function () {
                // $("#paintDiv").load("htmlSnippets/paintDialog.html", function () {
                //   $("#filtersDiv").css("visibility", "hidden")
                if (true || label) {


                    //  filters.initLabelProperty(label, paintDialog_propertySelect);
                    $("#paintDialog_clusterNodesButton").css("visibility", "visible");
                    $("#paintDialogTypeSpan").html("Node label :" + label)
                }
                else {

                    $("#paintDialog_clusterNodesButton").css("visibility", "hidden")
                    filters.initRelationProperty(relType, paintDialog_propertySelect);
                    $("#paintDialogTypeSpan").html("Relation type :" + relType)
                }
                paint.initColorsPalette(10, "paintDialogPalette");
                $("#dialog").dialog({
                    modal: false
                });


                if (paintDialog_propertySelect.options.length < 1)
                    $("#paintDialogClassesButton").css("visibility", "hidden")
                $("#dialog").dialog("open");

            });
        }

        self.closePaintDialog = function () {
            $("#filtersDiv").css("visibility", "visible");
            $("#paintDiv").css("height", 0);
            $("#paintDiv").html("");

        }

        self.initColorsPalette = function (length, divId) {
            $("#" + divId).html("");
            self.colorsPalette = d3.scale.linear().domain([1, length]).interpolate(d3.interpolateHcl).range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);
            for (var i = 0; i < length; i++) {
                var color = self.colorsPalette(i);
                $("#" + divId).append("<div style='background-color:" + color + ";' class='colorPaletteSquare'>");
            }
            $(".colorPaletteSquare").on("click", function (e) {
                var xxx = this;
                self.currentColor = $(this).css("background-color");
                self.paintAll();
            })


        }
        self.setColor = function (index) {
            self.currentColor = self.colorsPalette(index);
        }


        self.showBIdialog = function () {
            $("#dialog").css("visibility", "visible");
            $("#dialog").load("htmlSnippets/BIdialog.html", function () {
                $("#dialog").dialog("option", "title", "Outline Properties");
                $("#dialog").dialog({modal: false});
                $("#dialog").dialog("open");
            });
        }

        self.paintClasses = function (_property) {
            ordinalLegendMap = {};
            var nClasses = parseInt($("#paintDialog_NclassesInput").val());
            var size = parseInt($("#paintDialog_circleRadiusInput").val() * 2);
            var property = "";
            if (_property)
                var property = _property;

            self.currentBIproperty = property;


            function getData() {
                var data = []
                if (true || searchMenu.currentAction.indexOf("graph") > -1) {
                    $("#paint_unClusterButton").css("visibility", "visible");
                    $("#paint_clusterButton").css("visibility", "visible");
                    self.unClusterByClass();
                    var allGraphNodes = visjsGraph.nodes.get();
                    for (var i = 0; i < allGraphNodes.length; i++) {
                        var nodeData = allGraphNodes[i];
                        if (nodeData.neoAttrs) {
                            var value = nodeData.neoAttrs[property];
                            if (value)
                                data.push({id: nodeData.id, value: value});
                        }
                    }


                }

                else if (searchMenu.currentAction.indexOf("treeMap") > -1) {
                  //  var xx = d3.selectAll(".child").select("rect")
                    d3.selectAll(".leafGroup").each(function (d) {
                        if (d.neoAttrs[self.currentBIproperty]) {
                            data.push({id:"R_"+ d.neoAttrs.id, value:  d.neoAttrs[self.currentBIproperty]});
                        }

                    });

                }
                return data;
            }


            var data = getData();


            if (data.length == 0)
                return;
            var allGraphNodes = visjsGraph.nodes.get();
            if (property == "" && self.currentBIproperty) {


                $("#BIlegendDiv").html("").css("visibility", "hidden");
                $("#paint_unClusterButton").css("visibility", "hidden");
                $("#paint_clusterButton").css("visibility", "hidden");
                var targetNodes = [];

                for (var i = 0; i < allGraphNodes.length; i++) {
                    targetNodes.push({
                        id: "" + allGraphNodes[i].id,
                        color: allGraphNodes[i].initialColor,
                        shape: Gparams.graphDefaultShape,
                        hidden: false
                    });

                }

                visjsGraph.nodes.update(targetNodes);
                return;
            }


            $("#BIlegendDiv").html("").css("visibility", "visible");
            $("#paint_unClusterButton").css("visibility", "visible");
            $("#paint_clusterButton").css("visibility", "visible");

            ticksColors = [];


            var min = d3.min(data, function (d) {
                return d.value;
            });
            var max = d3.max(data, function (d) {
                return d.value;
            });


            var palettes = [
                [], [], [],
                ["#fc8d59", "#ffffbf", "#91cf60"],
                ["#d7191c", "#fdae61", "#a6d96a", "#1a9641"],
                ["#d7191c", "#fdae61", "#ffffbf", "#a6d96a", "#1a9641"],
                ["#d73027", "#fc8d59", "#fee08b", "#d9ef8b", "#91cf60", "#1a9850"],
                ["#d73027", "#fc8d59", "#fee08b", "#ffffbf", "#d9ef8b", "#91cf60", "#1a9850"],
                ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850"],
                ["#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850"],
                ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"],
                ["#a50026", "#d73027", "#f46d43", "#fdae61", "#fee08b", "#ffffbf", "#d9ef8b", "#a6d96a", "#66bd63", "#1a9850", "#006837"],

            ]
            var palette = palettes[nClasses];
            // var palette=["#9e0142","#d53e4f","#f46d43","#fdae61","#fee08b","#ffffbf","#e6f598","#abdda4","#66c2a5","#3288bd","#5e4fa2"]
            //  var palette = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

            if (common.isNumber(data[0].value)) {
                scaleType = "linear"
                domain = d3.scaleLinear().domain([min, max]).nice().range([0, nClasses]);
                if (false && d3.scaleLinear)
                    scale = d3.scaleLinear().domain().interpolator(d3.interpolateRainbow);
                else
                    scale = d3.scaleQuantize().domain([min, max]).nice().range(palette);
            }
            else {
                if (false && d3.scalePoint)
                    domain = d3.scalePoint().domain(data).range([0, palette.length]);
                else
                    domain = d3.scaleOrdinal().domain(data).range([0, palette.length]);
                scaleType = "ordinal"
                scale = d3.scaleOrdinal().domain(data).range(palette);
            }


            var colorClasses = {};
            var allIds = [];
            var targetNodes = [];
            var targetIds = [];
            var shapes = ["dot", "diamond", "triangle", "trangleDown", "square", "star"];
            var shapeIndex = 0;
            var size = 10;
            for (var i = 0; i < data.length; i++) {


                allIds.push("" + data[i].id)
                var color;
                if (scaleType == "ordinal") {
                    color = scale(data[i].value);
                    color = self.rgb2hex(color);

                }
                else {
                    var index = Math.round(domain(data[i].value));
                    //   color = palette[index];
                    color = scale(data[i].value);
                    color = self.rgb2hex(color);
                }
                //   console.log(data[i].value+"  "+color)
                if (!color) {
                    color = "#333";
                }
                if (!ordinalLegendMap[data[i].value])
                    ordinalLegendMap[data[i].value] = color;

                targetIds.push("" + data[i].id);
                targetNodes.push({id: "" + data[i].id, color: color, size: size, shape: "dot", hidden: false});
                if (false && i % nClasses == 0)
                    shapeIndex += 1


            }

            if (searchMenu.currentAction.indexOf("graph") > -1) {
                var neutralColor = "#eee";
                var neutralSize = 3;
                var neutralShape = "square";

                for (var i = 0; i < allGraphNodes.length; i++) {
                    var id = allGraphNodes[i].id;
                    if (targetIds.indexOf("" + id) < 0) {
                        targetNodes.push({
                            id: "" + id,
                            color: neutralColor,
                            size: neutralSize,
                            shape: neutralShape,
                            hidden: false
                        });
                    }
                }


                visjsGraph.nodes.update(targetNodes);
                $("#paint_clusterButton").css("visibility", "visible")

            }
            else if (searchMenu.currentAction.indexOf("treeMap") > -1) {
               d3.selectAll(".leafGroup1").each(function (d) {
                      if (d.neoAttrs[self.currentBIproperty]) {
                          var index = targetIds.indexOf("R_" + d.neoAttrs.id);
                          if (index > -1) {
                              var xx=   this;
                              var xx2=    d3.selectAll(this).select("rect");
                             // $("#R_" + d.neoAttrs.id).css("color",targetNodes[index].color)
                             // $("#R_" + d.neoAttrs.id+" .parent").css("fill",targetNodes[index].color)
                             // d3.selectAll("#R_" + d.neoAttrs.id).style("fill", targetNodes[index].color);
                             // d3.select(this).style("fill", targetNodes[index].color);
                               d3.select(this).select("rect").style("fill", targetNodes[index].color);
                          }
                      }

                  });
                d3.selectAll(".leafGroup").each(function (d) {
                    if (d.neoAttrs[self.currentBIproperty]) {
                        var index = targetIds.indexOf("R_" + d.neoAttrs.id);
                        if (index > -1) {
                            var xx=   this;
                            var xx2=    d3.selectAll(this).select("rect");
                            // $("#R_" + d.neoAttrs.id).css("color",targetNodes[index].color)
                            // $("#R_" + d.neoAttrs.id+" .parent").css("fill",targetNodes[index].color)
                            // d3.selectAll("#R_" + d.neoAttrs.id).style("fill", targetNodes[index].color);
                            // d3.select(this).style("fill", targetNodes[index].color);
                            d3.select(this).select("rect").style("fill", targetNodes[index].color);
                        }
                    }

                });
               /* for (var i = 0; i < targetNodes.length; i++) {
                    try {
                      //  console.log("#" + targetNodes[i].id);
                        var xx = d3.selectAll("#R_" + targetNodes[i].id).select("rect");
                        if (xx)
                            d3.selectAll("#" + targetNodes[i].id).select("rect").style("fill", targetNodes[index].color);
                    }
                    catch (e) {

                    }
                }*/


            }


            self.drawPaletteColorLegend(scale, domain, palette, nClasses);


        }


        self.drawPaletteColorLegend = function (scale, domain, palette, nClasses) {
            $("#BIlegendDiv").html("").css("visibility", "visible");

            var ticks;
            var type;

            if (domain.ticks) {
                type = "linear";
                ticks = domain.ticks(nClasses);
                ticks = scale.ticks(nClasses);
                for (var i = 0; i < ticks.length; i++) {
                    var color = scale(ticks[i]);
                    color = self.rgb2hex(color);
                    ticksColors.push({color: color, tick: ticks[i]});
                }
            }

            if (!ticks) {
                for (var key in ordinalLegendMap) {
                    ticksColors.push({color: ordinalLegendMap[key], tick: key});
                }
                /*  type = "ordinal";
                  ticks = scale.domain();

                  for (var i = 0; i < ticks.length; i++) {
                      var index = Math.round(domain(ticks[i] - 1));
                      color = scale(ticks[i]);
                      color = self.rgb2hex(color);
                      ticksColors.push({color: color, tick: ticks[i]});
                  }*/

            }

            var str = "<b>" + self.currentBIproperty + "<b></b><br><table style='font-size: 10px;font-weight: normal'>"
            var color;
            var shapes = ["dot", "diamond", "triangle", "trangleDown", "square", "star"];
            var shapeIndex = 0;
            for (var i = 0; i < ticksColors.length; i++) {
                var onClick = " onclick='paint.onLegendItemClick(\"" + ticksColors[i].tick + "\")'";

                str += "<tr" + onClick + "><td><span  class='BIlegendSpan' id='BIlegendSpan_" + ticksColors[i].tick + "' style='background-color: " + ticksColors[i].color + ";width:20px;height: 20px'>&nbsp;&nbsp;&nbsp;</span></td><td>" + ticksColors[i].tick + "</td></tr>"

            }
            $("#BIlegendDiv").html(str);
            var left = (totalWidth - rightPanelWidth) - $("#BIlegendDiv").width() - 10
            $("#BIlegendDiv").css("left", left)


        }


        self.paintAll = function (option) {
            $("#graphPopup").css("visibility", "hidden");
            var nodeColor = null;
            var nodeR = null;
            var linkStroke = null;
            var linkStrokeWidth = null;
            if (!option)
                ;
            else if (option == "outline") {
                nodeColor = "#ddd";
                linkStroke = "#ddd";
            } else if (option == "initial") {// null values
            }


            var radius = $("#paintDialog_circleRadiusInput").val();
            var property = $("#propertiesSelectionDialog_propertySelect").val();
            var value = $("#propertiesSelectionDialog_valueInput").val();
            var filterObjectType = $("#propertiesSelectionDialog_ObjectTypeInput").val();
            var operator = $("#propertiesSelectionDialog_operatorSelect").val();
            var type = $("#propertiesSelectionDialog_NodeLabelInput").val();
            // self.currentLabel = $("#paintDialog_labelSelect").val();
            self.currentLabel = $("#propertiesSelectionDialog_NodeLabelInput").val();

            var legendStr = "";

            if (Gparams.useVisjsNetworkgraph) {
                var xxx = $("#propertiesSelectionDialog_ObjectTypeInput").val();
                if ($("#propertiesSelectionDialog_ObjectTypeInput").val() == "node") {

                    var ids = [];
                    for (var key in visjsGraph.nodes._data) {
                        var nodeData = visjsGraph.nodes._data[key];
                        if (value == "" && nodeData.labelNeo == self.currentLabel) {
                            ids.push(key);
                            legendStr = " All " + self.currentLabel;
                        }
                        else if (self.isLabelNodeOk(nodeData, property, operator, value, type)) {
                            ids.push(key);
                            legendStr = self.currentLabel + "." + property + "" + operator + "" + value;
                        }
                    }
                    visjsGraph.paintNodes(ids, self.currentColor, "#eee", radius);
                    legendStr = "<span style='background-color: " + self.currentColor + ";'>&nbsp;&nbsp;&nbsp;</span></td><td>" + legendStr + "</td></tr>"
                    /* $("#paintDiv").css("height", 100);
                     $("#paintDiv").html(legendStr);*/


                } else {// relation
                    var ids = [];
                    var relations = visjsGraph.visjsData.edges;

                    for (var i = 0; i < relations.length; i++) {
                        var relData = relations[i];
                        if (property == "" && relData.type == self.currentRelType) {
                            ids.push(relData.neoId);
                            legendStr = " All " + self.currentRelType;
                        }
                        else if (self.isLabelNodeOk(relData.neoAttrs, property, operator, value, type)) {
                            ids.push(relData.neoId);
                            legendStr = self.currentRelType + "." + property + "" + operator + "" + value;
                        }
                    }
                    visjsGraph.paintEdges(ids, self.currentColor, "#eee", radius);
                    legendStr = "<span style='background-color: " + self.currentColor + ";'>&nbsp;&nbsp;&nbsp;</span></td><td>" + legendStr + "</td></tr>"
                    /*   $("#paintDiv").css("height", 100);
                       $("#paintDiv").html(legendStr);*/
                    $("#BIlegendDiv").html(legendStr);


                }

                /*  self.applyInitialGraphObjectAttrs(nodeColor, nodeR, linkStroke, linkStrokeWidth);
                  d3.selectAll(".pointsRadar").select("circle").each(function (d) {

                      if (option == "outline" && self.isLabelNodeOk(d)) {
                          d3.select(this).style("fill", self.currentColor)
                          d3.select(this).style("r", r)
                      }

                  })*/

            }
            else if (self.currentRelType) {
                var strokeWidth = $("#propertiesSelectionDialog_strokeWidthInput").val()
                self.applyInitialGraphObjectAttrs(nodeColor, nodeR, linkStroke, linkStrokeWidth);
                d3.selectAll(".link").select("line").each(function (d) {
                    if (option == "outline" && self.isLabelNodeOk(d)) {
                        d3.select(this).style("stroke", self.currentColor)
                        d3.select(this).style("stroke-width", strokeWidth)
                    }

                })


            }

        }
        self.clearHighlight = function () {
            visjsGraph.paintNodes([], null, "#eee", 0);
        }

        self.isLabelNodeOk = function (data, property, operator, value, type) {

            if (type && (!value || value == "")) {
                if (data.labelNeo == type)
                    return true;
                return false;
            }

            if (property && property.length > 0) {


                if (!data.neoAttrs[property])
                    return false;


                var comparison;
                if (operator == "contains")
                    comparison = "\"" + data.neoAttrs[property] + "\".match(/.*" + value + ".*/i)";
                else {
                    if (common.isNumber(value))
                        value = value;
                    else
                        value = "'" + value + "'"
                    comparison = data.neoAttrs[property] + operator + value;
                }
                var result = eval(comparison)
                return result;


            } else {
                if (value && value.length > 0) {// we look for value in all properties

                    for (var key in data) {
                        if (self.isLabelNodeOk(data, key, operator, value, type)) {
                            return true;
                        }
                    }
                }
                else {// we look that type corresponds

                    if (data.labelNeo == type)
                        return true;
                }

            }
            return false;

        }


        self.onActionTypeSelect = function (action) {
            currentAction = action;
            if (action == "outline") {//outline
                //   $("#paintDialogAction").css("visibility", "visible");
                $("#paintDialogPaletteDiv").css("visibility", "visible");
                $("#paintDialogPropDiv").css("visibility", "visible");
                $("#paintDialog_classesDiv").css("visibility", "hidden");
                //   $("#paintDialog_GraphicAttrsDiv").css("visibility", "visible");


            }
            if (action == "cluster") {//cluster
                $("#paintDialogPaletteDiv").css("visibility", "hidden");
                $("#paintDialogPropDiv").css("visibility", "hidden");
                $("#paintDialog_GraphicAttrsDiv").css("visibility", "visible");
                visjsGraph.clusterByLabel();
            }

            if (action == "classes") {//classes
                var visibility = "visible";
                if ($("#paintDialog_propertySelect").val() == "")
                    visibility = "hidden";
                $("#paintDialog_classesDiv").css("visibility", visibility);
                $("#paintDialog_operatorSelect").css("visibility", "hidden");

                $("#paintDialogPropDiv").css("visibility", "visible");
                $("#paintDialogPaletteDiv").css("visibility", "hidden");
                $("#paintDialog_GraphicAttrsDiv").css("visibility", "visible");
                // $("#paintDialog_classesDiv").css("visibility", "visible");


            }


        }


        self.onPropertySelect = function (select) {
            var prop = $(select).val();
            if (currentAction == "classes") {
                $("#paintDialogPropQueryDiv").css("visibility", "hidden");
                $("#paintDialog_classesDiv").css("visibility", "visible");

            }
            if (currentAction == "outline") {
                if (prop == "") {
                    $("#paintDialogPropQueryDiv").css("visibility", "hidden");
                }
                else {
                    $("#paintDialogPropQueryDiv").css("visibility", "visible");
                }
            }
            if (currentAction == "classes") {
                if (prop == "") {
                    $("#paintDialog_classesDiv").css("visibility", "hidden");
                }
                else {
                    $("#paintDialog_classesDiv").css("visibility", "visible");
                }
            }
        }
        self.rgb2hex = function (rgb) {
            if (/^#[0-9A-F]{6}$/i.test(rgb)) return rgb;

            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }

            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        }
        self.onLegendItemClick = function (value) {

            var selectedNodes = [];
            var nodes = visjsGraph.nodes.get();
            for (var i = 0; i < nodes.length; i++) {
                if (clickedLegendItem != value) {//hide other nodes than value

                    if (!nodes[i].neoAttrs[self.currentBIproperty])
                        selectedNodes.push({id: nodes[i].id, hidden: false})
                    else if (nodes[i].neoAttrs[self.currentBIproperty] == value)
                        selectedNodes.push({id: nodes[i].id, hidden: false})
                    else
                        selectedNodes.push({id: nodes[i].id, hidden: true})
                }
                else {//remove hidden on all nodes
                    selectedNodes.push({id: nodes[i].id, hidden: false})

                }
            }
            if (clickedLegendItem != value)
                clickedLegendItem = value;
            else
                clickedLegendItem = "";

            visjsGraph.nodes.update(selectedNodes)

        }

        self.clusterByClass = function (options) {
            currentClusterProperty = self.currentBIproperty;
            if (!options)
                options = {simple: true};
            if (!self.currentBIproperty) {
                return alert("Cluster only performs on color classes ");
            }

            $("#paint_unClusterButton").css("visibility", "visible");
            var clusterOptionsByData;
            var clusterSize = 0;
            for (var i = 1; i < ticksColors.length; i++) {
                ticksColors[i].size = 0
                var tickColor = ticksColors[i].color;
                var label = ticksColors[i].tick;

                if (scaleType == "linear" && i < ticksColors.length - 1)
                    label += "-" + ticksColors[i + 1].tick
                if (options.simple) {
                    clusterSize = 0;
                    clusterOptionsByData = {
                        joinCondition: function (childOptions) {
                            if (childOptions.color.background == tickColor) {
                                clusterSize += 1;
                                ticksColors[i].size += 1
                                return true;
                            }
                            return false;// the color is fully defined in the node.

                        },
                        processProperties: function (clusterOptions, childNodes, childEdges) {
                            var totalMass = 0;
                            for (var i = 0; i < childNodes.length; i++) {
                                totalMass += childNodes[i].mass;
                            }
                            clusterOptions.mass = totalMass;

                            return clusterOptions;
                        },


                        clusterNodeProperties: {
                            id: 'cluster:' + tickColor,
                            // borderWidth: 3,
                            shape: 'dot',
                            color: tickColor,
                            label: label + "(" + clusterSize + ")",
                            size: 30
                        }
                    };
                    visjsGraph.network.cluster(clusterOptionsByData);


                }

                else {
                    var clusterOptionsByData = {
                        processProperties: function (clusterOptions, childNodes) {
                            clusterOptions.label = "[" + childNodes.length + "]";
                            return clusterOptions;
                        },
                        clusterNodeProperties: {borderWidth: 3, shape: 'square', font: {size: 30}}
                    };
                    visjsGraph.network.clusterByHubsize(undefined, clusterOptionsByData);
                }
            }

            var maxSize = 0;
            var minSize = 10000000;
            for (var i = 1; i < ticksColors.length; i++) {
                maxSize = Math.max(maxSize, ticksColors[i].size);
                minSize = Math.min(minSize, ticksColors[i].size);
            }
            var logScale = d3.scale.log().domain([minSize, maxSize]).range([20, 60]);
            for (var i = 1; i < ticksColors.length; i++) {
                var clusterSize = ticksColors[i].size;
                var size = logScale(ticksColors[i].size)
                // size=size/10
                console.log(clusterSize + "  " + size);
                visjsGraph.nodes.update({
                    id: 'cluster:' + ticksColors[i].color,
                    label: label + '(' + clusterSize + ')',
                    size: size,
                    color: ticksColors[i].color,
                    shape: "ellipse"
                })
            }

            visjsGraph.network.setOptions({
                physics: {enabled: true},

            });
            setTimeout(function () {
                visjsGraph.network.setOptions({
                    physics: {enabled: true},

                })
            }, 3000);
            $("#paint_unClusterButton").css("visibility", "visible")


        }

        self.unClusterByClass = function () {
            if (!currentClusterProperty || currentClusterProperty == "")
                return;
            $("#paint_unClusterButton").css("visibility", "hidden");

            var x = visjsGraph.network;


            for (var i = 1; i < ticksColors.length; i++) {
                var tickColor = ticksColors[i].color;
                visjsGraph.network.openCluster('cluster:' + tickColor, {
                    releaseFunction: function (clusterPosition, containedNodesPositions) {

                        return containedNodesPositions;
                    }
                })

            }
        }


        self.initHighlight = function () {
            var properties = [""];

            var labels = filters.currentLabels;
            for (var i = 0; i < labels.length; i++) {
                var props = Schema.schema.properties[labels[i]];
                for (var key in props)
                    if (properties.indexOf(key) < 0)
                        properties.push(key)
            }
            properties.sort();
            if (paintDialog_highlightPropertySelect)
                common.fillSelectOptionsWithStringArray(paintDialog_highlightPropertySelect, properties);
            common.fillSelectOptionsWithStringArray(paint_showNodeNamesForLabelSelect, filters.currentLabels);
            $("#paintAccordion").accordion(
                {
                    active: 0,
                    collapsible: false,
                    activate: function (event, ui) {

                    }
                });

        }


        self.dispatchAction = function (action) {


            $("#graphPopup").css("visibility", "hidden");
            toutlesensController.hidePopupMenu();
            if (!currentObject.id && currentObject.type != "cluster")
                return;

            if (action == "openCluster") {
                visjsGraph.network.openCluster(currentObject.id, {
                    releaseFunction: function (clusterPosition, containedNodesPositions) {

                        return containedNodesPositions;
                    }
                })
            }
            else if (action == "graphClusterNodes") {
                var nodeIds = visjsGraph.network.getNodesInCluster(currentObject.id)
                toutlesensData.setSearchByPropertyListStatement("_id", nodeIds, function (err, result) {

                    toutlesensController.generateGraph(null, {
                        applyFilters: true,
                        dragConnectedNodes: true
                    }, function () {

                        $("#filtersDiv").html("");
                        $("#graphMessage").html("");


                    });

                })
            }
            else if (action == "listClusterNodes") {
                var nodeIds = visjsGraph.network.getNodesInCluster(currentObject.id);


                var query = "match (n) where ID(n) in " + JSON.stringify(nodeIds).replace(/"/g, "") + " return n";


                $("#dialogLarge").dialog({modal: true});
                $("#dialogLarge").dialog("option", "title", "Graph text");
                $("#dialogLarge").html("<div id='dialogDiv'></div>");
                dataTable.loadNodes(query, {containerDiv: "dialogDiv"})

                $("#dialogLarge").dialog("open");

            }

        }


        self.showNodeNamesForLabel = function (label) {
            currentLabelSized = label;
            var nodes = [];
            for (var key in visjsGraph.nodes._data) {
                if (label != "" && visjsGraph.nodes._data[key].labelNeo == label) {
                    nodes.push({
                        id: key,
                        color: 'blue',
                        showLabel: true,
                        font: {size: currentLabelSize, color: 'blue', background: 'white'}
                    });
                } else {
                    nodes.push({
                        id: key,
                        color: visjsGraph.nodes._data[key].initialColor,
                        showLabel: false,
                        font: {size: 12, color: 'black', background: 'none'}
                    });
                }
            }
            visjsGraph.nodes.update(nodes);
            if (paint.currentBIproperty && paint.currentBIproperty != "")
                paint.paintClasses(paint.currentBIproperty)
        }

        self.setLabelSize = function (direction) {
            if (currentLabelSized == "")
                return;
            currentLabelSize += (3 * direction)
            self.showNodeNamesForLabel(currentLabelSized);

        }

        return self;


    }
)
()