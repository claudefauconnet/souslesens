/**
 * Created by claud on 31/12/2016.
 */
var http = require('http');
var querystring = require('querystring');
//var multipart = require('multipart');
var sys = require('util');

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
    post:function(url,path,payload,callback){
        var postData = querystring.stringify(payload);

        var options = {
            hostname: url,
            port: 80,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

         http.request(options, function(res){
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

}


module.exports = httpProxy;
//httpProxy.post(urlTest);
