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

var fileUpload=require("./fileUpload.js");
var fs=require("fs");
//var exportMongoToNeao=require("./exportMongoToNeo.js");
var csv=require('csvtojson');
var socket = require('../routes/socket.js');

var uploadCsvForNeo={

    upload:function (req,callback){
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
                     //   if (i == 0) {
                            for (var key in json) {
                                if(header.indexOf(key)<0)
                                header.push(key);
                            }
                       //     ;
                            i++;


                        jsonArray.push(json);

                    })
                    .on('done', function () {
                        var path = "./uploads/" + fileName + ".json";
                        header= header.sort();
                        fs.writeFileSync(path,JSON.stringify(jsonArray));
                        var result = {message:"listCsvFields",remoteJsonPath: path,name:fileName, header: header};
                       socket.message(JSON.stringify(result));
                     callback(null,result);
                    });
            }

        });
    }




}

module.exports = uploadCsvForNeo;




