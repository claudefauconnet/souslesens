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

        var currentTransitivityLevel = null;

        /**
         *
         * in path context when click on jtree node set self.context for nodes (start and end)
         *
         *
         * @param stage
         * @param data
         */

        self.setTraversalNode = function (stage, data) {
            $("#traversalFindDiv").css("visibility", "visible");
            var nodeName = data[Gparams.defaultNodeNameProperty];
            var obj = {id: data.neoId, type: "node", name: nodeName, label: data.label}
            if (stage == 'source') {
                $("#pathes_sourceNode").html(nodeName);
                traversalController.context.start = obj;

            }
            if (stage == 'target') {
                $("#pathes_targetNode").html(nodeName);
                traversalController.context.end = obj;
            }

            if (traversalController.context.start.id && traversalController.context.end.id) {

                if (toutlesensController.currentActionObj.type == 'allTransitivePaths') {
                    var str = " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.setEndLabelQuery({clusterIntermediateNodes:1})\">Graph only start and end</button><br>";
                    str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.setEndLabelQuery({})\">Graph all nodes</button>";

                    $("#pathes_buttonsDiv").html(str);

                } else if (toutlesensController.currentActionObj.type == 'shortestPath') {
                    var str =" <button onclick=\"traversalController.executePathesUI()\"id=\"executeShortestPathButton\" style=\"visibility:visible\">Search</button>";
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

            advancedSearch.searchNodes("matchObject", function (err, queryObj) {
                if (err)
                    return console.log(err)
                traversalController.context.start.queryObj = queryObj;
                $("#dialog").dialog("close");
                $("#pathes_sourceNode").html(JSON.stringify(queryObj));
                graphicController.startLabel = queryObj.nodelabel;

                $("#waitImg").css("visibility", "hidden")
                $("#traversalFindDiv").css("visibility", "hidden");
            })
        }

        self.setEndLabelQuery = function () {
            var str = "";
            str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.execTransitivePathQuery({clusterIntermediateNodes:1})\">Graph only start and end</button>";
            str += " <button id=\"advancedSearchDialog_searchButton\" onclick=\"traversalController.execTransitivePathQuery({})\">Graph all nodes</button>";
            $("#pathes_buttonsDiv").html(str);
            $("#traversalFindDiv").css("visibility", "hidden");
            $("#dialog").dialog("close");
        }


        self.execTransitivePathQuery = function (options) {
            if (!options) {
                options = {};
            }
            advancedSearch.searchNodes("matchObject", function (err, queryObj) {
                if (err)
                    return console.log(err)
                traversalController.context.end.queryObj = queryObj;
                $("#pathes_targetNode").html(JSON.stringify(queryObj));

                $("#dialog").dialog("close");
                traversalController.searchAllTransitiveNodes(options);
                $("#traversalFindDiv").css("visibility", "hidden");
            })
        }


        self.showSearchMenu = function (target) {
            $("#traversalFindDiv").css("visibility", "visible");
            var pathType = $("#pathType").val();
            advancedSearch.context = {pathType: pathType, target: target};
            toutlesensController.currentActionObj = {type: pathType, stage: target}
            if(pathType=="shortestPath") {

                toutlesensController.setRightPanelAppearance(true);
                var nodeDivDetach = $("#nodeDivDetachable").detach();
                $("#traversalFindDiv").append(nodeDivDetach);
                $("#word").focus();
            }
            else    if(pathType=="allTransitivePaths") {
                advancedSearch.showDialog({multipleClauses:true});
            }

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
            var transitivityLevel;
            if (options=="incrementTransitivityLevel") {
                transitivityLevel =currentTransitivityLevel+1;
            }
            else if (options=="decrementTransitivityLevel") {
                transitivityLevel =currentTransitivityLevel-1;
            }
            else {
                 transitivityLevel = Schema.getLabelsDistance(self.context.start.label, self.context.end.label);
                if (!transitivityLevel)
                    transitivityLevel = 1;

            }
            currentTransitivityLevel = transitivityLevel;

            /*   if (relCardinality < 0)
                   return console.log("no cardinality found between " + self.context.start.label + " and" + self.context.end.label)*/

            var dataAsync = [];
            var maxDistanceLimit = Gparams.shortestPathMaxDistanceTest;
            async.doWhilst(function (callback) {

                    var startLabelStr = "";
                    if (self.context.start.label && self.context.start.label.length > 0)
                        startLabelStr = ":" + self.context.start.label;
                    var endLabelStr = "";
                    if (self.context.end.label && self.context.end.label.length > 0)
                        endLabelStr = ":" + self.context.end.label;


                    toutlesensData.matchStatement = "(n" + startLabelStr + ")-[r*" + transitivityLevel + "]-(m" + endLabelStr + ")";

                    $("#cypherDialog_matchInput").val(toutlesensData.matchStatement);
                    $("#cypherDialog_whereInput").val(toutlesensData.whereFilter);
                    $("#shortestPathDistance").html("Transitivity level :" + transitivityLevel)


                    var _options = {dragConnectedNodes: true};
                    if (transitivityLevel > 1 && options.clusterIntermediateNodes)
                        _options.clusterIntermediateNodes = true;


                    toutlesensController.generateGraph(null, _options, function (err, data) {
                        if (err)
                            return err;
                        dataAsync = data;
                        return callback();

                    })
                }, function () {//test
                    if (dataAsync.length == 0 && transitivityLevel >= maxDistanceLimit) {
                        $("#shortestPathDistance").html("No relations found until Transitivity level :" + transitivityLevel);
                        return true;
                    } else {
                        var str="";
                        if(transitivityLevel>1)
                            str += "&nbsp;<button onclick='traversalController.searchAllTransitiveNodes(\"decrementTransitivityLevel\")'>decrease</button>"
                         str += "&nbsp;<button onclick='traversalController.searchAllTransitiveNodes(\"incrementTransitivityLevel\")'>increase</button>"

                        $("#shortestPathDistance").html("Transitivity level :" + transitivityLevel+ str);
                        return false;
                    }


                },
                function (resp) {// at the end

                    var nodeDivDetach = $("#nodeDivDetachable").detach();
                    $("#nodeDiv").append(nodeDivDetach);
                    toutlesensController.setRightPanelAppearance(false)
                })


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

                  //  $("#shortestPathDistance").text("Pathes between " + self.context.start.name + " and " + self.context.end.name + " distance : " + self.context.currentDistance)

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