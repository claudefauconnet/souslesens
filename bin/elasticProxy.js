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

//did you mean
// http://www.bilyachat.com/2015/07/search-like-google-with-elasticsearch.html
var elasticsearch = require('elasticsearch');
var serverParams = require('./serverParams.js');
var mongoProxy = require('./mongoProxy.js');
var fs = require('fs');
var util = require('./util.js');
var request = require('request');
var async = require('async');
var path = require('path');
var mime = require('mime');

var classifierManager = require("./rdf/classifierManager.js");

var elasticCustom = require("./elasticCustom.js");
var fileInfos = require('./fileInfos..js');
var socket = require('../routes/socket.js');


var logger = require('logger').createLogger(path.resolve(__dirname, "../logs/elastic.log"));
logger.setLevel('info');
/*logger.format =function(level,date,message){
 return  (level+"   "+date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear()+ " : "+message;
 }*/


//var baseUrl = "http://vps254642.ovh.net:9200/"
var baseUrl = serverParams.elasticUrl
var maxContentLength = 150;
var elasticSchema = null;
var wordBlackList = null;
var users = null;
var client = null;

var elasticProxy = {


    getSchema: function (index) {
        if (!elasticSchema) {
            var str = fs.readFileSync(path.resolve(__dirname, "../config/search/elasticSchema.json"));

            try {
                //  console.log("" + str)
                elasticSchema = JSON.parse("" + str);
            }
            catch (e) {
                console.log(e)
                return null;
            }
        }
        if (!index)
            return null;
        var schema = elasticSchema._indexes[index];
        if (!schema) {
            return {};
        } else {


            elasticProxy.initSchema(index);
            return schema;
        }
    },

    initSchema: function (index, type) {

        var fields = [];
        var types = [];
        if (type) {// only fields of this type
            types.push(elasticSchema._indexes[index].mappings[type]);
        }
        else {// all fields of all types
            for (var key in elasticSchema._indexes[index].mappings) {
                types.push(elasticSchema._indexes[index].mappings[key]);
            }
        }
        for (var i = 0; i < types.length; i++) {

            for (var key in types[i].properties) {
                fields.push(key);
                if (types[i].properties[key].isTitle)
                    elasticSchema._indexes[index].titleField = key;

            }

        }
        elasticSchema._indexes[index].fields = fields;

    },
    getWordBlacklist: function () {
        if (!wordBlackList) {
            var str = fs.readFileSync(path.resolve(__dirname, "../config/search/wordBlackList.json"));

            try {
                console.log("" + str)
                wordBlackList = JSON.parse("" + str);
            }
            catch (e) {
                console.log(e)
                return null;
            }
        }
        return wordBlackList;

    },
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

    ,

    search: function (index, type, query, callback) {

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


    findDocumentsById: function (index, ids, words, callback) {

        var payload =
            {
                "from": "0",

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
        var fields = elasticProxy.getShemaFields(index);
        if (!fields)
            fields = ["content"];
        if (fields.indexOf("content") < 0)
            fields.push("content");


        payload._source = fields;

        if (words) {
            for (var i = 0; i < words.length; i++) {
                if (words[i] == "")
                    continue;
                if (words[i].indexOf("*") > -1) {
                    payload.query.bool.must.push({"wildcard": {"content": words[i]}})

                } else

                    payload.query.bool.must.push({"match": {"content": words[i]}})
            }
        }

        var options = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };

        console.log(JSON.stringify(payload, null, 2));
        request(options, function (error, response, body) {
            var options = {
                error: error,
                index: index,
                body: body,
                callback: callback
            }
            elasticProxy.processSearchResult(options);

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
                                "_type": "general_document",
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


    // findDocuments: function (index, type, word, queryField, from, size, slop, resultFields, andWords, callback) {
    findDocuments: function (options, callback) {
        var index = options.indexName;
        var type = options.type;
        var word = options.word;
        var queryField = options.queryField;
        var from = options.from;
        var size = options.size;
        var slop = options.slop;
        var resultFields = options.resultFields;
        var andWords = options.andWords;
        var booleanSearchMode = options.booleanSearchMode;
        if (!booleanSearchMode)
            booleanSearchMode = "and";
        if (slop && slop != "")
            slop = parseInt(slop);
        else
            slop = 0;


        var match = {"content": word};

        if (!queryField)
            queryField = "content"
        else
            queryField = "content." + queryField


        if (!resultFields) {
            resultFields = elasticProxy.getShemaFields(index, type);

        }
        if (size)
            size = parseInt("" + size)
        var query = "";

        if (word == null || word == "*" || word == "")//all
            query = {"match_all": {}}

        var shouldQuery = null;


        if (word.indexOf(" ") > -1 && slop == 0) {//or
            var words = word.split(" ");
            var shouldQueries = [];
            for (var i = 0; i < words.length; i++) {
                var word = words[i];
                if (word == "")
                    continue;

                var aShouldQuery = {};
                if (word.indexOf("*") > -1) {
                    aShouldQuery = {
                        "wildcard": {"content": word}
                    }
                } else {
                    aShouldQuery = {"match": {}};
                    aShouldQuery.match[queryField] = word;
                }
                shouldQueries.push(aShouldQuery);
            }
            shouldQuery =
                {
                    "bool": {
                        "should": [
                            shouldQueries
                        ]
                    }
                }


        }


        var mustQuery = null;
        if (andWords && andWords.length > 0) {//must
            if (word.indexOf("*") > -1) {
                query = {
                    "wildcard": {"content": word}
                }
            } else {
                query = {"match": {}};
                query.match[queryField] = word;
            }

            mustQuery =
                {
                    "bool": {
                        "must": [
                            query
                        ]
                    }
                }


            for (var i = 0; i < andWords.length; i++) {
                var andWord = andWords[i];
                if (andWord == "")
                    continue;

                var queryAndWords = {};
                if (andWord.indexOf("*") > -1) {
                    queryAndWords = {
                        "wildcard": {"content": andWord}
                    }
                } else {
                    var queryAndWords = {"match": {}};
                    queryAndWords.match[queryField] = andWord;
                }


                mustQuery.bool.must.push(queryAndWords);

            }

        }

        if (mustQuery && shouldQuery) {
            if (booleanSearchMode == "and") {
                query =
                    {
                        "bool": {
                            "must": [
                                mustQuery, shouldQuery
                            ]
                        }
                    }
            }
            else {
                query =
                    {
                        "bool": {
                            "should": [
                                mustQuery, shouldQuery
                            ]
                        }
                    }
            }
        } else if (mustQuery) {
            query = mustQuery;
        }
        else if (shouldQuery) {
            query = shouldQuery;
        } else {
            if (slop || slop > 2) {// match_phrase
                query = {
                    "match_phrase": {}
                }
                query.match_phrase[queryField] = {
                    "query": word,
                    "slop": util.convertNumStringToNumber(slop)
                }
            }

            else if (word.indexOf("*") > -1) {
                query = {
                    "wildcard": {}
                }
                query.wildcard[queryField] = word;
            }
            else {
                query = {
                    "match": {}
                }
                query.match[queryField] = word;
            }


        }


        var payload = {
            "from": from,
            "size": size,

            "query": query,
            "highlight": {
                "fields": {
                    "content": {"fragment_size": 50, "number_of_fragments": 5}
                }
            }

        }
        if (resultFields)
            payload._source = resultFields;

        if (!type)
            type = "";
        else
            type = "/" + type;

        var httpOptions = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + type + "/_search"
        };

        console.log(JSON.stringify(payload, null, 2));
        request(httpOptions, function (error, response, body) {

            var processSearchResultOptions = {
                error: error,
                index: index,
                body: body,
                callback: callback
            }
            if (options.getAssociatedWords) {
                processSearchResultOptions.getAssociatedWords = options.getAssociatedWords;
                processSearchResultOptions.getAssociatedWords.query = query;
            }

            elasticProxy.processSearchResult(processSearchResultOptions);

        });
    },
    processSearchResult: function (options) {
        var error = options.error;
        var index = options.index;
        var body = options.body;
        var callback = options.callback

        if (error) {
            console.log(error);
            return callback(error);
        }
        if (!body.hits) {
            return callback(null, []);
        }
        var hits = body.hits.hits;

        var total = body.hits.total;
        var docs = []


        var uiMappings = {};
        var icons = [];
        var mode = "read";
        var csvFields = [];
        var titleField = "title";
        var indexSchema = elasticProxy.getSchema(index);
        if (indexSchema) {

            if (indexSchema.uiMappings)
                uiMappings = indexSchema.uiMappings;
            if (indexSchema.icons)
                icons = indexSchema.icons;
            if (indexSchema.mode)
                mode = indexSchema.mode
            if (indexSchema.csvFields)
                csvFields = indexSchema.csvFields;
            var str = indexSchema.titleField;
            if (str)
                titleField = str;
        }
        var indexStats = {};
        for (var i = 0; i < hits.length; i++) {

            var obj = {};
            var objElastic = hits[i]._source;

            objElastic.title = objElastic[titleField];

            for (var key in objElastic) {
                var value = objElastic[key];
                if (value) {
                    if (typeof value === "string")
                        value = value.replace("undefined", "")
                    if (uiMappings[key]) {
                        obj[uiMappings[key]] = value;
                    }

                    obj[key] = value;
                }
            }


            obj.highlights = [];
            if (hits[i].highlight && hits[i].highlight.content) {

                //dedoublonage des highlights
                for (var j = 0; j < hits[i].highlight.content.length; j++) {
                    if (obj.highlights.indexOf(hits[i].highlight.content[j]) < 0)
                        obj.highlights.push(hits[i].highlight.content[j]);
                }

            }


            obj.type = hits[i]._type;
            obj._id = hits[i]._id;
            obj._index = hits[i]._index;
            if (!indexStats[obj._index])
                indexStats[obj._index] = 0;
            indexStats[obj._index] += 1;

            docs.push(obj);
        }

        var result = {
            docs: docs,

            total: total,
            icons: icons,
            mode: mode,
            csvFields: csvFields,
            indexStats:indexStats

        }


        if (options.getAssociatedWords) {
            var index = options.getAssociatedWords.indexName;
            var size = options.getAssociatedWords.size;
            var options = options.getAssociatedWords;

            word = null;

            elasticProxy.getAssociatedWords(index, word, size, options, function (err, result2) {
                if (err) {
                    result.associatedWords = {};
                }
                result.associatedWords = result2

                return callback(null, result);

            })
        } else {
            return callback(null, result);
        }


    }
    ,
    getAssociatedWords: function (index, word, size, options, callback) {

        //   getAssociatedWords: function (index, word, size, slop, andWords, stopWords, classifierSource, iterations, callback) {

        if (!options) {
            options = {};
        }
        if (options.iterations && options.iterations != "")

            options.iterations = parseInt("" + options.iterations);
        else
            options.iterations = 0


        if (options && options.query) {
            query = options.query;
        }
        else {

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
            else if (options.andWords && options.andWords.length > 0) {
                query =
                    {
                        "bool": {
                            "must": [
                                {"match": {"content": word}}

                            ]
                        }
                    }

                for (var i = 0; i < options.andWords.length; i++) {
                    query.bool.must.push({"match": {"content": options.andWords[i]}})
                }
            }
            else {// word simple
                var match;
                if (word == null || word == "*" || word == "")
                    match = {"match_all": {}}
                else if (word.indexOf("*") > -1) {
                    query = {
                        "wildcard": {"content": word}
                    }
                }

                else
                    match = {"match": {"content": word}};


                var query = "";
                if (!options.slop || options.slop < 2) {
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
        }
        var wordBlacklist = elasticProxy.getWordBlacklist();
        var payload = {
            "query": query,
            "size": serverParams.elasticMaxFetch,
            _source: "",
            "aggs": {
                "associatedWords": {
                    "terms": {
                        "order": {"_count": "desc"},
                        "field": "content",
                        "size": size,
                        "exclude": wordBlacklist
                    }
                }
            }
        }


        /*    payload.aggs={

                    "significant_crime_types" : {
                        "significant_terms" : { "field" : "content" }

                }
            }*/
        if (false && options.stopWords) {

            for (var i = 0; i < stopWords.length; i++) {
                payload.aggs.associatedWords.terms.exclude.push(options.stopWords[i]);
            }
        }
        else
            options.stopWords = [];
        var ajaxOptions = {
            method: 'POST',
            json: payload,
            url: baseUrl + index + "/_search"
        };

        //  console.log(JSON.stringify(payload, null, 2))
        request(ajaxOptions, function (error, response, body) {
            if (error)
                return callback(error);
            if (!body.hits) {
                return callback(null, []);
            }

            var types = [];
            var hits = body.hits.hits;
            for (var i = 0; i < hits.length; i++) {
                if (types.indexOf(hits[i]._type) < 0) {
                    types.push(hits[i]._type)
                }
            }


            var buckets = body.aggregations.associatedWords.buckets;

            var iterationNstopWords = 0;
            var words = [];
            for (var i = 0; i < buckets.length; i++) {

                var obj = {};
                var objElastic = buckets[i];
                obj.key = objElastic.key;
                obj.count = objElastic.doc_count;

                if (elasticProxy.acceptAssociatedWord(obj.key)) {
                    //   console.log(obj.key)
                    words.push(obj)
                }
                else {

                    options.stopWords.push(obj.key);
                    iterationNstopWords += 1;

                }
            }

            //  console.log(iterationNstopWords + "/" + words.length)
            if (options.iterations > 0 && ((iterationNstopWords * 4) > words.length)) {// condition for re-extract associated words with more stopwords

                options.iterations--;
                elasticProxy.getAssociatedWords(index, word, size, options, callback);
                //  elasticProxy.getAssociatedWords(index, word, size, slop, andWords, stopWords, classifierSource, iterations, callback);

            }


            function finalProcessing(err, buckets) {
                if (err) {
                    return callback(err);
                }
                for (var j = 0; j < buckets.length; j++) {
                    if (!buckets[j].count)
                        buckets[j].count = buckets[j].doc_count;


                }
                var classifier;
                if (index && options.classifierSource && options.classifierSource.length > 0)
                    classifier = classifierManager.getClassifierOutput(index, options.classifierSource, hits);
                var result = {
                    buckets: buckets,
                    types: types,
                    classifier: classifier,

                };
                return callback(null, result);

            }


            if (options.lemmeFilter) {
                var outputFormat = "object";
                if (options.wordNetEntitiesFilter)
                    outputFormat = "string";
                elasticProxy.extractLemmes(buckets, words, outputFormat, function (err, lemmes) {
                    if (options.wordNetEntitiesFilter) {
                        elasticProxy.extractWordNetNouns(buckets, lemmes, function (err, buckets) {
                            return finalProcessing(err, buckets);
                        })
                    } else {
                        var validBuckets = [];


                        for (var j = 0; j < lemmes.length; j++) {
                            //  console.log(lemmes[j])
                            validBuckets.push({key: lemmes[j].lemme, count: lemmes[j].word})


                        }
                        return finalProcessing(err, validBuckets);
                    }

                })
            } else if (options.wordNetEntitiesFilter) {
                elasticProxy.extractWordNetNouns(buckets, words, function (err, buckets) {
                    return finalProcessing(err, buckets);
                })
            } else
                return finalProcessing(null, buckets);

        });

    }

    ,
    acceptAssociatedWord: function (word) {
        if (word.length < 3)
            return false;
        if (word.match(/[0-9]+/))
            return false;
        if (word.match(/['|`]/))
            return false;
        return true;

    }
    ,
    extractLemmes: function (_buckets, words, outputFormat, callback) {
        var buckets = _buckets;
        var words = [];
        for (var i = 0; i < buckets.length; i++) {
            // for (var i = 0; i < 10; i++) {
            words.push(buckets[i].key)

        }

//console.log(JSON.stringify(words))
        elasticProxy.findTerms("lemmatization_fr", null, "content.word", words, function (err, data) {
            if (err)
                return callback(err);

            var lemmes = [];
            var uniqueLemmes = [];
            for (var i = 0; i < data.length; i++) {
                if (uniqueLemmes.indexOf(data[i].lemme) < 0) {
                    uniqueLemmes.push(data[i].lemme);
                    if (outputFormat == "object")
                        lemmes.push({lemme: data[i].lemme, word: data[i].word});
                    else
                        lemmes.push(data[i].lemme);
                }
            }
            //  console.log(JSON.stringify(allLemmes))
            return callback(null, lemmes)
        })
    }
    ,

    extractWordNetNouns: function (_buckets, words, callback) {
        var buckets = _buckets;
        var validBuckets = [];
        elasticProxy.findTerms("wordnet_score_fr", null, "content.synonyms", words, function (err, data) {
            if (err)
                return callback(err);

            var allwords = []
            for (var i = 0; i < buckets.length; i++) {
                var word = buckets[i].key
                var wordNetExists = false;
                for (var j = 0; j < data.length; j++) {
                    if (data[j].synonyms.indexOf(word) > -1) {
                        //
                        if (data[j].pos == "n" && allwords.indexOf(word) < 0) {
                            console.log(word + " pos   " + data[i].pos)
                            //  if( allwords.indexOf(word) < 0) {
                            allwords.push(word)
                            wordNetExists = true;
                            validBuckets.push({key: word, count: buckets[i].doc_count});
                        }
                    }


                }

            }
            return callback(null, validBuckets)
        })

    }
    ,
//******************************************************************JSON OBJECTs**********************************************************
//****************************************************************************************************************************
//****************************************************************************************************************************

    findTerms: function (index, type, field, terms, callback) {
        var termObj = {};
        termObj[field] = terms;
        var payload = {
            "size": serverParams.elasticMaxFetch,
            "query": {
                "terms": termObj,
            }
        }
        if (type != null)
            type = "/" + type;
        else type = "";
        var options = {

            method: 'POST',
            json: payload,
            url: baseUrl + index + type + "/_search"
        };

        request(options, function (error, response, body) {
            if (error)
                return callback(error);
            if (body.error)
                return callback(body.error.type);

            var hits = body.hits.hits;
            var data = [];
            for (var i = 0; i < hits.length; i++) {
                data.push(hits[i]._source.content)

            }
            return callback(null, data)


        });

    }
    ,
    /**
     * only two levels objects by now !!!!!!!!!!!!!!!!!!!


     */
    getMappingsFields: function (index, callback) {

        var options = {

            method: 'GET',
            json: {},
            url: baseUrl + index + "/_mappings"
        };

        request(options, function (error, response, body) {
                if (error)
                    return callback(error);
                if (body.error)
                    return callback(body.error.type);
                var fields = []
                var obj = body[index].mappings;
                for (var type in obj) {
                    var props = obj[type].properties.content.properties;
                    for (var field in props) {
                        if (props[field].properties) {
                            for (var prop in props[field].properties) {
                                fields.push(field + "." + prop);
                            }
                        }


                        else
                            fields.push(field);
                    }
                }

                return callback(null, fields)


            }
        );

    }
    ,


//******************************************************************INDEXING**********************************************************
//******************************************************************INDEXING**********************************************************
//******************************************************************INDEXING**********************************************************


    indexOneDoc:

        function (index, type, id, payload, callback) {
            if (!id)
                id = "_" + Math.round(Math.random() * 10000000);
            var elasticFields = elasticProxy.getShemaFields(index, type);
            var content = "";
            for (var j = 0; j < elasticFields.length; j++) {
                var key = elasticFields[j];
                var value = payload[key];
                if (!value)
                    continue;

                content += " " + value;
                payload[key] = value;

            }
            payload["content"] = content;

            getClient().index({
                index: index,
                type: type,
                id: id,
                body: payload
            }, function (err, response) {
                if (err) {
                    console.log(err);
                    callback(err);
                    return;

                } else {
                    callback(null, response);
                }
            });
        }

    ,
    indexDocumentDir: function (dir, index, type, recursive, callback) {

        var acceptedExtensions = ["doc", "docx", "xls", "xslx", "pdf", "odt", "ods", "ppt", "pptx", "html", "htm", "txt", "csv"];

        var indexedFiles = [];

        function getFilesRecursive(dir) {
            elasticProxy.sendMessage("indexing " + dir);
            dir = path.normalize(dir);
            if (dir.charAt(dir.length - 1) != path.sep)
                dir += path.sep;


            var files = fs.readdirSync(dir);
            for (var i = 0; i < files.length; i++) {
                var fileName = dir + files[i];
                var stats = fs.statSync(fileName);
                var infos = {lastModified: stats.mtimeMs, hash: fileInfos.getStringHash(fileName)};//fileInfos.getDirInfos(dir);

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
                    //  var infos = filesInfos[fileName]
                    indexedFiles.push({fileName: fileName, infos: infos});
                }
            }

        }

        getFilesRecursive(dir);

        //  indexedFiles.sort();
        var base64Extensions = ["doc", "docx", "xls", "xslx", "pdf", "ppt", "pptx", "ods", "odt"];
        var t0 = new Date().getTime();
        async.eachSeries(indexedFiles, function (file, callbackInner) {

                var fileName = file.fileName;

                var p = fileName.lastIndexOf(".");
                if (p < 0)
                    callback("no extension for file " + fileName);
                var extension = fileName.substring(p + 1).toLowerCase();
                var base64 = false;

                if (base64Extensions.indexOf(extension) > -1) {
                    base64 = true;


                }
                var t1 = new Date().getTime();
                elasticProxy.indexDocumentFile(fileName, index, type, base64, file.infos, function (err, result) {
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

    indexJsonArray: function (indexName, type, _array, callback) {
        var array = _array;
        elasticPayload = [];
        var startId = Math.round(Math.random() * 100000000);
        var partitions = [];
        var index = 0;

        var subArray = [];
        for (var i = 0; i < array.length; i++) {


            subArray.push(array[i]);
            if (subArray.length >= serverParams.elasticFethSize || i == array.length - 1) {
                partitions.push(subArray);
                subArray = [];
            }
        }


        var partitionIndex = 0
        async.eachSeries(partitions, function (array, callbackSeries) {
                for (var i = 0; i < array.length; i++) {
                    elasticPayload.push({index: {_index: indexName, _type: type, _id: "_" + (startId++)}})
                    // var payload = {"content": array[i]};
                    var payload = array[i]
                    elasticPayload.push(payload);
                }


                getClient().bulk({
                    body: elasticPayload
                }, function (err, resp) {
                    if (err) {
                        console.log("ERROR " + err)
                        console.log(JSON.stringify(elasticPayload, null, 2))
                        return callbackSeries(err)

                    } else {
                        if (errors) {
                            return callback(errors);
                        }
                        console.log("partition " + (partitionIndex++))
                        return callbackSeries();

                    }
                });
            },
            function (err) {
                if (err)
                    return callback(err);
                callback(null, "done");

            }
        )
    }


    ,
    indexMongoCollection: function (mongoDB, mongoCollection, mongoQuery, elasticIndex, elasticType, callback) {
        if (typeof mongoQuery !== "object")
            mongoQuery = JSON.parse(mongoQuery);

        var currentIndex = 0;
        var resultSize = 1;
        var elasticFields = elasticProxy.getShemaFields(elasticIndex, elasticType);
        var mongoFields = {};
        for (var i = 0; i < elasticFields.length; i++) {
            var field = elasticFields[i];
            if (field[i] == "mongoId")
                field = "_id";
            mongoFields[field] = 1;

        }
        async.whilst(
            function () {//test
                return resultSize > 0;
            },
            function (callbackWhilst) {//iterate

                if (mongoQuery && mongoQuery._id) {
                    mongoQuery = util.prepareJsonForMongo(mongoQuery)
                }

                mongoProxy.pagedFind(currentIndex, serverParams.mongoFetchSize, mongoDB, mongoCollection, mongoQuery, mongoFields, function (err, result) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    resultSize = result.length;
                    if (resultSize == 0) {
                        return callback(null, "end");
                    }

                    currentIndex += serverParams.mongoFetchSize;
                    var startId = Math.round(Math.random() * 10000000);
                    var elasticPayload = [];

                    // contcat all fields values in content field
                    for (var i = 0; i < result.length; i++) {


                        elasticPayload.push({index: {_index: elasticIndex, _type: elasticType, _id: "_" + (startId++)}})
                        var payload = {};
                        var content = "";
                        //    console.log("----"+JSON.stringify(elasticFields,null,2))
                        for (var j = 0; j < elasticFields.length; j++) {
                            var key = elasticFields[j];
                            var value = result[i][key];
                            if (key == "mongoId") {
                                value = result[i]["_id"].toString();
                            }

                            //  console.log("----"+key+":"+value)
                            if (!value)
                                continue;


                            content += " " + value;
                            payload[key] = value;


                        }
                        payload["content"] = content;
                        elasticPayload.push(payload);
                        //    resultSize = result.length;
                        //   return  callback(null,payload);
                    }


                    getClient().bulk({
                        body: elasticPayload
                    }, function (err, resp) {
                        if (err) {
                            console.log("ERROR " + err)
                            console.log(JSON.stringify(elasticPayload, null, 2))

                        } else {
                            return callbackWhilst(null);
                        }
                    });


                });

            }
            ,
            function (err, result) {//end
                if (err) {
                    callback(err);

                } else {
                    callback(null, "done");
                }

            });
    }
    ,

    indexSqlTable: function (connection, sql, elasticIndex, elasticType, callback) {
        var mySQLproxy = require('./mySQLproxy..js');
        if (typeof connection !== "object")
            connection = JSON.parse(connection);

        var currentIndex = 0;
        var resultSize = 1;
        var elasticFields = elasticProxy.getShemaFields(elasticIndex, elasticType);
        var mongoFields = {};
        for (var i = 0; i < elasticFields.length; i++) {
            var field = elasticFields[i];
        }
        var offset = 0;

        async.whilst(
            function () {//test
                return resultSize > 0;
            },
            function (callbackWhilst) {//iterate
                var sqlFetch = sql + " limit " + serverParams.mongoFetchSize + " offset " + offset;
                offset += serverParams.mongoFetchSize;
                mySQLproxy.find(connection, sqlFetch, function (err, result) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    resultSize = result.length;
                    if (resultSize == 0) {
                        return callback(null, "end");
                    }
                    currentIndex += serverParams.mongoFetchSize;
                    var startId = Math.round(Math.random() * 10000000);
                    var elasticPayload = [];

                    // contcat all fields values in content field
                    for (var i = 0; i < result.length; i++) {
                        elasticPayload.push({index: {_index: elasticIndex, _type: elasticType, _id: "_" + (startId++)}})
                        var payload = {};
                        var content = "";
                        for (var j = 0; j < elasticFields.length; j++) {
                            var key = elasticFields[j];
                            var value = result[i][key];
                            if (!value)
                                continue;
                            content += " " + value;
                            payload[key] = value;
                        }
                        payload["content"] = content;
                        elasticPayload.push(payload);

                    }
                    getClient().bulk({
                        body: elasticPayload
                    }, function (err, resp) {
                        if (err) {
                            console.log("ERROR " + err)
                            console.log(JSON.stringify(elasticPayload, null, 2))

                        } else {
                            return callbackWhilst(null);
                        }
                    });
                });
            }
            ,
            function (err, result) {//end
                if (err) {
                    callback(err);

                } else {
                    callback(null, "done");
                }

            });
    }
    ,

    deleteDoc: function (index, type, elasticId, callback) {

        var options = {
            method: 'DELETE',
            url: baseUrl + index + "/" + type + "/" + elasticId
        }
        request(options, function (error, response, body) {
            if (error) {
                return callback(error);
            }
            return callback(null, body);

        });


    }
    ,

    deleteIndex: function (index, force, callback) {
        var options = {
            method: 'HEAD',
            url: baseUrl + index + "/"
        }
        request(options, function (error, response, body) {
            if (error)
                return callback(error);
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
                            "general_document": {

                                "properties": {
                                    "date": {
                                        "type": "text"
                                    },
                                    "path": {
                                        "type": "text"
                                    },
                                    "title": {
                                        "type": "text"
                                    },
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

                if (true) {


                    options.json.settings = {

                        "analysis": {
                            "analyzer": {
                                "default": {
                                    "tokenizer": "standard",
                                    "filter": ["my_lowercase", "my_ascii_folding"]
                                }
                            },
                            "filter": {
                                "my_ascii_folding": {
                                    "type": "asciifolding",
                                    "preserve_original": true
                                },
                                "my_lowercase": {
                                    "type": "lowercase",

                                }
                            }
                        }
                    }


                    /*   "analysis": {
                           "analyzer": {
                               "default": {
                                   "type": "custom",
                                   "tokenizer": "standard",
                                   "filter": [ "lowercase", "asciifolding" ]
                               }
                           }

                       }
                   }*/
                    /* {
                    "analysis": {
                        "filter": {
                            "synonyms_fr_filter": {
                                "type": "synonym",
                                "synonyms_path": "synonyms/wordNetSyns.txt"
                            },
                            "stemmer_filter": {
                                "type": "stemmer",
                                "language": "french"
                            }

                        },
                        "analyzer": {
                            "my_synonyms": {
                                "tokenizer": "standard",
                                "filter": [
                                    "lowercase",
                                    "synonyms_fr_filter",
                                    "asciifolding"
                                ]
                            }
                        }
                    }


                }*/
                }
//console.log(JSON.stringify(options,null, 2));
                request(options, function (error, response, body) {
                    if (error)
                        return callback(error);

                    if (body.error)
                        return callback(body.error);
                    //******************************* initfielddata*******************************
                    //    http://localhost:9200/my_index2/_mapping/my_type
                    var options = {
                        method: 'PUT',
                        description: "init fielddata",
                        url: baseUrl + index + "/_mapping/general_document",
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

    }
    ,
    indexDocumentFile: function (_file, index, type, base64, infos, callback) {
        var id;
        if (infos && infos.hash)
            id = infos.hash;
        else
            id = "R" + Math.round(Math.random() * 1000000000)
        //  var file = "./search/testDocx.doc";
        //  var file = "./search/testPDF.pdf";
        var fileContent;
        var file = path.resolve(_file);
        var p = file.lastIndexOf(path.sep);
        var title = file;
        if (p > -1)
            title = file.substring(p + 1);

        var options;
        if (base64) {
            index = index + "temp"
            fileContent = util.base64_encodeFile(file);
            options = {
                method: 'PUT',
                url: baseUrl + index + "/" + type + "/" + id + "?pipeline=attachment",
                json: {
                    "data": fileContent,
                    "path": encodeURIComponent(file),
                    "title": title,
                    "lastModified": infos.lastModified
                }
            }
        }
        else {
            fileContent = "" + fs.readFileSync(file);
            // fileContent = elasticCustom.processContent(fileContent);
            options = {
                method: 'PUT',
                url: baseUrl + index + "/" + type + "/" + id,
                json: {
                    "content": fileContent,
                    "path": encodeURIComponent(file),
                    "title": title,
                    "lastModified": infos.lastModified
                }
            }
        }


        request(options, function (error, response, body) {
            if (error) {
                logger.error(file + " : " + error);
                console.error(file + " : " + error);
                // return callback(file+" : "+error);
            }
            if (body.error) {
                logger.error(file + " : " + body.error);
                console.error(file + " : " + body.error);
                if (body.error.reason) {
                    logger.error(file + " : " + body.error.reason);
                    console.error(file + " : " + body.error.reason);
                }
                //  return callback(file+" : "+body.error);
            }
            return callback(null, body);


        });

    }
    ,


    copyDocIndex: function (oldIndex, newIndex, type, callback) {

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
            url: baseUrl + oldIndex + "/" + type + "/_search"
        };

        //      console.log(JSON.stringify(payload, null, 2));
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
                var newObj = {};
                if (objElastic.attachment) {
                    newObj.lastModified = objElastic.lastModified;
                    newObj = objElastic.attachment;
                    newObj.path = objElastic.path;
                    newObj.id = hits[i]._id;

                    var p = newObj.path.lastIndexOf(encodeURIComponent(path.sep));
                    newObj.title = newObj.path;
                    if (p > -1)
                        newObj.title = newObj.path.substring(p + 1);

                    // we inject the title and date in the content
                    newObj.content = newObj.title + "\n" + newObj.date + "\n" + newObj.content;


                }
                else {
                    newObj = objElastic;


                }


                newObjs.push(newObj);
            }
            async.eachSeries(newObjs, function (newObj, callbackInner) {
                var id;
                if (newObj.id) {
                    id = newObj.id;
                }
                else
                    id = "R" + Math.round(Math.random() * 1000000000)
                options.url = baseUrl + newIndex + "/" + type + "/" + id;
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

    properNounsAssociatedWords: function () {
        var payload = {
            "query": {
                "match": {
                    "content": "louvre"
                }
            },
            "size": 0,
            "_source": "",
            "aggs": {
                "associatedWords": {
                    "terms": {
                        "order": {
                            "_count": "desc"
                        },
                        "field": "content.sensitive",
                        "size": "500",
                        "include": "[A-Z].{5,}"
                    }
                }
            }
        }
    }


    ,
    indexDocDirInNewIndex: function (index, type, rootDir, doClassifier, callback) {

        if (!fs.existsSync(rootDir)) {
            var message = ("directory " + rootDir + " does not not exist on server")
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
                elasticProxy.indexDocumentDir(rootDir, index, type, true, function (err, result) {
                    if (err) {
                        elasticProxy.sendMessage("ERROR" + err);
                        return callback(err);
                    }

                    elasticProxy.sendMessage("indexation in tempIndex successfull " + result);


                    elasticProxy.copyDocIndex(indexTemp, index, type, function (err, result) {
                        if (err) {
                            elasticProxy.sendMessage("ERROR" + err);
                            return callback(err);
                        }
                        elasticProxy.sendMessage("index " + indexTemp + " copied to " + index);

                        elasticProxy.deleteIndex(indexTemp, true, function (err, result) {
                            elasticProxy.sendMessage("delete temporary index " + indexTemp);
                            var message = "-----------Index " + index + " is ready to use-----------"
                            if (doClassifier.toLowerCase() == "y") {

                                classifierManager.createIndexClassifierFromElasticFrequentWordsAndOntology(index, 200, null, null, 10, ["BNF"], "fr", 1, function (err, result) {
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
    ,
    indexDirInExistingIndex: function (index, type, rootDir, doClassifier, callback) {
        if (!fs.existsSync(rootDir)) {
            var message = ("directory " + rootDir + " does not not exist on server")
            elasticProxy.sendMessage("ERROR" + message);
            return callback(message);
        }
        var indexTemp = index + "temp";
        var options = {
            method: 'HEAD',
            url: baseUrl + index + "/"
        }
        request(options, function (error, response, body) {
            if (error) {
                console.log(error)
                return callback(error);
            }
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
                elasticProxy.indexDocumentDir(rootDir, index, type, true, function (err, result) {
                    if (err) {
                        elasticProxy.sendMessage("ERROR" + err);
                        return callback(err);
                    }

                    elasticProxy.sendMessage("indexation in tempIndex successfull " + result);


                    elasticProxy.copyDocIndex(indexTemp, index, type, function (err, result) {
                        if (err) {
                            elasticProxy.sendMessage("ERROR" + err);
                            return callback(err);
                        }

                        elasticProxy.sendMessage("index " + indexTemp + " copied to " + index);
                        elasticProxy.deleteIndex(indexTemp, true, function (err, result) {
                            var message = "-----------Index " + index + " is ready to use-----------"
                            elasticProxy.sendMessage("delete temporary index " + indexTemp);
                            if (doClassifier.toLowerCase() == "y") {
                                classifierManager.createIndexClassifierFromElasticFrequentWordsAndOntology(index, 200, null, null, 10, ["BNF"], "fr", 1, function (err, result) {

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
    ,
    getShemaFields: function (index, type) {

        var indexes = []
        var p = index.indexOf(",");
        if (p > -1) {//multi index
            indexes = index.split(",")
        }
        else
            indexes = [index];

        var allFields = [];
        for (var i = 0; i < indexes.length; i++) {
            var fields = [];
            var schema = elasticProxy.getSchema(index);
            if (!schema || !schema.mappings)
                fields = ["path", "title", "date"];
            else
                fields = elasticSchema._indexes[index].fields;

            for (var j = 0; j < fields.length; j++) {
                if (allFields.indexOf(fields[j]) < 0)
                    allFields.push(fields[j])
            }
        }
        return allFields;
    },

    getUserIndexes: function (user, callback) {
        if (!users) {
            var str = fs.readFileSync(path.resolve(__dirname, "../config/users/elasticUsers.json"));

            try {
                users = JSON.parse("" + str);
            }
            catch (e) {
                console.log(e)
                return callback(e);
            }

        }
        if (!elasticSchema)
            elasticProxy.getSchema();
        var userObj = users[user];
        if (!userObj)
            return callback("no registred user :" + user);
        var indexes = [];
        for (var i = 0; i < userObj.groups.length; i++) {
            if (userObj.groups[i] != "ALL")
                indexes = indexes.concat(elasticSchema._indexCollections[userObj.groups[i]]);
        }
        return callback(null, indexes);

    }
    ,

    getOriginalDocument: function (docRemotePath, callback) {
        docRemotePath = decodeURIComponent(docRemotePath);
        var extension = path.extname(docRemotePath);
        var doc = null;

        fs.readFile(docRemotePath, function (err, data) {
            if (err)
                return callback(err);
            var result = {
                data: "" + data,
                contentType: mime.getType(extension)
            }
            callback(err, result);


        })
    }
    ,
}


function getClient() {

    if (client)
        return client;
    return new elasticsearch.Client({
        host: serverParams.elasticUrl,

        log: ['error', 'warning']
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
                type: {
                    message: "mappings type",
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
                elasticProxy.indexDocDirInNewIndex(index, type, rootDir, doClassifier, function (err, result) {
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
                type: {
                    message: "mappings type",
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
                elasticProxy.indexDirInExistingIndex(index, type, rootDir, doClassifier, function (err, result) {
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


