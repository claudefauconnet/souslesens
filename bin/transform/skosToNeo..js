/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
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
var jsonxml = require('jsontoxml');
var xml2js = require('xml2js');
var fs = require("fs");
var restAPI = require("../restAPI");
var async = require("async");
var serverParams = require("../serverParams.js")

var neoProxy = require('../neoProxy.js');


var parser = new xml2js.Parser();


var skosToNeo = {

    importSkos: function (data, subGraph) {
        var nodes = [];
        parser.parseString(data, function (err, result) {
            if (err) {
                if (callback)
                    callback(err);
                return;
            }
            var concepts = result["rdf:RDF"]["skos:Concept"];

            for (var i = 0; i < concepts.length; i++) {
                var concept = concepts[i];

                var prefLabel = concept["skos:prefLabel"][0];
                var node = {
                    prefLabel: prefLabel,
                    about: "",
                    BT: [],
                    NT: [],
                    SA: []
                }
                for (var key in concept) {
                    if (node[key]) {
                        for (var j = 0; j < concept[key].length; j++) {
                            node[key].push(concept[key][j])
                        }

                    }
                }
                if (concept["$"]) {
                    node.about = concept["$"]["rdf:about"];
                }
                nodes.push(node);

            }


//*********************create nodes************************
            var neoNodes = {};
            var statements=[];
            for (var i = 0; i < nodes.length; i++) {// nodes
                var name = nodes[i].prefLabel;
                var label = "skosConcept";
                var attrs = {about: nodes[i].about, name: name, subGraph: subGraph};
                 attrs = JSON.stringify(attrs).replace(/"(\w+)"\s*:/g, '$1:');// quote the keys in json
                var statement = {statement: "CREATE (n:" + label + attrs + ")  RETURN n.name,ID(n), labels(n)"};
                statements.push(statement);
            }


            var payload = {statements: statements};
            var path = "/db/data/transaction/commit";
            var neo4jUrl = serverParams.neo4jUrl;
            neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {

                if (err) {

                    return;
                }

                for (var i = 0; i < result.results.length; i++) {
                    var obj = result.results[i]
                    var label = obj.data[0].row[2][0];
                    var id = obj.data[0].row[1];
                    var name = obj.data[0].row[0];
                    neoNodes[name] = id;
                }


//*********************create relations************************
                var relationTypes = ["SA","NT","BT"];


                async.eachSeries(relationTypes, function(relationType,callback){
                var payload = [];
                for (var i = 0; i < nodes.length; i++) {//relations
                    var SAs = nodes[i][relationType];

                    for (var j = 0; j < SAs.length; j++) {
                        var neoSourceId = neoNodes[nodes[i].prefLabel];
                        var neoTargetId = neoNodes[SAs[j]];
                        var neoObj = {
                            method: "POST",
                            to: "/node/" + neoSourceId + "/relationships",
                            id: 3,
                            body: {
                                to: "" + neoTargetId,
                                //  data: relations[i].data,
                                type: relationType
                            }
                        }
                        payload.push(neoObj);
                    }

                }
                var path = "/db/data/batch";
                var neo4jUrl = serverParams.neo4jUrl;
                neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {

                    if (err) {
                        console.log(err)
                     return   callback(err);


                    }
                    if (result.errors && result.errors.length > 0) {



                    }
                    console.log(relationType + "  "+result.length);
                    callback(null);
                });


            })

})
            /*  neoNodes[]


             }
             for (var i = 0; i < relations.length; i++) {
             totalImported += 1;


             var neoObj = {
             method: "POST",
             to: "/node/" + relations[i].sourceId + "/relationships",
             id: 3,
             body: {
             to: "" + relations[i].targetId,
             data: relations[i].data,
             type: relations[i].type
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
             callback(JSON.stringify(result));
             return;

             }

             var message = "Imported " + totalImported + "relations  with type " + relationType;
             socket.message(message);
             callback(null, result)

             })

             for(var i=0;i<nodes.length;i++) {//relations
             var SAs=nodes[i].SA;
             for(var i=0;i<SAs.length;i++) {
             var payload= {
             sourcenodeLabel: "skosConcept",
             sourceNodeQuery:{name:nodes[i].prefLabel},
             targetnodeLabel: "skosConcept",
             targetNodeQuery:{name:SAs[j]}
             relType:"SA",
             subGraph: subGraph
             }
             restAPI.createRelation(payload,function(err,result){
             if(err)
             return;
             })


             }*/


        })
    }
}


var path = "./geochemistry_50.skos.xml";

var data = "" + fs.readFileSync(path)
skosToNeo.importSkos(data, "skos");


//module.exports = iso25964ToSkos;