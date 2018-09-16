var searchMenu = (function () {
        var self = {};
        var savedQueries = {}
        var currentPanelIndex = 1;
        self.currentAction = null;
        self.selectedQuery = null;
        self.pathQuery = null;
        self.previousAction;

        var previousAction = "";
        self.init = function (schema) {
            currentPanelIndex = 1;
            toutlesensController.initLabels(searchDialog_NodeLabelInput, true);
            $("#searchDialog_NodeLabelInput").val("");
            $("#searchDialog_NodeLabelInput").attr("size", 8);
            $("#searchDialog_propertySelect").append("<option></option><option selected='selected'>" + Schema.getNameProperty() + "</option>");
            $("#searchDialog_valueInput").keypress(function (event) {
                if (event.which == 13) {
                    advancedSearch.addClauseUI()
                }
            })
            self.loadQueries()
            $("#searchAccordion").accordion({});
            var tab = 1
            if (Object.keys(savedQueries).length > 0)
                tab = 0
            $("#searchAccordion").accordion("option", "active", tab);


        }

        self.loadQueries = function () {

            function loadToJsTree(savedQueries) {
                var treeData = [];
                var allPaths = [];
                var types = ["graph", "table", "treemap", "graphAllNeighbours"]
                var i = 0;
                for (var key in savedQueries) {
                    i++;
                    var levels = key.split(/[:?]/);
                    var path = "";

                    for (var j = 0; j < levels.length; j++) {
                        var parent = "#"
                        var type = "";
                        if (j > 0)
                            var parent = (levels[j - 1].trim());

                        levels[j] = levels[j].trim();


                        if (j == 0)
                            type = "label";
                        else if (levels[j].indexOf("n.") == 0)
                            type = "whereN";
                        else if (nodeColors[levels[j].split("/")[0]])
                            type = "targetLabels";
                        else if (types.indexOf(levels[j]) > -1) {
                            type = levels[j];
                        }

                        path += ":" + parent;
                        if (j == levels.length - 1) {
                            path += ":" + levels[j]
                        }

                        if (allPaths.indexOf(path) < 0) {
                            allPaths.push(path);
                            var text = levels[j];


                            treeData.push({text: text, id: levels[j], type: type, data: key, parent: parent})
                        }
                    }
                }
                $("#searchDialog_savedQueriesJstree").html("");
                $("#searchDialog_savedQueriesJstree").jstree({
                    'core': {
                        'data': treeData
                    },
                    "types": {
                        "graph": {
                            "icon": "images/graphSmall.png"
                        },
                        "graphAllNeighbours": {
                            "icon": "images/graphSmall.png"
                        },
                        "table": {
                            "icon": "images/tableSmall.png"
                        },
                        "treemap": {
                            "icon": "images/treemapSmall.png"
                        },
                        "label": {
                            "icon": "images/labelIconSmall.png"
                        },
                        "whereN": {
                            "icon": "images/labelIconSmall.png"
                        },
                        "targetLabels": {
                            "icon": "images/labelIcon2Small.png"
                        },
                    }
                    , plugins: ["types"]
                });
                $("#searchDialog_savedQueriesJstree").on('loaded.jstree', function () {
                    $("#searchDialog_savedQueriesJstree").jstree('open_all');
                })
                    .bind("dblclick.jstree", function (e) {
                        var data = $("#searchDialog_savedQueriesJstree").jstree().get_selected(true);
                        if (data[0]) {
                            searchMenu.selectedQuery = data[0].data;
                            searchMenu.savedQueryExecute();
                        }

                    })
                $("#searchDialog_savedQueriesJstree").bind("click.jstree", function (e) {
                    var data = $("#searchDialog_savedQueriesJstree").jstree().get_selected(true);
                    if (data[0]) {

                        searchMenu.selectedQuery = data[0].data;
                    }

                })
            }

            savedQueries = localStorage.getItem("savedQueries_" + subGraph);
            if (!savedQueries)
                savedQueries = {};
            else
                savedQueries = JSON.parse(savedQueries);
            loadToJsTree(savedQueries);
            /*    var names = []
               for (var key in savedQueries) {
                   names.push(key);

               }
               names.sort();

             common.fillSelectOptionsWithStringArray(searchDialog_savedQueries, names);*/
        }


        self.graphNeighboursWithLabels = function () {
            var tagetLabels = [];
            $('[name=advancedSearchDialog_LabelsCbx]:checked').each(function () {
                tagetLabels.push($(this).val())

            })
            advancedSearch.searchNodes('matchStr', {targetNodesLabels: tagetLabels}, advancedSearch.graphNodesAndDirectRelations);
        }

        self.activatePanel = function (id) {
            var visibility = "visible";
            $(".searchPanel").each(function (index, value) {
                if (value.id == id) {
                    visibility = "visible";
                    currentPanelIndex = index
                }
                else
                    visibility = "hidden";
                $(this).css('visibility', visibility);
            });
        }
        self.previousPanel = function () {
            currentPanelIndex += -1;
            self.showCurrentPanel();
            if (currentPanelIndex == 1)
                $("#searchDialog_previousPanelButton").css('visibility', 'hidden');
            $("#searchDialog_ExecuteButton").css('visibility', 'hidden');
            $("#searchDialog_NextPanelButton").css('visibility', 'visible');
        }

        self.nextPanel = function () {
            if (currentPanelIndex == 1)
                advancedSearch.addClauseUI();
            currentPanelIndex += 1;


            self.showCurrentPanel();
            var xx = $("#searchDialog_previousPanelButton");


            $("#searchDialog_previousPanelButton").css('visibility', 'visible');
        }
        self.showCurrentPanel = function () {
            var visibility = "visible";

            $(".searchPanel").each(function (index, value) {
                if (index == currentPanelIndex)
                    visibility = "visible";
                else
                    visibility = "hidden";
                $(this).css('visibility', visibility);
            });


        }

        self.onPropertyKeyPressed = function (input) {
            var ddd = "aaa"
            var xx = this;
        }

        self.onSearchAction = function (option) {
            advancedSearch.filterLabelWhere = "";
            self.currentAction = option;
            if (option == '')
                return;
            $("#searchDialog_NextPanelButton").css('visibility', 'hidden');
            $("#searchDialog_ExecuteButton").css('visibility', 'hidden');


            if (option == "graphSomeNeighboursListLabels") {
                self.nextPanel();
                var currentLabel = $("#searchDialog_NodeLabelInput").val();
                advancedSearch.setPermittedLabelsCbxs(currentLabel, "neighboursTypesDiv");
                $("#searchDialog_ExecuteButton").css('visibility', 'visible');


            }
            if (option == "treeMapSomeNeighboursListLabels") {
                self.nextPanel();
                var currentLabel = $("#searchDialog_NodeLabelInput").val();
                advancedSearch.setPermittedLabelsCbxs(currentLabel, "neighboursTypesDiv");
                $("#searchDialog_ExecuteButton").css('visibility', 'visible');


            }


            else if (option == 'treeNodes') {
                advancedSearch.searchNodes('matchStr', null, infoGenericDisplay.loadSearchResultIntree);
                $("#findTabs").tabs("option", "active", 0);


            }
            else if (option == 'tableNodes') {
                advancedSearch.searchNodes('matchStr', null, function (err, query) {
                    if (err)
                        return console.log(err);
                    dataTable.loadNodes(query, {});


                })

            }
            else if (option == 'path' || option == 'pathDirect') {

                advancedSearch.searchNodes('matchStr', null, function (err, result) {
                    var matchObj = advancedSearch.matchStrToObject(result);
                    self.pathQuery = {sourceQuery: matchObj};
                    previousAction = "pathSourceSearchCriteria"
                    //  self.currentAction.name = "pathTargetSearchCriteria";
                    self.activatePanel("searchCriteriaDiv");
                    $("#searchDialog_previousPanelButton").css('visibility', 'hidden');
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');


                })


            }

            else if (option == 'graphNodes') {
                advancedSearch.searchNodes('matchStr', null, self.graphNodesOnly);

            }
            else if (option == 'graphAllNeighbours') {
                advancedSearch.searchNodes('matchStr', null, advancedSearch.graphNodesAndDirectRelations);


            }

            else if (option == 'graphSimilars') {
                advancedSearch.searchNodes('matchStr', null, self.graphNodesAndSimilarNodes);
                // advancedSearch.graphOnly()
            }
            else if (option == 'tagCloud') {
                advancedSearch.addClauseUI()
                advancedSearch.searchNodes('matchStr', null, function (err, query) {
                    var payload = {match: query};
                    $.ajax({
                        type: "POST",
                        url: advancedSearch.neo4jProxyUrl,
                        data: payload,
                        dataType: "json",
                        success: function (data, textStatus, jqXHR) {

                            tagCloud.drawCloud(null, data);
                        }
                        , error: function (err) {
                            console.log(err);
                            $("#graphDiv").html("")
                        }
                    })
                });
            }
            else if (option == 'execute') {
                eventsController.stopEvent = true;


                toutlesensController.setRightPanelAppearance(false);

                $("#paintAccordion").accordion("option", "active", 1)

                $("#tabs-analyzePanel").tabs("option", "active", 2);//highlight


                if (previousAction == 'path' || previousAction == 'pathDirect') {
                    advancedSearch.searchNodes('matchObject', null, function (err, result) {
                        self.pathQuery.targetQuery = result;
                        var transitivityLevel = Schema.getLabelsDistance(self.pathQuery.sourceQuery.nodeLabel, self.pathQuery.targetQuery.nodeLabel);
                        if (!transitivityLevel)
                            transitivityLevel = 1;
                        toutlesensData.matchStatement = "(n:" + self.pathQuery.sourceQuery.nodeLabel + ")-[r*" + transitivityLevel + "]-(m:" + self.pathQuery.targetQuery.nodeLabel + ")";
                        var where = self.pathQuery.sourceQuery.where;
                        if (self.pathQuery.targetQuery.where != "") {

                            if (where != "")
                                where += " and ";
                            where += self.pathQuery.targetQuery.where.replace(/n\./, "m.");
                        }
                        toutlesensData.whereFilter = where;
                        var options = {};
                        if(previousAction == 'pathDirect')
                            options.clusterIntermediateNodes = true;
                        toutlesensController.generateGraph(null, options, function (err, data) {
                            if (err)
                                return err;


                        })


                        self.previousAction = null;
                        $("#searchDialog_PreviousPanelButton").css('visibility', 'visible');

                    })


                }


                if (previousAction == 'graphSomeNeighboursListLabels') {
                    self.currentAction = "graphSomeNeighbours";
                    self.graphNeighboursWithLabels()
                    //  advancedSearch.searchNodes('matchStr', {targetNodesLabels:true}, self.graphNodesAndDirectRelations);
                    $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                }
                if (previousAction == 'treeMapSomeNeighboursListLabels') {
                    self.currentAction = "treeMapSomeNeighbours";
                    var neighboursLabels = [];
                    $('[name=advancedSearchDialog_LabelsCbx]:checked').each(function () {
                        neighboursLabels.push($(this).val());
                    });

                    advancedSearch.searchNodes('matchStr', {targetNodesLabels: neighboursLabels}, function (err, query) {
                        advancedSearch.graphNodesAndDirectRelations(err, query, treeMap.draw);
                        paint.initHighlight();
                        $("#searchDialog_ExecuteButton").css('visibility', 'visible');
                    });
                }


            }


            if (option != 'execute') {
                previousAction = option;
                self.previousAction = previousAction;
            }


        }

        self.savedQuerySave = function () {
            //  advancedSearch.addClauseUI();
            var val = "";
            var neighboursLabels = [];
            var neighboursLabels = []
            if (advancedSearch.searchClauses.length > 0)
                val = advancedSearch.searchClauses[0].title;
            if (advancedSearch.searchClauses.length > 1)
                val = advancedSearch.searchClauses[0].title.substring(0, 10) + "..."
            val += ":";
            if (previousAction != "") {
                val = val + previousAction.replace("SomeNeighboursListLabels", "");
            }
            if (previousAction.indexOf("ListLabels") > -1) {
                val += ":";
                $('[name=advancedSearchDialog_LabelsCbx]:checked').each(function () {
                    neighboursLabels.push($(this).val());
                });
                for (var i = 0; i < neighboursLabels.length; i++) {
                    if (i > 0)
                        val += "/"
                    val += neighboursLabels[i].trim();
                }

            }
            var name = prompt("enter query name", val.trim());


            if (name && name != "") {

                query = {clauses: advancedSearch.searchClauses};
                if (previousAction != "") {
                    query.outputType = $("#advancedSearchAction").val();
                }
                if (previousAction.indexOf("ListLabels") > -1) {

                    query.neighboursLabels = neighboursLabels;
                }

                savedQueries[name] = query;

                localStorage.setItem("savedQueries_" + subGraph, JSON.stringify(savedQueries));
                //  $("#searchDialog_savedQueries").prepend("<option>" + name + "</option>")

                self.loadQueries();
            }


        }
        self.savedQueryDelete = function () {

            var name = $("#searchDialog_savedQueries").val();
            if (name && name != "") {
                delete savedQueries[name];
                localStorage.setItem("savedQueries_" + subGraph, JSON.stringify(savedQueries));
                self.loadQueries();
                /*$("#searchDialog_savedQueries option").each(function () {
                    if ($(this).val() == name) {
                        $(this).remove();
                        return;
                    }
                });*/
            }
        }

        self.savedQueryDeleteAll = function () {
            localStorage.removeItem("savedQueries_" + subGraph);
            self.loadQueries();
        }

        self.savedQueryExecute = function () {
//$("#searchAccordion").accordion("option","active",1)
            // var name = $("#searchDialog_savedQueries").val();
            var name = searchMenu.selectedQuery;
            var query = savedQueries[name];
            var clauses = query.clauses;


            advancedSearch.clearClauses();
            for (var i = 0; i < clauses.length; i++) {
                advancedSearch.addClause(clauses[i]);
                $("#searchDialog_NodeLabelInput").val(clauses[i].nodeLabel);
            }
            if (!query.outputType) {// first screen only
                self.activatePanel("searchActionDiv");
                $("#searchDialog_previousPanelButton").css("visibility", "visible");
                $("#searchAccordion").accordion("option", "active", 1);
            }
            else {//query panel+output type panel
                $("#advancedSearchAction").val(query.outputType);
            }
            if (!query.neighboursLabels) {
                self.onSearchAction(query.outputType)
            }
            else {

                self.onSearchAction(query.outputType);
                $('[name=advancedSearchDialog_LabelsCbx]').each(function () {
                    if (query.neighboursLabels.indexOf(this.value) > -1)
                        $(this).prop("checked", true);

                });
                self.onSearchAction("execute");
            }
            $("#searchDialog_NextPanelButton").css('visibility', 'visible');

        }


        return self;
    }
)()