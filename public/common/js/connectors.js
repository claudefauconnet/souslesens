var connectors = (function () {
    var self = {};


    self.neoResultsToVisjs = function (resultArray, options) {

if(!options)
    options={};
        visjsData = {nodes: [], edges: [], labels: []};
        var nodesMap = {};
        var dataLabels = [];
        var colors = [];
        var clusters = [];
        if (!resultArray)
            return;
        var uniqueRels = [];
        for (var i = 0; i < resultArray.length; i++) {
            var rels = resultArray[i].rels;
            if (!rels)
                rels = [];
            var nodes = resultArray[i].nodes;


            if (!nodes)
                nodes = [];
            var relProperties = resultArray[i].relProperties;
            if (!relProperties)
                relProperties = [];
            var startLabels = resultArray[i].startLabels;


            var ids = resultArray[i].ids;
            var legendRelIndex = 1;

            for (var j = 0; j < nodes.length; j++) {

                if (options.clusterIntermediateNodes) {
                    if (j > 0 && j < (nodes.length - 1))
                        continue;

                }

                var neoId = nodes[j]._id;
                if (!nodesMap[neoId]) {
                    var nodeNeo = nodes[j].properties;

                    var labels = nodes[j].labels;

                    var labelVisjs = nodeNeo[Gparams.defaultNodeNameProperty];
                    if (labelVisjs && labelVisjs.length > Gparams.nodeMaxTextLength)
                        labelVisjs = labelVisjs.substring(0, Gparams.nodeMaxTextLength) + "...";

                    var color = nodeColors[nodes[j].labels[0]]
                    var nodeObj = {

                        labelNeo: labels[0],// because visjs where label is the node name
                        color: color,
                        myId: nodeNeo.id,
                        id: neoId,
                        children: [],
                        neoAttrs: nodeNeo,
                        value: 8,
                        //  font:{background:color},


                        endRel: rels[0]


                    }


                    if (resultArray.length<Gparams.showLabelsMaxNumOfNodes || (options && options.showNodesLabel) || !options) {
                        nodeObj.label = labelVisjs;
                        nodeObj.title = labelVisjs;


                    }else{
                        nodeObj.hiddenLabel = labelVisjs;
                        options.showNodesLabel = false;
                    }

                    if (nodes[j].outline) {

                        nodeObj.font = {
                            value: 8,
                            //  size: 18,
                            color: Gparams.outlineTextColor,
                            strokeWidth: 3,
                            strokeColor: '#ffffff'
                        }
                        //    nodeObj.size = 25;

                    }


                    nodeObj.initialColor = nodeObj.color;
                    if (nodeObj.labelNeo == currentLabel) {
                        nodeObj.value = 30;
                        //  nodeObj.size = 15;

                    }

                    if (nodeNeo.image && nodeNeo.image.length > 0) {
                        nodeObj.shape = 'circularImage';
                        nodeObj.image = nodeNeo.image.replace(/File:/, "File&#58;");
                        nodeObj.brokenImage = "images/questionmark.png";
                        //   nodeObj.image=encodeURIComponent(nodeNeo.icon)
                        nodeObj.borderWidth = 4
                        nodeObj.size = 30;
                        delete nodeObj.color;
                        delete nodeObj.initialColor;

                    }
                    else if (nodeNeo.icon && nodeNeo.icon.length > 0) {
                        nodeObj.shape = 'circularImage';
                        nodeObj.image = nodeNeo.icon;
                        nodeObj.brokenImage = 'http://www.bnf.fr/bnf_dev/icono/bnf.png'
                        //   nodeObj.image=encodeURIComponent(nodeNeo.icon)
                        nodeObj.borderWidth = 4
                        nodeObj.size = 30;
                        delete nodeObj.color;
                        delete nodeObj.initialColor;


                    }
                    // console.log(JSON.stringify(nodes[j]));

                    if (nodes[j].isSource) {
                        nodeObj.isSource = true;
                    }
                    if (nodes[j].isTarget) {
                        nodeObj.isTarget = true;
                    }

                    if (nodes[j].isPathSource) {
                        nodeObj.shape = "star";
                        nodeObj.color = "red";
                        nodeObj.x = -500;
                        nodeObj.y = -500;
                    }
                    if (nodes[j].isPathTarget) {
                        nodeObj.shape = "star";
                        nodeObj.color = "red";
                        nodeObj.x = 500;
                        nodeObj.y = 500;
                    }

                    visjsData.nodes.push(nodeObj);

                    nodesMap[neoId] = nodeObj;
                    if (visjsData.labels.indexOf(nodeObj.labelNeo) < 0)
                        visjsData.labels.push(nodeObj.labelNeo);
                }


            }
            var rel ;
            if (options.clusterIntermediateNodes) {
                //link first node to last
                for (var j = 1; j < ids.length; j++) {
                    ids[j] = ids[ids.length - 1];
                    rel="composite";
                }
            }


            for (var j = 0; j < rels.length; j++) {
                rel = rels[j];
                var startLabel = startLabels[j][0];
                var from, to, queryId;

                if (options.clusterIntermediateNodes) {
                    if (j > 0 && j < (rels.length - 1))
                        continue;
                   if( ids[j] == ids[j + 1])
                       continue;
                }


                if (startLabel != labels[j]) {
                    from = ids[j];
                    to = ids[j + 1];
                    queryId = ids[j + 1];
                } else {
                    from = ids[j + 1];
                    to = ids[j];
                    queryId = ids[j + 1];
                }



                var color = "#99d";//linkColors[rel];
                var relObj = {
                    from: from,
                    to: to,
                    type: rel,
                    neoId: relProperties[j]._id,
                    neoAttrs: relProperties[j].properties,
                    color: color,
                    width: 1
                    // font:{background:color},
                }

                if (toutlesensData.queriesIds.indexOf(queryId) > -1) {
                    relObj.width = Gparams.outlineEdgeWidth;
                    relObj.color = Gparams.outlineColor;
                }

                if (resultArray[i].outlineRel) {
                    relObj.width = 3;
                    relObj.font = {size: 18, color: 'red', strokeWidth: 3, strokeColor: '#ffffff'}
                }

                var relUniqueId = relObj.from + "-" + relObj.to + "-" + relObj.type;
                var relUniqueIdInv = relObj.to + "-" + relObj.from + "-" + relObj.type;
                if (uniqueRels.indexOf(relUniqueId) > -1 || uniqueRels.indexOf(relUniqueIdInv) > -1)
                    continue;
                else
                    uniqueRels.push(relUniqueId);

                if ((options && options.showRelationsType == true) && Gparams.showRelationNames == true) {
                    relObj.label = relObj.type;
                    relObj.arrows = {from: {scaleFactor: 0.5}}
                }


                visjsData.edges.push(relObj);
            }


        }
        for (var i = 0; i < dataLabels.length; i++) {
            colors.push(nodeColors[dataLabels[i]])
        }
        /*  if (options.clusterIntermediateNodes) {
              visjsGraph.clusters = clusters;
          }*/
        return visjsData;//testData;
    }


    self.elasticSkosToVisjs = function (resultArray) {


        visjsData = {nodes: [], edges: [], labels: []};
        var nodesMap = {};
        /*  var dataLabels = [];
          var colors = [];*/
        if (!resultArray)
            return;
        var id = 10000;
        for (var i = 0; i < resultArray.length; i++) {
            var elasticObj = resultArray[i].content;

            for (var key in elasticObj) {
                var visObj = {
                    label: elasticObj[key].label,
                    labelNeo: key,// because visjs where label is the node name
                    color: "blue",
                    myId: id,
                    id: id++,
                    children: [],
                    neoAttrs: {},
                    endRel: 0


                }
                nodesMap[elasticObj[key].label] = visObj;
                visjsData.nodes.push(visObj);
            }

        }

//relations
        for (var i = 0; i < resultArray.length; i++) {
            var elasticObj = resultArray[i].content;
            var conceptObj = elasticObj.concept;
            var idConcept = nodesMap[conceptObj.label].id;
            for (var key in elasticObj) {
                if (key != "concept") {
                    var idTarget = nodesMap[elasticObj[key].label].id;

                    var relObj = {
                        from: idConcept,
                        to: idTarget,
                        type: key,
                        neoId: idTarget,
                        neoAttrs: {},
                        color: "green",
                        // font:{background:color},
                    }
                    visjsData.edges.push(relObj);

                } else {

                }

            }
        }
        return visjsData;//testData;
    }


    self.toutlesensSchemaToVisjs = function (schema, id) {


        function makeNode(label) {

            var visNode = {
                label: label,
                type: "schema",
                neoAttrs: schema.labels[label],
                labelNeo: "label",// because visjs where label is the node name
                // color: "lightBlue",
                color:nodeColors[label],
                myId: id,
                shape: "box",
                id: id++,
                children: [],
                neoAttrs: {},
                font: {stroke: "black", "font-size": "14px"},
                endRel: 0
            }
            nodesMap[label] = visNode;
            visjsData.nodes.push(visNode);

        }

        visjsData = {nodes: [], edges: [], labels: []};
        var nodesMap = {}
        var id = 0;
        for (var key in schema.relations) {
            var relation = schema.relations[key];
            if (!nodesMap[relation.startLabel])
                makeNode(relation.startLabel)
            if (!nodesMap[relation.endLabel])
                makeNode(relation.endLabel)

            var relObj = {
                from: nodesMap[relation.startLabel].id,
                to: nodesMap[relation.endLabel].id,
                type: "relation",
                neoId: id++,
                neoAttrs: {},
                color: "green",
                label: relation.type,
                font: {stroke: "black", "font-size": "14px"},
                arrows: {to: {scaleFactor: 0.5}}
                // font:{background:color},
            }
            visjsData.edges.push(relObj);
        }
//nodes without relations
        for (var key in schema.labels) {
            if (!nodesMap[key]) {
                makeNode(key);
            }
        }

        if (dataModel.DBstats) {
            for (var i = 0; i < visjsData.nodes.length; i++) {
                var countNodes = dataModel.DBstats.nodes[visjsData.nodes[i].label];
                visjsData.nodes[i].count = countNodes;
                visjsData.nodes[i].name = visjsData.nodes[i].label;
                visjsData.nodes[i].label += " (" + countNodes + ")";

            }
            for (var i = 0; i < visjsData.edges.length; i++) {
                var countRels = dataModel.DBstats.relations[visjsData.edges[i].label].countRel;
                //  visjsData.edges[i].value=countRels;
                visjsData.edges[i].count = countRels;
                visjsData.edges[i].name = visjsData.edges[i].label;
                visjsData.edges[i].label += " (" + countRels + ")";

            }


        }
        return visjsData;

    }


    return self;

})()