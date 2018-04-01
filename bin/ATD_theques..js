var async = require("async");
var elasticProxy = require("./elasticProxy.js")
var mySQLproxy = require("./mySQLproxy..js")


var ATD_theques = {

    indexDescriptions: {
        "phototheque": {
            type: "mySQL",
            schema: "phototheque",
            settings: "ATD",
            connOptions: {host: "localhost", user: "root", password: "vi0lon", database: 'phototheque'},
            sqlQuery: "select * from phototheque",


        },
        "audiotheque": {
            type: "mySQL",
            schema: "default",
            settings: "ATD",
            connOptions: {host: "localhost", user: "root", password: "vi0lon", database: 'audiotheque'},
            sqlQuery: "select * from audiotheque"
        },
        "bordereaux": {
            type: "fs",
            settings: "ATD",
            dir: "H:\\ATD\\Instruments_de_RECHERCHE",
            schema: "officeDocument",
        },
        "ocr": {
            type: "fs",
            settings: "ATD",
            dir: "H:\\ATD\\ATD_QUART_MONDE_Cde2017_2128_Cde01_BP10_PDF",
            schema: "officeDocument",

        }


    },

    indexTheques: function (indexes, remoteUrl) {

        async.eachSeries(indexes, function (index, callbackEachIndex) {
            var schema = elasticProxy.getSchema(index);
          /*  if (remoteUrl)
                elasticProxy.setElasticServerUrl(remoteUrl);*/
            var description = ATD_theques.indexDescriptions[index];


            elasticProxy.initIndex(index, description.settings, function (err, result) {
                    if (err) {
                        console.log(err);
                        return callbackEachIndex(err);
                    }


                    var callbackAfterIndexation = function (err, result) {
                        if (err)
                            console.log(err);
                        console.log("done");
                        callbackEachIndex()
                    }

                    if (description.type == "mySQL") {
                        elasticProxy.indexSqlTable(description.connOptions, description.sqlQuery, index, index, callbackAfterIndexation);
                    }
                    else if (description.type == "mongoDB") {

                    }
                    else if (description.type == "webPage") {

                    }
                    else if (description.type == "fs") {
                        elasticProxy.indexDocDirInNewIndex(index, "officeDocument", description.dir, false, "ATD", callbackAfterIndexation)


                    }





                },
                function (err) {

                }
            )

        })
    }


}

module.exports = ATD_theques


//iptables -D INPUT -p tcp --dport 9200 -j DROP
// iptables -A INPUT -p tcp --dport 9200 -j DROP

ATD_theques.indexTheques(["audiotheque"],"http://92.222.116.179:9200");
//ATD_theques.indexTheques([ "ocr"],"http://92.222.116.179:9200");
//ATD_theques.indexTheques(["phototheque", "audiotheque"], "http://92.222.116.179:9200/");