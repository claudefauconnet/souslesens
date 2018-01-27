var graphTraversalQueries = (function () {
    var self = {};
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
    self.getAllSimplePaths = function (startId, endId, depth, algo, callback) {


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
            url: Gparams.neo4jProxyUrl,
            data: paramsObj,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                if (!data) {
                    return callback("No result")
                    $("#waitImg").css("visibility", "hidden");
                }
                if (data.length > Gparams.graphDisplayLimitMax) {

                    return callback("trop de resultats "
                        + data.length
                        + " pour dessiner le graphe.Modifiez les parametres")

                }
                if (data.length == 0)
                    return callback(null, data);

                self.processPathResults(data, callback);
            },
            error: function (xhr, err, msg) {
                toutlesensController.onErrorInfo(xhr)
                callback(err)
            },

        });

    }

    self.processPathResults = function (data, callback) {


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
        self.getRelationsByIds(RelIds, data, startNodeId, endNodeId, function (err, data, rels) {
            if (err)
                return console.log(err);

            callback(null, data)

        });

    }

    self.getRelationsByIds = function (RelIds, rawData, startNodeId, endNodeId, callback) {
        // var query = "MATCH (n)-[r]->(m) WHERE ID(r) IN "+
        // JSON.stringify(normalRelIds)+ " RETURN
        // n,m,r,labels(n),labels(m),ID(n),ID(m),type(r),ID(r) ";

        var query = "MATCH path=(n)-[r]->(m) WHERE ID(r) IN "
            + JSON.stringify(RelIds)
            + " RETURN EXTRACT(rel IN relationships(path) | type(rel))as rels,nodes(path)as nodes, EXTRACT(node IN nodes(path) | ID(node)) AS ids, EXTRACT(node IN nodes(path) | labels(node)) "
            + ", EXTRACT(rel IN relationships(path) | labels(startNode(rel))) as startLabels, EXTRACT(rel IN relationships(path) | labels(endNode(rel))) as endLabels";

        payload = {match: query}
        $.ajax({
            type: "POST",
            url: Gparams.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var rels = {}
                for (var i = 0; i < data.length; i++) {// marquage des
                    // noeuds source et
                    // cible
                    var nodes = data[i].nodes;
                    data[i].relProperties = []
                    var ids = data[i].ids;
                    data[i].labels = [data[i].startLabels, data[i].endLabels];
                    for (var j = 0; j < ids.length; j++) {
                        data[i].relProperties.push("");
                        var nodeId = ids[j];
                        if (startNodeId == nodeId)
                            data[i].nodes[j].isSource = true;
                        if (endNodeId == nodeId)
                            data[i].nodes[j].isTarget = true;
                    }


                    //extract relations objs for filters
                    var relsI = data[i].rels;
                    for (var j = 0; j < relsI.length; j++) {
                        var relJ = relsI[j]
                        if (!rels[relJ])
                            rels[relJ] = {rels: [relJ], labels: [[]]};
                        for (var k = 0; k < data[i].nodes.length; k++) {
                            if (rels[relJ].labels[0].indexOf(data[i].nodes[k].labels[0]) < 0) {
                                rels[relJ].labels[0].push(data[i].nodes[k].labels[0])
                            }
                        }

                    }


                }
                var relsArray = []
                for (var key in rels) {
                    relsArray.push(rels[key]);
                }
                callback(null, data, relsArray);

            },
            error: function (xhr, err, msg) {
                toutlesensController.onErrorInfo(xhr)

                callback(err)
            },


        });

    }

    /*
     * https://neo4j.com/docs/java-reference/current/javadocs/org/neo4j/graphdb/traversal/Evaluators.html
     *
     * http://neo4j.com/docs/stable/rest-api-traverse.html
     * http://www.ekino.com/optimization-strategies-traversals-neo4j/
     */


    return self;
})()