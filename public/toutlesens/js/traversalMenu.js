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
            self.drawPathes();

        };



    self.executePathesUI = function () {
        toutlesensData.queriesIds=[];
        var pathType=$("#pathType").val();
        if(pathType=="shortestPath"){
            self.context.currentDistance=20;
            self.drawPathes(pathType)
        }
        else if(pathType=="allSimplePaths"){
            self.drawMinDistancePathes()
        }

    }




        self.drawMinDistancePathes = function () {
            var algo = "allSimplePaths"// $("#graphPathsAlgorithm").val();
            var maxDistance = 2;
            var maxDistanceLimit = Gparams.shortestPathMaxDistanceTest;
            var data = {};


            async.doWhilst(function (callback) {

                    graphTraversalQueries.getPathes(self.context.source.id, self.context.target.id, maxDistance, algo, function (err, result) {
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
                    toutlesensController.setFindPanelExpandTree();
                    filters.init(data);

                    if (data.length == 0) {
                        return $("#shortestPathDistance").text("No shortest path found under maximum distance allowed (" + Gparams.shortestPathMaxDistanceTest + ")");
                    }

                    $("#shortestPathDistance").text("ShortestPath between " + self.context.source.name + " and " + self.context.target.name + " distance : " + (maxDistance - 1));

                })
        }






        self.drawPathes = function (algo) {


            if (self.context.source.type == "node" && self.context.target.type == "node") {

                graphTraversalQueries.getPathes(self.context.source.id, self.context.target.id, self.context.currentDistance, algo, function (err, data) {
                    if (err) {
                        console.log(err)
                        return err;
                    }

                    currentDisplayType = "VISJS-NETWORK";

                    $("#shortestPathDistance").text("Pathes between " + self.context.source.name + " and " + self.context.target.name + " distance : " +  self.context.currentDistance)

                    visjsGraph.draw("graphDiv", connectors.neoResultsToVisjs(data));
                    toutlesensController.setFindPanelExpandTree();
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