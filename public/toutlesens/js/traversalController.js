/**
 * Created by claud on 19/11/2017.
 */

var traversalController = (function () {

        var self = {};
        self.startObject = {};
        self.endObject = {};
        self.context = {
            start: {},
            end: {},
            currentNode: "",
            currentDistance: 0,
            pathType: ''
        }

        /**
         *
         * in path context when click on jtree node set self.context for nodes (start and end)
         *
         *
         * @param stage
         * @param data
         */

        self.setTraversalNode = function (stage, data) {
            var nodeName = data[Gparams.defaultNodeNameProperty];
            var obj= {id: data.neoId, type: "node", name: nodeName,label:data.label}
            if (stage == 'source') {
                $("#pathes_sourceNode").html(nodeName);
                traversalController.context.start =obj;

            }
            if (stage == 'target') {
                $("#pathes_targetNode").html(nodeName);
                traversalController.context.end =obj;
            }

            if (traversalController.context.start.id && traversalController.context.end.id) {

                if (toutlesensController.currentActionObj.type == 'allTransitivePaths') {
                    var str = " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.setEndLabelQuery({clusterIntermediateNodes:1})\">Graph only start and end</button><br>";
                    str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.setEndLabelQuery({})\">Graph all nodes</button>";

                    $("#pathes_buttonsDiv").html(str);

                } else if (toutlesensController.currentActionObj.type == 'allTransitivePaths') {
                    var str = $("#executeShortestPathButton").css("visibility", "visible")
                    " <button onclick=\"traversalController.executePathesUI()\"id=\"executeShortestPathButton\" style=\"visibility:hidden\">Search";
                    $("#pathes_buttonsDiv").html(str);
                }

            }

            var nodeDivDetach = $("#nodeDivDetachable").detach();
            $("#nodeDiv").append(nodeDivDetach);
            $('#word').val('')
        }
        /**
         *
         * set queryObj in self.context for startNode
         *
         *
         *
         */

        self.setStartLabelQuery = function () {

            advancedSearch.searchNodes("matchObject", function (queryObj) {
                traversalController.context.start.queryObj = queryObj;
                $("#dialog").dialog("close");
                $("#pathes_sourceNode").html(JSON.stringify(queryObj));
                graphicController.startLabel=queryObj.nodelabel;

                $("#waitImg").css("visibility", "hidden")
            })
        }

        self.setEndLabelQuery = function (options) {
            if (!options) {
                options = {};
            }
            advancedSearch.searchNodes("matchObject", function (queryObj) {
                traversalController.context.end.queryObj = queryObj;
                $("#pathes_targetNode").html(JSON.stringify(queryObj));

                $("#dialog").dialog("close");
                traversalController.searchAllTransitiveNodes(options);
            })
        }


        self.showSearchMenu = function (target) {
            var pathType = $("#pathType").val();
            advancedSearch.context = {pathType: pathType, target: target}
            toutlesensController.currentActionObj = {type: pathType, stage: target}
            toutlesensController.setRightPanelAppearance(true);
            var nodeDivDetach = $("#nodeDivDetachable").detach();
            $("#traversalFindDiv").append(nodeDivDetach);
            $("#word").focus();


        }


        /*  self.executeMoreOrLessShortestPathTraversalSearch = function (less) {
              if (less)
                  self.context.currentDistance--;
              else {
                  $("#executeLessShortestPathButton").css("visibility", "visible")
                  var maxDistanceLimit = Gparams.shortestPathMaxDistanceTest;
                  self.context.currentDistance++;
                  if (self.context.currentDistance > maxDistanceLimit)
                      return $("#shortestPathDistance").text("max distance reached " + maxDistanceLimit);
              }
              self.drawPathes();

          };*/

        /**
         *
         * dispatch path query depending of type :shortest, all transitive...
         *
         */

        self.executePathesUI = function () {
            toutlesensData.queriesIds = [];
            var pathType = $("#pathType").val();
            if (pathType == "shortestPath") {
                self.context.currentDistance = 20;
                self.drawPathes(pathType)
            }
            else if (pathType == "allSimplePaths") {
                self.drawMinDistancePathes()
            }
            else if (pathType == "allTransitivePaths") {
                self.searchAllTransitiveNodes()
            }

        }

        self.searchAllTransitiveNodes = function (options) {

            var where = "";
            if (self.context.start.queryObj) {//pathes with search query
                self.context.start.label = self.context.start.queryObj.nodelabel;
                self.context.end.label = self.context.end.queryObj.nodelabel;

                where = self.context.start.queryObj.where;
                if (self.context.end.queryObj.where != "") {

                    if (where != "")
                        where += " and ";
                    where += self.context.end.queryObj.where.replace(/n\./, "m.");
                }

            } else {//pathes between two nodes
                where = " ID(n)=" + self.context.start.id + " and ID(m)=" + self.context.end.id
            }
            toutlesensData.whereFilter = where;


            var relCardinality = Schema.getLabelsDistance(self.context.start.label, self.context.end.label);
            if (relCardinality < 0)
                return console.log("no cardinality found between " + self.context.start.label + " and" + self.context.end.label)
            toutlesensData.matchStatement = "(n:" + self.context.start.label + ")-[r*" + relCardinality + "]-(m:" + self.context.end.label + ")";


            $("#cypherDialog_matchInput").val(toutlesensData.matchStatement);
            $("#cypherDialog_whereInput").val(toutlesensData.whereFilter);
            toutlesensController.setRightPanelAppearance(true)
            //   $("#findTabs").tabs("option", "active", 3);
            //   $("#advancedQueriesAccordion").tabs("option", "active", 4);

            var _options = {dragConnectedNodes: true};
            if (relCardinality > 1 && options.clusterIntermediateNodes)
                _options.clusterIntermediateNodes = true;


            toutlesensController.generateGraph(null, _options);
            //  $("#shortestPathDistance").text("All transitive pathes between " + self.context.start.name + " and " + self.context.end.name )
            var nodeDivDetach = $("#nodeDivDetachable").detach();
            $("#nodeDiv").append(nodeDivDetach);


        }


        self.drawMinDistancePathes = function () {
            var algo = "allSimplePaths"// $("#graphPathsAlgorithm").val();
            var maxDistance = 2;
            var maxDistanceLimit = Gparams.shortestPathMaxDistanceTest;
            var data = {};


            async.doWhilst(function (callback) {

                    graphTraversalQueries.getPathes(self.context.start.id, self.context.end.id, maxDistance, algo, function (err, result) {
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
                    //  var data
                    visjsGraph.draw("graphDiv", connectors.neoResultsToVisjs(data));
                    toutlesensController.setRightPanelAppearance();
                    filters.init(data);

                    if (data.length == 0) {
                        return $("#shortestPathDistance").text("No shortest path found under maximum distance allowed (" + Gparams.shortestPathMaxDistanceTest + ")");
                    }

                    $("#shortestPathDistance").text("ShortestPath between " + self.context.start.name + " and " + self.context.end.name + " distance : " + (maxDistance - 1));

                })
        }


        self.drawPathes = function (algo) {


            if (self.context.start.type == "node" && self.context.end.type == "node") {

                graphTraversalQueries.getPathes(self.context.start.id, self.context.end.id, self.context.currentDistance, algo, function (err, data) {
                    if (err) {
                        console.log(err)
                        return err;
                    }

                    currentDisplayType = "VISJS-NETWORK";

                    $("#shortestPathDistance").text("Pathes between " + self.context.start.name + " and " + self.context.end.name + " distance : " + self.context.currentDistance)

                    visjsGraph.draw("graphDiv", connectors.neoResultsToVisjs(data));
                    toutlesensController.setRightPanelAppearance();
                    filters.init(data);


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