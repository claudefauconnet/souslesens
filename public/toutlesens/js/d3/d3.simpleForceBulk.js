function drawsimpleForceBulk(json) {
    var patternNodes = json.patternNodes;

    var forceData = buildNodesAndLinks(json);
    console.log("nodes : "+forceData.nodes.length);
    console.log("charge :"+ Gparams.d3ForceParams.charge);
    console.log("gravity :"+ Gparams.d3ForceParams.gravity);
    console.log("distance:"+Gparams.d3ForceParams.distance);

    var linkNodeIndexes = [];
    for (var i = 0; i < forceData.nodes.length; i++) {
        if (!patternNodes)// tous les noeuds visibility 1
            forceData.nodes[i].blongsToPattern = true;
        else if (patternNodes.indexOf(forceData.nodes[i].id) > -1) {
            forceData.nodes[i].blongsToPattern = true;
            linkNodeIndexes.push(forceData.nodes[i].nodeIndex);
        }


    }

    for (var i = 0; i < forceData.links.length; i++) {

        if (linkNodeIndexes.indexOf(forceData.links[i].target) > -1 && forceData.nodes[forceData.links[i].source].blongsToPattern == true) {
            forceData.links[i].drawLink = true;

        }
        if (linkNodeIndexes.indexOf(forceData.links[i].source) > -1 && forceData.nodes[forceData.links[i].target].blongsToPattern == true) {
            forceData.links[i].drawLink = true;

        }


    }


//	 makeDiag( forceData.nodes, forceData.links);
    drawSimpleForceBulk(forceData.nodes, forceData.links);

}


function drawSimpleForceBulk(nodes, links) {

    var selector = "#graphDiv";
    var w = $(selector).width() - 50;
    var h = $(selector).height() - 50;

    var charge = Gparams.d3ForceParams.charge;
    charge=(0.2*nodes.length)-1000;
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
        .attr('height', h);
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


    update = function () {


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
            hidePopupMenu()
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
            if (d.drawLink) {
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
                        return "brown";
                    })
                    .attr("stroke-width", 1)
                    .attr("fill", "none")
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
                        //    console.log( d.label+"  :  "+d.blongsToPattern)
                        if (d.blongsToPattern)
                            return 1;
                        return 0.2;
                        if (d.isRoot || d.isTarget)
                            return 1;
                        return Gparams.minOpacity;

                    })
                    .attr("class", "shape");
                if (d.blongsToPattern) {
                    anode.on("mouseover", function (d) {
                        d3CommonMouseover(d)
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
        update([]);

        force.stop();
    };


    update();
    var wwww = d3.select(svg);
    d3.select(".canvas").attr("transform", "translate(" + 500 + "," + 500 + ")")
    /*  var xxx=-zoomListener.x();
     zoomListener.center();*/


} 

