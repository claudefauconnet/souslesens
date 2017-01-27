var MongoClient = require('mongodb').MongoClient
var async = require('async');
var serverParams=require("./serverParams.js");

var connexions = {};
var urlBase=serverParams.mongoUrl;

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


    pagedFind: function (pageSize, dbName, collectionName, query, _callback) {
        var callback0 = _callback;

        function recurse(db, query, startIndex, pageSize) {
            var collection = db.collection(collectionName);
            collection.find(query, {
                "limit": pageSize ,
                "skip": startIndex
            }).toArray(function (err, data) {
                if (err) {
                    callback0(err, null);
                }
                else {
                    if (data.length <1)
                        return;
                    else {
                        async.series([
                                function (callback) {
                                   // console.log("startIndex"+startIndex);
                                    callback0(null, data);
                                    callback(null, 'one');
                                },
                                function (callback) {
                                    startIndex += pageSize;
                                    recurse(db, query, startIndex, pageSize);
                                    callback(null, 'two');
                                }
                            ],
                            function (err, results) {
                              //  console.log("allDone")// results is now equal to ['one', 'two']
                            });
                    }
                }


            });
        }

        getDb(dbName, function (err, db) {
            if (err) {
                callback(err, null);
            }
            recurse(db, query, 0, pageSize);

        });

    },
    find: function (dbName, collectionName, query, response, callback) {

        getDb(dbName, function (err, db) {
            if (err) {
                callback(err, null);
            }
            //   const bulk = db.collection(collectionName).initializeUnorderedBulkOp();
            var collection = db.collection(collectionName);
            collection.find(query).toArray(function (err, data) {
                if (err) {
                    if (response) {
                        response.setHeader('Content-Type', 'application/json');
                        response.send(JSON.stringify({ERROR: err}));
                        return response.end();
                        // db.close();
                    } else if (callback) {
                        callback(err, null);
                    }
                }
                else if (response && !response.finished) {
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(data));
                    return response.end();
                    // db.close();
                } else if (callback) {
                    callback(err, data);
                    // db.close();
                }
            });
        });

    }

    ,
    insert: function (dbName, collectionName, data, response, callback) {
        var url = urlBase + dbName;

        getDb(dbName, function (err, db) {

            // Get the collection and bulk api artefacts
            var collection = db.collection(collectionName),
                bulk = collection.initializeOrderedBulkOp(), // Initialize the Ordered Batch
                counter = 0;

            var bulkCallBack = function (err, result) {
                if (err) {
                    if (response) {
                        response.setHeader('Content-Type', 'application/json');
                        response.send(JSON.stringify({ERROR: err}));
                        return response.end();
                        // db.close();
                    } else if (callback) {
                        callback(err, null);
                    }
                }

                if (response) {
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(result));
                    return response.end();
                    //// db.close();
                } else if (callback) {
                    callback(err, result);
                    //// db.close();
                }
            }
            // Execute the forEach method, triggers for each entry in the array
            data.forEach(function (obj) {

                bulk.insert(obj);
                counter++;

                if (counter % 1000 == 0) {
                    // Execute the operation
                    bulk.execute(function (err, result) {
                        // re-initialise batch operation
                        bulk = collection.initializeOrderedBulkOp();
                        bulkCallBack();
                    });
                }
            });

            if (counter % 1000 != 0) {
                bulk.execute(function (err, result) {
                    // do something with result
                    bulkCallBack();
                });
            }


            // setTimeout(function (){var isWaiting=true},3000);
            /*   MongoClient.connect(url, function (err, db) {
             if (err) {
             callback(err, null);
             }
             var collection = db.collection(collectionName);

             collection.insertMany(data, function (err, result) {

             });*/
        });

    }
    ,
    updateOrCreate: function (dbName, collectionName, query, data, response, callback) {// query et data doivent etre synchironisés
        var url = urlBase + dbName;
        getDb(dbName, function (err, db) {
            if (err) {

                if (response) {
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify({ERROR: err}));
                    return response.end();
                    // db.close();

                } else if (callback) {
                    callback(err, null);
                }

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
                    insert(dbName, collectionName, dataObj, response);

                } else {
                    var aquery = JSON.parse(query[i]);
                    collection.update(aquery, dataObj, {upsert: true}, function (err, result) {
                        if (err) {
                            if (response) {
                                response.setHeader('Content-Type', 'application/json');
                                response.send(JSON.stringify({ERROR: err}));
                                return response.end();
                                // db.close();

                            } else if (callback) {
                                callback(err, null);
                            }

                        }
                        if (response) {
                            results.push(results);
                            if (results.length == query.length - 1) {

                                response.setHeader('Content-Type', 'application/json');
                                response.send(JSON.stringify(results));
                                return response.end();
                                // db.close();
                            } else if (callback) {
                                callback(err, results);
                                // db.close();
                            }
                        }
                    });
                }
            }
        });
    }


    ,
    delete: function (dbName, collectionName, query, response, callback) {
        var url = urlBase + dbName;
        getDb(dbName, function (err, db) {
            if (err) {
                callback(err, null);
            }
            var collection = db.collection(collectionName);
            collection.deleteMany(query, function (err, result) {
                if (err) {
                    if (response) {
                        response.setHeader('Content-Type', 'application/json');
                        response.send(JSON.stringify({ERROR: err}));
                        return response.end();
                        // db.close();
                    } else if (callback) {
                        callback(err, null);
                    }
                }
                if (response) {
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(result));
                    return response.end();
                    // db.close();
                } else if (callback) {
                    callback(err, result);
                    // db.close();
                }
            });
        });

    }

    ,

    listDatabases: function (response) {
        getDb("admin", function (err, db) {
            if (err) {
                response.send(err);
            }
            db.admin().listDatabases(function (err, dbs) {
                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify(dbs));
                return response.end();
                // db.close();
            });


        });

    }
    ,
    listCollections: function (dbName, response) {
        var url = urlBase + dbName;
        getDb(dbName, function (err, db) {
            if (err) {
                response.send(err);
            }
            db.collections(function (err, colls) {
                var colNames = []
                for (var i = 0; i < colls.length; i++) {
                    colNames.push(colls[i].s.name)
                }
                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify(colNames));
                return response.end();
                // db.close();

            });


        });

    }
    ,

    listFields: function (dbName, collectionName, response) {

        var url = urlBase + dbName;
        getDb(dbName, function (err, db) {
            if (err) {
                response.send(err);
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

                    for (var i = 0; i < results.length; i++) {
                        fieldNames.push(results[i].value)
                    }
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(fieldNames));
                    return response.end();
                    // db.close();
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
