/**
 * Created by claud on 23/11/2017.
 */
var paint = (function () {
    var self = {};
    self.colorsPalette;
    self.currentColor = "";
    self.currentLabel;
    self.currentRelType;
    self.initialNodesattrs = {};
    self.initialLinksattrs = {};


    self.showPaintDialog = function (label, reltype) {
        self.currentLabel = label;
        self.currentRelType = reltype;


        $("#dialog").dialog("option", "title", "Graph paint attributes");

        $("#dialog").load("htmlSnippets/paintDialog.html", function () {
            if (label) {

                filters.initLabelPropertySelection(label);
            }
            else
                filters.initRelationPropertySelection(reltype);
            paint.initColorsPalette(10, "paintDialogPalette");
            $("#dialog").dialog("open");


        });
    }

    self.initColorsPalette = function (length, divId) {
        $("#" + divId).html("");
        self.colorsPalette = d3.scale.linear().domain([1, length])
            .interpolate(d3.interpolateHcl)
            .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);
        for (var i = 0; i < length; i++) {
            var color = self.colorsPalette(i);
            $("#" + divId).append("<div style='background-color:" + color + ";' class='colorPaletteSquare'>");
        }
        $(".colorPaletteSquare").on("click", function (e) {
            var xxx = this;
            self.currentColor = $(this).css("background-color");
        })

    }
    self.setColor = function (index) {
        self.currentColor = self.colorsPalette(index);
    }


    self.initPointSizeSelect = function (divId) {
        var base = 30;
        for (var i = 0; i < 5; i++) {
            $("#" + divId).append($('<option>', {
                value: i * base,
                text: i * base
            }));

        }
    }


    self.paintAll = function (option) {
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
        else if (option == "palette") {// null values
            nodeColor = "#ddd";
            linkStroke = "#ddd";
        }


        if (self.currentLabel) {
            var r = $("#propertiesSelectionDialog_circleRadiusInput").val()
            self.applyInitialGraphObjectAttrs(nodeColor, nodeR, linkStroke, linkStrokeWidth);
            d3.selectAll(".pointsRadar").select("circle").each(function (d) {
                if (option == "outline" && d.label == self.currentLabel) {
                    d3.select(this).style("fill", self.currentColor)
                    d3.select(this).style("r", r)
                }

            })


        }
        else if (self.currentRelType) {
            var strokeWidth = $("#propertiesSelectionDialog_strokeWidthInput").val()
            self.applyInitialGraphObjectAttrs(nodeColor, nodeR, linkStroke, linkStrokeWidth);
            d3.selectAll(".link").select("line").each(function (d) {
                if (option == "outline" && d.target.relType == self.currentRelType) {
                    d3.select(this).style("stroke", self.currentColor)
                    d3.select(this).style("stroke-width", strokeWidth)
                }

            })


        }

    }

    self.getDataColorDomain = function (data, property, nClasses) {
        var min = d3.min(data, function (d) {
            return d[property];
        });
        var max = d3.max(data, function (d) {
            return d[property];
        });
        var domain = d3.scale.linear().domain([min, max]).range([0, 10])


        var colors = domain.interpolate(d3.interpolateHcl).range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);
        var xx = colors(data[0][property])
        return colors;


    }

    self.getDataPointSizeDomain = function (data, property, nClasses) {
        var min = d3.min(data, function (d) {
            return d[property];
        });
        var max = d3.max(data, function (d) {
            return d[property];
        });
        var domain = d3.scale.linear().domain([min, max]).range([0, 10])


        var colors = domain.interpolate(d3.interpolateHcl).range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]);
        var xx = colors(data[0][property])
        return colors;

    }

    self.applyInitialGraphObjectAttrs = function (nodeColor, nodeR, linkStroke, linkStrokeWidth) {
        d3.selectAll(".pointsRadar").each(function (d) {
            var node = d3.select(this);
            var shapeInitialAttrs = self.initialNodesattrs[node.attr("id")];

            var shape = node.select("circle");
            shape.style("fill", nodeColor ? nodeColor : shapeInitialAttrs.fill);
            shape.style("r", nodeR ? nodeR : shapeInitialAttrs.r);


        })
        d3.selectAll(".link").each(function (d) {
            var link = d3.select(this);
            var shapeInitialAttrs = self.initialLinksattrs[link.attr("id")];

            var shape = node.select("line");
            shape.style("stroke", linkStroke ? linkStroke : shapeInitialAttrs.stroke);
            shape.style("stroke-width", linkStrokeWidth ? linkStrokeWidth : shapeInitialAttrs.strokeWidth);
        })

    }
    self.storeInitialGraphObjectAttrs = function () {
        self.initialNodesattrs = {};
        self.initialLinksattrs = {};
        d3.selectAll(".pointsRadar").each(function (d) {
            var node = d3.select(this);
            var shape = node.select("circle");
            self.initialNodesattrs[node.attr("id")] = {

                fill: shape.style("fill"),
                r: shape.attr("r")
            }

        })
        d3.selectAll(".link").each(function (d) {
            var link = d3.select(this);
            var shape = link.select("line");
            if (!shape)
                var xxxxx = 1
            var xxx = shape.attr("stroke");
            if (!xxx)
                var xxxxx = 1

            self.initialLinksattrs[link.attr("id")] = {
                stroke: shape.style("stroke"),
                strokeWidth: shape.attr("stroke-width")
            }

        })

    }

    return self;


})
()