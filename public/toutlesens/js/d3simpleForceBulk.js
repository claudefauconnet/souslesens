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

var d3simpleForceBulk = (function () {
    var self = {};
    self.force;
    var inPatternMode = false;

    self.initSimpleForceBulk = function (json) {

        var forceData = d3simpleForce.buildNodesAndLinks(json);
        var patternNodes = json.patternNodes;
        // console.log("nodes : "+forceData.nodes.length);
        //  console.log("charge :"+ Gparams.d3ForceParams.charge);
        // console.log("gravity :"+ Gparams.d3ForceParams.gravity);
        // console.log("distance:"+Gparams.d3ForceParams.distance);

        var linkNodeIndexes = [];
        for (var i = 0; i < forceData.nodes.length; i++) {

            if (!patternNodes) {// tous les noeuds visibility 1
                forceData.nodes[i].belongsToPattern = true;
                if (i == 0)
                    inPatternMode = false;
            }
            else if (patternNodes.indexOf(forceData.nodes[i].id) > -1) {
                if (i == 0)
                    inPatternMode = true;
                forceData.nodes[i].belongsToPattern = true;
                linkNodeIndexes.push(forceData.nodes[i].nodeIndex);
            }


        }

        for (var i = 0; i < forceData.links.length; i++) {

            if (linkNodeIndexes.indexOf(forceData.links[i].target) > -1 && forceData.nodes[forceData.links[i].source].belongsToPattern == true) {
                forceData.links[i].drawLink = true;

            }
            if (linkNodeIndexes.indexOf(forceData.links[i].source) > -1 && forceData.nodes[forceData.links[i].target].belongsToPattern == true) {
                forceData.links[i].drawLink = true;

            }


        }


//	 makeDiag( forceData.nodes, forceData.links);
        var drawLinks = (forceData.nodes.length < Gparams.bulkGraphViewMaxNodesToDrawLinks && !patternNodes)
        self.drawSimpleForceBulk(forceData.nodes, forceData.links, drawLinks);
        d3legend.drawLegend();

    }


    self.drawSimpleForceBulk = function (nodes, links, drawLinks) {

        var selector = "#graphDiv";
        var w = $(selector).width() - 50;
        var h = $(selector).height() - 50;

        var charge = Gparams.d3ForceParams.charge;
        charge = (0.2 * nodes.length) - 1000;
        var gravity = Gparams.d3ForceParams.gravity;
        var distance = Gparams.d3ForceParams.distance;
        charge = charge / 10;
        distance = distance / 10;
        var isDragging = false;


        d3.select(selector).selectAll("svg").remove();


        function zoom() {
            return;
            if (d3.event.translate > 100)
                d3.event.translate = 100;
            /*svg.attr("transform", "translate(" + d3.event.translate
             + ")scale(" + d3.event.scale + ")");*/
            svg.attr("transform", "scale(" + d3.event.scale + ")");
        }

        var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on(
            "zoom", zoom);

        var svg0 = d3.select(selector).append("svg:svg")
            .attr('width', w)
            .attr('height', h)
            .on("click", function () {
                self.force.stop()
            })
        svg = svg0.append("svg:g").attr("id", "canvas").call(zoomListener);


        // zoomListener.x([]);
        // svg0.attr("transform", "translate(-"+ w/2+" -"+h/2+")");

        // svg0.attr("transform", "translate(" + -500 + "," + -500 + ")")
        svg.append("svg:rect")
            .style("stroke", "#999")
            .style("fill", "#fff")
            .attr('width', w)
            .attr('height', h);

        force = d3.layout.force()
            .on("tick", tick)
            .nodes(nodes)
            .links(links)
            .size([w - 20, h - 20])
            .linkDistance(distance)
            .charge(charge)
            .gravity(gravity)

            .start();

        self.force = force;


        self.update = function () {


            isDragging = false;

            //  var nodes = flatten(json);
            //  var links = d3.layout.tree().links(nodes);
            var total = nodes.length || 1;


            // remove existing text (will readd it afterwards to be sure it's on top)
            svg.selectAll("text").remove();

            // Restart the force layout
            /* force
             .gravity(Math.atan(total / 50) / Math.PI * 0.4)
             .nodes(nodes)
             .links(links)
             .start();*/

            //force = d3.layout.force()


            // sticky drag
            var drag = force.drag()
                .on("dragstart", dragstart)
                .on("dragend", function (d) {
                    isDragging = true;
                });

            function dragstart(d) {
                toutlesensController.hidePopupMenu()
                isDragging = false;
                d3.select(this).classed("fixed", d.fixed = true);
            }

            // Update the links
            link = svg.selectAll("line.link")
                .data(links);
            // .data(links, function(d) { return d.target.name; });


            link.enter().insert("svg:g", ".node").attr("class", "link").attr("id", function (d) {
                return "L_" + d.id;
            });
            // Exit any old links.
            link.exit().remove();


            link.each(function (d) {
                if (d.drawLink || drawLinks) {
                    d3.select(this).insert("svg:line", ".line").attr("class", "link")
                        .attr("x1", function (d) {
                            return d.source.px;
                        })
                        .attr("y1", function (d) {
                            return d.source.py;
                        })
                        .attr("x2", function (d) {
                            return d.target.px;
                        })
                        .attr("y2", function (d) {
                            return d.target.py;
                        })

                        .style("stroke", function (d) {
                            if (d.target.relType) {
                                return linkColors[d.target.relType];
                            }
                            return "brown";
                        })
                        .attr("stroke-width", function (d) {
                            if (d.target.relProperties && d.target.relProperties[Gparams.visibleLinkProperty])
                                return d.target.relProperties[Gparams.visibleLinkProperty] * Gparams.relStrokeWidth;
                            return;
                            Gparams.relStrokeWidth;
                        })
                        .attr("fill", "none")

                        .style('opacity', function (d) {
                            if (d.source.isRoot || d.target.isTarget)
                                return 1;
                            if (d.source.belongsToPattern || d.target.belongsToPattern)
                                return 1;
                            else {
                                if (inPatternMode)
                                    return Gparams.minOpacity;
                                else if (drawLinks)
                                    return 1;
                                else
                                    return Gparams.minOpacity;
                            }
                        })

                    ;
                }
            });


            // Update the nodes
            node = svg.selectAll("circle.node")
                .data(nodes, function (d) {
                    return d.name;
                })


            node.enter().append("svg:g")
                .attr("class", "pointsRadar").attr("id", function (d) {
                return "P_" + d.id;
            });

            if (true) {
                node.each(function (d) {

                    var anode = d3.select(this);
                    anode.append('svg:circle')
                        .on("click", function () {
                            currentObject = d;
                            // currentDisplayType=
                            toutlesensController.onVisButton("SIMPLE_FORCE_GRAPH", graphButton);
                            //  d3common.d3CommonClick(d);
                        })
                        .attr("r", "5px")
                        .style("stroke", "black")
                        .style("stroke-width", 1)
                        .style("fill", function (d) {
                            if (d.decoration && d.decoration.color)
                                return d.decoration.color;
                            if (d.label && nodeColors[d.label])
                                return nodeColors[d.label];
                            return "grey";
                        })

                        .style('opacity', function (d) {
                            if (d.isRoot || d.isTarget)
                                return 1;
                            if (d.belongsToPattern)
                                return 1;
                            else {
                                if (inPatternMode)
                                    return Gparams.minOpacity;
                                else if (drawLinks)
                                    return 1;
                                else
                                    return Gparams.minOpacity;
                            }


                        })
                        .attr("class", "shape");
                    if (d.belongsToPattern || drawLinks) {
                        anode.on("mouseover", function (d) {
                            d3common.d3CommonMouseover(d)
                        });
                    }

                });
            }


        }


        function tick() {
            if (false) {
                link.select("path").attr("d", function (d) {

                    if (d.source.isSource) {
                        d.source.x = 100;
                        d.source.y = 100;
                    }
                    if (d.target.isTarget) {
                        d.target.x = w - 100;
                        d.target.y = h - 100;
                    }
                    var ctlPoint = {
                        x: ((d.source.x + d.target.x) / 2 + Gparams.curveOffset),
                        y: ((d.source.y + d.target.y) / 2) + Gparams.curveOffset
                    }
                    var str = "M" + d.source.x + "," + d.source.y + " " + "C" + d.source.x + "," + d.source.y + " " + ctlPoint.x + "," + ctlPoint.y + " " + d.target.x + "," + d.target.y

                    // console.log(str);
                    return str;
                });

            }
            link.select("line").attr("d", function (d) {
                if (d.drawLink) {

                    d3.select(this).attr("x1", function (d) {
                        return d.source.px;
                    }).attr("y1", function (d) {
                        return d.source.py;
                    }).attr("x2", function (d) {
                        return d.target.px;
                    }).attr("y2", function (d) {
                        return d.target.py;
                    });
                }
            });


            node.attr("transform", function (d) {
                if (d.isSource) {
                    d.x = 100;
                    d.y = 100;
                }
                if (d.isTarget) {
                    d.x = w - 100;
                    d.y = h - 100;
                }

                return "translate(" + Math.max(5, Math.min(w - 5, d.x)) + "," + Math.max(5, Math.min(h - 5, d.y)) + ")";
            });
        };

        function cleanup() {
            self.update([]);

            force.stop();
        };


        self.update();
        var wwww = d3.select(svg);
        d3.select(".canvas").attr("transform", "translate(" + 500 + "," + 500 + ")")
        /*  var xxx=-zoomListener.x();
         zoomListener.center();*/


    }


    return self;
})()