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

var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var async = require('async');
var serverParams = require("./serverParams.js");
var Util = require('./util.js');

var connexions = {};
var urlBase = serverParams.mongoUrl;

function getDb(dbName, callback) {
    if (connexions[dbName]) {
        callback(null, connexions[dbName]);
        return;
    }

    var url = urlBase + dbName;
  //  console.log("!!!!!!getDb "+url);
  //  console.trace();
    MongoClient.connect(url, function (err, db) {
        if (err) {
            callback(err);
        } else {
            connexions[dbName] = db;
            callback(null, db);
        }
    })

}
var MongoProxy = {
    pagedFind: function (startIndex, pageSize, dbName, collectionName, query, fields, _callback) {
        Util.prepareJsonForMongo(query);
        var callback = _callback;
        try {
            getDb(dbName, function (err, db, callbackDB) {
                if (err) {
                    callbackDB(err, null);
                }
                //   const bulk = db.collection(collectionName).initializeUnorderedBulkOp();
                var collection = db.collection(collectionName);
                collection.find(query, fields, {
                    "limit": pageSize,
                    "skip": startIndex
                }).toArray(function (err, data) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    else
                        callback(err, data);
                });
            });
        } catch (err) {
            callback(err);

        }

    },


    find: function (dbName, collectionName, query, _callback) {
        var callback = _callback;
        if (typeof query == "string") {
            try {
                query = JSON.parse(query);
            }
            catch (e) {
                callback(e);
            }
        }
        Util.prepareJsonForMongo(query);


        try {
            getDb(dbName, function (err, db, callbackDB) {

                if (err) {
                    if (!callbackDB)
                        return;
                    callbackDB(err, null);
                }
                //   const bulk = db.collection(collectionName).initializeUnorderedBulkOp();
                var collection = db.collection(collectionName);
                collection.find(query).toArray(function (err, data) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    else
                        callback(err, data);
                });
            });
        }
        catch (err) {
            callback(err);

        }

    }
    , distinct: function (dbName, collectionName, distinctField, query, _callback) {
        var callback = _callback;
        if (typeof query == "string") {
            try {
                query = JSON.parse(query);
            }
            catch (e) {
                callback(e);
            }
        }
        try {
            getDb(dbName, function (err, db, callbackDB) {
                if (err) {
                    callbackDB(err, null);
                }
                //   const bulk = db.collection(collectionName).initializeUnorderedBulkOp();
                var collection = db.collection(collectionName);
                collection.distinct(distinctField, query, function (err, data) {

                    if (err) {
                        callback(err, null);
                        return;
                    }
                    else
                        callback(err, data);
                });
            });
        }
        catch (err) {
            callback(err);

        }

    }

    ,
    insertOne: function (dbName, collectionName, data, _callback) {
        Util.prepareJsonForMongo(data);
        var callback = _callback;
        try {
            getDb(dbName, function (err, db, callbackDB) {
                if (err) {
                    callbackDB(err, null);
                }
                var collection = db.collection(collectionName);
                Util.prepareJsonForMongo(data);

                collection.insertOne(data, function (err, response) {
                    if (err) {
                        console.log('Error occurred while inserting');
                        callback(err);
                    } else {
                        var result = response.ops[0];


                        callback(null, [result]);
                        // return
                    }
                });
            });
        }
        catch (err) {
            callback(err);

        }
    }

    ,
    insert: function (dbName, collectionName, data, _callback) {
        var callback = _callback;
        try {
            getDb(dbName, function (err, db, callbackDB) {
                if (err) {
                    callbackDB(err, null);
                }

                // Get the collection and bulk api artefacts
                var collection = db.collection(collectionName),
                    bulk = collection.initializeOrderedBulkOp(), // Initialize the Ordered Batch
                    counter = 0;

                var bulkCallBack = function (err, result) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    else if (result && result.getInsertedIds())
                        callback(err, result.getInsertedIds());
                    else
                        callback(err, result)

                }
                // Execute the forEach method, triggers for each entry in the array
                data.forEach(function (obj) {
                    Util.prepareJsonForMongo(obj);


                    bulk.insert(obj);
                    counter++;

                    if (counter % serverParams.mongoFetchSize == 0) {
                        // Execute the operation
                        bulk.execute(function (err, result) {
                            // re-initialise batch operation
                            bulk = collection.initializeOrderedBulkOp();
                            bulkCallBack();
                        });
                    }
                });

                if (counter % serverParams.mongoFetchSize != 0) {
                    bulk.execute(function (err, result) {
                        bulkCallBack(err, result, callback);
                    });
                }
            });
        }
        catch (err) {
            callback(err);

        }

    }
    ,
    updateOrCreate: function (dbName, collectionName, query, data, _callback) {
        var callback = _callback;


        var url = urlBase + dbName;
        try {
            getDb(dbName, function (err, db, callbackDB) {
                if (err) {
                    callbackDB(err, null);
                    return;

                }
                var collection = db.collection(collectionName);
                if (!Array.isArray(data))
                    data = [data];
                if (query && !Array.isArray(query))
                    query = [query];
                var results = [];
                for (var i = 0; i < data.length; i++) {
                    var dataObj = data[i];// JSON.parse(data[i]);
                    Util.prepareJsonForMongo(dataObj);
                    if (!query || query.length == 0) {
                        collection.insertOne(dataObj,callback);

                    } else {
                        var aquery = query[i];//JSON.parse(query[i]);
                        Util.prepareJsonForMongo(aquery);

                        var update = {$set: dataObj};
                        collection.update(aquery, update, {upsert: true, multi: true}, function (err, result) {
                            if (err) {
                                callback(err, null);
                                return;
                            }
                            callback(err, results);
                        });
                    }
                }
            });
        }
        catch (err) {
            callback(err);

        }
    }


    ,
    delete: function (dbName, collectionName, query, _callback) {
        Util.prepareJsonForMongo(query);
        var callback = _callback;
        var url = urlBase + dbName;
        try {
            getDb(dbName, function (err, db, callbackDB) {
                if (err) {
                    callbackDB(err, null);
                }
                var collection = db.collection(collectionName);
                collection.deleteMany(query, function (err, result) {
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    else
                        callback(err, result);

                });
            });
        } catch (err) {
            callback(err);

        }

    }

    ,


    listDatabases: function (_callback) {
        var callback = _callback;
        try {
            getDb("admin", function (err, db) {
                if (err) {
                    callback(err, null);
                    return;
                }
                else

                    db.admin().listDatabases(function (err, dbs) {
                        callback(err, dbs);
                    });


            });
        }
        catch (err) {
            callback(err);

        }

    }
    ,
    listCollections: function (dbName, _callback) {
        var callback = _callback;
        var url = urlBase + dbName;
        try {
            getDb(dbName, function (err, db, callbackDB) {
                if (err) {
                    callbackDB(err);
                    return;
                }
                db.collections(function (err, colls) {
                    var colNames = []
                    for (var i = 0; i < colls.length; i++) {
                        colNames.push(colls[i].s.name)
                    }
                    callback(null, colNames)
                });


            });
        } catch (err) {
            callback(err);

        }

    }
    ,

    listFields: function (dbName, collectionName, _callback) {
        var callback = _callback;
        var url = urlBase + dbName;
        try {
            getDb(dbName, function (err, db, callbackDB) {
                if (err) {
                    callbackDB(err);
                    return;
                }
                var collection = db.collection(collectionName);
                var map = function () {
                    for (var key in this) {
                        emit(key, null);
                    }
                    ;
                }

                var reduce = function (key, values) {
                    return key;
                };
                collection.mapReduce(map, reduce, {
                        query: {},
                        out: {inline: 1}
                    },
                    function (err, results) {
                        var fieldNames = [];
                        fieldNames.dbName = dbName;
                        fieldNames.collectionName = collectionName;
                        if (!results)
                            return callback("no result")
                        for (var i = 0; i < results.length; i++) {
                            fieldNames.push(results[i].value)
                        }
                        callback(null, fieldNames);

                    }
                );
            });
        }
        catch (err) {
            callback(err);

        }

    }
    ,
    test: function () {
        MongoProxy.insert("chaudron", "jfm", [{a: 1}, {b: 2}], function (err, docs) {
            if (err)
                return err;
            console.log(docs);
            return {data: docs}
        });

        MongoProxy.find("chaudron", "jfm", {}, function (err, docs) {
            if (err)
                return err;
            console.log(docs);
            return {data: docs}
        });
    }


}


module.exports = MongoProxy;