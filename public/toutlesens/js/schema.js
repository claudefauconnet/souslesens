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
var Schema = (function () {
    var serverDir = "./schemas/";
    self = {};
    self.subGraph;
    self.serverUrl = "..";//Gparams.neo4jProxyUrl;

    self.schema = {
        defaultnodeNameField: "name",
        labels: {},
        relations: {},
        properties: {},
        mongoCollectionMapping: {},
        fieldsSelectValues: {}
    }

// if no schema exists create one,store it and load it
    self.load = function (subGraph, callback) {
        self.subGraph = subGraph;
        var payload = {
            retrieve: 1,
            path: serverDir + subGraph + ".json",

        }
        $.ajax(Schema.serverUrl + '/jsonFileStorage', {
                data: payload,
                dataType: "json",
                type: 'POST',
                error: function (error, ajaxOptions, thrownError) {
                    console.log(error);
                    self.schema = {
                        labels: {},
                        relations: {},
                        properties: {},
                        mongoCollectionMapping: {},
                        fieldsSelectValues: {}
                    }
                    if (dataModel) {// if no schema exists create one,store it and load it
                        self.generateNeoImplicitSchema(subGraph, true, function (err, result) {
                            self.load(subGraph, function (err, result) {
                                if (err)
                                    return callback(err);
                                else
                                    return callback(null, self.schema)

                            })
                        });

                    }

                    if (callback)
                        callback(error);

                }
                ,
                success: function (data) {
                    if (data.result)
                        data = data.result;
                    if (data) {
                        if (typeof data !== "object")
                            data = JSON.parse(data);


                        if (!data.defaultnodeNameField)
                            data.defaultnodeNameField = "name";

                        for (var key in self.schema) {// pour completer le champs vides non enregistrés par Jquery
                            if (!data[key])
                                data[key] = {};
                        }


                        self.schema = data;

                        //name  used in UI but not stored
                        for (var key in self.schema.relations) {
                            self.schema.relations[key].name = key
                        }

                        for (var key in self.schema.labels) {
                            if (!self.schema.properties[key])
                                self.schema.properties[key] = {};
                            if (!self.schema.properties[key][self.schema.defaultnodeNameField])
                                self.schema.properties[key][self.schema.defaultnodeNameField] = {
                                    "type": "text"
                                }
                        }


                        Gparams.defaultnodeNameField = self.schema.defaultnodeNameField;

                        if (callback)
                            callback(null, self.schema);

                    }

                }
            }
        )
    }

    self.save = function (subGraph, json, callback) {
        if (!json)
            json = self.schema;

        //name  used in UI but not stored
        for (var key in self.schema.relations) {
            delete self.schema.relations[key].name
        }

        for (var key in self.schema.labels) {
            if (!self.schema.properties[key])
                self.schema.properties[key] = {};
            if (!self.schema.properties[key][self.schema.defaultnodeNameField])
                self.schema.properties[key][self.schema.defaultnodeNameField] = {
                    "type": "text"
                }

        }
        var payload = {
            store: 1,
            path: serverDir + subGraph + ".json",
            data: json///JSON.stringify(json)
        }
        $.ajax(Schema.serverUrl + '/jsonFileStorage', {
            data: payload,
            dataType: "json",
            type: 'POST',
            error: function (error, ajaxOptions, thrownError) {
                console.log(error);
                if (callback)
                    return callback("error " + error)

            }
            ,
            success: function (data) {
                self.schema = json;
                if (callback)
                    return callback(null, data);

            }
        })

    }


    self.getPermittedRelations = function (label, direction) {
        if (!direction)
            direction = "normal";
        var relationsPermitted = [];
        var relations = self.schema.relations;
        for (var key in relations) {
            var relation = relations[key];

            relation.type = key;
            if (relation.startLabel == label && (direction == "normal" || direction == "both"))
                relationsPermitted.push(relation);
            if (relation.endLabel == label && (direction == "inverse" || direction == "both")) {
                relation.inverse = 1;
                relationsPermitted.push(relation);
            }


        }
        return relationsPermitted;

    }


    self.getPermittedRelTypes = function (startLabel, endLabel) {
        relTypes = [];
        var relations = self.schema.relations;
        for (var key in relations) {
            var relations = relations[key];

            if (relation.startLabel == startLabel && relation.endLabel == endLabel)
                relTypes.push(key);
        }
        return relTypes;
    }


    self.getRelations = function (startLabel, endLabel, mongoCollection) {
        var matchingRels = []
        var relations = self.schema.relations;
        for (var key in relations) {
            var relation = relations[key];

            if (relation.startLabel == startLabel && relation.endLabel == endLabel)
                matchingRels.push(relation);
            if (relation.startLabel == startLabel && endLabel == null)
                matchingRels.push(relation);
            if (relation.endLabel == endLabel && startLabel == null)
                matchingRels.push(relation);
            if (relation.mongoMapping && relation.mongoMapping.collection == mongoCollection)
                matchingRels.push(relation);

        }
        return matchingRels;

    }

    self.getRelationsByType = function (type) {
        var matchingRels = []
        var relations = self.schema.relations;
        for (var key in relations) {
            var relation = relations[key];
            if (relation.type == type) {
                matchingRels.push(relation)

            }
        }
        return matchingRels;

    }


    /*
     get the node property used as name  in UI (default "name")


     */
    self.getNameProperty = function (label) {
        if (!self.schema)
            return "name";
        if(!label)
            return self.schema.defaultnodeNameField;
        var properties = self.schema.properties[label];
        for (var field in properties) {
            if (properties[field].isName)
                return field

        }
        return self.schema.defaultnodeNameField;
    }


    self.updateRelationsModel = function (oldRelations) {
        var relationsNewModel = {}
        var relationss = self.schema.relations;
        if (oldRelations)
            relationss = oldRelations;
        for (var key in relationss) {
            var relations = relationss[key];
            for (var i = 0; i < relations.length; i++) {
                var relation = relations[i];
                if (relation.direction == "inverse")
                    continue;
                delete relation.direction;
                var name = key;
                if (i > 0)
                    var name = key + "_" + (i);

                relation.type = name;
                relationsNewModel[name] = relation;


            }
        }

        console.log(JSON.stringify(self.schema, undefined, 4));

        if (confirm("save new Schema ?")) {
            self.schema.relations = relationsNewModel;
            self.save(self.subGraph, self.schema)

        }
        return relationsNewModel;

    }

    self.generateNeoImplicitSchema = function (subGraph, save, callback) {
        if (self.schema && !save)
            return;
        var properties = {};
        var labels = {};
        var k = 0;
        dataModel.initNeoModel(subGraph, function () {
            for (var label in dataModel.labels) {
                labels[label] = {icon: "default.png"};
                if (Gparams && Gparams.palette) {
                    labels[label].color = Gparams.palette[k % Gparams.palette.length];
                    k++;

                }
                if (!properties[label])
                    properties[label] = {};
                var neoProps = dataModel.labels[label];
                for (var i = 0; i < neoProps.length; i++) {
                    properties[label][neoProps[i]] = {
                        type: "text",
                    }

                }
            }
            var implShema = {
                labels: labels,
                relations: self.updateRelationsModel(dataModel.allRelations),
                properties: properties,
                fieldsSelectValues: {},
                defaultnodeNameField: "name"

            }
            if (save) {
                // console.log(JSON.stringify(implShema, undefined, 4));
                self.save(subGraph, implShema, callback);
            }
        })


    }


    self.generateMongoImplicitSchema = function (subGraph, force, callback) {
        if (self.schema && !force)
            return;
        var properties = {};
        var nCount = 0;
        var excludedFields = ["_id", "modifiedBy", "lastModified"];
        var payload = {listCollections: 1, dbName: subGraph}
        neoToMongo.callMongoRemote(payload, function (err, data) {
            properties[data[i]] = {}
            for (var i = 0; i < data.length; i++) {
                properties[data[i]] = {}
                var payload2 = {listFields: 1, collectionName: data[i], dbName: subGraph}
                neoToMongo.callMongoRemote(payload2, function (err, data2) {
                    nCount += 1
                    for (var j = 0; j < data2.length; j++) {
                        if (data2[j] != "" && excludedFields.indexOf(data2[j]) < 0) {
                            properties[data2.collectionName][data2[j]] = {
                                type: "text",
                                label: data2[j],
                            }
                        }
                    }
                    if (nCount == data.length - 1) {
                        var implShema = {
                            // labels: dataModel.allLabels,
                            //  relations: dataModel.allRelations,
                            properties: properties,
                            fieldsSelectValues: {}

                        }
                        if (force)
                            console.log(JSON.stringify(implShema, undefined, 4));
                    }

                });


            }
        })


    }







    return self;
})
()
