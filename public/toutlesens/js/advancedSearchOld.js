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



    self.traversalCurrentInput=null;

    self.setSearchByPropertyListStatement = function (idsList, callback) {
        var ids;

        if (typeof list == "string")
            ids = list.split(",");
        else
            ids = list;
        var query = "n.id in ["
        for (var i = 0; i < names.length; i++) {
            if (i > 0 && i<names.length)
                query += ","
            query +=  names[i];
        }
        query += "] " ;
        toutlesensData.whereFilter=query;
        callback(null, []);

    }



//********************************************************execute*****************************************

  /*  self.executeSearch = function () {
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

    }*/


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
        if(!str)
            return "";
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
  /*  self.executeCypherAndDisplayGraph = function (query, _currentActionObj) {
        toutlesensDialogsController.hideAdvancedSearch();
      //  $("#tabs-analyzePanel").tabs("enable");
        $("#tabs-mainPanel").tabs("enable");
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
            }
            else if(currentActionObj=="searchByNameList"){
                currentDataStructure = "flat";
            }   else{
                currentDataStructure = "tree";
                currentDisplayType = "SIMPLE_FORCE_GRAPH";
            }
            $("#graphForceDistance").val(20);
        }

       // $("#tabs-analyzePanel").tabs("enable");
        toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, query, function (data) {

            data.currentActionObj = currentActionObj;
            toutlesensData.prepareRawData(data, false,currentDisplayType, function (err, data, labels, relations) {
             // if (!applyFilters)
   //                 filters.initGraphFilters(labels, relations);

                toutlesensData.cachedResultArray = data;
                toutlesensController.displayGraph(data, currentDisplayType, null)
            });
        });
    }*/


    /*self.showCypherMatchDialog = function () {
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

    }*/


    /*********************Patterns***************************/
    self.patternInitLabels = function () {
        var labels=Schema.getAllLabelNames()
        common.fillSelectOptionsWithStringArray(patternLabelSelect, labels);

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
            currentActionObj = {
                type: "pattern",
            };

        }else
            currentActionObj.type= "pattern";


        var matchAll = "MATCH path=(n)-[r]-(m) where n.subGraph='" + subGraph + "' ";
        matchAll += " return " + returnStr + "  limit " + Gparams.neoQueryLimit;

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
