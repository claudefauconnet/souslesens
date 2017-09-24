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

function d3treeGraph(_graphDiv, _nodesData, distance) {

    // coefficients du graphes (espacements) ajout CF
    // var treeName = treeName_;
    var graphDiv = _graphDiv[0];
    var HeightCoef = 25;
    var LabelLengthCoef = 10;
    // var widthCoef=500;
    var widthCoef = 200;



    // define a d3 diagonal projection for use by the node paths later on.
    var totalNodes = 0;
    var maxLabelLength = 0;
    // variables for drag/drop
    var selectedNode = null;
    var draggingNode = null;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 750;

    var svgGroup;
    var zoomListener;
    var baseSvg;
    var diagonal;
    var viewerWidth;
    var viewerHeight;
    var tree;
    var maxPoint = {x: 0, y: 0};
    /*this.centerNode = function(x, y, scale) {
     centerNode(x, y, scale);
     }*/

    var currentTextColor = "black";

    var fills = ["#00AC6B", "#20815D", "#007046", "#35D699", "#60D6A9"];
    // var eventFactory = parent.thesaurus.eventFactory();
    var treeData = null

    this.maxIdt = -1;
    var maxId = -1;
    this.rootNode = null;
    this.treeNodes = [];
    this.nextStartNode = null;

    this.drawTree = function (treeData_, distance) {
        maxPoint = {x: 0, y: 0};
        HorNodesSpacing = Gparams.d3ForceParams.distance;
        if (distance)
            HorNodesSpacing = distance;
        if (treeData_)
            treeData = treeData_;
        else
            treeData = toutlesensController.buildTree(this);

        $(graphDiv).html("");
        d3.select(".overlay").selectAll("*").remove();

        // Calculate total nodes, max label length
        var totalNodes = 0;
        var maxLabelLength = 0;
        // variables for drag/drop
        var selectedNode = null;
        var draggingNode = null;
        // panning variables
        var panSpeed = 200;
        var panBoundary = 20; // Within 20px from edges will pan when
        // dragging.
        // Misc. variables
        var i = 0;
        var duration = 750;

        // size of the diagram
        // var viewerWidth = $(document).width()*0.8;
        // var viewerHeight = $(document).height()-50;
        viewerHeight = $(graphDiv).height();
        viewerWidth = $(graphDiv).width();
        /*
         * var www = graphDiv.parentElement; viewerWidth = $(www).width();
         * viewerHeight = $(www).height();
         */

        var tree = d3.layout.tree().size([viewerHeight, viewerWidth]);

        // define a d3 diagonal projection for use by the node paths later on.
        var diagonal = d3.svg.diagonal().projection(function (d) {
            return [d.y, d.x];
        });

        // A recursive helper function for performing some setup by walking
        // through all nodes

        function visit(parent, visitFn, childrenFn) {
            if (!parent)
                return;

            visitFn(parent);

            var children = childrenFn(parent);
            if (children) {
                var count = children.length;
                for (var i = 0; i < count; i++) {
                    visit(children[i], visitFn, childrenFn);
                }
            }
        }

        // Call visit function to establish maxLabelLength
        visit(treeData, function (d) {
            totalNodes++;
            if (d.name)
                maxLabelLength = Math.max(d.name.length, maxLabelLength);

        }, function (d) {
            return d.children && d.children.length > 0 ? d.children : null;
        });

        // sort the tree according to the node names

        function sortTree() {
            tree.sort(function (a, b) {/*
             * maxId = Math.max(maxId, a.id); return
             * b.name.toLowerCase() <
             * a.name.toLowerCase() ? 1 : -1;
             */

                if (a.label > b.label)
                    return;
                1;
                if (a.label < b.label)
                    return -1;
                return 0;
            });
        }

        // Sort the tree initially incase the JSON isn't in a sorted order.
        sortTree();

        // TODO: Pan function, can be better implemented.

        function pan(domNode, direction) {
            var speed = panSpeed;
            if (panTimer) {
                clearTimeout(panTimer);
                translateCoords = d3.transform(svgGroup.attr("transform"));
                if (direction == 'left' || direction == 'right') {
                    translateX = direction == 'left' ? translateCoords.translate[0]
                        + speed
                        : translateCoords.translate[0] - speed;
                    translateY = translateCoords.translate[1];
                } else if (direction == 'up' || direction == 'down') {
                    translateX = translateCoords.translate[0];
                    translateY = direction == 'up' ? translateCoords.translate[1]
                        + speed
                        : translateCoords.translate[1] - speed;
                }
                scaleX = translateCoords.scale[0];
                scaleY = translateCoords.scale[1];
                scale = zoomListener.scale();
                svgGroup.transition().attr(
                    "transform",
                    "translate(" + translateX + "," + translateY
                    + ")scale(" + scale + ")");
                d3.select(domNode).select('g.node').attr("transform",
                    "translate(" + translateX + "," + translateY + ")");
                zoomListener.scale(zoomListener.scale());
                zoomListener.translate([translateX, translateY]);
                panTimer = setTimeout(function () {
                    pan(domNode, speed, direction);
                }, 50);
            }
        }

        // Define the zoom function for the zoomable tree

        function zoom() {
            svgGroup.attr("transform", "translate(" + d3.event.translate
                + ")scale(" + d3.event.scale + ")");
        }

        // define the zoomListener which calls the zoom function on the "zoom"
        // event constrained within the scaleExtents
        var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on(
            "zoom", zoom);

        function initiateDrag(d, domNode) {
            var e = d3.event;
            if (e.ctrlKey) {
                // eventFactory.showNodeInfo(d);
                return;

            }
            draggingNode = d;
            d3.select(domNode).select('.ghostCircle').attr('pointer-events',
                'none');
            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
            d3.select(domNode).attr('class', 'node activeDrag');

            svgGroup.selectAll("g.node").sort(function (a, b) { // select the
                // parent and
                // sort the
                // path's
                if (a.id != draggingNode.id)
                    return 1; // a is not the hovered element, send "a" to the
                // back
                else
                    return -1; // a is the hovered element, bring "a" to the
                // front
            });
            // if nodes has children, remove the links and nodes
            if (nodes.length > 1) {
                // remove link paths
                links = tree.links(nodes);
                nodePaths = svgGroup.selectAll("path.link").data(links,
                    function (d) {
                        return d.target.id;
                    }).remove();
                // remove child nodes
                nodesExit = svgGroup.selectAll("g.node").data(nodes,
                    function (d) {
                        return d.id;
                    }).filter(function (d, i) {
                    if (d.id == draggingNode.id) {
                        return false;
                    }
                    return true;
                }).remove();
            }

            // remove parent link
            parentLink = tree.links(tree.nodes(draggingNode.parent));
            svgGroup.selectAll('path.link').filter(function (d, i) {
                if (d.target.id == draggingNode.id) {
                    return true;
                }
                return false;
            }).remove();

            dragStarted = null;
        }

        // define the baseSvg, attaching a class for styling and the
        // zoomListener
        var baseSvg = d3.select(graphDiv).append("svg").attr("width",
            viewerWidth).attr("height", viewerHeight).attr("class",
            "overlay").call(zoomListener);

        // Define the drag listeners for drag/drop behaviour of nodes.
        dragListener = d3.behavior.drag().on("dragstart", function (d) {
            if (d == root) {
                return;
            }
            var e = d3.event;

            if (e.ctrlKey) {
                // eventFactory.showNodeInfo(d);
                return;
            }
            dragStarted = true;
            nodes = tree.nodes(d);
            d3.event.sourceEvent.stopPropagation();
            // it's important that we suppress the mouseover event on the node
            // being dragged. Otherwise it will absorb the mouseover event and
            // the underlying node will not detect it
            // d3.select(this).attr('pointer-events', 'none');
        }).on("drag", function (d) {
            if (d == root) {
                return;
            }
            if (dragStarted) {
                return;
                domNode = this;
                initiateDrag(d, domNode);
            }

            // get coords of mouseEvent relative to svg container to allow for
            // panning
            relCoords = d3.mouse($('svg').get(0));
            if (relCoords[0] < panBoundary) {
                panTimer = true;
                pan(this, 'left');
            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                panTimer = true;
                pan(this, 'right');
            } else if (relCoords[1] < panBoundary) {
                panTimer = true;
                pan(this, 'up');
            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                panTimer = true;
                pan(this, 'down');
            } else {
                try {
                    clearTimeout(panTimer);
                } catch (e) {

                }
            }

            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;
            var node = d3.select(this);
            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
            updateTempConnector();
        }).on("dragend", function (d) {
            return;

        });

        function endDrag() {
            return;
            var e = d3.event;
            if (e.ctrlKey) {
                // eventFactory.showNodeInfo(d);
                return;
            }
            selectedNode = null;
            d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
            d3.select(domNode).attr('class', 'node');
            // now restore the mouseover event or we won't be able to drag a 2nd
            // time
            d3.select(domNode).select('.ghostCircle')
                .attr('pointer-events', '');
            updateTempConnector();
            if (draggingNode !== null) {
                // this.update(root);
                centerNode(draggingNode);
                draggingNode = null;
            }

        }

        // Helper functions for collapsing and expanding nodes.

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        function expand(d) {
            if (d._children) {
                d.children = d._children;
                d.children.forEach(expand);
                d._children = null;
            }
        }

        var overCircle = function (d) {
            selectedNode = d;
            return;
            updateTempConnector();
        };
        var outCircle = function (d) {
            return;
            selectedNode = null;
            updateTempConnector();
        };

        // Function to update the temporary connector indicating dragging
        // affiliation
        var updateTempConnector = function () {
            var data = [];
            if (draggingNode !== null && selectedNode !== null) {
                // have to flip the source coordinates since we did this for the
                // existing connectors on the original tree
                data = [{
                    source: {
                        x: selectedNode.y0,
                        y: selectedNode.x0
                    },
                    target: {
                        x: draggingNode.y0,
                        y: draggingNode.x0
                    }
                }];
            }
            var link = svgGroup.selectAll(".templink").data(data);

            link.enter().append("path").attr("class", "templink").attr("color",
                function (d) {
                    var type = d.color;

                }).attr("d", d3.svg.diagonal()).attr('pointer-events',
                'none').attr("xlink:href", function (d) {
                return "#link_" + d.target.id;
            }) // place the ID of the path here
                .style("text-anchor", "middle") // place the text halfway on the arc
                .attr("startOffset", "50%").text(function (d) {
                if (d.target.relDir == "normal")
                    return "-" + d.target.relType + "->";
                else
                    return "<-" + d.target.relType + "-";
            }).style("font-size", "8px").style("fill", "brown")
                .link.attr("d", d3.svg.diagonal());

            link.exit().remove();
        };

        // Function to center node when clicked/dropped so node doesn't get lost
        // when collapsing/moving with large amount of children.

        centerNode = function (source) {
            scale = zoomListener.scale();
            x = -source.y0;
            y = -source.x0;
            if (isNaN(x) || isNaN(y)) {
                console.log(" node " + source.name + " has no x0 or y0");
                return;
            }
            x = x * scale + 100;// + viewerWidth / 2;
            y = y * scale + viewerHeight / 2;
            d3.select('g').transition().duration(duration).attr("transform",
                "translate(" + x + "," + y + ")scale(" + scale + ")");
            zoomListener.scale(scale);
            zoomListener.translate([x, y]);

        }

        centerNode2 = function (x, y, scale) {
            svgGroup.attr("transform", "translate(" + [x, y] + ")scale("
                + scale + ")");

        }

        // Toggle children function

        function toggleChildren(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else if (d._children) {
                d.children = d._children;
                d._children = null;
            }
            return d;
        }

        function click(d, aa, bb) {
            var zz = window.event;
            var e = d3.event;
            console.log(d.x0 + "   " + d.y0);
            hidePopupMenu();
            selectedNode = d3.select(this).datum();
            currentObject = selectedNode;

            d3.selectAll(".nodeCircle").each(
                function (d, i) {

                    if (d.id && d.id == selectedNode.id) {
                        var xxx = d.x;

                    }


                });

            if (e.ctrlKey) {
                /*
                 * var mode=$("#modifyModeSelect").val();
                 * if(mode=="modificationsAllowed"){
                 * $("#popupMenu").css("visibility","visible").css("top",e.layerY).css("left",e.layerX);
                 * //startLinkNodes(selectedNode,currentLinkActionTargetNode); }
                 * else getNodeAllRelations(selectedNode.id,"tree");
                 */
            } else if (e.altKey) {
                centerNode(d);
            } else {

                //OK Chrome pas OK le sautres
                var x = e.offsetX + 10;
                var y = e.offsetY + 100;
                if (e.offsetX < 50) {//IE
                    var xy0 = $("#graphDiv").offset();
                    var x = e.clientX - xy0.left + 10;
                    var y = e.clientY - xy0.top + 100;

                }

                if (Gparams.readOnly == true) {
                    dispatchAction('nodeInfos');
                } else {
                    showPopupMenu(x, y);

                }
                // getNodeAllRelations(selectedNode.id,"tree",true,false);

                return false;

            }

        }

        function dblclick(d) {
            selectedNode = d3.select(this).datum();
            var id = selectedNode.id;
            if (true || Gparams.navigationStyle == "jpt") {
                dispatchAction('setAsRootNode');
                return true;
            }
            getGraphDataAroundNode(id);
        }

        this.update = function (source) {
            // Compute the new height, function counts total children of root
            // node and sets tree height accordingly.
            // This prevents the layout looking squashed when new nodes are made
            // visible or looking sparse when nodes are removed
            // This makes the layout more consistent.
            var levelWidth = [1];
            var childCount = function (level, n) {

                if (n.children && n.children.length > 0) {
                    if (levelWidth.length <= level + 1)
                        levelWidth.push(0);

                    levelWidth[level + 1] += n.children.length;
                    n.children.forEach(function (d) {
                        childCount(level + 1, d);
                    });
                }
            };
            childCount(0, root);
            var newHeight = d3.max(levelWidth) * Gparams.treeGraphVertSpacing; // 25 pixels per line
            tree = tree.size([newHeight, viewerWidth]);

            // Compute the new tree layout.
            var nodes = tree.nodes(root).reverse(), links = tree.links(nodes);

            // Set widths between levels based on maxLabelLength.
            nodes.forEach(function (d) {
              //  d.y = (d.depth * (maxLabelLength * 10));
                d.y = (d.depth * HorNodesSpacing); // 500px per level.

            });


            node = svgGroup.selectAll("g.node").data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });
            var nodeEnter = node.enter().append("g").attr("id", function (d) {
                return "P_" + d.id;
            })
                .call(dragListener).attr(
                    "class", "node").attr("transform", function (d) {
                    return "translate(" + source.y0 + "," + source.x0 + ")";
                })

                .on("click", d3common.d3CommonClick)
                .on("dblclick", d3common.d3CommonDblclick)
                .on("mouseover", d3common.d3CommonMouseover)
                .on("mouseout", d3common.d3CommonMouseout)


            nodeEnter.append("text")
                .attr("x", function (d) {
                return d.children || d._children ? -12 : 12;
            })
                .attr("dy", ".35em")
                .attr('class', 'nodeText')
                .style("text-anchor", function (d) {

                    return d.children || d._children ? "end" : "start";
                })

                .attr("transform", "rotate(-25)")
                .style("fill", function (d) {

                    if (d.label == "MotCle")
                        return red;
                    return currentTextColor;
                })/*.attr("text-anchor", function(d) {
                 return d.children || d._children ? "end" : "start";
                 })*/.text(function (d) {
                d=textOutputs.formatNode(d);
                if (d.name && d.name.length > Gparams.nodeMaxTextLength)
                    return d.name.substring(0, Gparams.nodeMaxTextLength - 1) + "...";
                return d.name;

            }).style("fill-opacity", 0);


            nodeEnter.append("svg:circle")

                .attr("r", function (d) {
                    if (d.decoration && d.decoration.size)
                        return d.decoration.size;
                    if(d.hiddenChildren && d.hiddenChildren.length > 0)
                    return Gparams.circleR * 1.2;
                    return 12;
                }).style("fill", function (d) {
                if (d.decoration && d.decoration.color)
                    return d.decoration.color;
                var color = nodeColors[d.label];
                if (!color)

                    return Gparams.defaultNodeColor;
                return color;
            }) .style('fill-opacity', function (d) {
                    if (d.isRoot == true)
                        return 1;

                    return 0.7;
                }).style("stroke", function (d) {
                if (d.isTarget)
                    return "purple";
                if (d.isRoot || d.isTarget == true)
                    return "purple";

                return "000";
            }).style("stroke-width", function (d) {
                if (d.isRoot || d.isTarget == true)
                    return 4;
                return 1;
            })
            ;

            node.each(function (d) {

                var anode = d3.select(this);
                if (d.hiddenChildren && d.hiddenChildren.length > 0) {
                    anode.append("text").attr("x", 0).attr("y", 5).text(function (d) {
                        return d.hiddenChildren.length;
                    }).attr("text-anchor", "middle").style("fill", "purple")
                }
            });


            // Transition nodes to their new position.
            var nodeUpdate = node.transition().duration(duration).attr(
                "transform", function (d) {
                    return "translate(" + d.y + "," + d.x + ")";
                });

            // Fade the text in
            nodeUpdate.select("text").style("fill-opacity", 1);
            //	console.log(maxPoint.x+"   "+maxPoint.y);
            if (currentGraphPanel == "graphPathsPanel")
                drawGraphPathTargetLink();

            // Transition exiting nodes to the parent's new position.
            var nodeExit = node.exit().transition().duration(duration).attr(
                "transform", function (d) {
                    return "translate(" + source.y + "," + source.x + ")";
                }).remove();


            // Update the links…
            var link = svgGroup.selectAll("path.link").data(links, function (d) {
                return d.target.id;
            });

            // Enter any new links at the parent's previous position.
            link.enter().insert("path", "g").attr("class", function (d) {
                if (d.target.linkType && d.target.linkType == "meronyme")
                    return "linkMeronyme";
                return "link";

            }).attr("id", function (d) {
                return "link_" + d.target.id;
            })

            /*
             * .attr("xlink:href", function(d) { return "#link_" + d.target.id; }) //
             * place the ID of the path here .style("text-anchor", "middle") //
             * place the text halfway on the arc .attr("startOffset",
             * "50%").text(function(d) { return "-"+d.target.relType+"->";
             * }).style("font-size", "12px")
             */

                .attr("d", function (d) {
                    var o = {
                        x: source.x0,
                        y: source.y0
                    };
                    return diagonal({
                        source: o,
                        target: o
                    });
                }).attr("stroke", function (d) {
                if (d.target.decoration) {
                    if (d.target.decoration.color)
                        return d.target.decoration.color;
                    return "purple";
                }
                if (d.target.color)
                    return d.target.color;
                else
                    return nodeColors[d.target.label];

            })

                .style('opacity', function (d) {
                    if (d.target.decoration)
                        return .2;
                    if (d.isRoot == true)
                        return 1;


                    return Gparams.minOpacity;

                })

                .attr("stroke-width", Gparams.relStrokeWidth)
                .attr("stroke", "#65dbf1").attr("fill", "none").attr("stroke", function (d) {
                return nodeColors[d.target.label]
            });
            /*
             * .style("stroke-dasharray",function (d){ return ("3, 3"); });
             */
            if (Gparams.showRelationNames) {

                var relText = svgGroup.append("svg:g").selectAll("path")
                    .data(links).enter().append("text").append("textPath")
                    .attr("xlink:href", function (d) {
                        return "#link_" + d.target.id;
                    }) // place the ID of the path here
                    .attr("marker-end", "url(#arrowhead)").style("text-anchor",
                        "end") // place the text halfway on the arc
                    .attr("startOffset", "90%").text(function (d) {
                        if (d.target.relDir == "normal")
                            return "-" + d.target.relType + "->";
                        else
                            return "<-" + d.target.relType + "-";
                    }).style("font-size", "10px").style("border", "2px").style("fill", "brown").attr(
                        "pointer-events", "mouseover").on("mouseover",
                        function (link) {
                            // ;overPath(link);
                        }).on("mouseout", function (link) {
                        // ;outPath(link);
                    })
            }


            // Transition links to their new position.
            link.transition().duration(duration).attr("d", diagonal);

            // Transition exiting nodes to the parent's new position.
            link.exit().transition().duration(duration).attr("d", function (d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            }).remove();

            // Stash the old positions for transition.
            nodes.forEach(function (d) {
                d.x0 = d.x;
                d.y0 = d.y;
            });

        }

        // Append a group which holds all nodes and which the zoom Listener can
        // act upon.
        var svgGroup = baseSvg.append("g").attr("class", "svgGroup");

        // Define the root
        root = treeData;
        root.x0 = viewerHeight / 2;
        root.y0 = 0;
        this.rootNode = root;

        // Layout the tree initially and center on the root node.
        this.update(root);
        centerNode(root);
    }


    this.deleteNode = function (d) {

        for (i = 0; i < d.parent.children.length; i++) {
            if (d.parent.children[i].name === d.name)
                d.parent.children.splice(i, 1);
        }
        this.update(root);

    }

    this.addExternalNode = function (node) {
        delete node.x;
        delete node.y;
        delete node.x0;
        delete node.y0;
        node.parent = root;
        maxId += 1;
        node.id = maxId;
        /*
         * if (!treeData.children) treeData.children = [];
         * treeData.children.push(node); this.update(root);
         */

        if (!root.children)
            root.children = [];
        // root.children.push(node);
        // this.drawTree();
        this.update(root);
    }

    this.updateScreenView = function (d) {
        var count = 0;

        var timer = setInterval(function () {
            this.update(d);
            count++;
            if (count = 5) {
                clearInterval(timer);
            }
        }, 100);

    }

    this.getNewId = function () {
        return ++this.maxId;
    }

    this.showSearchedNode = function (searchedNode) {
        try {
            centerNode(searchedNode);

            d3.selectAll(".nodeCircle").each(function (d, i) {
                d3.select(this).style("fill", function (d) {
                    var color = "lightsteelblue";
                    if (d.id_ == searchedNode.id_)
                        color = "#f00";

                    return color;
                });
            });
        } catch (e) {
            console.log(e + "  " + JSON.stingify(searchedNode));
        }

    }

    this.getTreNodeByNameRecursive = function (parentTreeNode, name) {

        if (!parentTreeNode)
            parentTreeNode = this.root;
        if (!parentTreeNode.children)
        // console.log("-**-" + parentTreeNode.name);
            if (!parentTreeNode.children) {
                return true;
            }
        for (var i = 0; i < parentTreeNode.children.length; i++) {
            var childTreeNode = parentTreeNode.children[i];
            // console.log(parentTreeNode.name + "----------" +
            // childTreeNode.name);
            if (childTreeNode.name.toLowerCase().indexOf(name) > -1) {
                centerNode(childTreeNode);
                var xxx = d3.selectAll(".node");
                var nodes = d3.selectAll(".node")[0];
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].__data__.id_ == childTreeNode.id_) {

                    }
                }

                return true;
            }

            else {
                getTreNodeByNameRecursive(childTreeNode, name);

            }

        }

    }
    this.getRadarImg = function () {

        var html = d3.select("svg").attr("version", 1.1).attr("xmlns",
            "http://www.w3.org/2000/svg").node().parentNode.innerHTML;
        // d3.select("#testIMG").html(html);

        // injection des styles (à revoir pas propre !!!)
        var style = ".radarPointLabel {fill: #fff;font: Consolas, verdana, sans-serif;font-size: 12px;font-weight: normal;pointer-events: none;}";
        style += ".radarAxisTitle {font-size: 28, text-anchor: start, fill: #00f}";
        style += ".title {position: relative;top: 5px;left: 10px;font-size: 18px;font-family: serif;font-weight: bold;}";
        var styleDef = '<defs><style type="text/css"><![CDATA[' + style
            + ']]></style></defs>';
        var p = html.indexOf(">");
        html = html.substring(0, p + 1) + styleDef + html.substring(p);
        return html;
        var imgSrc = 'data:image/svg+xml;base64,' + btoa(html);
        return imgSrc;

    }

    this.setInitialDisplayPosition = function (x, y, scale) {

            var x = 100;
            var y = 0;
            scale = 1;

            var rootXX = d3.select("#P_" + this.rootNode.id);
            //centerNode(rootXX);
            w = $("#graphDiv").width();
            h = $("#graphDiv").height();
            h = 600;
            d3.select('.svgGroup').attr("transform",
                "translate(" + 100 + "," + ((h / 2) - 150) + ")");

            /*	 d3.select('g').transition().duration(duration).attr("transform",
             "translate(" + 200 + "," + (h/2) + ")scale(" + scale + ")");*/

    };
}
