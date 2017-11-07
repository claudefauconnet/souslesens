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
var serverParams = require('./serverParams.js');
var mongoProxy = require('./mongoProxy.js');
var fs = require('fs');
var util = require('./util.js');
var request = require('request');
var async = require('async');
var path = require('path');
var classifierManager = require("./rdf/classifierManager.js");

var elasticCustom = require("./elasticCustom.js");

var socket = require('../routes/socket.js');
var logger = require('logger').createLogger(path.resolve(__dirname, "../logs/elastic.log"));
logger.setLevel('info');
/*logger.format =function(level,date,message){
 return  (level+"   "+date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear()+ " : "+message;
 }*/


var baseUrl = "http://vps254642.ovh.net:9200/"
var baseUrl = "http://localhost:9200/"
var maxContentLength = 150;

var client = null;

var elasticProxy = {


    ping: function () {
        getClient().ping({
            // ping usually has a 3000ms timeout
            requestTimeout: Infinity
        }, function (error) {
            if (error) {
                console.trace('elasticsearch cluster is down!');
            } else {
                console.log('All is well');
            }
        });

    },
    searchWordAll: function (word, callback) {
        getClient().search({
            q: word
        }).then(function (body) {
            var hits = body.hits.hits;
            callback(null, hits);
        }, function (error) {
            callback(error);
        });
    }

    , search: function (index, type, query, callback) {

        getClient().search({
            index: index,
            type: type,
            body: {
                query: {
                    match: {
                        body: query
                    }
                }
            }
        }).then(function (resp) {
            var hits = resp.hits.hits;
            callback(null, hits);
        }, function (err) {
            callback(err);
        });
    },
    index: function (index, type, id, payload, callback) {
        getClient().index({
            index: index,
            type: type,
            id: id,
            body: payload
        }, function (err, response) {
            if (err) {
                callback(err);
                return;

            } else {
                callback(null, response);
            }
        });
    },
    /* body: [
     // action description
     { index:  { _index: 'myindex', _type: 'mytype', _id: 1 } },
     // the document to index
     { title: 'foo' },
     // action description
     { update: { _index: 'myindex', _type: 'mytype', _id: 2 } },
     // the document to update
     { doc: { title: 'foo' } },
     // action description
     { delete: { _index: 'myindex', _type: 'mytype', _id: 3 } },
     // no document needed for this delete
     ]*/
    bulk: function (payload, callback) {
        getClient().bulk({
            body: payload
        }, function (err, resp) {
            if (err) {
                callback(err);

            } else {
                callback(null, resp);
            }
        });
    },
    exportMongoToElastic: function (mongoDB, mongoCollection, mongoQuery, elasticIndex, elasticFields, elasticType, callback) {
        mongoQuery = JSON.parse(mongoQuery);
        elasticFields = JSON.parse(elasticFields);
        mongoProxy.pagedFind(serverParams.mongoFetchSize, mongoDB, mongoCollection, mongoQuery, null, function (err, result) {
            if (err) {
                callback(err);
                return;
            }
            var startId = Math.round(Math.random() * 10000000);
            var elasticPayload = [];

            for (var i = 0; i < result.length; i++) {
                elasticPayload.push({index: {_index: elasticIndex, _type: elasticType, _id: "_" + (startId++)}})
                var payload = {};
                for (var j = 0; j < elasticFields.length; j++) {
                    var value = result[i][elasticFields[j]];
                    if (value) {
                        payload[elasticFields[j]] = value;
                    }

                }
                elasticPayload.push(payload);

            }
            getClient().bulk({
                body: elasticPayload
            }, function (err, resp) {
                if (err) {
                    callback(err);

                } else {
                    callback(null, resp);
                }
            });


        });
    },


    indexDocumentDir: function (dir, index, recursive, callback) {

        var acceptedExtensions = ["doc", "docx", "xls", "xslx", "pdf", "ppt", "pptx", "html", "htm", "txt", "csv"];

        var indexedFiles = [];

        function getFilesRecursive(dir) {
            elasticProxy.sendMessage("indexing " + dir);
            dir = path.normalize(dir);
            if (dir.charAt(dir.length - 1) != '/')
                dir += '/';
            var files = fs.readdirSync(dir);
            for (var i = 0; i < files.length; i++) {
                var fileName = dir + files[i];
                var stats = fs.statSync(fileName);

                if (stats.isDirectory()) {
                    getFilesRecursive(fileName)
                }
                else {
                    var p = fileName.lastIndexOf(".");
                    if (p < 0)
                        continue;
                    var extension = fileName.substring(p + 1).toLowerCase();
                    if (acceptedExtensions.indexOf(extension) < 0) {
                        logger.info("!!!!!!  refusedExtension " + fileName);
                        continue;
                    }


                    // console.log("File" + fileName + " size " + stats.size + " ---------------" + (i++));
                    if (stats.size > serverParams.elasticsaerchMaxDocSizeForIndexing) {
                        logger.info("!!!!!! file  too big " + Math.round(stats.size / 1000) + " Ko , not indexed ");
                        continue;

                    }
                    indexedFiles.push(fileName);
                }
            }

        }

        getFilesRecursive(dir);

        indexedFiles.sort();
        var t0 = new Date().getTime();
        async.eachSeries(indexedFiles, function (fileName, callbackInner) {
                var base64Extensions = ["doc", "docx", "xls", "xslx", "pdf", "ppt", "pptx"];
                var p = fileName.lastIndexOf(".");
                if (p < 0)
                    callback("no extension for file " + fileName);
                var extension = fileName.substring(p + 1).toLowerCase();
                var base64 = false;

                if (base64Extensions.indexOf(extension) > -1) {
                    base64 = true;


                }
                var t1 = new Date().getTime();
                elasticProxy.indexDocumentFile(fileName, index, base64, function (err, result) {
                    if (err) {
                        logger.error(err)
                        return callbackInner(err)
                    }
                    var duration = new Date().getTime() - t1;
                    logger.info("file " + fileName + "   indexed .Duration (ms) : " + duration)

                    callbackInner(null)


                });


            }, function (err, result) {
                if (err)
                    return callback(err);
                var duration = new Date().getTime() - t0;
                var message = "indexation done " + indexedFiles.length + "documents  in " + duration + " msec.";
                console.log(message)
                return callback(null, message);

            }
        );


    }


    ,


    deleteIndex: function (index, force, callback) {
        var options = {
            method: 'HEAD',
            url: baseUrl + index + "/"
        }
        request(options, function (error, response, body) {

            var status = response.statusCode;
            if (!status) {
                return callback("elastic server did not respond, is the service on?")
            }
            if (status == 200 && force) {
                var options = {
                    method: 'DELETE',
                    url: baseUrl + index + "/"
                }
                request(options, function (error, response, body) {
                    if (error) {
                        logger.error(error)
                        return callback(error);
                    }
                    logger.info("-----index " + index + " deleted-----");
                    callback(null);
                })

            }
            else {
                logger.info("-----index " + index + " does not exist-----");
                callback(null);
            }
        })
    }
    ,


    initDocIndex: function (index, callback) {

        elasticProxy.deleteIndex(index, true, function (err) {
            if (err)
                return callback(err);
//******************************* init attachment Pipeline*******************************

            var options = {
                method: 'PUT',
                description: "Extract attachment information",
                url: baseUrl + "_ingest/pipeline/attachment",
                json: {
                    processors: [
                        {
                            "attachment": {
                                "field": "data"
                            }
                        }
                    ]
                }
            };


            request(options, function (error, response, body) {
                if (error)
                    return callback(error);

//******************************* init content Mapping*******************************
                var options = {
                    method: 'PUT',
                    description: "init mapping on attachment content",
                    url: baseUrl + index + "/",

                    json: {
                        "mappings": {
                            "type_document": {

                                "properties": {
                                    "content": {
                                        "type": "text",
                                        "index_options": "offsets",

                                        "fields": {
                                            "contentKeyWords": {
                                                "type": "keyword",
                                                "ignore_above": 256
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                };

                request(options, function (error, response, body) {
                    if (error)
                        return callback(error);
                    //******************************* initfielddata*******************************
                    //    http://localhost:9200/my_index2/_mapping/my_type
                    var options = {
                        method: 'PUT',
                        description: "init fielddata",
                        url: baseUrl + index + "/_mapping/type_document",
                        json: {
                            "properties": {
                                "content": {
                                    "type": "text",
                                    "fielddata": true
                                }
                            }
                        }
                    }
                    request(options, function (error, response, body) {
                        if (error)
                            return callback(error);
                        if (body.error)
                            return callback(body.error);
                        callback(null, body)

                    });
                });
            });
        })

    },
    indexDocumentFile: function (file, index, base64, callback) {
        var id = "R" + Math.round(Math.random() * 1000000000)
        //  var file = "./search/testDocx.doc";
        //  var file = "./search/testPDF.pdf";
        var fileContent;
        var options;
        if (base64) {
            index = index + "temp"
            fileContent = util.base64_encodeFile(file);
            options = {
                method: 'PUT',
                url: baseUrl + index + "/type_document/" + id + "?pipeline=attachment",
                json: {
                    "data": fileContent,
                    "path": file
                }
            }
        }
        else {
            fileContent = "" + fs.readFileSync(file);
            fileContent = elasticCustom.processContent(fileContent);
            var title = file.substring(file.lastIndexOf("/") + 1);
            options = {
                method: 'PUT',
                url: baseUrl + index + "/type_document/" + id,
                json: {
                    "content": fileContent,
                    "path": file,
                    "title": title
                }
            }
        }


        request(options, function (error, response, body) {
            if (error) {
                logger.error(error);
                console.error(error);
                return callback(error);
            }
            if (body.error) {
                logger.error(body.error);
                console.error(body.error);
                if (body.error.reason) {
                    logger.error(body.error.reason);
                    console.error(body.error.reason);
                }
                return callback(body.error);
            }
            return callback(null, body);


        });

    },


    copyDocIndex: function (oldIndex, newIndex, callback) {

        var payload = {
            "from": 0, "size": serverParams.elasticMaxFetch,
            "_source": ["attachment.content", "path", "attachment.date", "attachment.title", "content"],
            "query": {
                "match_all": {}
            }
        }

        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + oldIndex + "/_search"
        };

        console.log(JSON.stringify(payload, null, 2));
        request(options, function (error, response, body) {

            if (error)
                return callback(error);
            if (!body.hits || !body.hits.hits)
                console.log("aaaaaaaaaaaaaaaaaaa")
            var hits = body.hits.hits;
            var result = [];
            var newObjs = []
            for (var i = 0; i < hits.length; i++) {
                var obj = {};
                var objElastic = hits[i]._source;

                var newObj = {
                    path: objElastic.path,
                }
                if (objElastic.attachment) {
                    newObj.content = objElastic.attachment.content;
                    newObj.date = objElastic.attachment.date,
                        newObj.title = objElastic.attachment.title;
                }
                else {
                    newObj.content = objElastic.content;
                    newObj.title = objElastic.title;
                }


                newObjs.push(newObj);
            }
            async.eachSeries(newObjs, function (newObj, callbackInner) {
                var id = "R" + Math.round(Math.random() * 1000000000)
                options.url = baseUrl + newIndex + "/type_document/" + id;
                options.json = newObj;
                request(options, function (error, response, body) {
                    if (error)
                        return callbackInner(error);
                    logger.info("index " + oldIndex + " copied to" + newIndex)
                    return callbackInner(null);
                });

            }, function (err) {
                callback(err, result);
            });


        });

    }
    ,

    findDocumentsById: function (index, ids, words, withClassifier, callback) {

        var payload =
            {
                "from": "0",
                "_source": [
                    "title",
                    "date",
                    "type",
                    "path",
                    "content"
                ],
                "query": {
                    "bool": {
                        "must": [
                            {
                                "ids": {
                                    "values": ids
                                }
                            }
                        ]
                    }
                }

                ,
                "highlight": {
                    "fields": {
                        "content": {"number_of_fragments": 100}
                    }
                }
            };
        for (var i = 0; i < words.length; i++) {
            payload.query.bool.must.push({"match": {"content": words[i]}})
        }

        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };

        console.log(JSON.stringify(payload, null, 2));
        request(options, function (error, response, body) {
            elasticProxy.processSearchResult(error, body, withClassifier, callback);

        });
    },
    findSimilarDocuments: function (index, docId, minScore, size, callback) {


        var payload =
            {
                "size": size,
                "query": {
                    "more_like_this": {
                        "fields": ["content"],
                        "like": [
                            {
                                "_index": index,
                                "_type": "type_document",
                                "_id": docId
                            }],
                        "min_word_length": 5


                    },

                }
            }
        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };


        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (!body.hits) {
                return callback(null, []);
            }
            var hits = body.hits.hits;
            var docs = [];
            for (var i = 0; i < hits.length; i++) {
                var obj = {};
                var objElastic = hits[i]._source;
                obj.title = objElastic.title;
                obj._id = hits[i]._id;
                obj._score = Math.round(hits[i]._score * 10);
                obj.date = objElastic.date;
                obj.path = objElastic.path;
                if (objElastic.content) {
                    if (objElastic.content.length > maxContentLength)
                        obj.content = objElastic.content.substring(0, maxContentLength) + "...";
                    else
                        obj.content = objElastic.content;
                }

                docs.push(obj);

                docs.sort(function (a, b) {
                    if (a._score > b._score)
                        return -1;
                    if (a._score < b._score)
                        return 1;
                    return 0;
                })
            }
            return callback(null, docs);

        });
    },


    findDocuments: function (index, word, from, size, slop, fields, andWords, withClassifier, callback) {
        var match = {"content": word};
        if (!fields)
            fields = ["title", "date", "type", "path"];
        var query = "";
        if (!slop || slop < 2) {
            query = {
                "match": match
            }
        } else {
            query = {

                "match_phrase": {
                    "content": {
                        "query": word,
                        "slop": util.convertNumStringToNumber(slop)
                    }
                }
            }
        }

        if (word.indexOf("*") > -1) {
            query = {
                "wildcard": {"content": word}
            }
        }


        if (andWords && andWords.length > 0) {


            query =
                {
                    "bool": {
                        "must": [
                            query

                        ]
                    }
                }

            for (var i = 0; i < andWords.length; i++) {
                query.bool.must.push({"match": {"content": andWords[i]}})
            }

        }


        var payload = {
            "from": from,
            "size": size,
            "_source": fields,
            "query": query,
            "highlight": {
                "fields": {
                    "content": {}
                    //  "content":{"fragment_size" : 50, "number_of_fragments" : 10}
                }
            }

        }
        console.log(JSON.stringify(payload, null, 2));

        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };


        request(options, function (error, response, body) {
            elasticProxy.processSearchResult(error, body, withClassifier, callback);

        });
    },
    processSearchResult: function (error, body, withClassifier, callback) {

        if (error)
            return callback(error);
        if (!body.hits) {
            return callback(null, []);
        }
        var hits = body.hits.hits;
        var total = body.hits.total;
        var docs = [];
        var index;
        for (var i = 0; i < hits.length; i++) {
            if (i == 0)
                index = hits[i]._index;
            var obj = {};
            var objElastic = hits[i]._source;
            obj.title = objElastic.title;
            obj._id = hits[i]._id;
            obj.date = objElastic.date;
            obj.path = objElastic.path;
            if (hits[i].highlight)
                obj.highlights = hits[i].highlight.content
            if (objElastic.content)
                obj.content = objElastic.content;
            docs.push(obj);
        }
        var classifier;
        if (index && withClassifier == "true")
            classifier = classifierManager.getClassifierOutput(index, "BNF", docs);
        var result = {
            docs: docs,
            classifier: classifier,
            total: total
        }

        return callback(null, result);


    }
    , getAssociatedWords: function (index, word, size, slop, andWords, callback) {

        if (typeof word === "object" && word.ids) {
            query = {
                "bool": {
                    "must": [
                        {
                            "ids": {
                                "values": word.ids
                            }
                        }
                    ]

                }
            }
        }
        else if (andWords && andWords.length > 0) {
            query =
                {
                    "bool": {
                        "must": [
                            {"match": {"content": word}}

                        ]
                    }
                }

            for (var i = 0; i < andWords.length; i++) {
                query.bool.must.push({"match": {"content": andWords[i]}})
            }
        }
        else {// word simple
            var match;
            if (word == null || word == "*" || word == "")
                match = {"match_all": {}}
            else
                match = {"match": {"content": word}};


            var query = "";
            if (!slop || slop < 2) {
                query = match;
            } else {
                query = {

                    "match_phrase": {
                        "content": {
                            "query": word,
                            "slop": util.convertNumStringToNumber(slop)
                        }
                    }
                }
            }


        }
        var payload = {
            "query": query,
            "size": 0,
            "aggs": {
                "associatedWords": {
                    "terms": {

                        "field": "content",
                        "size": size,
                        "exclude": ["le", "la", "les", "un", "une", "des", "je", "tu", "il", "à", "a",
                            "elle", "nous", "vous", "ils", "moi", "toi", "lui", "eux", "a", "est",
                            "sont", "si", "et", "pour", "dans", "du", "en", "par", "sur",
                            "etre", "que", "au", "qui", "plus", "pas", "ce", "avec", "aux", "au",
                            "cette", "ce", "ces", "non", "oui", "donc", "un", "une", "ceci", "est", "tres",
                            "fait", "entre", "trois", "apres", "avant", "pendant", "ete", "moins", "contre",
                            "dont", "ses", "sous", "son", "tout", "car", "cela", "comme", "bien", "mais",
                            "tout", "rien", "trop", "veut", "deux", "notre", "nos", "votre", "vos", "leurs",
                            "leur", "via", "ainsi", "chaque", "data", "deja", "faire",
                            "applications", "are", "aux", "avec", "afin", "aussi", "base", "but",
                            "cas", "etc", "exemple", "idee", "information", "lors",
                            "mettre", "mise", "mon", "meme", "part", "permet", "peut", "place",
                            "possible", "pourrait", "sans", "serait", "soit", "total",
                            "autres", "avoir", "avons", "chez", "ai", "meilleure", "permettant",
                            "plusieurs", "simple", "tous", "egalement",
                            "creer", "doit", "faut", "good", "groupe", "important", "jour",
                            "niveau", "nombre", "necessaire", "oeuvre", "permettre", "peuvent", "point",
                            "points", "possibilite", "toutes", "travail", "type", "vers",
                            "differents", "proposer", "null", "permettrait", "mieux", "sein", "000",
                            "fois", "local", "utiliser", "video", "videos", "images", "francois", "nicolas", "direct", 'même',
                            'monde',
                            'd’une',
                            'autre',
                            'selon',
                            'toute',
                            'c’est',
                            'd’un',
                            'forme',
                            'celle',
                            'très',
                            'certains',
                            'depuis',
                            'encore',
                            'alors',
                            'quand',
                            'certain',
                            'seulement',
                            'était',
                            'autour',
                            'avait',
                            'tant',
                            'étant',
                            'ceux',
                            'celui',
                            'différentes',
                            'elles',
                            'celle',
                            'd’autres',
                            'souvent',
                            'surtout',
                            'après',
                            'n’est',
                            'l’on',
                            'qu’il',
                            "de",
                            "ou",
                            "ne",
                            "on",
                            "se",
                            "sa",
                            "p",
                            "y",
                            "ont",
                            "où",
                            "été",
                            "toujours",
                            "dire", "ci", "là", "cet",
                            "dit",
                            "n",
                            "quelque",
                            "in",
                            "mêmes",
                            "t",
                            "b",
                            "peu",
                            "propre",
                            "ici",
                            "déjà",
                            "d",
                            "seule",
                            "celles",
                            "ni",
                            "tel",
                            "of",
                            "puis",
                            "va",
                            "rôle",
                            "telle",
                            "jamais",
                            "mis",
                            "côté",
                            "quelques",
                            "cependant",
                            "the",
                            "plutôt",
                            "autant",
                            "suite",
                            "également",
                            "dès",
                            "c",
                            "lequel",
                            "ensuite",
                            "qu’*",
                            "d'*",
                            "s'*",
                            "and",
                            "l",




                            "shall",
                            "be",
                            "to",
                            "for",
                            "with",
                            "or",
                            "as",
                            "by",
                            "all",
                            "at",
                            "is",
                            "not",
                            "this",
                            "from",
                            "any",
                            "that",
                            "used",
                            "each",
                            "if",
                            "an",
                            "when",
                            "case",
                            "have",
                            "during",
                            "than"




                        ]
                    }
                }
            }
        }
        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };

        //  console.log(JSON.stringify(payload,null,2))
        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (!body.hits) {
                return callback(null, []);
            }
            var buckets = body.aggregations.associatedWords.buckets;
            var result = [];
            for (var i = 0; i < buckets.length; i++) {

                var obj = {};
                var objElastic = buckets[i];
                obj.key = objElastic.key;
                obj.count = objElastic.doc_count;

                result.push(obj);
            }
            return callback(null, result);

        });

    }
    ,
    indexDocDirInNewIndex: function (index, rootDir, doClassifier, callback) {

        if (!fs.existsSync(rootDir)) {
            var message = ("directory " + rootDir + " does not not exist on server" )
            elasticProxy.sendMessage("ERROR" + message);
            return callback(message);
        }

        var indexTemp = index + "temp";
        elasticProxy.initDocIndex(index, function (err, result) {
            if (err) {
                elasticProxy.sendMessage("ERROR" + err);
                return callback(err);
            }
            elasticProxy.sendMessage("index " + index + " created");

            elasticProxy.initDocIndex(indexTemp, function (err, result) {
                if (err) {
                    elasticProxy.sendMessage("ERROR" + err);
                    return callback(err);
                }
                elasticProxy.sendMessage("index " + indexTemp + " created");


                elasticProxy.sendMessage("indexing  directory " + rootDir + "  and sub directories");
                elasticProxy.indexDocumentDir(rootDir, index, true, function (err, result) {
                    if (err) {
                        elasticProxy.sendMessage("ERROR" + err);
                        return callback(err);
                    }

                    elasticProxy.sendMessage("indexation in tempIndex successfull " + result);


                    elasticProxy.copyDocIndex(indexTemp, index, function (err, result) {
                        if (err) {
                            elasticProxy.sendMessage("ERROR" + err);
                            return callback(err);
                        }
                        elasticProxy.sendMessage("index " + indexTemp + " copied to " + index);

                        elasticProxy.deleteIndex(indexTemp, true, function (err, result) {
                            elasticProxy.sendMessage("delete temporary index " + indexTemp);
                            var message = "-----------Index " + index + " is ready to use-----------"
                            if (doClassifier.toLowerCase() == "y") {

                                classifierManager.createIndexClassifier(index, 200, 10, ["BNF"], "fr", 1, function (err, result) {
                                    elasticProxy.sendMessage("classifier done");

                                    elasticProxy.sendMessage(message);
                                })
                            }
                            return callback(null, message);

                        });
                    });

                });


            });
        })
    }
    , indexDirInExistingIndex: function (index, rootDir, doClassifier, callback) {
        if (!fs.existsSync(rootDir)) {
            var message = ("directory " + rootDir + " does not not exist on server" )
            elasticProxy.sendMessage("ERROR" + message);
            return callback(message);
        }
        var indexTemp = index + "temp";
        var options = {
            method: 'HEAD',
            url: baseUrl + index + "/"
        }
        request(options, function (error, response, body) {

            var status = response.statusCode;
            if (!status) {
                elasticProxy.sendMessage("ERROR :elastic server did not respond, is the service on?")
            }
            if (status != 200) {
                elasticProxy.sendMessage("ERROR index " + index + " does not exists")
            }


            elasticProxy.initDocIndex(indexTemp, function (err, result) {
                if (err) {
                    elasticProxy.sendMessage("ERROR" + err);
                    return callback(err);
                }
                elasticProxy.sendMessage("index " + indexTemp + " created");


                elasticProxy.sendMessage("indexing  directory " + rootDir + "  and sub directories");
                elasticProxy.indexDocumentDir(rootDir, indexTemp, true, function (err, result) {
                    if (err) {
                        elasticProxy.sendMessage("ERROR" + err);
                        return callback(err);
                    }

                    elasticProxy.sendMessage("indexation in tempIndex successfull " + result);


                    elasticProxy.copyDocIndex(indexTemp, index, function (err, result) {
                        if (err) {
                            elasticProxy.sendMessage("ERROR" + err);
                            return callback(err);
                        }

                        elasticProxy.sendMessage("index " + indexTemp + " copied to " + index);
                        elasticProxy.deleteIndex(indexTemp, true, function (err, result) {
                            var message = "-----------Index " + index + " is ready to use-----------"
                            elasticProxy.sendMessage("delete temporary index " + indexTemp);
                            if (doClassifier.toLowerCase() == "y") {
                                classifierManager.createIndexClassifier(index, 200, 10, ["BNF"],"fr", 1, function (err, result) {

                                    elasticProxy.sendMessage("classifier done");
                                    elasticProxy.sendMessage(message);
                                })
                            }
                            else {
                                elasticProxy.sendMessage("index " + index + " updated");
                            }
                            return callback(null, message);

                        });
                    });

                });


            });
        })
    }
    ,
    sendMessage: function (message) {
        socket.message(message);
        logger.info(message);
        console.log(message);
    }


}


function getClient() {

    if (client)
        return client;
    return new elasticsearch.Client({
        host: serverParams.elasticUrl,
        log: 'trace'
    });
}

function indexJsonFile(filePath, ealasticUrl) {
    var payload = fs.readFileSync(filePath);
    payload = "" + payload,
        client.bulk({
            body: payload
        }, function (err, resp) {
            if (err) {
                callback(err);

            } else {
                callback(null, resp);
            }
        });

}

module.exports = elasticProxy;


//**********************************************Command Line args***********************************
const args = process.argv;
if (args.length > 2) {
    if (args[2] == "indexDirInNewIndex") {

        var schema = {
            properties: {
                index: {
                    message: "indexName",
                    required: true
                },
                rootDir: {
                    message: "root directory",
                    required: true
                },
                generateBNFclassifier: {
                    message: "generate BNF classifier ? confirm=Y cancel=N",
                },
                message: {
                    message: "create index " + index + " and index dir " + dirPath + " confirm=Y cancel=N",
                    required: true

                }
            }
        };
        var prompt = require('prompt');
        prompt.start();

        prompt.get(schema, function (err, result) {
            if (result.message.toLowerCase() == "y") {
                var index = result.index;
                var rootDir = result.rootDir;
                var doClassifier = result.generateBNFclassifier;
                elasticProxy.indexDocDirInNewIndex(index, rootDir, doClassifier, function (err, result) {
                    if (err)
                        console.log("ERROR " + err);
                    console.log("DONE");
                })

            }
        });


    }
    if (args[2] == "indexDirInExistingIndex") {
        var index = args[3];
        var dirPath = args[4];
        console.log("index dir " + dirPath + " in index " + index);
        var schema = {
            properties: {

                index: {
                    message: "indexName",
                    required: true

                },
                rootDir: {
                    message: "root directory",
                    required: true

                },
                updateBNFclassifier: {
                    message: "generate BNF classifier ? confirm=Y cancel=N",


                },

                message: {
                    message: "create index " + index + " and index dir " + dirPath + " confirm=Y cancel=N",
                    required: true

                }
            }
        };
        var prompt = require('prompt');
        prompt.start();

        prompt.get(schema, function (err, result) {
            if (result.message.toLowerCase() == "y") {
                var index = result.index;
                var indexTemp = index + "Temp";
                var rootDir = result.rootDir;
                var doClassifier = result.updateBNFclassifier;
                elasticProxy.indexDirInExistingIndex(index, rootDir, doClassifier, function (err, result) {
                    if (err)
                        console.log("ERROR " + err);
                    console.log("DONE");
                })


            }
        });


    }


}

if (false) {
    elasticProxy.indexDocDirInNewIndex("dsi", "D:\\docsDSI", "false", function (err, result) {

    })

}


if (false) {
    elasticProxy.indexDocDirInNewIndex("jfm", "D:\\JFM\\ETUDES DOCTORALES", "false", function (err, result) {

    })

}

