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
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER optimist
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/
var elasticsearch = require('elasticsearch');
const fs = require('fs');
var path = require('path');

const rdfProxy = require('./rdfProxy.js');
const skos = require('./skos.js');

var elasticProxy;
var serverParams = require("../serverParams.js");
var async = require('async');
var elasticProxy = require('../elasticProxy.js')
var socket = require('../../routes/socket.js');
var logger = require('logger').createLogger(path.resolve(__dirname, "../../logs/classifierManager.log"));
logger.setLevel('info');

var classifierManager = {

    /*
     extract most frequent terms from elastic infdex and search skos terms in BNF to build a classifier

     */
    createIndexClassifier: function (index, nWords, minFreq, ontologies, nSkosAncestors, callback) {
        classifierManager.sendMessage("searching most frequent words in index " + index);
        elasticProxy = require("../elasticProxy.js");
        elasticProxy.getAssociatedWords(index, "*", nWords, null, null, function (err, result) {
            if (err) {
                classifierManager.sendMessage("ERROR " + err);
                return callback(err);
            }
            var words = [];

            function isNumber(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            for (var i = 0; i < result.length; i++) {
                if (minFreq < 1 || result[i].count > minFreq) {
                    var word = result[i].key
                    if (isNumber(word)) {
                        continue;
                    }
                    if (word.match(/[\'\"{}]/g)) {
                        continue;
                    }
                    words.push(word);

                }


            }
            classifierManager.sendMessage("Most frequentwords " + JSON.stringify(words));
            if (ontologies.indexOf("BNF") > -1) {
                classifierManager.sendMessage("searching  concepts in BNF... ");
                classifierManager.findBnfSKOSterms(words, function (err, result) {
                    if (err)
                        return callback(err);

                    var classifier = result;
                    classifier.docIds = {};
                    var wordObj = classifier.words;

                    var words = [];
                    for (var key in wordObj) {
                        words.push(key);
                    }
                    classifierManager.sendMessage("parent concepts found " + words);
                    /*
                     fill the classifier with ids in index

                     */

                    classifierManager.sendMessage("put doc ids for each concepts ");
                    async.eachSeries(words, function (word, callbackInner) {

                            elasticProxy.findDocuments(index, word, 0, serverParams.elasticMaxFetch, null, ["id"], null, null, function (err, result) {
                                if (err)
                                    return callbackInner(err);
                                classifier.words[word].docIds = [];
                                for (var i = 0; i < result.docs.length; i++) {
                                    var id = result.docs[i]._id;
                                    classifier.words[word].docIds.push(id);
                                    if (!classifier.docIds[id])
                                        classifier.docIds[id] = [];
                                    classifier.docIds[id].push(word)
                                }

                                callbackInner(null);

                            })
                        },
                        function (err, result) {
                            /*
                             at the end store the classifier
                             */
                            if (err) {
                                classifierManager.sendMessage("ERROR" + err);
                                return callback(err);
                            }
                            var file = path.resolve(__dirname, "./classifiers/" + index + "_BNF.json");
                            var str = JSON.stringify(classifier, null, 2);
                            fs.writeFileSync(file, str);
                            classifierManager.sendMessage("classifier done :" + file);

                        })

                })
            }
        })


    },
    findBnfSKOSterms: function (words, callback) {


        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }


        var skos = {
            broaderNodes: {},
            words: {}
        }

        async.eachSeries(words, function (word, callback) {


                word = capitalizeFirstLetter(word);
                console.log(word);

                var payload =
                    [
                        {name: "broader", optional: false},
                        {name: "related", optional: true},
                        {name: "narrower", optional: true}
                    ]


                rdfProxy.getBnfTriples("BNF",word, payload, "fr", false, 100, function (err, json) {
                    if (err) {
                        console.log(err)
                        return callback(err);
                    }

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
                                console.log("___________________" + word + "  : " + relLabelValue);

                                if (!skos.words[word])
                                    skos.words[word] = {broaders: [], narrowers: [], relateds: [], count: 0};

                                if (relTypes[j] == "broader") {
                                    if (!skos.broaderNodes[relLabelValue])
                                        skos.broaderNodes[relLabelValue] = []
                                    if (skos.broaderNodes[relLabelValue].indexOf(word) < 0)
                                        skos.broaderNodes[relLabelValue].push(word);

                                    if (skos.words[word].broaders.indexOf(relLabelValue) < 0)
                                        skos.words[word].broaders.push(relLabelValue);

                                }
                                if (relTypes[j] == "narrower") {
                                    if (skos.words[word].narrowers.indexOf(relLabelValue) < 0)
                                        skos.words[word].narrowers.push(relLabelValue);

                                }
                                if (relTypes[j] == "related") {
                                    if (skos.words[word].relateds.indexOf(relLabelValue) < 0)
                                        skos.words[word].relateds.push(relLabelValue);

                                }
                            }
                        }
                    }
                    callback(null);


                })


            }

            , function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null, skos);
                /* console.log("___________________" + JSON.stringify(broader, null, 2));
                 console.log("___________________" + JSON.stringify(narrower, null, 2));
                 console.log("___________________" + JSON.stringify(related, null, 2));*/

            }
        )
    },


    getClassifierOutput: function (index, ontology, data) {
        var file = path.resolve(__dirname, "./classifiers/" + index + "_BNF.json")
        var classifier;
        try {
            classifier = "" + fs.readFileSync(file);
        }
        catch (e) {
            console.log("No file :" + file);
            return [];
        }

        var output = {};

        classifier = JSON.parse(classifier);
        var words = classifier.words;
        for (var i = 0; i < data.length; i++) {
            var docId = data[i]._id;

            var words = classifier.docIds[docId];
            if (!words)
                continue;
            for (var j = 0; j < words.length; j++) {
                classifier.words[words[j]].count += 1;

                var wordChild = words[j];
                var broaders = classifier.words[wordChild].broaders;
                console.log(wordChild);
                if(!broaders)
                    continue;
                for (var k = 0; k < broaders.length; k++) {
                    var broader = broaders[i];

                    if (!output[broader])
                        output[broader] = {text: broader, count: 0, children: []}
                    if (output[broader].children.indexOf(wordChild) < 0)
                        output[broader].children.push(wordChild);
                }


            }
        }
        var outputArray = [];
        for (var key in output) {
            var parentCount = 0;
            var children = [];
            for (var i = 0; i < output[key].children.length; i++) {
                var child = output[key].children[i];
                parentCount += classifier.words[child].count;
                children.push({
                    text: child + " (" + classifier.words[child].count + ")",
                    word: child,
                    count: classifier.words[child].count
                });
            }
            outputArray.push({text: key + " (" + parentCount + ")", word: key, count: parentCount, children: children});

        }


        return outputArray;

    }
    ,
    sendMessage: function (message) {
        socket.message(message);
        logger.info(message);
        console.log(message);
    }


    ,
    generateClassifierFromSkos: function (thesaurus, index) {
        skos.loadSkosToTree(thesaurus, function (err, result) {

            var classifier = {
                broaderNodes: {},
                words: {},
                docIds: {}
            }

            var words = []

            for (var i = 0; i < result.length; i++) {
                var node = result[i];
                if (!node.text)
                    continue;
                words.push(node.text);
                if (!classifier.words[node.text]) {
                    classifier.words[node.text] = {
                        broader: [],
                        narrower: [],
                        related: [],
                        count: 0,
                        docIds: []
                    }
                }
             //   classifier.words[node.text].push(node.text);
//console.log(node.parent)
                if (node.parent != "#") {
                    if (!classifier.broaderNodes[node.data.parentText])
                        classifier.broaderNodes[node.data.parentText] = [];
                    classifier.broaderNodes[node.data.parentText].push(node.text)
                    classifier.words[node.text].broader.push(node.data.parentText);

                }

            }


            classifierManager.sendMessage("put doc ids for each concepts ");
            async.eachSeries(words, function (word, callbackInner) {
                var subWords=word.split(" ");
                var slop=null;
                if(subWords.length>1)
                    slop=subWords.length+1
                    elasticProxy.findDocuments(index, word, 0, serverParams.elasticMaxFetch, slop, ["id"], null, null, function (err, result) {
                        if (err)
                            return callbackInner(err);
                        classifier.words[word].docIds = [];
                        for (var i = 0; i < result.docs.length; i++) {
                            var id = result.docs[i]._id;
                            classifier.words[word].docIds.push(id);
                            if (!classifier.docIds[id])
                                classifier.docIds[id] = [];
                            classifier.docIds[id].push(word)
                        }

                        callbackInner(null);

                    })
                },
                function (err, result) {
                    /*
                     at the end store the classifier
                     */
                    if (err) {
                        classifierManager.sendMessage("ERROR" + err);
                        return callback(err);
                    }
                    var file = path.resolve(__dirname, "./classifiers/" + index + "_XXX.json");
                    var str = JSON.stringify(classifier, null, 2);
                    fs.writeFileSync(file, str);
                    classifierManager.sendMessage("classifier done :" + file);

                })

        })


    }


}

module.exports = classifierManager;


//**********************************************Command Line args***********************************
const args = process.argv;
if (args.length > 2) {
    if (args[2] == "createIndexClassifier") {
        var index = args[3];

        var schema = {
                properties: {


                    index: {
                        message: "index name",
                        required: true

                    },
                    confirm: {
                        message: "create Index Classifier confirm=Y cancel=N",
                        required: true

                    }

                }
            }
        ;
        var prompt = require('prompt');
        prompt.start();

        prompt.get(schema, function (err, result) {
            if (err)
                console.log(err);
            var index = result.index;
            if (result.confirm.toLowerCase() == "y") {
                classifierManager.createIndexClassifier(index, 200, 10, ["BNF"], 1, function (err, result) {


                    console.log("done");
                })
            }


        })
    }
}

//classifierManager.generateClassifierFromSkos("PLM.rdf", "jfm")
if (false) {

    classifierManager.createIndexClassifier("jfm", 200, 10, ["BNF"], 1, function (err, result) {


        console.log("done");
    })
}
