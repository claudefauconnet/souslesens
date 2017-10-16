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

var d3legend = (function () {
    var self = {};
    var vis;
    var visLeg;
    var drag;
    var svgGroup;
    var yLeg = 30;
    var xLeg = 10;
    var circleLegR = Gparams.circleR / 1.5;
    var yDecoLeg;
    var visLeg;
    var excludedLabels = [];
    self.drawLegend = function (legendDivId) {
        return;
        var legendDiv;


        if (!legendDivId) {
            legendDiv = $("#graphLegendDiv");
            if (visLeg) {
                legendDiv.html("");
                d3.select(".legendSVG").selectAll("*").remove();
            }

            var w = legendDiv.width();
            var h = legendDiv.height();
            if (w < 5)
                return;

            visLeg = d3.select("#graphLegendDiv").append("svg:svg").attr("width", w).attr(
                "height", h).attr("class", "legendSVG");


        }

        else {
            legendDiv = $("#" + legendDivId);

            var xxx = myFlower;
            visLeg = d3.selectAll("svg");
        }
        yLeg = 30;


        var labels = new Array;
        // 230;


        var relations = []

        for (type in legendRelTypes) {

            var obj = {
                label: type.label,
                index: type.index,
                x: xLeg,
                y: yLeg
            }
            relations.push(type);

        }

        if (excludedLabels) {
            for (var key in excludedLabels) {
                legendNodeLabels[key] = {label: key};
            }

        }
        for (var i = 0; i < toutlesensController.collapseTargetLabels.length; i++) {
            var key = [key] = toutlesensController.collapseTargetLabels[i];
            legendNodeLabels[key] = {label: key};
        }


        for (var label in legendNodeLabels) {
            // legHeight += 20;

            var obj = {
                name: label,
                x: xLeg,
                y: yLeg
            }
            if (!excludeLabels[obj.name])
                excludeLabels[obj.name] = -1;
            if (obj.name != "") {
                labels.push(obj);
                yLeg += 20;
            }
        }
        yLeg += 40;


        var legend = visLeg.data([{
            x: 150,
            y: 100
        }]).append("g").attr("class", "legend").attr("transform", function (d) {
            return "translate(" + 10 + "," + 15 + ")"
        }).attr("x", function (d) {
            return d.x
        })
            .attr("y", function (d) {
                return d.y
            }).call(d3common.commonDnD);

        /*  legend.append("rect").attr("class", "legendRect").attr("x", 0).attr("y", 0).attr("width", legWidth)
         .attr("height", legHeight).style("stroke", null).style("stroke-widh", "1px").style("fill",
         "#eee");*/


        var legendElts = legend.selectAll("g").data(labels).enter().append("g")
            .attr("class", "legendElt").attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            }).on("click", self.clickLegend);

        var node = legendElts.append("circle").attr('class', 'nodeCircle').attr("r",
            circleLegR).style("fill", function (d) {
            var color = nodeColors[d.name];
            if (!color)
                return Gparams.defaultNodeColor;
            return color;
        }).style("stroke", function (d) {
            var color = nodeColors[d.label];
            if (color)
                return color;
            return Gparams.defaultNodeColor;

        }).attr("x", circleLegR).attr("y", 0);

        legendElts.each(function (d) {
            var hasIcon = false;
            var icon;
            if (Gparams.customIcons && Gparams.customIcons[subGraph] && Gparams.customIcons[subGraph][d.name]) {// icon
                hasIcon = true;
            }
            if (Schema.schema &&  Schema.schema.labels[d.name]) {
                icon = Schema.schema.labels[d.name].icon;
                if (icon)
                    hasIcon = true;
            }

            var anode = d3.select(this);

            if (hasIcon) {
                shape = anode.append("svg:image")
                    .attr('x', -10)
                    .attr('y', -10)
                    .attr('width', 20)
                    .attr('opacity', 0.7)
                    //.attr('height', 24)
                    .attr("xlink:href", "icons/" +icon);
                  //  .attr("xlink:href", "icons/" + Gparams.customIcons[subGraph][d.name]);
            }
        });

        legendElts.append("text").attr("x", function (d) {
            return circleLegR + 8;
        }).attr("dy", ".35em").attr('class', 'legendText')

            .style("fill", function (d) {
                return "#000";
            }).attr("text-anchor", function (d) {
            return "start";
        }).text(function (d) {
            return d.name;
        }).style("fill-opacity", 1).style("font-size", "12px");


        //lien vers les decorations

        if (queryParams.ui != "basic") {
            var decoButton = visLeg.append("g").on("click", toutlesensDialogsController.showGraphDecorationObjsDialog).attr("transform", function (d) {
                return "translate(" + xLeg + "," + (yLeg + 10) + ")"
            })

            decoButton.append("rect").attr("width", 90).attr("height", 23).attr("rx", 0).attr("ry", 0)
                .style("fill", "#ca842e");

            decoButton.append("text").text(function (d) {
                if (Gparams.lang == "FR")
                    return "Montrer...";
                else
                    return "Show...";
            })
                .attr('class', 'legendText')
                .attr("fill", "white")
                .attr("text-anchor", "start")
                .attr("y", 15).attr("x", 5);

            yLeg += 20;
        }
    }


    self.drawDecorationLegend = function (_decorationObjs) {
        var decorationObjs = _decorationObjs;
        if (decorationObjs.length == 0)
            return;

        var title = "[" + decorationObjs[0].label + "]" + decorationObjs[0].property

        yDecoLeg = 0;
        var decorationLegend = visLeg.append("g").attr("x", 0)
            .attr("dy", ".35em").attr('class', 'decorationLegend')
            .attr("transform", function (d) {
                return "translate(" + 0 + "," + (yLeg) + ")"
            })
// bounding retangle
        var bBox = {x: 2, y: 10, height: totalHeight - 50, width: Gparams.legendWidth - 4};
        decorationLegend.append("rect")
            .attr("x", bBox.x).attr("width", bBox.width).attr("height", bBox.height).attr("y", (bBox.y ))
            .style("stroke", null)
            .attr('fill-opacity', 1)
            .style("fill", "#efe6d5");
// title
        decorationLegend.append("text").attr("x", 30).attr("y", 30)
            .attr("dy", 20).attr('class', 'legendText')
            .style("fill", function (d) {
                return "purple";
            }).attr("text-anchor", function (d) {
            return "start";
        }).text(function (d) {
            return title;
        }).style("fill-opacity", 1).style("font-size", "14px");

        yDecoLeg += 40

        // decorations elts

        var decorations = decorationLegend.selectAll("g").data(decorationObjs).enter().append("g")
            .attr("dy", ".35em")
            .attr('class', 'decorationLegend')
            .attr("transform", function (d) {
                var vOffset = 30;
                if (d.size)
                    vOffset += d.size + 10;
                yDecoLeg += vOffset;
                return "translate(" + (xLeg + 10) + "," + yDecoLeg + ")"
            })
        ;


        decorations.append("circle").attr('class', 'nodeCircle')
            .attr("r", function (d) {
                if (d.size)
                    return d.size / 2;
                return circleLegR;
            }).style("fill", function (d) {
            if (d.color)
                return d.color;
            return Gparams.defaultNodeColor;
            return color;
        }).style("stroke", function (d) {
            return Gparams.defaultNodeColor;
        })

        decorations.data(decorationObjs).append("text").attr("x", function (d) {
            if (d.size)
                return (d.size / 2) + 8;
            return circleLegR + 8;
        }).attr("dy", function () {
        }).attr('class', 'legendText')

            .style("fill", function (d) {
                return "#000";
            }).attr("text-anchor", function (d) {
            return "start";
        }).text(function (d) {
            if (d.value)
                return d.value;
            return "ssss";
        }).style("fill-opacity", 1).style("font-size", "12px");


        /* .append("rect")
         .attr("width", 30).attr("height", 30)
         .attr("transform", function (d) {
         return "translate(" + 10 + "," + (y2+=20 ) + ")"
         })
         .style("stroke", function (d) {
         if (d.level == 0 || d.isRoot == true)
         return "purple";
         return "purple";
         })

         .style("fill", function (d) {
         if (d.decoration && d.decoration.color)
         return d.decoration.color;
         if (d.color)
         return d.color;
         return nodeColors[d.label];
         return "purple";
         })*/


    }

    self.clickLegend = function (e) {
        var p;
        // excludedLabels=[];
        /*  if ((p = excludedLabels.indexOf(e.name)) < 0)
         excludedLabels.push(e.name);
         else// bascule
         excludedLabels.splice(p, 1);

         toutlesensData.queryExcludeNodeFilters = "";
         for (var i = 0; i < excludedLabels.length; i++) {
         //if (i > 0)
         toutlesensData.queryExcludeNodeFilters += " and not ";
         toutlesensData.queryExcludeNodeFilters += "m:" + excludedLabels[i];
         }*/

        toutlesensController.collapseTargetLabels = [e.name];
        //  prepareRawDataAndDisplay(toutlesensData.cachedResultArray);
        /* if (legendNodeLabels.currentActionObj)//call from advancedSearch
         executeSearch();
         else //callfrom toutlesensData*/
        toutlesensData.getNodeAllRelations(currentSourceNode.id, currentDisplayType);

    }
    return self;
})()