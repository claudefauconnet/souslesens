var express = require('express');
var router = express.Router();



var fs=require('fs');

var neoProxy = require('../bin/neoProxy.js');
var mongoProxy = require('../bin/mongoProxy.js');
var httpProxy = require('../bin/httpProxy.js');
var jsonFileProxy = require('../bin/jsonFileProxy.js');
var exportMongoToNeo= require('../bin/exportMongoToNeo.js');
var exportMongoToNeoBatch= require('../bin/exportMongoToNeoBatch.js');
var fileUpload= require('../bin/fileUpload.js');
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});


router.post('/neo', function (req, res, next) {
    if (req.body && req.body.match)
        neoProxy.match(req.body.match, res);
    if (req.body && req.body.urlSuffix) {
        var payload=JSON.parse(req.body.payload)
        neoProxy.cypher("",req.body.urlSuffix,payload,function(err,result){
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(result));
            res.end();
        })

    }

});

router.post('/mongo', function (req, response, next) {
    if (req.body && req.body.find)
        mongoProxy.find (req.body.dbName, req.body.collectionName, JSON.parse(req.body.mongoQuery), response);
    if (req.body && req.body.insert)
        mongoProxy.insert (req.body.dbName, req.body.collectionName, req.body.data, response);
    if (req.body && req.body.updateOrCreate)
        mongoProxy.updateOrCreate (req.body.dbName, req.body.collectionName, req.body.query, req.body.data, response);
    if (req.body && req.body.delete)
        mongoProxy.delete (req.body.dbName, req.body.collectionName, req.body.query, response);
    if (req.body && req.body.listDatabases)
        mongoProxy.listDatabases ( response);
    if (req.body && req.body.listCollections)
        mongoProxy.listCollections (req.body.dbName, response);
    if (req.body && req.body.listFields)
        mongoProxy.listFields (req.body.dbName, req.body.collectionName,  response);



});

router.post('/exportMongoToNeo', function (req, res, next) {
    if ( req.body.type=="batch")
        exportMongoToNeoBatch.exportBatch(req.body.dbName,req.body.subGraph,JSON.parse(req.body.data), res);
    if ( req.body.type=="node")
        exportMongoToNeo.exportNodes(JSON.parse(req.body.data), res);
    if ( req.body.type=="relation")
        exportMongoToNeo.exportRelations(JSON.parse(req.body.data), res);
    if ( req.body.type=="copyNodes")
        exportMongoToNeo.copyNodes(JSON.parse(req.body.data), res);
    if ( req.body.type=="copyRelations")
         exportMongoToNeo.copyRelations(JSON.parse(req.body.data), res);




});

router.post('/http', function (req, res, next) {
    if (req.body && req.body.get)
        httpProxy.get(req.body.get, res);
});


router.post('/storedParams', function (req, res, next) {
    if (req.body && req.body.load) {
        //  var payload={"load": "displayParams","user":Gparams.user};
        var type=req.body.load;
        var user=req.body.user;
        jsonFileProxy.load(type,user, res);
    }
    if (req.body && req.body.save) {
       // var payload={save:"displayParams",obj:JSON.stringify( obj),"user":Gparams.user}};
        var type=req.body.save;
        var obj = JSON.parse(req.body.obj);
        var user=req.body.user;
        jsonFileProxy.save(type,obj,user, res);
    }
});

router.post('/upload', function(req, res) {
    fileUpload.upload(req, res) ;
});

router.post('/uploadToNeo', function(req, res) {
    if(req.body.serverPath){
       var data= fs.readFileSync(req.body.serverPath);
       if(!data){
           var message="Cannot read file "+serverPath
           res.end(message);
           console.log(message);
           return;
       }
      try {
            data = JSON.parse("" + data);
        }
        catch (e) {
            res.end(e);
            console.log(e);
            return;
        }
        if (!data[0]) {
            var e = "the file does not contain an array of nodes or relations"
            res.end(e);
            console.log(e);
            return;
        }

        if (data[0].r)
            exportMongoToNeo.copyRelations(data, res);
        else
            exportMongoToNeo.copyNodes(data, res);

    }
    else {
        fileUpload.upload(req, null, function (err, data) {
            try {
                data = JSON.parse("" + data);
            }
            catch (e) {
                res.end(e);
                console.log(e);
                return;
            }
            if (!data[0]) {
                var e = "the file does not contain an array of nodes or relations"
                res.end(e);
                console.log(e);
                return;
            }

            if (data[0].r)
                exportMongoToNeo.copyRelations(data, res);
            else
                exportMongoToNeo.copyNodes(data, res);
        });
    }
});




module.exports = router;
