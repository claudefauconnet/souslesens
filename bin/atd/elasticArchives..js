var elasticProxy=require("../elasticProxy.js")

var elasticArchives= {

    createIndex: function () {
        var mongoDB = "ATD";
        var mongoCollection = "archives";
        var mongoQuery = {};
        var elasticIndex = "archivesatd";
        var elasticFields = ["annee", "boite", "chemise", "souschemise", "source", "titre","content"];
        var elasticType = "archive";


        elasticProxy.exportMongoToElastic(mongoDB, mongoCollection, mongoQuery, elasticIndex, elasticFields, elasticType, function (err, result) {
           if(err){
              return console.log(err)

           }
           console.log("Done "+result.length())

        });


    }
}


elasticArchives.createIndex();

module.exports=elasticArchives