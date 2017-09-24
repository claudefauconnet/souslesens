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

var fs = require('fs');
var multer = require('multer');
var serverParams = require('./serverParams.js')
var path= require('path');

var diskStorage = multer.diskStorage({
    destination: function (request, file, callback) {
        callback(null, '/uploads');
    },
    filename: function (request, file, callback) {
        console.log(file);
        callback(null, file.originalname)
    }
});
var memStorage = multer.memoryStorage()

//var upload = multer({storage: storage}).single('photo');


var fileUpload = {
    upload: function (req, fieldName, callback) {
        var storage = diskStorage;
        if (callback)
            storage = memStorage;
        var upload = multer({
            storage: storage,
            limits: {fileSize: serverParams.uploadMaxSize}
        }).single(fieldName);
        upload(req, null, function (err, data) {
            if (err) {
                callback('Error Occured' + err);
                return;
            }
            callback(null, req)

        })

    }
    ,
    uploadData: function (req,callback) {

        var storage = memStorage;
        var upload = multer({
            storage: storage,
            limits: {fileSize: serverParams.uploadMaxSize}
        }).single("xml");
        upload(req, null, function (err, data) {
            if (err) {
                if (callback)
                    callback('Error Occured' + err);
                return;
            }
            if (req.body.callback) {// "module.function" string to be called as callback

                var data = "" + req.file.buffer;
                var p = req.body.callback.indexOf(".");
                if (p > -1) {
                    var moduleName = req.body.callback.substring(0, p);
                    var functionName = req.body.callback.substring(p + 1);
                  //  var module = require('./transform/'+moduleName+'.js');
                    var pathStr=path.normalize('./transform/'+moduleName+'.js')
                    var pathStr='./transform/'+moduleName+'.js'
                    console.log(pathStr)
                    var module = require(pathStr);
                    if (callback)
                        module[functionName](data, callback);
                    else
                        module[functionName](data, null);

                }

            }


        })

    }

}


module.exports = fileUpload;