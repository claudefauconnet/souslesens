/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

var toutlesensData = (function () {
        var self = {};
        self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;

        var navigationPath = [];
        self.cachedResultArray = null;
        self.cachedResultTree = null;
        self.queryExcludeRelFilters = "";
        self.querynodeLabelFilters = "";
        self.queryRelTypeFilters = "";
        self.queryExcludeNodeFilters = "";
        self.whereFilter = "";
        self.matchStatement = null;
        self.currentStatement = null;

        self.queriesIds = [];


        self.standardReturnStatement = " RETURN EXTRACT(rel IN relationships(path) | type(rel)) as rels," +
            "EXTRACT(rel IN relationships(path) | rel)  as relProperties," +
            "nodes(path) as nodes," +//   !!!!!!!!!!!!!!!!!!!!! a voir pour alléger les données transmises
            //   "EXTRACT(node IN nodes(path) | node.subGraph) as nodes,"+   !!!!!!!!!!!!!!!!!!!!! a voir pour alléger les données transmises
            " EXTRACT(node IN nodes(path) | ID(node)) as ids," +
            " EXTRACT(node IN nodes(path) | labels(node)) as labels "
            + ", EXTRACT(rel IN relationships(path) | labels(startNode(rel))) as startLabels";


        self.executeNeoQuery = function (queryType, str, successFunction) {

            currentQueryType = queryType;
            if (str.indexOf("DELETE") < 0 && str.toLowerCase().indexOf("limit ") < 0) {
                str += " limit " + limitResult;
            }

            if (queryType == QUERY_TYPE_MATCH) {
                var payload = {match: str};


            }
            var queryStr = JSON.stringify(payload);
            if (Gparams.logLevel > 1)
                console.log("QUERY----" + queryStr);
            $("#neoQueriesTextArea").val(queryStr);
            $("#neoQueriesHistoryId").prepend(queryStr + "<br><br>");
            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {

                    currentDataStructure = "flat";
                    //  toutlesensData.cachedResultArray = data;
                    if (!data || data.length == 0) {
                        toutlesensController.setMessage("No results", "green");
                        $("#waitImg").css("visibility", "hidden");
                        return;
                    }
                    var errors = data.errors;

                    if (errors && errors.length > 0) {
                        var str = "ERROR :";
                        for (var i = 0; i < errors.length; i++) {
                            str += errors[i].code + " : " + errors[i].message + "<br>"

                        }
                        toutlesensController.setMessage(str, red);
                        return;
                    }

                    if ($.isArray(data)) {// labels...
                        if (successFunction) {
                            successFunction(data);
                            return;
                        } else
                            return data;
                    }

                    var results = data.results;

                    if (results && results.length > 0) {// } && results[0].data.length >
                        // 0) {// match..
                        toutlesensController.completeResult(results);
                        if (successFunction) {
                            successFunction(results);
                            return;
                        } else {
                            return results;
                        }

                    } else {

                        toutlesensController.setMessage("No results", blue);
                        $("#waitImg").css("visibility", "hidden");


                        return -1;
                    }

                },
                error: function (xhr, err, msg) {
                    toutlesensController.onErrorInfo(xhr)
                },

            });

        }

        self.getNodeAllRelations = function (id, options, callback) {
            if (!options.addToPreviousQuery) {
                self.queriesIds = [];
                self.cachedResultArray = [];
            }
            self.queriesIds.push(id)
            var hasMclause = false;
            excludedLabels = [];
            currentRootId = Math.abs(id);
            legendnodeLabels = {}
            legendRelTypes = {};

            //*******************************************************where***********************************************
            var subGraphWhere;
            if (subGraph)
                subGraphWhere = "  n.subGraph=\"" + subGraph + "\" "

            var whereStatement = "";
            if (id && self.whereFilter.indexOf("ID(n)") < 0) {

                if (id > 0) {
                    whereStatement = " WHERE (ID(n)=" + id + ")";//+" OR  ID(m)="+id+")"
                    hasMclause = false;
                }
                else {
                    hasMclause = true;
                    whereStatement = " WHERE (ID(m)=" + (-id) + ")";

                }
            }
            if (subGraphWhere) {
                if (whereStatement.length > 0)
                    whereStatement += " AND ";
                else
                    whereStatement += " WHERE ";
                whereStatement += subGraphWhere;

            }
            if (self.whereFilter != "") {
                if (whereStatement == "")
                    whereStatement += " WHERE ";
                else
                    whereStatement += " AND ";
                whereStatement += self.whereFilter + " ";
            }

            //*******************************************************return***********************************************
            var returnStatement;
            if (options.output == "filtersDescription") {
                returnStatement = " RETURN count(r) as nRels, COLLECT( distinct EXTRACT( rel IN relationships(path) |  type(rel))) as rels,EXTRACT( node IN nodes(path) | labels(node)) as labels"
            }
            else {
                returnStatement = self.standardReturnStatement;
            }
            if (options.additionnalReturnStatement)
                returnStatement += ", " + options.additionnalReturnStatement;

            var node1Label = "";
            if (false && currentLabel)
                node1Label = ":" + currentLabel;

            var node2Label = "";
            if (currentLabel)
                node2Label = ":" + currentLabel;


            //*******************************************************match***********************************************

            var matchStatement;
            if (self.matchStatement)
                matchStatement = self.matchStatement;
            else {



                // http://graphaware.com/graphaware/2015/05/19/neo4j-cypher-variable-length-relationships-by-example.html
                var relCardinalityStr = "";

                if (options.relationDepth && options.relationDepth > 1)
                    relCardinalityStr = "*.." + options.relationDepth;
                else {
                    if (options.hideNodesWithoutRelations)
                        relCardinalityStr = "*..1";
                    else
                        relCardinalityStr = "*0..1";

                }

                var matchStatement = "(n" + node1Label
                    + ")-[r"
                    + toutlesensData.queryRelTypeFilters
                    + relCardinalityStr
                    + "]-(m" + node2Label + ") "

            }


            //*******************************************************Global query***********************************************
            var statementBase = "MATCH path="
                + matchStatement
                + whereStatement
                + graphQueryTargetFilter
                + toutlesensData.querynodeLabelFilters
                + toutlesensData.queryExcludeNodeFilters
                + toutlesensData.queryExcludeRelFilters

            graphQueryUnionStatement = "";


            var statement = statementBase + returnStatement;

            if (toutlesensController.currentActionObj.mode == "filter" || statement.indexOf("-(m)") > -1)
                hasMclause = true;


            /*  if (Gparams.allowOrphanNodesInGraphQuery && hasMclause == false)
                  graphQueryUnionStatement = " MATCH path=(n" + node1Label + ") "// for nodes without relations
                      + whereStatement
                      + graphQueryTargetFilter
                      + toutlesensData.querynodeLabelFilters
                      + toutlesensData.queryExcludeNodeFilters
                      + toutlesensData.queryExcludeRelFilters;


              if (graphQueryUnionStatement)
                  statement += " UNION " + graphQueryUnionStatement + returnStatement.replace("count(r)", 0);*/

            var limit = Gparams.maxResultSupported;

            if (options.limit)
                limit = options.limit;
            statement += " limit " + limit;

            if (Gparams.logLevel > 0) {
                if (statement.length > 500)
                    console.log(statement.substring(0, 500) + "...");
                else
                    console.log(statement);
            }


            if (options.useCurrentStatement && self.currentStatement) {
                var p = self.currentStatement.indexOf("WHERE")
                if (p > -1 && self.whereFilter.length > 0) {
                    statement = self.currentStatement.substring(0, p) + " " + self.whereFilter + " " + self.currentStatement.substring(p + 1);

                }


            } else
                self.currentStatement = statement;


            toutlesensData.querynodeLabelFilters = "";
            toutlesensData.queryRelTypeFilters = "";
            toutlesensData.queryExcludeNodeFilters = "";
            toutlesensData.queryExcludeRelFilters = "";
            toutlesensData.matchStatement = ""


            var payload = {match: statement};

            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {

                    if (data.length == 0 && options.addToPreviousQuery) {
                        data = [];
                    }
                    else if (data.length == 0) {

                        if (id == null) {
                            return callback(null, []);
                        }
                        if (id > -1)// we retry with inverse relation
                            self.getNodeAllRelations(-id, options, callback);
                        else {
                            id = -id;
                            return callback(null, []);
                        }

                    }
                    if (data.length / 2 >= Gparams.maxResultSupported / 2) {// query too get the real number of relations
                        var matchStr = "MATCH path=(n)-[r]->(m) " + statementBase.substring(statementBase.indexOf("WHERE")) + "return count(r) as countRel;"
                        var payload = {
                            match: matchStr
                            // match: "MATCH path=(n)-[r]->(m) "+ self.getCurrentWhereClause() + "return count(r) as countRel;"
                        }


                        $.ajax({
                            type: "POST",
                            url: self.neo4jProxyUrl,
                            data: payload,
                            dataType: "json",
                            success: function (data, textStatus, jqXHR) {
                                var message = "<br><span class='importantMessage'>" + data[0].countRel + "  relations in the graph only " + Gparams.maxResultSupported + " are currently displayed</span> "
                                message += "<a href='javascript:toutlesensController.increaseGraphLimit()'>increase Graph display limit</a> (display wil be slower)";
                                message += "<br> <a href='$(\"#propertiesSelectionDialog_NodeLabelInput\").val(\"\");javascript:advancedSearch.showDialog()'>or set a filter on nodes or relations</a>";

                                $("#graphCommentDiv").html(message);
                            }
                        })
                    }


                    if (options.output == "filtersDescription") {

                        return callback(null, data);

                    }


                    currentDataStructure = "flat";
                    var resultArray = data;
                    // data.log(JSON.stringify(resultArray))
                    if (true || addToPreviousQuery && self.cachedResultArray) {
                        for (var i = 0; i < resultArray.length; i++) {
                            for (var j = 0; j < resultArray[i].nodes.length; j++) {
                                var id = resultArray[i].nodes[j]._id;
                                if (self.queriesIds.indexOf(id) > -1)
                                    resultArray[i].nodes[j].outline = true;

                                /* var relTargetId=resultArray[i].ids[resultArray[i].rels.length-1];
                                  var relSourceId=resultArray[i].ids[0];
                                  if( self.queriesIds.indexOf(relSourceId)>-1){
                                      resultArray[i].outlineRel = true;
                                  }*/

                            }

                        }
                        if (resultArray && toutlesensData.cachedResultArray)
                            resultArray = $.merge(resultArray, toutlesensData.cachedResultArray);
                        else if(toutlesensData.cachedResultArray)
                            resultArray = toutlesensData.cachedResultArray

                    }

                    toutlesensData.cachedResultArray = resultArray;
                    return callback(null, resultArray)

                },
                error: function (xhr, err, msg) {
                    toutlesensController.onErrorInfo(xhr)
                    return (err);
                }

            });


        }
        self.getCurrentWhereClause = function () {
            if (!self.currentStatement)
                return "";
            var p = self.currentStatement.indexOf("WHERE")
            var q = self.currentStatement.indexOf(" RETURN")
            if (p > -1 && q > -1)
                return self.currentStatement.substring(p, q);
            return "";

        }
        self.setSearchByPropertyListStatement = function (property, idsList, callback) {
            var ids;

            if (typeof idsList == "string")
                ids = idsList.split(",");
            else
                ids = idsList;

            var query = "n." + property + " in ["
            if (property == "_id")
                query = "ID(n) in ["

            for (var i = 0; i < ids.length; i++) {
                if (i > 0 && i < ids.length)
                    query += ","
                query += ids[i];
            }
            query += "] ";
            toutlesensData.whereFilter = query;
            callback(null, []);

        }

        self.getPathes = function (startId, endId, depth, algo, callback) {


            var body = '{ "to":"' + endId + '","max_depth":' + depth + ',"algorithm":"'
                + algo + '"}';
            var urlSuffix = "/db/data/node/" + startId + "/paths";
            var paramsObj = {
                cypher: 1,
                mode: "POST",
                urlSuffix: urlSuffix,
                payload: body,
            }
            console.log(JSON.stringify(paramsObj), "null", 2);

            console.log(urlSuffix);
            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: paramsObj,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    if (!data || data.length == 0) {
                        $("#waitImg").css("visibility", "hidden");
                        return callback("No result")
                    }
                    if (data.length > Gparams.maxResultSupported) {

                        return callback("trop de resultats "
                            + data.length
                            + " pour dessiner le graphe.Modifiez les parametres")

                    }

                    var RelIds = [];

                    for (var i = 0; i < data.length; i++) {
                        for (var j = 0; j < data[i].relationships.length; j++) {

                            var str = data[i].relationships[j];
                            var id = parseInt(str.substring(str.lastIndexOf("/") + 1));

                            RelIds.push(id);

                        }
                    }
                    callback(null, RelIds);

                    // self.processPathResults(data,callback);
                },
                error: function (xhr, err, msg) {
                    toutlesensController.onErrorInfo(xhr)
                    callback(err)
                },

            });

        }


        self.collapseResult = function (resultArray) {
            //   toutlesensController.collapseTargetLabels=[]//["cote"];
            var resultArrayTransitive = [];
            for (var k = 0; k < toutlesensController.collapseTargetLabels.length; k++) {
                var targetLabel = toutlesensController.collapseTargetLabels[k];
                for (var i = 0; i < resultArray.length; i++) {
                    var rels = resultArray[i].rels;
                    var nodes = resultArray[i].nodes;
                    var ids = resultArray[i].ids;
                    var labels = resultArray[i].labels;
                    var startNodes = resultArray[i].startLabels;
                    var relProperties = resultArray[i].relProperties;
                    var toRemoveNodesIndexes = [];
                    for (var j = 1; j < nodes.length; j++) {
                        nodeLabels = nodes[j].labels;
                        if (nodeLabels[0] != targetLabel) {
                            toRemoveNodesIndexes.push(j);
                        }
                    }
                    if (toRemoveNodesIndexes.length == 0)// none node  with target label in path
                        continue;

                    for (var j = 1; j < nodes.length; j++) {
                        if (toRemoveNodesIndexes.indexOf(j) < 0) {
                            var obj = {
                                rels: ["transitiveRelation"],
                                nodes: [nodes[0], nodes[j]],
                                ids: [ids[0], ids[j]],
                                labels: [labels[0], labels[j]],
                                startNodes: [startNodes[j]],
                                relProperties: [{
                                    properties: {type: "transitiveRelation", _fromId: ids[0], _id: -9999, _toId: ids[j]}
                                }]
                            }
                            resultArrayTransitive.push(obj);
                        }

                    }


                }


            }
            toutlesensController.collapseTargetLabels = [];
            if (resultArrayTransitive.length > 0)
                return resultArrayTransitive;
            else
                return resultArray;
        }
        self.prepareRawData = function (resultArray, addToPreviousQuery, output, callback) {
            totalNodesToDraw = resultArray.length;
            /*   if (currentDisplayType != "SIMPLE_FORCE_GRAPH_BULK" && totalNodesToDraw >= Gparams.maxResultSupported) {
                   toutlesensController.setGraphMessage("trop de resultats pour dessiner le graphe.Modifiez les parametres : > maximum "
                       + Gparams.maxResultSupported, "stop");
                   return;

               }*/


            var labels = [];
            var relations = [];

            for (var i = 0; i < resultArray.length; i++) {
                if (!resultArray[i].nodes) // !!!!bug à trouver
                    continue;
                for (var j = 0; j < resultArray[i].nodes.length; j++) {
                    /*   if(!resultArray[i].nodes[j].properties)
                           resultArray[i].nodes[j]["properties"]={a:1};*/
                    if (resultArray[i].nodes[j].properties.nom && !resultArray[i].nodes[j].properties.name)
                        resultArray[i].nodes[j].properties.name = resultArray[i].nodes[j].properties.nom;
                }

                if (!resultArray[i].labels) // !!!!bug à trouver
                    continue;
                for (var j = 0; j < resultArray[i].labels.length; j++) {
                    var label = resultArray[i].labels[j][0];
                    if (labels.indexOf(label) < 0)
                        labels.push(label)
                }
                if (!resultArray[i].rels) // !!!!bug à trouver
                    continue;
                for (var j = 0; j < resultArray[i].rels.length; j++) {
                    var relation = resultArray[i].rels[j];
                    if (relations.indexOf(relation) < 0)
                        relations.push(relation)
                }
            }

            if (!output)
                output = currentDisplayType;
            var json;

            if (output == "SIMPLE_FORCE_GRAPH" || output == "SIMPLE_FORCE_GRAPH_BULK" || output == "VISJS-NETWORK") {
                totalNodesToDraw = resultArray.length;
                json = resultArray;
            }
            else//tree structure
                json = self.toFlareJson(resultArray, addToPreviousQuery);

            if (navigationPath.length > 0)
                exploredTree = json;
            else
                exploredTree = null;

            callback(null, json, labels, relations);


        }
        self.buildForceNodesAndLinks = function (resultArray) {
            //  console.log("----------------------");
            //    console.log(JSON.stringify(resultArray[0], null, 2))


            currentDataStructure = "flat";
            if (resultArray.currentActionObj)
                currentActionObj = resultArray.currentActionObj;
            var nodesMap = {};
            var links = [];
            var linksMap = {}
            var linkId = 1000;
            legendRelTypes = {};
            legendnodeLabels = {}
            var nodeIndex = 0;
            var maxLevels = parseInt($("#depth").val());
            var previousId;
            for (var i = 0; i < resultArray.length; i++) {
                var rels = resultArray[i].rels;
                var relProperties = resultArray[i].relProperties;

                var nodes = resultArray[i].nodes;
                if (!nodes)
                    continue;

                var ids = resultArray[i].ids;
                var legendRelIndex = 1;

                for (var j = 0; j < nodes.length; j++) {

                    var nodeNeo = nodes[j].properties;
                    labels = nodes[j].labels;
                    var nodeObj = {
                        name: nodeNeo[Gparams.defaultNodeNameProperty],

                        myId: nodeNeo.id,
                        label: nodes[j].labels[0],
                        id: nodes[j]._id,
                        children: [],
                        neoAttrs: nodeNeo,
                        rels: [],
                        invRels: [],
                        nLinks: 0


                    }
                    if (!legendnodeLabels[nodeObj.label]) {
                        legendnodeLabels[nodeObj.label] = {
                            label: nodeObj.label
                        }
                    }
                    if (!legendRelTypes[rels[j]]) {
                        legendRelTypes[rels[j]] = {
                            type: rels[j],

                        }
                    }

                    if (nodes[j].decoration)
                        nodeObj.decoration = nodes[j].decoration;

                    if (!isAdvancedSearchDialogInitialized && j > maxLevels) {// noeud cachés au dernier niveau
                        if (!nodesMap[previousId].hiddenChildren)
                            nodesMap[previousId].hiddenChildren = []
                        nodesMap[previousId].hiddenChildren.push(nodeObj);
                        continue
                    }

                    if (!nodesMap[nodeObj.id]) {

                        nodeObj.nodeIndex = nodeIndex++;
                        nodesMap[nodeObj.id] = nodeObj;
                        previousId = nodeObj.id;


                    }


                    var indexSource = 0;
                    var indexTarget = 0;

                    if (j > 0) {// rels

                        if (filters.postFilter) {
                            if (filters.postFilter.filterOnProperty) {
                                if (!relProperties[j - 1].properties[filters.postFilter.filterOnProperty]) {
                                    continue;
                                }


                            }
                        }
                        indexSource = nodesMap[ids[j - 1]].nodeIndex;
                        indexTarget = nodesMap[ids[j]].nodeIndex;
                        nodeObj.relType = rels[j - 1];
                        var rel = {source: indexSource, target: indexTarget, id: linkId++};
                        //nodesMap[nodeObj.id].links.push(rel);
                        links.push(rel)
                        linksMap[linkId] = {source: indexSource, target: indexTarget};
                        nodesMap[ids[j]].rels.push(rel.id);
                        nodesMap[ids[j - 1]].invRels.push(rel.id);
                        nodesMap[ids[j]].nLinks++;
                        nodesMap[ids[j - 1]].nLinks++;


                        nodeObj.parent = ids[j - 1];

                        /*   if (labels[j - 1] && dataModel.relations[labels[j - 1]]) {
                               var modelRels = dataModel.relations[labels[j - 1][0]];
                               if (modelRels && modelRels.length) {
                                   for (var k = 0; k < modelRels.length; k++) {
                                       if (modelRels[k].label2 == nodeObj.label) {
                                           nodeObj.relDir = modelRels[k].direction;

                                           break;
                                       }
                                   }
                               }
                           }*/
                    }
                    else {
                        //nodeObj.isRoot=true;
                    }

                    if (nodeNeo.isRoot || nodes[j].isRoot)
                        nodeObj.isRoot = true;
                    if (nodeNeo.isSource || nodes[j].isSource)
                        nodeObj.isSource = true;
                    if (nodeNeo.isTarget || nodes[j].isTarget)
                        nodeObj.isTarget = true;
                    if (!nodeNeo.isRoot && currentObject && currentObject.id == nodeObj.id)
                        nodeObj.isRoot = true;
                    if (currentActionObj && currentActionObj.graphPathSourceNode && currentActionObj.graphPathSourceNode.nodeId && currentActionObj.graphPathSourceNode.nodeId == nodeObj.id) {
                        nodeObj.isRoot = true;
                        nodeObj.isSource = true;
                    }

                    if (currentActionObj && currentActionObj.graphPathTargetNode && currentActionObj.graphPathTargetNode.nodeId && currentActionObj.graphPathTargetNode.nodeId == nodeObj.id) {
                        nodeObj.isRoot = true;
                        nodeObj.isTarget = true;
                    }


                }
                if (currentActionObj) {
                    legendnodeLabels.currentActionObj = currentActionObj;
                }
            }

            var nodes = [];

            for (var key in nodesMap) {
                //	nodesMap[key].nLinks=nodesMap[key].links.length;
                nodes.push(nodesMap[key]);
            }

            nodes.sort(function (a, b) {
                if (a.nodeIndex > b.nodeIndex)
                    return 1;
                if (a.nodeIndex < b.nodeIndex)
                    return -1;
                return 0;
            })
            /*  console.log("----------------------");
             console.log(JSON.stringify(nodes[0],null,2))
             console.log("----------------------");
             console.log(JSON.stringify(links[0],null,2))*/
            return {nodes: nodes, links: links, linksMap: linksMap}


        }


        self.getNodeInfos = function (id, callback) {
            query = "MATCH (n) WHERE ID(n) =" + id + " RETURN n ";

            self.executeNeoQuery(QUERY_TYPE_MATCH, query, function (d) {
                callback(d);

            });

        }


        self.toFlareJson = function (resultArray, addToPreviousQuery) {
            currentDataStructure = "tree";
            currentThumbnails = [];
            currentThumbnails.ids = [];
            currentThumbnails.currentIndex = 1;
            var distinctNodeName = {};

            var rootId;
            if (!addToPreviousQuery)
                linksToSkip = [];
            if (!resultArray) {
                resultArray = toutlesensData.cachedResultArray;
            } else {

            }

            var nodesMap = {};

            for (var i = 0; i < resultArray.length; i++) {
                var rels = resultArray[i].rels;
                var nodes = resultArray[i].nodes;
                var ids = resultArray[i].ids;
                var labels = resultArray[i].labels;
                var startNodes = resultArray[i].startLabels;
                var relProperties = resultArray[i].relProperties;

                var legendRelIndex = 1;
                //  console.log("------------\n")
                for (var j = 0; j < nodes.length; j++) {

                    var nodeNeo = nodes[j].properties;
                    //  console.log(JSON.stringify(nodeNeo))
                    if (distinctNodeName[nodeNeo[Gparams.defaultNodeNameProperty]] == null)
                        distinctNodeName[nodeNeo[Gparams.defaultNodeNameProperty]] = 0;
                    else {
                        distinctNodeName[nodeNeo[Gparams.defaultNodeNameProperty]] += 1;
                        nodeNeo[Gparams.defaultNodeNameProperty] = nodeNeo[Gparams.defaultNodeNameProperty] + "#" + distinctNodeName[nodeNeo[Gparams.defaultNodeNameProperty]];
                    }

                    var nodeObj = {
                        name: nodeNeo[Gparams.defaultNodeNameProperty],
                        myId: nodeNeo.id,
                        label: labels[j][0],
                        id: ids[j],
                        children: [],
                        hiddenChildren: [],
                        neoAttrs: nodeNeo
                    }
                    if (nodes[j].show)
                        nodeObj.show = true;
                    if (nodeNeo.path) {
                        if (currentThumbnails.ids.indexOf(nodeObj.id) < 0) {
                            currentThumbnails.ids.push(nodeObj.id);
                            var objT = {id: nodeObj.id, path: nodeNeo.path};
                            if (nodeNeo.date)
                                objT.date = nodeNeo.date;


                            currentThumbnails.push(objT);

                        }
                    }
                    if (nodes[j].decoration) {
                        nodeObj.decoration = nodes[j].decoration
                        if (nodes[j].decoration.groupOnGraph == true) {// le label de decoration remplace le label Neo4j
                            nodeObj.label = nodes[j].decoration.value;

                        }
                    }


                    /*
                     * if (addToPreviousQuery && foldedTreeChildren.indexOf(nodeObj.myId) >
                     * -1) {// noeud // repliés continue; }
                     */

                    if (j == 0) {
                        nodeObj.parent = "root";
                        rootId = nodeObj.id;
                        nodeObj.neoAttrs = nodeNeo;
                        nodesMap.root = nodeObj

                    }

                    else {
                        if (addToPreviousQuery && nodeObj.id == currentRootId)
                            nodeObj.isNewRoot = true;

                        nodeObj.parent = ids[j - 1];
                        nodeObj.relType = rels[j - 1];
                        if (relProperties && relProperties[j - 1])
                            nodeObj.relProperties = relProperties[j - 1].properties;
                        else
                            nodeObj.relProperties = {};
                        var modelRels = dataModel.relations[labels[j - 1][0]];
                        if (modelRels && modelRels.length) {
                            for (var k = 0; k < modelRels.length; k++) {
                                if (modelRels[k].label2 == nodeObj.label) {
                                    nodeObj.relDir = modelRels[k].direction;
                                    break;
                                }
                            }
                        }

                        var key = nodeObj.id + "_" + ids[j - 1];
                        /*  if( nodesMap[key]){// create a new id if allready existing
                         //    if( nodesMap[(-j*1000000000)+nodeObj.id]){// create a new id if allready existing
                         nodeObj.id=(-j*1000000000)+nodeObj.id;
                         ids[j]= nodeObj.id;
                         }*/

                        nodesMap[key] = nodeObj;


                    }
                    if (!legendRelTypes)
                        legendRelTypes = {};
                    if (!legendnodeLabels)
                        legendnodeLabels = {};

                    if (!legendRelTypes[nodeObj.relType]) {
                        legendRelTypes[nodeObj.relType] = {
                            type: nodeObj.relType,
                            index: legendRelIndex++
                        }
                    }
                    if (!legendnodeLabels[nodeObj.label]) {
                        legendnodeLabels[nodeObj.label] = {
                            label: nodeObj.label
                        }
                    }

                }

            }
            if (resultArray.currentActionObj) {
                legendnodeLabels.currentActionObj = currentActionObj;
            }
            foldedTreeChildren = [];
            // removeExcludedLabels(nodesMap);
            self.deleteRecursiveReferences(nodesMap);

            self.setNodesIndexPath(nodesMap);
            var root = nodesMap.root;
            if (root)
                root.isRoot = true;

            maxEffectiveLevels = 1;
            var maxLevels = $("#depth")
            if (maxLevels === undefined)
                maxLevels = Gparams.depth;
            else
                maxLevels = parseInt(maxLevels.val());
//console.log(JSON.stringify(nodesMap))
            self.addChildRecursive(root, nodesMap, 1, maxLevels);


            self.initThumbnails();
            // console.log (JSON.stringify(root));
            toutlesensData.cachedResultTree = root;
            return root;
        }


        self.removeExcludedLabels = function (map) {
            var keysToExclude = [];
            for (key in map) {
                var nodeObj = map[key];
                if (nodeObj.parent != "root" && excludeLabels[nodeObj.label] > -1
                    && navigationPath.indexOf(nodeObj.id) < 0) {
                    keysToExclude.push(key);

                }
            }
            for (var i = 0; i < keysToExclude.length; i++) {
                delete map[keysToExclude[i]];
            }

        }

// eliminer les references circulaires
        self.deleteRecursiveReferences = function (nodesMap) {
            var idsToDelete = [];
            for (var key in nodesMap) {
                var parent = nodesMap[key].parent;
                // parmi les noeud qui ont pour parent un de leurs fils ont detruit
                // celui qui qui a pour parent lactuel noeud racine
                if (nodesMap[parent] && nodesMap[parent].parent == nodesMap[key].id) {
                    if (nodesMap[key].id != currentRootId) {
                        idsToDelete.push(nodesMap[key].id);
                        linksToSkip.push("" + nodesMap[key].id + "_"
                            + nodesMap[key].parent);

                    }
                }

            }
            for (var i = 0; i < idsToDelete.length; i++) {
                console.log(JSON.stringify(nodesMap[idsToDelete[i]]));

                delete nodesMap[idsToDelete[i]];

            }

        }

        self.addChildRecursive = function (node, nodesMap, level, maxLevels) {
            totalNodesToDraw = 0;

            maxEffectiveLevels = Math.max(maxEffectiveLevels, level);
            // maxEffectiveLevels=level;
            try {// max stack size limit
                for (var key in nodesMap) {

                    var aNode = nodesMap[key];
                    if (aNode.parent == aNode.id) // self relation
                        continue;
                    if (aNode.parent == node.id) {
                        if (excludeLabels && excludeLabels[aNode.label]
                            && excludeLabels[aNode.label] > -1)
                            continue;
                        if (aNode.show) {
                            var www = "a"
                        }
                        if (!nodesMap[key].visited) {
                            aNode.level = level;


                            if (level > maxLevels && !aNode.show) {
                                if (false && node.decoration) {// on dessine les noeuds avec des decorations meme s'ils sont au dernier niveau
                                    node.children.push(aNode);
                                    totalNodesToDraw += 1;
                                } else {
                                    node.hiddenChildren.push(aNode);
                                }
                            } else {
                                node.children.push(aNode);
                                totalNodesToDraw += 1;
                            }
                            self.addChildRecursive(aNode, nodesMap, level + 1, maxLevels);
                            nodesMap[key].visited = true;
                        } else {
                            ;// console.log(node.name);
                        }
                    }

                }
            } catch (e) {
                console.log(e);
            }

        }
        self.setNodesIndexPath = function (nodesMap) {
            for (var key in nodesMap) {
                var index = navigationPath.indexOf(nodesMap[key].id);
                if (index > -1)
                    nodesMap[key].navigationPathIndex = index;

            }
        }

        self.removeChildrenFromTree = function (json, myId) {
            foldedTreeChildren = [];
            self.recurse = function (node) {
                if (!node.children)
                    return;

                for (var i = 0; i < node.children.length; i++) {
                    if (node.children[i].myId == myId) {

                        if (node.children[i].children) {
                            for (var j = 0; j < node.children[i].children.length; j++) {
                                foldedTreeChildren
                                    .push(node.children[i].children[j].myId);
                            }
                            delete node.children[i].children;
                            return;

                        }
                    } else {
                        self.recurse(node.children[i]);
                    }

                }
            }

            self.recurse(json);
        }


        self.formatTreeToCsv = function (json) {
            self.recursiveSetParent = function (node) {
                if (!node.children || node.children.length == 0) {
                    leaves.push(node)
                } else {
                    for (var i = 0; i < node.children.length; i++) {
                        var child = node.children[i];
                        if (!child.ancestors)
                            child.ancestors = [];
                        child.parent = node;
                        self.recursiveSetParent(child);
                    }
                }

            }

            self.recursiveSetAncestors = function (leaf, ancestor) {
                if (!leaf.ancestors)
                    leaf.ancestors = [leaf];
                if (ancestor.parent) {
                    if (leaf.ancestors.indexOf(ancestor.parent) < 0) {
                        leaf.ancestors.push(ancestor.parent)
                        self.recursiveSetAncestors(leaf, ancestor.parent);
                    }
                }
            }

            var leaves = []
            self.recursiveSetParent(json);
            for (var i = 0; i < leaves.length; i++) {
                self.recursiveSetAncestors(leaves[i], leaves[i]);
            }

            var spreadSheetData = [];

            for (var i = 0; i < leaves.length; i++) {
                var line = [];
                var ancestors = leaves[i].ancestors;
                ancestors.splice(0, 0, leaves[i])

                for (var j = 0; j < ancestors.length - 1; j++) {// length-1 car le
                    // dernier ancetre est
                    // root

                    var name = ancestors[j].name;
                    if (name) {
                        label = "";
                        if (CSVWithLabel)
                            label = " [" + ancestors[j].label + "]";
                        line.push(name + label);

                        var relType = ancestors[j].relType;
                        if (relType) {
                            var direction = ancestors[j].relDir;
                            if (direction && direction == "normal")
                                relType += " ->";
                            else
                                var relType = " <-" + relType;
                            line.push(relType);
                        }

                    }
                }

                line.reverse();
                spreadSheetData.push(line);

            }
            return spreadSheetData;
        }

        self.clickDatatable = function () {

        }

        self.searchInProperties = function (value, callback) {
            var query = "$match (n) with n, [x in keys(n) WHERE n[x] =~ '(?i).*"
                + value
                + ".*' ] as doesMatch where size(doesMatch) > 0 return n limit "
                + limit;
            self.executeNeoQuery(QUERY_TYPE_MATCH, query, callback);
        }

// }


        self.flatResultToTree = function (data, withAttrs) {

            var str = "";
            var label = "";
            var color = "black";
            var nodes = {};
            for (var i = 0; i < data.length; i++) {
                if (!data[i].nodes)
                    continue;
                for (var j = 0; j < data[i].nodes.length; j++) {


                    var node = {
                        id: data[i].ids[j]
                    }

                    if (!nodes[node.id]) {
                        node.neoAttrs = data[i].nodes[j].properties;
                        if (!node.neoAttrs.name)
                            node.neoAttrs.name = node.neoAttrs[Gparams.defaultNodeNameProperty];
                        node.name = node.neoAttrs.name;
                        node.label = data[i].labels[j][0]

                        node.children = [];

                        nodes[node.id] = node;

                        if (j == 0)
                            node.isSubRoot = true;

                        if (j > 0) {
                            node.rel = data[i].rels[j - 1];

                            var previousId = data[i].ids[j - 1];
                            if (nodes[previousId]) {
                                /*  var add = true;
                                 for (var k = 0; k < nodes[previousId].children.length; k++) {
                                 if (nodes[previousId].children[k] == node.id) {
                                 add = false;
                                 break;
                                 }

                                 }
                                 if (add)*/
                                nodes[previousId].children.push(node);
                            }

                        }
                    }


                }

            }
            var keys = []
            for (var key in  nodes) {
                if (nodes[key].isSubRoot)
                    keys.push(key)
            }
            keys.sort();
            var root = {
                name: "root",
                id: -1,
                label: "root",
                children: []
            }
            for (var i = 0; i < keys.length; i++) {
                root.children.push(nodes[keys[i]]);
            }

            return root;


        }


        self.searchNodes = function (subGraph, label, word, resultType, limit, from, callback) {
            var options = {
                subGraph: subGraph,
                label: label,
                word: word,
                resultType: resultType,
                limit: limit,
                from: from
            }
            self.searchNodesWithOption(options, callback);
        }


        self.searchNodesWithOption = function (options, callback) {

            var subGraph = options.subGraph;
            var label = options.label;
            var word = options.word;
            var resultType = options.resultType;
            var limit = options.limit;
            var from = options.from;
            var additionalWhere = options.additionalWhere;

            currentQueryParams = {
                subGraph: subGraph, label: label, word: word, resultType: resultType, limit: limit, from: from
            }
            var str = "";
            var subGraphWhere = "";
            /*  if (!word)
             word = "";*/
            var returnStr = " RETURN n";//,id(n) as n_id,labels(n) as n_labels";
            var cursorStr = "";
            if (resultType == "count")
                returnStr = " RETURN count(n) as count";
            else
                cursorStr += " ORDER BY n." + Gparams.defaultNodeNameProperty;
            if (from && resultType != "allNodes")
                cursorStr += " SKIP " + from;
            if (limit && resultType != "allNodes")
                cursorStr += " LIMIT " + limit;


            var labelStr = "";
            if (label && label.length > 0)
                labelStr = ":" + label;

            var whereStr = "";

            if (options.where)
                whereStr = options.where;
            else {
                whereStr = advancedSearch.getWhereProperty(word, "n")


                if (additionalWhere && additionalWhere != "") {
                    if (whereStr.length == 0)
                        whereStr += " where " + additionalWhere + " ";
                    else
                        whereStr += " and " + additionalWhere + " ";
                }

                if (subGraph) {
                    if (whereStr.length == 0)
                        subGraphWhere += " where  n.subGraph='" + subGraph + "' ";
                    else
                        subGraphWhere += " and  n.subGraph='" + subGraph + "' ";
                }
            }


            var whereStrRaw = whereStr;
            if (whereStr && whereStr.length > 0 && whereStr.toUpperCase().indexOf("WHERE") < 0)
                whereStr = " WHERE " + whereStr;
            str = "MATCH (n" + labelStr + ") " + whereStr + subGraphWhere + returnStr;


            console.log(str);
            if (resultType == "matchStr" && callback) {
                return callback(null, str);
            }

            else if ((resultType == "matchObject" || resultType == "matchSearchClause") && callback) {

                var obj = {
                    nodeLabel: label,
                    where: whereStrRaw
                }
                return callback(null, obj);
            }

            str += cursorStr;

            var payload = {match: str};


            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    if (callback) {
                        return callback(null, data);
                    }
                    if (!resultType == "count")
                        eventsController.startSearchNodesTime = null;
                    if (!data || data.length == 0) {

                        $("#waitImg").css("visibility", "hidden");
                        toutlesensController.setMessage("No results", blue);
                        return;
                    }
                    var errors = data.errors;

                    if (errors && errors.length > 0) {
                        var str = "ERROR :";
                        for (var i = 0; i < errors.length; i++) {
                            str += errors[i].code + " : " + errors[i].message + "<br>"
                                + JSON.stringify(paramsObj);
                        }
                        toutlesensController.setMessage("!!! erreur de requete", red);
                        console.log(str);
                        return;
                    }
                    if (data.length > Gparams.listDisplayLimitMax) {
                        alert("too many result : " + data.length + "> Max :" + Gparams.listDisplayLimitMax)
                        return;
                    }


                },
                error: function (xhr, err, msg) {
                    toutlesensController.onErrorInfo(xhr);
                    if (callback) {
                        return callback(null);
                    }
                    if (!resultType == "count")
                        eventsController.startSearchNodesTime = null;
                    console.log(xhr);
                    console.log(err);
                    console.log(msg);
                },

            });

            ;

        }


        self.initThumbnails = function () {

            if (currentThumbnails.length > 0) {
                currentThumbnails.currentIndex = 0;
                currentThumbnails.sort(function (a, b) {
                    if (a.date && b.date) {
                        return a.date > b.date;
                    }
                    return a > b;

                });

            } else {
                currentThumbnails.currentIndex = 1;
            }
        }

        self.saveRelation = function (callback) {
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


            treeController.callAPIproxy(payload, "createRelation", function (err, result) {
                if (err) {
                    $("#message").html(err);
                    return;
                }
                $("#message").html("relation saved");
                $("#dialog").dialog("close");
                if (callback) {
                    var edge = result[0].r.properties;
                    edge.from = result[0].r._fromId;
                    edge.to = result[0].r._toId;
                    edge.id = result[0].r._id;
                    edge.type = result[0].r.type;
                    callback(edge);
                }


            })


        }

        self.neoNodeResultToColumnDataSet=function(json){
            var dataSet = [];
            var columns = [];
            var excludedKeys=["subGraph"]
            for (var i = 0; i < json.length; i++) {
                for (var key in json[i].n.properties) {
                    if (columns.indexOf(key) < 0 && excludedKeys.indexOf(key)<0)
                        columns.push(key);
                }
            }

            var nameColIndex=columns.indexOf(Schema.getNameProperty());
            columns.splice(0,0,columns[nameColIndex]);
            columns.splice(nameColIndex+1,1);


            for (var i = 0; i < json.length; i++) {
                var line = [];
                for (var j = 0; j < columns.length; j++) {
                    var value = json[i].n.properties[columns[j]];
                    if (!value)
                        value = "";

                    line.push(value);
                }
                line.push(json[i].n._id);
                dataSet.push(line);

            }
            columns.push("neoId")
            return {columns:columns,dataSet:dataSet}



        }
        return self;
    }
)()