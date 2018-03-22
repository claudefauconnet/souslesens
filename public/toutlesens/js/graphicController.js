var graphicController = (function () {

    var self = {};
    self.startLabel = {};
    self.endLabel = {};

    self.dispatchAction = function (action) {
        $("#graphPopup").css("visibility", "hidden");

        visjsGraph.paintNodes([""+currentObject.id], "#af9d09",null,null,"box");

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
            advancedSearch.showDialog(currentObject.name);

        }


        else if (action == "startLabel") {
            self.startLabel.label = currentObject.name;
            var filterMovableDiv = $("#filterMovableDiv").detach();
            $("#dialog").html(filterMovableDiv);

            var str = "";
            str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"graphicController.setStartLabelQuery()\">OK</button>";
            $("#propertiesSelectionDialog_valueInput").focus();
            $("#filterActionDiv").html(str);
            $("#propertiesSelectionDialog_ObjectNameInput").val(currentObject.name)
            advancedSearch.onChangeObjectName(currentObject.name);
            $("#dialog").dialog("option", "title", "Start node Query ");
            $("#dialog").dialog({modal: false});
            $("#dialog").dialog("open");
        }


        else if (action == "endLabel") {
            self.endLabel.label = currentObject.name;
            var filterMovableDiv = $("#filterMovableDiv").detach();
            $("#dialog").html(filterMovableDiv);

            var str = "";
            str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"graphicController.setEndLabelQuery()\">Graph</button>";
            $("#propertiesSelectionDialog_valueInput").focus();
            $("#filterActionDiv").html(str);

            $("#propertiesSelectionDialog_ObjectNameInput").val(currentObject.name)
            advancedSearch.onChangeObjectName(currentObject.name);
            $("#dialog").dialog("option", "title", "End node Query ");
            $("#dialog").dialog({modal: false});
            $("#dialog").dialog("open");
        }
        else if (action == "shortestPath") {

        }



    }

    self.setStartLabelQuery = function () {
        advancedSearch.searchNodes("matchObject", function (queryObj) {
            self.startLabel.queryObj = queryObj;
            $("#dialog").dialog("close");
        })
    }

    self.setEndLabelQuery = function () {
        advancedSearch.searchNodes("matchObject", function (queryObj) {
            self.endLabel.queryObj = queryObj;
            $("#dialog").dialog("close");

            var relCardinality = Schema.getLabelsDistance(self.startLabel.label, self.endLabel.label);
            if(relCardinality<0)
                return console.log("no cardinalyty found between "+self.startLabel.label+" and" +self.endLabel.label)
            toutlesensData.matchStatement = "(n:" + self.startLabel.label + ")-[r*" + relCardinality + "]-(m:" + self.endLabel.label + ")";
            toutlesensData.whereFilter=self.startLabel.queryObj.where ;

            if(self.endLabel.queryObj.where!=""){
                if( toutlesensData.whereFilter!="")
                    toutlesensData.whereFilter+= " and ";
                toutlesensData.whereFilter+=   self.endLabel.queryObj.where.replace(/n\./, "m.");
            }


            $("#cypherDialog_matchInput").val(toutlesensData.matchStatement);
            $("#cypherDialog_whereInput").val(toutlesensData.whereFilter);
            toutlesensController.setRightPanelAppearance(true)
         //   $("#findTabs").tabs("option", "active", 3);
         //   $("#advancedQueriesAccordion").tabs("option", "active", 4);

            var options={};
          if(relCardinality>1)
              options.clusterIntermediateNodes=true;
            toutlesensController.generateGraph(null,options);
        })
    }

    return self;
})()