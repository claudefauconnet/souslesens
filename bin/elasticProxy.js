/**
 * Created by claud on 04/02/2017.
 */
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'localhost:9200',
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
            index: 'twitter',
            type: 'tweets',
            body: {
                query: {
                    match: {
                        body: 'elasticsearch'
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
    bulk:function(index,payload,callback){
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
}



//elasticProy.searchWordAll("obama");


module.exports=elasticProy;