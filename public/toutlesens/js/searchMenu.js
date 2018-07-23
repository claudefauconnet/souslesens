var searchMenu = (function () {
        var self = {};
        var savedQueries = {}
        var currentPanelIndex = 1;
        self.currentAction = null;
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

            $("#searchAccordion").accordion({});

            $("#searchAccordion").accordion("option", "active", 1);
            //  localStorage.removeItem("savedQueries")
            savedQueries = localStorage.getItem("savedQueries");
            if (!savedQueries)
                savedQueries = {};
            else
                savedQueries = JSON.parse(savedQueries);
            var names = []
            for (var key in savedQueries) {
                names.push(key);

            }
            names.sort();
            common.fillSelectOptionsWithStringArray(searchDialog_savedQueries, names);
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
                toutlesensController.setRightPanelAppearance();
                $("#paintAccordion").accordion("option","active",1)
                $( "#tabs-analyzePanel" ).tabs( "option", "active", 2 );//highlight

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


            if (option != 'execute')
                previousAction = option;

            toutlesensController.setRightPanelAppearance(true);
        }

        self.savedQuerySave = function () {
            //  advancedSearch.addClauseUI();
            var val = "";
            var neighboursLabels = [];
            var neighboursLabels=[]
            if (advancedSearch.searchClauses.length > 0)
                val = advancedSearch.searchClauses[0].title;
            if (advancedSearch.searchClauses.length > 1)
                val = advancedSearch.searchClauses[0].title.substring(0, 10) + "..."
            if (previousAction != "") {
                val = previousAction.replace("SomeNeighboursListLabels","") + ":" + val
            }
            if (previousAction.indexOf("ListLabels") > -1) {

                $('[name=advancedSearchDialog_LabelsCbx]:checked').each(function () {
                    neighboursLabels.push($(this).val());
                });
                for(var i=0;i<neighboursLabels.length;i++){
                    val+="/"+neighboursLabels[i];
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

                localStorage.setItem("savedQueries", JSON.stringify(savedQueries));
                $("#searchDialog_savedQueries").prepend("<option>" + name + "</option>")
            }


        }
        self.savedQueryDelete = function () {

            var name = $("#searchDialog_savedQueries").val();
            if (name && name != "") {
                delete savedQueries[name];
                localStorage.setItem("savedQueries", JSON.stringify(savedQueries));
                $("#searchDialog_savedQueries option").each(function () {
                    if ($(this).val() == name) {
                        $(this).remove();
                        return;
                    }
                });
            }
        }
        self.savedQueryExecute = function () {
//$("#searchAccordion").accordion("option","active",1)
            var name = $("#searchDialog_savedQueries").val();
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


        }


        return self;
    }
)()