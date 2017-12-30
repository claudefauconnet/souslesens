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


var serverParams = require("../serverParams.js");
var async = require('async');
var elasticProxy = require('../elasticProxy.js')
var socket = require('../../routes/socket.js');
var logger = require('logger').createLogger(path.resolve(__dirname, "../../logs/classifierManager.log"));
logger.setLevel('info');

var classifierManager = {




    applyClassifierToIndexAndStore: function (index, classifier, classifierFileName, callback) {
          var wordObj = classifier.words;
          var words = [];
          for (var key in wordObj) {
              words.push(key);
          }

        elasticProxy = require('../elasticProxy.js');
        async.eachSeries(words, function (word, callbackInner) {

                elasticProxy.findDocuments(index, null, word, 0, serverParams.elasticMaxFetch, null, ["id"], null, function (err, result) {
                    if (err)
                        return callbackInner(err);
                    if (!result.docs || result.docs.length == 0)
                        return callbackInner(null);
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
                if (err)
                    return callback(err);
                /*
            at the end  store the classifier
            */
                var file = path.resolve(__dirname, classifierFileName);
                var str = JSON.stringify(classifier, null, 2);
                fs.writeFileSync(file, str);
                classifierManager.sendMessage("classifier done :" + file);
                callback();

            })
    },


    getClassifierOutput: function (index, source, data) {
        var file = path.resolve(__dirname, "./classifiers/" + index + "_" + source + ".json")
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
             //   console.log(wordChild);
                if (!broaders)
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
    createIndexClassifierFromFrequentWordsAndOntology: function (index, nWords, includedWords, excludedWords, minFreq, ontologies, lang, nSkosAncestors, callback) {
        classifierManager.sendMessage("searching most frequent words in index " + index);
        elasticProxy = require("../elasticProxy.js");

        if (includedWords && includedWords.length > 0) {
            classifierManager.createIndexClassifierFromWordsListAndOntology(index, includedWords, ontologies, lang, nSkosAncestors, function (err, result) {

            });
        }
        else {
            elasticProxy.getAssociatedWords(index, "*", nWords, null, null, excludedWords,null, function (err, result) {
                if (err) {
                    classifierManager.sendMessage("ERROR " + err);
                    return callback(err);
                }
                var words = [];

                function isNumber(n) {
                    return !isNaN(parseFloat(n)) && isFinite(n);
                }

                for (var i = 0; i < result.buckets.length; i++) {
                    if (minFreq < 1 || result.buckets[i].count > minFreq) {
                        var word = result.buckets[i].key;
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
                classifierManager.createIndexClassifierFromWordsListAndOntology(index, ontologies, lang, nSkosAncestors, function (err, result) {

                });

            })
        }


    },
    createIndexClassifierFromWordsListAndOntology: function (index, words, ontologies, lang, nSkosAncestors, callback) {
        var classifier;
        async.eachSeries(ontologies, function (ontology, callbackOntology) {
            classifierManager.sendMessage("searching SKOS concepts in Ontology :" + ontology + "... ");
            skos.findOntologySKOSterms(ontology, lang, words, function (err, result) {
                if (err)
                    return callbackOntology(err);

                classifier = result;
                classifier.docIds = {};

                classifierManager.sendMessage("parent concepts found " + words);
                /*
                 fill the classifier with ids in index

                 */

                classifierManager.sendMessage("put doc ids for each concepts ");
                var fileName = "./classifiers/" + index + "_" + ontology + ".json";
                classifierManager.applyClassifierToIndexAndStore(index, classifier, function (err, result) {
                    if (err)
                        return callbackOntology(err);
                    callbackOntology();

                });
            })


        }, function (err) {

            if (err) {
                classifierManager.sendMessage("ERROR" + err);
                return callback(err);
            }


        })
    },
    sendMessage: function (message) {
        socket.message(message);
        logger.info(message);
        console.log(message);
    }


    ,
    thesaurusToClassifier: function (thesaurus, index, callback) {
        skos.loadSkosToTree(thesaurus, function (err, result) {
            if (err) {
                classifierManager.sendMessage("ERROR" + err);
                return callback(err);
            }


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

                if (node.parent != "#") {
                    if (!classifier.broaderNodes[node.data.parentText])
                        classifier.broaderNodes[node.data.parentText] = [];
                    classifier.broaderNodes[node.data.parentText].push(node.text)
                    classifier.words[node.text].broader.push(node.data.parentText);

                }

            }
            var fileName = "./classifiers/" + index + "_" + "custom" + ".json";
            classifierManager.applyClassifierToIndexAndStore(index, classifier, fileName, function (err, result) {
                if (err) {
                    classifierManager.sendMessage("ERROR" + err);
                    return callback(err);
                }
                classifierManager.sendMessage("classifier done :" + thesaurus+"_"+index);
                callback(null, "DONE")
            })
        })
    }
}


module.exports = classifierManager;


//**********************************************Command Line args***********************************
const args = process.argv;
if (args.length > 2) {
    if (args[2] == "createIndexClassifierFromFrequentWordsAndOntology") {
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
                classifierManager.createIndexClassifierFromFrequentWordsAndOntology(index, 200, null, null, 10, ["BNF"], "fr", 1, function (err, result) {


                    console.log("done");
                })
            }


        })
    }
}

//classifierManager.generateClassifierFromSkos("PLM.rdf", "jfm")
if (false) {

    classifierManager.createIndexClassifierFromFrequentWordsAndOntology("jfm", 200, 10, ["BNF"], "fr", 1, function (err, result) {


        console.log("done");
    })
}
