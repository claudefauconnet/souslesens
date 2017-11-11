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

var toutlesensData = (function () {
    var self = {};
    var navigationPath = [];

    self.cachedResultArray = null;
    self.cachedResultTree = null;

    self.queryExcludeRelFilters = "";
    self.queryNodeFilters = "";
    self.queryRelFilters = "";
    self.queryExcludeNodeFilters = "";
    self.whereFilter=""


    self.executeNeoQuery = function (queryType, str, successFunction) {
        currentQueryType = queryType;
        if (str.indexOf("DELETE") < 0 && str.toLowerCase().indexOf("limit ") < 0) {
            str += " limit " + limitResult;
        }


        if (queryType == QUERY_TYPE_MATCH) {
            var payload = {match: str};


        }
        var queryStr = JSON.stringify(payload);
        if (Gparams.logLevel > 1)
            console.log("QUERY----" + queryStr);
        $("#neoQueriesTextArea").val(queryStr);
        $("#neoQueriesHistoryId").prepend(queryStr + "<br><br>");
        $.ajax({
            type: "POST",
            url: Gparams.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                currentDataStructure = "flat";
                toutlesensData.cachedResultArray = data;
                if (!data || data.length == 0) {
                    toutlesensController.setMessage("No results", "green");
                    return;
                }
                var errors = data.errors;

                if (errors && errors.length > 0) {
                    var str = "ERROR :";
                    for (var i = 0; i < errors.length; i++) {
                        str += errors[i].code + " : " + errors[i].message + "<br>"

                    }
                    toutlesensController.setMessage(str, red);
                    return;
                }

                if ($.isArray(data)) {// labels...
                    if (successFunction) {
                        successFunction(data);
                        return;
                    } else
                        return data;
                }

                var results = data.results;

                if (results && results.length > 0) {// } && results[0].data.length >
                    // 0) {// match..
                    toutlesensController.completeResult(results);
                    if (successFunction) {
                        successFunction(results);
                        return;
                    } else {
                        return results;
                    }

                } else {

                    toutlesensController.setMessage("No results", blue);
                    toutlesensController.cleanTabDivs();
                    return -1;
                }

            },
            error: function (xhr, err, msg) {
                console.log(xhr);
                console.log(err);
                console.log(msg);
            },

        });

    }

    self.getNodeAllRelations = function (id, output, addToExistingTree, callback) {
        excludedLabels = [];
        id = parseInt("" + id);
        if (addToExistingTree)
            navigationPath.push(id);
        else
            navigationPath = [id];
        currentRootId = id;
        legendNodeLabels = {}
        legendRelTypes = {};
        var subGraphWhere;
        if (subGraph)
            subGraphWhere = "  node1.subGraph=\"" + subGraph + "\" "
        // http://graphaware.com/graphaware/2015/05/19/neo4j-cypher-variable-length-relationships-by-example.html


        var numberOfLevelsVal = $("#depth").val();
        if (numberOfLevelsVal === undefined)
            numberOfLevelsVal = Gparams.defaultQueryDepth;
        else
            numberOfLevelsVal = parseInt(numberOfLevelsVal);
        if (Gparams.graphNavigationMode != "expandNode") {
            if (!currentDisplayType || currentDisplayType == "FLOWER" || currentDisplayType == "TREE" || currentDisplayType == "SIMPLE_FORCE_GRAPH" || currentDisplayType == "TREEMAP")
                numberOfLevelsVal += 1;
        }
        var whereStatement = "";
        if (id)
            whereStatement = " WHERE ID(node1)=" + id;
        if (subGraphWhere) {
            if (id)
                whereStatement += " AND ";
            else
                whereStatement += "WHERE ";
            whereStatement += subGraphWhere;

        }
        if(self.whereFilter!=""){
            if(whereStatement=="")
                whereStatement += " AND ";
            else
                whereStatement += "WHERE ";
            whereStatement+=self.whereFilter+" ";
        }

        var returnStatement = " RETURN EXTRACT(rel IN relationships(path) | type(rel)) as rels," +
            "EXTRACT(rel IN relationships(path) | rel)  as relProperties," +
            "nodes(path) as nodes," +
            " EXTRACT(node IN nodes(path) | ID(node)) as ids," +
            " EXTRACT(node IN nodes(path) | labels(node)) as labels "
            + ", EXTRACT(rel IN relationships(path) | labels(startNode(rel))) as startLabels"
        var statement = "MATCH path=(node1"
            + ")-[r"
            + toutlesensData.queryRelFilters
            + "*.."
            + numberOfLevelsVal
            + "]-(m) "
            + whereStatement
            + graphQueryTargetFilter
            + toutlesensData.queryNodeFilters
            + toutlesensData.queryExcludeNodeFilters
            + toutlesensData.queryExcludeRelFilters
            + returnStatement;
        if (graphQueryUnionStatement)
            statement += " UNION " + graphQueryUnionStatement + returnStatement;

        statement += " limit " + Gparams.MaxResults;
        if (Gparams.logLevel > 0)
            console.log(statement);
        $("#neoQueriesTextArea").val(statement);
        $("#neoQueriesHistoryId").prepend(statement + "<br><br>");
        toutlesensData.queryNodeFilters = "";
        toutlesensData.queryRelFilters = "";
        toutlesensData.queryExcludeNodeFilters = "";
        toutlesensData.queryExcludeRelFilters = "";
        graphQueryUnionStatement = "";

        var payload = {match: statement};


        $.ajax({
            type: "POST",
            url: Gparams.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                if (data.length == 0) {
                    self.showInfos2(id, toutlesensController.zeroRelationsForNodeAction);
                    return;

                }
                currentDataStructure = "flat";
                var resultArray = data;
                // data.log(JSON.stringify(resultArray))
                if (addToExistingTree && toutlesensData.cachedResultArray) {
                    for (var i = 0; i < resultArray.length; i++) {
                        for (var j = 0; j < resultArray[i].nodes.length; j++) {
                            resultArray[i].nodes[j].show = true;
                        }
                    }

                    resultArray = $.merge(resultArray, toutlesensData.cachedResultArray);

                }

                toutlesensData.cachedResultArray = resultArray;
                return callback(null, resultArray)

            },
            error: function (xhr, err, msg) {
                return (err);
            }

        });

    }

    self.collapseResult = function (resultArray) {
        //   toutlesensController.collapseTargetLabels=[]//["cote"];
        var resultArrayTransitive = [];
        for (var k = 0; k < toutlesensController.collapseTargetLabels.length; k++) {
            var targetLabel = toutlesensController.collapseTargetLabels[k];
            for (var i = 0; i < resultArray.length; i++) {
                var rels = resultArray[i].rels;
                var nodes = resultArray[i].nodes;
                var ids = resultArray[i].ids;
                var labels = resultArray[i].labels;
                var startNodes = resultArray[i].startLabels;
                var relProperties = resultArray[i].relProperties;
                var toRemoveNodesIndexes = [];
                for (var j = 1; j < nodes.length; j++) {
                    nodeLabels = nodes[j].labels;
                    if (nodeLabels[0] != targetLabel) {
                        toRemoveNodesIndexes.push(j);
                    }
                }
                if (toRemoveNodesIndexes.length == 0)// none node  with target label in path
                    continue;

                for (var j = 1; j < nodes.length; j++) {
                    if (toRemoveNodesIndexes.indexOf(j) < 0) {
                        var obj = {
                            rels: ["transitiveRelation"],
                            nodes: [nodes[0], nodes[j]],
                            ids: [ids[0], ids[j]],
                            labels: [labels[0], labels[j]],
                            startNodes: [startNodes[j]],
                            relProperties: [{
                                properties: {type: "transitiveRelation", _fromId: ids[0], _id: -9999, _toId: ids[j]}
                            }]
                        }
                        resultArrayTransitive.push(obj);
                    }

                }


            }


        }
        toutlesensController.collapseTargetLabels = [];
        if (resultArrayTransitive.length > 0)
            return resultArrayTransitive;
        else
            return resultArray;
    }
    self.prepareRawData = function (resultArray, addToExistingTree, output, callback) {
        totalNodesToDraw = resultArray.length;
        if (totalNodesToDraw >= Gparams.MaxResults && currentDisplayType!="SIMPLE_FORCE_GRAPH_BULK") {
            alert("trop de resultats pour dessiner le graphe.Modifiez les parametres : > maximum "
                + Gparams.MaxResults);
            return;

        }
        var labels = [];
        var relations = [];

        for (var i = 0; i < resultArray.length; i++) {
            if (!resultArray[i].labels) // !!!!bug à trouver
                continue;
            for (var j = 0; j < resultArray[i].nodes.length; j++) {
                if( resultArray[i].nodes[j].properties.nom && !resultArray[i].nodes[j].properties.name)
                    resultArray[i].nodes[j].properties.name=resultArray[i].nodes[j].properties.nom;
            }

            for (var j = 0; j < resultArray[i].labels.length; j++) {
                var label = resultArray[i].labels[j][0];
                if (labels.indexOf(label) < 0)
                    labels.push(label)
            }

            for (var j = 0; j < resultArray[i].rels.length; j++) {
                var relation = resultArray[i].rels[j];
                if (relations.indexOf(relation) < 0)
                    relations.push(relation)
            }
        }

        if (!output)
            output = currentDisplayType;
        var json;

        if (output == "SIMPLE_FORCE_GRAPH" || output == "SIMPLE_FORCE_GRAPH_BULK") {
            totalNodesToDraw = resultArray.length;
            json = resultArray;
        }
        else//tree structure
            json = self.toFlareJson(resultArray, addToExistingTree);

        if (navigationPath.length > 0)
            exploredTree = json;
        else
            exploredTree = null;

        callback(null, json, labels, relations);


    }


    self.showInfos2 = function (id, callback) {
        query = "MATCH (n) WHERE ID(n) =" + id + " RETURN n ";

        self.executeNeoQuery(QUERY_TYPE_MATCH, query, function (d) {
            callback(d);

        });

    }


    self.toFlareJson = function (resultArray, addToExistingTree) {
        currentDataStructure = "tree";
        currentThumbnails = [];
        currentThumbnails.ids = [];
        currentThumbnails.currentIndex = 1;
        var distinctNodeName = {};

        var rootId;
        if (!addToExistingTree)
            linksToSkip = [];
        if (!resultArray) {
            resultArray = toutlesensData.cachedResultArray;
        } else {

        }

        var nodesMap = {};

        for (var i = 0; i < resultArray.length; i++) {
            var rels = resultArray[i].rels;
            var nodes = resultArray[i].nodes;
            var ids = resultArray[i].ids;
            var labels = resultArray[i].labels;
            var startNodes = resultArray[i].startLabels;
            var relProperties = resultArray[i].relProperties;
            var legendRelIndex = 1;
            //  console.log("------------\n")
            for (var j = 0; j < nodes.length; j++) {

                var nodeNeo = nodes[j].properties;
                //  console.log(JSON.stringify(nodeNeo))
                if (distinctNodeName[nodeNeo[Gparams.defaultNodeNameProperty]] == null)
                    distinctNodeName[nodeNeo[Gparams.defaultNodeNameProperty]] = 0;
                else {
                    distinctNodeName[nodeNeo[Gparams.defaultNodeNameProperty]] += 1;
                    nodeNeo[Gparams.defaultNodeNameProperty] = nodeNeo[Gparams.defaultNodeNameProperty] + "#" + distinctNodeName[nodeNeo[Gparams.defaultNodeNameProperty]];
                }

                var nodeObj = {
                    name: nodeNeo[Gparams.defaultNodeNameProperty],
                    myId: nodeNeo.id,
                    label: labels[j][0],
                    id: ids[j],
                    children: [],
                    hiddenChildren: [],
                    neoAttrs: nodeNeo
                }
                if (nodes[j].show)
                    nodeObj.show = true;
                if (nodeNeo.path) {
                    if (currentThumbnails.ids.indexOf(nodeObj.id) < 0) {
                        currentThumbnails.ids.push(nodeObj.id);
                        var objT = {id: nodeObj.id, path: nodeNeo.path};
                        if (nodeNeo.date)
                            objT.date = nodeNeo.date;


                        currentThumbnails.push(objT);

                    }
                }
                if (nodes[j].decoration) {
                    nodeObj.decoration = nodes[j].decoration
                    if (nodes[j].decoration.groupOnGraph == true) {// le label de decoration remplace le label Neo4j
                        nodeObj.label = nodes[j].decoration.value;

                    }
                }


                /*
                 * if (addToExistingTree && foldedTreeChildren.indexOf(nodeObj.myId) >
                 * -1) {// noeud // repliés continue; }
                 */

                if (j == 0) {
                    nodeObj.parent = "root";
                    rootId = nodeObj.id;
                    nodeObj.neoAttrs = nodeNeo;
                    nodesMap.root = nodeObj

                }

                else {
                    if (addToExistingTree && nodeObj.id == currentRootId)
                        nodeObj.isNewRoot = true;

                    nodeObj.parent = ids[j - 1];
                    nodeObj.relType = rels[j - 1];
                    nodeObj.relProperties = relProperties[j - 1].properties;
                    var modelRels = dataModel.relations[labels[j - 1][0]];
                    if (modelRels && modelRels.length) {
                        for (var k = 0; k < modelRels.length; k++) {
                            if (modelRels[k].label2 == nodeObj.label) {
                                nodeObj.relDir = modelRels[k].direction;
                                break;
                            }
                        }
                    }

                    var key = nodeObj.id + "_" + ids[j - 1];
                    /*  if( nodesMap[key]){// create a new id if allready existing
                     //    if( nodesMap[(-j*1000000000)+nodeObj.id]){// create a new id if allready existing
                     nodeObj.id=(-j*1000000000)+nodeObj.id;
                     ids[j]= nodeObj.id;
                     }*/

                    nodesMap[key] = nodeObj;


                }
                if (!legendRelTypes)
                    legendRelTypes = {};
                if (!legendNodeLabels)
                    legendNodeLabels = {};

                if (!legendRelTypes[nodeObj.relType]) {
                    legendRelTypes[nodeObj.relType] = {
                        type: nodeObj.relType,
                        index: legendRelIndex++
                    }
                }
                if (!legendNodeLabels[nodeObj.label]) {
                    legendNodeLabels[nodeObj.label] = {
                        label: nodeObj.label
                    }
                }

            }

        }
        if (resultArray.currentActionObj) {
            legendNodeLabels.currentActionObj = currentActionObj;
        }
        foldedTreeChildren = [];
        // removeExcludedLabels(nodesMap);
        self.deleteRecursiveReferences(nodesMap);

        self.setNodesIndexPath(nodesMap);
        var root = nodesMap.root;
        if (root)
            root.isRoot = true;

        maxEffectiveLevels = 1;
        var maxLevels = $("#depth")
        if (maxLevels === undefined)
            maxLevels = Gparams.depth;
        else
            maxLevels = parseInt(maxLevels.val());
//console.log(JSON.stringify(nodesMap))
        self.addChildRecursive(root, nodesMap, 1, maxLevels);


        self.initThumbnails();
        // console.log (JSON.stringify(root));
        toutlesensData.cachedResultTree = root;
        return root;
    }


    self.removeExcludedLabels = function (map) {
        var keysToExclude = [];
        for (key in map) {
            var nodeObj = map[key];
            if (nodeObj.parent != "root" && excludeLabels[nodeObj.label] > -1
                && navigationPath.indexOf(nodeObj.id) < 0) {
                keysToExclude.push(key);

            }
        }
        for (var i = 0; i < keysToExclude.length; i++) {
            delete map[keysToExclude[i]];
        }

    }

// eliminer les references circulaires
    self.deleteRecursiveReferences = function (nodesMap) {
        var idsToDelete = [];
        for (var key in nodesMap) {
            var parent = nodesMap[key].parent;
            // parmi les noeud qui ont pour parent un de leurs fils ont detruit
            // celui qui qui a pour parent lactuel noeud racine
            if (nodesMap[parent] && nodesMap[parent].parent == nodesMap[key].id) {
                if (nodesMap[key].id != currentRootId) {
                    idsToDelete.push(nodesMap[key].id);
                    linksToSkip.push("" + nodesMap[key].id + "_"
                        + nodesMap[key].parent);

                }
            }

        }
        for (var i = 0; i < idsToDelete.length; i++) {
            console.log(JSON.stringify(nodesMap[idsToDelete[i]]));

            delete nodesMap[idsToDelete[i]];

        }

    }

    self.addChildRecursive = function (node, nodesMap, level, maxLevels) {
        totalNodesToDraw = 0;

        maxEffectiveLevels = Math.max(maxEffectiveLevels, level);
        // maxEffectiveLevels=level;
        try {// max stack size limit
            for (var key in nodesMap) {

                var aNode = nodesMap[key];
                if (aNode.parent == aNode.id) // self relation
                    continue;
                if (aNode.parent == node.id) {
                    if (excludeLabels && excludeLabels[aNode.label]
                        && excludeLabels[aNode.label] > -1)
                        continue;
                    if (aNode.show) {
                        var www = "a"
                    }
                    if (!nodesMap[key].visited) {
                        aNode.level = level;


                        if (level > maxLevels && !aNode.show) {
                            if (false && node.decoration) {// on dessine les noeuds avec des decorations meme s'ils sont au dernier niveau
                                node.children.push(aNode);
                                totalNodesToDraw += 1;
                            } else {
                                node.hiddenChildren.push(aNode);
                            }
                        } else {
                            node.children.push(aNode);
                            totalNodesToDraw += 1;
                        }
                        self.addChildRecursive(aNode, nodesMap, level + 1, maxLevels);
                        nodesMap[key].visited = true;
                    } else {
                        ;// console.log(node.name);
                    }
                }

            }
        } catch (e) {
            console.log(e);
        }

    }
    self.setNodesIndexPath = function (nodesMap) {
        for (var key in nodesMap) {
            var index = navigationPath.indexOf(nodesMap[key].id);
            if (index > -1)
                nodesMap[key].navigationPathIndex = index;

        }
    }

    self.removeChildrenFromTree = function (json, myId) {
        foldedTreeChildren = [];
        self.recurse = function (node) {
            if (!node.children)
                return;

            for (var i = 0; i < node.children.length; i++) {
                if (node.children[i].myId == myId) {

                    if (node.children[i].children) {
                        for (var j = 0; j < node.children[i].children.length; j++) {
                            foldedTreeChildren
                                .push(node.children[i].children[j].myId);
                        }
                        delete node.children[i].children;
                        return;

                    }
                } else {
                    self.recurse(node.children[i]);
                }

            }
        }

        self.recurse(json);
    }


    self.jsonToHierarchyTree = function (json, groupBy) {
        if (Array.isArray(json))
            self.toFlareJson(json);

        self.transformTree = function (node, hierarchNode, levelX, id) {
            var labels = {};
            hierarchNode.children = [];
            var layerIndex = 0;
            if (!node.children)
                return;


            var labelCardinality = {};
            for (var i = 0; i < node.children.length; i++) {
                if (labelCardinality[node.children[i].label] == null) {
                    labelCardinality[node.children[i].label] = 1;
                } else {
                    labelCardinality[node.children[i].label] += 1;
                }

            }


            for (var i = 0; i < node.children.length; i++) {
                if (i == 0)
                    levelX++;
                var childLabel = node.children[i].label;

                var groupLabels = labelCardinality[node.children[i].label] > 2 ? true : false;

                if (levelX < 3 && groupLabels) {// on ne groupe les
                    // noeud de meme
                    // label q'au
                    // premier niveau ou
                    // si'l y en a
                    // plusieurs
                    if (!labels[childLabel]) {
                        labels[childLabel] = {
                            name: childLabel + "#" + levelX + (100 * layerIndex),
                            children: [],
                            level: levelX,
                            value: 0,
                            rate: 0,
                            shape: "textBox",
                            color: nodeColors[childLabel],
                            relType: node.children[i].relType,
                            relDir: node.children[i].relDir,
                            relProperties:{},
                            id: id++,
                            nodeType: "label",
                            parentNodeType: "root"
                        };
                        if (node.children[i].decoration && node.children[i].decoration.groupOnGraph == true) {// le label de decoration remplace le label Neo4j
                            var color = "grey";
                            if (node.children[i].decoration.color)
                                color = node.children[i].decoration.color;
                            labels[childLabel].color = color;


                        }
                        if (i == 0)
                            levelX++;
                        // layerIndex+=1;
                        //
                    }

                    labels[childLabel].value += 1;
                    labels[childLabel].rate += 1;
                }
                var childNode = {
                    name: node.children[i].name + "_" + levelX,
                    value: 1,
                    rate: 1,
                    level: levelX + 1,
                    label: node.children[i].label,
                    id: node.children[i].id,
                    color: nodeColors[childLabel],
                    relType: node.children[i].relType,
                    relDir: node.children[i].relDir,
                    relProperties:{},
                    id: node.children[i].id,
                    nodeType: "node",
                    neoAttrs: node.children[i].neoAttrs

                }
                if (node.children[i].decoration) {
                    childNode.decoration = node.children[i].decoration
                }
                var hiddenChildren = node.children[i].hiddenChildren;
                if (hiddenChildren && hiddenChildren.length > 0)
                    childNode.hiddenChildren = hiddenChildren;


                self.transformTree(node.children[i], childNode, levelX);

                if (levelX < 3 && groupLabels) {// on ne groupe les
                    // noeud de meme
                    // label q'au
                    // premier niveau ou
                    // si'l y en a
                    // plusieurs
                    childNode.parentNodeType = "label";
                    labels[childLabel].children.push(childNode);
                } else {
                    childNode.parentNodeType = "node";
                    hierarchNode.children.push(childNode)
                }

            }

            for (var label in labels) {
                hierarchNode.children.push(labels[label]);
            }

        }

        var hierRoot = {
            name: "[" + json.label + "] " + json.name,
            id: json.id,
            color: nodeColors[json.label],
            level: 0,
            isRoot: true,
            children: []

        }
        if (json.decoration) {
            hierRoot.decoration = json.decoration;
        }

        self.transformTree(json, hierRoot, 0, 1000);

        /*
         * for(var label in labels){ hierRoot.children.push(labels[label]); }
         */
        hierRoot.value = hierRoot.children.length
        hierRoot.rate = hierRoot.children.length

        return hierRoot;

    }

    /*******************************************************************************
     * Tree********************************************
     * *******************************************************************************************************************************************************************
     ******************************************************************************/
    self.prepareTreeData = function (neoResult) {
        $("#spreadSheetDiv").css("visibility", "hidden");
        toutlesensController.showInfosCallback(neoResult);
        var nameLength = 30;
        var data = neoResult[0].data;
        var variables = neoResult[0].columns;

        if (variables.length < 2)
            return;

        var nodes = {};
        toutlesensController.setMessage(data.length + " rows retrieved", green);
        var distinctParentNodes = {};
        var parentsVar = 0;
        if (currentVariable)
            parentsVar = variables.indexOf(currentVariable);
        // selection des noeuds parents
        for (var i = 0; i < data.length; i++) {
            var row = data[i].row;
            var obj = row[parentsVar];
            if (!distinctParentNodes[obj.id]) {
                distinctParentNodes[obj.id] = {
                    _id: obj.id + "_" + treeLevel,
                    name: obj.name,// + " " + obj.id + "_" + treeLevel,
                    label: obj.label,
                    children: []
                };
            }
        }
        // remplissages des enfants

        var childrenVar = [];
        for (var i = 0; i < variables.length; i++) {
            if (variables[i] != parentsVar)
                childrenVar.push(i)
        }
        ;

        for (var key in distinctParentNodes) {

            var index = 0;
            for (var i = 0; i < data.length; i++) {
                var row = data[i].row;
                var obj = row[parentsVar];
                if (key == "" + obj.id) {
                    // var childObj = row[childrenVar[0]];
                    var childObj = row[1];
                    distinctParentNodes[key].children.push({
                        _id: childObj.id + "_" + treeLevel,
                        name: childObj.name,// + " " + childObj.id + "_"+
                        // treeLevel,
                        label: childObj.label,
                        children: []
                    })
                }
            }
        }
        var root = {};
        if (oldTreeRootNode && treeSelectedNode) {
            root = oldTreeRootNode;
            var id = treeSelectedNode.id;

            treeSelectedNode = null;
            toutlesensController.findNodeInTree(id, oldTreeRootNode);
            if (!root2)
                return;
            if (root2 && root2.children)
                return;
            root2.children = [];
            var key2;
            for (var key in distinctParentNodes) {
                for (var i = 0; i < distinctParentNodes[key].children.length; i++) {// on
                    // ajoute
                    // les
                    // nouveaux
                    // noeuds
                    // à
                    // l'ancien
                    // arbre
                    var newChild = distinctParentNodes[key].children[i];
                    var p = newChild._id.indexOf("_");

                    var newId = newChild._id.substring(0, p);
                    toutlesensController.findNodeInTree(newId, oldTreeRootNode);
                    if (oldChild) {// si le noeud existe dejà on ne l'ajoute pas
                        ;// console.log(JSON.stringify(oldChild));
                        continue;
                    }

                    root2.children.push(newChild);
                }
            }

            root = oldTreeRootNode;

        } else {
            /*
             * var root = {
             *
             * id : -1, isRoot : true, name : "..", // name : "-" + currentVariable,
             * children : [] } for ( var key in distinctParentNodes) {
             *
             * root.children.push(distinctParentNodes[key]); }
             */
            for (var key in distinctParentNodes) {
                var root = distinctParentNodes[key];
            }
        }

        oldTreeRootNode = root;
        treeLevel += 1;
        if (!d3tree)
            d3tree = new d3treeGraph($("#graphDiv"));
        d3tree.drawTree(root);
    }

    self.formatTreeToCsv = function (json) {
        self.recursiveSetParent = function (node) {
            if (!node.children || node.children.length == 0) {
                leaves.push(node)
            } else {
                for (var i = 0; i < node.children.length; i++) {
                    var child = node.children[i];
                    if (!child.ancestors)
                        child.ancestors = [];
                    child.parent = node;
                    self.recursiveSetParent(child);
                }
            }

        }

        self.recursiveSetAncestors = function (leaf, ancestor) {
            if (!leaf.ancestors)
                leaf.ancestors = [leaf];
            if (ancestor.parent) {
                if (leaf.ancestors.indexOf(ancestor.parent) < 0) {
                    leaf.ancestors.push(ancestor.parent)
                    self.recursiveSetAncestors(leaf, ancestor.parent);
                }
            }
        }

        var leaves = []
        self.recursiveSetParent(json);
        for (var i = 0; i < leaves.length; i++) {
            self.recursiveSetAncestors(leaves[i], leaves[i]);
        }

        var spreadSheetData = [];

        for (var i = 0; i < leaves.length; i++) {
            var line = [];
            var ancestors = leaves[i].ancestors;
            ancestors.splice(0, 0, leaves[i])

            for (var j = 0; j < ancestors.length - 1; j++) {// length-1 car le
                // dernier ancetre est
                // root

                var name = ancestors[j].name;
                if (name) {
                    label = "";
                    if (CSVWithLabel)
                        label = " [" + ancestors[j].label + "]";
                    line.push(name + label);

                    var relType = ancestors[j].relType;
                    if (relType) {
                        var direction = ancestors[j].relDir;
                        if (direction && direction == "normal")
                            relType += " ->";
                        else
                            var relType = " <-" + relType;
                        line.push(relType);
                    }

                }
            }

            line.reverse();
            spreadSheetData.push(line);

        }
        return spreadSheetData;
    }

    self.clickDatatable = function () {

    }

    self.searchInProperties = function (value, callback) {
        var query = "$match (n) with n, [x in keys(n) WHERE n[x] =~ '(?i).*"
            + value
            + ".*' ] as doesMatch where size(doesMatch) > 0 return n limit "
            + limit;
        self.executeNeoQuery(QUERY_TYPE_MATCH, query, callback);
    }

// }


    self.flatResultToTree = function (data, withAttrs) {

        var str = "";
        var label = "";
        var color = "black";
        var nodes = {};
        for (var i = 0; i < data.length; i++) {
            if (!data[i].nodes)
                continue;
            for (var j = 0; j < data[i].nodes.length; j++) {


                var node = {
                    id: data[i].ids[j]
                }

                if (!nodes[node.id]) {
                    node.neoAttrs = data[i].nodes[j].properties;
                    if (!node.neoAttrs.name)
                        node.neoAttrs.name = node.neoAttrs[Gparams.defaultNodeNameProperty];
                    node.name = node.neoAttrs.name;
                    node.label = data[i].labels[j][0]

                    node.children = [];

                    nodes[node.id] = node;

                    if (j == 0)
                        node.isSubRoot = true;

                    if (j > 0) {
                        node.rel = data[i].rels[j - 1];

                        var previousId = data[i].ids[j - 1];
                        if (nodes[previousId]) {
                            /*  var add = true;
                             for (var k = 0; k < nodes[previousId].children.length; k++) {
                             if (nodes[previousId].children[k] == node.id) {
                             add = false;
                             break;
                             }

                             }
                             if (add)*/
                            nodes[previousId].children.push(node);
                        }

                    }
                }


            }

        }
        var keys = []
        for (var key in  nodes) {
            if (nodes[key].isSubRoot)
                keys.push(key)
        }
        keys.sort();
        var root = {
            name: "root",
            id: -1,
            label: "root",
            children: []
        }
        for (var i = 0; i < keys.length; i++) {
            root.children.push(nodes[keys[i]]);
        }

        return root;


    }
    self.searchNodes = function (subGraph, label, word, resultType, limit, from, callback) {
        currentQueryParams = {
            subGraph: subGraph, label: label, word: word, resultType: resultType, limit: limit, from: from
        }
        var str = "";
        var subGraphWhere = "";
      /*  if (!word)
            word = "";*/
        var returnStr = " RETURN n";//,id(n) as n_id,labels(n) as n_labels";
        var cursorStr = "";
        if (resultType == "count")
            returnStr = " RETURN count(n) as count";
        else
            cursorStr += " ORDER BY n." + Gparams.defaultNodeNameProperty;
        if (from && resultType != "allNodes")
            cursorStr += " SKIP " + from;
        if (limit && resultType != "allNodes")
            cursorStr += " LIMIT " + limit;


        var labelStr = "";
        if (label && label.length > 0)
            labelStr = ":" + label;

        var whereStr = advancedSearch.getWhereProperty(word, "n")

        if (whereStr.length > 0)
            whereStr = " WHERE " + whereStr;

        if (subGraph) {
            if (whereStr.length == 0)
                subGraphWhere += " where  n.subGraph='" + subGraph + "' ";
            else
                subGraphWhere += " and  n.subGraph='" + subGraph + "' ";
        }

        str = "MATCH (n" + labelStr + ") " + whereStr + subGraphWhere + returnStr;
        if (resultType == "matchStr" && callback) {
            return callback(null, str);
        }

        str += cursorStr;
        //    console.log(str);
        var payload = {match: str};

        //   console.log(str)
        $.ajax({
            type: "POST",
            url: Gparams.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                if (callback) {
                    return callback(null, data);
                }
                if (!resultType == "count")
                    startSearchNodesTime = null;
                if (!data || data.length == 0) {
                    toutlesensController.setMessage("No results", blue);
                    return;
                }
                var errors = data.errors;

                if (errors && errors.length > 0) {
                    var str = "ERROR :";
                    for (var i = 0; i < errors.length; i++) {
                        str += errors[i].code + " : " + errors[i].message + "<br>"
                            + JSON.stringify(paramsObj);
                    }
                    toutlesensController.setMessage("!!! erreur de requete", red);
                    console.log(str);
                    return;
                }
                if (resultType == "count") {
                    var count = data[0].count
                    toutlesensController.initResultPagination(count);
                } else if (resultType == "displayStartNodesPage") {
                    toutlesensController.fillLabelsPage(data);
                } else if (resultType == "nodeListHTML") {
                    textOutputs.drawNodesOnlyTable(data);

                } else
                    toutlesensController.fillWordsSelect(data);

            },
            error: function (xhr, err, msg) {
                if (callback) {
                    return callback(null);
                }
                if (!resultType == "count")
                    startSearchNodesTime = null;
                console.log(xhr);
                console.log(err);
                console.log(msg);
            },

        });

        ;

    }


    self.initThumbnails = function () {

        if (currentThumbnails.length > 0) {
            currentThumbnails.currentIndex = 0;
            currentThumbnails.sort(function (a, b) {
                if (a.date && b.date) {
                    return a.date > b.date;
                }
                return a > b;

            });

        } else {
            currentThumbnails.currentIndex = 1;
        }
    }
    return self;
})()