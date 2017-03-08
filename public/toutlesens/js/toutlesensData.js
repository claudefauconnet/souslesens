//function toutlsensDataClass(){

var excludeLabels = {};
var cachedResultArray;
var cachedResultArray2;

var isZoomed = false;
var hoverRect;
var hoverText;
var legendNodeLabels = {}
var legendRelTypes = {};
var navigationPath = [];

var maxEffectiveLevels = 0;
var currentFlattenedData;
var foldedTreeChildren = [];
var exploredTree = null;
var CSVWithLabel = true;
var graphQueryNodeFilters = "";
var graphQueryRelFilters = "";
var graphQueryTargetFilter = "";
var graphQueryExcludeNodeFilters = "";
var graphQueryExcludeRelFilters = "";
var currentQueryParams;

var totalNodesToDraw = 0;
function executeQuery(queryType, str, successFunction) {
    currentQueryType = queryType;
    if (str.indexOf("DELETE") < 0 && str.toLowerCase().indexOf("limit ") < 0) {
        str += " limit " + limitResult;
    }

    nameLength = 30; // 0; parseInt($("#labelLength").val());
    var paramsObj = {};

    var urlSuffix = "";
    var params = "";

    if (queryType == QUERY_TYPE_MATCH) {
        var payload = {match: str};


    }
    var queryStr = JSON.stringify(payload);
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
            cachedResultArray = data;
            if (!data || data.length == 0) {
                setMessage("No results", "green");
                return;
            }
            var errors = data.errors;

            if (errors && errors.length > 0) {
                var str = "ERROR :";
                for (var i = 0; i < errors.length; i++) {
                    str += errors[i].code + " : " + errors[i].message + "<br>"
                        + JSON.stringify(paramsObj);
                }
                setMessage(str, red);
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
                completeResult(results);
                if (successFunction) {
                    successFunction(results);
                    return;
                } else {
                    return results;
                }

            } else {

                setMessage("No results", blue);
                cleanTabDivs();
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

function getNodeAllRelations(id, output, addToExistingTree, callback) {

    id = parseInt("" + id);
    if (addToExistingTree)
        navigationPath.push(id);
    else
        navigationPath = [id];
    currentRootId = id;
    legendNodeLabels = {}
    legendRelTypes = {};
    var subGraphWhere = ""
    if (subGraph)
        subGraphWhere = " and node1.subGraph=\"" + subGraph + "\" "
    // http://graphaware.com/graphaware/2015/05/19/neo4j-cypher-variable-length-relationships-by-example.html

    /*
     * var statement = "MATCH path=(node1:technos {id:"+id+"})-[*..100]->() " +
     * "RETURN relationships(path) as rels,nodes(path)as nodes limit 100"
     */

    var numberOfLevelsVal = $("#depth").val();
    numberOfLevelsVal = parseInt(numberOfLevelsVal);
    if (!currentDisplayType || currentDisplayType == "FLOWER" || currentDisplayType == "TREE" || currentDisplayType == "SIMPLE_FORCE_GRAPH" || currentDisplayType == "TREEMAP")
        numberOfLevelsVal += 1;// pour les count des feuilles
    // var statement = "MATCH path=(node1:"
    // + currentLabel
    var statement = "MATCH path=(node1"
        + ")-[r"
        + graphQueryRelFilters
        + "*.."
        + numberOfLevelsVal
        + "]-(m) where ID(node1)="
        + id
        + subGraphWhere
        + graphQueryTargetFilter
        + graphQueryNodeFilters
        + graphQueryExcludeNodeFilters
        + graphQueryExcludeRelFilters
        + " RETURN EXTRACT(rel IN relationships(path) | type(rel)) as rels," +
        "EXTRACT(rel IN relationships(path) | rel)  as relProperties," +
        "nodes(path) as nodes," +
        " EXTRACT(node IN nodes(path) | ID(node)) as ids," +
        " EXTRACT(node IN nodes(path) | labels(node)) as labels "
        + ", EXTRACT(rel IN relationships(path) | labels(startNode(rel))) as startLabels"
        + " limit " + Gparams.MaxResults;
    console.log(statement);
    $("#neoQueriesTextArea").val(statement);
    $("#neoQueriesHistoryId").prepend(statement + "<br><br>");
    graphQueryNodeFilters = "";
    graphQueryRelFilters = "";
    graphQueryExcludeNodeFilters = "";
    graphQueryExcludeRelFilters = "";

    var payload = {match: statement};


    $.ajax({
        type: "POST",
        url: Gparams.neo4jProxyUrl,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {


            if (data.length == 0) {
                showInfos2(id, zeroRelationsForNodeAction);
                return;

            }
            currentDataStructure = "flat";
            var resultArray = data;
            // data.log(JSON.stringify(resultArray))
            if (addToExistingTree && cachedResultArray) {

                resultArray = $.merge(resultArray, cachedResultArray);

            }
            cachedResultArray = resultArray;

            prepareRawDataAndDisplay(resultArray, addToExistingTree, output, callback);
        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }

    });

}


function prepareRawDataAndDisplay(resultArray, addToExistingTree, output, callback) {
    if (!output)
        output = currentDisplayType;
    var json;
    if (output == "SIMPLE_FORCE_GRAPH") {
        totalNodesToDraw = resultArray.length;
        json = resultArray;
    }
    else
        json = toFlareJson(resultArray, addToExistingTree);
    if (totalNodesToDraw >= Gparams.MaxResults) {
        alert("trop de resultats pour dessiner le graphe.Modifiez les parametres : > maximum "
            + Gparams.MaxResults);
        return;

    }
    if (navigationPath.length > 0)
        exploredTree = json;
    else
        exploredTree = null;
    var currentLabels = [];
    for (i = 0; i < resultArray.length; i++) {
        for (j = 0; j < resultArray[i].labels.length; j++) {
            var label = resultArray[i].labels[j][0];
            if (currentLabels.indexOf(label) < 0)
                currentLabels.push(label)

        }
    }
    if (callback)
        callback(json, currentLabels);
    else
        displayGraph(json, output, currentLabels);

}

function showInfos2(id, callback) {
    query = "MATCH (n) WHERE ID(n) =" + id + " RETURN n ";

    executeQuery(QUERY_TYPE_MATCH, query, function (d) {
        callback(d);

    });

}


function toFlareJson(resultArray, addToExistingTree) {
    currentDataStructure = "tree";
    currentThumbnails = [];
    currentThumbnails.ids = [];
    currentThumbnails.currentIndex = 1;
    var distinctNodeName = {};

    var rootId;
    if (!addToExistingTree)
        linksToSkip = [];
    if (!resultArray) {
        resultArray = cachedResultArray;
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
        console.log("------------\n")
        for (var j = 0; j < nodes.length; j++) {

            var nodeNeo = nodes[j].properties;
            console.log(JSON.stringify(nodeNeo))
            if (distinctNodeName[nodeNeo.nom] == null)
                distinctNodeName[nodeNeo.nom] = 0;
            else {
                distinctNodeName[nodeNeo.nom] += 1;
                nodeNeo.nom = nodeNeo.nom + "_" + distinctNodeName[nodeNeo.nom];
            }

            var nodeObj = {
                name: nodeNeo.nom,
                myId: nodeNeo.id,
                label: labels[j][0],
                id: ids[j],
                children: [],
                hiddenChildren: [],
                neoAttrs: nodeNeo
            }

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

 var key=nodeObj.id+"_"+ids[j-1];
              if( nodesMap[key]){// create a new id if allready existing
                  //    if( nodesMap[(-j*1000000000)+nodeObj.id]){// create a new id if allready existing
                    nodeObj.id=(-j*1000000000)+nodeObj.id;
                    ids[j]= nodeObj.id;
                }

                nodesMap[key] = nodeObj;


            }

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
    foldedTreeChildren = [];
    // removeExcludedLabels(nodesMap);
    deleteRecursiveReferences(nodesMap);

    setNodesIndexPath(nodesMap);
    var root = nodesMap.root;
    root.isRoot = true;

    maxEffectiveLevels = 1;
    var maxLevels = parseInt($("#depth").val());
//console.log(JSON.stringify(nodesMap))
    addChildRecursive(root, nodesMap, 1, maxLevels);


    initThumbnails();
    // console.log (JSON.stringify(root));
    cachedResultTree = root;
    return root;
}


function removeExcludedLabels(map) {
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
function deleteRecursiveReferences(nodesMap) {
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

function addChildRecursive(node, nodesMap, level, maxLevels) {
    totalNodesToDraw = 0;
    maxEffectiveLevels = Math.max(maxEffectiveLevels, level);
    // maxEffectiveLevels=level;
    try {// max stack size limit
        for (var key in nodesMap) {

            var aNode = nodesMap[key];

            if (aNode.parent == node.id) {
                if (excludeLabels && excludeLabels[aNode.label]
                    && excludeLabels[aNode.label] > -1)
                    continue;
                if (!nodesMap[key].visited) {
                    aNode.level = level;
                    if (level > maxLevels) {
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
                    addChildRecursive(aNode, nodesMap, level + 1, maxLevels);
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
function setNodesIndexPath(nodesMap) {
    for (var key in nodesMap) {
        var index = navigationPath.indexOf(nodesMap[key].id);
        if (index > -1)
            nodesMap[key].navigationPathIndex = index;

    }
}

function removeChildrenFromTree(json, myId) {
    foldedTreeChildren = [];
    function recurse(node) {
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
                recurse(node.children[i]);
            }

        }
    }

    recurse(json);
}


function jsonToHierarchyTree(json, groupBy) {
    if (Array.isArray(json))
        json = toFlareJson(json);

    function transformTree(node, hierarchNode, levelX, id) {
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

            var groupLabels = labelCardinality[node.children[i].label] > 1 ? true : false;

            if (levelX < 3 && groupLabels) {// on ne groupe les
                // noeud de meme
                // label q'au
                // premier niveau ou
                // si'l y en a
                // plusieurs
                if (!labels[childLabel]) {
                    labels[childLabel] = {
                        name: childLabel + "_" + levelX + (100 * layerIndex),
                        children: [],
                        level: levelX,
                        value: 0,
                        rate: 0,
                        shape: "textBox",
                        color: nodeColors[childLabel],
                        relType: node.children[i].relType,
                        relDir: node.children[i].relDir,
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


            transformTree(node.children[i], childNode, levelX);

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

    transformTree(json, hierRoot, 0, 1000);

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
function prepareTreeData(neoResult) {
    $("#spreadSheetDiv").css("visibility", "hidden");
    showInfosCallback(neoResult);
    var nameLength = 30;
    var data = neoResult[0].data;
    var variables = neoResult[0].columns;

    if (variables.length < 2)
        return;

    var nodes = {};
    setMessage(data.length + " rows retrieved", green);
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
        root2 = findNodeInTree(id, oldTreeRootNode);
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
                var oldChild = findNodeInTree(newId, oldTreeRootNode);
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
        d3tree = new D3Tree2($("#graphDiv"));
    d3tree.drawTree(root);
}

function formatTreeToCsv(json) {
    function recursiveSetParent(node) {
        if (!node.children || node.children.length == 0) {
            leaves.push(node)
        } else {
            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                if (!child.ancestors)
                    child.ancestors = [];
                child.parent = node;
                recursiveSetParent(child);
            }
        }

    }

    function recursiveSetAncestors(leaf, ancestor) {
        if (!leaf.ancestors)
            leaf.ancestors = [leaf];
        if (ancestor.parent) {
            if (leaf.ancestors.indexOf(ancestor.parent) < 0) {
                leaf.ancestors.push(ancestor.parent)
                recursiveSetAncestors(leaf, ancestor.parent);
            }
        }
    }

    var leaves = []
    recursiveSetParent(json);
    for (var i = 0; i < leaves.length; i++) {
        recursiveSetAncestors(leaves[i], leaves[i]);
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

function clickDatatable() {

}

function searchInProperties(value, callback) {
    var query = "$match (n) with n, [x in keys(n) WHERE n[x] =~ '(?i).*"
        + value
        + ".*' ] as doesMatch where size(doesMatch) > 0 return n limit "
        + limit;
    executeQuery(QUERY_TYPE_MATCH, query, callback);
}

// }


function flatResultToTree(data, withAttrs) {

    var str = "";
    var label = "";
    var color = "black";
    var nodes = {};
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].nodes.length; j++) {


            var node = {
                id: data[i].ids[j]
            }

            if (!nodes[node.id]) {
                node.neoAttrs = data[i].nodes[j].properties;
                if (!node.neoAttrs.name)
                    node.neoAttrs.name = node.neoAttrs.nom;
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
function searchNodes(subGraph, label, word, resultType, limit, from) {
    currentQueryParams = {
        subGraph: subGraph, label: label, word: word, resultType: resultType, limit: limit, from: from
    }
    var str = "";
    var subGraphWhere = "";
    if (!word)
        word = "";
    var returnStr = " RETURN n";//,id(n) as n_id,labels(n) as n_labels";
    var cursorStr = "";
    if (resultType == "count")
        returnStr = " RETURN count(n) as count";
    else
        cursorStr += " ORDER BY n.nom";
    if (from)
        cursorStr += " SKIP " + from;
    if (limit)
        cursorStr += " LIMIT " + limit;

    var property = "nom";

    var labelStr = "";
    if (label && label.length > 0)
        labelStr = ":" + label;

    var whereStr = getWhereProperty(word, "n")

    if (whereStr.length > 0)
        whereStr = " WHERE " + whereStr;

    if (subGraph) {
        if (whereStr.length == 0)
            subGraphWhere += " where  n.subGraph='" + subGraph + "' ";
        else
            subGraphWhere += " and  n.subGraph='" + subGraph + "' ";
    }

    str = "MATCH (n" + labelStr + ") " + whereStr + subGraphWhere + returnStr;


    str += cursorStr;
    console.log(str);
    var payload = {match: str};

    console.log(str)
    $.ajax({
        type: "POST",
        url: Gparams.neo4jProxyUrl,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            if (!resultType == "count")
                startSearchNodesTime = null;
            if (!data || data.length == 0) {
                setMessage("No results", blue);
                return;
            }
            var errors = data.errors;

            if (errors && errors.length > 0) {
                var str = "ERROR :";
                for (var i = 0; i < errors.length; i++) {
                    str += errors[i].code + " : " + errors[i].message + "<br>"
                        + JSON.stringify(paramsObj);
                }
                setMessage("!!! erreur de requete", red);
                console.log(str);
                return;
            }
            if (resultType == "count") {
                var count = data[0].count
                initResultPagination(count);
            } else if (resultType == "displayStartNodesPage") {
                fillLabelsPage(data);
            } else if (resultType == "nodeListHTML") {
                drawNodesOnlyTable(data);

            } else
                fillWordsSelect(data);

        },
        error: function (xhr, err, msg) {
            if (!resultType == "count")
                startSearchNodesTime = null;
            console.log(xhr);
            console.log(err);
            console.log(msg);
        },

    });

    ;

}


function initThumbnails() {

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