/**
 * Created by claud on 15/12/2017.
 */

var httpProxy = require("../httpProxy.js");
var restApi = require("../restAPI.js");
var async = require('async');
var util = require('../util.js')


var starwars = {


    sparqls: {
        topItems: 'select * where {?item <http://dbpedia.org/ontology/series> <http://dbpedia.org/resource/Star_Wars>.  ?item rdfs:label ?label. FILTER(LANG(?label) = "" || LANGMATCHES(LANG(?label), "en"))}',
        allProperties: 'select * where {?item ?property <##>.}',
        children: 'select distinct * where { ?item <http://dbpedia.org/ontology/series> <http://dbpedia.org/resource/Star_Wars>. ?item rdfs:label ?label. ?item ?prop ?item2. optional{?label2 rdfs:label ?item2.} FILTER((LANG(?label) = "" || LANGMATCHES(LANG(?label), "en")) ) } '
    },

    properties: {


        "http://xmlns.com/foaf/0.1/gender": "gender",
        "http://xmlns.com/foaf/0.1/name": "name",
        "http://purl.org/dc/terms/description": "description",
        "http://dbpedia.org/ontology/wikiPageID": "wikiPageID",
        "http://dbpedia.org/ontology/wikiPageRevisionID": "wikiPageRevisionID",
        "http://dbpedia.org/ontology/wikiPageExternalLink": "wikiPageExternalLink",
        "http://dbpedia.org/ontology/occupation": "occupation",
        "http://dbpedia.org/ontology/voice": "voice",
        "http://dbpedia.org/property/gender": "gender",
        "http://dbpedia.org/ontology/gender": "gender",
        "http://dbpedia.org/property/family": "family",
        "http://dbpedia.org/property/title": "title",
        "http://dbpedia.org/property/id": "id",
        "http://dbpedia.org/property/children": "children",
        "http://dbpedia.org/property/fullName": "fullName",
        "http://dbpedia.org/ontology/firstAppearance": "firstAppearance",
        "http://dbpedia.org/ontology/lastAppearance": "lastAppearance",


    },

    relations: {
        "http://dbpedia.org/property/occupation": "occupation",
        "http://dbpedia.org/ontology/relative": "relative",
        "http://dbpedia.org/ontology/spouse": "spouse",
        "http://dbpedia.org/property/character": "character",
        "http://www.w3.org/2002/07/owl#differentFrom": "differentFrom",
        "http://dbpedia.org/property/": "species",
        "http://dbpedia.org/ontology/species": "species",
        "http://dbpedia.org/property/actor": "actor",
        "http://www.w3.org/2000/01/rdf-schema#seeAlso": "seeAlso",
        "http://www.w3.org/2002/07/owl#differentFrom": "differentFrom",
    },


    execSparql: function (query, callback) {

        var query2 = "&format=json&timeout=30000";
        var url = "http://dbpedia.org/sparql?default-graph-uri=http%3A%2F%2Fdbpedia.org&query="
        url += encodeURIComponent(query) + query2;

        httpProxy.get(url, function (err, result) {
            if (err)
                return;
            var json = JSON.parse(result);
            var topItems = {};
            var props = [];
            var nodeTypes = []
            var objs = json.results.bindings;
            for (var i = 0; i < objs.length; i++) {
                var key = objs[i].item.value;
                if (!topItems[key]) {
                    topItems[key] = {
                        uri: key,
                        type: "level0",
                        name: objs[i].label.value,
                        children: [],
                        relations: [],
                        properties: []
                    };
                }
                var prop = objs[i].prop.value;
                if (props.indexOf(prop) < 0)
                    props.push(prop);
                if (nodeTypes.indexOf(objs[i].item2.value))
                    nodeTypes.push(objs[i].item2.value);
                var propObj = {prop: prop, value: objs[i].item2.value, type: objs[i].item2.type};
                if (objs[i].label2)
                    propObj.label = objs[i].label2

                topItems[key].children.push(propObj)


            }

            console.log(JSON.stringify(nodeTypes, null, 2));

//process children

            for (var key in topItems) {
                var item = topItems[key];
                for (var j = 0; j < item.children.length; j++) {
                    var child = item.children[j];
                    var name = "";
                    if (child.label)
                        name = child.label;
                    else {
                        var p = child.value.lastIndexOf("/");
                        if (p > -1)
                            name = child.value.substring(p + 1);
                        else
                            name = child.value;
                    }

                    if (child.type == "uri" && starwars.relations[child.prop]) {
                        var childObj = {uri: child.value, name: name, children: [], relations: [], properties: []}
                        if (!topItems[child.value]) {// create the node
                            childObj.type = "level1";
                            topItems[child.value] = childObj;
                        }
                        topItems[key].relations.push({type: starwars.relations[child.prop], target: child.value});//set the relation

                    }
                    else if (starwars.properties[child.prop]) {


                        topItems[key].properties.push({prop: starwars.properties[child.prop], value: child.value})

                    }
                }

            }

            var payload = {match: 'match(n) where n.subGraph="starwars" DETACH delete n'};
            restApi.retrieve(payload, function (err, result) {
                async.eachSeries(topItems, function (item, callback_1) {//create Nodes
                    console.log(item.uri)

                    starwars.createNodes(item, function (err, neoId) {
                            if (err)
                                return callback_1(err);
                            topItems[item.uri].neoId = neoId;
                            return callback_1(null);
                        }
                    );


                }, function (err) {// end
                    if (err)
                        return console.log(err);
                    async.eachSeries(topItems, function (item, callback_2) {

                        async.eachSeries(item.relations, function (relation, callback_3) {
                            var targetId = topItems[relation.target].neoId;
                            var obj = {

                                sourceId: topItems[item.uri].neoId,
                                targetId: targetId,
                                type: relation.type

                            }
                            starwars.createRelation(obj, function (err, result) {

                                if (err)
                                    return callback_3(err);
                                callback_3(null);

                            })


                        }, function (err) {//end3
                            var xx = 1;
                            callback_2(null)
                        })

                    }, function (err) {//end2
                        var xx = 1;
                        console.log("ALL DONE")
                    })
                })
            })
        })
    },
    createNodes: function (obj, callback) {
        var properties = {}
        for (var i = 0; i < obj.properties.length; i++) {
            obj.properties[i].value;
            properties[obj.properties[i].prop] = obj.properties[i].value;
        }
        properties.name = obj.name
        properties.uri = obj.uri;
        properties = util.cleanFieldsForNeo(properties);

        var payload = {
            nodeSubGraph: "starwars",
            nodeLabel: obj.type,
            nodeAttrs: properties
        }


        restApi.createNode(payload, function (err, result) {
            if (err)
                return callback(err);
            var ww = result;
            var neoId = result[0].n._id;
            return callback(null, neoId);
        })

    }
    , createRelation: function (obj, callback) {


        var payload = {
            sourceNodeQuery: {_id: obj.sourceId},
            targetNodeQuery: {_id: obj.targetId},
            relType: obj.type

        }


        restApi.createRelation(payload, function (err, result) {
            if (err)
                return callback(err);

            return callback(null, result);
        })

    }

    ,
    setChildrenGraph: function () {

        var payload = {match: 'match(n) where n.subGraph="starwars" return n;'}


        restApi.retrieve(payload, function (err, result) {
            if (err)
                return;
            var xx = result;
        })
        for (var i = 0; i < result.length; i++) {
            var uri = result[i].n.properties.uri;
            var name = result[i].n.properties.name;


        }


    }
}
module.exports = starwars;


if (true) {
    var query = starwars.sparqls["children"];
    starwars.execSparql(query);
}
if (false) {
    starwars.setChildrenGraph();
}




