/**
 * Created by claud on 19/11/2017.
 */

var traversalMenu = (function () {

        var self = {};
        self.context = {
            source: {},
            target: {},
            currentNode: "",
            currentDistance: 0
        }

        /*   self.searchNodesUI = function (select) {
               if (!startSearchNodesTime) {// temporisateur
                   startSearchNodesTime = new Date();
                   return;
               } else {
                   now = new Date();
                   if (now - startSearchNodesTime < Gparams.searchInputKeyDelay)
                       return;
               }
               var word = "";
               $(select).val("")
               currentLabel = null;
               var label = ""
               word = $(select).val();
               if (word && word.length < Gparams.searchInputMinLength && label && label.length == "") {
                   return;
               }
               if (label == "" && word == "")
                   return;
               infoGenericDisplay.jsTreeDivId = "traversalTreeContainer";
               debugger;
               toutlesensData.searchNodes(subGraph, label, word, resultType, limit, from, function (err, query) {
                   infoGenericDisplay.loadTree("", "#", query, "traversalTreeContainer")

               });


           }

           self.traversalInitNodeDialog = function (select) {

               var value = $("#dialogNodesLabelsSelect").val()
               if (value.length > 0) {
                   //  currentActionObj[currentActionObj.currentTarget].label = value;
                   toutlesensData.searchNodes(Schema.subGraph, value, null, null, Gparams.listDisplayLimitMax, 0, function (err, data) {
                       var nodes = [];
                       var nodeNames = [];
                       for (var i = 0; i < data.length; i++) {
                           var nodeId = data[i].n._id
                           if (nodeNames.indexOf(nodeId) < 0) {
                               var props = data[i].n.properties;
                               props.id = nodeId;
                               nodes.push(props)

                           }
                       }
                       common.fillSelectOptions(traversalDialogNodeSelect, nodes, Gparams.defaultNodeNameProperty, "id")

                       //  bringToFront('traversalDialogNode')
                   });
               }

           }
           self.traversalInitPropertiesDialog = function () {
               var label = $("#dialogNodesLabelsSelect").val()
               filters.initLabelPropertySelection(label, propertiesSelectionDialog_propsSelect)
           }

           self.traversalSetLabel = function (select) {
               var value = $(select).val()
               $("#" + currentActionObj.currentTarget).val(value)
               currentActionObj[currentActionObj.currentTarget].label = value;
               $("#graphPathSourceNode").text(value)

           }


           self.traversalSetNode = function (select) {
               var index = select.selectedIndex;
               var valueText = select.options[select.selectedIndex].text;
               var valueId = $(select).val();
               if (self.context.currentNode == "source") {
                   $("#traversalSourceNode").val(valueText);

                   self.context.source = {type: "node", id: valueId};
               }
               else {
                   $("#traversalTargetNode").val(valueText);
                   self.context.target = {type: "node", id: valueId};
               }


               bringToFront('traversalDialogMain')


           }*/

        self.setTraversalNode = function (stage, data) {
            var nodeName = data[Gparams.defaultNodeNameProperty];
            if (stage == 'source') {
                $("#shortestPath_sourceNode").html(nodeName);
                traversalMenu.context.source = {id: data.neoId, type: "node", name: nodeName};

            }
            if (stage == 'target') {
                $("#shortestPath_targetNode").html(nodeName);
                traversalMenu.context.target = {id: data.neoId, type: "node", name: nodeName};
            }

            if (traversalMenu.context.source.id && traversalMenu.context.target.id)
                $("#executeShortestPathButton").css("visibility", "visible")

            var nodeDivDetach = $("#nodeDivDetachable").detach();
            $("#nodeDiv").append(nodeDivDetach);
            $('#word').val('')
        }


        self.findTraversalNode = function (type) {

            toutlesensController.currentActionObj = {type: 'findShortestPath', stage: type}
            toutlesensController.setFindPanelExpandTree(true);
            var nodeDivDetach = $("#nodeDivDetachable").detach();
            $("#traversalFindDiv").append(nodeDivDetach);
            $("#word").focus();

        }

        self.executeMoreOrLessShortestPathTraversalSearch = function (less) {
            if (less)
                self.context.currentDistance--;
            else {
                $("#executeLessShortestPathButton").css("visibility", "visible")
                var maxDistanceLimit = Gparams.shortestPathMaxDistanceTest;
                self.context.currentDistance++;
                if (self.context.currentDistance > maxDistanceLimit)
                    return $("#shortestPathDistance").text("max distance reached " + maxDistanceLimit);
            }
            self.executeTraversalSearch();

        };
        self.executeShortestPathTraversalSearch = function () {
            var algo = "allSimplePaths"// $("#graphPathsAlgorithm").val();
            var maxDistance = 2;
            var maxDistanceLimit = Gparams.shortestPathMaxDistanceTest;
            var data = {};


            async.doWhilst(function (callback) {

                    graphTraversalQueries.getAllSimplePaths(self.context.source.id, self.context.target.id, maxDistance, algo, function (err, result) {
                        if (err) {
                            console.log(err)
                            return err;
                        }
                        data = result;
                        maxDistance++;
                        return callback(null, data);

                    })
                }, function () {//test
                    if (data.length == 0 && maxDistance < maxDistanceLimit)
                        return true;
                    return false;

                },
                function (resp) {// at the end
                    self.context.currentDistance = maxDistance - 1;
                    currentDisplayType = "VISJS-NETWORK";
                    visjsGraph.draw("graphDiv", connectors.neoResultsToVisjs(data));
                    // filters.initGraphFilters(data);
                    if (data.length == 0) {
                        return $("#shortestPathDistance").text("No shortest path found under maximum distance allowed (" + Gparams.shortestPathMaxDistanceTest + ")");
                    }

                    $("#shortestPathDistance").text("ShortestPath between " + self.context.source.name + " and " + self.context.target.name + " distance : " + (maxDistance - 1));
                /*    $( "#tabs-controlPanel" ).tabs( "option", "disabled", [] );
                    $("#tabs-controlPanel").tabs( "enable", 1);
                    $("#tabs-controlPanel").tabs( "enable", 2);*/
                    setTimeout(function () {
                        visjsGraph.paintNodes(["" + self.context.source.id, "" + self.context.target.id], "red", null, 10)
                     //   $("#executeMoreShortestPathButton").css("visibility", "visible")
                        //  visjsGraph.outlinePathNodes();

                    }, 1000)
                })
        }


        self.executeTraversalSearch = function () {

            if (self.context.source.type == "node" && self.context.target.type == "node") {
                var algo = "allSimplePaths"// $("#graphPathsAlgorithm").val();
                graphTraversalQueries.getAllSimplePaths(self.context.source.id, self.context.target.id, self.context.currentDistance, algo, function (err, data) {
                    if (err) {
                        console.log(err)
                        return err;
                    }

                    currentDisplayType = "VISJS-NETWORK";

                    $("#shortestPathDistance").text("Pathes between " + self.context.source.name + " and " + self.context.target.name + " distance : " +  self.context.currentDistance)
                    visjsGraph.draw("graphDiv", connectors.neoResultsToVisjs(data));
                    filters.initGraphFilters(data);
                 /*   $( "#tabs-controlPanel" ).tabs( "option", "disabled", [] );
                    $("#tabs-controlPanel").tabs( "enable", 1);
                    $("#tabs-controlPanel").tabs( "enable", 2);*/
                    setTimeout(function () {
                        visjsGraph.paintNodes("" + [self.context.source.id, "" + self.context.target.id], "red", null, 10);

                    }, 1000)


                })


            }
        }
        /* self.cancelMenu = function () {
             $("#dialog").html("");
             $("#dialog").dialog("close");

         }*/

        return self;
    }
)
()