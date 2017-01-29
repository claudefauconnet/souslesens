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

// http://graphaware.com/neo4j/2015/01/16/neo4j-graph-model-design-labels-versus-indexed-properties.html

var traversalToTree = true;
var traversalToGraph = false;
var traversalToSpredsheet = false;
var d3tree;
var spreadsheet;

/*
 * var timeSlider; var initEventTypes;
 */

var page = 0;
var size = 100;
var sep = "\t";
var MaxNodesInWordsSelect = 20;
var MaxNodesInPage = 20;
var currentPageIndex = 0;
var currentRequestCount = 0;
var currentGraphPanel = "";
var currentMode = "read";

// constantes
var currentGraphRequestType_FROM_NODE = "simple";
var currentGraphRequestType_PATH = "path";
var currentGraphRequestType_TRAVERSAL = "traversal";
var currentGraphRequestType_FILTERED = "filtered";
var currentGraphRequestType_NODES_ONLY = "nodes_only";

var currentGraphRequestType = currentGraphRequestType_FROM_NODE;

var maxSpreadsheetRows = 998;
var QUERY_TYPE_MATCH = 0;
var QUERY_TYPE_LABELS = 1;
var QUERY_TYPE_TRAVERSAL = 2;
var QUERY_TYPE_GET_ID = 3;
currentQueryType = QUERY_TYPE_MATCH;
var rIndices = 1;
var currentObject;
var currentObjId;
var currentLabel;
var currentRelation;
var currentMode;
var cachedReslultTree;
var currentHiddenChildren = {};
var currentRelationActionTargetNode;
var startSearchNodesTime;
var nodeTypes = [];
var oldRightTabIndex = -1;
var popopuPosition = {
    x: 0,
    y: 0
};

var limitResult = 10000;

var oldData = [];

var addToOldData = true;
var oldTreeRootNode;
var treeSelectedNode;
var treeLevel = 1;
var infoDisplayMode = "PANEL";// "POPUP";
var currentMousePosition;
var dontReInitFilterGraph = false;
var subGraph;
var queryParams = {};

var nodeColors = {};
var linkColors = {};

var green = "green";
var blue = "purple";
var red = "red";

var labelsPositions = {};
var initialQuery = "";
//var currentVariables = [];
var currentVariable = "";
var currentDisplayType="FLOWER";
var selectedObject = {};
var subGraph;
var d3tree;
var isAdvancedDisplayDialogInitialized = false;
var isAdvancedSearchDialogInitialized = false;

var popupMenuNodeInfoCache;
var currentDataStructure;  //tree or flat

$(document).ready(function () {
    var queryParams = getQueryParams(document.location.search);
    subGraph = queryParams.subGraph;
    if (!subGraph)
        subGraph = window.parent.subGraph;

});

function getQueryParams(qs) {

    qs = qs.split("+").join(" ");

    var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
}

function initLabels() {

    setLabelsColor();

    for (var i = 0; i < dataModel.allLabels.length; i++) {
        var label = dataModel.allLabels[i];
        $("#nodesLabelsSelect").append($('<option>', {
            text: label,
            value: label
        }).css("color", nodeColors[label]));
    }

}

function setLinksColor() {
    for (var i = 0; i < dataModel.allRelationsArray.length; i++) {
        if (++i < Gparams.palette.length)
            linkColors[dataModel.allRelationsArray[i]] = Gparams.palette[i];
        else
            linkColors[dataModel.allRelationsArray[i]] = "gray";

    }
}
function setLabelsColor() {
    for (var i = 0; i < dataModel.allLabels.length; i++) {
        var label = dataModel.allLabels[i];
        if (i < Gparams.palette.length) {
            nodeColors[label] = Gparams.palette[i];
            // console.log(label+" "+Gparams.palette[i])
        }

        else
            nodeColors[label] = "gray";
    }

}

function doLoadRelationshipTypes(labels) {
    for (var i = 0; i < labels.length; i++) {
        var str = labels[i];
        $("#linksLabelsSelect").append($('<option>', {
            text: str,
            value: str
        }));

    }

}

function onNodesLabelsSelect(select) {

    var label = $(select).val();
    currentLabel = label;
    var variable = label;// .toLowerCase();
    var query = $("#queryTA").val();
    if (query == "") {
        rIndices = 0;
        labelsPositions = {};
        query = "MATCH (" + variable + ":" + label + ") return " + variable;
        $("#queryTA").val(query);
    } else {
        rIndices++;
        var p = query.indexOf(" return");
        var returnStr = query.substring(p);
        query = query.substring(0, p) + "-[r" + rIndices + "]-(" + variable
            + ":" + label + ")" + returnStr + "," + variable;
        $("#queryTA").val(query);
    }
    var labelPosition = query.indexOf(":" + label) + label.length + 1;
    labelsPositions[variable] = labelPosition;
    initialQuery = query;
    $(select).val("");

}
function onLabelSelect(labelSelect) {
    startSearchNodesTime = new Date() - 1000;
    var mode = $("#representationSelect").val();
    // var mode = $("#outputModeHome:checked").val();
    if (mode == "CHRONOCHART") {
        drawChronoChart();
    } else {
        currentPage = 0;
        searchNodesUI("count");
    }

}

function onMatchGo() {

    executeQuery(QUERY_TYPE_MATCH, $("#queryTA").val(), null)
}

function onTraversalGo(json) {

    return executeQue.ry(QUERY_TYPE_GET_ID, json, set)
}

function setQueryId(node) {
    var query = initialQuery;
    if (node) {
        currentVariable = node.label;

        var p = labelsPositions[node.label];
        query = query.substring(0, p) + "{id:" + node.id + "}"
            + query.substring(p);
    }
    $("#queryTA").val(query);
    executeQuery(QUERY_TYPE_MATCH, query, toGraph);
}

// function nodesLabelsSelect" size="7" onchange="onNodesLabelsSelect()">

function cleanTabDivs() {
    // $("#spreadSheetDiv").html("");
    $("#graphDiv").html("");
    $("#resultX").html("");
}

function toCsv(neoResult) {
    var str = JSON.stringify(neoResult);
    $("#resultX").html(str);

}

function completeResult(neoResult) {

    var data = neoResult[0].data;
    for (var i = 0; i < data.length; i++) {
        var row = data[i].row;
        if (row.length < 6)
            return;
        for (var j = 0; j < 3; j++) {

            row[j].id = row[j + 5];
            if (!row[j].name)
                row[j].name = row[j].nom;

        }
        if (!row[0].label)
            row[0].label = row[3][0];
        if (!row[1].label)
            row[1].label = row[4][0];

    }

    /*
     * if (addToOldData && !AutoDisplayTree) { neoResult[0].data =
     * oldData.concat(data); }
     */
    oldData = neoResult[0].data;

}

var recursiveBuildTreeOccurences = {};
function recursiveBuildTree(relations, parentNode) {

    for (var i = 0; i < data.length; i++) {
        if (relations[i].row[0].id == parentNode.id_) {
            var obj = relations[i].row[1];
            if (!parentNode.children)
                parentNode.children = [];
            var childNode = {
                name: obj.name,
                label: obj.name,
                id_: obj.id,
                label: obj.label

            }
            var occurences = recursiveBuildTreeOccurences[obj.label + "_"
            + obj.id];
            if (occurences) {// on clone le noeud en incrementant la valeur
                // de name

                recursiveBuildTreeOccurences[obj.label + "_" + obj.id] = occurences++
                childNode.name += "-" + occurences;
                parentNode.children.push(childNode);

            } else {
                recursiveBuildTreeOccurences[obj.label + "_" + obj.id] = 1;

                parentNode.children.push(childNode);
                recursiveBuildTree(relations, childNode);
            }

        }

    }

}

function flattenRelations(relations) {
    var cols = {};
    for (var i = 0; i < relations.length; i++) {
        var obj0 = relations[i].row[0];
        var obj1 = relations[i].row[1];
        if (!cols[obj0.label])
            cols[obj0.label] = [];
        if (!cols[obj1.label])
            cols[obj1.label] = [];
    }

    for (var i = 0; i < relations.length; i++) {
        var obj0 = relations[i].row[0];

        var obj1 = relations[i].row[1];
        for (var col in cols) {
            if (obj0.label == col) {
                cols[col].push({
                    row: i,
                    name: obj0.name
                });

            }
            if (obj1.label == col) {
                cols[col].push({
                    row: i,
                    name: obj1.name
                });
            }
        }

    }

    // console.log(JSON.stringify(cols));

    var array = [];

    for (var i = 0; i < relations.length; i++) {
        var row = {}
        for (var col in cols) {
            if (cols[col][0].row == i)
                row[col] = cols[col][0].name;
            else if (cols[col][1].row == i)
                row[col] = cols[col][1].name;
            else
                row[col] = "";
        }
        array.push(row);

    }

    return array;
    // console.log(JSON.stringify(array));

}

function upDateGraphFromSpreadsheet(event, coord, obj) {
    var str = $("#spreadSheetDiv").handsontable('getColHeader', coord.col);
    var p = str.indexOf("_");
    var label = str.substring(0, p);
    var property = str.substring(p + 1);
    spreadSheetSelectedObject = {};
    var node = {};
    var obj2 = spreadsheet.getSelectedObject(coord.row);
    // node[currentVariables[index]+"_id"] =obj[currentVariables[index]+"_id"] ;
    selectedObject.id = obj2[label + "_id"];
    selectedObject.label = label;
    executeQuery(QUERY_TYPE_MATCH, " Match (n:" + selectedObject.label + "{id:"
        + selectedObject.id + "}) return id(n)", function (result) {
        selectedObject.neoId = result[0].data[0].row[0];
        setMessage("SELECTION : " + JSON.stringify(selectedObject), blue);
        if (event.ctrlKey) {
            setQueryId(selectedObject);

        } else {
            if (graph)
                graph.highlightLinkedNodesExt(selectedObject);
        }
    });

}

function storeQuery() {
    if (typeof (Storage) !== "undefined") {
        var name = prompt("request name");
        if (!name || name.length == 0)
            return;
        var query = str = $("#queryTA").val();
        localStorage.setItem(name, query);
        loadStoredQueriesNames();

    } else {
        setMessage("Sorry! No Web Storage support..", red);

    }
}

function loadStoredQueriesNames() {
    if (typeof (Storage) !== "undefined") {
        var queries = []
        for (var i = 0; i < localStorage.length; i++) {
            var queryName = localStorage.key(i);
            $("#storedQueries").append($('<option>', {
                text: queryName,
                value: queryName
            }));
        }

    } else {
        setMessage("Sorry! No Web Storage support..", red);

    }

}

function loadQuery(select) {
    var qName = $(select).val();
    var query = localStorage.getItem(qName);
    $("#queryTA").val(query);
}

function deleteQuery() {
    if (confirm("Are you sure ?")) {
        var qName = $("#storedQueries").val();
        var query = localStorage.removeItem(qName);
        $("#queryTA").val(query);
    }
}

function exportQueries() {
    if (typeof (Storage) !== "undefined") {
        var queries = [];
        for (var i = 0; i < localStorage.length; i++) {
            var queryName = localStorage.key(i);
            var queryValue = localStorage.getItem(queryName);
            var obj = {};
            obj[queryName] = queryValue;
            queries.push(obj);
        }

        var str = JSON.stringify(queries);
        $("#spreadSheetDiv").css("height", "0px");
        $("#csvDiv").css("height", "600px");
        $("#csvText").val(str);

    } else {
        setMessage("Sorry! No Web Storage support..", red);

    }

}

function importQueries() {
    if (typeof (Storage) !== "undefined") {
        var str = prompt("enter exported queries");
        if (!str || str.length == 0)
            return;
        var json = JSON.parse(str);
        nodes
        for (var i = 0; i < json.length; i++) {
            for (var key in json[i]) {
                localStorage.setItem(key, json[i][key]);
            }
        }
        loadStoredQueriesNames();

    } else {
        setMessage("Sorry! No Web Storage support..", red);

    }

}

function setMessage(str, color) {
    if (color)
        $("#message").css("color", color);

    $("#message").html(str);
}

function selectTab(index) {
    $('#ressourcesTab').tabs({
        active: index
    });
}

function clearQuery() {
    $("#queryTA").val("");
}


function searchNodesUI(resultType, limit, from) {
    if (!startSearchNodesTime) {// temporisateur
        startSearchNodesTime = new Date();
        return;
    } else {
        now = new Date();
        if (now - startSearchNodesTime < 500)
            return;
    }
    var word = "";
    var label = $("#nodesLabelsSelect").val();
    word = $("#word").val();
    if (word && word.length < 3 && label && label.length == "") {
        return;
    }
    searchNodes(subGraph, label, word, resultType, limit, from);
}



function initResultPagination(count) {

    currentRequestCount = count;
    if (count > MaxNodesInWordsSelect) {
        currentPageIndex = 0;
        var from = currentPageIndex * MaxNodesInPage;

        searchNodesUI("displayStartNodesPage",
            MaxNodesInPage, from);

    } else
        searchNodesUI("displayStartNodesPage",
            MaxNodesInPage, from);
    // fillWordsSelect(data.results);

}

function extractNodesList(data) {

    var nodes = {};
    var links = [];
    var index = 0;
    // setMessage(data.length + " resultats", green);
    var outData = [];
    for (var i = 0; i < data.length; i++) {
        var label = data[i].n.labels[0];
        var obj = {
            name: data[i].n.properties.nom + " [" + label + "]",
            id: data[i].n._id,
            label: label,
            color: nodeColors[label]
        }
        outData.push(obj);
    }
    return outData;
}

function fillLabelsPage(neoResult) {
    var nodes = extractNodesList(neoResult);
    fillSelectOptions(wordsSelect, nodes, "name", "id");
    var str = "<table><tr><td><span id='lang_156'>Noeuds trouves</span> </td><td>"
        + currentRequestCount
        + "&nbsp;<button onclick='listNodesAndAttrs()'><span id='lang_157'>liste</span></button>"
        + "</td></tr>";
    str += "<tr><td>ou noeud de depart </td><td>&nbsp;&nbsp;"
    if (currentPageIndex > 0)
        str += "<button onclick=' goToPreviousPage()'>&lt;</button>&nbsp;"
    if (nodes.length < currentRequestCount)
        str += "<button onclick=' goToNextPage()'>&gt;</button>&nbsp;"
    str += "</td></tr></table>";

    // str += "<a class='pageNav' href='javascript: goToPreviousPage()'>
    // page precedente</a>&nbsp;"
    // str += "<a class='pageNav' href='javascript: goToNextPage()'> page
    // suivante</a>"
    $("#startNodePageNavigation").html(str);

}
function goToNextPage() {
    currentPageIndex++;
    var from = currentPageIndex * MaxNodesInPage;
    searchNodesUI("displayStartNodesPage", MaxNodesInPage, from);
}
function goToPreviousPage() {
    currentPageIndex--;
    var from = currentPageIndex * MaxNodesInPage;
    searchNodesUI("displayStartNodesPage", MaxNodesInPage, from);
}

function fillWordsSelect(neoResult) {
    var nodes = extractNodesList(neoResult);
    wordsSelect.options.length = 0;
    fillSelectOptions(wordsSelect, nodes, "name", "id");
}

function fillSelectOptions(select, data, textfield, valueField) {
    select.options.length = 0;
    if (!textfield || !valueField) {
        fillSelectOptionsWithStringArray(select, data);
        return;
    }
    $.each(data, function (i, item) {
        $(select).append($('<option>', {
            text: item[textfield],
            value: item[valueField],

        }));

    });

    var str = $(select).attr("id");
    $.each(data, function (i, item) {
        if (item.color)
            $("#" + str + " option:eq(" + i + ")").css("color", item.color);
    })
}

function onWordSelect(draw) {
    var text = wordsSelect.options[wordsSelect.selectedIndex].text;

    currentLabel = text.substring(text.indexOf("[") + 1, text.indexOf("]"));
    currentNodeName = text.substring(0, text.indexOf("]") - 1);
    currentObjId = $("#wordsSelect").val();
    currentObject = {
        id: currentObjId,
        name: currentNodeName,
        label: currentLabel
    }

    $("#tabs-radarLeft").tabs("enable");
    $("#tabs-radarRight").tabs("enable");
    $("#currentNodeSpan").html("Noeud central : " + text);

    if (currentMode == "write") {
        var index = $('#tabs-radarRight a[href="#modifyTab"]').parent().index();
        $("#tabs-radarRight").tabs("option", "active", index);

        dispatchAction("modifyNode");
        return;
    }

    //selectLeftTab("#graphQueryFiltersTab");

    $("#graphPathSourceNode").html(text);
    $("#graphTravSourceNode").html(text);

    getGraphDataAroundNode(currentObjId, drawGraph);

}

/*
 * var mode = $("#modifyModeSelect").val(); if (mode == "createRelation") {
 * 
 * currentRelationActionTargetNode = { id : id, label : currentLabel, name :
 * currentNodeName } return; }
 * 
 * currentRelationActionTargetNode = null; if (!id && currentObject) { id =
 * currentObject.id; text = currentObject.name; }
 * 
 * if (id == -1 && !draw) return; getGraphDataAroundNode(id); var q =
 * text.indexOf("]"); var label = text.substring(1, q); //
 * currentVariable=label; /*addToBreadcrumb({ id : id, label : text, color :
 * nodeColors[label] }); }
 */

function getGraphDataAroundNode(id, callbackFunction) {
    hidePopupMenu();
    // isAdvancedDisplayDialogInitialized=false;
    if (!id)
        id = currentObjId;
    else
        currentObjId = id;

    // var mode = $("#outputModeHome:checked").val();
    var mode = $("#representationSelect").val();
    currentMode = mode;
    /* $("#bottomPanel").css("visibility", "visible"); */

    if (mode != "CHRONOCHART") {
        $("#chronoParams").css("visibility", "hidden");
        $("#timeSlider").css("visibility", "hidden");
        $("#chronoParams").css("height", "0px");
    }

    /* $('#tabs-radarRight').tabs({
     active: 0
     });*/
    /*	$('#tabs-radarLeft').tabs({
     active : 1
     });*/

    if (mode == "FORCE_COLLAPSE") {
        getNodeAllRelations(id, mode);
        return;
    }
    if (mode == "SIMPLE_FORCE_GRAPH") {
        getNodeAllRelations(id, mode);
        return;
    }
    if (mode == "TREE") {
        getNodeAllRelations(id, mode);
        return;
    }
    if (mode == "MANUAL") {
        getNodeAllRelations(id, mode);
        return;
    }
    if (mode == "FLOWER") {
        getNodeAllRelations(id, mode);
        return;
    }

    else if (mode == "TREEMAP") {
        getNodeAllRelations(id, mode);
    }
    else if (mode == "listTree") {
     if (currentDataStructure == "tree") {
            if (cachedReslultTree)
                listTreeResultToHtml(cachedReslultTree, Gparams.htmlOutputWithAttrs)
            else
                getNodeAllRelations(id, mode);
        }

    }
    /*  if (!callbackFunction) {
     if (mode == "GRAPH")
     callbackFunction = drawGraph;
     else if (mode == "TREE")
     callbackFunction = drawTree;// drawTreeGroupByLabels;
     else if (mode == "TREEMAP")
     callbackFunction = drawTree;
     else if (mode == "LIST")
     callbackFunction = drawList;
     else if (mode == "SPREADSHEET")
     callbackFunction = drawSpreadsheet;
     else if (mode == "CHRONOCHART") {
     $("#timeSlider").css("visibility", "visible");
     $("#eventTypes").css("visibility", "visible");
     $("#chronoParams").css("visibility", "visible");
     $("#timeSlider").css("visibility", "visible");
     $("#chronoParams").css("height", "40px");

     $("#graphContainerDiv").css("overflow", "auto");
     drawChronoChart();

     }
     }*/


}

function addToBreadcrumb(obj) {
    var name = obj.label;
    if (obj.label)
        name = obj.name;
    if (obj.name)
        name = obj.nom;
    if (!obj.name)
        return;
    var str = $("#breadcrumb").html()
        + "&nbsp;&nbsp;<a class='breadcrumb-item' id='bc_" + obj.id
        + "' href='javascript:getGraphDataAroundNode(" + obj.id + ")'>"
        + name + "</a>"
    $("#breadcrumb").html(str);
    $(".breadcrumb").css("visibility", "visible");
    var color = nodeColors[obj.type];
    $("#bc_" + obj.id).css("color", color);
}

var showInfos = function (node) {

    getGraphDataAroundNode(node.id, showInfosCallback);

}
function showInfosById(id) {

    getGraphDataAroundNode(id, showInfosCallback);
}

function showInfosCallback(data) {


    if (data.length == 0) {

        return;
        // $("#infoPanel").html("no results");

    }

    // ****************************draw
    // properties**********************************
    var obj = data[0].n.properties;
    if (currentObject) {
        obj.neoId = currentObject.id;

        //obj.myId = currentObject.myId;
        obj.label = data[0].n.labels[0];
    } else {
        obj.neoId = data[0]._id;
    }
    currentObject = obj;

    var str = formatNodeInfo(obj);
    if (infoDisplayMode == "POPUP") {
        $("#popup").html(str);
        $("#popup").css("top", popopuPosition.y);
        $("#popup").css("left", popopuPosition.x);
        $("#popup").css("z-index", 100);
        $("#popup").css("visibility", "visible");
    } else {
        $("#infoPanel").html(str);
        $("#infoPanel").css("visibility", "visible");

    }

}

function drawList(result) {
    showInfosCallback(result);
    var data = result[0].data;
    if (data.length == 0) {
        getGraphDataAroundNode(currentObjId, drawList, true);
        return;
    }

    if (data[0].row[4] == "x") {// pas de relation
        $("#graphDiv").html("pas de sujets associes");
        return;
    }
    var title = data[0].row[0].name;
    var labels = {};
    for (var i = 0; i < data.length; i++) {
        var row = data[i].row;
        var label = row[4];
        if (!labels[label]) {
            labels[label] = [];
        }
        labels[label].push(row)

    }

    var str = "<B>" + title + "</B>&nbsp;Sujets associes :<ul>";

    for (var key in labels) {
        str += "<li><B><font color='" + nodeColors[key] + "'> " + key
            + "</font></B>";
        str += "<ul>";
        var data = labels[key];
        for (var i = 0; i < data.length; i++) {
            var id = data[i][1].id;
            var name = data[i][1].name;
            if (name == key) {
                id = data[i][2].id;
                name = data[i][2].name;
            }
            str += "<li><a href='javascript:getGraphDataAroundNode(" + id
                + ")'>" + name + "</a></font></li>";
            // console.log(str)
        }
        str += "</ul></li>";
    }
    str += "</ul>"

    $("#graphDiv").html(str);

}

/**
 * **********************************draw 3D
 * ********************************************
 */

function drawTree(neoResult) {
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

function drawTreeGroupByLabels(neoResult) {
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

    var labelNodes = {};
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
            var obj2 = labelNodes[childObj.label];
            if (!obj2) {

                labelNodes[childObj.label] = [];
                var labelNode = {
                    id: labelsId--,
                    name: key,
                    label: key,
                    children: [],
                }
                labelNodes[childObj.label].push(labelNode);
            }
            var xxxx = labelNodes[childObj.label];
            var www = labelNodes[childObj.label].children;
            labelNodes[childObj.label].children.push(childObj);
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
        var root = {

            id: -1,
            isRoot: true,
            name: "..",
            // name : "-" + currentVariable,
            children: []
        }
        var labelsId = -1000;
        for (var key in labelNodes) {

            root.children.push(labelNodes[key]);
        }

    }

    oldTreeRootNode = root;
    treeLevel += 1;
    if (!d3tree)
        d3tree = new D3Tree2($("#graphDiv"));
    d3tree.drawTree(root);
}
function drawGraph(neoResult) {
    $("#spreadSheetDiv").css("visibility", "hidden");
    showInfosCallback(neoResult);
    var nodes = {};
    var links = [];
    var index = 0;

    var xxx = neoResult[0];
    var data = neoResult[0].data;
    var variables = neoResult[0].columns;

    if (variables.length < 2) {
        setMessage("Graph needs at least 2 node types", "red");
        return;
    }

    setMessage(data.length + " resultats", green);

    for (var i = 0; i < data.length; i++) {
        var row = data[i].row;

        var link = {};
        var sourceId = "_" + row[0].id;
        var targetId = "_" + row[1].id;
        link.source = nodes[sourceId] || (nodes[sourceId] = {
                name: sourceId
            });
        link.target = nodes[targetId] || (nodes[targetId] = {
                name: targetId
            });
        links.push(link);
    }

    for (var i = 0; i < data.length; i++) {
        var row = data[i].row;

        var sourceId = "_" + row[0].id;
        var targetId = "_" + row[1].id;
        if (!row[1].name)
            row[1].name = "xxx";
        if (!row[0].name)
            row[0].name = "xxx";

        if (nodes[sourceId]) {
            nodes[sourceId].label = variables[0];
            nodes[sourceId].abbrev = row[0].name.substring(0, nameLength);
            nodes[sourceId].label = row[0].name;
            nodes[sourceId].id = row[0].id;
        }
        if (nodes[targetId]) {
            nodes[targetId].label = variables[1];
            nodes[targetId].abbrev = row[1].name.substring(0, nameLength);
            nodes[targetId].label = row[1].name;
            nodes[targetId].id = row[1].id;
            if (nodes[sourceId])
                nodes[targetId].parentNode = nodes[sourceId];
        }
        if (row[0].label) {
            nodes[sourceId].label = row[0].label;
        } else {
            nodes[sourceId].label = variables[0];
        }
        if (row[1].label) {
            nodes[targetId].label = row[1].label;
        } else {
            nodes[targetId].label = variables[1];
        }
    }

    graph = new ForceGraph("#graphDiv", nodes, links);
    // graph.cleanGraph();
    if (true || nodes.length > 0) {
        graph.nodeColors = nodeColors;
        graph.drawGraph();
    }

}

function findNodeInTree(id, node) {
    if (node._id && node._id.indexOf(id) == 0)
        return node;
    if (!node.children)
        node.children = [];
    for (var i = 0; i < node.children.length; i++) {
        var child = node.children[i];
        if (child._id && child._id.indexOf(id + "_") == 0) {
            console.log("---" + child.name + "-" + child.id)
            return child;

        }

        else {
            var found = findNodeInTree(id, child);
            if (found)
                return found;
        }

    }
    return null;
}

function removeDoublonNodes(root2, distinctParentNodes) {
    var toRemove = [];
    for (var i = 0; i < distinctParentNodes.length; i++) {
        var node = distinctParentNode[i];
        if (node._id == root2.id)
            toRemove.push(node);
    }

}

function drawSpreadsheet(neoResult) {
    $("#spreadSheetDiv").css("visibility", "visible");
    var rows = [];
    var spreadsheetHeaders = [];
    spreadSheetSelectedObject = {};
    var data = neoResult[0].data;
    var variables = neoResult[0].columns;
    var doublons = [];
    for (var i = 0; i < data.length; i++) {
        var obj = {};
        var rowData = data[i].row;

        for (var j = 0; j < rowData.length; j++) {
            var str = "";
            for (var key in rowData[j]) {
                str += rowData[j][key]
                obj[variables[j] + "_" + key] = rowData[j][key];
            }

        }
        if (doublons.indexOf(str < 0)) {
            doublons.push(str);
            rows.push(obj);
        } else {
            console.log("doublon detected");
        }
        if (rows.length > maxSpreadsheetRows) {
            setMessage("more than " + maxSpreadsheetRows + " rows")
            break;
        }

    }

    for (var key in rows[0]) {
        spreadsheetHeaders.push(key);
    }

    if (rows.length <= maxSpreadsheetRows) {
        setMessage(rows.length + " rows retrieved", green)

        spreadsheet = new Spreadsheet("spreadSheetDiv");
        spreadsheet.headers = spreadsheetHeaders;
        spreadsheet.onCellClickCallBack = upDateGraphFromSpreadsheet;
        spreadsheet.load(rows);
    } else {
        $("#popupTextarea").text("aaaaa");
        $("#popupTextarea").style.visibility = "visible";
    }

}

function selectLeftTab(tabId) {

    var index = $('#tabs-radarLeft a[href="' + tabId + '"]').parent().index();
    $("#tabs-radarLeft").tabs("option", "active", index);

}

function onRadarLeftActivate(index) {
    if (currentGraphRequestType != currentGraphRequestType_FILTERED)
        $("#accordionRepresentation").accordion({active: 0});
    if (index == 1) {
        if (false && exploredTree && exploredTree != null)

            displayGraph(exploredTree, "CSV");
        else

            return;
    }
    if (index == 2) {
        dispatchAction("nodeInfos");
    }

}

function onRadarRightActivate(index) {

    if (index == 1) {
      //  onVisButton('HTML');
        //  listNodesAndAttrs();
        /*
         * if (exploredTree && exploredTree != null) displayGraph(exploredTree,
         * "CSV");
         */

    }
    /* else if (index == 3) {
     dispatchAction("modifyNode");
     }*/
}

function dispatchAction(action, objectId) {
    if (objectId)
        currentObject = currentHiddenChildren[objectId];

    var id;
    if (currentObject && currentObject.id)
        id = currentObject.id;
    else
        id = currentObjId

    if (!currentObject.label && currentObject.nodeType) {
        currentObject.label = currentObject.nodeType;
    }

    currentGraphPanel == "";// "graphParametersPanel"

    if (action == "nodeInfosPopup") {
        $("#externalInfoPanel").html("");
        $("#externalSourceSelect").val(null);
        if (id) {
            showInfos2(id, function (obj) {
                var str = "<input type='image' src='images/back.png' height='15px' alt='back' onclick='restorePopupMenuNodeInfo()' ><br>"
                str += formatNodeInfo(obj[0].n.properties);
                popupMenuNodeInfoCache = $("#popupMenuNodeInfo").html();
                $("#popupMenuNodeInfo").html(str);
            });

        }
        return;
    }
    hidePopupMenu();
    $("#ModifyNodeActionDiv").html("");
    $("#ModifyNodeActionDiv").css("visibility", "hidden");
    $("#linkActionDiv").css("visibility", "hidden");
    var mode = $("#representationSelect").val();

    if (action == "nodeInfos") {
        $("#externalInfoPanel").html("");
        $("#externalSourceSelect").val(null);
        if (id) {
            showInfos2(id, showInfosCallback);
            selectLeftTab('#attrsTab');
        }
    }

    if (action == 'relationInfos') {
        var str = getRelationAttrsInfo()

        selectLeftTab('#attrsTab');
        $("#infoPanel").html(str);
    }


    if (action == "unfoldNode") {

        getNodeAllRelations(currentObject.id, mode, true, false);
    } else if (action == "setAsRootNode") {
        initGraphFilters(currentObject.label);
        getNodeAllRelations(currentObject.id, mode);
    } else if (action == "foldNode") {
        var output = $("#representationSelect").val();

        removeChildrenFromTree(exploredTree, currentObject.myId);
        displayGraph(exploredTree, output);
    }

    else if (action == "linkSource") {
        //	selectLeftTab('#radarFiltersTab');
        $("#linkActionDiv").css("visibility", "visible");
        var sourceNode = currentObject;
        $("#linkSourceNode").val(sourceNode.name);
        $("#linkSourceNode").css("color", nodeColors[sourceNode.label]);
        $("#linkSourceLabel").html(sourceNode.label);
        currentRelationData = {
            sourceNode: sourceNode,
        }
    } else if (action == "linkTarget") {
        //	selectLeftTab('#modifyTab');
        $("#linkActionDiv").css("visibility", "visible");
        var targetNode = currentObject;
        $("#linkTargetNode").val(targetNode.name);
        $("#linkTargetNode").css("color", nodeColors[targetNode.label]);
        $("#linkTargetLabel").html(targetNode.label);
        $("#accordionModifyPanel").accordion("option", "active", 1);
        currentRelationData.targetNode = targetNode;
        setLinkTypes();
    } else if (action == "modifyNode") {
        $("#ModifyNodeActionDiv").css("visibility", "visible");
        $("#accordionModifyPanel").accordion("option", "active", 0);
        // var index = $('#tabs-radarRight
        // a[href="li_modify"]').parent().index();
        $("#tabs-radarRight").tabs("option", "active", 3);
        if (id) {
            var query = "MATCH (n) WHERE ID(n) =" + id + " RETURN n";//,'m','r',labels(n),'x',ID(n) ";// limit 1 ";

            executeQuery(QUERY_TYPE_MATCH, query, function (data) {
                if (data.length == 0)
                    return;
                var obj = data[0].n.properties;
                obj.id = data[0].n._id;
                obj.label = data[0].n.labels[0];
                drawFieldInputs(obj);
                $("#accordionModifyPanel").accordion({active: 1});
                $("#accordionModifyPanel").accordion({active: 0});
                //$( "#accordionModifyPanel" ).accordion( "option", "animate", 200 );

            });
        }

    } else if (action == "switchNodesVisibilityFromLabel") {
        var action2 = "";
        if (currentObject.children && currentObject.children.length > 0)
            action2 = "closeNodesFromLabel";
        else
            action2 = "openNodesFromLabel";
        dispatchAction(action2);

    } else if (action == "closeNodesFromLabel") {
        myFlower.hideNodesWithLabel(currentObject.name);

    } else if (action == "openNodesFromLabel") {
        myFlower.showNodesWithLabel(currentObject.name);

    } else if (action == "listNodesFromLabel") {

    } else if (action == "drawGraphFromLabel") {

    }
}

function setMessage(message, color) {
    $("#message").html(message);
    if (color)
        $("#message").css("color", color);
}

function loadExternalData(select) {
    $("#externalInfoPanel").html("");
    // if(!currentObject)
    // return;
    var str = "";
    var source = $(select).val();
    var externalUri = currentObject["uri_" + source];
    if (externalUri) {
        showExternalResourceDetails(externalUri);
    } else {
        listExternalItems(source, currentObject, externalInfoPanel);
    }

}

function associateExternalResourceToNode() {
    var source = $("#externalSourceSelect").val();
    var prop = {};
    prop["uri_" + source] = currentExternalUri;
    updateProperties(currentObject, prop);

}

function zeroRelationsForNodeAction(data) {


    if (data.length == 0) {

        return;
    }
    currentObject = data[0].n.properties;
    currentObject.id = data[0].n._id;
    currentObject.label = data[0].n.labels[0];
    if (!currentObject.name)
        currentObject.name = currentObject.nom


    var ppp = $("#wordsSelect").position();

    /*
     * var range = wordsSelect.createRange(); range.collapse(true);
     */
    var x = currentMousePosition.x
    var y = currentMousePosition.y

    $("#graphDiv").html("");
    $("#graphLegendDiv").html("Noeud sans lien actuellement...");
    d3.select(".graphSVG").selectAll("*").remove();
    // if (Gparams.readOnly == true) {
    dispatchAction('nodeInfos');
    // }

}

function onLinkClick(linkObj) {
    /*
     * if (confirm("detruire le lien " + linkObj.target.relType)) { query =
     * "Match (n)-[r:" + linkObj.target.relType + "]-(m) where id(m)=" +
     * linkObj.target.id + " DELETE r"; executeQuery(QUERY_TYPE_MATCH, query,
     * function() { setMessage("Lien supprime !", "green"); currentobject =
     * linkObj.source; $("#graphDiv").html("");
     * d3.select(".graphSVG").selectAll("*").remove();
     * dispatchAction('setAsRootNode'); }); }
     */
}

function changeLinkType(linkObj) {// afinir
    var newRelType = prompt(" entrez le nouveau type de relation ")
    var query = "MATCH (n:User)-[r:" + linkObj.target.relType
        + "]-(m) where id(mn)=" + linkObj.source.id + "+ and id(m)="
        + linkObj.target.id + ") CREATE (n)-[r2:" + newRelType
        + "]->(m) SET r2 = r WITH r DELETE r";

}

function initGraphFilters(labels) {
    if (dontReInitFilterGraph == true)
        return;

    if (!labels)
        label = [currentLabel];
    var str = "";
    var targetLabels = []
    var relationTypes = []

    for (j = 0; j < labels.length; j++) {
        var label = labels[j];
        var relations = dataModel.relations[label];
        if (!relations)
            return;
        for (var i = 0; i < relations.length; i++) {
            if (relationTypes.indexOf(relations[i].relType) < 0)
                relationTypes.push(relations[i].relType);
            if (targetLabels.indexOf(label) < 0)
                targetLabels.push(label);
            /*
             * if (targetLabels.indexOf(relations[i].label2) < 0)
             * targetLabels.push(relations[i].label2); if
             * (targetLabels.indexOf(relations[i].label1) < 0)
             * targetLabels.push(relations[i].label1);
             */
        }
    }

    var checked = "' checked='checked' ";
    var onclick = " onclick='startQueryFilterMode() '"
    onclick = "onclick='onFilterCbxClik();'";
    var noChecked = "";
    str += "<table>"

    // str += "<tr class='italicSpecial'><td ><span
    // class='bigger'>Noeuds</span></td><td>Inclure</td><td>Exclure</td></tr>";
    str += "<tr align='center' class='italicSpecial'><td ><span class='bigger'>Noeuds</span></td><td>Inclure<br><input type='checkbox' id='#comuteAllFiltersNodesInclude' onchange='comuteAllFilters(this)'></td><td>Exclure<br><input type='checkbox' id='#comuteAllFiltersNodesExclude' onchange='comuteAllFilters(this)'></td></tr>";
    for (var i = 0; i < targetLabels.length; i++) {
        str += "<tr align='center'>";
        str += "<td>" + "<font color='" + nodeColors[targetLabels[i]]
            + "'font>" + targetLabels[i] + "</font></td>";
        str += "<td><input type='checkbox' name='graphNodesFilterCbx' value='"
            + targetLabels[i] + "'" + onclick + checked + "/> "
        str += "</td><td>"
            + "<input type='checkbox' name='graphNodesFilterExcludeCbx' value='"
            + targetLabels[i] + "'" + onclick + noChecked + "/> "

        str += "</tr>";
    }
    str += "<tr><td colspan='3' >&nbsp;</B></td></td></tr>";

    // str += "<tr class='italicSpecial'><td colspan='3'><span
    // class='bigger'>Relations</span></tr>";
    str += "<tr align='center'  class='italicSpecial'><td ><span class='bigger'>Relations</span></td><td>Inclure<br><input type='checkbox' id='#comuteAllFiltersRelationsInclude' onchange='comuteAllFilters(this)'></td><td>Exclure<br><input type='checkbox' id='#comuteAllFiltersRelationsExclude' onchange='comuteAllFilters(this)'></td></tr>";

    for (var i = 0; i < relationTypes.length; i++) {
        str += "<tr align='center'>";
        str += "<td>" + relationTypes[i] + "</td>";
        str += "<td><input type='checkbox' name='graphRelationsFilterCbx' value='"
            + relationTypes[i] + "'" + onclick + checked + "/> "
        str += "</td><td><input type='checkbox' name='graphRelationsFilterExcludeCbx' value='"
            + relationTypes[i] + "'" + onclick + noChecked + "/> ";
        str += "</tr>";

    }

    str += "</table>"
    $("#graphQueryFilters").html(str);

    //selectLeftTab("#graphQueryFiltersTab");

    /*
     * var relCbxes = $("[name=graphRelationsFilterCbx]"); for (var i = 0; i <
     * relCbxes.length; i++) { relCbxes[i].checked = false; } var labelCbxes =
     * $("[name=graphNodesFilterCbx]"); for (var i = 0; i < labelCbxes.length;
     * i++) { labelCbxes[i].checked = false; }
     */
    $("#graphQueryFilters").css("visibility", "visible");
    // getGraphDataAroundNode(currentObjId,drawGraph);
}

function comuteAllFilters(caller) {
    var str = $(caller).attr("id");
    var status = $(caller).prop("checked");

    function comuteAll(cbxs, mode) {
        var relCbxes = $("[name=" + cbxs + "]");
        for (var i = 0; i < relCbxes.length; i++) {
            $(relCbxes[i]).prop("checked", mode);
        }

    }

    if (str == "#comuteAllFiltersRelationsInclude")
        comuteAll("graphRelationsFilterCbx", status);
    if (str == "#comuteAllFiltersRelationsExclude")
        comuteAll("graphRelationsFilterExcludeCbx", status);
    if (str == "#comuteAllFiltersNodesInclude")
        comuteAll("graphNodesFilterCbx", status);
    if (str == "#comuteAllFiltersNodesExclude")
        comuteAll("graphNodesFilterExcludeCbx", status);

}

function drawFilteredGraph() {

    dontReInitFilterGraph = true;


    var relRelTypesFilters = [];
    var nodeLabelFilters = [];
    var relRelTypesExcludedFilters = [];
    var nodeLabelExcludedFilters = [];
    var id = currentObjectId;
    var relCbxes = $("[name=graphRelationsFilterCbx]");
    for (var i = 0; i < relCbxes.length; i++) {
        if (relCbxes[i].checked) {
            relRelTypesFilters.push(relCbxes[i].value);
        }
    }
    var labelCbxes = $("[name=graphNodesFilterCbx]");
    for (var i = 0; i < labelCbxes.length; i++) {
        if (labelCbxes[i].checked) {
            nodeLabelFilters.push(labelCbxes[i].value);
        }
    }
    var labelExludedCbxes = $("[name=graphNodesFilterExcludeCbx]");
    for (var i = 0; i < labelExludedCbxes.length; i++) {
        if (labelExludedCbxes[i].checked) {
            nodeLabelExcludedFilters.push(labelExludedCbxes[i].value);
        }
    }

    var relExcludesCbxes = $("[name=graphRelationsFilterExcludeCbx]");
    for (var i = 0; i < relExcludesCbxes.length; i++) {
        if (relExcludesCbxes[i].checked) {
            relRelTypesExcludedFilters.push(relExcludesCbxes[i].value);
        }
    }

    graphQueryNodeFilters = "";
    graphQueryExcludeNodeFilters = ""
    for (var i = 0; i < nodeLabelFilters.length; i++) {
        if (i > 0)
            graphQueryNodeFilters += " OR ";
        graphQueryNodeFilters += "m:" + nodeLabelFilters[i];
    }
    if (graphQueryNodeFilters.length > 0)
        graphQueryNodeFilters = " and (" + graphQueryNodeFilters + ") ";

    graphQueryRelFilters = "";
    for (var i = 0; i < relRelTypesFilters.length; i++) {
        if (i > 0)
            graphQueryRelFilters += "|";
        graphQueryRelFilters += relRelTypesFilters[i];

    }
    if (graphQueryRelFilters.length > 0)
        graphQueryRelFilters = ":" + graphQueryRelFilters;

    for (var i = 0; i < nodeLabelExcludedFilters.length; i++) {
        graphQueryExcludeNodeFilters += " and NOT m:"
            + nodeLabelExcludedFilters[i];

    }

    for (var i = 0; i < relRelTypesExcludedFilters.length; i++) {
        if (i > 0)
            graphQueryExcludeRelFilters += ",";
        graphQueryExcludeRelFilters += "\"" + relRelTypesExcludedFilters[i]
            + "\"";

    }
    if (graphQueryExcludeRelFilters.length > 0)
        graphQueryExcludeRelFilters = "  and  NONE( rel in r WHERE type(rel) IN ["
            + graphQueryExcludeRelFilters + "])"

    getGraphDataAroundNode();

}

function drawNodesList() {

    searchNodesUI("count");
}
function drawGraphGeneral(useCache) {

    // $("#tabs-radarRight").tabs("option", "active", 0);
    hidePopupMenu();

    Gparams.showRelationNames = $("#showRelationTypesCbx").prop("checked");

    /*if (currentGraphRequestType != currentGraphRequestType_FILTERED) {
     dontReInitFilterGraph = false;
     }*/

    if (currentGraphRequestType == currentGraphRequestType_FROM_NODE) {
        if (!currentObject) {
            alert("il est nécessaire de choisir un noeud source ou de passer en mode recherche avancee")
            return;
        }
        getGraphDataAroundNode(useCache);

    } else if (currentGraphRequestType == currentGraphRequestType_FILTERED) {
        drawFilteredGraph();

    } else if (currentGraphRequestType == currentGraphRequestType_PATH) {
        if ($("#graphPathTargetNode").html() == "") {
            alert("il est nécessaire de choisir un noeud cible ")
            return;
        }
        // $("#representationSelect").val("TREE");
        drawGraphPath();
    }

    else if (currentGraphRequestType == currentGraphRequestType_TRAVERSAL) {
        drawGraphTraversal();
    }

    else if (currentGraphRequestType == currentGraphRequestType_NODES_ONLY) {
        var label = $("#nodesLabelsSelect").val();
        var word = $("#word").val();
        searchNodesUI("nodeListHTML");

    }

}
function displayGraph(json, output, labels) {
    $("#textDiv").html("");
    $("#tabs-radarRight").tabs("option", "active",0);

    if (!json  ) {
        if (output == "SIMPLE_FORCE_GRAPH")
            json = cachedResultArray;
        else
            json = cachedReslultTree;
    }
    setGraphActionsHelp();
    $("#tabs-radarLeft").tabs({
        disabled: false
    });
    $("#tabs-radarRight").tabs({
        disabled: false
    });
    if (!queryParams.mode == "write") {
        $("#tabs-radarRight").tabs({
            disabled: [3, 4]
        });
    }


    if (!output)
        output = currentDisplayType;
    var distance = parseInt($("#graphForceDistance").val());
    currentGraphCharge = parseInt($("#graphForceCharge").val());

    if (!output) {
        output = $("#representationSelect").val();
    }
   else if (output == "FLOWER") {
        var jsonFlower = json;
        if ($("#groupByLabelsCbx").prop("checked"))
            jsonFlower = jsonToHierarchyTree(json, "label");
        drawFlower(jsonFlower, distance, currentGraphCharge);

    }

    else if (output == "MANUAL") {
        drawModifiableGraph(json)

    } else if (output == "TREE") {
        var jsonTree = json;

        if (!d3tree)
            d3tree = new D3Tree2($("#graphDiv"));
        d3tree.drawTree(jsonTree, distance);
        d3tree.setInitialDisplayPosition();

    } else if (output == "FORCE_COLLAPSE") {
        drawForceCollapse(json, null, null, distance, currentGraphCharge);
    }
    else if (output == "TREEMAP") {
       var jsonTreeMap = jsonToHierarchyTree(json, "label");
      // setValues(jsonTreeMap)
        testTreemap(jsonTreeMap);
      //  drawTreeMap2(jsonTreeMap);
        // drawTreeMap(jsonTest);

    } else if (output == "SIMPLE_FORCE_GRAPH") {
        var forceJson = json;
        if (!json || json.children && json.children.length > 0)// maladroit à revoir dans flower
            forceJson = cachedResultArray;
        drawsimpleForce(forceJson);
    }



    if (labels)
        initGraphFilters(labels);
    drawLegend();
    var scrollLeft = ($("#graphDiv").parent().width() / 2) + 100;
    var scrollTop = ($("#graphDiv").parent().height() / 2);
    // d3tree.centerNode(100, 100, .9);
    // $("#graphDiv").scrollLeft(scrollLeft);
    // $("#graphDiv").scrollTop(200);
}


function onVisButton(value) {

    $("#representationSelect").val(value);
    currentDisplayType = value;
    drawGraphGeneral();

}

function onTextVisButton(mode) {
    if (mode == "HTML") {
        if (!cachedResultArray && !cachedReslultTree)
            getNodeAllRelations(id, mode);
        if (currentDataStructure == "flat") {
            var treeJon = flatResultToTree(cachedResultArray);
            listTreeResultToHtml(treeJon, Gparams.htmlOutputWithAttrs)
        }
        else if (currentDataStructure == "tree") {
            if (cachedReslultTree)
                listTreeResultToHtml(cachedReslultTree, Gparams.htmlOutputWithAttrs)
        }
    }
    else if (mode == "CSV") {
        if (!cachedResultArray)
            getNodeAllRelations(id, mode);
        if (currentDataStructure == "flat") {
            var treeJon = flatResultToTree(cachedResultArray);
            drawCSV(treeJon, Gparams.htmlOutputWithAttrs)
        } else if (currentDataStructure == "tree") {
            if (cachedReslultTree)
                drawCSV(cachedReslultTree, Gparams.htmlOutputWithAttrs)
            else
                getNodeAllRelations(id, mode);
        }
        return;


    }

}

function switchModifyMode(cbx) {

    if ($(cbx).is(':checked')) {
        currentMode = "write";
        $("#modifyButtonsDiv").css("visibility", "visible");
        $("#accordionModifyPanel").css("visibility", "visible");

    } else {
        // $("#li_modify").detach();
        currentMode = "read";
        $("#modifyButtonsDiv").css("visibility", "hidden");
        $("#accordionModifyPanel").css("visibility", "hidden");
    }
}

function showPopupMenu(x, y, type) {
    var popup = "popupMenuRead";

    if (type && type == "label") {
        popup = "popupMenuLabel";
    }
    else if (type && type == "nodeInfo") {
        setPopupMenuNodeInfoContent();
        popup = "popupMenuNodeInfoDiv";
        $("#popupMenuNodeInfoDiv").show();
    }

    else if (currentMode == "write")
        popup = "popupMenuWrite";


    $("#" + popup).css("visibility", "visible").css("top", y).css("left", x);

}
function hidePopupMenu() {
    $("#popupMenuRead").css("visibility", "hidden");
    $("#popupMenuWrite").css("visibility", "hidden");
    $("#popupMenuLabel").css("visibility", "hidden");
    $("#popupMenuNodeInfoDiv").css("visibility", "hidden");

}
function getSVG() {
    var xxx = $("#graphDiv").html();
    console.log(xxx);
}

function listNodesAndAttrs() {

    currentGraphRequestType = currentGraphRequestType_NODES_ONLY;
    drawGraphGeneral();
}

function execNeoQuery() {
    var query = $("#neoQueriesTextArea").val();
    executeQuery(QUERY_TYPE_MATCH, query, displayGraph);
}



function onFilterCbxClik() {
    drawGraphGeneral();
}

function showGraphForNodesCollection() {
    $("#representationSelect").val("SIMPLE_FORCE_GRAPH");
    drawGraphGeneral();
}

function backToNonFilteredGraph() {
    isInPathGraphAction = false;
    currentGraphRequestType = currentGraphRequestType_FROM_NODE;
    drawGraphGeneral();
    $("#accordionRepresentation").accordion({
        active: 0
    });
}

function showGantt() {
    drawGant(null, "photo", "date", null, 100);
}

function onLinkClick(id) {
    showInfos2(id, function (d) {
        currentObject = d[0].n.properties;
        currentObject.id = d[0].n._id;
        currentObject.label = d[0].n.labels[0];
        if (currentObject.path)
            showImage(Gparams.imagesRootPath + currentObject.path)
        dispatchAction('nodeInfos');
        $("#tabs-radarRight").tabs("option", "active", 2);
    });

}
function showImage(url) {
    $("#nodeDetailsIframe").prop("src", url);
    $("#tabs-radarRight").tabs("option", "active", 2);
}
function restorePopupMenuNodeInfo() {
    $("#popupMenuNodeInfo").html(popupMenuNodeInfoCache);
}


