var MongoClient = require('mongodb').MongoClient
var async = require('async');
var serverParams = require("./serverParams.js");

var connexions = {};
var urlBase = serverParams.mongoUrl;

function getDb(dbName, callback) {
    if (connexions[dbName]) {
        callback(null, connexions[dbName]);
        return;
    }

    var url = urlBase + dbName;
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
        var callback = _callback;
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

    },



    find: function (dbName, collectionName, query,  _callback) {
        var callback = _callback;
        if (typeof query == "string") {
            try {
                query = JSON.parse(query);
            }
            catch (e) {
                callback(e);
            }
        }

        getDb(dbName, function (err, db, callbackDB) {

            if (err) {
                if(!callbackDB)
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

    ,
    insert: function (dbName, collectionName, data, _callback) {
        var callback = _callback;

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
                else
                    callback(err, result);

            }
            // Execute the forEach method, triggers for each entry in the array
            data.forEach(function (obj) {

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
    ,
    updateOrCreate: function (dbName, collectionName, query, data, _callback) {
        var callback = _callback;
        var url = urlBase + dbName;
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
                var dataObj = JSON.parse(data[i]);
                if (!query || query.length == 0) {
                    insert(dbName, collectionName, dataObj, callback);

                } else {
                    var aquery = JSON.parse(query[i]);
                    collection.update(aquery, dataObj, {upsert: true}, function (err, result) {
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


    ,
    delete: function (dbName, collectionName, query,  _callback) {
        var callback = _callback;
        var url = urlBase + dbName;
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

    }

    ,


    listDatabases: function ( _callback) {
        var callback = _callback;
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
    ,
    listCollections: function (dbName,  _callback) {
        var callback = _callback;
        var url = urlBase + dbName;
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

    }
    ,

    listFields: function (dbName, collectionName, _callback) {
        var callback = _callback;
        var url = urlBase + dbName;
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
                    if (!results)
                        return callback("no result")
                    for (var i = 0; i < results.length; i++) {
                        fieldNames.push(results[i].value)
                    }
                    callback(null, fieldNames);

                }
            );
        })

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