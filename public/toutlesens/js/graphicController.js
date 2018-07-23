var graphicController = (function () {

    var self = {};
    self.startLabel=null;


    self.dispatchAction = function (action) {
        $("#graphPopup").css("visibility", "hidden");


        //  visjsGraph.paintNodes([""+currentObject.id], "#af9d09",null,null,"box");
        visjsGraph.nodes.update([{id: "" + currentObject.id, borderWidth: 6}]);

        if (action == "list") {
            var options = {
                subGraph: subGraph,
                label: currentObject.name,
                word: null,
                resultType: "matchStr",
                limit: Gparams.jsTreeMaxChildNodes,
                from: 0
            }
            toutlesensData.searchNodesWithOption(options, function (err, result) {
                infoGenericDisplay.loadSearchResultIntree(err, result);
                setTimeout(function () {
                    toutlesensController.setRightPanelAppearance(true);
                    infoGenericDisplay.expandAll("treeContainer");
                    $("#dialog").dialog("close");
                }, 500)


            })
        }
        else if (action == "graph") {
            currentObject.id = null;
            toutlesensData.whereFilter = " labels(n)[0]='" + currentObject.name + "' ";
            toutlesensController.generateGraph()
        }


        else if (action == "search") {
            currentObject.id = null;
            advancedSearch.showDialog({initialLabel:currentObject.name});

        }


        else if (action.indexOf("transitivePath") >-1){

            var filterMovableDiv = $("#filterMovableDiv").detach();
            $("#dialog").html(filterMovableDiv);

            var str = "";
            if (action.indexOf("start") >-1) {
                str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.setStartLabelQuery()\">OK</button>";
                $("#dialog").dialog("option", "title", "Start node Query ");
            }
            else   if (action.indexOf("end") >-1) {
                str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.setEndLabelQuery()\">OK</button>";
                $("#dialog").dialog("option", "title", "End node Query ");
            }
            $("#propertiesSelectionDialog_valueInput").focus();
            $("#propertiesSelectionDialog_valueInput").val("");
            $("#filterActionDiv").html(str);

            var label = currentObject.name;
            if (label) {
                traversalController.context.start.label=label;

            }

            $("#propertiesSelectionDialog_NodeLabelInput").val(currentObject.name)
            advancedSearch.onChangeObjectName(currentObject.name);

            $("#dialog").dialog({modal: false});
            $("#dialog").dialog("open");
        }


      /*  else if (action == "endLabel" || action == "endLabelExec") {
            var label = currentObject.name;
            if (label) {
                traversalController.context.end.label = label;
            }
            var filterMovableDiv = $("#filterMovableDiv").detach();
            $("#dialog").html(filterMovableDiv);

            var str = "";
            str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"graphicController.setEndLabelQuery({clusterIntermediateNodes:1})\">Graph only start and end</button><br>";
            str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"graphicController.setEndLabelQuery({})\">Graph all nodes</button>";
            $("#propertiesSelectionDialog_valueInput").focus();
            $("#propertiesSelectionDialog_valueInput").val("");
            $("#filterActionDiv").html(str);

            $("#propertiesSelectionDialog_NodeLabelInput").val(currentObject.name)
            advancedSearch.onChangeObjectName(currentObject.name);
            $("#dialog").dialog("option", "title", "End node Query ");
            $("#dialog").dialog({modal: false});
            $("#dialog").dialog("open");
        }
        else if (action == "shortestPath") {

        }*/


    }



    return self;
})()