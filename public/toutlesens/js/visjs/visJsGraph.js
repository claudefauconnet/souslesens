/**
 * Created by claud on 03/08/2017.
 */
var visjsGraph = (function () {
    var self = {};
    var network;
    self.physicsOn = true;
    self.nodesMap = {};
    self.layout = "physics";
    var nodes;
    self.visjsData = {nodes: [], edges: []};
    var dataLabels = [];
    var colors = [];
    var stopPhysicsTimeout = 5000;
    var lastClick=new Date();
    var dblClickDuration=500;

    var formatData = function (resultArray, relationNames) {


        self.nodesMap = {};
        self.visjsData = {nodes: [], edges: []};
        if(!resultArray)
            return;
        for (var i = 0; i < resultArray.length; i++) {
            var rels = resultArray[i].rels;
            var nodes = resultArray[i].nodes;
            var relProperties = resultArray[i].relProperties;


            if (!nodes)
                continue;

            var ids = resultArray[i].ids;
            var legendRelIndex = 1;

            for (var j = 0; j < nodes.length; j++) {
                var neoId = nodes[j]._id;
                if (!self.nodesMap[neoId]) {
                    var nodeNeo = nodes[j].properties;

                    var labels = nodes[j].labels;
                    var color= nodeColors[nodes[j].labels[0]]
                    var nodeObj = {
                        label: nodeNeo[Gparams.defaultNodeNameProperty],
                        labelNeo: labels[0],// because visjs where label is the node name
                        color: color,
                        myId: nodeNeo.id,
                        id: neoId,
                        children: [],
                        neoAttrs: nodeNeo,
                      //  font:{background:color},


                        endRel: rels[0]


                    }
                    nodeObj.initialColor=nodeObj.color;
                    if (nodeObj.labelNeo==currentLabel) {
                        nodeObj.size=15;

                    }

                    if (nodeNeo.image && nodeNeo.image.length > 0) {
                        nodeObj.shape = 'circularImage';
                        nodeObj.image = nodeNeo.image.replace(/File:/,"File&#58;");
                        nodeObj.brokenImage="images/questionmark.png";
                        //   nodeObj.image=encodeURIComponent(nodeNeo.icon)
                        nodeObj. borderWidth=4
                        nodeObj.size=30;

                    }
                    else if (nodeNeo.icon && nodeNeo.icon.length > 0) {
                        nodeObj.shape = 'circularImage';
                        nodeObj.image = nodeNeo.icon;
                        nodeObj.brokenImage='http://www.bnf.fr/bnf_dev/icono/bnf.png'
                     //   nodeObj.image=encodeURIComponent(nodeNeo.icon)
                        nodeObj. borderWidth=4
                        nodeObj.size=30;

                    }





                    self.visjsData.nodes.push(nodeObj);

                    self.nodesMap[neoId] = nodeObj;
                    if (dataLabels.indexOf(nodeObj.labelNeo) < 0)
                        dataLabels.push(nodeObj.labelNeo);
                }


            }



            for (var j = 0; j < rels.length; j++) {
                var rel = rels[j];
                var color=linkColors[self.nodesMap[ids[j + 1]].endRel];
                var relObj = {
                    from: ids[j],
                    to: ids[j + 1],
                    type: rel,
                    neoId: relProperties[j]._id,
                    neoAttrs: relProperties[j].properties,
                    color: color,
                    font:{background:color},
                }
                if (Gparams.showRelationNames === true)
                    relObj.label = relObj.type;


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
        if(resultArray.length==0 ){
            $("#graphDiv").html("No  data to display")
            return;

        }
        var data0 = formatData(resultArray);


        var container = document.getElementById(divId);
        self.nodes = new vis.DataSet(data0.nodes);
        self.edges = new vis.DataSet(data0.edges);

        var x = Math.log10(self.edges.length * 2) + 1;
        stopPhysicsTimeout = Math.pow(10, x);
        console.log("x" + x + " stopPhysicsTimeout: " + self.edges.length + " time " + stopPhysicsTimeout)
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
                timestep: 0.46,
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
                smooth: true,
                font: {size: 10}
                //font: { "font-style":'italic'}
            },
            interaction: {
                // navigationButtons: true,
                keyboard: true
            }


        };

        if (data.edges.length > 1000)
            options.layout = {improvedLayout: false}


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

        network.on("doubleClick", function (params) {
            var nodeId = params.nodes[0];
            currentObject = self.nodesMap[nodeId];
            toutlesensController.generateGraph(nodeId, false);//NO !!! minus sign to search on m (see toutlesensData 148)
        })
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
                /*   var now=new Date().getTime();
                 //  console.log(params.event.timeStamp+" "+now.getTime())
                   var delay=Math.abs(now-lastClick)
                   lastClick=now;
                   console.log(delay);
                   if(delay<dblClickDuration) {//dbleclick*/
                if (params.event.srcEvent.ctrlKey) {
                    var nodeId = params.nodes[0];
                    currentObject = self.nodesMap[nodeId];
                    toutlesensController.generateGraph(nodeId, false);
                }

                var nodeId = params.nodes[0];
                var point = params.pointer.DOM;
                currentObject = self.nodesMap[nodeId];
                toutlesensController.showPopupMenu(point.x, point.y, "nodeInfo");
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


        //  var network = new vis.Network(container, data, options);


    }
    self.clusterByLabel = function () {
        var label = paint.currentLabel;
        if (!label || !nodeColors[label])
            return;
        var clusterOptionsByData = {
            joinCondition: function (childOptions) {
                return childOptions.labelNeo == label; // the color is fully defined in the node.
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
            if (nodeIds.indexOf(key) > -1) {
                node.color = {background: color};
                node.size = 2 * radius;
            }
            else {
                if (otherNodesColor)
                    node.color = {background: otherNodesColor};
            }
            nodes.push(node);
        }


        self.nodes.update(nodes);


    }
    self.selectNode = function (ids) {
        network.selectNodes(ids, true);

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

    self.displayRelationNames = function () {
        var show = $("#showRelationTypesCbx").prop("checked");
        Gparams.showRelationNames = show;

        for (var key in self.edges._data) {
            if (show) {
                self.edges._data[key].label = self.edges._data[key].type;
              //  self.edges._data[key].font = {background: "red","font-style": 'italic', "font-size": "8px",strokeWidth: 0}
                self.edges._data[key].font ={size:8, color:'grey', face:'arial'}
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

    self.findNode=function(expression,color,radius){
        var regex=new RegExp(".*"+expression+".*",'i');
        var nodes=[];
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

    return self;


})()
