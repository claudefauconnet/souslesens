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
 ******************************************************************************/var currentCypherQueryTextArea = "";
var currentNodeRole;
var matchIndex = 0;
var currentTabIndex = 0;
var currentActionObj;
var currentLabel;

var limit = 300;

var returnStr = "EXTRACT(rel IN relationships(path) | type(rel))as rels,nodes(path)as nodes, EXTRACT(node IN nodes(path) | ID(node)) AS ids, EXTRACT(node IN nodes(path) | labels(node)) as labels ";// ,
// EXTRACT(rel
// IN
// relationships(path))";


function onSourceNodeClick() {
    currentActionObj.currentTarget = "graphPathSourceNode";// initialisé dans page html
    currentActionObj.graphPathSourceNode = {};
    showLabelSelectionDialog("setTargetNodeLabel()");
}

function onTargetNodeClick() {

    currentActionObj.currentTarget = "graphPathTargetNode";// initialisé dans page html
    currentActionObj.graphPathTargetNode = {};
    showLabelSelectionDialog("setTargetNodeLabel()");
}


function showSimpleSearchDialog() {
    $("#dialog").dialog("option", "title", "valeur d'une propriete");
    str = getAllpropertiesDialogContent("setSearchNodeReturnFilterVal(true)");
    str += '<button onclick=" closeDialog()">Cancel</button><br>';
    $("#dialog").html(str);
    $("#dialog").dialog("open");


}

function closeDialog() {
    $("#dialog").dialog("close")
}

function showLabelSelectionDialog(callback) {

    var str = '<div id="Labeldialog"><table border="0"><tr>' +
        '<td><span id="lang_100">Labels</span></td>' +
        '</tr>' +
        '<tr>' +
        '<td><select id="nodesLabelsSelect" size="15" class="ui-widget-content" ondblclick="' + callback + '(this)"></select></td><td>';
    if (callback) {
        str += '<button onclick="' + callback + '(this)">OK</button>';
    }

    str += '<button onclick=" closeDialog()">Cancel</button><br>';
    if (currentActionObj.currentTarget != "customQueryMatch") {
        str += '<button onclick="showSearchPropertyDialog()">add property filter</button><br>';
        str += '<button onclick="showNodeSelectionDialog()"> select a node</button>';
    }
    str += '</td></tr></table>'

    $("#dialog").html(str);
    initLabels();
    $("#dialog").dialog("open");
}


function showSearchPropertyDialog() {
    var value = $("#nodesLabelsSelect option:selected").val();
    currentActionObj[currentActionObj.currentTarget].label = value;
    $("#dialog").dialog("option", "title", "valeur d'une propriete");
    str = getAllpropertiesDialogContent("setTargetNodeProperty()");
    str += '<button onclick=" closeDialog()">Cancel</button><br>';
    str += "<button onclick='showNodeSelectionDialog()'>Select a node</button>";
    $("#dialog").html(str);
    $("#dialog").dialog("open");
    /*  if (currentActionObj.currentTarget == "graphPathSourceNode")
     $("#getAllpropertiesDialogOkBtn").css("visibility", "hidden");*/


}


function showNodeSelectionDialog(value) {

    var value = $("#nodesLabelsSelect option:selected").val();
    if (value)
        currentActionObj[currentActionObj.currentTarget].label = value;
    value = setSearchNodeReturnFilterVal();
    if (value)
        currentActionObj[currentActionObj.currentTarget].property = value;
    var type = "";

    $("#dialog").dialog("option", "title", "Selectionner un Noeud " + type);
    dialogStr = "	<table><tr><td><div id='startNodePageNavigation'></div></td></tr><tr><td ><select size='15' id='wordsSelect'"
        + "onclick='setNode(this)'><option>----------</option></select></td>";
    dialogStr += '<button onclick=" closeDialog()">Cancel</button><br>';
    $("#dialog").html(dialogStr);

    searchNodes(currentActionObj.subGraph, currentActionObj[currentActionObj.currentTarget].label, currentActionObj[currentActionObj.currentTarget].property, "count");// 10000, 0);
    $("#dialog").dialog("open");


}


function setTargetNodeVisibility(hide) {
    if (hide || $("#graphPathSourceNode").val() == "")
        $(".targetNode").css("visibility", "hidden");
    else
        $(".targetNode").css("visibility", "visible");
}

function setTargetNodeLabel() {

    var value = $("#nodesLabelsSelect option:selected").val();
    setTargetNodeVisibility()
    currentActionObj[currentActionObj.currentTarget].label = value;
    //  $("#graphPathTargetNode").val(":" + value);
    $("#" + currentActionObj.currentTarget).val("[" + value + "]");
    $("#dialog").dialog("close");


}
function setTargetNodeProperty() {
    var value = setSearchNodeReturnFilterVal();
    setTargetNodeVisibility()
    currentActionObj[currentActionObj.currentTarget].property = value;
    $("#" + currentActionObj.currentTarget).val(value);
    $("#dialog").dialog("close");


}
function setSearchNodeReturnFilterVal(execSearch) {
    $("#dialog").dialog("close");

    var propertyType = $("#propertyType").val();
    if (!propertyType || propertyType == "")
        propertyType = "any"

    var operators = {
        Contains: "~",
        Equals: "=",
        Greater: ">",
        Lower: "<"
    }
    for (var key in operators) {

        var value = $("#property" + key).val();

        if (value && value != "") {

            var str = propertyType + ":" + operators[key] + " " + value;

            if (execSearch) {
                $("#word").val(str);
                searchNodesUI("count");
            }
            return str;
        }
    }


}

function setNode() {
    var index = wordsSelect.selectedIndex;
    var valueText = wordsSelect.options[wordsSelect.selectedIndex].text;
    var valueId = $("#wordsSelect").val();
    setTargetNodeVisibility()
    currentActionObj[currentActionObj.currentTarget].nodeId = valueId;
    currentActionObj[currentActionObj.currentTarget].nodeText = valueText;
    $("#dialog").dialog("close");

    $("#" + currentActionObj.currentTarget).val(valueText);


}


function onQueryMatchTextAreaClick() {
    currentActionObj.currentTarget = "customQueryMatch";// initialisé dans page html
    currentActionObj.customQueryMatch = {}

}


function setCustomMatchQueryLabel(select) {
    var value = $("#nodesLabelsSelect option:selected").val();
    $("#dialog").dialog("close");
    currentActionObj.label = value;

    $("#cypherQueryReturnTextArea").val(returnStr);


    var p = getCaretPosition(currentCypherQueryTextArea);
    var str = $(currentCypherQueryTextArea).val();
    if (true) {
        if (str == "") {
            str = "(n:" + value + ")";
            $(currentCypherQueryTextArea).val(str);
        } else {

            $("#dialog").dialog("option", "title", "distance de la relation");
            dialogStr = "<input  name='matchMode'type='radio' checked='checked' value='replace' > Remplacer"
                + "<input  name='matchMode'type='radio' value='add' onclick='$(\"#distanceDiv\").css(\"visibility\",\"visible\")'; > Ajouter<br>"
                + "<div style='visibility:hidden;' id='distanceDiv'> <hr>distance entre les noeuds :"
                + "<table><tr><td> Minimum</td><td><input id='matchMinRdistance' size='2' value='1'></td>"
                + "<table><tr><td> Maximum</td><td><input id='matchMaxRdistance' size='2' value='1'></td></tr></table></div>"
                +

                " <button onclick='setManualqueryMatch()'>OK</button>";
            $("#dialog").html(dialogStr);
            $("#dialog").dialog("open");

        }

    }

}

function getCaretPosition(ctrl) {
    var CaretPos = 0; // IE Support
    if (document.selection) {
        ctrl.focus();
        var Sel = document.selection.createRange();
        Sel.moveStart('character', -ctrl.value.length);
        CaretPos = Sel.text.length;
    }
    // Firefox support
    else if (ctrl.selectionStart || ctrl.selectionStart == '0')
        CaretPos = ctrl.selectionStart;
    return (CaretPos);
}


//********************************************************execute*****************************************

function execute() {
    if (currentActionObj.type == "pathes") {
        if (currentActionObj.graphPathSourceNode && currentActionObj.graphPathSourceNode.nodeId && currentActionObj.graphPathTargetNode && currentActionObj.graphPathTargetNode.nodeId) {
            executePathQuery();
        }
        else {
            buildCypherQuery();
        }

    }
    if (currentActionObj.type == "cypher") {
        buildCypherQueryUI();
    }

    if (currentActionObj.type == "frequentQuery") {
        executeFrequentQuery();
    }

    if (currentActionObj.type == "pattern") {
        executePattern()
    }


}


function executePathQuery() {
    var maxDistance = parseInt($("#graphPathMaxDistance").val());
    var algo = "allSimplePaths"// $("#graphPathsAlgorithm").val();
    getAllSimplePaths(currentActionObj.graphPathSourceNode.nodeId, currentActionObj.graphPathTargetNode.nodeId, maxDistance, algo);

}


function buildCypherQuery() {
    var maxDistance = parseInt($("#graphPathMaxDistance").val());
    var str = ""

    var matchStr = "(n"
    if (currentActionObj.graphPathSourceNode.label)
        matchStr += ":" + currentActionObj.graphPathSourceNode.label;
    matchStr += ")-[r" + "*.."
        + maxDistance
        + "]-(m";
    if (currentActionObj.graphPathTargetNode && currentActionObj.graphPathTargetNode.label)
        matchStr += ":" + currentActionObj.graphPathTargetNode.label;
    matchStr += ")";

    var whereStr = ""
    if (currentActionObj.graphPathSourceNode.property)
        whereStr += getWhereProperty(currentActionObj.graphPathSourceNode.property, "n");

    if (currentActionObj.graphPathTargetNode && currentActionObj.graphPathTargetNode.property) {
        if (whereStr.length > 0)
            whereStr += "  and ";
        whereStr += getWhereProperty(currentActionObj.graphPathTargetNode.property, "m");
    }
    if (currentActionObj.graphPathSourceNode.nodeId) {
        if (whereStr.length > 0)
            whereStr += "  and ";
        whereStr += "ID(n)=" + currentActionObj.graphPathSourceNode.nodeId;
    }

    if (currentActionObj.graphPathTargetNode && currentActionObj.graphPathTargetNode.nodeId) {
        if (whereStr.length > 0)
            whereStr += "  and ";
        whereStr += "ID(m)=" + currentActionObj.graphPathTargetNode.nodeId;
    }


    var query = "Match path=" + matchStr;
    if (whereStr.length > 0)
        query += " WHERE " + whereStr;

    /*  if (groupBy.length > 0)
     query += "groupBy " + groupBy;*/

    query += " RETURN  " + returnStr;

    query += " LIMIT " + limit;
    console.log(query);
    window.parent.executeCypherAndDisplayGraph(query, currentActionObj);

}


function getWhereProperty(str, nodeAlias) {
    var property = "nom";
    var p = str.indexOf(":");
    var operator;
    var value;
    if (p > -1) {
        property = str.substring(0, p);
        str = str.substring(p + 1);
        var q = str.indexOf(" ");
        operator = str.substring(0, q);
        value = str.substring(q + 1);
    }
    else {
        console.log("!!!!invalid query");
        return "";
    }

    if (operator == "~") {
        operator = "=~"
        // value = "'.*" + value.trim() + ".*'";
        value = "'.*" + value.trim() + ".*'";
    }
    else {
        if ((/[\s\S]+/).test(str))
            value = "\"" + value + "\"";
    }
    var propStr = "";
    if (property == "any")
        propStr = "(any(prop in keys(n) where n[prop]" + operator + value + "))";

    else {
        propStr = nodeAlias + "." + property + operator + value.trim();
    }
    return propStr;
}


function buildCypherQueryUI() {

    var match = $("#cypherQueryMatchTextArea").val();
    var where = $("#cypherQueryWhereTextArea").val();
    var groupBy = $("#cypherQueryGroupByTextArea").val();
//    var returnClause = $("#cypherQueryReturnTextArea").val();
    var limit = $("#cypherQueryLimitInput").val();
    if (match == "") {
        alert("la clause Match ne peut être vide");
        return;
    }

    if (match.indexOf("-[") < 0) {
        match += "-[r]-(x)"
    }
    var query = "Match path=" + match;
    if (where.length > 0)
        query += "WHERE " + where;

    if (groupBy && groupBy.length > 0)
        query += "groupBy " + groupBy;

    query += " RETURN  " + returnStr;

    query += " LIMIT " + limit;
    console.log(query);
    window.parent.executeCypherAndDisplayGraph(query);


}
function executeCypherAndDisplayGraph(query, _currentActionObj) {
    hideAdvancedSearch();
    $("#tabs-radarLeft").tabs("enable");
    $("#tabs-radarRight").tabs("enable");
    currentActionObj = _currentActionObj;


    if (currentActionObj.graphPathTargetNode) {
        currentDataStructure = "flat";
        currentDisplayType = "SIMPLE_FORCE_GRAPH";
        $("#graphForceDistance").val(20);
    }
    else if (currentActionObj.type == "pattern") {
        currentDataStructure = "flat";
        currentDisplayType = "SIMPLE_FORCE_GRAPH_BULK";
        executeQuery(QUERY_TYPE_MATCH, query, function (data) {
            cachedResultArray = data;
            data.patternNodes = currentActionObj.nodes;
            displayGraph(data, currentDisplayType, null)
        });
        return;
    }
    else {
        currentDataStructure = "tree";
        currentDisplayType = "FLOWER";
        $("#graphForceDistance").val(20);
    }

    $("#tabs-radarLeft").tabs("enable");
    executeQuery(QUERY_TYPE_MATCH, query, function (data) {
        cachedResultArray = data;

        displayGraph(data, currentDisplayType, null)
    });
}


function showCypherMatchDialog() {
    var p = getCaretPosition(currentCypherQueryTextArea);
    var str = $("#cypherQueryMatchTextArea").val();


    $("#dialog").dialog("option", "title", "distance de la relation");
    dialogStr = "<input  name='matchMode'type='radio' checked='checked' value='replace' > Remplacer"
        + "<input  name='matchMode'type='radio' value='add' onclick='$(\"#distanceDiv\").css(\"visibility\",\"visible\")'; > Ajouter<br>"
        + "<div style='visibility:hidden;' id='distanceDiv'> <hr>distance entre les noeuds :"
        + "<table><tr><td> Minimum</td><td><input id='matchMinRdistance' size='2' value='1'></td>"
        + "<table><tr><td> Maximum</td><td><input id='matchMaxRdistance' size='2' value='1'></td></tr></table></div>"
        +

        " <button onclick='setCypherqueryMatch(\"done\")'>OK</button>";
    $("#dialog").html(dialogStr);
    $("#dialog").dialog("open");


}
function setCypherqueryMatch(done) {
    $("#dialog").dialog("close");
    var label = $("#nodesLabelsSelect").val();
    if (label && label != "")
        currentLabel = label;

    var str = $("#cypherQueryMatchTextArea").val();
    if (str == "") {
        str = "(n:" + label + ")";
        $("#cypherQueryMatchTextArea").val(str);
    } else if (!done) {
        showCypherMatchDialog();
    }
    else {
        matchIndex++;
        var distanceMin = $("#matchMinRdistance").val();
        var distanceMax = $("#matchMaxRdistance").val();
        distanceMin = ""
        str += "-[r" + matchIndex + "*" + distanceMin + ".." + distanceMax
            + "]-(n" + matchIndex + ":" + currentLabel + ")";
        $("#cypherQueryMatchTextArea").val(str);
    }


}

function searchByNamesList(list) {
    var names;
    if (typeof list == "string")
        names = list.split(",");
    else
        names = list;
    var query = "MATCH path=(n)-[r]-(m) where n.nom IN ["
    for (var i = 0; i < names.length; i++) {
        if (i > 0)
            query += ","
        query += "\'" + names[i] + "\'";
    }
    query += "] return " + returnStr;
    executeCypherAndDisplayGraph(query);

}
//********************************************************old*****************************************
function onPathGraphSelectNodeCallback() {
    $("#dialog").dialog("close");
    var value = $("#wordsSelect").val();
    var text = wordsSelect.options[wordsSelect.selectedIndex].text;
    // var text=$("#wordsSelect").text();
    if (value == "")
        return;

    if (currentTabIndex == 2) {// path
        var xx = $("#graphPathSourceNodeVal").val();
        if (xx == "" || xx.indexOf("?") > 0) {
            $("#graphPathSourceNode").val(text);
            $("#graphPathSourceNodeVal").val(value);

        } else {
            $("#graphPathTargetNode").val(text);
            $("#graphPathTargetNodeVal").val(value);
        }
    }
    if (currentTabIndex == 1) {// traversal
        $("#graphTravSourceNodeText").val(text);
        $("#graphTravSourceNodeVal").val(value);
    }

}


/*function setWhereClause() {
 currentCypherQueryTextArea = cypherQueryWhereTextArea
 var p = getCaretPosition(currentCypherQueryTextArea);
 var str = $(currentCypherQueryTextArea).val();

 $("#dialog").dialog("close");
 var propertyType = $("#propertyType").val();
 if()
 var propertyValue = $("#propertyValue").val().toLowerCase();

 var where = "n." + propertyType + "=" + propertyValue;

 if (str == "")
 str = where;
 else {
 str += " and " + where;
 }
 $(currentCypherQueryTextArea).val(str);

 }*/


function onClickCypherQueryMatchTextArea(textArea) {

    currentCypherQueryTextArea = textArea;
}


function graphTravOnFilterSelect(select) {
    var str = "";
    var type = $(select).val();

    var condition = "";

    var selectId = $(select).attr("id");
    var returnId = "";
    if (selectId.indexOf("Return") > -1)
        returnId = 'graphReturnNodeProperty';
    else if (selectId.indexOf("Prune") > -1)
        returnId = 'graphPruneNodeProperty';


    if (true || type == "none") {
        if (selectId.indexOf("Return") > -1)
            $("#graphTravReturnEvaluator").val("");
        else if (selectId.indexOf("Prune") > -1)
            $("#graphTravPruneEvaluator").val("");
        //return;

    }
    if (type == "label") {
        var value = "";
        $("#dialog").dialog("option", "title", "type de label");
        condition = "position.endNode().hasLabel('" + value + "') ";
        str = "pas encore implemente, c'est pour bientot...";
    }

    else if (type == "nodeProperty") {
        // $("#dialog").detach($("#graphTravReturnEvaluator"));
        $("#dialog").dialog("option", "title", "valeur d'une propriete");
        str = getAllpropertiesDialogContent("setGraphTravReturnFilterVal('" + returnId + "')");
    }

    else if (type == "RelationType") {
        $("#dialog").dialog("option", "title", "type de  relation");
        str = getAllRelationsDialogContent("setGraphTravReturnFilterVal('graphRelationType')");

    }
    $("#dialog").html(str);
    $("#dialog").dialog("open");


}

function setGraphTravReturnFilterVal(type) {
    $("#dialog").dialog("close");
    if (type.indexOf('NodeProperty') > -1) {
        var propertyType = $("#propertyType").val();
        var propertyValue = $("#propertyValue").val().toLowerCase();
        condition = "position.endNode().hasProperty('" + propertyType + "') && position.endNode().getProperty('" + propertyType + "').toLowerCase().contains('" + propertyValue + "')"
    }

    if (type.indexOf('graphRelationType') > -1) {
        var relType = $("#relType").val();
        var relDir = $("#relDir").val();
        var relationships = [{
            "direction": relDir,
            "type": relType
        }];
        $("#graphTravRelTypes").val(JSON.stringify(relationships));
        return;
    }


    var str = $("#graphTravReturnEvaluator").val();
    if (str && str.length > 0)
        str += " && ";

    str += condition;
    if (type.indexOf('Return') > -1) {
        $("#graphTravReturnEvaluator").val(str);
    }
    if (type.indexOf('Prune') > -1) {
        $("#graphTravPruneEvaluator").val(str);
    }


}


function onExecuteTraversalQuery() {
    var startNodeId = $("#graphTravSourceNodeVal").val();
    var graphTravReturnType = $("#graphTravReturnType").val();
    var graphTravPriority = $("#graphTravPriority").val();
    var graphTravUnicity = $("#graphTravUnicity").val();
    var graphTravPruneEvaluator = $("#graphTravPruneEvaluator").val();
    var graphTravReturnEvaluator = $("#graphTravReturnEvaluator").val();
    var graphTravReturnFilter = $("#graphTravReturnFilter").val();
    var graphTravDepth = parseInt($("#graphTravMaxDepth").val());
    var graphTravRelTypes = $("#graphTravRelTypes").val();
    drawGraphTraversal(startNodeId, graphTravReturnType, graphTravPriority,
        graphTravUnicity, graphTravPruneEvaluator,
        graphTravReturnEvaluator, graphTravReturnFilter, graphTravDepth,
        graphTravRelTypes);

}


/*********************Patterns***************************/
function patternInitLabels() {
    //  initLabels(subGraph,"patternLabelSelect");
    for (var key in dataModel.labels) {
        var value = "(" + key + ")";
        $('#patternLabelSelect').append($('<option/>', {
            value: key,
            text: value
        }));
    }
}
function patternInitRelTypes() {
    var array = dataModel.allRelationsArray;
    for (var i = 0; i < array.length; i++) {
        value = "-[:" + array[i] + "]-";
        $('#patternRelTypeSelect').append($('<option/>', {
            text: value,
            value: array[i]
        }));
    }

}

function onPatternLabelSelect(select) {
    patternRelTypeSelect.options.length = 0;
    var value = $(select).val();
    var key = dataModel.labelsRelations[value];
    key.splice(0, 0, "");
    for (var i = 0; i < key.length; i++) {
        if (i == 0)
            text = "";
        else
            var text = "-[:" + key[i] + "]-";
        $('#patternRelTypeSelect').append($('<option/>', {
            value: key[i],
            text: text
        }));
    }
    patternAdd("(" + value + ")", value)

}

function patternResetLabel(){
    patternPatternSelect.options.length = 0;
    patternRelTypeSelect.options.length = 0;
    patternInitLabels();
}

function onPatternRelTypeSelect(select) {
    var previousValue=$(select).val()
    patternLabelSelect.options.length = 0;
    var value = $(select).val();
    var rel = dataModel.allRelations[value];

    var labels = []

    for (var i = 0; i < rel.length; i++) {
        var label = rel[i].endLabel;
        if (labels.indexOf(label) < 0)
            labels.push(label);
    }


    labels.splice(0, 0, "");
    for (var i = 0; i < labels.length; i++) {
        if (i == 0)
            text = "";
        else
            text = "(" + labels[i] + ")";
        $('#patternLabelSelect').append($('<option/>', {
            value: labels[i],
            text: text
        }));
    }
    patternAdd("-[:" + value + "]-", value)


}

function patternAdd(text, value) {

    $('#patternPatternSelect').append($('<option/>', {
        value: value,
        text: text
    }));
}

function removeFromPatternSelect() {
    var val = $('#patternPatternSelect').val()
    $("#patternPatternSelect option[value='" + val + "']").remove();
}


function executePattern(count) {

    var query = getPatternQuery(count);
    executeQuery(QUERY_TYPE_MATCH, query, function (data) {

        var nodes = [];
        ;

        if (count) {
            $("#patternCount").val(data.length)
        }
        else {


            var regex = /.+\/([0-9]+)/;
            for (var i = 0; i < data.length; i++) {
                var nodes0 = data[i].path.nodes;
                for (var j = 0; j < nodes0.length; j++) {
                    var array = regex.exec(nodes0[j]);
                    var node = parseInt(array[1]);
                    if (nodes.indexOf(node) < 0)
                        nodes.push(node);
                }
            }
            currentActionObj = {
                type: "pattern",
                nodes: nodes
            };

            showWholeGraph(subGraph, currentActionObj);
        }

    });
}

function showWholeGraph(subGraph, currentActionObj) {
    if (!currentActionObj) {
        if (!Gparams.startWithWholeGraphView === true)
            return;
        currentActionObj = {
            type: "pattern",
        };
    }
    var matchAll = "MATCH path=(n)-[r]-(m) where n.subGraph='" + subGraph + "' ";
    matchAll += " return " + returnStr + "  limit " + Gparams.wholeGraphViewMaxNodes;

    console.log(matchAll);
    if (window.parent.executeCypherAndDisplayGraph)
        window.parent.executeCypherAndDisplayGraph(matchAll, currentActionObj);
    else
        executeCypherAndDisplayGraph(matchAll, currentActionObj);

}

function getPatternQuery(count) {
    var match = "MATCH path=";
    var value;
    $("#patternPatternSelect option").each(function () {
        match += $(this).text();
        value += $(this).val();

    })
    if (match.charAt(match.length - 1) == "-")
        match += "()";
    if (false && count)
        match += " return count(path)";
    else
        match += " return path";
    console.log(match);
    return match;
}