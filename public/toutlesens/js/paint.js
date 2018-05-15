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
    var currentAction = "";


    self.init = function (data) {
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
        filters.initLabelProperty("", paintDialog_propsSelect);
        $("#paintDialog_propsSelect").val(Schema.getNameProperty())
        self.initColorsPalette(10, "paintDialogPalette");
        self.onActionTypeSelect("outline")
        $("#paintDialog_valueInput").css("visibility", "visible");
        $("#paintDialog_operatorSelect").css("visibility", "visible")
    }


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

                //  filters.initLabelProperty(label, paintDialog_propsSelect);
                $("#paintDialog_clusterNodesButton").css("visibility", "visible");
                $("#paintDialogTypeSpan").html("Node label :" + label)
            }
            else {

                $("#paintDialog_clusterNodesButton").css("visibility", "hidden")
                filters.initRelationProperty(relType, paintDialog_propsSelect);
                $("#paintDialogTypeSpan").html("Relation type :" + relType)
            }
            paint.initColorsPalette(10, "paintDialogPalette");
            $("#dialog").dialog({
                modal: false
            });


            if (paintDialog_propsSelect.options.length < 1)
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


    self.paintClasses = function () {

        var nClasses = parseInt($("#paintDialog_NclassesInput").val());
        var radius = $("#paintDialog_circleRadiusInput").val();
        var property = $("#paintDialog_propsSelect").val();
        if (property == "")
            return toutlesensController.setMessage("choose a property", "red");


        var data = [];

        for (var key in visjsGraph.nodesMap) {
            var nodeData = visjsGraph.nodesMap[key];
            var value = nodeData.neoAttrs[property];
            if (value)
                data.push({id: nodeData.id, value: value});
        }
        var min = d3.min(data, function (d) {
            return d.value;
        });
        var max = d3.max(data, function (d) {
            return d.value;
        });
        var scale;
        var scaleType;
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
        var domain;
        if (common.isNumber(data[0].value)) {
            scaleType = "linear"
            domain = d3.scaleLinear().domain([min, max]).nice().range([0, nClasses]);

            //   scale = d3.scaleLinear().domain().interpolator(d3.interpolateRainbow);
            scale = d3.scaleQuantize().domain([min, max]).nice().range(palette);
        }
        else {
            domain = d3.scaleOrdinal().domain(data).range([0, palette.length]);
            scaleType = "ordinal"
            scale = d3.scaleOrdinal().domain(data).range(palette);
        }


        //   console.log(domain.ticks(5));
        /*  console.log(colorDomain(-490));
         console.log(colorDomain(-491));*/

        var colorClasses = {};
        var allIds = [];
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
            if (!colorClasses[color])
                colorClasses[color] = [];
            colorClasses[color].push("" + data[i].id);

        }
        visjsGraph.paintNodes(allIds, "#333", null, null);
        for (var key in colorClasses) {
            visjsGraph.paintNodes(colorClasses[key], key, null, radius);
        }
        $("#paintDiv").css("height", 300);
        $("#paintDiv").css("overflow", "auto");
        // colorlegend  ("#paintDiv", scale, scaleType,  {vertical:true, boxHeight: 10, boxWidth: 20});
        self.drawPaletteColorLegend(scale, domain, palette, nClasses);
    }


    self.drawPaletteColorLegend = function (scale, domain, palette, nClasses) {

        var ticks;
        var type;
        var ticksColors = []
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
            type = "ordinal";
            ticks = scale.domain();

            for (var i = 0; i < ticks.length; i++) {
                var index = Math.round(domain(ticks[i] - 1));
                color = scale(ticks[i]);
                color = self.rgb2hex(color);
                ticksColors.push({color: color, tick: ticks[i]});
            }

        }

        var str = "<table>"
        var color;
        for (var i = 0; i < ticksColors.length; i++) {
            var onClick = " onclick='paint.onLegendItemClick(\"" + ticksColors[i].tick + "\")'";

            str += "<tr><td" + onClick + "><span style='background-color: " + ticksColors[i].color + ";'>&nbsp;&nbsp;&nbsp;</span></td><td>" + ticksColors[i].tick + "</td></tr>"

        }
        $("#paintDiv").css("height", 300);
        $("#paintDiv").html(str);
        jQuery("#dialog").dialog('option', 'position', {
            my: "left bottom",
            at: "left bottom",
         //   of: "#mainPanel"
        });


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
        var property = $("#propertiesSelectionDialog_propsSelect").val();
        var value = $("#propertiesSelectionDialog_valueInput").val();
        var filterObjectType = $("#propertiesSelectionDialog_ObjectTypeInput").val();
        var operator = $("#propertiesSelectionDialog_operatorSelect").val();
        var type = $("#propertiesSelectionDialog_ObjectNameInput").val();
       // self.currentLabel = $("#paintDialog_labelSelect").val();
        self.currentLabel=$("#propertiesSelectionDialog_ObjectNameInput").val();

        var legendStr = "";

        if (Gparams.useVisjsNetworkgraph) {
            if (self.currentLabel) {

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
                $("#paintDiv").css("height", 100);
                $("#paintDiv").html(legendStr);


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
                $("#paintDiv").css("height", 100);
                $("#paintDiv").html(legendStr);

                return;

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


        if (property && property.length > 0) {

            if(!value || value=="")
                return false;

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
            if ($("#paintDialog_propsSelect").val() == "")
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
    self.onLegendItemClick = function (tick) {
        var nodes = visjsGraph.nodesMap;
        for (var key in nodes) {
            if (nodes[key].label == tick) {
                visjsGraph.selectNode([nodes[key].id])
            }
        }

    }

    return self;


})
()