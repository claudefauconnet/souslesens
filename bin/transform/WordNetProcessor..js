var fs = require('fs');
var dom = require('xmldom').DOMParser
var path = require('path');
var elasticProxy = require('../elasticProxy.js');


var WordNetProcessor = {


    parseFile: function (filePath, callback) {


        var pathStr = path.resolve(filePath)
        var str = "" + fs.readFileSync(pathStr);

        var doc = new dom().parseFromString(str);
        var objs = [];

        var synsets = doc.documentElement.getElementsByTagName("SYNSET");

        for (var i = 0; i < synsets.length; i++) {
            var obj = {synonyms: []}

            var synset = synsets[i];
            var ilrs = synset.getElementsByTagName("ILR");
            for (var j = 0; j < ilrs.length; j++) {
                var type = ilrs[j].attributes[0].value;
                var value = ilrs[j].childNodes[0].nodeValue.trim();
                obj[type] = value;

            }

            obj.id = synset.getElementsByTagName("ID")[0].childNodes[0].nodeValue.trim();
            obj.pos = synset.getElementsByTagName("POS")[0].childNodes[0].nodeValue.trim();
            var syn = synset.getElementsByTagName("SYNONYM")[0];

            var litteral = syn.getElementsByTagName("LITERAL")
            for (var j = 0; j < litteral.length; j++) {
                var value = litteral[j].childNodes[0].nodeValue.trim();
                obj.synonyms.push(value);


            }
            objs.push(obj);
        }
        // console.log(JSON.stringify(objs,null,2));
        callback(null, objs);

    }


}

var file = "D:\\NLP\\wonef-fscore-0.1.xml";
//var file = "D:\\NLP\\wonef-precision-0.1.xml";
//var file = "D:\\NLP\\test.xml";




WordNetProcessor.parseFile(file, function (err, result) {
    elasticProxy.indexJsonArray("wordnet_score_fr","wordnet",result,function (err, result){
if(err)
    return console.log(err);
        return console.log(result);
    })
})

module.exports = WordNetProcessor;
