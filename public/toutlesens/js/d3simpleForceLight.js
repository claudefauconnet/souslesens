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
    self.container;
    self.maxlLinks = 0
    self.ticks = 0;
    self.maxTicks = 10;
    self.t0 = 0;
    self.isStopped = false;
    self.linksMap


    self.drawSimpleForce = function (nodes, links, linksMap) {
        self.linksMap=linksMap;
        self.maxlLinks = 0
        self.ticks = 0
        self.t0 = new Date();
        self.isStopped = false;
        //  self.maxTicks=10000/links.length;


        for (var i = 0; i < links.length; i++) {
            self.maxlLinks = Math.max(self.maxlLinks, links[i].source.nLinks)

        }

        var selector = "#graphDiv";
        var w = $(selector).width() - 50;
        var h = $(selector).height() - 50;
        var coef = 1
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
                if (self.isStopped) {
                    self.isStopped = false;
                    self.t0 = new Date();
                    self.force.start();

                }
                else {
                    // self.isStopped = true;
                    self.force.stop()
                }
            })


        self.container = svg.append("svg:g")
        /* .style("stroke", "#999")
         .style("fill", "#fff")*/
            .attr('class', "container")
            .attr('width', w)
            .attr('height', h)
        /*    .call(d3.behavior.zoom().scaleExtent([coef / 3, coef * 2]).on("zoom", function () {


         d3.select(this).attr("transform",  " scale(" + d3.event.scale + ")")
         //  d3.select(this).attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")")
         }))
         .call(d3.behavior.drag()
         .on("drag", function (d, i) {
         if (d && d.x)
         d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")")

         })
         );*/


        var force = d3.layout.force()
            .on("tick", tick)
            .on('end', function () {
                self.container.attr("transform", "translate(" + 0 + "," + 0 + ")" + " scale(" + 1 / coef + ")")
                // self.container.attr("transform", "translate(" + (-w/(2*coef))+","+(-h/(2*coef))+ ")" + " scale(" + 1/coef+ ")")
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
            var total = nodes.length || 1;
            svg.selectAll("text").remove();


            // Update the links
            link = self.container.selectAll("line.link")
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
            node = self.container.selectAll("circle.node")
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
                    .attr("id", "C_" + d.id)
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

                anode.on("click", function (d) {
                    d3.select(this).style('fill', 'red')
                    // d3common.d3CommonMouseover(d);
                    d3.selectAll("line").style('stroke', 'grey')
                    //  var circles=d3.selectAll("circle").style('fill','grey')
                    var nodeRels = d.rels;


                    d3.selectAll("text").style('fill', 'black').style("font-size", "10px").style("font-weight", "normal")
                    d3.selectAll("line").each(function (d, i) {
                        if (nodeRels.indexOf(d.id) > -1) {

                            d3.select(this).style('stroke', 'blue').style("stroke-width", 5).style("opacity", 1)
                            var linkNodes = self.linksMap[d.id];
                            d3.selectAll("text").each(function (d, i) {
                                if (linkNodes.source==d.index || linkNodes.target==d.index) {

                                    d3.select(this).style('fill', 'blue').style("font-size", "14px").style("font-weight", "bold")
                                }




                            })
                        }
                        else
                            d3.select(this).style('stroke', 'grey').style("stroke-width", 1).style("opacity", 0.5)


                    })





                    /*    var xxx= d3.select("#L_" + idLink).select("line")
                     d3.select("#L_" + idLink).select("line").style("color", "blue").style("opacity", 0.5);
                     var linkObj = linksMap[idLink];
                     d3.select("circle#C_" + linkObj.source).style('fill','red')*/


                    /*

                     //  d3common.d3CommonMouseover(d);
                     d3.selectAll(".link").attr("stroke", "grey").style("opacity", 0.5);
                     d3.selectAll(".pointsRadar").attr("stroke", "none")
                     for (var i = 0; i < d.rels.length; i++) {
                     var idLink = d.rels[i];
                     var xxx= d3.selectAll("#L_" + idLink).select("line");
                     d3.selectAll("#L_" + idLink).attr("stroke", "blue").attr("stroke-width",3).style("opacity", 1);

                     var linkObj = linksMap[idLink];
                     d3.selectAll("#P_" + linkObj.source).attr("stroke", "blue").style("opacity", 1).attr("stroke-width", 3);
                     d3.selectAll("#P_" + linkObj.target).attr("stroke", "blue").style("opacity", 1).attr("stroke-width", 3);

                     // d3.selectAll("#P_" + linkObj.source).attr("stroke", "blue").style("opacity", 1).attr("stroke-width", 3);
                     //  d3.selectAll("#P_" + linkObj.target).attr("stroke", "blue").style("opacity", 1).attr("stroke-width", 3);


                     } */

                });


                anode.append("text")
                    .attr("x", function (d) {
                        return Gparams.circleR + 3;
                    }).attr("dy", ".35em")
                    .attr('class', 'nodeText')
                    // .style("fill", "purple")
                    .attr("text-anchor", "start")
                    .text(function (d) {
                        textOutputs.formatNode(d);
                        if (d.name && d.name.length > Gparams.nodeMaxTextLength)
                            return d.name.substring(0, Gparams.nodeMaxTextLength - 1) + "...";
                        return d.name;
                    })
                    .style("font-weight", function (d) {
                        return "normal";
                    })

                    .style("font-size", function (d) {
                        return "12px";

                    })

            });


        }


        function tick() {
//if(self.ticks++>self.maxTicks)
            if ((new Date() - self.t0) > Gparams.durationMsecBeforeGraphStop) {
                self.isStopped = true;
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
        function zoomed() {
            self.container.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }

        function dragstarted(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed("dragging", true);
        }

        function dragged(d) {
            if (d && d.x)
                d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")")

            // d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
        }

        function dragended(d) {
            d3.select(this).classed("dragging", false);
        }

        function cleanup() {
            self.update([]);

            force.stop();
        };


        self.update();
        var wwww = d3.select(svg);
        //   d3.select(".container").attr("transform", "translate(" + 500 + "," + 500 + ")")
        /*  var xxx=-zoomListener.x();
         zoomListener.center();*/


    }


    return self;
})()