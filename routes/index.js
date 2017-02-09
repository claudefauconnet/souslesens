var express = require('express');
var router = express.Router();




var neoProxy = require('../bin/neoProxy.js');
var mongoProxy = require('../bin/mongoProxy.js');
var elasticProxy = require('../bin/elasticProxy.js');
var httpProxy = require('../bin/httpProxy.js');
var fileUpload= require('../bin/fileUpload.js');
var jsonFileStorage=require('../bin/jsonFileStorage.js');
var exportMongoToNeo= require('../bin/exportMongoToNeo.js');
var exportToNeoBatch= require('../bin/exportToNeoBatch.js');
var uploadToNeo= require('../bin/uploadToNeo.js');
var uploadCsvForNeo= require('../bin/uploadCsvForNeo.js');
var socket=require('./socket.js');








router.get('/', function (req, res) {
    res.render('index', {title: 'Express'});
});


router.post('/neo', function (req, response) {
    if (req.body && req.body.match)
        neoProxy.match(req.body.match, function(error,result){processResponse(response,error,result)});
    if (req.body && req.body.urlSuffix) {
        var payload=JSON.parse(req.body.payload)
        neoProxy.cypher("",req.body.urlSuffix,payload,function(error,result){processResponse(response,error,result)});
    }

});

router.post('/mongo', function (req, response) {
    if (req.body && req.body.find)
        mongoProxy.find (req.body.dbName, req.body.collectionName, JSON.parse(req.body.mongoQuery), function(error,result){processResponse(response,error,result)});
    if (req.body && req.body.insert)
        mongoProxy.insert (req.body.dbName, req.body.collectionName, req.body.data, function(error,result){processResponse(response,error,result)});
    if (req.body && req.body.updateOrCreate)
        mongoProxy.updateOrCreate (req.body.dbName, req.body.collectionName, req.body.query, req.body.data, function(error,result){processResponse(response,error,result)});
    if (req.body && req.body.delete)
        mongoProxy.delete (req.body.dbName, req.body.collectionName, req.body.query, function(error,result){processResponse(response,error,result)});
    if (req.body && req.body.listDatabases)
        mongoProxy.listDatabases ( function(error,result){processResponse(response,error,result)});
    if (req.body && req.body.listCollections)
        mongoProxy.listCollections (req.body.dbName, function(error,result){processResponse(response,error,result)});
    if (req.body && req.body.listFields)
        mongoProxy.listFields (req.body.dbName, req.body.collectionName,  function(error,result){processResponse(response,error,result)});



});
router.post('/elastic', function (req, response) {
    if (req.body && req.body.searchWordAll)
        elasticProxy.searchWordAll(req.body.searchWordAll,function(error,result){processResponse(response,error,result)});
    else if (req.body && req.body.searchDo)
        elasticProxy.search (req.body.indexName, req.body.type,req.body.payload,function(error,result){processResponse(response,error,result)});
    else if (req.body && req.body.indexDo)
        elasticProxy.index (req.body.indexName, req.body.type,req.body.payload,function(error,result){processResponse(response,error,result)});

});


router.post('/exportMongoToNeo', function (req, response) {
    if ( req.body.type=="batch")
        exportToNeoBatch.exportBatch(req.body.dbName,req.body.subGraph,JSON.parse(req.body.data), function(error,result){processResponse(response,error,result)});
    if ( req.body.type=="node")
        exportMongoToNeo.exportNodes(JSON.parse(req.body.data), function(error,result){processResponse(response,error,result)});
    if ( req.body.type=="relation")
        exportMongoToNeo.exportRelations(JSON.parse(req.body.data), function(error,result){processResponse(response,error,result)});
    if ( req.body.type=="copyNodes")
        exportMongoToNeo.copyNodes(JSON.parse(req.body.data), function(error,result){processResponse(response,error,result)});
    if ( req.body.type=="copyRelations")
         exportMongoToNeo.copyRelations(JSON.parse(req.body.data), function(error,result){processResponse(response,error,result)});




});

router.post('/http', function (req, response) {
    if (req.body && req.body.get)
        httpProxy.get(req.body.get,  function(error,result){processResponse(response,error,result)});
});


router.post('/storedParams', function (req, response) {
    if (req.body && req.body.load) {
        //  var payload={"load": "displayParams","user":Gparams.user};
        var type=req.body.load;
        var user=req.body.user;
        jsonFileProxy.load(type,user, function(error,result){processResponse(response,error,result)});
    }
    if (req.body && req.body.save) {
       // var payload={save:"displayParams",obj:JSON.stringify( obj),"user":Gparams.user}};
        var type=req.body.save;
        var obj = JSON.parse(req.body.obj);
        var user=req.body.user;
        jsonFileProxy.save(type,obj,user, function(error,result){processResponse(response,error,result)});
    }
});

router.post('/upload', function(req, response) {
    fileUpload.upload(req, function(error,result){processResponse(response,error,result)});
});

router.post('/uploadToNeo', function(req, response) {
    uploadToNeo.uploadAndImport(req,function(error,result){processResponse(response,error,result)});
});


router.post('/uploadCsvForNeo', function(req, response) {
    uploadCsvForNeo.upload(req,function(error,result){processResponse(response,error,result)});
});

router.post('/exportMongoToElastic', function(req, response) {
   elasticProxy.exportMongoToElastic( req.body.mongoDB,req.body.mongoCollection,req.body.mongoQuery,req.body.elasticIndex,req.body.elasticFields,req.body.elasticType,function(error,result){processResponse(response,error,result)});
});


router.post('/jsonFileStorage', function(req, response) {
    if(req.body.store)
        jsonFileStorage.store( req.body.path,req.body.data,function(error,result){processResponse(response,error,result)});
    if(req.body.retreive)
        jsonFileStorage.retreive( req.body.path,function(error,result){processResponse(response,error,result)});
});



function processResponse(response,error,result){
    if (response && !response.finished) {
        response.setHeader('Content-Type', 'application/json');
        if(error) {
            console.log("ERROR !!"+error);
            socket.message("ERROR !!"+error);
          //  response.send({ERROR: error});

        }
        else if(!result) {
            ;
        } else{
                var resultObj=result;
                if( typeof result =="string"){
                    resultObj={result:result}
                }
                socket.message(resultObj);
                response.send(JSON.stringify(resultObj));
            }


        response.end();

    }

}



module.exports = router;
