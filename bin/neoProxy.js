// neoProxy.js
// ========


var neo4j = require('neo4j');
//var neo4jT = require('neo4j-driver');
var request = require("request");
var serverParams = require("./serverParams.js");


neo4jProxy = {

    match: function (matchStr, response) {
        var neo4jUrl = serverParams.neo4jUrl;
        var db = new neo4j.GraphDatabase(neo4jUrl);
        var obj = {
            query: matchStr
        };
        db.cypher(obj, function (err, results) {

            if (err) {
                response.send(err);
            }
            else {

                response.setHeader('Content-Type', 'application/json');
                response.send(JSON.stringify(results));
                response.end();

            }
        });
    }

    , cypher: function (url, path, payload, callback) {

    var neo4jUrl = serverParams.neo4jUrl;
    var uri = neo4jUrl + path;

    request({
            url: uri, //URL to hit
            json:payload, //Query string data
            method: 'POST',

        },
        function (err, res) {

            if (err) {
                console.log(err);

                callback(err)
            }

            if (res.body && res.body.errors && res.body.errors.length > 0) {
                callback(res.body.errors)

            }
            else
                callback(null,res.body)
        });


}

/* post: function (urlSuffix, payload, response, callback) {
     if (urlSuffix.indexOf("/") != 0)
         urlSuffix = "/" + urlSuffix;
     neo4jUrl += urlSuffix;

     // console.log(JSON.stringify(payload))


     var driver = neo4jT.v1.driver("bolt://localhost:7687", neo4jT.v1.auth.basic("neo4j", "souslesens"));

     var session = driver.session();

// Run a Cypher statement, reading the result in a streaming manner as records arrive:
     session.run("MATCH (alice {name : {nameParam} }) RETURN alice.age", {nameParam: 'Alice'})
         .subscribe({
             onNext: function (record) {
                 console.log(record);
             },
             onCompleted: function () {
                 // Completed!
                 session.close();
             },
             onError: function (error) {
                 console.log(error);
             }
         });


 }*/



    /* post2: function (urlSuffix, payload, response, callback) {
     if (urlSuffix.indexOf("/") != 0)
     urlSuffix = "/" + urlSuffix;
     neo4jUrl += urlSuffix
     var db2 = new neo4j.GraphDatabase(neo4jUrl);
     //  if (payload instanceof String)
     // payload = JSON.parse(payload);
     console.log(JSON.stringify(payload))
     db2.cypher(payload, function (err, results) {

     if (err) {
     response.send(err);
     }
     else {

     if (response) {
     response.setHeader('Content-Type', 'application/json');
     response.send(JSON.stringify(results));
     response.end();
     }
     if (callback) {
     callback(results)
     }
     //return " fvdfgdfgdfgdg"+results;
     }
     });
     }*/

}
//neo4jProxy.post("eee",{})

//neo4jProxy.neo4jMatch("Match (n) return n limit 25");
module.exports = neo4jProxy;

