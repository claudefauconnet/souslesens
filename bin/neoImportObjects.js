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
var serverParams = require('./serverParams.js');
var neoProxy = require('./neoProxy.js');


var neoImportObjects = {

    writeNodesToNeoNodes: function ( _objs, callback) {
        var objs = _objs;
        var path = "/db/data/transaction/commit";


        var statements = [];
        var label;
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];

            //  obj = cleanFieldsForNeo(obj);

            var labelFieldValue = obj._labelField;
            if (labelFieldValue != null) {
                label = labelFieldValue;
                delete  obj._labelField;
            }else label=obj.label;

            var attrs = JSON.stringify(obj).replace(/"(\w+)"\s*:/g, '$1:');// quote the keys in json

            var statement = {statement: "CREATE (n:" + label + attrs + ")  RETURN n.id,ID(n), labels(n)"};
            statements.push(statement);
        }


        var payload = {statements: statements};
        var neo4jUrl = serverParams.neo4jUrl;
        neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {
            if (err) {

                callback(err);
                return;

            }

            var nodeMappings = [];
            for (var i = 0; i < result.results.length; i++) {
                var obj = result.results[i]
                var label = obj.data[0].row[2][0];
                var id = obj.data[0].row[1];
                var nodeMapping = {};
                nodeMapping.neoId = id;
                nodeMapping.mongoId = objs[i].id;
                nodeMapping.label = label;
                nodeMappings.push(nodeMapping);
            }
            callback(nodeMappings);
        });
    }
    ,
    /*params ={
        sourceField:"",
        targetField:"",
        relationType:"",
        neoRelAttributeField:"",
     sourceLabel:"",
     targetLabel:"
       }

     */
    importRelations: function (data,nodeMappingArray,params, callback) {
        var relations = [];
        var missingMappings=[];
        var uniqueRelations=[];
        var totalImported=0;
       var nodeMappings={};
        for (var i = 0; i < nodeMappingArray.length; i++) {
            nodeMappings["_"+nodeMappingArray[i].mongoId]=  nodeMappingArray[i].neoId
        }
        for (var i = 0; i < data.length; i++) {

            var obj = data[i];
            delete obj._id;


            var neoIdStart = nodeMappings["_" + obj[params.sourceField]];
            var neoIdEnd = nodeMappings["_" + obj[params.targetField]];

            if (neoIdStart == null | neoIdEnd == null) {
                missingMappings.push(obj)
                continue;

            } else {

                var hashCode = "" + neoIdStart + neoIdEnd;

                if (uniqueRelations.indexOf(hashCode) < 0) {
                    uniqueRelations.push(hashCode);
                } else {
                    continue;
                }

                var properties = {};

                if (params.neoRelAttributeField != null && params.neoRelAttributeField.length > 0)
                    properties[params.neoRelAttributeField] = obj[params.neoRelAttributeField];

                var relation = {
                    sourceId: neoIdStart,
                    targetId: neoIdEnd,
                    type: params.relationType,
                    data: properties
                }
                relations.push(relation);

            }
        }
        var path = "/db/data/batch";
        var payload = [];
        for (var i = 0; i < relations.length; i++) {
            totalImported += 1;


            var neoObj = {
                method: "POST",
                to: "/node/" + relations[i].sourceId + "/relationships",
                id: 3,
                body: {
                    to: "" + relations[i].targetId,
                    data: relations[i].data,
                    type: relations[i].type
                }
            }
            payload.push(neoObj);

        }

        var neo4jUrl = serverParams.neo4jUrl;
        neoProxy.cypher(neo4jUrl, path, payload, function (err, result) {

            if (err) {

                callback(err);
                return;
            }
            if (result.errors && result.errors.length > 0) {
                callback(JSON.stringify(result));
                return;

            }

            var message = "Imported " + totalImported + "relations  with type " + params.relationType;
            callback(null, result)

        })


    }


}

module.exports = neoImportObjects;