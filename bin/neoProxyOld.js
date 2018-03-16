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
var neo4j = require('neo4j');
var request = require("request");
var serverParams = require("./serverParams.js");


neo4jProxy = {

    match: function (matchStr, callback) {
        var neo4jUrl = serverParams.neo4jUrl;
        var db = new neo4j.GraphDatabase(neo4jUrl);
        var obj = {
            query: matchStr
        };
        try {
            db.cypher(obj, function (err, results) {
                if (err)
                    callback(err);
                else
                    callback(null, results)
            });
        }catch(e){
            console.log(e);
        }
    }

    , cypher: function (url, path, payload, callback) {

        var neo4jUrl = serverParams.neo4jUrl;
        var uri = neo4jUrl + path;

       if( typeof payload ==='string')
            payload=JSON.parse(payload);
        request({
                url: uri,
                json: payload,
                method: 'POST',
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

module.exports = neo4jProxy;

