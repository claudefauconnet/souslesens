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
        $("#dialog").dialog({modal: false});
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
                currentObject.id = null;
                currentLabel = label;
                currentDisplayType = "SIMPLE_FORCE_GRAPH";

                toutlesensController.generateGraph(null, {applyFilters:false});
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

    self.showCreateRelationDialog = function () {
        var links = [];
        var allowedRelTypes = Schema.getPermittedRelTypes(toutlesensController.currentRelationData.sourceNode.labelNeo, toutlesensController.currentRelationData.targetNode.labelNeo,true);
        if (allowedRelTypes.length == 0) {
            return alert("relation not permitted)");
        }

      //  allowedRelTypes.splice(0, 0, "");
        $("#dialog").load("htmlSnippets/relationsController.html", function () {
            common.fillSelectOptionsWithStringArray(relations_relTypeSelect, allowedRelTypes)
            $("#dialog").dialog("option", "title", "Relation");

        })
        $("#dialog").dialog("open");
    }


    self.saveRelation = function () {
        var relType = $("#relations_relTypeSelect").val();
        if (!relType || relType == "") {
            return alert("select a relation type before saving relation")
        }
        var direction;
        var payload;
        if (relType.indexOf("-") == 0) {//inverse
            relType = relType.substring(1);
            direction = "inverse"
            var payload = {
                sourceNodeQuery: {_id: toutlesensController.currentRelationData.targetNode.id},
                targetNodeQuery: {_id: toutlesensController.currentRelationData.sourceNode.id},
                relType: relType
            }

        }
        else {//normal

            direction = "normal"
            var payload = {
                sourceNodeQuery: {_id: toutlesensController.currentRelationData.sourceNode.id},
                targetNodeQuery: {_id: toutlesensController.currentRelationData.targetNode.id},
                relType: relType
            }

        }


        infoGenericDisplay.callAPIproxy(payload, "createRelation", function (err, result) {
            if (err) {
                $("#message").html(err);
                return;
            }
            $("#message").html("relation saved");
            $("#dialog").dialog("close");
            toutlesensController.currentRelationData = {};
            toutlesensController.replayGraph("same");

            if (true || inEditMenu) {
                var relation = {
                    source: toutlesensController.currentRelationData.sourceNode.id,
                    target: toutlesensController.currentRelationData.targetNode.id,
                    type: relType,
                    direction: direction,
                    properties: {}
                }
                d3graphCreation.addRelation(relation)
            }


        })


     
    }


    return self;
})
()