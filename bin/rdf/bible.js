/**
 * Created by claud on 15/12/2017.
 */

var httpProxy = require("../httpProxy.js");
var restApi = require("../restAPI.js");
var async = require('async');

var fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var util = require('../util.js')
var xpath = require('xpath')
    , dom = require('xmldom').DOMParser


var labels = [
    "City",
    "Man",
    "Woman",
    "religiousBelief",
    "subregion",
    "StateOrProvince",
    "ResidenceGroup",
]

var nodes = {}
var rels = [
    "residentPlace",
    "childOf"

]

var rels = []

var tagNames = [];
// data from https://swapi.co/api/
// http://eo.dbpedia.org/page/Star_Wars

http://bibleontology.com/linked_data/sparql
    var nodes = {}

var bible = {


    importBible: function () {
        var str = "" + fs.readFileSync("./thesaurii/bibleOntologIndividuals.owl");

        var doc = new dom().parseFromString(str);


        var allElts = doc.documentElement.getElementsByTagName("*");

        for (var j = 0; j < allElts.length; j++) {
            if (allElts[j].attributes && allElts[j].attributes[0] && allElts[j].attributes[0].name == "rdf:ID") {
                var tag = allElts[j].tagName;
                if (tagNames.indexOf(tag) < 0) {
                    tagNames.push(tag);
                    console.log("'" + tag + "',");
                }
            }
        }

        for (var i = 0; i < tagNames.length; i++) {
            var xmlNodes = doc.documentElement.getElementsByTagName(tagNames[i]);
            for (var j = 0; j < xmlNodes.length; j++) {
                if (xmlNodes[j].attributes && xmlNodes[j].attributes[0]) {
                    var ID = xmlNodes[j].attributes[0].nodeValue;


                    var node = {labelNeo: tagNames[i], id: ID, name: "", rels: [], attrs: {}};
                    nodes[ID] = node;

                    for (var k = 0; k < xmlNodes[j].childNodes.length; k++) {
                        var childElt = xmlNodes[j].childNodes[k];
                        if (childElt.tagName == "rdfs:label") {
                            var name = childElt.childNodes[0].nodeValue;
                            nodes[ID].name = name;


                        }
                        else if (childElt.tagName == "rdfs:comment" || childElt.tagName == "rdfs:description") {
                            var tag = childElt.tagName.substring(childElt.tagName.indexOf(":") + 1);
                            var value = childElt.childNodes[0].nodeValue;
                            nodes[ID].attrs[tag] = value;

                        }
                        else {
                            if (childElt.attributes) {
                                for (var l = 0; l < childElt.attributes.length; l++) {
                                    if (childElt.attributes[l].nodeName == "rdf:resource") {
                                        var value=childElt.attributes[l].nodeValue;
                                        if(value.indexOf("#")==0) {
                                            var rel = {
                                                type: childElt.tagName,
                                                source: ID,
                                                target: value.substring(1)
                                            }
                                            rels.push(rel);
                                        }
                                    }
                                }
                            }
                        }


                    }

                }
            }

        }
        var www = 5
        //    console.log(JSON.stringify(nodes,null,2))
        //    console.log(JSON.stringify(rels,null,2))
        var payload = {match: 'match(n) where n.subGraph="bible" DETACH delete n'};
        restApi.retrieve(payload, function (err, result) {
            async.eachSeries(nodes, function (item, callback_1) {//create Nodes
                bible.createNodes(item, function (err, neoId) {
                    if (err)
                        return callback_1(err);

                    return callback_1(null);
                })

            }, function (err) {// end
                if (err)
                    return console.log(err);
                async.eachSeries(rels, function (relObj, callback_2) {
                        bible.createRelation(relObj, function (err, result) {
                            if (err)
                                return callback_2(err);

                            return callback_2(null);
                        })

                    }
                    , function (err) {// end
                        if (err)
                            return console.log(err);
                        console.log("ALL DONE");

                    });

            });
        });

    },


    createNodes: function (obj, callback) {


        //  var properties = util.cleanFieldsForNeo(obj);
        obj.url = encodeURIComponent(obj.url)
        obj.attrs.name = obj.name;
        obj.attrs.id = obj.id;
        obj.attrs=util.cleanFieldsForNeo( obj.attrs);
        var payload = {
            nodeSubGraph: "bible",
            nodeLabel: obj.labelNeo,
            nodeAttrs: obj.attrs
        }


        restApi.createNode(payload, function (err, result) {
            if (err)
                return callback(err);
            var ww = result;
            var neoId = result[0].n._id;
            return callback(null, neoId);
        })

    }

    ,
    createRelation: function (obj, callback) {


        var payload = {
            sourceNodeQuery: {id: obj.source},
            targetNodeQuery: {id: obj.target},
            relType: obj.type

        }


        restApi.createRelation(payload, function (err, result) {
            if (err)
                return callback(err);

            return callback(null, result);
        })

    }


}
module.exports = bible;


if (true) {

    bible.importBible();
}





