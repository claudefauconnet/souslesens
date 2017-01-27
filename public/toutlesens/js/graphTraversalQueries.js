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
function getAllSimplePaths(startId, endId, depth, algo) {
    var body = '{ "to":"' + endId + '","max_depth":' + depth + ',"algorithm":"'
        + algo + '"}';
    var urlSuffix = "/db/data/node/" + startId + "/paths";
    var paramsObj = {
        mode: "POST",
        urlSuffix: urlSuffix,
        payload: body,


    }

    console.log(JSON.stringify(body));
    console.log(urlSuffix);
    $
        .ajax({
            type: "POST",
            url: Gparams.neo4jProxyUrl,
            data: paramsObj,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                if (!data || data.length == 0) {
                    alert("pas de résultat . Pour dessiner le graphe.Modifiez les parametres");
                    return;

                }
                if (data.length > Gparams.MaxResults) {

                    alert("trop de resultats "
                        + data.length
                        + " pour dessiner le graphe.Modifiez les parametres");
                    return;

                }
                processPathResults(data);
            },
            error: function (xhr, err, msg) {
                console.log(xhr);
                console.log(err);
                console.log(msg);
            },

        });

}

function processPathResults(data) {
    /* graphPathDebugInfo += "\n---------result------------\n" */

    var RelIds = [];

    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].relationships.length; j++) {

            var str = data[i].relationships[j];
            var id = parseInt(str.substring(str.lastIndexOf("/") + 1));

            RelIds.push(id);

        }
    }
    var startNodeId = parseInt(data[0].start.substring(data[0].start
            .lastIndexOf("/") + 1));
    var endNodeId = parseInt(data[0].end
        .substring(data[0].end.lastIndexOf("/") + 1))
    getRelationsByIds(RelIds, data, startNodeId, endNodeId);

}

function getRelationsByIds(RelIds, rawData, startNodeId, endNodeId) {
    // var query = "MATCH (n)-[r]->(m) WHERE ID(r) IN "+
    // JSON.stringify(normalRelIds)+ " RETURN
    // n,m,r,labels(n),labels(m),ID(n),ID(m),type(r),ID(r) ";

    var query = "MATCH path=(n)-[r]->(m) WHERE ID(r) IN "
        + JSON.stringify(RelIds)
        + " RETURN EXTRACT(rel IN relationships(path) | type(rel))as rels,nodes(path)as nodes, EXTRACT(node IN nodes(path) | ID(node)) AS ids, EXTRACT(node IN nodes(path) | labels(node)) "
        + ", EXTRACT(rel IN relationships(path) | labels(startNode(rel))) as startLabel";
    executeQuery(QUERY_TYPE_MATCH, query, function (data) {

        for (var i = 0; i < data.length; i++) {// marquage des
            // noeuds source et
            // cible
            var nodes = data[i].nodes;
            var ids = data[i].ids;
            for (var j = 0; j < ids.length; j++) {
                var nodeId = ids[j];
                if (startNodeId == nodeId)
                    data[i].nodes[j].isSource = true;
                if (endNodeId == nodeId)
                    data[i].nodes[j].isTarget = true;
            }

        }
        window.parent.hideAdvancedSearch();
        window.parent.displayGraph(data, "SIMPLE_FORCE_GRAPH", null);

    });

}

/*
 * https://neo4j.com/docs/java-reference/current/javadocs/org/neo4j/graphdb/traversal/Evaluators.html
 * 
 * http://neo4j.com/docs/stable/rest-api-traverse.html
 * http://www.ekino.com/optimization-strategies-traversals-neo4j/
 */
function drawGraphTraversal(startNodeId, graphTravReturnType,
                            graphTravPriority, graphTravUnicity, graphTravPruneEvaluator,
                            graphTravReturnEvaluator, graphTravReturnFilter, graphTravDepth,
                            graphTravRelTypes) {

    var json = {

        max_depth: graphTravDepth,
        uniqueness: graphTravUnicity,
        order: graphTravPriority,

    }

    if (graphTravPruneEvaluator.indexOf('position') > -1) {
        graphTravPruneEvaluator = graphTravPruneEvaluator.replace(/\t/g, "")
            .replace(/\n/g, "");
        json["prune_evaluator"] = {
            "language": "javascript",
            "body": graphTravPruneEvaluator
        }

    }

    if (graphTravReturnEvaluator.indexOf('position') > -1) {
        graphTravReturnEvaluator = graphTravReturnEvaluator.replace(/\t/g, "")
            .replace(/\n/g, "");
        json["return_filter"] = {
            "language": "javascript",
            "body": graphTravReturnEvaluator
        }

    }
    /*
     * if(graphTravRelTypes.length>0){
     * json["relationships"]=JSON.parse(graphTravRelTypes); }
     */

    if (false)
        json.return_filter = graphTravReturnFilter;

    var body = JSON.stringify(json);
    var urlSuffix = "db/data/node/" + startNodeId + "/traverse/"
        + graphTravReturnType;

    var payload = {
        payload: body,
        urlSuffix: urlSuffix
    };


    $
        .ajax({
            type: "POST",
            url: Gparams.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                if (!data || data.length == 0) {
                    setMessage("No results", blue);
                    var more = confirm("Aucun chemin trouve, voulez vous  augmenter la profondeur de la recherche (actuellement "
                        + currentDepth + ")?");
                    if (more === true) {
                        $("#depth").val(++currentDepth);
                        drawGraphGeneral()

                    }

                    return;

                }
                if (data.length > Gparams.MaxResults) {
                    currentGraphPanel = "";
                    alert("trop de resultats "
                        + data.length
                        + " pour dessiner le graphe.Modifiez les parametres");
                    return;

                }

                processPathResults(data);

            },
            error: function (xhr, err, msg) {
                console.log(xhr);
                console.log(err);
                console.log(msg);
            },

        });

}
