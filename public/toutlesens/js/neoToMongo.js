/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
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
var neoToMongo = (function () {

    var self = {};
    self.subGraph;
    self.dbName;
    var mongoDBPreffix = "";

    self.callMongo = function (neoParams, operation, callback) {
        self.subGraph = treeController.subGraph;
        self.dbName = self.formatNamesForMongo(treeController.subGraph);
        var mongoPayload = null;

        if (operation == "retrieve") {
            if (neoParams.nodeLabel) {// find in object collection

                mongoPayload = {
                    find: 1,
                    dbName: self.dbName,
                    collectionName: self.formatNamesForMongo(neoParams.nodeLabel),
                    mongoQuery: self.formatIdInQuery(neoParams.query)
                }
                self.callMongoRemote(mongoPayload, callback);
            }
            if (neoParams.parentLabel) {// find in relation collections
                var result = [];
                var relations = Schema.getPermittedRelations(neoParams.parentLabel);
                var relInc = 0;
                var itemInc = 0;
                for (var i = 0; i < relations.length; i++) {
                    var item = relations[i];
                    // relations.forEach(function (item, i) {  // for each permitted relation find in relation collection

                    var params = {
                        // relation: relations[i],
                        relation: item,
                        sourceNodeQuery: {id: neoParams.parentId}
                    }
                    mongoPayload = self.getRelationPayload(params, "find");

                    self.callMongoRemote(mongoPayload, function (err, data) {
                        relInc++;
                        itemInc = 0;
                        //   data.forEach(function (item2, j) { //for each found relation retrieve the item
                        for (var j = 0; j < data.length; j++) {
                            itemInc++;
                            var item2 = data[j]
                            var sep = item2.label.lastIndexOf("_");
                            var collectionName2 = item2.label.substring(sep + 1);
                            var endId = item2[collectionName2 + "id"];


                            var mongoPayload2 = {
                                find: 1,
                                dbName: self.dbName,
                                collectionName: collectionName2,
                                mongoQuery: {id: endId}
                            }
                            console.log(JSON.stringify(mongoPayload2))
                            self.callMongoRemote(mongoPayload2, function (err, data2) {
                                $.merge(result, data2);
                                if (relInc == relations.length - 1) {// && itemInc == data.length) {//pb async !! ??
                                    callback(null, result);
                                    return;
                                }

                            });
                        }
                        ;
                    });

                }


            }


        }

        if (operation == "createNode") {
            mongoPayload = {
                insertOne: 1,
                dbName: self.dbName,
                collectionName: self.formatNamesForMongo(neoParams.nodeLabel),
                data: neoParams.nodeAttrs
            }
            self.callMongoRemote(mongoPayload, callback);


        }


        if (operation == "deleteNode") {
            mongoPayload = {
                delete: 1,
                dbName: self.dbName,
                collectionName: self.formatNamesForMongo(neoParams.nodeLabel),
                mongoQuery: self.formatIdInQuery(neoParams.nodeAttrs)
            }
            self.callMongoRemote(mongoPayload, callback);

        }
        if (operation == "updateNode") {
            mongoPayload = {
                updateOrCreate: 1,
                dbName: self.dbName,
                collectionName: self.formatNamesForMongo(neoParams.label),
                query: formatIdInQuery(neoParams.nodeAttrs),
                data: neoParams.nodeSet
            }
            self.callMongoRemote(mongoPayload, callback);

        }
        if (operation == "createRelation") {
            mongoPayload = self.getRelationPayload(neoParams, "insertOne");
            self.callMongoRemote(mongoPayload, function (err, result) {// callback the end node (like neo)
                mongoPayload = {
                    find: 1,
                    dbName: self.dbName,
                    query: self.formatIdInQuery({id: result[0][neoParams.relation.endLabel + "id"]}),
                    collectionName: self.formatNamesForMongo(neoParams.relation.endLabel),

                }
                self.callMongoRemote(mongoPayload, callback);
            });
        }
        if (operation == "createNodeAndRelation") {


            mongoPayload = {
                insertOne: 1,
                dbName: self.dbName,
                collectionName: self.formatNamesForMongo(neoParams.nodeLabel),
                data: neoParams.nodeAttrs
            }
            self.callMongoRemote(mongoPayload, function (err, result) {
                neoParams.targetNodeQuery = {id: result[0].id}
                mongoPayload = self.getRelationPayload(neoParams, "insertOne");
                self.callMongo(neoParams, "createRelation", callback)

            })

        }

        if (operation == "deleteRelation") {
            mongoPayload = {
                delete: 1,
                dbName: self.dbName,
                collectionName: self.formatNamesForMongo(neoParams.nodeLabel),
                data: [neoParams.nodeAttrs]
            }
            self.callMongoRemote(mongoPayload, callback);

        }


    }
    self.listCollections = function (dbName, callback) {
        var mongoPayload = {
            listCollections: 1,
            dbName: dbName
        }
        self.callMongoRemote(mongoPayload, callback);
    }

    self.callMongoRemote = function (mongoPayload, callback) {

        if (mongoPayload) {
            $.ajax('../mongo/', {
                data: mongoPayload,
                dataType: "json",
                type: 'POST',
                error: function (error, ajaxOptions, thrownError) {
                    console.log(error);
                    $("#message").html("ERROR " + error.responseText);
                    callback(error);
                }
                ,
                success: function (data) {
                    if (mongoPayload.collectionName) {
                        for (var i = 0; i < data.length; i++) {
                            if ($.isPlainObject(data[i]))
                                data[i].label = mongoPayload.collectionName;
                        }
                        data.collectionName = mongoPayload.collectionName;
                    }
                    callback(null, data);
                }
            })
        }
    }

    self.formatNamesForMongo = function (name) {
        name = name.replace(/[ -.]/g, "_");
        return name;
    }
    self.formatIdInQuery = function (queryObj) {
        for (var key in queryObj) {// ids Mongo
            if (key.indexOf("id") > -1 && isNaN(queryObj[key]))
                queryObj[key] = "ObjectId(" + queryObj[key] + ")";
        }
        return queryObj;

    }
    self.getRelationPayload = function (neoParams, operation) {
        var relation = neoParams.relation;
        if (!relation)
            return {};

        var collectionName = "r_" + relation.startLabel + "_" + relation.endLabel;
        var startFieldId = relation.startLabel + "id";
        var endFieldId = relation.endLabel + "id";

        var data = {};
        if (neoParams.sourceNodeQuery)
            data[startFieldId] = neoParams.sourceNodeQuery.id;
        if (neoParams.targetNodeQuery)
            data[endFieldId] = neoParams.targetNodeQuery.id;


        var payload = {
            dbName: self.dbName,
            collectionName: collectionName,

        }
        if (operation == "insertOne")
            payload.data = data;
        if (operation == "find")
            payload.query = data;
        payload[operation] = 1;
        return payload;


    }
    self.syncObjNeoToMongo = function (operation, obj, setObj, callback) {


        var subGraph = treeController.subGraph;
        var dbName = mongoDBPreffix + treeController.subGraph;
        var label = obj.label;

        var mongoCollectionMappings = Schema.schema.mongoCollectionMapping;
        var collection = label;
        if (mongoCollectionMappings[label])
            collection = mongoCollectionMappings[label];
        var id = obj.id;
        if (!id)
            id = obj.neoId;


        var mongoPayload;
        if (operation == "update") {
            mongoPayload = {
                updateOrCreate: 1,
                collectionName: collection,
                query: {id: id},
                dbName: dbName,
                data: [setObj]
            }
        }
        if (operation == "create") {
            obj.id = obj.neoId;
            mongoPayload = {
                insertOne: 1,
                collectionName: collection,
                dbName: dbName,
                data: obj
            }
        }
        if (operation == "delete") {
            mongoPayload = {
                delete: 1,
                collectionName: collection,
                dbName: dbName,
                query: {id: id},
            }
        }

        $.ajax('../mongo/', {
            data: mongoPayload,
            dataType: "json",
            type: 'POST',
            error: function (error, ajaxOptions, thrownError) {
                console.log(error);
                $("#message").html("ERROR " + error.responseText);
                callback(error);
            }
            ,
            success: function (data) {
                var xxx = data;

            }
        });


    }
    self.syncRelNeoToMongo = function (operation, payload, data, callback) {
        var subGraph = treeController.subGraph;
        var dbName = mongoDBPreffix + treeController.subGraph;

        var relations = Schema.getRelations(payload.relation.startLabel, payload.relation.endLabel);
        if (relations.length == 0)
            return;
        var relation = relations[0];
        if (!relation || !relation.mongoMapping)
            return;
        var fieldMappings = relation.mongoMapping
        var mongoPayload;


        var mongoData = []

        for (var i = 0; i < data.length; i++) {
            var item = data[i];
            var neoObj_n = item.n.properties;
            //  neoObj_n.id = item.n.id;
            var neoObj_m = item.m.properties;
            //   neoObj_m.id = item.m.id;
            var nId = neoObj_n.id;
            if (!nId)
                neoObj_n.id = item.n.id
            var mId = neoObj_m.id;
            if (!mId)
                neoObj_m.id = item.m.id
            var mongoObj = {}
            if (fieldMappings.start) {
                for (var neoField  in fieldMappings.start) {
                    mongoObj[fieldMappings.start[neoField]] = neoObj_n[neoField];
                }
            }
            if (fieldMappings.end) {
                for (var neoField in fieldMappings.end) {
                    mongoObj[fieldMappings.end[neoField]] = neoObj_m[neoField];
                }
            }
            mongoData.push(mongoObj)

        }
            //  if (fieldMappings.startFilter || fieldMappings.endFilter) {// update field in existing collection

            var query = {}
            for (var key  in fieldMappings.startFilter) {
                query[key] = neoObj_n[fieldMappings.startFilter[key]];
            }
            for (var key  in fieldMappings.endFilter) {
                query[key] = neoObj_m[fieldMappings.endFilter[key]];
            }
            var mongoPayload = {
                data: mongoObj,
                query: query,
                insertOne: 1,
                dbName: dbName,
                collectionName: fieldMappings.collection
            }
            // }
            $.ajax('../mongo/', {
                data: mongoPayload,
                dataType: "json",
                type: 'POST',
                error: function (error, ajaxOptions, thrownError) {
                    console.log(error);
                    $("#message").html("ERROR " + error.responseText);
                    if (callback)
                        callback(error);
                }
                ,
                success: function (data) {
                    if (callback)
                        callback(null, data);
                }
            })


        ;
        if (!fieldMappings.startFilter) {//insert row in relation collection


            var mongoPayload = {
                data: mongoData,
                insert: 1,
                dbName: dbName,
                collectionName: fieldMappings.collection
            }

            $.ajax('../mongo/', {
                data: mongoPayload,
                dataType: "json",
                type: 'POST',
                error: function (error, ajaxOptions, thrownError) {
                    console.log(error);
                    $("#message").html("ERROR " + error.responseText);
                    if (callback)
                        callback(error);
                }
                ,
                success: function (data) {
                    if (callback)
                        callback(null, data);
                }
            })

        }


        if (operation == "create") {

            /*
             collection: "r_T_DC",
             start: {"id": "DCid", "name": "DC_name"},
             end: {"id": "technoid", "name": "techno_name"},
             */
            var data = {};
            /*    for(var key in mongoMapping.start){
             data[ mongoMapping.start[key]]
             }
             data[mongoMapping.start]=à;
             mongoPayload = {
             insertOne: 1,
             dbName: dbName,
             collectionName: mongoMapping.collection,
             data:{



             }

             }*/

        }
        if (operation == "delete") {

        }
    }


    self.syncNeoToMongoALL = function () {

        var subGraph = treeController.subGraph;
        var dbName = mongoDBPreffix + treeController.subGraph;

        if (true) {
            var properties = Schema.schema.properties;
            var mongoCollectionMappings = Schema.schema.mongoCollectionMapping
            var nProps = Object.keys(properties).length;
            var countProps = 0;
            for (var label in properties) {
                var collection = label;
                if (mongoCollectionMappings[label])
                    collection = mongoCollectionMappings[label];

                var payload = {delete: 1, dbName: dbName, query: {}, collectionName: collection}
                self.callMongoRemote(payload, function (err, result) {


                    var collection = result.collectionName;
                    var label = collection;
                    for (var key in mongoCollectionMappings) {
                        if (mongoCollectionMappings[key] == collection)
                            label = key;
                    }


                    if (mongoCollectionMappings[label])
                        collection = mongoCollectionMappings[label];


                    self.duplicateObjectsFromNeoToMongo(subGraph, label, dbName, collection, function (err, result) {
                        if (err) {
                            console.log(err)
                            return;
                        }
                        countProps += 1;

                        if (countProps == nProps) {//relations
                            var relations = Schema.schema.relations;
                            for (var key in relations) {

                                var relation = relations[key];
                                if (relation.mongoMapping) {

                                    self.duplicateRelationsFromNeoToMongo(subGraph, relation.startLabel, relation.endLabel, dbName, relation.mongoMapping, function (err, result) {
                                        if (err) {
                                            console.log(err)
                                            return;
                                        }

                                    });

                                }
                            }
                        }

                    });

                });
            }

        }


    }


    self.duplicateObjectsFromNeoToMongo = function (subGraph, label, dbName, collection, callback) {
        var matchStr = "";

        matchStr = "Match (n:" + label + ") where n.subGraph='" + subGraph + "' return n ";


        var neoPayload = {match: matchStr}
        $.ajax('/rest/?retrieve=1', {
            data: neoPayload,
            dataType: "json",
            type: 'POST',
            error: function (error, ajaxOptions, thrownError) {
                console.log(error.responseText);
                $("#message").html("ERROR " + method + " : " + error.responseText);
                callback(error.responseText);
            }
            ,
            success: function (data) {
                if (data.length == 0)
                    return callback(null, "empty neo result");
                var mongoData = []
                data.forEach(function (item, i) {
                    var obj = item.n.properties;
                    var neoId = item.n.id
                    if (obj.id) {// comes from Mongo previous export in Neo
                        obj.id = obj.id;
                        delete obj.id;
                    }
                    else// created in Neo
                        obj.id = neoId;
                    delete obj.neoId;
                    mongoData.push(obj)

                });
                var mongoPayload = {
                    data: mongoData,
                    insert: 1,
                    dbName: dbName,
                    collectionName: collection
                }

                $.ajax('../mongo/', {
                    data: mongoPayload,
                    dataType: "json",
                    type: 'POST',
                    error: function (error, ajaxOptions, thrownError) {
                        console.log(error);
                        $("#message").html("ERROR " + error.responseText);
                        if (callback)
                            callback(error);
                    }
                    ,
                    success: function (data) {
                        if (callback)
                            callback(null, data);
                    }
                })


            }
        })


    }

    self.duplicateRelationsFromNeoToMongo = function (subGraph, startLabel, endLabel, dbName, fieldMappings, callback) {
        var matchStr = "";

        matchStr = "Match (n:" + startLabel + ")-[r]-(m:" + endLabel + ") where n.subGraph='" + subGraph + "' return n,m ";


        var neoPayload = {match: matchStr}
        $.ajax('/rest/?retrieve=1', {
            data: neoPayload,
            dataType: "json",
            type: 'POST',
            error: function (error, ajaxOptions, thrownError) {
                console.log(error.responseText);
                $("#message").html("ERROR " + method + " : " + error.responseText);
                if (callback)
                    callback(error.responseText);
            }
            ,
            success: function (data) {
                if (data.length == 0)
                    return callback(null, "empty neo result");
                var mongoData = []
                data.forEach(function (item, i) {
                    var neoObj_n = item.n.properties;
                    //   neoObj_n.id = item.n.id;
                    var neoObj_m = item.m.properties;
                    //  neoObj_m.id = item.m.id;

                    var mongoObj = {}
                    if (fieldMappings.start) {

                        for (var neoField  in fieldMappings.start) {
                            mongoObj[fieldMappings.start[neoField]] = neoObj_n[neoField];
                        }

                    }
                    if (fieldMappings.end) {
                        for (var neoField in fieldMappings.end) {
                            mongoObj[fieldMappings.end[neoField]] = neoObj_m[neoField];
                        }

                    }


                    mongoData.push(mongoObj)


                    if (fieldMappings.startFilter || fieldMappings.endFilter) {// update field in existing collection

                        var query = {}
                        for (var key  in fieldMappings.startFilter) {
                            query[key] = neoObj_n[fieldMappings.startFilter[key]];
                        }
                        for (var key  in fieldMappings.endFilter) {
                            query[key] = neoObj_m[fieldMappings.endFilter[key]];
                        }
                        var mongoPayload = {
                            data: mongoObj,
                            query: query,
                            updateOrCreate: 1,
                            dbName: dbName,
                            collectionName: fieldMappings.collection
                        }
                        $.ajax('../mongo/', {
                            data: mongoPayload,
                            dataType: "json",
                            type: 'POST',
                            error: function (error, ajaxOptions, thrownError) {
                                console.log(error);
                                $("#message").html("ERROR " + error.responseText);
                                if (callback)
                                    callback(error);
                            }
                            ,
                            success: function (data) {
                                if (callback)
                                    callback(null, data);
                            }
                        })


                    }
                });
                if (!fieldMappings.startFilter) {//insert row in relation collection


                    var mongoPayload = {
                        data: mongoData,
                        insert: 1,
                        dbName: dbName,
                        collectionName: fieldMappings.collection
                    }

                    $.ajax('../mongo/', {
                        data: mongoPayload,
                        dataType: "json",
                        type: 'POST',
                        error: function (error, ajaxOptions, thrownError) {
                            console.log(error);
                            $("#message").html("ERROR " + error.responseText);
                            if (callback)
                                callback(error);
                        }
                        ,
                        success: function (data) {
                            if (callback)
                                callback(null, data);
                        }
                    })

                }

            }
        })


    }


    return self;
})
()

