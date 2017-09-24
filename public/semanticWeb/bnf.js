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
bnf = (function () {
    var self = {};
    var cacheKeywords = {};
    var cacheDoc = {};
    var cache = {};
    var keys = ["title", "auteur"];


    self.addFilter = function () {
        var str = $("#filter").val();
        $("#filters").append(new Option(str));
    }

    self.removeFilter = function () {
        $("#filters option:selected").remove();
    }
    self.query = function () {
        var filters = [];
        $("#filters option").each(function () {
            filters.push($(this).val());
        });
        var type = $("#type").val();
        var limit = $("#limit").val();
        var nSubjects = $("#nSubjects").val();

        executeSparql(filters, type, nSubjects, limit, function (err, result) {
                if (err) {
                    console.log(err);
                    //   console.log(msg);
                }
                else {
                    cache = {};


                    for (var k = 0; k < nSubjects; k++) {
                        keys.push("theme" + k)
                    }

                }
                for (var i = 0; i < result.length; i++) {


                    for (var j = 0; j < keys.length; j++) {
                        var key = keys[j]
                        var obj2 = result[i][key];
                        var value = "";
                        if (obj2)
                            var value = obj2.value;
                        if (value == "")
                            continue;
                        else {

                            if (key.indexOf("theme") > -1)
                                key = "theme";


                            if (!cache[key])
                                cache[key] = [];
                            if (cache[key].indexOf(value) < 0) {


                                cache[key].push(value);
                            }

                        }

                        for (var key in cache) {
                            fillSelectOptionsWithStringArray(eval(key), cache[key]);
                        }
                    }

                }

            }
        )
        ;


    }
    self.queryOld = function () {
        var keyword = $("#filter").val()

        executeSparql(keyword, function (err, result) {
            if (err) {
                console.log(err);
                //   console.log(msg);
            }
            else {
                var array = [];
                var arrayDocs = [];
                var str = "<table border='1'>";
                for (var i = 0; i < result.length; i++) {
                    str += "<tr>";
                    var obj = {keyword: keyword};
                    var frfn = result[i].FRFN.value;

                    var str2 = keyword;
                    if (cacheDoc[frfn])
                        str2 += JSON.stringify(cacheDoc[frfn]);

                    str += "<td>";
                    str += str2;

                    str += "</td>";
                    for (var j = 0; j < keys.length; j++) {
                        var obj2 = result[i][keys[j]];
                        var value = "";
                        if (obj2)
                            var value = obj2.value;

                        str += "<td>";
                        str += value;
                        str += "</td>";
                        obj[keys[j]] = value;
                    }

                    str += "</tr>";
                    array.push(obj);
                    if (!cacheDoc[frfn])
                        cacheDoc[frfn] = [];
                    cacheDoc[frfn].push(keyword);
                    arrayDocs.push(obj);
                }
                str += "</table>";
                $("#resultDiv").html(str);
                cacheKeywords[keyword] = array;


            }

        });


    }


    function executeSparql(filters, type, nSubjects, limit, callback) {
        var sujetsStr


        var query2 = "&format=json&timeout=30000";
        var query = "PREFIX dcterms: <http://purl.org/dc/terms/>PREFIX bnf-onto: <http://data.bnf.fr/ontology/bnf-onto/>" +
            "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "PREFIX marcrel: <http://id.loc.gov/vocabulary/relators/>" +
            // "select ?title ?theme ?auteur   where {" +
            "select *  where {" +
            " ?x dcterms:title  ?label." +
            "  ?x  bnf-onto:FRBNF ?FRFN." +
            " ?x  dcterms:title ?title." +
            " ?x  dcterms:subject ?sujet0." +
            " ?sujet0 skos:prefLabel ?theme0." +
            " ?sujet0  dcterms:isPartOf <http://data.bnf.fr/vocabulary/scheme/r" + type + ">.";

        for (var i = 1; i < nSubjects; i++) {
            query += " optional{ ?x  dcterms:subject ?sujet" + i + ". ?sujet" + i + " skos:prefLabel ?theme" + i + ".}\n";
        }
        strFilter = "";
        for (var i = 0; i < filters.length; i++) {
            var strFilter = "regex(str(?theme" + i + "), \"" + filters[i] + "\" )\n";
        }
        query += " FILTER (" + strFilter + " ) .} limit " + limit + "";


        var url = "http://data.bnf.fr/sparql?default-graph-uri=&query="
            + encodeURIComponent(query) + query2;

        var payload = {get: url}

        console.log(query);


        $.ajax({
            type: "POST",
            url: "../http",
            data: payload,
            dataType: "json",
            success: function (_data, textStatus, jqXHR) {

                //  console.log(JSON.stringify(_data));
                var xx = _data.result;
                xx = JSON.parse(xx);
                xx = xx.results;
                var objs = xx.bindings;
                callback(null, objs);


            },
            error: function (xhr, err, msg) {
                callback(err);

            }
        });

    }

    function executeSparqlOld(subject, callback) {

        var query2 = "&format=json&timeout=30000";
        var query = "PREFIX dcterms: <http://purl.org/dc/terms/>PREFIX bnf-onto: <http://data.bnf.fr/ontology/bnf-onto/>" +
            "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>" +
            "PREFIX marcrel: <http://id.loc.gov/vocabulary/relators/>" +
            "select *  where {" +
            " ?x dcterms:title  ?label." +
            "  ?x  bnf-onto:FRBNF ?FRFN." +
            " ?x  dcterms:title ?title." +
            " ?x  dcterms:subject ?sujet." +
            " ?sujet  dcterms:isPartOf <http://data.bnf.fr/vocabulary/scheme/r166>." +
            "  ?sujet skos:prefLabel ?theme." +
            " FILTER (regex(str(?theme), \"" + subject + "\")) ." +
            " } limit 100";

        var url = "http://data.bnf.fr/sparql?default-graph-uri=&query="
            + encodeURIComponent(query) + query2;

        var payload = {get: url}

        console.log(query);


        $.ajax({
            type: "POST",
            url: "../http",
            data: payload,
            dataType: "json",
            success: function (_data, textStatus, jqXHR) {

                console.log(JSON.stringify(_data));
                var xx = _data.result;
                xx = JSON.parse(xx);
                xx = xx.results;
                var objs = xx.bindings;
                callback(null, objs);


            },
            error: function (xhr, err, msg) {
                callback(err);

            }
        });

    }


    return self;
})
()