/**
 * Created by claud on 26/09/2017.
 */
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
    self.collapseTargetLabels = [];
    self.currentActionObj = null;
    self.currentSource = "NEO4J";
    self.appInitEnded = false;
    self.graphHistoryArray = [];


// http://graphaware.com/neo4j/2015/01/16/neo4j-graph-model-design-labels-versus-indexed-properties.html


    /***************************main functions*****************************************************************************************************/

    self.onWordSelect = function (draw) {
        currentDisplayType = "VISJS-NETWORK";
       /* if (currentDisplayType == "SIMPLE_FORCE_GRAPH_BULK")
            currentDisplayType = "FLOWER";*/
        var text = wordsSelect.options[wordsSelect.selectedIndex].text;

        currentLabel = text.substring(text.indexOf("[") + 1, text.indexOf("]"));
        currentNodeName = text.substring(0, text.indexOf("]") - 1);
        currentObject.id = $("#wordsSelect").val();
        currentObject = {
            id: currentObject.id,
            name: currentNodeName,
            label: currentLabel
        }
        currentSourceNode = currentObject;

        if (currentDisplayType != "SIMPLE_UI") {
            //   $("#tabs-radarLeft").tabs("enable");
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
        self.generateGraph(currentObject.id, false, toutlesensController.drawGraph);

    }


    self.stackGraph = function (displayType, currentLabel, currentObjectId, filters) {
        var state = {
            displayType: displayType,
            currentLabel: currentLabel,
            currentObjectId: currentObjectId,
            filters: filters
        }
        self.graphHistoryArray.splice(0, 0, state);
    }

    self.replayLastGraph = function () {

        if (self.graphHistoryArray.length > 1) {
            var state = self.graphHistoryArray[1]
            currentObject.id = state.currentObjectId;
            currentLabel = state.currentLabel;
            currentDisplayType = state.displayType;
            filters.currentSelectdFilters = state.filters;
            filters.setQueryFilters(true);

        }
    }


    self.generateGraph = function (id, applyFilters, callback) {


        d3.select("#graphDiv").selectAll("svg").remove();
        $("#graphDiv").html("");
        $("#graphMessage").html("");
        $("#relInfoDiv").html("");


        if ($("#keepFiltersCbx").prop("checked"))
            $("#graphMessage").html("");
        currentDataStructure = "flat";
        if (currentDisplayType == "FLOWER" || currentDisplayType == "TREE" || currentDisplayType == "TREEMAP")
            currentDataStructure = "tree";
        self.hidePopupMenu();


        self.displayButtons = {
            "FLOWER": "treeFlowerButton",
            "TREEMAP": "treemapButton",
            "TREE": "treeButton",
            "CARDS": "cardsButton",
            "SIMPLE_FORCE_GRAPH": "graphButton",
            "SIMPLE_FORCE_GRAPH_BULK": "graphBulkButton",
            "FORM": "formButton",

        }

        $(".displayIcon").removeClass("displayIcon-selected");
        $("#" + self.displayButtons[currentDisplayType]).addClass("displayIcon-selected");

        if (currentDisplayType.indexOf("FORCE") > -1) {
            currentObject.id = null;
           if(Gparams.useVisjsNetworkgraph)
               currentDisplayType = "VISJS-NETWORK"

        }
        else {
            if (!id) {
                if (!currentObject.id && (currentDataStructure == "tree" || currentDisplayType == "CARDS" || currentDisplayType == "FORM")) {
                    self.setGraphMessage("A node must be selected for this graph type ", "stop");
                    if (callback)
                        return callback(null, {});
                    return;
                }
                id = currentObject.id;
                if (!id && currentObject) {
                    id = currentObject.id;
                }
            }
        }


        currentObject.id = id;


        if (currentGraphRequestType == currentGraphRequestType_TRAVERSAL) {
            graphTraversalQueries.drawGraphTraversal();
            if (callback)
                return callback(null, {});
        }
        if (currentGraphRequestType == currentGraphRequestType_NODES_ONLY) {
            var label = $("#nodesLabelsSelect").val();
            var word = $("#word").val();
            self.searchNodesUI("nodeListHTML");
            if (callback)
                return callback(null, {});
        }


        var output = currentDisplayType;

       if (applyFilters) {
            filters.setQueryFilters()
        }
        else {
            self.setGraphMessage("To display a graph <b>select relations  and/or label types")
            output = "filtersDescription";
        }


        var addToExistingTree = false;
       $("#waitImg").css("visibility","visible")
        toutlesensData.getNodeAllRelations(id, output, addToExistingTree, function (err, data) {
            toutlesensData.whereFilter = "";
            if (err) {
                console.log(err);
                self.setMessage("ERROR" + err);
                if (callback)
                    return callback(err);
                return;
            }
            if (output == "filtersDescription") {

                filters.initGraphFilters(data, false);
                var nRels=0;
                for(var i=0;i<data.length;i++){
                    nRels+=data[i].nRels;
                }

                if ( nRels <= Gparams.graphMaxDataLengthToDisplayGraphDirectly) {
                 //   filters.applyAllRelationsFilter();
                    self.generateGraph(currentObject.id, true);

                    return;

                }


                //  filters.initGraphFilters0(data.labels, data.relTypes);
                if (callback) {
                    $("#waitImg").css("visibility", "hidden")
                    return callback(null, data);
                }
            }


            if (data.length >= Gparams.graphDisplayLimitMax && currentDisplayType != "SIMPLE_FORCE_GRAPH_BULK") {
                self.setGraphMessage("Maximum size of data exceeded:" + data.length + " > maximum " + Gparams.graphDisplayLimitMax, "stop");
                $("#waitImg").css("visibility","hidden")
                return;

            }



            // after dblclik on force graph display flower directly without count
         /*   if (currentDisplayType == "FLOWER" && applyFilters != "flowerFiltersInited") {// add depth criteria ??
                //   filters.checkPreviouscheckedFilters();
                // filters.currentFilters={}

                self.generateGraph(currentObject.id, "flowerFiltersInited");
                return;

            }*/

            if (self.collapseTargetLabels.length > 0) {//if we want to collapse graph
                data = self.collapseResult(data);
            }

            self.setResultGraphMessage(data.length);

            if (data.length > Gparams.maxNodesForRelNamesOnGraph) {
                Gparams.showRelationNames = false;
                $("#showRelationTypesCbx").removeAttr("checked");
            }
            toutlesensData.prepareRawData(data, addToExistingTree, currentDisplayType, function (err, data, labels, relations) {


                toutlesensController.displayGraph(data, currentDisplayType, self.currentLabels);
                $("#waitImg").css("visibility","hidden")
                self.stackGraph(currentDisplayType, currentLabel, currentObject.id, filters.currentSelectdFilters);
                if (callback)
                    return callback(null, data);


            });


        });


    }

    self.setResultGraphMessage = function (resultLength) {
        var message = " <i><b>click on graph to stop animation</b></i><br>";
        if (currentLabel)
            message += "Label : " + currentLabel + "<br>"
        if (currentObject.id)
            message += "Node : [" + currentObject.label + "]" + currentObject[Schema.getNameProperty(currentObject.label)] + "<br>";
        message += filters.printRelationsFilters() + "<br>";
        message += filters.printPropertyFilters() + "<br>";


        message += "<b>" + resultLength + "</b> relations found <br>"
        $("#graphMessage").html(message);
    }

    self.searchRDF = function (word) {
        if (!word)
            word = $("#rdfWordInput").val();
        var store = $("#rdfStoreSelect").val();
        var lang = $("#rdfLangageSelect").val();
        var contains = $("#rdfContainsSelect").val();
        //    var relation =$("#rdfRelationSelect").val();
        //   var relations=$("#relationCBX").val();
        var relations = [];
        var relationsCBXs = $("[name=relationCBX]");
        for (var i = 0; i < relationsCBXs.length; i++) {
            if (relationsCBXs[i].checked) {
                relations.push(relationsCBXs[i].value);
            }
        }
        if (relations.length == 0) {
            alert("select at least one relation type)");
            return;

        }

        var displayType = $("#rdfDisplaySelect").val();

        if (word && word.length > 0)
            self.generateRdfGraph(store, word, relations, lang, contains, displayType);
    }

    self.generateRdfGraph = function (store, word, relations, lang, contains, displayType, callback) {
        Gparams.showRelationNames = $("#showRelationTypesCbx").prop("checked");
        self.currentSource = "RDF"
        //  if (currentDisplayType == "SIMPLE_FORCE_BULK")
        currentDisplayType = displayType;
        self.hidePopupMenu();
        Gparams.showRelationNames = $("#showRelationTypesCbx").prop("checked");

        var payload = {
            rdf: 1,
            store: store,
            lang: lang,
            word: word,
            contains: contains,
            relations: relations,
            limit: Gparams.neoQueryLimit
        }
        $.ajax({
            type: "POST",
            url: Gparams.rdfProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                totalNodesToDraw = data.length;
                toutlesensData.prepareRawData(data, false, currentDisplayType, function (err, data, labels, relations) {
                    if (callback)
                        return callback(null, data);
                    nodeColors["BNF"] = "green";
                    linkColors["narrower"] = "blue";
                    linkColors["broader"] = "orange";
                    linkColors["related"] = "red";

                    //  if (!applyFilters)
                    filters.initGraphFilters(labels, relations);
                    toutlesensController.displayGraph(data, currentDisplayType, self.currentLabels);
                })
            },
            error: function (xhr, err, msg) {
                return (err);
            }
        });


    }


    self.displayGraph = function (json, output,callback) {
        Gparams.showRelationNames = $("#showRelationTypesCbx").prop("checked");
        d3NodesSelection = [];
        $("#textDiv").html("");
        $("#tabs-radarRight").tabs("option", "active", 0);

        if (!json) {
            if (output == "SIMPLE_FORCE_GRAPH" || output == "SIMPLE_FORCE_GRAPH_BULK") {
                json = toutlesensData.cachedResultArray;

            }
            else {
                json = toutlesensData.cachedResultTree;

            }
        }

     /*   if (output == "SIMPLE_FORCE_GRAPH" || output == "SIMPLE_FORCE_GRAPH_BULK") {
            $("#graphMessage").append("&nbsp;&nbsp; click on graph to stop animation");
        } else
            $("#graphMessage").html("");*/
        help.setGraphActionsHelp();
        /*     $("#tabs-radarLeft").tabs({
         disabled: false
         });*/
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

        else if (currentDisplayType == "VISJS-NETWORK") {
            visjsGraph.draw("graphDiv", toutlesensData.cachedResultArray);

        }

        else if (output == "FLOWER") {
            var jsonFlower = json;
            if ($("#groupByLabelsCbx").prop("checked"))
                jsonFlower = toutlesensData.jsonToHierarchyTree(json, "label");
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
            //  if (!json || json.children && json.children.length > 0) {// maladroit à revoir dans flower
            var forceJson = toutlesensData.buildForceNodesAndLinks(toutlesensData.cachedResultArray);
            d3simpleForceLight.drawSimpleForce(forceJson.nodes, forceJson.links, forceJson.linksMap)

            //    d3simpleForce.drawSimpleForce(forceJson);
            // visjsGraph.draw("graphDiv",forceJson);
            //  }
        }
        else if (output == "SIMPLE_FORCE_GRAPH_BULK") {
            var forceJson = toutlesensData.cachedResultArray;
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
                matchAll += " return " + returnStr + "  limit " + Gparams.neoQueryLimit;
                toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, matchAll, function (data) {
                    data.patternNodes = nodeIds;
                    d3simpleForceBulk.initSimpleForceBulk(data);
                });
            }
            if(callback)
                callback()


        }


    }


    /***************************other functions*****************************************************************************************************/
    /***************************other functions*****************************************************************************************************/
    /***************************other functions*****************************************************************************************************/


    self.getQueryParams = function (qs) {
        qs = qs.split("+").join(" ");
        var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
        while (tokens = re.exec(qs)) {
            params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
        }
        return params;
    }

    self.initLabels = function (selectId) {
        var select = "#nodesLabelsSelect";
        if (selectId)
            select = "#" + selectId;


        for (var label in Schema.schema.labels) {
            $(select).append($('<option>', {
                text: label,
                value: label
            }).css("color", nodeColors[label]));
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
          //  self.searchNodesUI();
            self.searchNodesUI('matchStr',null,null, infoGenericDisplay.loadSearchResultIntree)
        }
    }

    self.onMatchGo = function () {
        toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, $("#queryTA").val(), null)
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
        toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, query, toGraph);
    }

// function nodesLabelsSelect" size="7" onchange="onNodesLabelsSelect()">

    self.cleanTabDivs = function () {
        // $("#spreadSheetDiv").html("");
        $("#graphDiv").html("");
        $("#resultX").html("");
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
                name: data[i].n.properties[Gparams.defaultNodeNameProperty] + " [" + label + "]",
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

            return;
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


    self.addToBreadcrumb = function (obj) {
        var name = obj.label;
        if (obj.label)
            name = obj.name;
        if (obj.name)
            name = obj[Gparams.defaultNodeNameProperty];
        if (!obj.name)
            return;
        var str = $("#breadcrumb").html()
            + "&nbsp;&nbsp;<a class='breadcrumb-item' id='bc_" + obj.id
            + "' href='javascript:generateGraph(" + obj.id + ")'>"
            + name + "</a>"
        $("#breadcrumb").html(str);
        $(".breadcrumb").css("visibility", "visible");
        var color = nodeColors[obj.type];
        $("#bc_" + obj.id).css("color", color);
    }

    var showInfos = function (node) {

        self.generateGraph(node.id, false, self.showInfosCallback);

    }
    self.showInfosById = function (id) {

        self.generateGraph(id, false, self.showInfosCallback);
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


    self.dispatchAction = function (action, objectId, targetObjectId) {

        if (objectId)
            currentObject = currentHiddenChildren[objectId];

        var id;
        if (currentObject && currentObject.id)
            id = currentObject.id;
        else
            id = currentObject.id

        if (!currentObject.label && currentObject.nodeType) {
            currentObject.label = currentObject.nodeType;
        }

        currentGraphPanel == "";// "graphParametersPanel"


        if (action == "addNodeToGraph") {
            /*  var numberOfLevelsVal = $("#depth").val();
             numberOfLevelsVal = parseInt(numberOfLevelsVal)+2;
             graphQueryUnionStatement="MATCH path=(node1)-[r*.."+numberOfLevelsVal + "]-(m) where ID(node1)="+currentObject.id+" and  ID(m)="+targetObjectId+" and node1.subGraph='"+subGraph+"'";
             //initGraphFilters(currentObject.label);*/
            //  toutlesensData.getNodeAllRelations(targetObjectId, mode, true);
            self.generateGraph(targetObjectId, false);
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
            var str = textOutputs.getRelationAttrsInfo();
            $("#popupMenuNodeInfoDiv").html(str);
            $("#popupMenuNodeInfoDiv").show();
            //   self.selectLeftTab('#attrsTab');
            //  $("#infoPanel").html(str);
        }


        if (action == "unfoldNode") {

            toutlesensData.getNodeAllRelations(currentObject.id, mode, true);
        } else if (action == "setAsRootNode") {
            //   filters.initGraphFilters([currentObject.label]);
            //  toutlesensData.getNodeAllRelations(currentObject.id, mode);
            if (self.currentSource == "RDF") {
                var name = currentObject.name;
                var p = name.indexOf("#");
                if (p > 0)
                    var name = name.substring(0, p);

                self.searchRDF(name);
            }
            else {// minus sign on currentObject.id see toutlesensData 148
                self.generateGraph(currentObject.id, false);
            }
        } else if (action == "foldNode") {
            var output = $("#representationSelect").val();

            toutlesensData.removeChildrenFromTree(exploredTree, currentObject.myId);
            self.displayGraph(exploredTree, output);
        }

        else if (action == "linkSource") {

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

                toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, query, function (data) {
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
            currentObject.name = currentObject[Gparams.defaultNodeNameProperty]


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


    self.drawNodesList = function () {

        self.searchNodesUI("count");
    }


    self.onVisButton = function (value) {


        $("#representationSelect").val(value);
        currentDisplayType = value;

        if (currentDisplayType == "FORM") {
            if (!currentObject.id) {
                self.setGraphMessage("A node must be selected for this graph type ", "stop");
                return;
            }
            $("#tabs-radarRight").tabs("enable", 2);
            $("#tabs-radarRight").tabs("option", "active", 2);
            if (infoGenericDisplay && infoGenericDisplay.selectedNodeData && !infoGenericDisplay.isAddingRelation) {
                //  var node = infoGenericDisplay.ids[infoGenericDisplay.selectedNodeData.jtreeId];
                infoGenericDisplay.showNodeData(null, currentObject.id);
            }


        }
        else if (currentDisplayType == "CARDS") {

            $("#tabs-radarRight").tabs("option", "active", 0);
            var label = $("#nodesLabelsSelect").val();
            var id = currentObject.id;

            if (label || id)

                var legendWidth = $("#graphLegendDiv").width();
            $("#graphLegendDiv").width(1);
            $("#graphDiv").width($("#graphDiv").width() + legendWidth);
            $("#graphDiv").css("overflow", "auto")
            $("#graphDiv").html("");
            $("#graphDiv").html("<div id=backgroundDiv></div>");
            cards.init();
            cards.drawCards(label, id, "cards");
            return;


        }

        else if (currentDisplayType == "SIMPLE_FORCE_GRAPH") {
            currentObject.id = null;
            self.generateGraph(null, false);
        }
        else {
            self.generateGraph(null, true);
        }

    }

    self.onTextVisButton = function (mode) {
        var treeJon;

        if (mode == "HTML") {

            if (!toutlesensData.cachedResultArray && !toutlesensData.cachedResultTree)
                treeJon = toutlesensData.getNodeAllRelations(id, mode);
            if (currentDataStructure == "flat") {
                treeJon = toutlesensData.flatResultToTree(toutlesensData.cachedResultArray);
                textOutputs.listTreeResultToHtml(treeJon, Gparams.htmlOutputWithAttrs)
            }
            else if (currentDataStructure == "tree") {
                if (toutlesensData.cachedResultTree)
                    textOutputs.listTreeResultToHtml(toutlesensData.cachedResultTree, Gparams.htmlOutputWithAttrs)
            }
        }
        else if (mode == "CSV") {
            if (!toutlesensData.cachedResultArray)
                toutlesensData.cachedResultArray = toutlesensData.getNodeAllRelations(id, mode);
            if (currentDataStructure == "flat") {
                treeJon = toutlesensData.flatResultToTree(toutlesensData.cachedResultArray);
                textOutputs.drawCSV(treeJon, Gparams.htmlOutputWithAttrs)
            } else if (currentDataStructure == "tree") {
                if (toutlesensData.cachedResultTree)
                    textOutputs.drawCSV(toutlesensData.cachedResultTree, Gparams.htmlOutputWithAttrs)
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


        if (type && type == "label") {
            popup = "popupMenuLabel";
        }
        else if (type && type == "nodeInfo") {
            toutlesensDialogsController.setPopupMenuNodeInfoContent();
            popup = "popupMenuNodeInfoDiv";
            $("#popupMenuNodeInfoDiv").show();
        }

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
        self.generateGraph();
    }

    self.execNeoQuery = function () {
        var query = $("#neoQueriesTextArea").val();
        toutlesensData.executeNeoQuery(QUERY_TYPE_MATCH, query, displayGraph);
    }


    self.showGraphForNodesCollection = function () {
        $("#representationSelect").val("SIMPLE_FORCE_GRAPH");
        self.generateGraph();
    }


    self.showGantt = function () {
        drawGant(null, "photo", "timestamp", null, 10);
    }

    self.onLinkClick = function (id) {
        self.generateGraph(id, true, function () {
            $("#tabs-radarRight").tabs("option", "active", 0);
        })
        /* toutlesensData.showInfos2(id, function (d) {
         currentObject = d[0].n.properties;
         currentObject.id = d[0].n._id;
         currentObject.label = d[0].n.labels[0];
         if (currentObject.path)
         self.showImage(Gparams.imagesRootPath + decodePath(currentObject.path));
         self.dispatchAction('nodeInfos');
         // $("#tabs-radarRight").tabs("option", "active", 2);
         toutlesensData.getNodeAllRelations(id, null, false, function (json, labels) {

         textOutputs.listTreeResultToHtml(toutlesensData.cachedResultTree, Gparams.htmlOutputWithAttrs)
         });

         /*  generateGraph(id, false);
         currentDataStructure = "tree";
         onTextVisButton('HTML');
         });*/

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


    self.stopAnimation = function () {
        if (d3simpleForceBulk.force)
            d3simpleForceBulk.force.stop();

        if (d3simpleForce.force)
            d3simpleForce.force.stop();

        if (d3flower.force)// a faire
            d3flower.force.stop();

    }


    self.afterGraphInit = function () {

            $("#tabs-radarRight").tabs("option", "disabled", [2]);


        if (Gparams.showRelationNames) {
            $("#showRelationTypesCbx").prop("checked", "checked");
        }
        //   $("#tabs-radarRight").tabs("option", "disabled", [2]);
        $("#tabs-radarLeft").tabs("option", "disabled", [2]);

        if (!queryParams.rdfMenu) {
            $("#tabs-radarLeft").tabs("option", "disabled", [2, 3]);

        }
        $("#advancedQueriesDiv").tabs("option", "disabled", [2, 3, 4]);

        if (Gparams.showBItab)
            $("#tabs-radarLeft").tabs("enable", 2);

        if (queryParams.write) {
            $("#infosHeaderDiv").css("visibility", "visible");
            infoGenericDisplay.userRole = "write";
            cards.userRole = "write";
        }
        else {
            $("#createNodeButton").prop('disabled', true);
            $("#createNodeButton").css("visibility", "hidden");
            $("#infosHeaderDiv").css("visibility", "hidden");
            infoGenericDisplay.userRole = "read"
            cards.userRole = "read";
        }

    }


    self.checkMaxNumberOfNodeRelations = function (nodeId, maxRels, callback) {
        var matchStr = "match (n)-[r]-(m) where ID(m)=" + nodeId + " and m.subGraph=\"" + subGraph + "\" return count(r) as count";
        var payload = {match: matchStr};
        $.ajax({
            type: "POST",
            url: Gparams.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                var count = data[0].count;
                if (count > Gparams.jsTreeMaxChildNodes) {

                    $("#dialog").dialog("option", "title", "result");
                    var str = "All nodes cannot be displayed : " + count + " maximum :" + Gparams.jsTreeMaxChildNodes;
                    // str += "enter criteria"
                    str += "<br><button onclick=' $(\"#dialog\").dialog(\"close\")')>close</button>"
                    $("#dialog").html(str);
                    $("#dialog").dialog("open");//.position({my: 'center', at: 'center', of: '#tabs-radarLeft'});
                    callback(false);
                }
                callback(true);
            }
            , error: function () {
                callback(false);
            }
        })
    }
    self.setGraphMessage = function (message, type) {

        var str = "<br><br><p align='center'>"
        var name = "";
        if (currentObject && currentObject.id)
            name = "Node " + currentObject[Schema.getNameProperty(currentObject.label)];
        else {
            if (currentLabel)
                name = "Label " + currentLabel;
        }
        if (name)
            str += "<span class='objectName'>" + name + "</span><br>"
        if (type == "stop")
            str += "<img src='./icons/warning.png' width='50px'><br>"
        str += "" + message + " <br>";
        str += "</p>";

        $("#graphDiv").html(str);

    }
    self.clearGraphDiv = function () {
        $("#graphDiv").html("");
        $("#graphMessage").html("");
        $("#filtersDiv").html("");
        $("#innerLegendDiv").html("");
        $("#relInfoDiv").html("");


    }
    self.setSplitterPosition = function (offset) {
        splitter.position(offset);
        var w = totalWidth - (offset + Gparams.legendWidth);
        $("#graphLegendDiv").css("left", w)
        $("#graphDiv").width(w)
        $("#graphDiv").css("left", 0)
    }


    return self;
})
()