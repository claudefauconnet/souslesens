var searchMenu = (function () {
        var self = {};
        var currentPanelIndex = 1;
        self.init = function (schema) {
            currentPanelIndex = 1;
            toutlesensController.initLabels(propertiesSelectionDialog_ObjectNameInput, false, false);
            $("#propertiesSelectionDialog_ObjectNameInput").val("");
            $("#propertiesSelectionDialog_ObjectNameInput").attr("size", 8);
            $("#propertiesSelectionDialog_propsSelect").append("<option></option><option selected='selected'>" + Schema.getNameProperty() + "</option>");
            $("#propertiesSelectionDialog_valueInput").keypress(function (event) {
                if (event.which == 13) {
                    advancedSearch.addClauseUI()
                }
            })

            $("#searchAccordion").accordion({

            });

            $( "#searchAccordion" ).accordion( "option", "active", 1 );

        }

        self.onSearchAction = function (searchType) {
            if (searchType == "graphSomeNeighbours") {

                self.nextPanel();
                var currentLabel = $("#propertiesSelectionDialog_ObjectNameInput").val();
                advancedSearch.setPermittedLabelsCbxs(currentLabel, "neighboursTypesDiv");
                $("#searchMenuNextPanelButton").css('visibility', 'hidden');
            }
            else
                advancedSearch.onSearchAction(searchType);
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
                currentPanelIndex=index
            }
            else
                visibility = "hidden";
            $(this).css('visibility', visibility);
        });
    }
        self.previousPanel = function () {
            currentPanelIndex += -1;
            self.showCurrentPanel();
            if (currentPanelIndex == 0)
                $("#searchMenupreviousPanelButton").css('visibility', 'hidden');
        }

        self.nextPanel = function () {
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


        return self;
    }
)()