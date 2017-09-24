/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/
var elasticsearch = require('elasticsearch');
var serverParams=require('./serverParams.js');
var mongoProxy=require('./mongoProxy.js');
var fs=require('fs');


var client = null;
var elasticProy= {
    
    
    

    ping: function () {
        getClient().ping({
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
        getClient().search({
            q: word
        }).then(function (body) {
            var hits = body.hits.hits;
            callback(null,hits);
        }, function (error) {
           callback(error);
        });
    }

    , search: function (index, type, query,callback) {

        getClient().search({
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
        getClient().index({
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
        getClient().bulk({
            body:payload
        }, function (err, resp) {
            if (err) {
                callback(err);

            } else {
                callback(null, resp);
            }
        });
    },
    exportMongoToElastic:function (mongoDB,mongoCollection,mongoQuery,elasticIndex,elasticFields,elasticType,callback){
        mongoQuery=JSON.parse(mongoQuery);
        elasticFields=JSON.parse(elasticFields);
        mongoProxy.pagedFind(serverParams.mongoFetchSize,mongoDB,mongoCollection,mongoQuery,null, function(err,result){
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
            getClient().bulk({
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


function getClient(){

    if(client)
        return client;
    return new elasticsearch.Client({
     host: serverParams.elasticUrl,
     log: 'trace'
     });
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