/**
 * Created by claud on 03/08/2017.
 */
var visjsGraph = (function () {
        var self = {};
        var network;

        self.nodes = [];
        self.edges = [];
        self.physicsOn = true;
        self.network = null;
        self.layout = "physics";

        self.previousGraphs = []
        self.previousGraphs.index = -1;
        self.currentLayoutType = "random";
        self.currentLayoutDirection = "";
        self.currentShape = Gparams.graphDefaultShape;
        self.clusters = []
        self.scaleToShowLabels = 0.6;
        self.context = null;
        self.dragRect = {x: 0, y: 0, w: 0, h: 0};

        var stopPhysicsTimeout = 5000;
        var lastClick = new Date();
        var dblClickDuration = 500;


        var dragPosition = {};
        var options = {};


        self.draw = function (divId, visjsData, _options, callback) {
            if (!_options)
                _options = {};

            if (!_options.solver) {
                _options.solver = "barnesHut";
                //  _options.solver="forceAtlas2Based";

            }

            var t0 = new Date();
            if (false && visjsData.nodes.length == 0) {
                $("#graphDiv").html("No  data to display")
                return;

            }

            smoothRelLine = true;
            if (_options && !_options.smooth)
                smoothRelLine = false;

            var container = document.getElementById(divId);
            self.nodes = new vis.DataSet(visjsData.nodes);
            self.edges = new vis.DataSet(visjsData.edges);

            //   var x = Math.log10(self.edges.length * 2) + 1;
            var x = (Math.log(self.edges.length * 2) * Math.LOG10E) + 1;

            if (_options.stopPhysicsTimeout)
                stopPhysicsTimeout = _options.stopPhysicsTimeout;
            else
                stopPhysicsTimeout = Math.pow(10, x);
            //   console.log("x" + x + " stopPhysicsTimeout: " + self.edges.length + " time " + stopPhysicsTimeout)
            data = {
                nodes: self.nodes,
                edges: self.edges
            };


            options = {


                //   interaction: {hover: true},
                manipulation: {
                    enabled: false
                },
                interaction: {
                    dragView: false,
                    multiselect: true
                },


                nodes: {
                    borderWidthSelected:6,
                    shape: 'dot',
                    size: 10,
                    font: {size: 14},
                    /*  scaling: {
                          customScalingFunction: function (min, max, total, value) {
                              return value / total;
                          },
                          min: 5,
                          max: 150
                      },*/
                    scaling: {
                        min: 8,
                        max: 20,
                        /*   label: {
                               min: 10,
                               max: 16,
                               drawThreshold: 10,
                               maxVisible: 16
                           }*/

                    }
                },
                edges:
                    {
                        selectionWidth:5,
                        smooth: smoothRelLine,
                        font:
                            {
                                size: 8
                            }
                        //font: { "font-style":'italic'}
                    }
                ,
                interaction: {

                    keyboard: false
                }


            };
            /* if (_options.scale)
                 options.scale = _options.scale;*/
            options.manipulation = false;


            if (data.edges.length > 1000)
                options.layout = {improvedLayout: false}

            if (_options.fixed) {
                options.physics = false;
            }
            else {
                self.physicsOn = true;
                options.physics = {

                    stabilization: false,
                    timestep: 0.46


                }
            }
            var firstNode = data.nodes._data[Object.keys(data.nodes._data)[0]];
            // var firstNode=data.nodes._data.values().next().value
            if (firstNode && firstNode.x)
                self.physicsOn = false;
            network = new vis.Network(container, data, options);
            //  network.dragView=false;
            self.network = network;


            for (var i = 0; i < self.clusters.length; i++) {

                var clusterOptions = {
                    joinCondition: function (childOptions) {
                        return childOptions.cluster == self.clusters[i]; // the color is fully defined in the node.
                    },
                    clusterNodeProperties: {
                        id: 'cluster:' + color,
                        borderWidth: 3,
                        shape: 'database',
                        color: color,
                        label: 'color:' + color
                    }
                };
                network.cluster(clusterOptions);
            }


            window.setTimeout(function () {
                network.setOptions({
                    physics: {enabled: false},

                });
                if (!_options.scale)
                    network.fit();
                if (_options.onFinishDraw) {

                    var fn = _options["onFinishDraw"];
                    fn();
                }

            }, stopPhysicsTimeout);


            network.on("zoom", function (params) {
                var scale = network.getScale();
                $("#graphInfosSpan").html(" scale " + Math.round(scale * 100) + "%");
                if (_options.showNodesLabel == false && scale > self.scaleToShowLabels) {
                    var nodes = [];
                    for (var key in self.nodes._data) {
                        nodes.push({id: key, label: self.nodes._data[key].hiddenLabel});
                    }
                    self.nodes.update(nodes);

                }


            });
            network.on("configChange", function () {
                // this will immediately fix the height of the configuration
                // wrapper to prevent unecessary scrolls in chrome.
                // see https://github.com/almende/vis/issues/1568
                var div = container.getElementsByClassName('vis-configuration-wrapper')[0];
                div.style["height"] = div.getBoundingClientRect().height + "px";
            });

            network.on("doubleClick", function (params) {
                /*        var nodeId = params.nodes[0];
                        currentObject = self.nodesMap[nodeId];
                        toutlesensController.generateGraph(nodeId, {applyFilters: false});//NO !!! minus sign to search on m (see toutlesensData 148)*/
            })
            //stop animation
            network.on("click", function (params) {
                if (_options.onClick) {
                    var fn = _options["onClick"];
                    return fn(params);
                }

                $("#graphPopup").css("visibility", "hidden");
                if (params.edges.length == 0 && params.nodes.length == 0) {
                    self.physicsOn = !self.physicsOn;
                    network.setOptions({
                        physics: {enabled: self.physicsOn}
                    });

                    if (_options.onFinishDraw) {
                        var fn = _options["onFinishDraw"];
                        fn();
                    }
                    else {
                        network.fit()
                    }


                }
                else if (params.nodes.length == 1) {
                    var nodeId = params.nodes[0];
                   // self.outlineNodeEdges(nodeId);
                    currentObject = self.nodes._data[nodeId];
                    /*   var now=new Date().getTime();
                     //  console.log(params.event.timeStamp+" "+now.getTime())
                       var delay=Math.abs(now-lastClick)
                       lastClick=now;
                       console.log(delay);
                       if(delay<dblClickDuration) {//dbleclick*/
                    currentObject._graphPosition = params.pointer.DOM;
                    if (params.event.srcEvent.ctrlKey) {
                        toutlesensController.dispatchAction("expandNode", nodeId)

                    }

                    var point = params.pointer.DOM;
                    if (toutlesensController) {
                        toutlesensController.dispatchAction("nodeInfos", nodeId);
                        toutlesensController.showPopupMenu(point.x, point.y, "nodeInfo");
                    }
                    else if (admin) {
                        admin.showPopupMenu(point.x, point.y);
                    }


                }
                else if (params.edges.length == 1) {
                    var edgeId = params.edges[0];
                    currentObject = self.edges._data[edgeId];
                    currentObject.fromNode = self.nodes._data[currentObject.from]
                    currentObject.toNode = self.nodes._data[currentObject.to]
                    toutlesensController.dispatchAction("relationInfos", nodeId);
                    var point = params.pointer.DOM;
                    toutlesensController.showPopupMenu(point.x, point.y, "relationInfos");
                }
            });
            network.on("beforeDrawing", function (ctx) {
                self.context = ctx;
            });
            network.on("afterDrawing", function (ctx) {
                self.context = ctx;
                if (callback)
                    callback();
            });

            network.on("dragStart", function (params) {
                dragPosition = params.pointer.DOM;

                //   self.dragRect("dragStart",dragPosition.x,dragPosition.y);
            });

            network.on("drag", function (params) {
                dragPosition = params.pointer.DOM;
                //  self.dragRect("drag",dragPosition.x,dragPosition.y);
            });

            network.on("dragEnd", function (params) {

                var dragEndPos = params.pointer.DOM;
                self.dragRect("dragEnd", dragPosition.x, dragPosition.y);
                if ((true ||_options.dragConnectedNodes) && params.event.srcEvent.ctrlKey) {
                    self.dragConnectedNodes(params.nodes[0], {
                        x: dragEndPos.x - dragPosition.x,
                        y: dragEndPos.y - dragPosition.y
                    });
                }
                if (_options.onEndDrag) {


                    var fn = _options["onEndDrag"];
                    fn();
                }
                else {
                    network.fit()
                }


            });

            network.on("hoverNode", function (params) {

            });
            network.on("selectNode", function (params) {


            });


            network.on("selectEdge", function (params) {
                console.log('selectEdge Event:', params);
            });
            network.on("deselectNode", function (params) {
                console.log('deselectNode Event:', params);
            });
            network.on("deselectEdge", function (params) {
                console.log('deselectEdge Event:', params);
            });
            network.on(" afterDrawing", function (params) {
                onVisjsGraphReady();
                console.log('graph loaded Event');
            });

            if (true) {// rightclick drag to select by rect drag
                container = $("#graphDiv");
                container.on("mousemove", function (e) {
                    if (drag) {
                        restoreDrawingSurface();
                        rect.w = (e.pageX - this.offsetLeft) - rect.startX;
                        rect.h = (e.pageY - this.offsetTop) - rect.startY;

                        ctx.setLineDash([5]);
                        ctx.strokeStyle = "rgb(0, 102, 0)";
                        ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
                        ctx.setLineDash([]);
                        //ctx.fillStyle = "rgba(0, 255, 0, 0.02)";
                        ctx.fillStyle = "rgba(0, 0, 0, 0.02)";
                        ctx.fillRect(rect.startX, rect.startY, rect.w, rect.h);
                    }
                });

                container.on("mousedown", function (e) {
                    if (e.button == 2) {
                        selectedNodes = e.ctrlKey ? network.getSelectedNodes() : null;
                        saveDrawingSurface();
                        var that = this;
                        rect.startX = e.pageX - this.offsetLeft;
                        rect.startY = e.pageY - this.offsetTop;
                        drag = true;
                        container[0].style.cursor = "crosshair";
                    }
                });

                container.on("mouseup", function (e) {
                    if (e.button == 2) {
                        restoreDrawingSurface();
                        drag = false;

                        container[0].style.cursor = "default";
                        selectNodesFromHighlight();
                    }
                });


            }


        }
        self.outlineNodeEdges=function(nodeId) {
            self.edges.setOption({width: 1})


            var connectedEdges = network.getConnectedEdges(nodeId);
            var nodeEdges = [];
            for (var i = 0; i < connectedEdges.length; i++) {
                var connectedEdgeId = connectedEdges[i];
                nodeEdges.push[{id:""+connectedEdgeId,width:5}]

            }
            self.edges.update(nodeEdges)
        }



        self.setShapeOption = function (shape) {
            self.currentShape = shape;
            var nodes = [];
            for (var key in self.nodes._data) {
                nodes.push(key)
            }
            self.paintNodes(nodes, null, null, null, shape)

        }

        self.setLayoutType = function (layoutStr, apply) {
            var layoutArray = layoutStr.split(" ");
            var layoutType = layoutArray[0];
            var sortMethod = "";
            if (layoutArray.length > 1)
                sortMethod = layoutArray[1];
            self.currentLayoutType = layoutType;
            if (layoutType == "hierarchical") {
                ($("#graphLayoutDirectionDir").css("visibility", "visible"))
                options.layout = {hierarchical: {sortMethod: sortMethod, direction: self.currentLayoutDirection}}
            }
            if (layoutType == "random") {
                ($("#graphLayoutDirectionDir").css("visibility", "hidden"))
                options.layout = {hierarchical: false, randomSeed: 2}
            }
            if (apply) {
                network.setOptions(options)
            }
            return (options)
        }
        self.setLayoutDirection = function (direction, apply) {
            self.currentLayoutDirection = direction;

            if (self.currentLayoutType == "hierarchical") {
                options.layout = {hierarchical: {direction: direction}}
            }

            if (apply) {
                // var xx=network.layoutEngine.options;
                network.setOptions(options)
            }
            return (options)
        }


        self.drawLegend = function (labels, relTypes) {
            var nodes = [];
            var x = 10;
            var y = -50;
            for (var i = 0; i < labels.length; i++) {
                var label = labels[i];
                if (!nodeColors[label])
                    continue;
                labelObj = {
                    id: label,
                    shape: "square",
                    size: 5,
                    color: nodeColors[label],
                    label: label,
                    font: {size: 10},
                    x: x,
                    y: y,
                    // margin: { top: 5, right:5, bottom:5, left: 5 }
                }
                x += 50
                nodes.push(labelObj);
            }
            ;


            var data = {
                nodes: nodes,
                edges: []
            };
            var options = {
                nodes: {
                    shape: 'square'
                }
            };
            var container = document.getElementById("graphLegendDiv");
            var network = new vis.Network(container, data, options);
            network.on("click", function (params) {

                var label = params.nodes[0];
                currentLabel = label;
                currentObject.id == null;
                return toutlesensController.generateGraph(null, {applyFilters: true}, function (err, result) {
                    currentLabel = null;
                });


            });
        }


        self.paintNodes = function (nodeIds, color, otherNodesColor, radius, shape) {
            var nodes = [];
            if (!shape)
                shape = "star";
            /* for(var i=0;i< nodeIds.length;i++) {
             var node = self.nodes._data[nodeIds[i]];
             node.color = {background: color};
             nodes.push(node);
             }*/
            for (var i = 0; i < nodeIds.length; i++) {// transform ids in string
                nodeIds[i] = "" + nodeIds[i];
            }
            for (var key in  self.nodes._data) {
                var node = self.nodes._data[key];
                if (nodeIds.indexOf(key) > -1) {
                    if (shape)
                        node.shape = shape;
                    if (color)
                        node.color = color
                    if (radius)
                        node.size = radius * 2;
                    /* node.color = {background: color};
                    // node.color = {color: color};
                    // node.size =Math.min(node.size*1.5,radius*2);
                     node.size = 2 * radius;*/
                }
                else {
                    if (node.initialColor)
                        node.color = {background: node.initialColor};
                    if (node.labelNeo == currentLabel) {
                        node.size = 15;

                    }

                    if (node.image && node.image.length > 0) {
                        node.shape = 'circularImage';
                        node.image = node.image.replace(/File:/, "File&#58;");
                        node.brokenImage = "images/questionmark.png";
                        node.borderWidth = 4
                        node.size = 30;

                    }
                    else if (node.icon && node.icon.length > 0) {
                        node.shape = 'circularImage';
                        node.image = node.icon;
                        node.brokenImage = 'http://www.bnf.fr/bnf_dev/icono/bnf.png'
                        node.borderWidth = 4
                        node.size = 30;

                    }
                    else {
                        // node.shape = null;
                        node.size = 15;
                        node.shape = self.currentShape;
                    }
                }
                nodes.push(node);
            }


            self.nodes.update(nodes);

        }
        self.selectNode = function (ids) {
            network.selectNodes(ids, true);

        }

        self.updateNodes = function (nodes) {
            self.nodes.update(nodes);

        }


        self.scaleNodes = function (nodes, valueProp) {
            var newNodes = []
            for (var key in nodes._data) {
                newNodes.push({id: nodes._data[key].id, value: nodes._data[key][valueProp]})
                //  nodes[i]._data.value= nodes[i]._data[valueProp];

            }
            self.nodes.update(newNodes);

        }


        self.paintEdges = function (relIds, color, otherRelColor, radius) {
            var edges = []
            /* for(var i=0;i< nodeIds.length;i++) {
             var node = self.nodes._data[nodeIds[i]];
             node.color = {background: color};
             nodes.push(node);
             }*/

            //var relations=self.visjsData.edges;
            //   for (var i=0;i<relations.length;i++) {
            for (var key in self.edges._data) {
                var edge = self.edges._data[key];
                if (relIds.indexOf(edge.neoId) > -1) {
                    self.edges._data[key].color = {color: color};
                    self.edges._data[key].width = 3;
                    // self.edges[key].width = 3;
                }
                else {
                    if (otherRelColor)
                        self.edges._data[key].color = {color: otherRelColor};

                    edges.push(edge);
                }

            }
            network.setData({nodes: self.nodes, edges: self.edges});

            //  physics: {enabled: true}
            network.setOptions({
                physics: {enabled: true}
            });
            // network.fit()

            //  self.edges.update(edges);


        }

        self.displayRelationNames = function (option) {
            var show
            if (option)
                show = option.show
            show = $("#showRelationTypesCbx").prop("checked");
            Gparams.showRelationNames = show;

            for (var key in self.edges._data) {
                if (show) {
                    self.edges._data[key].label = self.edges._data[key].type;
                    self.edges._data[key].label.arrows = 'to';
                    //  self.edges._data[key].font = {background: "red","font-style": 'italic', "font-size": "8px",strokeWidth: 0}
                    self.edges._data[key].font = {size: 8, color: 'grey', face: 'arial'}
                }
                else
                    delete self.edges._data[key].label;

            }
            network.setData({nodes: self.nodes, edges: self.edges});

            //  physics: {enabled: true}
            network.setOptions({
                physics: {enabled: true}
            });
            //   network.fit()
        }


        self.toList = function () {
            var outputNodes = {};
            var nodes = self.nodes._data;
            for (var key in self.edges._data) {
                var edge = self.edges._data[key];
                if (!outputNodes[edge.from]) {
                    var node = nodes[edge.from]
                }
                outputNodes[edge.from] = {name: "aaa"}

            }
        }

        self.changeLayout = function (select) {
            self.layout = $(select).val();
            var options = {}

            if (self.layout == "physics") {

                options.physics = {
                    enabled: true,
                    stabilization: false,
                    timestep: 0.46
                };

            }

            if (self.layout == "hierarchical") {
                options.layout = {
                    hierarchical: {
                        direction: "UD"
                    }
                    ,
                    stabilization: false,
                    timestep: 0.46
                };
            }
            network.setOptions(options);
            network.fit()
        }

        self.fitToPage = function () {
            network.fit({
                animation: {
                    scale: 1.0,
                    animation: {
                        duration: 1000,
                    }
                }
            })
        }
        self.zoomOnNode = function (expression) {
            var regex = new RegExp(".*" + expression + ".*", 'i');
            var nodes = [];
            for (var key in  self.nodes._data) {
                var node = self.nodes._data[key];
                var str = node.label;
                if (!str)
                    str = node.neoAttrs[Schema.getNameProperty()]
                if (str.match(regex)) {
                    self.nodes.update({id: node.id, shape: "star", label: Schema.getNameProperty()});
                    network.focus(node.id,
                        {
                            scale: 1.0,
                            animation: {
                                duration: 1000,
                            }
                        });
                }

            }
        }

        self.findNode = function (expression, color, radius) {
            var regex = new RegExp(".*" + expression + ".*", 'i');
            var nodes = [];
            for (var key in  self.nodes._data) {
                var node = self.nodes._data[key];
                if (node.label.match(regex)) {
                    node.color = {background: color};
                    node.size = 2 * radius;
                }
                else {

                    node.color = node.initialColor;
                }
                nodes.push(node);
            }


            self.nodes.update(nodes);
            network.fit()

        }
        self.outlinePathNodes = function () {
            var pathNodes = []
            for (var key in  self.nodes._data) {
                var node = self.nodes._data[key];
                if (node.isSource) {
                    //  node.x = 0;
                    //   node.y = 0;
                    pathNodes.push("" + node.id);
                }
                if (node.target) {
                    // node.x = $("#graphDiv").width();
                    //   node.y = $("#graphDiv").height();
                    pathNodes.push("" + node.id);
                }
            }
            self.paintNodes(pathNodes, "red", null, 20);
        }


        self.exportGraph = function () {
            function objectToArray(obj, positions) {
                return Object.keys(obj).map(function (key) {
                    obj[key].id = key;
                    if (positions[key]) {
                        obj[key].x = positions[key].x;
                        obj[key].y = positions[key].y;
                    }
                    return obj[key];
                });
            }

            function addConnections(elem, index) {
                // need to replace this with a tree of the network, then get child direct children of the element
                elem.connections = network.getConnectedNodes(elem.id);
            }

            function destroyNetwork() {
                network.destroy();
            }

            var positions = network.getPositions();

            var nodes = objectToArray(self.nodes._data, positions);
            nodes.forEach(addConnections);
            return nodes;

            // pretty print node data
            //  var exportValue = JSON.stringify(nodes, undefined, 2);
            //  console.log(exportValue)


        }

        self.graph2Text = function () {
            var str0 = "";
            var graphNodesArray = self.exportGraph();
            var graphData = {}
            for (var i = 0; i < graphNodesArray.length; i++) {
                var node = graphNodesArray[i];
                graphData[node.id] = node;
            }


            function node2Text(node) {

                var str = "";
                var properties = node.neoAttrs;
                var color = nodeColors[node.labelNeo];
                var connections = node.connections
                str += "<br>" + "[" + node.labelNeo + "]" + JSON.stringify(properties)
                str += "<ul>"
                for (var i = 0; i < connections.length; i++) {
                    str += "<li>"
                    var linkedNode = graphData["" + connections[i]];
                    str += "[" + linkedNode.labelNeo + "]" + linkedNode.neoAttrs[Schema.getNameProperty()]
                    str += "</li>"


                }
                str += "</ul>"
                return str;

            }

            for (var key in graphData) {
                var node = graphData[key];
                str0 += node2Text(node);
            }

            return str0;
        }

        self.importGraph = function (inputData, options) {
            if (!options) {
                options = {};
            }


            function getNodeData(data) {
                var networkNodes = [];
                data.forEach(function (elem, index, array) {
                    networkNodes.push(elem);
                    //   networkNodes.push({id: elem.id, label: elem.id, x: elem.x, y: elem.y});
                });
                return networkNodes;
                // return new vis.DataSet(networkNodes);
            }

            function getNodeById(data, id) {
                for (var n = 0; n < data.length; n++) {
                    if (data[n].id == id) {  // double equals since id can be numeric or string
                        return data[n];
                    }
                }
                ;

                throw 'Can not find id \'' + id + '\' in data';
            }

            function getEdgeData(data) {
                var networkEdges = [];

                data.forEach(function (node) {
                    // add the connection
                    node.connections.forEach(function (connId, cIndex, conns) {
                        networkEdges.push({from: node.id, to: "" + connId});
                        var cNode = getNodeById(data, connId);

                        var elementConnections = cNode.connections;

                        // remove the connection from the other node to prevent duplicate connections
                        var duplicateIndex = elementConnections.findIndex(function (connection) {
                            return connection == node.id; // double equals since id can be numeric or string
                        });


                        if (duplicateIndex != -1) {
                            elementConnections.splice(duplicateIndex, 1);
                        }
                        ;
                    });
                });

                return networkEdges;

                //   return new vis.DataSet(networkEdges);

            }

            var data = {
                nodes: getNodeData(inputData),
                edges: getEdgeData(inputData)
            }
            self.draw("graphDiv", data, options);
            //  network = new vis.Network(container, data, {});

        }


        self.getConnectedNodes = function (nodeId) {

            return network.getConnectedNodes(nodeId);

        }

        /**
         *
         * when a node is dragged and toutlesensData.queriesIds.length>=2  moves the connected nodes
         *
         * @param nodeId
         * @param offset
         */

        self.dragConnectedNodes = function (nodeId, offset) {

            var connectedNodes = network.getConnectedNodes(nodeId);
            var connectedEdges = network.getConnectedEdges(nodeId);
            var positions = network.getPositions()
            var nodes = [];
            var edges = []
            for (var i = 0; i < connectedNodes.length; i++) {
                var connectedId = connectedNodes[i];

                if (true || toutlesensData && toutlesensData.queriesIds.indexOf(connectedId) < 0) {
                    var node = self.nodes._data["" + connectedId];
                    node.x = positions[connectedId].x + offset.x;
                    node.y = positions[connectedId].y + offset.y;
                    nodes.push(node);


                }
            }

            for (var i = 0; i < connectedEdges.length; i++) {
                var connectedEdgeId = connectedEdges[i];


                var edge = self.edges._data["" + connectedEdgeId];
                //  if(toutlesensData.queriesIds.indexOf(edge.from)<0) {
                edge.smooth = {
                    type: 'continuous'
                };
                edges.push(edge)


                //}
            }

            self.edges.update(edges);
            self.nodes.update(nodes);


        }


        self.previousGraph = function () {
            self.previousGraphs.index -= 1;
            if (self.previousGraphs.index < 0)
                self.previousGraphs.index = 0;
            self.reloadGraph(self.previousGraphs.index);
            self.setPreviousNextButtons();
        }
        self.nextGraph = function () {
            self.previousGraphs.index += 1;
            self.reloadGraph(self.previousGraphs.index);
            self.setPreviousNextButtons();
        }

        self.setPreviousNextButtons = function () {
            if (self.previousGraphs.index > 0)
                $("#previousMenuButton").css("visibility", "visible")
            else
                $("#previousMenuButton").css("visibility", "hidden")
            if (self.previousGraphs.index < (self.previousGraphs.length - 1))
                $("#nextMenuButton").css("visibility", "visible")
            else
                $("#nextMenuButton").css("visibility", "hidden")
        }


        self.saveGraph = function () {
            self.previousGraphs.index += 1
            self.previousGraphs.push(self.exportGraph());
            self.setPreviousNextButtons();

        }


        self.reloadGraph = function (index) {

            var data = self.previousGraphs[index];
            self.importGraph(data);
        }

        self.filterGraph = function (objectType, booleanOption, property, operator, value, type) {
            self.saveGraph();


            if (objectType == "node") {



                var selectedNodes=[];
                var selectedEdges=[];
                for (var key in  self.nodes._data) {



                       var node = self.nodes._data[key];
                       if (currentObject && currentObject.id && currentObject.id == node.id)
                           ;
                       else {
                           var connectedEdges = network.getConnectedEdges(key);
                           var nodeEdges=[];
                           for (var i = 0; i < connectedEdges.length; i++) {
                               var connectedEdgeId = connectedEdges[i];
                               nodeEdges.push(connectedEdgeId);

                           }

                           var nodeOk = paint.isLabelNodeOk(node, property, operator, value, type);
                           if (nodeOk || booleanOption=="all") {
                               selectedNodes.push({id: "" + node.id, hidden: false});
                               for (var i = 0; i < nodeEdges.length; i++) {
                                   selectedEdges.push({id: "" + nodeEdges[i], hidden: false})
                               }
                           }
                           else {
                               selectedNodes.push({id: "" + node.id, hidden: true});
                               for (var i = 0; i < nodeEdges.length; i++) {
                                   selectedEdges.push({id: "" + nodeEdges[i], hidden: true})
                               }
                           }






                   }
                }
                self.nodes.update(selectedNodes);
                self.edges.update(selectedEdges);
            }
            else if (objectType == "relation") {

                //    TO DO   !!!!
            }
        }


        self.removeNode = function (id) {
            var connectedEdges = network.getConnectedEdges(id);
            for (var i = 0; i < connectedEdges.length; i++) {
                var connectedEdgeId = connectedEdges[i];
                self.edges.remove({id: connectedEdgeId})
            }

            self.nodes.remove({id: id})
        }

        self.updateNode = function (obj) {
            var node = self.nodes._data[obj.id];
            node.label = (obj[Schema.getNameProperty()])
            self.nodes.update(node);
        }

        self.addNode = function (node) {
            function exeAdd() {
                node.x = -100;
                node.y = -100;
                node.color = nodeColors[node.labelNeo]

                self.nodes.add(node);
            }

            if (self.nodes.length == 0) {
                //init empty Graph

                self.draw("graphDiv", {nodes: [], edges: []});
                $("#graphLayoutSelect").val("random");
                $("#graphPopup").html(toutlesensDialogsController.getNodeInfoButtons());
                setTimeout(exeAdd, 1000);
            } else
                exeAdd();


        }

        self.addRelation = function (edge) {
            if (self.nodes.length == 0) {
                //init empty Graph
                self.draw("graphDiv", {nodes: [], edges: []});
                $("#graphPopup").html(toutlesensDialogsController.getNodeInfoButtons());

            }
            self.edges.add(edge);
        }

        self.deleteRelation = function (edgeId) {
            self.edges.remove(edgeId);
        }


        self.dragRect = function (action, x, y) {
            var ctx = self.context;
            if (action == "dragStart") {
                self.dragRect.x = x;
                self.dragRect.y = y;

            }
            else if (action.indexOf("drag") == 0) {
                self.dragRect.w = x - self.dragRect.x;
                self.dragRect.h = y - self.dragRect.y;
                self.dragRect.w = 200;
                self.dragRect.h = 300;


                if (action == "dragEnd") {
                    var ctx = self.context;
                    ctx.strokeStyle = '#A6D5F7';
                    ctx.fillStyle = '#294475';
                    ctx.rect(self.dragRect.x, self.dragRect.y, self.dragRect.w, self.dragRect.h);
                    ctx.fill();
                    ctx.stroke();

                }


            }
        }


        return self;


    }
)
()
