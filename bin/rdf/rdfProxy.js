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

var request = require('request');


var rdfProxy = {
    queryOntologyDataToNeoResult: function (ontology,word, relations, lang, contains, limit, callback) {
        word=word.substring(0,1).toUpperCase()+word.substring(1).toLowerCase();
        rdfProxy.getOntologyTriples(ontology,word, relations, lang, contains, limit, function (err, result) {
            if (err)
                return callback(err);
            var neoArray = rdfProxy.sparqlResultToNeoResult(result);
            //  console.log(JSON.stringify(resultArray, null, 2));
            callback(null, neoArray)
        });
    },


    getOntologyTriples: function (ontology,word, relations, lang, contains, limit, callback) {
        var url = "";
        if (ontology == "BNF") {
            url = "http://data.bnf.fr/sparql?default-graph-uri=&query="
        }
        else if (ontology == "DBPEDIA") {

            url = "https://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query="
        }


        if (!lang)
            lang = 'fr';
        var binding = ""
        if (!contains || contains != "true") {
            binding = "  ?doc skos:prefLabel '" + word + "'@" + lang + ".";
        }
        else {
            binding = "?doc skos:prefLabel ?label ." +
                " ?label bif:contains '" + word + "'@" + lang + ".";
        }

        var query = "SELECT  *  WHERE {" +
            binding +
            " ?doc skos:prefLabel ?label .";

        for (var i = 0; i < relations.length; i++) {
            var rel = relations[i];

           if(rel.optional) {
               var relation=rel.name;
               query += "\n  OPTIONAL{ ?doc skos:" + relation + " ?" + relation + "Doc .  ?" + relation + "Doc skos:prefLabel ?" + relation + "Label.}";
           }
           else{
               var relation=rel.name;
               query += "\n   ?doc skos:" + relation + " ?" + relation + "Doc .  ?" + relation + "Doc skos:prefLabel ?" + relation + "Label.";
           }
        }

        query += "} limit " + limit;



console.log(query);
        rdfProxy.querySparql(url, query, function (err, result) {
            if (err)
                return callback(err);
            return callback(null, result);
        })

    },


    sparqlResultToNeoResult: function (json) {
        var output = [];
        var relId = 1;
        var relTypes = ["narrower", "broader", "related"];
        for (var i = 0; i < json.length; i++) {
            var obj = json[i];
            for (var j = 0; j < relTypes.length; j++) {
                var relDoc = relTypes[j] + "Doc";
                var relLabel = relTypes[j] + "Label";
                if (obj[relDoc]) {
                    var docId = obj.doc.value;
                    docId = docId.substring(docId.lastIndexOf("/") + 1);
                    var relDocId = obj[relDoc].value;
                    relDocId = relDocId.substring(relDocId.lastIndexOf("/") + 1);
                    var label = obj.label.value;
                    var relLabelValue = obj[relLabel].value;





                    var obj2 = {
                        "rels": [
                            relTypes[j]
                        ],
                        "relProperties": [
                            {
                                "_id": relId++,
                                "type":  relTypes[j],
                                "properties": {},
                                "_fromId": docId,
                                "_toId": relDocId
                            }
                        ],
                        "nodes": [
                            {
                                "_id": docId,
                                "labels": [
                                    "BNF"
                                ],
                                "properties": {
                                    "subGraph": "bnf",
                                    "name": label,
                                    "nom": label
                                }
                            },
                            {
                                "_id": relDocId,
                                "labels": [
                                    "BNF"
                                ],
                                "properties": {
                                    "subGraph": "bnf",
                                    "name": relLabelValue,
                                    "nom": relLabelValue
                                }
                            }
                        ],
                        "ids": [
                            docId,
                            relDocId
                        ],
                        "labels": [
                            [
                                "BNF"
                            ],
                            [
                                "BNF"
                            ]
                        ],
                    }
                    output.push(obj2);
                }

            }
        }
        return output;

    }
    ,


    querySparql: function (url, sparqlQuery, callback) {


        url += encodeURIComponent(sparqlQuery);
        url += "&format=json&timeout=30000";
        var options = {
            url: url,
            headers: {
                // 'Accept': 'text/n3'
            }
        };

        request(options, function (error, response, body) {
            //   console.log('error:', error); // Print the error if one occurred
            //  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            //   console.log('body:', body); // Print the HTML for the Google homepage.
            if (error)
                return callback(error);

            try {
                var json = JSON.parse(body);
                return callback(null, json.results.bindings);
            }
            catch (e) {
                return callback(e);
            }

        });
    },

    rdfQueries: function (source,term,type){
        var query="";
        if(source=="BNF") {
            if (type == "ressourcesParTitre") {
                query = "PREFIX dcterms: <http://purl.org/dc/terms/> SELECT  *  WHERE {  ?a dcterms:title " + term + ".} limit 100";
            }
            if (type == "ressourcesParAuteur") {// pas bon!!!!!!!!!
                query = "PREFIX dcterms: <http://purl.org/dc/terms/>  PREFIX foaf: <http://xmlns.com/foaf/0.1/> PREFIX marcrel: <http://id.loc.gov/vocabulary/relators/> PREFIX skos: <http://www.w3.org/2004/02/skos/core#>"

                   +" SELECT  *  WHERE { ?aut foaf:familyName "+term+".  ?aut foaf:name  ?name .  ?doc dcterms:creator ?aut .   optional{?doc skos:altLabel ?docName.}} limit 100"
            }
        }


    }


}




/*dfProxy.getOntologyTriples("Vin", "fr", false, function (err, result) {
 var xx = result;
 var  resultArray = rdfProxy.sparqlResultToNeoResult(result);
 // console.log(JSON.stringify(resultArray, null, 2));
 return resultArray;
 })*/


module.exports = rdfProxy;