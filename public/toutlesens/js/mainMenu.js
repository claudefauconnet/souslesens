/**
 * Created by claud on 19/11/2017.
 */

var mainMenu = (function () {

    var self = {};


    self.showDataMenu = function () {

        toutlesensController.setSplitterPosition(Gparams.splitterMin);
        $("#dialog").load("htmlSnippets/mainMenu.html", function () {
            //  self.initLabelPropertySelection(label);
            $("#dialog").dialog("option", "title", "Toutlesens main menu");
            $("#dialog").dialog("open");
            self.initLabels(mainMenuLabelsSelect);
        })
    }

    self.showGraphDisplayMenu = function () {
        var dialog="graphDisplayMenu.html";
if(Gparams.useVisjsNetworkgraph)
    dialog="visjsGraphDisplayMenu.html";

        $("#dialog").load("htmlSnippets/"+dialog, function () {
            //  self.initLabelPropertySelection(label);
            $("#dialog").dialog("option", "title", "Toutlesens main menu");
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

                currentLabel = label;
                currentDisplayType = "SIMPLE_FORCE_GRAPH";

                toutlesensController.generateGraph(null, false);
            } else {
                toutlesensController.clearGraphDiv();
            }

        }

        else if (option == "node") {
            currentLabel = null;
            toutlesensController.setSplitterPosition(Gparams.splitterNormal);

            /* $("#dialog").load("htmlSnippets/nodeDialog.html", function () {
             //  self.initLabelPropertySelection(label);
             $("#dialog").dialog("option", "title","Select  a specific node");
             $("#dialog").dialog("open");
             self.initLabels(nodeDialogLabelsSelect);
             })*/
        }
        else if (option == "traversal") {

            toutlesensController.setSplitterPosition(Gparams.splitterMin);
            //  self.traversal();
            $("#dialog").load("htmlSnippets/traversalDialog.html", function () {

                $("#dialog").dialog("option", "title", "Pathes beetwen nodes");
                $("#dialog").dialog("open");
                self.initLabels(dialogNodesLabelsSelect);

            })

        }
        else if (option == "customQueries") {
            toutlesensController.setSplitterPosition(Gparams.splitterMin);
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




    self.traversalInitNodeDialog = function (select) {

        var value = $(select).val()
        if (value.length > 0) {
            currentActionObj[currentActionObj.currentTarget].label = value;
            toutlesensData.searchNodes(Schema.subGraph, value, null, null, Gparams.listDisplayLimitMax, 0, function (err, data) {
                var nodes = [];
                var nodeNames = [];
                for (var i = 0; i < data.length; i++) {
                    var node = data[i].n.properties;
                    if (nodeNames.indexOf(node.id) < 0) {
                        nodeNames.push(node.id)
                        nodes.push(node)
                    }
                }
                common.fillSelectOptions(traversalDialogWordsSelect, nodes, Gparams.defaultNodeNameProperty, "id")

                bringToFront('traversalDialogNode')
            });
        }

    }

    self.traversalSetLabel=function(select){
        var value = $(select).val()
        $("#"+currentActionObj.currentTarget).val( value)
        currentActionObj[currentActionObj.currentTarget].label = value;
        $("#graphPathSourceNode").text( value)

    }


    self.traversalSetNode=function(select){
        var index = select.selectedIndex;
        var valueText = select.options[select.selectedIndex].text;
        var valueId = $(select).val();
        var xxx= currentActionObj.currentTarget;

        currentActionObj[currentActionObj.currentTarget].nodeId = valueId;
        currentActionObj[currentActionObj.currentTarget].nodeText = valueText;
        //  $("#dialog").dialog("close");
        $("#"+currentActionObj.currentTarget).val( "["+currentActionObj[currentActionObj.currentTarget].label+"] "+valueText )
        $("#"+currentActionObj.currentTarget).val("zzzzzzzzzzzz");
            bringToFront('traversalDialogMain')


    }

    self.traversalSetCurrentAction =function(input){
        currentActionObj.currentTarget = input.id;
        currentActionObj[input.id]={}
    }


    return self;
})
()