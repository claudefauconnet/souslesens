var fs = require('fs');
var elasticProxy = require("../elasticProxy")
var csv = require('csvtojson');
//http://www.lexiconista.com/datasets/lemmatization/
var lemmatizerProcessor = {


    importElastic: function (path) {
        var jsonArray = [];
        csv({noheader: true, trim: true, delimiter: "auto"})

            .fromFile(path)
            .on('json', function (json) {

                jsonArray.push({lemme:json.field1,word:json.field2});

            })
            .on('done', function () {
                var x = jsonArray;
                elasticProxy.indexJsonArray("lemmatization_fr", "lemmatization", jsonArray, function (err, result) {
                   var xx=err;
                });
            });
    }


}

var path = "D:\\NLP\\lemmatization-fr.txt";
lemmatizerProcessor.importElastic(path);
module.exports = lemmatizerProcessor;
