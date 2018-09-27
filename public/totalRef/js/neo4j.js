var neo4jProxy = (function () {
        var self = {};
        self.neo4jProxyUrl = "../../neo"
        self.httpParams = {
            url: "../../../http"
        }


        self.queryQuestionConceptsRanked = function () {
            nlp.getWordsCombinations();
            var allResponses = [];

            async.eachSeries(nlp.currentQuestionWordsAssociations, function (words, callbackWords) {

                if (words.length > 0) {

                    var score = 0;

                    console.log(score + "  " + words.toString());
                    self.queryQuestionConceptsSimple(words, function (err, responses) {
                        allResponses.push({score: score, responses: responses, words: words})
                        return callbackWords();
                    })

                }
                else {
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

                nlp.printResponses(allResponses);

            })


        }

        self.buildConceptsGraph = function () {


            var match = "match(n:concept) return n.name as name";

            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: {match: match},
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var statements = [];
                    async.eachSeries(data, function (concept, callbackConcept) {

                        var match2 = "MATCH (n:concept)-[r*2]-(m:concept) WHERE  n.name='" + concept.name + "'   AND n.subGraph=\"totalRef\"   RETURN distinct m.name as name "

                        $.ajax({
                            type: "POST",
                            url: self.neo4jProxyUrl,
                            data: {match: match2},
                            dataType: "json",
                            success: function (data2, textStatus, jqXHR) {

                                data2.forEach(function (concept2) {
                                    statements.push({statement: "match (n:concept  { name: \"" + concept.name + "\"}),  (m:concept { name: \"" + concept2.name + "\"}) create (n)-[:coOccuresWith]->(m)"});

                                })
                                return callbackConcept();
                            }


                            , error: function (err) {
                                console.log(err)
                                return callbackConcept();
                            }
                        })
                    }, function (err) {

                        self.executeStatements(statements, function (err, result) {
                            if (err)
                                console.log(err);
                            console.log("done")
                        })

                    })
                }, error: function (err) {
                    console.log(err)
                }
            })


        }


        self.queryQuestionConceptsSimple = function (words, callback) {

            var match;
            words.forEach(function (word, index) {
                var array = word.split("_");
                var type = (array[0] == "C") ? "concept" : "noun";
                word = array[1];

                if (index == 0) {
                    match = " match(n:" + type + ")-[r2]-(f:fragment) where n.name=\"" + word + "\" "

                }
                else {
                    match += " WITH f match (f)-[r]-(m:" + type + ") where m.name=\"" + word + "\""


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
        self.queryQuestionWordsRanked = function () {
            var allResponses = [];

            async.eachSeries(nlp.currentQuestionWordsAssociations, function (words, callbackWords) {

                if (words.length > 1) {

                    var score = 0;
                    words.forEach(function (word) {
                        score += nlp.getWordConceptsInThesaurus(word).concepts.length
                    })

                    score += words.length
                    console.log(score + "  " + words.toString());
                    self.queryQuestionWordsSimple(words, function (err, responses) {
                        allResponses.push({score: score, responses: responses, words: words})
                        return callbackWords();
                    })

                }
                else {
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

                nlp.printResponses(allResponses);
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

        self.extractThesaurusEntities = function () {
            var statements = [];
            var treeData = $("#treeDiv1").jstree()._model.data;
            var keys = Object.keys(treeData);

            async.eachSeries(keys, function (key, callbackKeys) {
                var conceptName = key.substring(8);
                var words = [];
                var prefLabel = treeData[key].text
                if (prefLabel) {
                    words.push(prefLabel.toLowerCase());
                    treeData[key].data.synonyms.forEach(function (synonym) {
                        words.push(synonym.toLowerCase());
                    })


                    var arrayStr = "[";
                    words.forEach(function (word, index) {
                        if (index > 0)
                            arrayStr += ","
                        arrayStr += "\"" + word + "\""
                    })
                    arrayStr += "]"

                    var match = "match (n:noun) where n.name in " + arrayStr + " return n.name as name"
                    console.log(match);
                    var payload = {match: match};


                    $.ajax({
                        type: "POST",
                        url: self.neo4jProxyUrl,
                        data: payload,
                        dataType: "json",
                        success: function (data, textStatus, jqXHR) {
                            if (data.length > 0) {
                                statements.push({statement: "MERGE  (n:concept { name: \"" + conceptName + "\",subGraph:\"totalRef\"})"});
                                data.forEach(function (line) {
                                    statements.push({statement: "match (n:noun  { name: \"" + line.name + "\"}),  (m:concept { name: \"" + conceptName + "\"}) create (n)-[:ofConcept]->(m)"});

                                })
                            }
                            return callbackKeys();
                        },
                        error: function (err) {
                            return callbackKeys(null);

                        }


                    })
                }
                else {
                    return callbackKeys();
                }
            }, function (err) {
                self.executeStatements(statements, function (err, result) {
                    if (err)
                        return console.log(err);
                    return


                })


            })
        }

        self.createNeoConcepts = function (createNodes) {
            var where = " where n.name=~'(?i).*surge.*' "
            var match = " match (n:noun) " + where + "return ID(n) as id, n.name as name limit 100"
            console.log(match);
            var payload = {match: match};


            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var statements = [];
                    async.eachSeries(data, function (line, callbackLine) {

                            var word = line.name;
                            var id = line.id;

                            var concepts = nlp.getWordConceptsInThesaurus(word).concepts;
                            var pseudoConcepts = nlp.getWordConceptsInThesaurus(word).pseudoConcepts;
                            if (createNodes) {

                                concepts.forEach(function (concept) {
                                    statements.push({statement: "MERGE  (n:concept { name: \"" + concept.name + "\",type:\"" + concept.type + "\",subGraph:\"totalRef\"})"});
                                    statements.push({statement: "match (n:noun { name: \"" + word + "\"}),  (m:concept { name: \"" + concept.name + "\"}) create (n)-[:ofConcept]->(m)"});


                                })

                                pseudoConcepts.forEach(function (pseudoConcept) {
                                    statements.push({statement: "MERGE  (n:pseudoConcept { name: \"" + pseudoConcept.name + "\",type:\"" + pseudoConcept.type + "\",subGraph:\"totalRef\"})"});
                                    statements.push({statement: "match (n:noun { name: \"" + word + "\"}),  (m:pseudoConcept { name: \"" + pseudoConcept.name + "\"}) create (n)-[:ofConcept]->(m)"});


                                })
                                return callbackLine();
                            }
                            else {
                                console.log(word + " / " + JSON.stringify(concepts));
                                return callbackLine();
                            }


                        }, function (err) {
                            self.executeStatements(statements, function (err, result) {
                                if (err)
                                    console.log(err)
                                console.log("Done")
                            })

                        }
                    )


                }
                , error: function (err) {

                    console.log("done")
                    //    console.log(err.responseText)
                    return callback(err);


                }

            });


        }
        self.nounsToThesaurusConceptsXX = function (createNodes) {

            var match = " match (n:noun) return ID(n) as id, n.name as name limit 100"
            console.log(match);
            var payload = {match: match};


            $.ajax({
                type: "POST",
                url: self.neo4jProxyUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    var statements = [];
                    async.eachSeries(data, function (line, callbackLine) {

                            var word = line.name;
                            var id = line.id;

                            var concepts = nlp.getWordConceptsInThesaurus(word).concepts;
                            var pseudoConcepts = nlp.getWordConceptsInThesaurus(word).pseudoConcepts;
                            if (createNodes) {

                                concepts.forEach(function (concept) {
                                    statements.push({statement: "MERGE  (n:concept { name: \"" + concept.name + "\",type:\"" + concept.type + "\",subGraph:\"totalRef\"})"});
                                    statements.push({statement: "match (n:noun { name: \"" + word + "\"}),  (m:concept { name: \"" + concept.name + "\"}) create (n)-[:ofConcept]->(m)"});


                                })

                                pseudoConcepts.forEach(function (pseudoConcept) {
                                    statements.push({statement: "MERGE  (n:pseudoConcept { name: \"" + pseudoConcept.name + "\",type:\"" + pseudoConcept.type + "\",subGraph:\"totalRef\"})"});
                                    statements.push({statement: "match (n:noun { name: \"" + word + "\"}),  (m:pseudoConcept { name: \"" + pseudoConcept.name + "\"}) create (n)-[:ofConcept]->(m)"});


                                })
                                return callbackLine();
                            }
                            else {
                                console.log(word + " / " + JSON.stringify(concepts));
                                return callbackLine();
                            }


                        }, function (err) {
                            self.executeStatements(statements, function (err, result) {
                                if (err)
                                    console.log(err)
                                console.log("Done")
                            })

                        }
                    )


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

                            if (noun.word.toLowerCase() == "surge")
                                var xx = 2;

                            var attrs = "{startIndex: \"" + noun.characterOffsetBegin + "\",";
                            attrs += "endIndex: \"" + noun.characterOffsetEnd + "\",";
                            attrs += "type: \"" + noun.pos + "\",";
                            attrs += "sentenceIndex: \"" + noun.sentence + "\"}";

                            statements.push({statement: "MERGE  (n:noun { name: \"" + noun.word.toLowerCase() + "\",subGraph:\"totalRef\"})"});
                            statements.push({statement: "match (n:fragment { name: \"" + fragment.id + "\"}), (m:noun{ name: \"" + noun.word.toLowerCase() + "\"}) create (n)-[:hasNoun" + attrs + "]->(m)"});

                        })

                        tokens.numValues.forEach(function (numValue) {
                            var attrs = "{startIndex: \"" + numValue.characterOffsetBegin + "\",";
                            attrs += "endIndex: \"" + numValue.characterOffsetEnd + "\",";
                            attrs += "type: \"" + numValue.pos + "\",";
                            attrs += "sentenceIndex: \"" + numValue.sentence + "\"}";

                            statements.push({statement: "MERGE  (n:numValue { name: \"" + numValue.word + "\",subGraph:\"totalRef\"})"});
                            statements.push({statement: "match (n:fragment { name: \"" + fragment.id + "\"}), (m:numValue { name: \"" + numValue.word + "\"}) create (n)-[:hasNumValue" + attrs + "]->(m)"});

                        })

                    })
                }


            }
            self.executeStatements(statements, function (err, result) {
                if (err)
                    return callback(err);
                return callback(null, result);
            })

        }


        self.executeStatements = function (statements, callback) {

            console.log(statements.length)

            function execute(group) {
                var str = JSON.stringify(group, null, 2);
                //   console.log(str);
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

            var groups = [];
            var currentGroup = [];

            statements.forEach(function (statement, index) {

                currentGroup.push(statement)
                if (currentGroup.length > 100 || index >= statements.length) {
                    groups.push(currentGroup);
                    currentGroup = [];
                }

            })

            async.eachSeries(groups, function (group, callback) {

                execute(group, function (err, result) {
                    if (err)
                        return callback(err);
                    return callback();
                })

            }, function (err) {
                if (err) {
                    console.log(err);
                }
            })
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
    }
)
()