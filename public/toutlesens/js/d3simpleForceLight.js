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

var d3simpleForceLight = (function () {
    var self = {};
    self.force;
    self.canvas;
    self.maxlLinks = 0
    self.ticks = 0;
    self.maxTicks = 10;
    self.t0 = 0;
    self.isStopped=false;


    self.drawSimpleForce = function (nodes, links, linksMap) {
        self.maxlLinks = 0
        self.ticks = 0
        self.t0 = new Date();
        self.isStopped=false;
        //  self.maxTicks=10000/links.length;


        for (var i = 0; i < links.length; i++) {
            self.maxlLinks = Math.max(self.maxlLinks, links[i].source.nLinks)

        }

        var selector = "#graphDiv";
        var w = $(selector).width() - 50;
        var h = $(selector).height() - 50;
        var coef = 2
        w = w * coef
        h = h * coef

        var charge = Gparams.d3ForceParams.charge;
        var gravity = Gparams.d3ForceParams.gravity;
        var distance = Gparams.d3ForceParams.distance;
        var distance = (h / 2);
        console.log("--------distance " + distance);
        console.log("--------gravity " + gravity);
        console.log("--------charge " + charge);
        var isDragging = false;


        d3.select(selector).selectAll("svg").remove();


        var svg = d3.select(selector).append("svg:svg")
            .attr('width', w)
            .attr('height', h)
            .on("click", function () {
                if(self.isStopped) {
                    self.isStopped=false;
                    self.t0 = new Date();
                    self.force.start();

                }
                else {
                    self.isStopped = true;
                    self.force.stop()
                }
            })
        // svg = svg0.append("svg:g").attr("id", "canvas")


        // zoomListener.x([]);
        // svg0.attr("transform", "translate(-"+ w/2+" -"+h/2+")");

        // svg0.attr("transform", "translate(" + -500 + "," + -500 + ")")
        self.canvas = svg.append("svg:g")
            .style("stroke", "#999")
            .style("fill", "#fff")
            .attr('class', "canvas")
            .attr('width', w)
            .attr('height', h)
            .call(d3.behavior.zoom().scaleExtent([coef / 3, coef * 2]).on("zoom", function () {
                if (d3.event.scale < 0.9)
                    d3.selectAll(".nodeText").style("visibility", "hidden");
                else
                    d3.selectAll(".nodeText").style("visibility", "visible");
                d3.select(this).attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
            }))
            .call(d3.behavior.drag()
                .on("drag", function (d, i) {
                    if (d && d.x)
                        d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")")

                })
            );
       // d3.select(".canvas").append("rect").attrs({ x: 0, y: 0, width: 0, height: 0, fill: 'white' })



        force = d3.layout.force()
            .on("tick", tick)
            .on('end', function () {
                self.canvas.attr("transform", "translate(" + 0 + "," + 0 + ")" + " scale(" + 1 / coef + ")")
                // self.canvas.attr("transform", "translate(" + (-w/(2*coef))+","+(-h/(2*coef))+ ")" + " scale(" + 1/coef+ ")")
            })
            .nodes(nodes)
            .links(links)
            .size([w - 20, h - 20])
            .linkDistance(distance)
            .charge(charge)
            .gravity(gravity)

            .linkStrength(function (link) {
                if (link.source.nLinks == self.maxlLinks)
                    return 1;

                return 0.1;
            })
            .start();

        self.force = force;
        //

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
            link = self.canvas.selectAll("line.link")
                .data(links);
            // .data(links, function(d) { return d.target.name; });


            link.enter().insert("svg:g", ".node").attr("class", "link").attr("id", function (d) {
                return "L_" + d.id;
            });
            // Exit any old links.
            link.exit().remove();


            link.each(function (d) {

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
                        return "grey";
                    })
                    .attr("stroke-width", function (d) {

                        return 1;
                    })
                    .attr("fill", "none")

                    .style('opacity', function (d) {
                        return 0.5;

                    })

                ;

            });


            // Update the nodes
            node = self.canvas.selectAll("circle.node")
                .data(nodes, function (d) {
                    return d.name;
                })


            node.enter().append("svg:g")
                .attr("class", "pointsRadar").attr("id", function (d) {
                return "P_" + d.id;
            });


            node.each(function (d) {

                var anode = d3.select(this);
                anode.append('svg:circle')
                    .on("dblclick", function () {
                        currentObject = d;
                        currentObject.id = d.id
                        currentDisplayType = "FLOWER";
                        toutlesensController.generateGraph(d.id)

                    })
                    .attr("r", function (d) {
                            var r0 = Gparams.circleR / 3;
                            if (d.rels && d.rels.length > 0) {

                                return r0 + (r0 * Math.log(d.rels.length) )
                            }
                            return r;
                        }
                    )
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

                        return 1;


                    })
                    .attr("class", "shape");

                anode.on("mouseover", function (d) {
                    d3common.d3CommonMouseover(d);
                    d3.selectAll(".link").attr("stroke", "grey").style("opacity", 0.5);
                    d3.selectAll(".pointsRadar").attr("stroke", "black").attr("stroke-width", 1);
                    for (var i = 0; i < d.rels.length; i++) {
                        var idLink = d.rels[i];
                        d3.selectAll("#L_" + idLink).transition().duration(100).attr("stroke", "blue").style("opacity", 1);

                        var linkObj = linksMap[idLink];
                        d3.selectAll("#P_" + linkObj.source).select('svg:circle').transition().duration(100).attr("stroke", "blue").style("opacity", 1).attr("stroke-width", 3);
                        d3.selectAll("#P_" + linkObj.target).select('svg:circle').transition().duration(100).attr("stroke", "blue").style("opacity", 1).attr("stroke-width", 3);


                    }

                });


                anode.append("text").attr("x", function (d) {
                    return Gparams.circleR / 2;
                }).text(function (d) {
                    var match = /__[0-9]*/.exec(d.name);
                    if (match) {
                        var p = match.index;
                        if (p > -1)
                            return d.name.substring(0, p);
                    }
                    if (d.name && d.name.length > Gparams.nodeMaxTextLength)
                        return d.name.substring(0, Gparams.nodeMaxTextLength - 1) + "...";
                    return d.name;
                })
                    .attr("dy", ".35em").attr('class', 'nodeText')

                 /*   .style("fill", function (d) {
                        return "#444";
                    })*/
                    .attr("text-anchor", function (d) {
                        return "start";
                    })
                    .style("fill-opacity", 1)
                    .style("font-weight", function (d) {

                        return "normal";
                    })

                    .style("font-size", function (d) {
                        return "12px";

                    })
                    .style("visibility", "visible")


            });


        }


        function tick() {
//if(self.ticks++>self.maxTicks)
            if ((new Date() - self.t0) > Gparams.durationMsecBeforeGraphStop) {
                self.isStopped=true;
                 self.force.stop();
                return
            }

            link.select("line").attr("d", function (d) {


                d3.select(this).attr("x1", function (d) {
                    return d.source.px;
                }).attr("y1", function (d) {
                    return d.source.py;
                }).attr("x2", function (d) {
                    return d.target.px;
                }).attr("y2", function (d) {
                    return d.target.py;
                });

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