var elasticProxy = require('./elasticProxy.js');
var neoProxy = require('./neoProxy.js');
var async = require('async');
var restAPI = require('./restAPI')
var serverParams = require('./serverParams.js');
var kmeans = require('node-kmeans');

var elasticApps = {

    generateDocProximityMatrix: function (index, minScore, word, callback) {
        var proximityMatrix = {}
        elasticProxy.findDocuments(index,null, word,null, 0, 10000, null, ["title","content"], null, function (err, result) {
            if (err)
                return callback(err);
            var docs = [];
            for (var i = 0; i < result.docs.length; i++) {
                docs.push({id: result.docs[i]._id, title: result.docs[i].title,content:result.docs[i].content});
            }

            async.eachSeries(docs, function (doc, callbackSeries) {
                    proximityMatrix[doc.id] = {title: doc.title,content:doc.content, id: doc.id, proximityMap: []}
                    elasticProxy.findSimilarDocuments(index, doc.id, minScore, 50, function (err, result) {
                        if (err)
                            return callback(err);
                        for (var i = 0; i < result.length; i++) {
                            if (result[i]._score > 200)

                                var doc2 = {id: result[i]._id, title: result[i].title, score: result[i]._score}
                            if (!proximityMatrix[doc.id].proximityMap[result[i]._id]);
                            proximityMatrix[doc.id].proximityMap[result[i]._id] = doc2;


                        }

                        callbackSeries();
                    })


                },
                function (err) {
                    if (err)
                        return callback(err);
                    // console.log(JSON.stringify(proximityMatrix, null, 2))
                    return callback(null, proximityMatrix);
                });


        });
    }
    ,

     writeToNeoBatch: function (subGraph, label, relType, nodes, relations, callback) {

//nodes
        var path = "/db/data/transaction/commit";
        var statements = [];

        for (var i = 0; i < nodes.length; i++) {
            var obj = nodes[i];

            var attrs = JSON.stringify({
                subGraph: subGraph,
                name: obj.title,
                elasticId: obj.id
            }).replace(/"(\w+)"\s*:/g, '$1:');
            var statement = {statement: "CREATE (n:" + label + attrs + ")  RETURN n.id,ID(n), labels(n)"};
            statements.push(statement);
        }

        var payload = {statements: statements};
        var neo4jUrl = serverParams.neo4jUrl;
        var nodeMappings = [];
        neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {
            if (err) {
                return callback(err);
            }

            var nodeMappings = {}
            for (var i = 0; i < result.results.length; i++) {
                var obj = result.results[i]
                var label = obj.data[0].row[2][0];
                var id = obj.data[0].row[1];
                var nodeMapping = {};
                var neoId = id;
                var elasticId = nodes[i].id;
                nodeMappings[elasticId] = neoId;
            }
//relations
            var path = "/db/data/batch";
            var payload = [];
            for (var i = 0; i < relations.length; i++) {
                var neoSourceId = nodeMappings[relations[i].sourceElasticId];
                var neoTargetId = nodeMappings[relations[i].targetElasticId];
                if (!neoSourceId || !neoTargetId)
                    continue;
                var neoObj = {
                    method: "POST",
                    to: "/node/" + neoSourceId + "/relationships",
                    id: 3,
                    body: {
                        to: "" + neoTargetId,
                        data: {strength: relations[i].score / 100},
                        type: relType
                    }
                }
                payload.push(neoObj);

            }

            var neo4jUrl = serverParams.neo4jUrl;
            neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {

                if (err) {

                    callback(err);
                    return;
                }
                if (result.errors && result.errors.length > 0) {
                    callback(err);
                    return;
                    // callback(JSON.stringify(result));

                }
                return callback(null, "DONE");


            });


        })


    },

    generateDocProximityNeoSubGraph: function (word, minScore, subGraph, label, relType, callback) {
        elasticApps.generateDocProximityMatrix(subGraph, 0.000000, "corrosion", function (err, proximityMatrix) {
            var neoNodes = [];
            var neoRelations = [];

            var uniqueRels = [];
            for (var key in proximityMatrix) {

                var obj = proximityMatrix[key];


                neoNodes.push(obj);

                for (var key in obj.proximityMap) {

                    var targetobj = obj.proximityMap[key];
                    if (!targetobj || !targetobj.id)
                        continue;
                    var neoRel = {
                        sourceElasticId: obj.id,
                        targetElasticId: targetobj.id,
                        score: targetobj.score
                    }
                    //unicite des relation normales+inverses
                    var relCode = neoRel.sourceElasticId + "_" + neoRel.targetElasticId;
                    var relCodeInv = neoRel.targetElasticId + "_" + neoRel.sourceElasticId;
                    if (uniqueRels.indexOf(relCode) < 0 && uniqueRels.indexOf(relCodeInv) < 0) {
                        uniqueRels.push(relCode);
                        neoRelations.push(neoRel);
                    }

                }
            }
            var whereSubGraph="";
            if(subGraph && subGraph!="DB_")
                whereSubGraph=" where n.subGraph='" + subGraph +"'"
            restAPI.retrieve({match: "Match(n)"+whereSubGraph+" DETACH  delete n  "}, function (err, result) {
                elasticApps.writeToNeoBatch(subGraph, "rules", "closeTo", neoNodes, neoRelations, function (err, result) {
                    if (err)
                        return callback(err);
                    callback(null, {subGraph:subGraph,status:"created"});

                });
            });
        })
    },

    generateDocProximityClusters: function (index,word, minScore,nDim,nClusters,callback) {
        elasticApps.generateDocProximityMatrix(index, minScore, word, function (err, proximityMatrix) {
            var neoNodes = [];
            var neoRelations = [];


            for (var key in proximityMatrix) {
                proximityMatrix[key].closeIds = [];
                proximityMatrix[key].scores = [];
                for (var key2 in proximityMatrix) {
                    proximityMatrix[key].closeIds.push(key2)
                    proximityMatrix[key].scores.push(0)
                }
            }

            for (var key in proximityMatrix) {
                var obj = proximityMatrix[key];
                for (var key2 in obj.proximityMap) {
                    var closeObj = obj.proximityMap[key2];
                    if (!closeObj || !closeObj.id)
                        continue;
                    var p = proximityMatrix[key].closeIds.indexOf(closeObj.id);
                    if (p < 0)
                        continue;
                    proximityMatrix[key].scores[p] = closeObj.score;
                }
            }

            var data=[];
            var idsVector;
            for (var key in proximityMatrix) {

                var obj = proximityMatrix[key];
                if(!idsVector)
                    idsVector=obj.closeIds;
                var ok=false;
                for( var i=0;i<obj.scores.length;i++){
                    if(obj.scores[i]>0)
                        ok=true;
                }
                if(ok==true)
                    data.push(obj.scores)
            }
            console.log(JSON.stringify(data))
            kmeans.clusterize(data, {k: 8}, function (err,res)  {
                if (err)
                  return   console.error(err);
                var clusters={}
                for(var i=0;i<res.length;i++){
                    clusters["Cluster"+i]=[];
                    var indices=res[i].clusterInd ;
                    for(var j=0;j<indices.length;j++){
                        var docId=idsVector[indices[j]];
                        var doc={title:proximityMatrix[docId].title,content:proximityMatrix[docId].content};
                        clusters["Cluster"+i].push(doc)
                    }


                }
                console.log(JSON.stringify(clusters,null,2))



        });

        })



    }

}


/*elasticApps.generateDocProximityNeoSubGraph("corrosion", 0.000000, "referentiel", "rules", "closeTo", function (err, result) {
    if (err)
        return callback(err);
    console.log(JSON.stringify(result));
});*/


elasticApps.generateDocProximityClusters("referentiel","corrosion", 0.000000,20, 5, function (err, result) {
    if (err)
        return callback(err);
    console.log(JSON.stringify(result));
});


module.exports = elasticApps;