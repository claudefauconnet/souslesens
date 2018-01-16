/**
 * Created by claud on 19/11/2017.
 */

var mainMenu = (function () {

    var self = {};


    self.showDataMenu = function () {

     //   toutlesensController.setSplitterPosition(Gparams.splitterMin);
        $("#dialog").load("htmlSnippets/mainMenu.html", function () {
            //  self.initLabelPropertySelection(label);
            $("#dialog").dialog("option", "title", "Toutlesens main menu");
            $("#dialog").dialog("open");
            self.initLabels(mainMenuLabelsSelect);
        })
    }

    self.showGraphDisplayMenu = function () {
        $("#dialog").dialog({modal:false});
        $("#dialog").dialog("option", "title", "Toutlesens main menu");

        var dialog = "graphDisplayMenu.html";
        if (Gparams.useVisjsNetworkgraph)
            dialog = "visjsGraphDisplayMenu.html";

        $("#dialog").load("htmlSnippets/" + dialog, function () {
            //  self.initLabelPropertySelection(label);

            $("#dialog").dialog("open");

        })
    }


    self.initLabels = function (select) {
        var labels = Schema.getAllLabelNames()
        common.fillSelectOptionsWithStringArray(select, labels);
    }

    self.onSelectOption = function (option) {
        if (option == "label") {
            var label = $("#mainMenuLabelsSelect").val();

            if (label.length > 0) {
                currentObject.id=null;
                currentLabel = label;
                currentDisplayType = "SIMPLE_FORCE_GRAPH";

                toutlesensController.generateGraph(null, false);
            } else {
                toutlesensController.clearGraphDiv();
            }

        }

        else if (option == "node") {
            currentLabel = null;
           // toutlesensController.setSplitterPosition(Gparams.splitterNormal);

            $("#graphLegendDiv").load("htmlSnippets/nodePanel.html", function () {

             })
        }
        else if (option == "traversal") {

           /// toutlesensController.setSplitterPosition(Gparams.splitterMin);
            //  self.traversal();
            $("#dialog").load("htmlSnippets/traversalDialog.html", function () {
                $("#dialog").dialog({
                    modal: false
                });
                $("#dialog").dialog("option", "title", "Pathes beetwen nodes");
                $("#dialog").dialog("open");
                self.initLabels(dialogNodesLabelsSelect);

            })

        }
        else if (option == "customQueries") {
           // toutlesensController.setSplitterPosition(Gparams.splitterMin);
            $("#dialog").load("htmlSnippets/currentQueries.html", function () {
                //  self.initLabelPropertySelection(label);
                $("#dialog").dialog("option", "title", "Current queries");
                $("#dialog").dialog("open");
                self.initLabels(currentQueriesDialogSourceLabelSelect);
                self.initLabels(currentQueriesDialogTargetLabelSelect);
            })
        }
        $("#dialog").dialog("close");

    }


    return self;
})
()