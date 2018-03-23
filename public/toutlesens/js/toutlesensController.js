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
    self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;
    self.rdfProxyUrl = "../../.." + Gparams.rdfProxyUrl;
    self.imagesRootPath = "../../.." + Gparams.imagesRootPath;


    self.currentActionObj = null;
    self.currentSource = "NEO4J";
    self.appInitEnded = false;
    self.currentRelationData = {};
    self.hasRightPanel = true;


// http://graphaware.com/neo4j/2015/01/16/neo4j-graph-model-design-labels-versus-indexed-properties.html


    /**
     *
     *  generate a graph  (visjs by default)
     *
     *  builds cypher query
     *  draw the graph in the main panel
     *  set the interface for interaction
     *
     *
     *
     * @param id
     * @param options
     * @param callback
     * @returns {*}
     */




    self.generateGraph = function (id, options, callback) {
        if (!options)
            options = {};


        d3.select("#graphDiv").selectAll("svg").remove();
        $("#graphDiv").html("");
        //  $("#mainButtons").css("visibility", "hidden");
        $("#graphMessage").html("");
        $("#relInfoDiv").html("");
        $("#graphCommentDiv").html("");


        if ($("#keepFiltersCbx").prop("checked"))
            $("#graphMessage").html("");
        currentDataStructure = "flat";

        if (currentDisplayType == "FLOWER" || currentDisplayType == "TREE" || currentDisplayType == "TREEMAP")
            currentDataStructure = "tree";


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
            if (Gparams.useVisjsNetworkgraph)
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


        if (options && options.applyFilters) {
            //   filters.setQueryFilters();
            $("#tabs-analyzePanel").tabs("option", "disabled", []);
            $("#tabs-analyzePanel").tabs("enable", 1);
            $("#tabs-analyzePanel").tabs("enable", 2);
            // $("#tabs-analyzePanel").tabs("enable", 1);


            // $(".paintIcon").css("visibility","visible")
        }
        else {
            //  self.setGraphMessage("Too many relations to display the graph<br>filter by  relation or label types")
            //  output = "filtersDescription";
            $(".paintIcon").css("visibility", "hidden")
        }


//**************** options
        var addToPreviousQuery = false;
        if (options.addToPreviousQuery == true)
            addToPreviousQuery = true;

        options.applyFilters = true;

        if ($("#hideNodesWithoutRelationsCbx").prop("checked"))
            options.hideNodesWithoutRelations = true;

        var relationDepth = $("#depth").val();
        if (relationDepth === undefined)
            options.relationDepth = Gparams.defaultQueryDepth;
        else
            options.relationDepth = parseInt(relationDepth);

        options.output = currentDisplayType;
        /*----------------------------------------------------------------------------------------------------*/
        $("#waitImg").css("visibility", "visible");
        toutlesensData.getNodeAllRelations(id, options, function (err, data) {
            toutlesensData.whereFilter = "";
            if (err) {
                console.log(err);
                self.setMessage("ERROR" + err);
                if (callback)
                    return callback(err);
                return;
            }

            if (data.length == 0) {
                self.setGraphMessage("No  result");
                $("#waitImg").css("visibility", "hidden");
                $("#tabs-analyzePanel").tabs("enable", 0);
                self.dispatchAction('nodeInfos');
                self.setRightPanelAppearance(false);
                return;
            }

            $("#graphCommentDiv").append(data.length + " nodes and relations displayed ");
            if (data.length >= Gparams.maxResultSupported && currentDisplayType != "SIMPLE_FORCE_GRAPH_BULK") {

                Gparams.maxResultSupported = Gparams.maxResultSupported;
                //   return;

            }


            self.setResultGraphMessage(data.length);

            if (data.length > Gparams.maxNodesForRelNamesOnGraph) {
                Gparams.showRelationNames = false;
                $("#showRelationTypesCbx").removeAttr("checked");
            } else {
                Gparams.showRelationNames = true;
                $("#showRelationTypesCbx").prop("checked", "checked");
            }
            $("#visJsSearchGraphButton").css("visibility: visible");
            toutlesensData.prepareRawData(data, addToPreviousQuery, currentDisplayType, function (err, data, labels, relations) {

                self.setRightPanelAppearance(false);

                //   paint.init(data);
                filters.init(data);
                $("#mainButtons").css("visibility", "visible");
                $("#waitImg").css("visibility", "hidden");
                $(".graphDisplayed").css("visibility", "visible");

                if (toutlesensData && toutlesensData.queriesIds.length >1)
                    options.dragConnectedNodes=true;
                toutlesensController.displayGraph(data, options);
                if (callback)
                    return callback(null, data);


            });


        });


    }

    /**
     *
     * display the graph using relsult from toutlesensdata.getNodeAllRelations
     *
     *
     * @param json result from toutlesensdata.getNodeAllRelations
     * @param output presently "VISJS-NETWORK"
     * @param callback
     */


    self.displayGraph = function (json, options, callback) {
        if (!options)
            options = {}
        d3NodesSelection = [];
        $("#textDiv").html("");

        if (currentDisplayType == "VISJS-NETWORK") {

            if (json.length > Gparams.limitToOptimizeGraphOptions) {
                // options.showNodesLabel = false,
                options.showRelationsType = false,
                    options.smooth = false;
            } else {
                if (options.showNodesLabel != false)
                    options.showNodesLabel = true;
                //  options.showRelationsType = false,
                options.smooth = true;
            }
            if (!json)
                json = connectors.neoResultsToVisjs(toutlesensData.cachedResultArray, options);
            else
                json = connectors.neoResultsToVisjs(json, options);


            visjsGraph.draw("graphDiv", json, options);
            visjsGraph.drawLegend(filters.currentLabels);

        }


        if (callback)
            callback()


    }


    /**
     *  generate a graph with a specific relation type
     *
     * @param select indicating the relation type
     */

    self.generateGraphFromRelType = function (select) {
        var type = $(select).val();
        if (type !== "") {
            $("#findRelationsCurrentType").html(type);
            $("#findRelationsSelect").val("");
            //   var relation=Schema.getRelationsByType(type);
            toutlesensData.queryRelTypeFilters = ":" + type;
            currentObject.id = null;
            currentDisplayType = "VISJS-NETWORK";
            self.generateGraph(null, {hideNodesWithoutRelations: true});
        }


    }
    /**
     *
     *
     * from nodeDiv in index.html process autocompletion to dispaly a tree (infoGenericDisplay) with all nodes that match word input regex
     * autocompletion params are  Gparams.searchInputKeyDelay and Gparams.searchInputMinLength
     *
     *
     *
     *
     *
     * @param resultType
     * @param limit
     * @param from
     * @param callback
     */

    self.searchNodesUI = function (resultType, limit, from, callback) {


        if (!startSearchNodesTime) {// temporisateur
            startSearchNodesTime = new Date();
            return;
        } else {
            var now = new Date();
            if (now - startSearchNodesTime < Gparams.searchInputKeyDelay)
                return;
        }
        var word = "";
        $("#nodesLabelsSelect").val("")
        currentLabel = null;
        var label = $("#nodesLabelsSelect").val();
        word = $("#word").val();
        if (word && word.length < Gparams.searchInputMinLength && label && label.length == "") {
            return;
        }
        if (label == "" && word == "")
            return;
        toutlesensData.searchNodes(subGraph, label, word, resultType, limit, from, callback);
        setTimeout(function () {
            self.setRightPanelAppearance(true);
            infoGenericDisplay.expandAll("treeContainer");
        }, 500)

    }


    /**
     *
     *
     * print in div graphMessage a contextual message
     *
     *
     *
     * @param resultLength
     */

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


    /**
     *
     * print in div message a contextual message
     *
     * @param str
     * @param color
     */

    self.setMessage = function (message, color) {
        $("#message").html(message);
        if (color)
            $("#message").css("color", color);
    }

    self.setGraphMessage = function (message, type) {

        var str = "<br><br><p align='center' >"
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
        str += "<span id='graphMessageDetail'>" + message + "</span> <br>";
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


    self.selectTab = function (index) {
        $('#ressourcesTab').tabs({
            active: index
        });
    }


    /**
     *
     *
     * execute an action
     *
     * action ==
     * "nodeInfos" : show node e info either in a popup or in a viv (bottom rigth)
     * "removeNode"
     * "relationInfos" to finsih !!!
     *  "expandNode"
     *  "closeNode" to do !!!
     *  "linkSource"
     *  "linkTarget"
     *  "modifyNode"
     *  "addNode"
     *  showGraphText
     *  showGlobalMenu
     *  showParamsConfigDialog
     *  showParamsConfigDialog
     *  showAll
     *
     *
     * @param action
     * @param objectId
     * @param targetObjectId
     * @param callback
     */
    self.dispatchAction = function (action, objectId, targetObjectId, callback) {

        $("#graphPopup").css("visibility", "hidden");
        self.hidePopupMenu();

        var mode = $("#representationSelect").val();
        var id;
        if (currentObject && currentObject.id)
            id = currentObject.id;
        else
            id = currentObject.id

        if (!currentObject.label && currentObject.nodeType) {
            currentObject.label = currentObject.nodeType;
        }


        if (action == "nodeInfos") {
            if (id) {


                if (currentObject.type && currentObject.type == "schema") {
                    var str = "Label " + currentObject.label + "<br><table>"
                    if (currentObject.count < Gparams.jsTreeMaxChildNodes)
                        str += "<tr><td><a href='javascript:graphicController.dispatchAction(\"list\")'>List all nodes</a></td></tr>"
                    str += "<tr><td><a href='javascript:graphicController.dispatchAction(\"graph\")'>Graph  all neighbours</a>"
                    str += "<tr><td><a href='javascript:graphicController.dispatchAction(\"search\")'>Search nodes...</a>"

                    str += "<tr><td><a href='javascript:graphicController.dispatchAction(\"startLabel\")'>Graph from...</a></td></tr>"
                    if (graphicController.startLabel && graphicController.startLabel.label) {
                        str += "<tr><td><a href='javascript:graphicController.dispatchAction(\"endLabel\")'>Graph to...</a></td></tr>"
                        //    str += "<tr><td><a href='javascript:graphicController.dispatchAction(\"shortestPath\")'>Shortest Path</a></td></tr>"
                    }
                    $("#graphPopup").html(str);
                    $("#nodeInfoMenuDiv").html(str);


                    return;
                }
                toutlesensData.getNodeInfos(id, function (obj) {
                    var $currentObj = currentObject;
                    if (self.hasRightPanel) {
                        var str = "<input type='image' src='images/back.png' height='15px' alt='back' onclick='toutlesensController.restorePopupMenuNodeInfo()' ><br>"
                        str += textOutputs.formatNodeInfo(obj[0].n.properties);
                        str += "<br>" + customizeUI.customInfo(obj);
                        popupMenuNodeInfoCache = $("#nodeInfoMenuDiv").html();

                        //    $("#nodeInfoMenuDiv").css("top", "total");
                        $("#nodeInfoMenuDiv").css("visibility", "visible");
                        $("#nodeInfoMenuDiv").html(toutlesensDialogsController.setPopupMenuNodeInfoContent());
                        self.setRightPanelAppearance(false);
                        $("#graphPopup").html(toutlesensDialogsController.setPopupMenuNodeInfoContent());
                        $("#nodeInfoMenuDiv").html(str);

                    }
                    else {
                        var str = toutlesensDialogsController.setPopupMenuNodeInfoContent();
                        $("#graphPopup").html(str);

                        toutlesensController.showPopupMenu($currentObj._graphPosition.x, $currentObj._graphPosition.y, "nodeInfo");
                    }
                });
            }


        }


        else if (action == "removeNode") {
            if (id) {
                visjsGraph.removeNode(id);
            }

        }


        else if (action == 'relationInfos') {
            $("#graphPopup").html(toutlesensDialogsController.setPopupMenuRelationInfoContent());

        }
        else if (action == 'expandNode') {
            toutlesensController.generateGraph(currentObject.id, {applyFilters: false, addToPreviousQuery: true});
        }
        else if (action == 'closeNode') {

        }

        else if (action == "setAsRootNode") {
            if (self.currentSource == "RDF") {
                var name = currentObject.name;
                var p = name.indexOf("#");
                if (p > 0)
                    var name = name.substring(0, p);
                rdfController.searchRDF(name);
            }
            else {// minus sign on currentObject.id see toutlesensData 148
                self.generateGraph(currentObject.id, {applyFilters: false});
            }
        }

        else if (action == "linkSource") {

            $("#linkActionDiv").css("visibility", "visible");
            var sourceNode = JSON.parse(JSON.stringify(currentObject));
            $("#linkSourceNode").val(sourceNode.name);
            $("#linkSourceNode").css("color", nodeColors[sourceNode.label]);
            $("#linkSourceLabel").html(sourceNode.label);
            self.currentRelationData = {
                sourceNode: sourceNode,
                context: "visJsGraphAddRel"
            }
        } else if (action == "linkTarget") {
            //	selectLeftTab('#dataTab');
            $("#linkActionDiv").css("visibility", "visible");
            var targetNode = JSON.parse(JSON.stringify(currentObject));
            $("#linkTargetNode").val(targetNode.name);
            $("#linkTargetNode").css("color", nodeColors[targetNode.label]);
            $("#linkTargetLabel").html(targetNode.label);

            self.currentRelationData.targetNode = targetNode;
            var links = [];
            var allowedRelTypes = Schema.getPermittedRelTypes(toutlesensController.currentRelationData.sourceNode.labelNeo, toutlesensController.currentRelationData.targetNode.labelNeo, true);

            //  allowedRelTypes.splice(0, 0, "");
            $("#dialog").load("htmlSnippets/relationsForm.html", function () {
                common.fillSelectOptionsWithStringArray(relations_relTypeSelect, allowedRelTypes);
                self.initLabels(relationsFormNewRelationStartLabelSelect);
                self.initLabels(relationsFormNewRelationEndLabelSelect);
                $("#dialog").dialog("option", "title", "Relation");

            })
            $("#dialog").dialog("open");


        } else if (action == "modifyNode") {
            if (Gparams.readOnly == false) {

                var label = currentObject.labelNeo;
                $("#dialog").dialog({modal: false});
                $("#dialog").dialog("option", "title", " node " + label);


                $("#dialog").load("htmlSnippets/nodeForm.html", function () {

                    var attrObject = Schema.schema.properties[label];
                    infoGenericDisplay.selectedNodeData = currentObject;
                    infoGenericDisplay.selectedNodeData.neoId = currentObject.id
                    infoGenericDisplay.setAttributesValue(label, attrObject, currentObject.neoAttrs);
                    infoGenericDisplay.drawAttributes(attrObject, "nodeFormDiv");
                    // self.setRightPanelAppearance();

                })
                $("#dialog").dialog("open");

            }


        } else if (action == "deleteRelation") {
            infoGenericDisplay.deleteRelationById(currentObject.neoId, function (err, result) {
                if (err) {
                    return console.log(err);
                }
                visjsGraph.deleteRelation(currentObject.id)
            })
        }
        else if (action == "addNode") {
            currentObject = {}

            if (Gparams.readOnly == false) {
                $("#dialog").dialog({modal: false});
                $("#dialog").dialog("option", "title", "New node");


                $("#dialog").load("htmlSnippets/nodeForm.html", function () {
                    self.initLabels(nodeFormLabelSelect);
                    self.setRightPanelAppearance();
                    for (var i = 0; i < Gparams.palette.length; i++) {
                        $("#nodeFormNewLabelColor").append($('<option>', {
                                value: Gparams.palette[i],
                                text: Gparams.palette[i],

                            }).css("background-color", Gparams.palette[i])
                        );


                    }

                })
                $("#dialog").dialog("open");

            }

        }

        else if (action == "createNewLabel") {
            /*   var newLabel = prompt("new label name");*/
            var newLabel = $("#nodeFormNewLabelName").val()
            var newLabelColor = $("#nodeFormNewLabelColor").val()
            if (newLabel && newLabel.length > 0) {
                if (!/^[\w]+$/.test(newLabel)) {
                    return alert("label names only allow ascii characters")
                    var color = "#FFD900"
                }
                if (newLabelColor && newLabelColor.length > 0)
                    color = newLabelColor;

                Schema.schema.labels[newLabel] = {"color": color};
                Schema.schema.properties[newLabel] = {
                    "name": {
                        "type": "text"
                    },

                }
                Schema.save(subGraph);
                self.initLabels(nodeFormLabelSelect);
                var attrObject = Schema.schema.properties[newLabel];
                infoGenericDisplay.selectedNodeData = null;
                infoGenericDisplay.setAttributesValue(newLabel, attrObject, {});
                infoGenericDisplay.drawAttributes(attrObject, "nodeFormDiv");
            }
        }

        else if (action == "createNewRelationType") {
            $('#relationsFormNewRelationDiv').css('visibility', 'visible');
            var startLabel = $("#relationsFormNewRelationStartLabelSelect").val();
            var endLabel = $("#relationsFormNewRelationEndLabelSelect").val();
            var newRelation = $("#relationsFormNewRelationNameInput").val();
            if (newRelation && newRelation.length > 0) {
                if (!/^[\w]+$/.test(newRelation)) {
                    return alert("relation names only allow ascii characters")
                }

                Schema.schema.relations[newRelation] = {
                    "startLabel": startLabel,
                    "endLabel": endLabel,
                    "type": newRelation
                }
                Schema.save(subGraph);
                var allowedRelTypes = Schema.getPermittedRelTypes(toutlesensController.currentRelationData.sourceNode.labelNeo, toutlesensController.currentRelationData.targetNode.labelNeo, true);
                common.fillSelectOptionsWithStringArray(relations_relTypeSelect, allowedRelTypes);
            }
        }


        else if (action == "showGraphText") {
            $("#dialogLarge").dialog({modal: true});
            $("#dialogLarge").dialog("option", "title", "Graph text");
            $("#dialogLarge").load("htmlSnippets/graphTextDialog.html", function () {
                var text = visjsGraph.graph2Text();
                $("#graphTextDiv").html(text);
            })
            $("#dialogLarge").dialog("open");
        }
        else if (action == "showGlobalMenu") {
            $("#dialog").dialog({modal: true});
            $("#dialog").dialog("option", "title", "SouslesensGraph main menu");
            $("#dialog").load("htmlSnippets/globalMenu.html", function () {
            })
            $("#dialog").dialog("open");
        }

        else if (action == "showSchemaConfigDialog") {

            $("#dialogLarge").load("htmlSnippets/schemaConfig.html", function () {
                if (options && options.create)
                    $("#schemaConfig_createSchemaDiv").css("visibility", "visible");
                else
                    $("#schemaConfig_configSchemaDiv").css("visibility", "visible");


                $("#subGraph").val(subGraph);//  self.initLabelProperty(label);


            })
            $("#dialogLarge").dialog("option", "title", "Souslesens schema configuration");
            $("#dialogLarge").dialog("open");
        }

        else if (action == "showParamsConfigDialog") {

            $("#dialogLarge").load("htmlSnippets/paramsConfig.html", function () {
                if (options && options.create)
                    $("#schemaConfig_createSchemaDiv").css("visibility", "visible");
                else
                    $("#schemaConfig_configSchemaDiv").css("visibility", "visible");


                $("#subGraph").val(subGraph);//  self.initLabelProperty(label);


            })
            $("#dialogLarge").dialog("option", "title", "Souslesens schema configuration");
            $("#dialogLarge").dialog("open");
        }

        else if (action == "showAll") {
            currentObject.id = null;
            currentLabel = null;
            currentDisplayType = "SIMPLE_FORCE_GRAPH";
            // $("#showRelationTypesCbx").remove("checked");
            //  visjsGraph.displayRelationNames({show:false})
            Gparams.showRelationNames = false;

            self.generateGraph(null, {applyFilters: true, hideNodesWithoutRelations: false});
        }

        else if (action == "zoomOnNode") {
            var expression = prompt("find node with name ?");
            if (expression && expression.length > 0) {
                visjsGraph.zoomOnNode(expression);

            }

        }

        else if (action == "onLinkClick") {
            self.generateGraph(objectId, {applyFilters: true}, function () {

            })

        }
        else if (action == "drawSchema") {
            currentActionObj.graphType = "schema";
            $("#dialogLarge").dialog("close");
            dataModel.getDBstats();
            var data = connectors.toutlesensSchemaToVisjs(Schema.schema);
            self.setRightPanelAppearance(false);
            visjsGraph.draw("graphDiv", data);
        }


        else if (action == "displaySettings") {
            $("#dialog").load("htmlSnippets/visjsGraphDisplayMenu.html", function () {
                var layout = Gparams.graphDefaultLayout;
                if (layout.indexOf("hierarchical") > -1) {
                    ($("#graphLayoutDirectionDir").css("visibility", "visible"));
                } else {
                    ($("#graphLayoutDirectionDir").css("visibility", "hidden"));
                }
                $("#graphLayoutSelect").val(layout);
                $("#dialog").dialog({modal: false});
                $("#dialog").css("position", "absolute");

                $("#dialog").dialog("option", "title", "display settings");
                $("#dialog").dialog("open");
            });
        }
        else if (action == "searchCypher") {
            toutlesensData.matchStatement = $("#cypherDialog_matchInput").val();
            var where = $("#cypherDialog_whereInput").val();
            toutlesensData.whereFilter = where;
            currentObject.id = null;
            self.generateGraph(null, {});
        }


    }


    self.showImage = function (url) {
        // $("#nodeDetailsDiv").prop("src", url);
        var w = $("#nodeDetailsDiv").width();
        $("#nodeDetailsDiv").html('<img id="largeImage" src="' + url + '" border="0" height="real_height" width="real_width" onload="resizeImg(this, null, ' + w + ');">')

    }
    self.restorePopupMenuNodeInfo = function () {
        $("#nodeInfoMenuDiv").html(popupMenuNodeInfoCache);
    }


    /**
     *
     *
     * to be modified
     *
     *
     *
     *
     *
     *
     *
     *
     * @param value
     */











    self.showPopupMenu = function (x, y, type) {

        $("#tabs-analyzePanel").tabs("option", "active", 0);
        $("#graphPopup").css("visibility", "visible").css("top", y).css("left", x);


    }
    self.hidePopupMenu = function () {
        $("#nodeInfoDiv").css("visibility", "hidden");

    }


    self.afterGraphInit = function () {

        dataModel.getDBstats(subGraph, function (err, result) {
            currentActionObj = {graphType: "schema"};
            var data = connectors.toutlesensSchemaToVisjs(Schema.schema);
            self.setRightPanelAppearance(false);
            visjsGraph.draw("graphDiv", data);
            $("#graphCommentDiv").append("Graph model");
        })


        //  paramsController.loadParams();
        var tabsanalyzePanelDisabledOptions = [];
        tabsanalyzePanelDisabledOptions.push(1);//filters
        tabsanalyzePanelDisabledOptions.push(2);//highlight
        var tabsFindPanelDisabledOptions = [];
        // tabsFindPanelDisabledOptions.push(3)


        $("#nextMenuButton").css("visibility", "hidden")
        $("#previousMenuButton").css("visibility", "hidden")


        if (Gparams.showRelationNames) {
            $("#showRelationTypesCbx").prop("checked", "checked");
        }


        if (queryParams.write) {
            Gparams.readOnly = false
        }


        if (Gparams.readOnly == false) {
            $("#infosHeaderDiv").css("visibility", "visible");
            infoGenericDisplay.userRole = "write";
            cards.userRole = "write";


            $("#createNodeButton").css("visibility", "visible");
            $("#editSchemaButton").css("visibility", "visible");
            $("#parametersMenuButton").css("visibility", "visible");

        }
        else {
            tabsanalyzePanelDisabledOptions.push(3);
            $("#infosHeaderDiv").css("visibility", "hidden");
            infoGenericDisplay.userRole = "read"
            cards.userRole = "read";
        }


        $("#requestDiv").load("htmlSnippets/currentQueries.html", function () {
            self.initLabels(currentQueriesDialogSourceLabelSelect);
            self.initLabels(currentQueriesDialogTargetLabelSelect);
        });


        $("#similarsDiv").load("htmlSnippets/similarsDialog.html", function () {

        });
        $("#pivotsDiv").load("htmlSnippets/pivotsDialog.html", function () {
            self.initLabels(pivotsDialogSourceLabelsSelect, true);

        });
        $("#transitiveRelationsDiv").load("htmlSnippets/transitiveRelationsDialog.html", function () {
            toutlesensController.initLabels(transitiveRelations_labelsSelect, true);

        });
        $("#cypherQueryDiv").load("htmlSnippets/cypherDialog.html", function () {


        });


        $("#tabs-analyzePanel").tabs("option", "disabled", tabsanalyzePanelDisabledOptions);
        $("#findTabs").tabs("option", "disabled", tabsFindPanelDisabledOptions);

        $(".graphDisplayed").css("visibility", "hidden");

        if (infoGenericDisplay.userRole != "write")
            $(".canModify").css("visibility", "hidden");

        filters.setLabelsOrTypes("node");
    }

    /**
     *
     *
     * execute a cypher Query to decide if there is too many relations to draw the graph(i.e relations>Gparams.jsTreeMaxChildNodes)
     *
     *
     *
     *
     * @param nodeId
     * @param maxRels
     * @param callback
     */
    self.checkMaxNumberOfNodeRelations = function (nodeId, maxRels, callback) {
        var whereSubGraph = "";
        if (subGraph != Gparams.defaultSubGraph)
            whereSubGraph = " and n.subGraph='" + subGraph + "'"
        var matchStr = "match (n)-[r]-(m) where ID(m)=" + nodeId + whereSubGraph + " return count(r) as count";
        var payload = {match: matchStr};
        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
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
                    $("#dialog").dialog("open");
                    callback(false);
                }
                callback(true);
            }
            , error: function (xhr) {
                toutlesensController.onErrorInfo(xhr)
                callback(false);
            }
        })
    }


    self.onErrorInfo = function (err) {
        var errObj = JSON.parse(err.responseJSON.ERROR);
        if (errObj.code == "ECONNREFUSED")
            alert("No connexion to Neo4j database ");
        console.log(err.responseText)

    }

    self.initLabels = function (select, withEmptyOption) {
        var labels = Schema.getAllLabelNames();
        if (withEmptyOption)
            labels.splice(0, 0, "")
        common.fillSelectOptionsWithStringArray(select, labels);
    }


    self.intiRelationTypes = function () {
        var relations = Schema.schema.relations;
        var types = [];
        for (var key in relations) {
            var type = relations[key].type;
            if (types.indexOf(type) < 0)
                types.push(type);
        }
        types.sort();
        types.splice(0, 0, "")
        common.fillSelectOptionsWithStringArray(findRelationsSelect, types);
    }


    self.setResponsiveDimensions = function (rightPanelWidth) {
        if (rightPanelWidth == 0) {
            $("#tabs-analyzePanel").css("visibility", "hidden");
            self.hasRightPanel = false;
        }
        else {
            self.hasRightPanel = true;
            $("#tabs-analyzePanel").css("visibility", "visible");
        }
        $(".ui-tabs .ui-tabs-panel").css("padding", "2px")

        $("#mainPanel").width(totalWidth - (rightPanelWidth)).height(totalHeight)
        $("#analyzePanel").width(rightPanelWidth - 50).height(totalHeight).css("position", "absolute").css("left", totalWidth - rightPanelWidth + 20).css("top", 20);


        $("#graphDiv").width(totalWidth - rightPanelWidth).height(totalHeight - 0)

        $("#graphLegendDiv").width(400).height(40).css("position", "absolute").css("top", 0).css("left", (totalWidth - rightPanelWidth) - 450).css("background-color", "#eee")


        $("#treeContainer").width(rightPanelWidth - 15);
        // $("#graphLegendDiv").width(rightPanelWidth - 50).height(totalHeight)
        $("#findDiv").width(rightPanelWidth - 10).height((totalHeight)).css("position", "absolute").css("top", "0px").css("left", (totalWidth - rightPanelWidth) + 20)
        $("#findDivInner").width(rightPanelWidth - 10).height((totalHeight))
        $("#findTabs").width(rightPanelWidth - 10);

        $("#editDiv").width(rightPanelWidth - 10).height((totalHeight))
        $("#highlightDiv").width(rightPanelWidth - 10).height((totalHeight))
        $("#filterDiv").width(rightPanelWidth - 10).height((totalHeight))
        $("#infosDiv").width(rightPanelWidth - 10).height((totalHeight))

        //   $("#analyzePanel").width(rightPanelWidth - 10).height(totalHeight).css("position", "absolute").css("left", (totalWidth - rightPanelWidth) + 30).css("top", 10);
        //  $("#tabs-analyzePanel").width(rightPanelWidth - 100).height(totalHeight/2).css("position", "absolute").css("left",(totalWidth-rightPanelWidth) + 30).css("top", 10);


        $("#analyzePanel").width(rightPanelWidth - 10);
        $("#nodeInfoMenuDiv").width(rightPanelWidth - 40).height(Gparams.infosanalyzePanelHeight - 80).css("visibility", "hidden")


        //   $("#mainButtons").width(rightPanelWidth).height(50).css("position", "absolute").css("left", $("#graphDiv").width() - 200).css("top", 50).css("visibility", "hidden");
        $("#mainButtons").css(".max-width", 300).height(50).css("position", "absolute").css("left", 20).css("top", 10);//.css("visibility", "hidden");
        $("#graphCommentDiv").css("max-width", "500").css("position", "absolute").css("left", 20).css("top", totalHeight - 50);


        $("#fullScreenButton").css("position", "absolute").css("top", 5).css("left", (totalWidth - rightPanelWidth) - 10);
        $(".objAttrInput").width(rightPanelWidth - 100);

        self.setRightPanelAppearance(true);

    }

    self.switchanalyzePanelDisplay = function () {
        self.hasRightPanel = !self.hasRightPanel

        if (!self.hasRightPanel)
            toutlesensController.setResponsiveDimensions(0);
        else
            toutlesensController.setResponsiveDimensions(rightPanelWidth);
        $("#mainButtons").css("visibility", "visible");

    }


    /**
     *
     * if expandTree true; the treePanel will occupy all the height of the right panel else only thr top until totalheight -Gparams.infosanalyzePanelHeight
     *
     *
     *
     * @param expandTree
     */
    self.setRightPanelAppearance = function (expandTree) {
        var analyzePanelHeight = Gparams.infosanalyzePanelHeight;
        if (expandTree === true) {
            analyzePanelHeight = 0;
        }


        $("#treeContainer").height((totalHeight - analyzePanelHeight) - 120);
        $("#findTabs").height((totalHeight - analyzePanelHeight));

        $("#analyzePanel").height(analyzePanelHeight - 10).css("top", (totalHeight - analyzePanelHeight) + 20);
        ;
        $("#tabs-analyzePanel").tabs("option", "disabled", []);
        $("#tabs-analyzePanel").tabs("enable", 1);
        $("#tabs-analyzePanel").tabs("enable", 2);


    }
    self.increaseGraphLimit = function () {
        var increase = prompt("Enter new graph display limit");
        if (increase && increase != "") {
            Gparams.maxResultSupported = parseInt(increase);
        }
    }

    return self;
})
()