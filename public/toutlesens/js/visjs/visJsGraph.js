/**
 * Created by claud on 03/08/2017.
 */
var visjsGraph = (function () {
    var self = {};
    var network;
    self.physicsOn = true;
    self.nodesMap = {};
    var nodes;
    self.visjsData = {nodes: [], edges: []};
    var dataLabels = [];
    var colors = [];
    var stopPhysicsTimeout = 5000

    var formatData = function (resultArray) {


        self.nodesMap = {};
        self.visjsData = {nodes: [], edges: []};
        for (var i = 0; i < resultArray.length; i++) {
            var rels = resultArray[i].rels;
            var nodes = resultArray[i].nodes;
            var relProperties= resultArray[i].relProperties;


            if (!nodes)
                continue;

            var ids = resultArray[i].ids;
            var legendRelIndex = 1;

            for (var j = 0; j < nodes.length; j++) {
                var neoId = nodes[j]._id;
                if (!self.nodesMap[neoId]) {
                    var nodeNeo = nodes[j].properties;

                    var labels = nodes[j].labels;
                    var nodeObj = {
                        label: nodeNeo[Gparams.defaultNodeNameProperty],
                        labelNeo: labels[0],// because visjs where label is the node name
                        color: nodeColors[nodes[j].labels[0]],
                        myId: nodeNeo.id,
                        id: neoId,
                        children: [],
                        neoAttrs: nodeNeo,

                        endRel: rels[0]


                    }
                    self.visjsData.nodes.push(nodeObj);
                    self.nodesMap[neoId] = nodeObj;
                    if (dataLabels.indexOf(nodeObj.labelNeo) < 0)
                        dataLabels.push(nodeObj.labelNeo);
                }


            }

            for (var j = 0; j < rels.length; j++) {
                var rel = rels[j];
                var relObj = {
                    from: ids[j],
                    to: ids[j + 1],
                    type:rel,
                    neoId:relProperties[j]._id,
                    neoAttrs:relProperties[j].properties,
                    color: linkColors[self.nodesMap[ids[j + 1]].endRel]
                }
                self.visjsData.edges.push(relObj);
            }
        }
        for (var i = 0; i < dataLabels.length; i++) {
            colors.push(nodeColors[dataLabels[i]])
        }
        return self.visjsData;//testData;
    }


    self.draw = function (divId, resultArray) {
        var t0 = new Date();
        var data0 = formatData(resultArray);
        var t1 = new Date();
        console.log("--------------t0   " + (t1 - t0));
        var container = document.getElementById(divId);
        self.nodes = new vis.DataSet(data0.nodes);
        self.edges = new vis.DataSet(data0.edges);
        data = {
            nodes: self.nodes,
            edges: self.edges
        };
        /*   var options = {};
         if(data.edges.length>20){
         options.layout= {
         improvedLayout: false,
         }
         options.physics={
         stabilization: true
         }
         }*/


        var options = {


            //   interaction: {hover: true},
            manipulation: {
                enabled: true
            },
            physics: {
                stabilization: false,
                /*  barnesHut: {
                 gravitationalConstant: -80000,
                 springConstant: 0.001,
                 springLength: 200
                 }*/
            },
            nodes: {
                shape: 'dot',
                size: 10,
                font: {size: 14}
            },
            edges: {
                smooth: true
            },
            interaction: {
               // navigationButtons: true,
                keyboard: true
            }


        };

        if (false && data.edges.length > 100)
            options.improvedLayout = false,

                self.physicsOn = true;
        network = new vis.Network(container, data, options);
        window.setTimeout(function () {
            network.setOptions({
                physics: {enabled: false}
            });
            network.fit()
        }, stopPhysicsTimeout);


        network.on("configChange", function () {
            // this will immediately fix the height of the configuration
            // wrapper to prevent unecessary scrolls in chrome.
            // see https://github.com/almende/vis/issues/1568
            var div = container.getElementsByClassName('vis-configuration-wrapper')[0];
            div.style["height"] = div.getBoundingClientRect().height + "px";
        });


        //stop animation
        network.on("click", function (params) {
            if (params.edges.length == 0 && params.nodes.length == 0) {
                self.physicsOn = !self.physicsOn;
                network.setOptions({
                    physics: {enabled: self.physicsOn}
                });
                network.fit()

            }
            else if (params.nodes.length == 1) {
                var nodeId = params.nodes[0];
                var point = params.pointer.DOM;
                currentObject = self.nodesMap[nodeId];
                toutlesensController.showPopupMenu(point.x, point.y, "nodeInfo");
            }
        });

        network.on("doubleClick", function (params) {
            var nodeId = params.nodes[0];
            currentObject = self.nodesMap[nodeId];
            toutlesensController.generateGraph(nodeId, false);//NO !!! minus sign to search on m (see toutlesensData 148)
        })

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


        //  var network = new vis.Network(container, data, options);


    }
    self.clusterByLabel = function () {
        var label = paint.currentLabel;
        if (!label || !nodeColors[label])
            return;
        var color = nodeColors[label];
        var clusterOptionsByData = {
            joinCondition: function (childOptions) {
                return childOptions.color.background == color; // the color is fully defined in the node.
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
                id: 'cluster:' + color,
                borderWidth: 3,
                shape: 'star',
                color: color,
                label: 'All ' + label,
                size: 50
            }
        };
        network.cluster(clusterOptionsByData);

    }

    self.paintNodes = function (nodeIds, color, otherNodesColor, radius) {
        var nodes = []
        /* for(var i=0;i< nodeIds.length;i++) {
         var node = self.nodes._data[nodeIds[i]];
         node.color = {background: color};
         nodes.push(node);
         }*/
        for (var key in  self.nodes._data) {
            var node = self.nodes._data[key];
            if (nodeIds.indexOf(key)>-1) {
                node.color = {background: color};
                node.size = 2 * radius;
            }
            else {
                if(otherNodesColor)
                node.color = {background: otherNodesColor};
            }
            nodes.push(node);
        }


        self.nodes.update(nodes);


    }
    self.selectNode=function(ids){
        network.selectNodes(ids,true);

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
        for (var key in self.edges){
            var edge=self.edges[key];
            if (relIds.indexOf(edge.neoId) > -1) {
                edge.color = {color: color,opacity:1,width:3};
                edge.width = 3;
            }
            else {
                if (otherRelColor)
                    edge.color = {color: otherRelColor,opacity:0.3,width:1};

               edges.push(edge);
            }

        }
        self.edges.update(edges);


    }


    return self;


})()
