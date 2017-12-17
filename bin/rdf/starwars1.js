/**
 * Created by claud on 15/12/2017.
 */

var httpProxy = require("../httpProxy.js");
var restApi = require("../restAPI.js");
var async = require('async');
var util = require('../util.js')
var fs = require('fs');

var rels0 = {
    residents: {},
    films: {},
    species: {},
    vehicles: {},
    starships: {},
    characters: {},
    planets: {},
    people: {},
    pilots: {},

};
var rels = []

// data from https://swapi.co/api/
var starwars = {

    importStarWarsJson: function () {
        var str = "" + fs.readFileSync("./thesaurii/starwars.json");
        var json = JSON.parse(str);


        var cleanData = [];
        for (var key in json) {
            var label = key;
            var data = json[key];

            for (var i = 0; i < data.length; i++) {
                var obj = data[i]
                for (var prop in  obj) {
                    if (Array.isArray(obj[prop])) {
                        rels.push({url: obj.url, type: prop, targetUrls: obj[prop]});
                        delete json[key][i][prop];

                    }
                }
                obj.type = key
                cleanData.push(obj);
            }
        }


        var payload = {match: 'match(n) where n.subGraph="starwars2" DETACH delete n'};
        restApi.retrieve(payload, function (err, result) {
            async.eachSeries(cleanData, function (item, callback_1) {//create Nodes
                starwars.createNodes(item, function (err, neoId) {
                    if (err)
                        return callback_1(err);

                    return callback_1(null);
                })

            }, function (err) {// end
                if (err)
                    return console.log(err);


                async.eachSeries(rels, function (relObj, callback_2) {
                    var sourceUrl = relObj.url;
                    var type = relObj.type;
                    async.eachSeries(relObj.targetUrls, function (relObj, callback_3) {
                            var obj = {source: sourceUrl, target: relObj, type: type}
                        starwars.createRelation (obj, function(err,result) {
                            if (err)
                                return callback_3(err);

                            return callback_3(null);
                        })

                        }, function (err) {// end
                            if (err)
                                return callback_2(err);
                            return callback_2(null);

                        }
                        , function (err) {// end
                            if (err)
                                return console.log(err);
                            console.log("ALL DONE");

                        });
                })
            })
        })
    }



    ,
    createNodes: function (obj, callback) {


      //  var properties = util.cleanFieldsForNeo(obj);
        obj.url=encodeURIComponent(obj.url)
        var properties=obj;

        var type = obj.type;
        delete obj.type;

        var payload = {
            nodeSubGraph: "starwars2",
            nodeLabel: type,
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
    ,
    createRelation: function (obj, callback) {


        var payload = {
            sourceNodeQuery: {url:encodeURIComponent(obj.source)},
            targetNodeQuery: {url: encodeURIComponent(obj.target)},
            relType: obj.type

        }


        restApi.createRelation(payload, function (err, result) {
            if (err)
                return callback(err);

            return callback(null, result);
        })

    }


}
module.exports = starwars;


if (true) {

    starwars.importStarWarsJson();
}





