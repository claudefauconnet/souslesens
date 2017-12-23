var elasticProxy = require("../elasticProxy.js")

var elasticArchives = {


    "mappings": {
        "archive": {
            "properties": {
                "anneeDebut": {"type": "integer"},
                "anneeFin": {"type": "integer"},
                "auteur": {"type": "text"},
                "coteBoite": {"type": "keyword"},
                "coteSerie": {"type": "keyword"},
                "commentaire": {"type": "text"},
                "confidentiel": {"type": "keyword"},
                "dateStr": {"type": "text"},
                "destinataire": {"type": "text"},
                "format": {"type": "text"},
                "genre": {"type": "keyword"},
                "lieu": {"type": "text"},
                "nbFeuilles": {"type": "integer"},
                "source": {"type": "text"},
                "coteSousSerie": {"type": "keyword"},
                "title": {"type": "text"},
                "content": {
                    "type": "text",
                    "index_options": "offsets",
                    "fielddata": true,

                    "fields": {
                        "contentKeyWords": {
                            "type": "keyword",
                            "ignore_above": 256
                        }
                    }
                }
            }
        }

    },

    index: function () {
        var mongoDB = "ATD";
        var mongoCollection = "archives";
        var mongoQuery = {};
        var elasticIndex = "archivesatd";
        var elasticFields = [];
        var elasticType = "archive";


        for (var key in elasticArchives.mappings.archive.properties) {
            elasticFields.push(key);
        }


        elasticProxy.exportMongoToElastic(mongoDB, mongoCollection, mongoQuery, elasticIndex, elasticFields, elasticType, function (err, result) {
            if (err) {
                return console.log(err)

            }
            console.log("Done " + result.length())

        });


    }
}


elasticArchives.index();

module.exports = elasticArchives