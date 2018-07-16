var searchMenu = (function () {
        var self = {};
        var savedQueries = {}
        var currentPanelIndex = 1;
        self.init = function (schema) {
            currentPanelIndex = 1;
            toutlesensController.initLabels(propertiesSelectionDialog_ObjectNameInput, true);
            $("#propertiesSelectionDialog_ObjectNameInput").val("");
            $("#propertiesSelectionDialog_ObjectNameInput").attr("size", 8);
            $("#propertiesSelectionDialog_propsSelect").append("<option></option><option selected='selected'>" + Schema.getNameProperty() + "</option>");
            $("#propertiesSelectionDialog_valueInput").keypress(function (event) {
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
            common.fillSelectOptionsWithStringArray(searchMenu_savedQueries, names);
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
                $("#searchMenupreviousPanelButton").css('visibility', 'hidden');
        }

        self.nextPanel = function () {
            if(currentPanelIndex==1)
                advancedSearch.addClauseUI();
            currentPanelIndex += 1;


            self.showCurrentPanel();
            var xx = $("#searchMenupreviousPanelButton");


            $("#searchMenupreviousPanelButton").css('visibility', 'visible');
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

            if (option == '')
                return;

            if (option == "graphSomeNeighboursList") {
                self.nextPanel();
                var currentLabel = $("#propertiesSelectionDialog_ObjectNameInput").val();
                advancedSearch.setPermittedLabelsCbxs(currentLabel, "neighboursTypesDiv");
                $("#searchMenuNextPanelButton").css('visibility', 'hidden');

            }



            else if (option == 'listNodes') {
                advancedSearch.searchNodes('matchStr', null, infoGenericDisplay.loadSearchResultIntree);
                $("#findTabs").tabs("option", "active", 0);
            }
            else if (option == 'graphNodes') {
                advancedSearch.searchNodes('matchStr', null, self.graphNodesOnly);
            }
            else if (option == 'graphAllNeighbours') {
                advancedSearch.searchNodes('matchStr', null, self.graphNodesAndDirectRelations);
            }
            else if (option == 'graphSomeNeighbours') {
                advancedSearch.searchNodes('matchStr', null, self.graphNodesAndDirectRelations);
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
            toutlesensController.setRightPanelAppearance();
            //   $('#dialog').dialog('close')


        }

        self.savedQuerySave = function () {
            //  advancedSearch.addClauseUI();
            var val="";
            if( advancedSearch.searchClauses.length>0)
              val=  advancedSearch.searchClauses[0].title;
            if( advancedSearch.searchClauses.length>1)
                val=  advancedSearch.searchClauses[0].title.substring(0,10)+"..."
            var name = prompt("enter query name",val);
            if (name && name != "") {

                savedQueries[name] = {clauses: advancedSearch.searchClauses};
                localStorage.setItem("savedQueries", JSON.stringify(savedQueries));
                $("#searchMenu_savedQueries").prepend("<option>"+name+"</option>")
            }


        }
        self.savedQueryDelete = function () {

            var name = $("#searchMenu_savedQueries").val();
            if (name && name != "") {
                delete savedQueries[name];
                localStorage.setItem("savedQueries", JSON.stringify(savedQueries));
                $("#searchMenu_savedQueries option").each(function () {
                    if ($(this).val() == name) {
                        $(this).remove();
                        return;
                    }
                });
            }
        }
        self.savedQueryExecute = function () {

            var name = $("#searchMenu_savedQueries").val();
            var query = savedQueries[name];
            var clauses = query.clauses;



            advancedSearch.clearClauses();
            for (var i = 0; i < clauses.length; i++) {
                advancedSearch.addClause(clauses[i]);
                $("#propertiesSelectionDialog_ObjectNameInput").val(clauses[i].nodeLabel);
            }
            if (!query.outputType) {


                self.activatePanel("searchActionDiv");
                $("#searchMenupreviousPanelButton").css("visibility", "visible");
                $("#searchAccordion").accordion("option", "active", 1);
            }


        }


        return self;
    }
)()