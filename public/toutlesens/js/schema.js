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
        self = {};
        var serverDir = "./config/schemas/";
        self.neo4jProxyUrl = "../../.." + Gparams.neo4jProxyUrl;
        self.serverRootUrl = "../../..";


        self.allLabelsPaths = null;
        self.subGraph;

        self.currentGraph=null;


        self.schema = {
            defaultNodeNameProperty: "name",
            labels: {},
            relations: {},
            properties: {},
            mongoCollectionMapping: {},
            fieldsSelectValues: {}
        }


        /**
         * load schema from config/schemas dir
         * if no schema call schema configDialog
         */

        self.load = function (_subGraph, callback) {
            var subGraph = _subGraph;
            if (!_subGraph)
                subGraph = subGraph = queryParams.subGraph;
            if (!subGraph) {
                subGraph = Gparams.defaultSubGraph;
            }
            self.schema = {
                labels: {},
                relations: {},
                properties: {},
                mongoCollectionMapping: {},
                fieldsSelectValues: {},
                Gparams: {}
            }
            self.subGraph = subGraph;
            var payload = {
                retrieve: 1,
                path: serverDir + subGraph + ".json",

            }
            $.ajax(self.serverRootUrl + '/jsonFileStorage', {
                data: payload,
                dataType: "json",
                type: 'POST',


                error: function (error, ajaxOptions, thrownError) {
                    // if schema does not exist we create one by analyzing Neo4j db content
                    console.log("no schema found, will create one");
                    self.createSchema();

                    setTimeout(function () {
                        toutlesensController.dispatchAction('showSchemaConfigDialog');//({create:1});
                    }, 2000)


                },
                success: function (_schema) {
                    //if schema has been found and loaded
                    self.initSchema(_schema, callback);
                }
            })
        }


        /**
         * generate implicit schema and update schemaconfigDialog to modifiy it
         *
         */


        self.createSchema = function (callback) {
            self.generateNeoImplicitSchema(subGraph, true, function (err, _schema) {
                if (err) {
                    console.log(err)
                    if (callback)
                        return callback(err)
                    return $("#schemaConfig_message").html("ERROR while generating schema");
                }
                else {
                    $("#schemaConfig_message").html("Schema generated");
                    $("#schemaConfig_configSchemaDiv").css("visibility", "visible");


                    self.initSchema(_schema);
                    // self.save(subGraph);
                    if (callback)
                        return callback(null, self.schema)

                }
            })
        }
        self.delete = function (confirmation) {
            if (confirmation && confirm("delete  this schema ?")) {
                var payload = {
                    delete: 1,
                    path: serverDir + subGraph + ".json",

                }
                $.ajax(self.serverRootUrl + '/jsonFileStorage', {
                    data: payload,
                    dataType: "json",
                    type: 'POST',


                    error: function (error, ajaxOptions, thrownError) {
                        return console.log("error while deleting file :" + error);

                    },
                    success: function (result) {
                        return console.log("file" + serverDir + subGraph + ".json  : DELETED");


                    }
                })
            }

        }

        self.resetSchema = function () {
            if (confirm("delete  this schema and recreate one from graph database ?")) {

                var payload = {
                    delete: 1,
                    path: serverDir + subGraph + ".json",

                }
                $.ajax(self.serverRootUrl + '/jsonFileStorage', {
                    data: payload,
                    dataType: "json",
                    type: 'POST',


                    error: function (error, ajaxOptions, thrownError) {

                        return console.log("error while deleting file :" + error);

                    },
                    success: function (result) {

                        self.load(subGraph, function (err, result) {
                            location.reload()
                        })


                    }


                })
            }
        }

        self.setDefaultNodeNameProperty = function () {
            var newName = $("#schemaConfig_defaultNodeNameProperty").val();
            if (newName !== "") {
                self.schema.defaultNodeNameProperty = newName;
                self.save(subGraph)


            }
        }

        /**
         * performs initialisation of toutlesens after loading schema

         */
        self.initSchema = function (data, callback) {

            if (data.result)
                data = data.result;
            if (data) {
                if (typeof data !== "object")
                    data = JSON.parse(data);


                if (!data.defaultNodeNameProperty)
                    data.defaultNodeNameProperty = "name";

                for (var key in self.schema) {// pour completer le champs vides non enregistrés par Jquery
                    if (!data[key])
                        data[key] = {};
                }


                self.schema = data;
                if (Gparams)
                    Gparams.defaultNodeNameProperty = self.schema.defaultNodeNameProperty;
                //name  used in UI but not stored
                for (var key in self.schema.relations) {
                    self.schema.relations[key].name = key
                }

                for (var key in self.schema.labels) {
                    if (!self.schema.properties[key])
                        self.schema.properties[key] = {};
                    if (!self.schema.properties[key][self.schema.defaultNodeNameProperty])
                        self.schema.properties[key][self.schema.defaultNodeNameProperty] = {
                            "type": "text"
                        }
                }

                self.setLabelsColor();
                self.setLinkColors();
                if (self.schema.Gparams) {
                    for (var key in self.schema.Gparams) {
                        Gparams[key] = self.schema.Gparams[key];
                    }
                }

                Gparams.defaultNodeNameProperty = self.schema.defaultNodeNameProperty;

                if (callback)
                    callback(null, self.schema);

            }

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
                if (!self.schema.properties[key][self.schema.defaultNodeNameProperty])
                    self.schema.properties[key][self.schema.defaultNodeNameProperty] = {
                        "type": "text"
                    }

            }
            var payload = {
                store: 1,
                path: serverDir + subGraph + ".json",
                data: json///JSON.stringify(json)
            }
            $.ajax(self.serverRootUrl + '/jsonFileStorage', {
                data: payload,
                dataType: "json",
                type: 'POST',
                error: function (error, ajaxOptions, thrownError) {
                    toutlesensController.onErrorInfo(error)
                    if (callback)
                        return callback("error " + error)

                }
                ,
                success: function (data) {
                    self.schema = json;
                    if (callback)
                        return callback(null, json);

                }
            })

        }
            ,
            self.setLinkColors = function () {
                linkColors = {};
                if (Schema && Schema.schema) {
                    var i = 0;
                    for (var key in Schema.schema.relations) {
                        var relation = Schema.schema.relations[key];
                        var relKey = relation.type;
                        var p = relKey.indexOf("#");
                        if (p > -1)
                            relKey = relKey.substring(0, p);
                        if (relation.color)
                            linkColors[relKey] = relation.color;
                        else {

                            var index = (i++) % Gparams.palette.length;


                            linkColors[relKey] = Gparams.palette[index];
                        }

                    }
                    var xxx = ';'
                }
                else {
                    for (var i = 0; i < dataModel.allRelationsArray.length; i++) {
                        var index = (i) % Gparams.palette.length;
                        linkColors[dataModel.allRelationsArray[i]] = Gparams.palette[index];

                    }
                }
            }
        self.setLabelsColor = function () {
            if (Schema && Schema.schema) {
                var i = 0;
                for (var key in Schema.schema.labels) {
                    if (Schema.schema.labels[key].color)
                        nodeColors[key] = Schema.schema.labels[key].color;
                    else {
                        var index = (i++) % Gparams.palette.length;
                        nodeColors[key] = Gparams.palette[index];
                    }
                    if (Schema.schema.labels[key].icon == "default.png")
                        delete Schema.schema.labels[key].icon;
                }
            }
            else {
                for (var i = 0; i < dataModel.allLabels.length; i++) {
                    var label = dataModel.allLabels[i];
                    var index = i % Gparams.palette.length;
                    nodeColors[label] = Gparams.palette[index];
                }
            }
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

        self.getAllLabelNames = function () {
            var labels = [];//[""];
            for (var label in self.schema.labels) {
                labels.push(label);
            }
            labels.sort();
            return labels;
        }

        self.getAllRelationNames = function () {
            var relations = [];//[""];
            for (var key in relations) {
                var relation = relations[key];
                var type = relation.type;
                relTypes.push(type);
            }
            relations.sort();
            return relations;


        }


        self.getPermittedRelTypes = function (startLabel, endLabel, inverseRelAlso) {
            relTypes = [];
            var relations = self.schema.relations;
            for (var key in relations) {
                var relation = relations[key];
                var type = relations[key].type;

                if (relation.startLabel == startLabel && relation.endLabel == endLabel)
                    relTypes.push(type);

                if (inverseRelAlso && relation.startLabel == endLabel && relation.endLabel == startLabel)
                    relTypes.push("-" + type);
            }
            return relTypes;
        }


        self.getPermittedLabels = function (startLabel, inverseRelAlso, withoutInverseSign) {
            labels = [];
            var relations = self.schema.relations;
            for (var key in relations) {
                var relation = relations[key];


                if (relation.startLabel == startLabel)
                    if (labels.indexOf(relation.endLabel) < 0)
                        labels.push(relation.endLabel);

                if (inverseRelAlso && relation.endLabel == startLabel)
                    if (labels.indexOf(relation.startLabel) < 0) {
                        if (withoutInverseSign)
                            labels.push(relation.startLabel);
                        else
                            labels.push("-" + relation.startLabel);
                    }

            }
            return labels;
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

        self.getLabelsDistance= function (startNode, endNode) {
            var relations = self.schema.relations;
            var nodes = {};

            // nodes around each nodes
            for (var key in relations) {
                if (!nodes[relations[key].startLabel])
                    nodes[relations[key].startLabel] = [];
                if (nodes[relations[key].startLabel].indexOf(relations[key].endLabel) < 0)
                    nodes[relations[key].startLabel].push(relations[key].endLabel);
                if (!nodes[relations[key].endLabel])
                    nodes[relations[key].endLabel] = []
                if (nodes[relations[key].endLabel].indexOf(relations[key].startLabel) < 0)
                    nodes[relations[key].endLabel].push(relations[key].startLabel);
            }

            // transfrom each neighbour node in object
            for (var key in nodes) {
                var labels2 = [];
                for (var i = 0; i < nodes[key].length; i++) {

                    var nodeObj = {name: nodes[key][i]};
                    if (nodes[key][i] == startNode) {
                        nodeObj.istartNode = true;
                        nodeObj.isVisited = true;
                    }
                    if (nodes[key][i] == endNode)
                        nodeObj.isendNode = true;
                    labels2.push(nodeObj)
                }
                nodes[key] = labels2;
            }


            // start from startnode
            var nodesSerie = []
            var nodesSerieObj = {}
            function recurse(parent) {


                for (var i = 0; i < nodes[parent.name].length; i++) {

                    var node = nodes[parent.name][i];
                    if(node.name=="personne")
                        var xx=2
                    if ( nodesSerie.indexOf(node.name)<0) {
                        if(!node.isVisited ) {// first occurence
                            nodesSerie.push(node.name);
                            nodesSerieObj[node.name] = parent.level + 1;
                            nodes[parent.name][i].isVisited = true;
                         //   recurse({name: node.name, level: parent.level + 1})
                        }else{


                        }
                    }


                }

                for (var i = 0; i < nodes[parent.name].length; i++) {
                    var node=nodes[parent.name][i];
                    var nodeLevel = nodesSerieObj[node.name];
                    if(nodeLevel){
                        recurse(node);
                    }
                }


            }

            recurse({name:startNode,level:0});


            console.log(JSON.stringify(nodesSerieObj));

            return nodesSerieObj[endNode];


        }

        self.getLabelsDistance1 = function (startNode, endNode) {
            var relations = self.schema.relations;
            var nodes = {};

            // nodes around each nodes
            for (var key in relations) {
                if (!nodes[relations[key].startLabel])
                    nodes[relations[key].startLabel] = [];
                if (nodes[relations[key].startLabel].indexOf(relations[key].endLabel) < 0)
                    nodes[relations[key].startLabel].push(relations[key].endLabel);
                if (!nodes[relations[key].endLabel])
                    nodes[relations[key].endLabel] = []
                if (nodes[relations[key].endLabel].indexOf(relations[key].startLabel) < 0)
                    nodes[relations[key].endLabel].push(relations[key].startLabel);
            }

            // transfrom each neighbour node in object
            for (var key in nodes) {
                var labels2 = [];
                for (var i = 0; i < nodes[key].length; i++) {

                    var nodeObj = {name: nodes[key][i]};
                    if (nodes[key][i] == startNode) {
                        nodeObj.istartNode = true;
                        nodeObj.isVisited = true;
                    }
                    if (nodes[key][i] == endNode)
                        nodeObj.isendNode = true;
                    labels2.push(nodeObj)
                }
                nodes[key] = labels2;
            }


            // start from startnode
            var nodesSerie = []
            var nodesSerieObj = {}
            function recurse(parent) {


                for (var i = 0; i < nodes[parent.name].length; i++) {

                    var node = nodes[parent.name][i];
                    if(node.name=="personne")
                        var xx=2
                    if ( nodesSerie.indexOf(node.name)<0) {
                        if(!node.isVisited ) {// first occurence
                            nodesSerie.push(node.name);
                            nodesSerieObj[node.name] = parent.level + 1;
                            nodes[parent.name][i].isVisited = true;
                            recurse({name: node.name, level: parent.level + 1})
                        }else{


                        }
                    }
                    else if(tnode.isVisited ){
                        if( nodesSerieObj[node.name]>parent.level + 1){//choose shortest path
                            nodesSerieObj[node.name]=parent.level + 1
                            recurse({name: node.name, level: parent.level + 1})
                        }
                    }

                }
            }

            recurse({name:startNode,level:0});


          console.log(JSON.stringify(nodesSerieObj));

          return nodesSerieObj[endNode];


        }

        self.getLabelsDistance0 = function (label1, label2) {
            var relations = self.schema.relations;
            var startLabels = {};
            var endLabels = {};
            for (var key in relations) {
                if (!startLabels[relations[key].startLabel])
                    startLabels[relations[key].startLabel] = []
                startLabels[relations[key].startLabel].push(relations[key].endLabel);
                if (!endLabels[relations[key].endLabel])
                    endLabels[relations[key].endLabel] = []
                endLabels[relations[key].endLabel].push(relations[key].startLabel);
            }

            var distance = 0;

            var startLabel = [label1];

            while (distance < 10) {
                distance += 1
                for (var i = 0; i < startLabel.length; i++) {
                    var labelsS = [];
                    var labelsE = [];
                    console.log(startLabel[i])
                    if (startLabels[startLabel[i]]) {
                        console.log("***" + startLabel[i])
                        if (startLabels[startLabel[i]].indexOf(label2) > -1) {
                            return distance;
                        }
                        else
                            labelsS = startLabels[startLabel[i]];
                    }
                    if (endLabels[startLabel[i]]) {
                        console.log("!!*" + startLabel[i])
                        if (endLabels[startLabel[i]].indexOf(label2) > -1) {
                            return distance;
                        }
                        labelsE = endLabels[startLabel[i]]

                    }
                    startLabel = labelsS.concat(labelsE);
                }


            }
            return -1;


        }

        self.getNameProperty = function (label) {
            if (!self.schema)
                return "name";
            if (!label)
                return self.schema.defaultNodeNameProperty;
            var properties = self.schema.properties[label];
            for (var field in properties) {
                if (properties[field].isName)
                    return field

            }
            return self.schema.defaultNodeNameProperty;
        }


        self.updateRelationsModel = function (oldRelations) {
            var relationsNewModel = {}
            var relations = self.schema.relations;
            if (oldRelations)
                relations = oldRelations;
            for (var key in relations) {

                var relations2 = relations[key];
                if (relations2) {
                    for (var i = 0; i < relations2.length; i++) {
                        var relation = relations2[i];
                        if (relation.direction == "inverse")
                            continue;
                        delete relation.direction;
                        var name = key;
                        if (i > 0)
                            var name = key + "--" + (i);
                        relation.properties.subGraph
                        relation.type = key;
                        relation.properties = []
                        relationsNewModel[name] = relation;

                    }
                }
            }

            //      console.log(JSON.stringify(self.schema, undefined, 4));

            if (true) {//confirm("save new Schema ?")) {
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
                    defaultNodeNameProperty: "name",
                    Gparams: {}

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
                if (err) {
                    if (callback)
                        return callback(err);
                    return err;
                }
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
                        if (callback) {
                            return callback(null, implShema);
                        }

                    });


                }
            })


        }


        return self;
    }
)
()
