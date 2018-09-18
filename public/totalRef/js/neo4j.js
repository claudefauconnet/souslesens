var neo4jProxy = (function () {
    var self = {};
    self.neo4jProxyUrl = "../../neo"


    self.queryQuestionWordsRanked = function () {
        var allResponses = [];

        async.eachSeries(nlp.currentQuestionWordsAssociations, function (words, callbackWords) {

            if (words.length > 1) {

                var score = 0;
                words.forEach(function (word) {
                    score += nlp.getWordInThesaurus(word).length
                })

                score+=words.length
                console.log(score+ "  "+words.toString());
                self.queryQuestionWordsSimple(words, function (err, responses) {
                    allResponses.push({score: score, responses: responses, words: words})
                    return callbackWords();
                })

            }
            else{
                return callbackWords();
            }

        }, function (err) {
            allResponses.sort(function (a, b) {
                if (a.score > b.score)
                    return -1;
                if (a.score < b.score)
                    return 1;
                return 0;

            })


            var str = "<ul>";

            allResponses.forEach(function (line) {
                if (true || line.responses.length > 0){
                    str += "<li>"
                str += "<div style='color:blue;font-weight:bold' > words found : " + line.words.toString() + " score : " + line.score + "</div>"
                str += "<ul>";
                line.responses.forEach(function (response) {
                    var fragment = response.f.properties;
                    var paragraph = response.p.properties;
                    var file = response.F.properties;

                    str += "<li>"

                    str += "<B>" + file.name + "  " + file.title + "  <i>" + paragraph.name + "</i></B><br>"
                    str += fragment.text
                    str += "<li>"
                })
                str += "</ul>"
                str += "</li>"
            }
            })
           str += "<ul>";
            $("#neo4jResponseDiv").html(str);
        })


    }


    //$match(n:noun)-[r]-(f)-[r2]-(m:noun) where n.name="anti-surge" and m.name="response" WITH f match (f)-[r3]-(m2) where m2.name="time" return f
    self.queryQuestionWordsSimple = function (words, callback) {
        var match = "";

        words.forEach(function (word, index) {


            if (index == 0) {
                match = " match(n:noun)-[r]-(f:fragment) where n.name=\"" + word + "\" "

            }
            else {
                match += " WITH f match (f)-[r3]-(m:noun) where m.name=\"" + word + "\""


            }


        })
        match += " with f match (f)-[r]-(p:paragraph)-[r2]-(F:file)  return distinct f,p,F"
        console.log(match);
        var payload = {match: match};


        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {


                return callback(null, data);


            }
            , error: function (err) {

                console.log("done")
                //    console.log(err.responseText)
                return callback(err);


            }

        });


    }


    self.getThesaurusNouns=function(){

        var match = " match (n:noun) return ID(n) as id, n.name as name limit 100"
        console.log(match);
        var payload = {match: match};


        $.ajax({
            type: "POST",
            url: self.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {

                data.forEach(function(line){

                    var word=line.name;
                    var id=line.id;

                    var concepts=nlp.getWordInThesaurus(word);

                    console.log(word +" / "+JSON.stringify(concepts))

                })


            }
            , error: function (err) {

                console.log("done")
                //    console.log(err.responseText)
                return callback(err);


            }

        });






    }


    self.exportToNeo4j = function (docs, callback) {
        var statements = [];
        var names = [];

        var files = {};
        //split data for each file in paragraph and text fragment
        docs.forEach(function (line) {
            if (!files[line.doc.File]) {
                files[line.doc.File] = {title: line.doc.TitleDoc, purpose: line.doc.PurposeDoc, paragraphs: {}};
            }
            var paragraph = line.doc.Title;
            if (!files[line.doc.File].paragraphs[paragraph]) {
                files[line.doc.File].paragraphs[paragraph] = []
            }
            files[line.doc.File].paragraphs[paragraph].push({
                text: line.doc.Texte,
                id: line.doc.id,
                tokens: line.tokens
            })

        })


        for (var key in files) {
            var file = files[key];
            statements.push({statement: "MERGE  (n:file { name: \"" + key + "\",title:\"" + file.title + "\",purpose:\"" + file.PurposeDoc + "\",subGraph:\"totalRef\"})"});

            for (var key2 in file.paragraphs) {
                var paragraph = file.paragraphs[key2];
                statements.push({statement: "MERGE  (n:paragraph { name: \"" + key2 + "\",subGraph:\"totalRef\"})"});
                statements.push({statement: "match (n:file { name: \"" + key + "\"}),  (m:paragraph { name: \"" + key2 + "\"}) create (n)-[:hasParagraph]->(m)"});
                paragraph.forEach(function (fragment) {
                    statements.push({statement: "MERGE  (n:fragment { name: \"" + fragment.id + "\",text:\"" + fragment.text + "\",subGraph:\"totalRef\"})"});
                    statements.push({statement: "match (n:paragraph { name: \"" + key2 + "\"}), (m:fragment { name: \"" + fragment.id + "\"}) create (n)-[:hasText]->(m)"});

                    var tokens = fragment.tokens.tokens;

                    tokens.nouns.forEach(function (noun) {
                        statements.push({statement: "MERGE  (n:noun { name: \"" + noun.word.toLowerCase() + "\",subGraph:\"totalRef\"})"});
                        statements.push({statement: "match (n:fragment { name: \"" + fragment.id + "\"}), (m:noun{ name: \"" + noun.word.toLowerCase() + "\"}) create (n)-[:hasNoun]->(m)"});

                    })

                    tokens.numValues.forEach(function (numValue) {
                        statements.push({statement: "MERGE  (n:numValue { name: \"" + numValue.word + "\",subGraph:\"totalRef\"})"});
                        statements.push({statement: "match (n:fragment { name: \"" + fragment.id + "\"}), (m:numValue { name: \"" + numValue.word + "\"}) create (n)-[:hasNumValue]->(m)"});

                    })

                })
            }


        }


        console.log(statements.length)
        var str = JSON.stringify(statements, null, 2)
        //  console.log(str);
        $("#coreNlpResultDiv").html(str.replace(/\n/g, "<br>"))
        var path = "/db/data/transaction/commit";

        var payload = {
            post: 1,
            body: {statements: statements},
            path: path,
            url: 'http://neo4j:souslesens@127.0.0.1:7474',


        }

        $.ajax({
            type: "POST",
            url: self.httpParams.url,
            data: payload,
            dataType: "application/json",
            //async: false,
            success: function (data, textStatus, jqXHR) {
                return callback(null, data.length)

            }
            , error: function (err) {
                //     console.log(err.responseText)
                return callback(err);


            }

        });
    }

    self.exportToNeo4WithSentences = function (deleteGraph, callback) {
        var names = [];

        if (!coreNlp.currentRelations && !coreNlp.openieTriples && !coreNlp.currentTokens)
            return;


        var statements = [];
        var sourceNodeName = $("#sourceSearchExpression").val();
        if (deleteGraph)
            statements.push({statement: "match(n)where n.subGraph=\"totalRef\" detach delete n"});


        if (coreNlp.openieTriples) {

            for (var i = 0; i < coreNlp.openieTriples.length; i++) {
                var tripleObj = coreNlp.openieTriples[i];
                if (i == 0) {
                    statements.push({statement: "MERGE (n:conceptSource { name: \"" + tripleObj.concept + "\",subGraph:\"totalRef\"})"});
                    statements.push({statement: "MERGE (n:docFragment { name: \"" + tripleObj.id + "\",subGraph:\"totalRef\"})"});
                    statements.push({statement: "match (n:conceptSource { name: \"" + tripleObj.concept + "\"}), (m:docFragment{ name: \"" + tripleObj.id + "\"}) create (n)-[:inDocFragment]->(m)"});
                }


                for (var j = 0; j < tripleObj.triples.length; j++) {
                    var triple = tripleObj.triples[j];
                    var relation = triple.relation.replace(/ /g, "_");
                    relation = relation.replace(/[^A-Za-z0-9]/g, "_");
                    //    console.log(relation)
                    var objectType = "object_" + triple.object.type;
                    statements.push({statement: "MERGE  (n:subject { name: \"" + triple.subject + "\",subGraph:\"totalRef\"})"});
                    statements.push({statement: "MERGE  (n:" + objectType + " { name: \"" + triple.object.name + "\",subGraph:\"totalRef\"})"});
                    statements.push({statement: "match (n:subject { name: \"" + triple.subject + "\"}), (m:" + objectType + "{ name: \"" + triple.object.name + "\"}) create (n)-[:" + relation + "]->(m)"});

                    statements.push({statement: "match (n:docFragment { name: \"" + tripleObj.id + "\"}), (m:subject{ name: \"" + triple.subject + "\"}) create (n)-[:hasSubject]->(m)"});

                }
            }


        }
        if (coreNlp.currentTokens) {

            for (var i = 0; i < coreNlp.currentTokens.length; i++) {
                var tokenObj = coreNlp.currentTokens[i];
                if (true || i == 0) {
                    statements.push({statement: "MERGE (n:conceptSource { name: \"" + tokenObj.concept + "\",subGraph:\"totalRef\"})"});
                    statements.push({statement: "MERGE (n:docFragment { name: \"" + tokenObj.id + "\",subGraph:\"totalRef\"})"});
                    statements.push({statement: "match (n:conceptSource { name: \"" + tokenObj.concept + "\"}), (m:docFragment{ name: \"" + tokenObj.id + "\"}) create (n)-[:inDocFragment]->(m)"});
                }
                if (tokenObj.tokens.sentences) {
                    for (var j = 0; j < tokenObj.tokens.sentences.length; j++) {
                        var sentence = tokenObj.tokens.sentences[j];
                        var sentenceId = tokenObj.id + "_" + sentence.index;
                        var sentenceText = tokenObj.sentences[sentence.index]
                        statements.push({statement: "create  (n:sentence { name: \"" + sentence.index + "\",uid:\"" + sentenceId + "\",text:\"" + sentenceText + "\",subGraph:\"totalRef\"})"});

                        statements.push({statement: "match (n:docFragment { name: \"" + tokenObj.id + "\"}), (m:sentence{ uid:\"" + sentenceId + "\"}) create (n)-[:composedOf]->(m)"});

                    }


                    for (var j = 0; j < tokenObj.tokens.nouns.length; j++) {
                        var noun = tokenObj.tokens.nouns[j];
                        var sentenceId = tokenObj.id + "_" + noun.sentence;
                        statements.push({statement: "MERGE  (n:noun { name: \"" + noun.word + "\",subGraph:\"totalRef\"})"});

                        statements.push({statement: "match (n:sentence { uid: \"" + sentenceId + "\"}), (m:noun{ name: \"" + noun.word + "\"}) create (n)-[:hasNoun]->(m)"});

                    }
                    for (var j = 0; j < tokenObj.tokens.numValues.length; j++) {
                        var num = tokenObj.tokens.numValues[j];
                        var sentenceId = tokenObj.id + "_" + num.sentence;
                        statements.push({statement: "MERGE  (n:numValue { name: \"" + num.word + "\",subGraph:\"totalRef\"})"});

                        statements.push({statement: "match (n:sentence { uid: \"" + sentenceId + "\"}), (m:numValue{ name: \"" + num.word + "\"}) create (n)-[:hasValue]->(m)"});

                    }
                }

            }


        }
        else if (coreNlp.currentRelations) {


            statements.push({statement: "MERGE  (n:conceptSource { name: \"" + sourceNodeName + "\",subGraph:\"totalRef\"})"});

            for (var id in coreNlp.currentRelations) {

                var relation = coreNlp.currentRelations[id];
                for (var i = 0; i < relation.occurences.length; i++) {
                    var targetNodeName = relation.occurences[i].name;
                    if (names.indexOf(targetNodeName) > -1) {
                        continue;
                    }
                    names.push(targetNodeName);
                    var type = "concept";
                    if (relation.occurences[i].type)
                        type = relation.occurences[i].type;

                    statements.push({statement: "MERGE  (n:" + type + " { name: \"" + targetNodeName + "\",subGraph:\"totalRef\"})"});


                    statements.push({statement: "match (n:conceptSource { name: \"" + sourceNodeName + "\"}), (m:" + type + " { name: \"" + targetNodeName + "\"}) create (n)-[:inSameRule]->(m)"});
                }
            }
        }
        var str = JSON.stringify(statements, null, 2)
        console.log(str);
        $("#coreNlpResultDiv").html(str.replace(/\n/g, "<br>"))
        var path = "/db/data/transaction/commit";

        var payload = {
            post: 1,
            body: {statements: statements},
            path: path,
            url: 'http://neo4j:souslesens@127.0.0.1:7474',


        }

        $.ajax({
            type: "POST",
            url: self.httpParams.url,
            data: payload,
            dataType: "application/json",
            //async: false,
            success: function (data, textStatus, jqXHR) {
                return callback(null, data.length)

            }
            , error: function (err) {

                console.log("done")
                //    console.log(err.responseText)
                return callback(err);


            }

        });
    }


    return self;
})()