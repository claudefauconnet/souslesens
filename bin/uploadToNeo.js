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
var exportMongoToNeo = require('../bin/exportMongoToNeo.js');
var fileUpload= require('../bin/fileUpload.js');

var uploadToNeo = {

    uploadAndImport: function (req, callback) {
        if (req.body.serverPath) {
            var data = fs.readFileSync(req.body.serverPath);
            if (!data) {
                var message = "Cannot read file " + serverPath;
                callback(message);
                return;
            }
            try {
                data = JSON.parse("" + data);
            }
            catch (e) {
                callback(e);
                return;
            }
            if (!data[0]) {
                var e = "the file does not contain an array of nodes or relations"
                callback(e);
                return;
            }

            if (data[0].r)
                exportMongoToNeo.copyRelations(data, callback);
            else
                exportMongoToNeo.copyNodes(data, callback);

        }
        else {
            fileUpload.upload(req,'cypher', function (err, req) {
                var data=req.file.buffer;
                var fileName=req.file.fileName;
                try {
                    data = JSON.parse("" + data);
                }
                catch (e) {
                    callback(e);
                    return;
                }
                if (!data[0]) {
                    var e = "the file does not contain an array of nodes or relations"
                    callback(e);
                    return;
                }

                if (data[0].r)
                    exportMongoToNeo.copyRelations(data, callback);
                else
                    exportMongoToNeo.copyNodes(data, callback);
            });
        }


    }


}


module.exports = uploadToNeo;