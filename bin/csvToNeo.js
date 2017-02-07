/**
 * Created by claud on 05/02/2017.
 */

var fileUpload=require("./fileUpload.js");
var fs=require("fs");
//var exportMongoToNeao=require("./exportMongoToNeo.js");
var csv=require('csvtojson');
var socket = require('../routes/socket.js');

var csvToNeo={

    import:function (req,callback){
        fileUpload.upload(req,'csv', function (err, req) {
            if(err) {
                console.log(err);
                return;
            }
            if(req.file && req.file.buffer ) {

                var data = "" + req.file.buffer;
                var fileName = req.file.originalname;

                var jsonArray = [];
                var header = []
                var i = 0;
                csv({noheader: false, trim: true, delimiter: "auto"})
                    .fromString(data)
                    .on('json', function (json) {
                        if (i == 0) {
                            for (var key in json) {
                                header.push(key);
                            }
                            ;
                            i++;
                        }

                        jsonArray.push(json)
                    })
                    .on('done', function () {
                        var path = "./public/uploads/" + fileName + ".json";
                        fs.writeFileSync(path,JSON.stringify(jsonArray));
                        var result = {message:"listCsvFields",remoteJsonPath: path,name:fileName, header: header};
                       socket.message(JSON.stringify(result));
                     callback(null,null);
                    });
            }

        });
    }




}

module.exports = csvToNeo;




