/**
 * Created by claud on 04/02/2017.
 */
var elasticsearch = require('elasticsearch');
var serverParams=require('./serverParams.js');
var mongoProxy=require('./mongoProxy.js');
var fs=require('fs');


var client = new elasticsearch.Client({
    host: serverParams.elasticUrl,
    log: 'trace'
});

var elasticProy= {

    ping: function () {
        client.ping({
            // ping usually has a 3000ms timeout
            requestTimeout: Infinity
        }, function (error) {
            if (error) {
                console.trace('elasticsearch cluster is down!');
            } else {
                console.log('All is well');
            }
        });

    },
    searchWordAll: function (word,callback) {
        client.search({
            q: word
        }).then(function (body) {
            var hits = body.hits.hits;
            callback(null,hits);
        }, function (error) {
           callback(error);
        });
    }

    , search: function (index, type, query,callback) {

        client.search({
            index: index,
            type: type,
            body: {
                query: {
                    match: {
                        body: query
                    }
                }
            }
        }).then(function (resp) {
            var hits = resp.hits.hits;
            callback(null,hits);
        }, function (err) {
            callback(err);
        });
    },
    index:function(index,type,id,payload,callback){
        client.index({
            index: index,
            type: type,
            id: id,
            body:payload
        }, function (err, response) {
            if (err) {
                callback(err);
                return;

            } else {
                callback(null, response);
            }
        });
    },
    /* body: [
     // action description
     { index:  { _index: 'myindex', _type: 'mytype', _id: 1 } },
     // the document to index
     { title: 'foo' },
     // action description
     { update: { _index: 'myindex', _type: 'mytype', _id: 2 } },
     // the document to update
     { doc: { title: 'foo' } },
     // action description
     { delete: { _index: 'myindex', _type: 'mytype', _id: 3 } },
     // no document needed for this delete
     ]*/
    bulk:function(payload,callback){
        client.bulk({
            body:payload
        }, function (err, resp) {
            if (err) {
                callback(err);

            } else {
                callback(null, resp);
            }
        });
    },
    importMongoToNeo:function (mongoDB,mongoCollection,mongoQuery,elasticIndex,elasticFields,elasticType,callback){
        mongoQuery=JSON.parse(mongoQuery);
        elasticFields=JSON.parse(elasticFields);
        mongoProxy.pagedFind(serverParams.mongoFetchSize,mongoDB,mongoCollection,mongoQuery, function(err,result){
            if(err){
                callback(err);
                return;
            }
            var startId=Math.round(Math.random()*10000000);
            var elasticPayload=[];

            for(var i=0;i<result.length;i++){
                elasticPayload.push( { index:  { _index: elasticIndex, _type: elasticType, _id: "_"+(startId++) } })
                var payload={};
                for(var j=0;j<elasticFields.length;j++){
                    var value=result[i][elasticFields[j]];
                    if(value){
                        payload[elasticFields[j]]=value;
                    }

                }
                    elasticPayload.push(payload);

            }
            client.bulk({
                body:elasticPayload
            }, function (err, resp) {
                if (err) {
                    callback(err);

                } else {
                    callback(null, resp);
                }
            });


        });
    }
}

function indexJsonFile(filePath,ealasticUrl){
    var payload=fs.readFileSync(filePath);
    payload=""+payload,
    client.bulk({
        body:payload
    }, function (err, resp) {
        if (err) {
            callback(err);

        } else {
            callback(null, resp);
        }
    });

}

//elasticProy.searchWordAll("obama");


module.exports=elasticProy;