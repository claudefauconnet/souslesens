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
var http = require('http');
var querystring = require('querystring');
//var multipart = require('multipart');
var sys = require('util');
var request = require("request");
var urlTest = "http://data.bnf.fr/sparql?default-graph-uri=&query=PREFIX%20bnf-onto%3A%20%20%20%3Chttp%3A%2F%2Fdata.bnf.fr%2Fontology%2Fbnf-onto%2F%3E%20select%20*%20where%20%7B%20%3Fx%20dcterms%3Atitle%20%3Ftitle.%20%3Ftitle%20bif%3Acontains%20'Rome'%20%7D%20limit%20100&format=json&timeout=30000";


var httpProxy = {
    /**
     * @param url
     * @param httpresponse
     */
    get: function (url, callback) {
        http.get(url, function (res) {
            const statusCode = res.statusCode;
            const contentType = res.headers['content-type'];

            var error;
            if (statusCode !== 200) {
                error = new Error("Request Failed.\n" +
                    "Status Code:" + statusCode);
            } else if (!/^application\/.*json/.test(contentType)) {
                error = new Error("Invalid content-type.\n" +
                    "Expected application/json but received" + contentType);
            }
            if (error) {
                console.log(error.message);
                // consume response data to free up memory
                res.resume();
                return;
            }

            res.setEncoding('utf8');

            var rawData = '';
            res.on('data', function (chunk) {
                rawData += chunk
            });
            res.on('end', function () {
                try {
                    callback(null,rawData);

                } catch (err) {
                    callback(err);
                }
            });
        })

    }
    ,
    post:function(uri,port,path,payload,callback) {


        var uri = uri + path;

        if (typeof payload === 'string')
            payload = JSON.parse(payload);
        request({
                url: uri,
                json: payload,
                method: 'POST',
                headers: {'Content-Type': 'application/json',}
            },
            function (err, res) {

                if (err)
                    callback(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    console.log(JSON.stringify(res.body.errors))
                    callback(res.body.errors)
                }
                else
                    callback(null, res.body)
            });
    }





}


module.exports = httpProxy;
//httpProxy.post(urlTest);
