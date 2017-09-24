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

var toutlesensController = (function () {
    var self = {};

// http://graphaware.com/neo4j/2015/01/16/neo4j-graph-model-design-labels-versus-indexed-properties.html

//moved  var traversalToTree = true;
//moved  var traversalToGraph = false;
//moved  var traversalToSpredsheet = false;
//moved  var d3tree;
//moved  var spreadsheet;

    /*
     * var timeSlider; var initEventTypes;
     */

//moved  var page = 0;
//moved  var size = 100;
//moved  var sep = "\t";
//moved  var MaxNodesInWordsSelect = 20;
//moved  var MaxNodesInPage = 20;
//moved  var currentPageIndex = 0;
//moved  var currentRequestCount = 0;
//moved  var currentGraphPanel = "";
//moved  var currentMode = "read";

// constantes
//moved  var currentGraphRequestType_FROM_NODE = "simple";
//moved  var currentGraphRequestType_PATH = "path";
//moved  var currentGraphRequestType_TRAVERSAL = "traversal";
//moved  var currentGraphRequestType_FILTERED = "filtered";
//moved  var currentGraphRequestType_NODES_ONLY = "nodes_only";

//moved  var currentGraphRequestType = currentGraphRequestType_FROM_NODE;

//moved  var maxSpreadsheetRows = 998;
//moved  var QUERY_TYPE_MATCH = 0;
//moved  var QUERY_TYPE_LABELS = 1;
//moved  var QUERY_TYPE_TRAVERSAL = 2;
//moved  var QUERY_TYPE_GET_ID = 3;

//moved  var rIndices = 1;
//moved  var currentObject;
//moved  var currentObjId;
//moved  var currentLabel;
//moved  var currentRelation;
//moved  var currentMode;
//moved  var currentSourceNode;
//moved  var cachedResultTree;
//moved  var currentHiddenChildren = {};
//moved  var currentRelationActionTargetNode;
//moved  var collapseTargetLabels=[]
//moved  var startSearchNodesTime;
//moved  var nodeTypes = [];
//moved  var oldRightTabIndex = -1;
    /*moved  var popopuPosition = {
     x: 0,
     y: 0
     };*/

//moved  var limitResult = 10000;

//moved  var oldData = [];

//moved  var addToOldData = true;
//moved  var oldTreeRootNode;
//moved  var treeSelectedNode;
//moved  var treeLevel = 1;
//moved  var infoDisplayMode = "PANEL";// "POPUP";
//moved  var currentMousePosition;
//moved  var dontReInitFilterGraph = false;
//moved  var subGraph;
//moved  var queryParams = {};

//moved  var nodeColors = {};
//moved  var linkColors = {};

//moved  var green = "green";
//moved  var blue = "purple";
//moved  var red = "red";

//moved  var labelsPositions = {};
//moved  var initialQuery = "";
//var currentVariables = [];
//moved  var currentVariable = "";
//moved  var currentDisplayType="FLOWER" ;
//moved  var selectedObject = {};
//moved  var subGraph;
//moved  var d3tree;
//moved  var isAdvancedDisplayDialogInitialized = false;
//moved  var isAdvancedSearchDialogInitialized = false;
//moved  var isGanttDialogInitialized = false;

//moved  var popupMenuNodeInfoCache;
//moved  var currentDataStructure;  //tree or flat
//moved  var currentThumbnails = [];


  /*  $(document).ready(function () {
        var queryParams = self.getQueryParams(document.location.search);
        customizeUI.init();
        subGraph = queryParams.subGraph;
        // if (! Gparams.isInframe && !subGraph  && window.parent.toFlareJson)
        if (typeof isSouslesensIframe == 'undefined') // voir html des iframe filles
            subGraph = window.parent.subGraph;

    });*/

    self.getQueryParams = function (qs) {
        qs = qs.split("+").join(" ");
        var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
        while (tokens = re.exec(qs)) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        }
        return params;
    }

    self.initLabels = function (subGraph, selectId) {
        var select = "#nodesLabelsSelect";
        if (selectId)
            select = "#" + selectId;
        self.setLabelsColor();

        for (var i = 0; i < dataModel.allLabels.length; i++) {
            var label = dataModel.allLabels[i];
            $(select).append($('<option>', {
                text: label,
                value: label
            }).css("color", nodeColors[label]));
        }
    }

    self.setLinksColor = function () {
        for (var i = 0; i < dataModel.allRelationsArray.length; i++) {
            if (++i < Gparams.palette.length)
                linkColors[dataModel.allRelationsArray[i]] = Gparams.palette[i];
            else
                linkColors[dataModel.allRelationsArray[i]] = "gray";
        }
    }
    self.setLabelsColor = function () {
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

    self.doLoadRelationshipTypes = function (labels) {
        for (var i = 0; i < labels.length; i++) {
            var str = labels[i];
            $("#linksLabelsSelect").append($('<option>', {
                text: str,
                value: str
            }));
        }
    }

    self.onNodesLabelsSelect = function (select) {

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
    self.onLabelSelect = function (labelSelect) {
        startSearchNodesTime = new Date() - 1000;
        var mode = $("#representationSelect").val();
        // var mode = $("#outputModeHome:checked").val();
        if (mode == "CHRONOCHART") {
            chronology.drawChronoChart();
        } else {
            currentPage = 0;
            self.searchNodesUI("count");
        }
    }

    self.onMatchGo = function () {
        toutlesensData.executeQuery(QUERY_TYPE_MATCH, $("#queryTA").val(), null)
    }

    self.onTraversalGo = function (json) {
        return executeQue.ry(QUERY_TYPE_GET_ID, json, set)
    }

    self.setQueryId = function (node) {
        var query = initialQuery;
        if (node) {
            currentVariable = node.label;

            var p = labelsPositions[node.label];
            query = query.substring(0, p) + "{id:" + node.id + "}"
                + query.substring(p);
        }
        $("#queryTA").val(query);
        toutlesensData.executeQuery(QUERY_TYPE_MATCH, query, toGraph);
    }

// function nodesLabelsSelect" size="7" onchange="onNodesLabelsSelect()">

    self.cleanTabDivs = function () {
        // $("#spreadSheetDiv").html("");
        $("#graphDiv").html("");
        $("#resultX").html("");
    }

    self.toCsv = function (neoResult) {
        var str = JSON.stringify(neoResult);
        $("#resultX").html(str);

    }

    self.completeResult = function (neoResult) {
        var data = neoResult[0].data;
        for (var i = 0; i < data.length; i++) {
            var row = data[i].row;
            if (row.length < 6)
                return;
            for (var j = 0; j < 3; j++) {

                row[j].id = row[j + 5];
                if (!row[j].name)
                    row[j].name = row[j][Gparams.defaultnodeNameField];

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
    self.recursiveBuildTree = function (relations, parentNode) {

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
                    self.recursiveBuildTree(relations, childNode);
                }

            }

        }

    }

    self.flattenRelations = function (relations) {
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



    self.storeQuery = function () {
        if (typeof (Storage) !== "undefined") {
            var name = prompt("request name");
            if (!name || name.length == 0)
                return;
            var query = str = $("#queryTA").val();
            localStorage.setItem(name, query);
            self.loadStoredQueriesNames();

        } else {
            self.setMessage("Sorry! No Web Storage support..", red);

        }
    }

    self.loadStoredQueriesNames = function () {
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
            self.setMessage("Sorry! No Web Storage support..", red);

        }

    }

    self.loadQuery = function (select) {
        var qName = $(select).val();
        var query = localStorage.getItem(qName);
        $("#queryTA").val(query);
    }

    self.deleteQuery = function () {
        if (confirm("Are you sure ?")) {
            var qName = $("#storedQueries").val();
            var query = localStorage.removeItem(qName);
            $("#queryTA").val(query);
        }
    }

    self.exportQueries = function () {
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
            self.setMessage("Sorry! No Web Storage support..", red);

        }

    }

    self.importQueries = function () {
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
            self.loadStoredQueriesNames();

        } else {
            self.setMessage("Sorry! No Web Storage support..", red);

        }

    }

    function setMessage(str, color) {
        if (color)
            $("#message").css("color", color);

        $("#message").html(str);
    }

    self.selectTab = function (index) {
        $('#ressourcesTab').tabs({
            active: index
        });
    }

    self.clearQuery = function () {
        $("#queryTA").val("");
    }


    self.searchNodesUI = function (resultType, limit, from, callback) {
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
        toutlesensData.searchNodes(subGraph, label, word, resultType, limit, from, callback);
    }


    self.initResultPagination = function (count) {

        currentRequestCount = count;
        if (count > MaxNodesInWordsSelect) {
            currentPageIndex = 0;
            var from = currentPageIndex * MaxNodesInPage;
            toutlesensData.searchNodes(currentQueryParams.subGraph, currentQueryParams.label, currentQueryParams.word, "displayStartNodesPage", MaxNodesInPage, from);
            /* searchNodesUI("displayStartNodesPage",
             MaxNodesInPage, from);*/

        } else
            toutlesensData.searchNodes(currentQueryParams.subGraph, currentQueryParams.label, currentQueryParams.word, "displayStartNodesPage", MaxNodesInPage, from);
        /*   searchNodesUI("displayStartNodesPage",
         MaxNodesInPage, from);*/
        // fillWordsSelect(data.results);

    }

    self.extractNodesList = function (data) {

        var nodes = {};
        var links = [];
        var index = 0;
        // setMessage(data.length + " resultats", green);
        var outData = [];
        for (var i = 0; i < data.length; i++) {
            var label = data[i].n.labels[0];
            var obj = {
                name: data[i].n.properties[Gparams.defaultnodeNameField] + " [" + label + "]",
                id: data[i].n._id,
                label: label,
                color: nodeColors[label]
            }
            outData.push(obj);
        }
        return outData;
    }

    self.fillLabelsPage = function (neoResult) {
        var nodes = self.extractNodesList(neoResult);
        self.fillSelectOptions(wordsSelect, nodes, "name", "id");
        var str = "<table><tr><td><span id='lang_156'></span> </td><td>"
            + currentRequestCount
            + "&nbsp;<button onclick='toutlesensController.listNodesAndAttrs()'><span id='lang_157'>liste</span></button>"
        if (currentPageIndex > 0)
            str += "<button onclick=' toutlesensController.goToPreviousPage()'>&lt;</button>&nbsp;"
        if (nodes.length < currentRequestCount)
            str += "<button onclick=' toutlesensController.goToNextPage()'>&gt;</button>&nbsp;"
        str += "</td></tr></table>";
        +"</td>";//</tr>";
        //   str += "<tr><td> </td><td>&nbsp;&nbsp;"


        // str += "<a class='pageNav' href='javascript: goToPreviousPage()'>
        // page precedente</a>&nbsp;"
        // str += "<a class='pageNav' href='javascript: goToNextPage()'> page
        // suivante</a>"
        $("#startNodePageNavigation").html(str);

    }
    self.goToNextPage = function () {
        currentPageIndex++;
        var from = currentPageIndex * MaxNodesInPage;
        toutlesensData.searchNodes(currentQueryParams.subGraph, currentQueryParams.label, currentQueryParams.word, "displayStartNodesPage", MaxNodesInPage, from);
        //  searchNodesUI("displayStartNodesPage", MaxNodesInPage, from);
    }
    self.goToPreviousPage = function () {
        currentPageIndex--;
        var from = currentPageIndex * MaxNodesInPage;
        toutlesensData.searchNodes(currentQueryParams.subGraph, currentQueryParams.label, currentQueryParams.word, "displayStartNodesPage", MaxNodesInPage, from);
        //  searchNodesUI("displayStartNodesPage", MaxNodesInPage, from);
    }

    self.fillWordsSelect = function (neoResult) {
        var nodes = self.extractNodesList(neoResult);
        wordsSelect.options.length = 0;
        self.fillSelectOptions(wordsSelect, nodes, "name", "id");
    }

    self.fillSelectOptions = function (select, data, textfield, valueField) {
        select.options.length = 0;
        if (!textfield || !valueField) {
            common.fillSelectOptionsWithStringArray(select, data);
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

    self.onWordSelect = function (draw) {
        if (currentDisplayType == "SIMPLE_FORCE_GRAPH_BULK")
            currentDisplayType = "FLOWER";
        var text = wordsSelect.options[wordsSelect.selectedIndex].text;

        currentLabel = text.substring(text.indexOf("[") + 1, text.indexOf("]"));
        currentNodeName = text.substring(0, text.indexOf("]") - 1);
        currentObjId = $("#wordsSelect").val();
        currentObject = {
            id: currentObjId,
            name: currentNodeName,
            label: currentLabel
        }
        currentSourceNode = currentObject;

        if (currentDisplayType != "SIMPLE_UI") {
            $("#tabs-radarLeft").tabs("enable");
            $("#tabs-radarRight").tabs("enable");
            $("#currentNodeSpan").html("Noeud central : " + text);

            if (Gparams.modifyMode == 'onList' && currentMode == "write") {
                var index = $('#tabs-radarRight a[href="#modifyTab"]').parent().index();
                $("#tabs-radarRight").tabs("option", "active", index);

                self.dispatchAction("modifyNode");
                return;
            }


            //selectLeftTab("#graphQueryFiltersTab");

            $("#graphPathSourceNode").html(text);
            $("#graphTravSourceNode").html(text);
        }
        self.getGraphDataAroundNode(currentObjId, toutlesensController.drawGraph);

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

    self.getGraphDataAroundNode = function (id, callbackFunction) {
        self.hidePopupMenu();
        // isAdvancedDisplayDialogInitialized=false;
        if (!id)
            id = currentObjId;
        else
            currentObjId = id;

        // var mode = $("#outputModeHome:checked").val();
        //var mode = $("#representationSelect").val();

        var mode = currentDisplayType
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

        if (mode == "SIMPLE_UI") {
            toutlesensData.getNodeAllRelations(id, mode);
            return;
        }
        if (mode == "FORCE_COLLAPSE") {
            toutlesensData.getNodeAllRelations(id, mode);
            return;
        }
        if (mode == "SIMPLE_FORCE_GRAPH") {
            toutlesensData.getNodeAllRelations(id, mode);
            return;
        }
        if (mode == "SIMPLE_FORCE_GRAPH_BULK") {
            toutlesensData.getNodeAllRelations(id, mode);
            return;
        }
        if (mode == "TREE") {
            toutlesensData.getNodeAllRelations(id, mode);
            return;
        }
        if (mode == "MANUAL") {
            toutlesensData.getNodeAllRelations(id, mode);
            return;
        }
        if (mode == "FLOWER") {
            toutlesensData.getNodeAllRelations(id, mode);
            return;
        }

        else if (mode == "TREEMAP") {
            toutlesensData.getNodeAllRelations(id, mode);
        }
        else if (mode == "listTree") {
            if (currentDataStructure == "tree") {
                if (cachedResultTree)
                    textOutputs.listTreeResultToHtml(cachedResultTree, Gparams.htmlOutputWithAttrs)
                else
                    toutlesensData.getNodeAllRelations(id, mode);
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

    self.addToBreadcrumb = function (obj) {
        var name = obj.label;
        if (obj.label)
            name = obj.name;
        if (obj.name)
            name = obj[Gparams.defaultnodeNameField];
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

        self.getGraphDataAroundNode(node.id, self.showInfosCallback);

    }
    self.showInfosById = function (id) {

        self.getGraphDataAroundNode(id, self.showInfosCallback);
    }

    self.showInfosCallback = function (data) {


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

        var str = textOutputs.formatNodeInfo(obj);
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

    self.drawList = function (result) {
        self.showInfosCallback(result);
        var data = result[0].data;
        if (data.length == 0) {
            self.getGraphDataAroundNode(currentObjId, drawList, true);
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

    self.drawTree = function (neoResult) {
        $("#spreadSheetDiv").css("visibility", "hidden");
        self.showInfosCallback(neoResult);
        var nameLength = 30;
        var data = neoResult[0].data;
        var variables = neoResult[0].columns;

        if (variables.length < 2)
            return;

        var nodes = {};
        self.setMessage(data.length + " rows retrieved", green);
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
            self.findNodeInTree(id, oldTreeRootNode);
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
                    self.findNodeInTree(newId, oldTreeRootNode);
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

    self.drawTreeGroupByLabels = function (neoResult) {
        $("#spreadSheetDiv").css("visibility", "hidden");
        self.showInfosCallback(neoResult);
        var nameLength = 30;
        var data = neoResult[0].data;
        var variables = neoResult[0].columns;

        if (variables.length < 2)
            return;

        var nodes = {};
        self.setMessage(data.length + " rows retrieved", green);
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
            self.findNodeInTree(id, oldTreeRootNode);
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
                    self.findNodeInTree(newId, oldTreeRootNode);
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
            d3tree = new d3treeGraph($("#graphDiv"));
        d3tree.drawTree(root);
    }
    self.drawGraph = function (neoResult) {
        $("#spreadSheetDiv").css("visibility", "hidden");
        self.showInfosCallback(neoResult);
        var nodes = {};
        var links = [];
        var index = 0;

        var xxx = neoResult[0];
        var data = neoResult[0].data;
        var variables = neoResult[0].columns;

        if (variables.length < 2) {
            self.setMessage("Graph needs at least 2 node types", "red");
            return;
        }

        self.setMessage(data.length + " resultats", green);

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

    self.findNodeInTree = function (id, node) {
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
                self.findNodeInTree(id, child);
                if (found)
                    return found;
            }

        }
        return null;
    }

    self.removeDoublonNodes = function (root2, distinctParentNodes) {
        var toRemove = [];
        for (var i = 0; i < distinctParentNodes.length; i++) {
            var node = distinctParentNode[i];
            if (node._id == root2.id)
                toRemove.push(node);
        }

    }

    self.drawSpreadsheet = function (neoResult) {
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
                self.setMessage("more than " + maxSpreadsheetRows + " rows")
                break;
            }

        }

        for (var key in rows[0]) {
            spreadsheetHeaders.push(key);
        }

        if (rows.length <= maxSpreadsheetRows) {
            self.setMessage(rows.length + " rows retrieved", green)

            spreadsheet = new Spreadsheet("spreadSheetDiv");
            spreadsheet.headers = spreadsheetHeaders;
            spreadsheet.onCellClickCallBack = upDateGraphFromSpreadsheet;
            spreadsheet.load(rows);
        } else {
            $("#popupTextarea").text("aaaaa");
            $("#popupTextarea").style.visibility = "visible";
        }

    }

    self.selectLeftTab = function (tabId) {

        var index = $('#tabs-radarLeft a[href="' + tabId + '"]').parent().index();
        $("#tabs-radarLeft").tabs("option", "active", index);

    }

    self.onRadarLeftActivate = function (index) {
        if (currentGraphRequestType != currentGraphRequestType_FILTERED)
            $("#accordionRepresentation").accordion({active: 0});
        if (index == 1) {
            if (false && exploredTree && exploredTree != null)

                self.displayGraph(exploredTree, "CSV");
            else

                return;
        }
        if (index == 2) {
            self.dispatchAction("nodeInfos");
        }

    }

    self.onRadarRightActivate = function (index) {

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

    self.dispatchAction = function (action, objectId, targetObjectId) {

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


        if (action == "addNodeToGraph") {
            /*  var numberOfLevelsVal = $("#depth").val();
             numberOfLevelsVal = parseInt(numberOfLevelsVal)+2;
             graphQueryUnionStatement="MATCH path=(node1)-[r*.."+numberOfLevelsVal + "]-(m) where ID(node1)="+currentObject.id+" and  ID(m)="+targetObjectId+" and node1.subGraph='"+subGraph+"'";
             //initGraphFilters(currentObject.label);*/
            toutlesensData.getNodeAllRelations(targetObjectId, mode, true);
        }

        if (action == "nodeInfosPopup") {
            $("#externalInfoPanel").html("");
            $("#externalSourceSelect").val(null);
            if (id) {
                toutlesensData.showInfos2(id, function (obj) {
                    var str = "<input type='image' src='images/back.png' height='15px' alt='back' onclick='toutlesensController.restorePopupMenuNodeInfo()' ><br>"
                    str += textOutputs.formatNodeInfo(obj[0].n.properties);
                    str += "<br>" + customizeUI.customInfo(obj);
                    popupMenuNodeInfoCache = $("#popupMenuNodeInfo").html();
                    $("#popupMenuNodeInfo").html(str);
                });

            }
            return;
        }

        self.hidePopupMenu();
        $("#ModifyNodeActionDiv").html("");
        $("#ModifyNodeActionDiv").css("visibility", "hidden");
        $("#linkActionDiv").css("visibility", "hidden");
        var mode = $("#representationSelect").val();

        if (action == "nodeInfos") {
            $("#externalInfoPanel").html("");
            $("#externalSourceSelect").val(null);
            if (id) {
                toutlesensData.showInfos2(id, self.showInfosCallback);
                self.selectLeftTab('#attrsTab');
            }
        }

        if (action == 'relationInfos') {
            textOutputs.getRelationAttrsInfo()

            self.selectLeftTab('#attrsTab');
            $("#infoPanel").html(str);
        }


        if (action == "unfoldNode") {

            toutlesensData.getNodeAllRelations(currentObject.id, mode, true);
        } else if (action == "setAsRootNode") {
            self.initGraphFilters(currentObject.label);
            toutlesensData.getNodeAllRelations(currentObject.id, mode);
        } else if (action == "foldNode") {
            var output = $("#representationSelect").val();

            toutlesensData.removeChildrenFromTree(exploredTree, currentObject.myId);
            self.displayGraph(exploredTree, output);
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
            $("#tabs-radarRight").tabs("option", "active", 3);
            $("#accordionModifyPanel").accordion("option", "active", 1);
            currentRelationData.targetNode = targetNode;
            modifyData.setLinkTypes();
        } else if (action == "modifyNode") {
            $("#ModifyNodeActionDiv").css("visibility", "visible");
            $("#accordionModifyPanel").accordion("option", "active", 0);
            // var index = $('#tabs-radarRight
            // a[href="li_modify"]').parent().index();
            $("#tabs-radarRight").tabs("option", "active", 3);
            if (id) {
                var query = "MATCH (n) WHERE ID(n) =" + id + " RETURN n";//,'m','r',labels(n),'x',ID(n) ";// limit 1 ";

                toutlesensData.executeQuery(QUERY_TYPE_MATCH, query, function (data) {
                    if (data.length == 0)
                        return;
                    var obj = data[0].n.properties;
                    obj.id = data[0].n._id;
                    obj.label = data[0].n.labels[0];
                    modifyData.drawFieldInputs(obj);
                    $("#accordionModifyPanel").accordion({active: 1});
                    $("#accordionModifyPanel").accordion({active: 0});
                    //$( "#accordionModifyPanel" ).accordion( "option", "animate", 200 );

                });
            }

        } else if (action == "newNode") {
            $("#ModifyNodeActionDiv").css("visibility", "visible");
            $("#accordionModifyPanel").accordion("option", "active", 0);
            // var index = $('#tabs-radarRight
            // a[href="li_modify"]').parent().index();
            $("#tabs-radarRight").tabs("option", "active", 3);
            modifyData.onCreateNodeButton();
        } else if (action == "switchNodesVisibilityFromLabel") {
            var action2 = "";
            if (currentObject.children && currentObject.children.length > 0)
                action2 = "closeNodesFromLabel";
            else
                action2 = "openNodesFromLabel";
            self.dispatchAction(action2);

        } else if (action == "closeNodesFromLabel") {
            myFlower.hideNodesWithLabel(currentObject.name);

        } else if (action == "openNodesFromLabel") {
            myFlower.showNodesWithLabel(currentObject.name);

        } else if (action == "listNodesFromLabel") {

        } else if (action == "drawGraphFromLabel") {

        }
    }

    self.setMessage = function (message, color) {
        $("#message").html(message);
        if (color)
            $("#message").css("color", color);
    }

    self.loadExternalData = function (select) {
        $("#externalInfoPanel").html("");
        // if(!currentObject)
        // return;
        var str = "";
        var source = $(select).val();
        var externalUri = currentObject["uri_" + source];
        if (externalUri) {
            externalRessourcesCommon.showExternalResourceDetails(externalUri);
        } else {
            externalRessourcesCommon.listExternalItems(source, currentObject, externalInfoPanel);
        }

    }

    self.associateExternalResourceToNode = function () {
        var source = $("#externalSourceSelect").val();
        var prop = {};
        prop["uri_" + source] = currentExternalUri;
        modifyData.updateProperties(currentObject, prop);

    }

    self.zeroRelationsForNodeAction = function (data) {


        d3.select("#graphDiv").selectAll("svg").remove();
        d3.select("#graphDiv").html("<b>this node has no relations so no graph can be displayed</b>");
        return;


        if (data.length == 0) {

            return;
        }


        currentObject = data[0].n.properties;
        currentObject.id = data[0].n._id;
        currentObject.label = data[0].n.labels[0];
        if (!currentObject.name)
            currentObject.name = currentObject[Gparams.defaultnodeNameField]


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
        self.dispatchAction('nodeInfos');
        // }

    }


    self.changeLinkType = function (linkObj) {// afinir
        var newRelType = prompt(" entrez le nouveau type de relation ")
        var query = "MATCH (n:User)-[r:" + linkObj.target.relType
            + "]-(m) where id(mn)=" + linkObj.source.id + "+ and id(m)="
            + linkObj.target.id + ") CREATE (n)-[r2:" + newRelType
            + "]->(m) SET r2 = r WITH r DELETE r";

    }

    self.initGraphFilters = function (labels) {
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
        var onclick = " onclick='toutlesensController.startQueryFilterMode() '"
        onclick = "onclick='toutlesensController.onFilterCbxClik();'";
        var noChecked = "";
        str += "<table>"

        // str += "<tr class='italicSpecial'><td ><span
        // class='bigger'>Noeuds</span></td><td>Inclure</td><td>Exclure</td></tr>";
        str += "<tr align='center' class='italicSpecial'><td ><span class='bigger'>Noeuds</span></td><td>Inclure<br><input type='checkbox' id='#comuteAllFiltersNodesInclude' onchange='toutlesensController.comuteAllFilters(this)'></td><td>Exclure<br><input type='checkbox' id='#comuteAllFiltersNodesExclude' onchange='toutlesensController.comuteAllFilters(this)'></td></tr>";
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
        str += "<tr align='center'  class='italicSpecial'><td ><span class='bigger'>Relations</span></td><td>Inclure<br><input type='checkbox' id='#comuteAllFiltersRelationsInclude' onchange='toutlesensController.comuteAllFilters(this)'></td><td>Exclure<br><input type='checkbox' id='#comuteAllFiltersRelationsExclude' onchange='toutlesensController.comuteAllFilters(this)'></td></tr>";

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

    self.comuteAllFilters = function (caller) {
        var str = $(caller).attr("id");
        var status = $(caller).prop("checked");

        self.comuteAll = function (cbxs, mode) {
            var relCbxes = $("[name=" + cbxs + "]");
            for (var i = 0; i < relCbxes.length; i++) {
                $(relCbxes[i]).prop("checked", mode);
            }

        }

        if (str == "#comuteAllFiltersRelationsInclude")
            self.comuteAll("graphRelationsFilterCbx", status);
        if (str == "#comuteAllFiltersRelationsExclude")
            self.comuteAll("graphRelationsFilterExcludeCbx", status);
        if (str == "#comuteAllFiltersNodesInclude")
            self.comuteAll("graphNodesFilterCbx", status);
        if (str == "#comuteAllFiltersNodesExclude")
            self.comuteAll("graphNodesFilterExcludeCbx", status);

    }

    self.drawFilteredGraph = function () {

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

        self.getGraphDataAroundNode();

    }

    self.drawNodesList = function () {

        self.searchNodesUI("count");
    }
    self.drawGraphGeneral = function (useCache) {

        // $("#tabs-radarRight").tabs("option", "active", 0);
        self.hidePopupMenu();

        Gparams.showRelationNames = $("#showRelationTypesCbx").prop("checked");

        /*if (currentGraphRequestType != currentGraphRequestType_FILTERED) {
         dontReInitFilterGraph = false;
         }*/

        if (currentGraphRequestType == currentGraphRequestType_FROM_NODE) {
            if (!currentObject) {

                if (cachedResultArray && cachedResultArray.length > 0) {
                    currentObject = cachedResultArray[0].nodes[0];
                    self.getGraphDataAroundNode(currentObject._id);
                    return;
                } else
                    return;
                // alert("il est nécessaire de choisir un noeud source ou de passer en mode recherche avancee")
                //  return;
            }
            self.getGraphDataAroundNode(useCache);

        } else if (currentGraphRequestType == currentGraphRequestType_FILTERED) {
            self.drawFilteredGraph();

        } else if (currentGraphRequestType == currentGraphRequestType_PATH) {
            if ($("#graphPathTargetNode").html() == "") {
                alert("il est nécessaire de choisir un noeud cible ")
                return;
            }
            // $("#representationSelect").val("TREE");
            drawGraphPath();
        }

        else if (currentGraphRequestType == currentGraphRequestType_TRAVERSAL) {
            graphTraversalQueries.drawGraphTraversal();
        }

        else if (currentGraphRequestType == currentGraphRequestType_NODES_ONLY) {
            var label = $("#nodesLabelsSelect").val();
            var word = $("#word").val();
            self.searchNodesUI("nodeListHTML");

        }

    }
    self.displayGraph = function (json, output, labels) {
        d3NodesSelection = [];
        $("#textDiv").html("");
        $("#tabs-radarRight").tabs("option", "active", 0);

        if (!json) {
            if (output == "SIMPLE_FORCE_GRAPH" || output == "SIMPLE_FORCE_GRAPH_BULK")
                json = cachedResultArray;
            else
                json = cachedResultTree;
        }
        help.setGraphActionsHelp();
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

        if (output == "NODES_SELECTION") {
            selection.setSelectionFromQuery(json);
            return;
        }
        else if (output == "FLOWER") {
            var jsonFlower = json;
            if ($("#groupByLabelsCbx").prop("checked"))
                toutlesensData.jsonToHierarchyTree(json, "label");
            d3flower.drawFlower(jsonFlower, distance, currentGraphCharge);

        }

        else if (output == "MANUAL") {
            d3modifiableGraph.drawModifiableGraph(json)

        } else if (output == "TREE") {
            var jsonTree = json;

            /*   if (!d3tree)
             d3tree = new d3treeGraph($("#graphDiv"));
             d3tree.drawTree(jsonTree, distance);
             setTimeout(function () {
             d3tree.setInitialDisplayPosition()
             },1000);*/

            d3tree.drawTree(jsonTree);

            /*    d3tree.drawTree(jsonTree, distance);
             d3tree.setInitialDisplayPosition();*/

        } else if (output == "FORCE_COLLAPSE") {
            d3forceCollapseClass.drawForceCollapse(json, null, null, distance, currentGraphCharge);
        }
        else if (output == "TREEMAP") {
            var jsonTreeMap = json;
            if (!json.valueField)
                toutlesensData.jsonToHierarchyTree(json, "label");
            // setValues(jsonTreeMap)
            d3treemap.draw(jsonTreeMap);
            //  drawTreeMap2(jsonTreeMap);
            // drawTreeMap(jsonTest);

        } else if (output == "SIMPLE_FORCE_GRAPH") {
            var forceJson = json;
            if (!json || json.children && json.children.length > 0)// maladroit à revoir dans flower
                forceJson = cachedResultArray;
            d3simpleForce.drawsimpleForce(forceJson);
            d3simpleForce.drawsimpleForce(forceJson);
            // visjsGraph.draw("graphDiv",forceJson);
        }
        else if (output == "SIMPLE_FORCE_GRAPH_BULK") {
            var forceJson = cachedResultArray;
            //  if (!json || json.children && json.children.length > 0){// maladroit à revoir dans flower
            // convert json nodes in ids array and pass it to showBulkGraph
            var nodeIds = [];
            if (forceJson.patternNodes) {// from patterns screen
                d3simpleForceBulk.initSimpleForceBulk(forceJson);
            }
            else {
                for (var i = 0; i < forceJson.length; i++) {
                    var aNode = forceJson[i];
                    for (var j = 0; j < aNode.ids.length; j++) {
                        if (nodeIds.indexOf(aNode.ids[j]) < 0)
                            nodeIds.push(aNode.ids[j]);
                    }
                }


                var matchAll = "MATCH path=(n)-[r]-(m) where n.subGraph='" + subGraph + "' ";
                matchAll += " return " + returnStr + "  limit " + Gparams.wholeGraphViewMaxNodes;
                toutlesensData.executeQuery(QUERY_TYPE_MATCH, matchAll, function (data) {
                    data.patternNodes = nodeIds;
                    d3simpleForceBulk.initSimpleForceBulk(data);
                });
            }
            //   executePatternUI();
            //   initSimpleForceBulk(forceJson);
            //   currentDisplayType="FLOWER";

        }


        if (labels)
            self.initGraphFilters(labels);
        d3legend.drawLegend();//"graphDiv");
        var scrollLeft = ($("#graphDiv").parent().width() / 2) + 100;
        var scrollTop = ($("#graphDiv").parent().height() / 2);
        // d3tree.centerNode(100, 100, .9);
        // $("#graphDiv").scrollLeft(scrollLeft);
        // $("#graphDiv").scrollTop(200);
    }


    self.onVisButton = function (value, input) {


        if (input) {
            $(".displayIcon").removeClass("displayIcon-selected");
            $(input).addClass("displayIcon-selected");
        }


        $("#representationSelect").val(value);
        currentDisplayType = value;
        if (currentDisplayType == "FORM") {
            $("#tabs-radarRight").tabs("enable", 2);
            $("#tabs-radarRight").tabs("option", "active", 2);
            if(infoGenericDisplay && infoGenericDisplay.selectedNodeData && !infoGenericDisplay.isAddingRelation){
                infoGenericDisplay.showNodeData(infoGenericDisplay.selectedNodeData.jtreeId);
            }



        }
        else if (currentDisplayType == "CARDS") {

            $("#tabs-radarRight").tabs("option", "active", 0);
            var label=$("#nodesLabelsSelect").val();
            var id=currentObjectId;

            if(label || id)

            var legendWidth=$("#graphLegendDiv").width();
            $("#graphLegendDiv").width(1);
            $("#graphDiv").width( $("#graphDiv").width()+legendWidth);
            $("#graphDiv").css("overflow","auto")
            $("#graphDiv").html("");
            $("#graphDiv").html("<div id=backgroundDiv></div>");
            cards.init();
            cards.drawCards(label,id,"cards");
            return;



        }

        else {
            self.drawGraphGeneral();
        }

    }

    self.onTextVisButton = function (mode) {
        var treeJon;
        if (mode == "HTML") {

            if (!cachedResultArray && !cachedResultTree)
                treeJon = toutlesensData.getNodeAllRelations(id, mode);
            if (currentDataStructure == "flat") {
                treeJon = toutlesensData.flatResultToTree(cachedResultArray);
                textOutputs.listTreeResultToHtml(treeJon, Gparams.htmlOutputWithAttrs)
            }
            else if (currentDataStructure == "tree") {
                if (cachedResultTree)
                    textOutputs.listTreeResultToHtml(cachedResultTree, Gparams.htmlOutputWithAttrs)
            }
        }
        else if (mode == "CSV") {
            if (!cachedResultArray)
                cachedResultArray = toutlesensData.getNodeAllRelations(id, mode);
            if (currentDataStructure == "flat") {
                treeJon = toutlesensData.flatResultToTree(cachedResultArray);
                textOutputs.drawCSV(treeJon, Gparams.htmlOutputWithAttrs)
            } else if (currentDataStructure == "tree") {
                if (cachedResultTree)
                    textOutputs.drawCSV(cachedResultTree, Gparams.htmlOutputWithAttrs)
                else
                    toutlesensData.getNodeAllRelations(id, mode);
            }
            return;


        }

    }

    self.switchModifyMode = function (cbx) {

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

    self.showPopupMenu = function (x, y, type) {
        var popup = "popupMenuNodeInfoDiv";
        "popupMenuRead";

        if (type && type == "label") {
            popup = "popupMenuLabel";
        }
        else if (type && type == "nodeInfo") {
            toutlesensDialogsController.setPopupMenuNodeInfoContent();
            popup = "popupMenuNodeInfoDiv";
            $("#popupMenuNodeInfoDiv").show();
        }

        /* else if (currentMode == "write")
         popup = "popupMenuWrite";*/


        $("#" + popup).css("visibility", "visible").css("top", y).css("left", x);

    }
    self.hidePopupMenu = function () {
        $("#popupMenuRead").css("visibility", "hidden");
        $("#popupMenuWrite").css("visibility", "hidden");
        $("#popupMenuLabel").css("visibility", "hidden");
        $("#popupMenuNodeInfoDiv").css("visibility", "hidden");

    }
    self.getSVG = function () {
        var xxx = $("#graphDiv").html();
        console.log(xxx);
    }

    self.listNodesAndAttrs = function () {

        currentGraphRequestType = currentGraphRequestType_NODES_ONLY;
        self.drawGraphGeneral();
    }

    self.execNeoQuery = function () {
        var query = $("#neoQueriesTextArea").val();
        toutlesensData.executeQuery(QUERY_TYPE_MATCH, query, displayGraph);
    }


    self.onFilterCbxClik = function () {
        self.drawGraphGeneral();
    }

    self.showGraphForNodesCollection = function () {
        $("#representationSelect").val("SIMPLE_FORCE_GRAPH");
        self.drawGraphGeneral();
    }

    self.backToNonFilteredGraph = function () {
        isInPathGraphAction = false;
        currentGraphRequestType = currentGraphRequestType_FROM_NODE;
        self.drawGraphGeneral();
        $("#accordionRepresentation").accordion({
            active: 0
        });
    }

    self.showGantt = function () {
        drawGant(null, "photo", "timestamp", null, 10);
    }

    self.onLinkClick = function (id) {

        toutlesensData.showInfos2(id, function (d) {
            currentObject = d[0].n.properties;
            currentObject.id = d[0].n._id;
            currentObject.label = d[0].n.labels[0];
            if (currentObject.path)
                self.showImage(Gparams.imagesRootPath + decodePath(currentObject.path));
            self.dispatchAction('nodeInfos');
            // $("#tabs-radarRight").tabs("option", "active", 2);
            toutlesensData.getNodeAllRelations(id, null, false, function (json, labels) {

                textOutputs.listTreeResultToHtml(cachedResultTree, Gparams.htmlOutputWithAttrs)
            });

            /*  getGraphDataAroundNode(id, false);
             currentDataStructure = "tree";
             onTextVisButton('HTML');*/
        });

    }
    self.showImage = function (url) {
        // $("#nodeDetailsDiv").prop("src", url);
        var w = $("#nodeDetailsDiv").width();
        $("#nodeDetailsDiv").html('<img id="largeImage" src="' + url + '" border="0" height="real_height" width="real_width" onload="resizeImg(this, null, ' + w + ');">')
        $("#tabs-radarRight").tabs("enable", 2);
        $("#tabs-radarRight").tabs("option", "active", 2);
    }
    self.restorePopupMenuNodeInfo = function () {
        $("#popupMenuNodeInfo").html(popupMenuNodeInfoCache);
    }

    self.showThumbnail = function (relativePath) {
        var url = Gparams.imagesRootPath + relativePath.replace("%2F", "/");
        var str2 = ' <img id="thumbnailImage" src="' + url + '" border="0" height="real_height" width="real_width"  onclick="toutlesensController.showImage(\'' + url + '\')" onload="resizeImg(this, null, 300);">'
        if ($("#largeImageCBX").prop("checked")) {
            self.showImage(url);
        }
        $("#imagePanel").html(str2);

    }

    self.nextImage = function () {

        if (currentThumbnails.currentIndex < currentThumbnails.length - 1) {
            currentThumbnails.currentIndex++;
            self.showThumbnail(currentThumbnails[currentThumbnails.currentIndex].path)
            highlightNode(currentThumbnails[currentThumbnails.currentIndex].id)
        }
    }
    self.previousImage = function () {
        if (currentThumbnails.currentIndex > 0) {
            currentThumbnails.currentIndex--;
            self.showThumbnail(currentThumbnails[currentThumbnails.currentIndex].path)
            highlightNode(currentThumbnails[currentThumbnails.currentIndex].id)
        }

    }

    self.rotateImage = function (negative) {
        self.rotate = function (divId, angle) {
            var deg = $("#" + divId).data('rotate') || 0;
            var rotate = 'rotate(' + angle + 'deg)';
            $("#" + divId).css({
                '-webkit-transform': rotate,
                '-moz-transform': rotate,
                '-o-transform': rotate,
                '-ms-transform': rotate,
                'transform': rotate
            });

        }

        var angle = 90;
        if (negative)
            angle = -90;
        self.rotate("thumbnailImage", angle);
        var oldW = $("#largeImage").css("width");
        var oldH = $("#largeImage").css("height");
        var divHeight = $("#nodeDetailsDiv").css("height");
        var ratio = parseInt(divHeight.replace("px", "")) / parseInt(oldW.replace("px", ""));
        $("#largeImage").css("width", parseInt(oldW.replace("px", "")) * ratio); // Set new width
        $("#nodeDetailsDiv").css("top", "100px");
        // $("#largeImage").css("height",  oldW);
        self.rotate("largeImage", angle);


    }


    return self;
})()