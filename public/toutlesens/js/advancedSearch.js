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
 *******************************************************************************/
var advancedSearch = (function () {
    var self = {};
    var types = {0: "pathes", 1: "frequentQuery", 2: "pattern", 3: "cypher"};
    //moved   var currentCypherQueryTextArea = "";
//moved  var currentNodeRole;
//moved  var matchIndex = 0;
//moved  var currentTabIndex = 0;
//moved  var currentActionObj;
//moved  var currentLabel;

//moved  var limit = 300;

//moved  var returnStr = "EXTRACT(rel IN relationships(path) | type(rel))as rels,nodes(path)as nodes, EXTRACT(node IN nodes(path) | ID(node)) AS ids, EXTRACT(node IN nodes(path) | labels(node)) as labels ";// ,
// EXTRACT(rel
// IN
// relationships(path))";

    self.init = function () {

        currentActionObj = {type: types[0], subGraph: subGraph};
        $("#advancedQueriesDiv").tabs(
            {
                active: 0, activate: function (event, ui) {
                currentTabIndex = ui.newTab.index();
                currentActionObj = {type: types[currentTabIndex], subGraph: subGraph};


            }
            });


        advancedSearch.patternInitLabels();
        advancedSearch.patternInitRelTypes();
        statistics.initLabelsCurrentQueries();
        statistics.setCurrentQueriesSelect();


    }
    self.onSourceNodeClick = function () {
        currentActionObj.currentTarget = "graphPathSourceNode";// initialisé dans page html
        currentActionObj.graphPathSourceNode = {};
        self.showLabelSelectionDialog("advancedSearch.setTargetNodeLabel");
    }

    self.onTargetNodeClick = function () {

        currentActionObj.currentTarget = "graphPathTargetNode";// initialisé dans page html
        currentActionObj.graphPathTargetNode = {};
        self.showLabelSelectionDialog("advancedSearch.setTargetNodeLabel");
    }


    self.showSimpleSearchDialog = function () {
        $("#dialog").dialog("option", "title", "valeur d'une propriete");
        toutlesensDialogsController.getAllpropertiesDialogContent("advancedSearch.setSearchNodeReturnFilterVal(true)");
        str += '<button onclick=" advancedSearch.closeDialog()">Cancel</button><br>';
        $("#dialog").html(str);
        $("#dialog").dialog("open");


    }

    self.closeDialog = function () {
        $("#dialog").dialog("close")
    }

    self.showLabelSelectionDialog = function (callback) {

        var str = '<div id="Labeldialog"><table border="0"><tr>' +
            '<td><span id="lang_100">Labels</span></td>' +
            '</tr>' +
            '<tr>' +
            '<td><select id="dialogNodesLabelsSelect" size="15" class="ui-widget-content" ondblclick="' + callback + '(this)"></select></td><td>';
        if (callback) {
            str += '<button onclick="' + callback + '(this)">OK</button>';
        }

        str += '<button onclick=" advancedSearch.closeDialog()">Cancel</button><br>';
        if (currentActionObj.currentTarget != "customQueryMatch") {
            str += '<button onclick="advancedSearch.showSearchPropertyDialog()">add property filter</button><br>';
            str += '<button onclick="advancedSearch.showNodeSelectionDialog()"> select a node</button>';
        }
        str += '</td></tr></table>'

        $("#dialog").html(str);
        toutlesensController.initLabels("dialogNodesLabelsSelect");
        $("#dialog").dialog("open");
        //   $("#dialog").dialog("open").position({my: 'center', at: 'center', of: '#tabs-radarLeft'});
    }


    self.showSearchPropertyDialog = function () {
        var value = $("#dialogNodesLabelsSelect option:selected").val();
        currentActionObj[currentActionObj.currentTarget].label = value;
        $("#dialog").dialog("option", "title", "valeur d'une propriete");
        var str = toutlesensDialogsController.getAllpropertiesDialogContent("advancedSearch.setTargetNodeProperty()");


        str += '<button onclick=" advancedSearch.closeDialog()">Cancel</button><br>';
        str += "<button onclick='advancedSearch.showNodeSelectionDialog()'>Select a node</button>";
        $("#dialog").html(str);
        $("#dialog").dialog("open");
        /*  if (currentActionObj.currentTarget == "graphPathSourceNode")
         $("#getAllpropertiesDialogOkBtn").css("visibility", "hidden");*/


    }


    self.showNodeSelectionDialog = function (value) {

        var value = $("#dialogNodesLabelsSelect option:selected").val();
        if (!value) {
            alert("select a node label before choosing a property")
        }

        currentActionObj[currentActionObj.currentTarget].label = value;
        self.setSearchNodeReturnFilterVal();
        if (value)
            currentActionObj[currentActionObj.currentTarget].property = value;
        var type = "";

        $("#dialog").dialog("option", "title", "Selectionner un Noeud " + type);
        dialogStr = "	<table><tr><td><div id='startNodePageNavigation'></div></td></tr><tr><td ><select size='15' id='wordsSelect'"
            + "onclick='advancedSearch.setNode(this)'><option>----------</option></select></td>";
        dialogStr += '<button onclick=" advancedSearch.closeDialog()">Cancel</button><br>';
        $("#dialog").html(dialogStr);

        toutlesensData.searchNodes(currentActionObj.subGraph, currentActionObj[currentActionObj.currentTarget].label, currentActionObj[currentActionObj.currentTarget].property, "count");// 10000, 0);
        $("#dialog").dialog("open");


    }


    self.setTargetNodeVisibility = function (hide) {
        if (hide || $("#graphPathSourceNode").val() == "")
            $(".targetNode").css("visibility", "hidden");
        else
            $(".targetNode").css("visibility", "visible");
    }

    self.setTargetNodeLabel = function () {

        var value = $("#dialogNodesLabelsSelect option:selected").val();
        self.setTargetNodeVisibility()
        currentActionObj[currentActionObj.currentTarget].label = value;
        //  $("#graphPathTargetNode").val(":" + value);
        $("#" + currentActionObj.currentTarget).val("[" + value + "]");
        $("#dialog").dialog("close");


    }
    self.setTargetNodeProperty = function () {
        self.setSearchNodeReturnFilterVal();
        self.setTargetNodeVisibility()
        currentActionObj[currentActionObj.currentTarget].property = value;
        $("#" + currentActionObj.currentTarget).val(value);
        $("#dialog").dialog("close");


    }
    self.setSearchNodeReturnFilterVal = function (execSearch) {
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
                    toutlesensController.searchNodesUI("count");
                }
                return str;
            }
        }


    }

    self.setNode = function () {
        var index = wordsSelect.selectedIndex;
        var valueText = wordsSelect.options[wordsSelect.selectedIndex].text;
        var valueId = $("#wordsSelect").val();
        self.setTargetNodeVisibility()
        currentActionObj[currentActionObj.currentTarget].nodeId = valueId;
        currentActionObj[currentActionObj.currentTarget].nodeText = valueText;
        $("#dialog").dialog("close");

        $("#" + currentActionObj.currentTarget).val(valueText);


    }


    self.onQueryMatchTextAreaClick = function () {
        currentActionObj.currentTarget = "customQueryMatch";// initialisé dans page html
        currentActionObj.customQueryMatch = {}

    }


    self.setCustomMatchQueryLabel = function (select) {
        var value = $("#dialogNodesLabelsSelect option:selected").val();
        $("#dialog").dialog("close");
        currentActionObj.label = value;

        $("#cypherQueryReturnTextArea").val(returnStr);


        self.getCaretPosition(currentCypherQueryTextArea);
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

                    " <button onclick='advancedSearch.setManualqueryMatch()'>OK</button>";
                $("#dialog").html(dialogStr);
                $("#dialog").dialog("open");

            }

        }

    }

    self.getCaretPosition = function (ctrl) {
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

    self.executeSearch = function () {
        var tabIndex=$("#advancedQueriesDiv").tabs('option', 'active');
        currentActionObj.type=types[tabIndex];




        excludedLabels = [];
        currentActionObj.maxDistance = parseInt($("#graphPathMaxDistance").val());
        if (currentActionObj.type == "pathes") {
            if (currentActionObj.graphPathSourceNode && currentActionObj.graphPathSourceNode.nodeId && currentActionObj.graphPathTargetNode && currentActionObj.graphPathTargetNode.nodeId) {
                self.executePathQuery();
            }
            else {
                self.buildCypherQuery();
            }

        }
        else if (currentActionObj.type == "cypher") {
            self.buildCypherQueryUI();
        }

        else if (currentActionObj.type == "frequentQuery") {
            statistics.executeFrequentQuery();
        }

        else if (currentActionObj.type == "pattern") {
            if (currentActionObj.selection) {
                self.getPatternQuery();
                self.executeCypherAndDisplayGraph(query, currentActionObj);

            } else {

                self.executePatternUI()
            }
        }


    }


    self.executePathQuery = function () {
        var maxDistance = parseInt($("#graphPathMaxDistance").val());
        var algo = "allSimplePaths"// $("#graphPathsAlgorithm").val();
        graphTraversalQueries.getAllSimplePaths(currentActionObj.graphPathSourceNode.nodeId, currentActionObj.graphPathTargetNode.nodeId, maxDistance, algo);

    }


    self.buildCypherQuery = function () {

        var maxDistance = currentActionObj.maxDistance;
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
            self.getWhereProperty(currentActionObj.graphPathSourceNode.property, "n");

        if (currentActionObj.graphPathTargetNode && currentActionObj.graphPathTargetNode.property) {
            if (whereStr.length > 0)
                whereStr += "  and ";
            self.getWhereProperty(currentActionObj.graphPathTargetNode.property, "m");
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
        if (toutlesensData.queryExcludeNodeFilters)
            whereStr += toutlesensData.queryExcludeNodeFilters;


        var query = "Match path=" + matchStr;
        if (whereStr.length > 0)
            query += " WHERE " + whereStr;


        /*  if (groupBy.length > 0)
         query += "groupBy " + groupBy;*/

        query += " RETURN  " + returnStr;

        query += " LIMIT " + limit;
        console.log(query);

        self.executeCypherAndDisplayGraph(query, currentActionObj);
    }


    self.getWhereProperty = function (str, nodeAlias) {
        var property = Gparams.defaultNodeNameProperty;
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
            property = Gparams.defaultNodeNameProperty
            operator = "~";
            value = str;
            // console.log("!!!!invalid query");
            // return "";
        }

        if (operator == "~") {
            operator = "=~"
            // value = "'.*" + value.trim() + ".*'";
            value = "'(?i).*" + value.trim() + ".*'";
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


    self.buildCypherQueryUI = function () {

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
        advancedSearch.executeCypherAndDisplayGraph(query);


    }
    self.executeCypherAndDisplayGraph = function (query, _currentActionObj) {
        toutlesensDialogsController.hideAdvancedSearch();
      //  $("#tabs-radarLeft").tabs("enable");
        $("#tabs-radarRight").tabs("enable");
        currentActionObj = _currentActionObj;


        if (currentActionObj.graphPathTargetNode) {
            if (currentActionObj.selection) {
                currentDataStructure = "flat";
                currentDisplayType = "NODES_SELECTION";
            } else {
                currentDataStructure = "flat";
                currentDisplayType = "SIMPLE_FORCE_GRAPH";
                $("#graphForceDistance").val(20);
            }
        }
        else if (currentActionObj.type == "pattern") {
            if (currentActionObj.selection) {
                currentDataStructure = "flat";
                currentDisplayType = "NODES_SELECTION";
            } else {
                currentDataStructure = "flat";
                currentDisplayType = "SIMPLE_FORCE_GRAPH_BULK";
            }
            toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, query, function (data) {
                toutlesensData.cachedResultArray = data;
                data.patternNodes = currentActionObj.nodes;
                data.currentActionObj = currentActionObj;
                currentDisplayType = "SIMPLE_FORCE_GRAPH_BULK";
                toutlesensData.prepareRawData(data, false, currentDisplayType, function (err, data, labels, relations) {

                    filters.initGraphFilters(labels, relations);
                    toutlesensController.displayGraph(data, currentDisplayType, null)
                })
            });
            return;
        }
        else {
            if (currentActionObj.selection) {
                currentDataStructure = "flat";
                currentDisplayType = "NODES_SELECTION";
            } else {
                currentDataStructure = "tree";
                currentDisplayType = "SIMPLE_FORCE_GRAPH";
            }
            $("#graphForceDistance").val(20);
        }

       // $("#tabs-radarLeft").tabs("enable");
        toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, query, function (data) {

            data.currentActionObj = currentActionObj;
            toutlesensData.prepareRawData(data, false,currentDisplayType, function (err, data, labels, relations) {
             // if (!applyFilters)
                    filters.initGraphFilters(labels, relations);

                toutlesensData.cachedResultArray = data;
                toutlesensController.displayGraph(data, currentDisplayType, null)
            });
        });
    }


    self.showCypherMatchDialog = function () {
        self.getCaretPosition(currentCypherQueryTextArea);
        var str = $("#cypherQueryMatchTextArea").val();


        $("#dialog").dialog("option", "title", "distance de la relation");
        dialogStr = "<input  name='matchMode'type='radio' checked='checked' value='replace' > Remplacer"
            + "<input  name='matchMode'type='radio' value='add' onclick='$(\"#distanceDiv\").css(\"visibility\",\"visible\")'; > Ajouter<br>"
            + "<div style='visibility:hidden;' id='distanceDiv'> <hr>distance entre les noeuds :"
            + "<table><tr><td> Minimum</td><td><input id='matchMinRdistance' size='2' value='1'></td>"
            + "<table><tr><td> Maximum</td><td><input id='matchMaxRdistance' size='2' value='1'></td></tr></table></div>"
            +

            " <button onclick='advancedSearch.setCypherqueryMatch(\"done\")'>OK</button>";
        $("#dialog").html(dialogStr);
        $("#dialog").dialog("open");


    }
    self.setCypherqueryMatch = function (done) {
        $("#dialog").dialog("close");
        var label = $("#dialogNodesLabelsSelect").val();
        if (label && label != "")
            currentLabel = label;

        var str = $("#cypherQueryMatchTextArea").val();
        if (str == "") {
            str = "(n:" + label + ")";
            $("#cypherQueryMatchTextArea").val(str);
        } else if (!done) {
            self.showCypherMatchDialog();
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

    self.searchByNamesList = function (list, callback) {
        var names;
        var subGraphQuery = "";
        if (subGraph)
            subGraphQuery = "and  n.subGraph=\"" + subGraph + "\" ";
        if (typeof list == "string")
            names = list.split(",");
        else
            names = list;
        var query = "MATCH path=(n)-[r]-(m) where n.id in ["
        for (var i = 0; i < names.length; i++) {
            if (i > 0 && i<names.length)
                query += ","
            // query += "\'" + names[i] + "\'"; //FIX by HCE 
			query +=  names[i];
        }



        query += "] " + subGraphQuery + "return " + returnStr;

        self.executeCypherAndDisplayGraph(query, "searchByNameList");
        callback(null, []);

    }
//********************************************************old*****************************************
    self.onPathGraphSelectNodeCallback = function () {
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


    self.onClickCypherQueryMatchTextArea = function (textArea) {

        currentCypherQueryTextArea = textArea;
    }


    self.graphTravOnFilterSelect = function (select) {
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
            toutlesensDialogsController.getAllpropertiesDialogContent("setGraphTravReturnFilterVal('" + returnId + "')");
        }

        else if (type == "RelationType") {
            $("#dialog").dialog("option", "title", "type de  relation");
            toutlesensDialogsController.getAllRelationsDialogContent("setGraphTravReturnFilterVal('graphRelationType')");

        }
        $("#dialog").html(str);
        $("#dialog").dialog("open");


    }

    self.setGraphTravReturnFilterVal = function (type) {
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


    self.onExecuteTraversalQuery = function () {
        var startNodeId = $("#graphTravSourceNodeVal").val();
        var graphTravReturnType = $("#graphTravReturnType").val();
        var graphTravPriority = $("#graphTravPriority").val();
        var graphTravUnicity = $("#graphTravUnicity").val();
        var graphTravPruneEvaluator = $("#graphTravPruneEvaluator").val();
        var graphTravReturnEvaluator = $("#graphTravReturnEvaluator").val();
        var graphTravReturnFilter = $("#graphTravReturnFilter").val();
        var graphTravDepth = parseInt($("#graphTravMaxDepth").val());
        var graphTravRelTypes = $("#graphTravRelTypes").val();
        graphTraversalQueries.drawGraphTraversal(startNodeId, graphTravReturnType, graphTravPriority,
            graphTravUnicity, graphTravPruneEvaluator,
            graphTravReturnEvaluator, graphTravReturnFilter, graphTravDepth,
            graphTravRelTypes);

    }


    /*********************Patterns***************************/
    self.patternInitLabels = function () {
        for (var key in dataModel.labels) {
            var value = "(" + key + ")";
            $('#patternLabelSelect').append($('<option/>', {
                value: key,
                text: value
            }));
        }
    }
    self.patternInitRelTypes = function () {
        var array = dataModel.allRelationsArray;
        for (var i = 0; i < array.length; i++) {
            value = "-[:" + array[i] + "]-";
            $('#patternRelTypeSelect').append($('<option/>', {
                text: value,
                value: array[i]
            }));
        }

    }

    self.onPatternLabelSelect = function (select) {
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
        self.patternAdd("(:" + value + ")", value)

    }

    self.patternResetLabel = function () {
        patternPatternSelect.options.length = 0;
        patternRelTypeSelect.options.length = 0;
        self.patternInitLabels();
    }

    self.onPatternRelTypeSelect = function (select) {
        var previousValue = $(select).val()
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
                text = "(:" + labels[i] + ")";
            $('#patternLabelSelect').append($('<option/>', {
                value: labels[i],
                text: text
            }));
        }
        self.patternAdd("-[:" + value + "]-", value)


    }

    self.patternAdd = function (text, value) {

        $('#patternPatternSelect').append($('<option/>', {
            value: value,
            text: text
        }));
    }

    self.removeFromPatternSelect = function () {
        var val = $('#patternPatternSelect').val()
        $("#patternPatternSelect option[value='" + val + "']").remove();
    }


    self.executePatternUI = function (count) {
        var query = self.getPatternQuery(count);
        toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, query, function (data) {

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

                self.showBulkGraph(subGraph, currentActionObj);
            }

        });
    }

    self.showBulkGraph = function (subGraph) {
        $("#graphBulkButton").addClass("displayIcon-selected");
        if (!currentActionObj) {
            if (!Gparams.startWithBulkGraphView === true)
                return;
        }
        currentActionObj = {
            type: "pattern",
        };


        var matchAll = "MATCH path=(n)-[r]-(m) where n.subGraph='" + subGraph + "' ";
        matchAll += " return " + returnStr + "  limit " + Gparams.wholeGraphViewMaxNodes;

        // console.log(matchAll);

        self.executeCypherAndDisplayGraph(matchAll, currentActionObj);

    }


    self.getPatternQuery = function (count) {
        var match = "";
        var value;
        $("#patternPatternSelect option").each(function () {
            match += $(this).text();
            value += $(this).val();

        })
        if (match.charAt(match.length - 1) == "-")
            match += "()";
        if (match.charAt(0) == "-")
            match = "()" + match;
        match = "MATCH path=" + match;
        if (false && count)
            match += " return count(path)";
        else
            match += " return path";
        console.log(match);
        return match;
    }
    return self;
})()