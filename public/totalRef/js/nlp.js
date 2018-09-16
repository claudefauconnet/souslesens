var nlp = (function () {

        var self = {};
        var currentRule = null;
        self.maxRules = 10;
        self.elasticDatatable = null;
        self.currentQuestionWordsAssociations = []


        self.elasticParams = {
            size: 5000,
            index: "totalref2",
            queryField: "Texte",
            elasticUrl: "../../../elastic"
        }


        self.httpParams = {
            url: "../../../http"
        }


        self.analyzeQuestion = function (question) {
            self.currentQuestionWordsAssociations = []
            var texts = [["", "question", question]]
            var conceptName = $("#sourceSearchExpression").val().toLowerCase();
            coreNlp.analyzeTexts(conceptName, texts, "tokens", function (err, result) {
                if (err) {
                    return console.log(err);
                }
                var str = "";
                var associations = [];

                //cration of associations of words (combinations)
                var nouns = result[0].tokens.nouns;
                nouns.forEach(function (noun) {
                    var word = noun.word;
                    if (associations.indexOf(word) < 0) {
                        associations.push([word])
                    }


                    nouns.forEach(function (token2) {
                        var word = token2.word;
                        var notExistAssoc = null;
                        associations.forEach(function (association) {

                            if (association.indexOf(word) < 0) {
                                // console.log(JSON.stringify(association))
                                notExistAssoc = association;

                            }
                            else
                                notExistAssoc = null;
                        })
                        if (notExistAssoc) {
                            var newAssociation = notExistAssoc.slice(0);
                            newAssociation.push(word)
                            associations.push(newAssociation)
                        }
                    })
                })

                associations.sort(function (a, b) {
                    if (a.length > b.length)
                        return -1;
                    if (a.length < b.length)
                        return 1;
                    return 0;


                })

//dedoublonage ordre different

                associations.forEach(function (association, index) {
                    var str = association.toString()
                    var count = 0;
                    associations.forEach(function (association2) {
                        association2.forEach(function (word) {
                            if (str.indexOf(word) > -1)
                                count += 1;
                        })
                        if (count == association.length && association.length > 1)
                            associations.splice(index, 1)
                    })
                })

                //  suppression des occurences d'un seul mot'


                var associations2 = []
                associations.forEach(function (association, index) {
                    if (true || association.length > 1)
                        associations2.push(association);

                })


                self.currentQuestionWordsAssociations = associations2;


                $("#QuestionWordsInput").val(associations2[0].toString());
                $("#nlpAccordion").accordion("option", "active", 0);

            })
        }


        self.searchQuestionRules = function (nonSingleWord) {
            var rules = [];
            var questionWords = $("#QuestionWordsInput").val();
            async.eachSeries(self.currentQuestionWordsAssociations, function (association, callbackEach) {

                association.forEach(function (word) { //pour supprimer des mots
                    if (questionWords.indexOf(word) < 0)
                        return callbackEach();
                })


                var words = "";
                if (nonSingleWord && association.length < 2)
                    return callbackEach();
                association.forEach(function (word) {

                    words += word + " ";
                })
                words.trim();
                if (association.length > 0 && rules.length > self.maxRules)
                    return callbackEach();
                self.searchRules(words, false, function (err, result) {
                    if (association.length > 0 && (rules.length + result.length) > self.maxRules)
                        return callbackEach();

                    result.docs.forEach(function (rule) {
                        rules.push({words: words, id: rule.id, Texte: rule.Texte})
                    })

                    return callbackEach();
                })


            }, function (err) {
                self.searResultToDataTables(rules);
            })


        }


        self.analyzeDataTableRules = function (processing) {
            var texts
            if ($("#selectAllTable").prop("checked"))
                texts = self.elasticDatatable.rows().data();
            else

                texts = self.elasticDatatable.rows('.selected').data();

            var conceptName = $("#QuestionWordsInput").val().toLowerCase();
            coreNlp.analyzeTexts(conceptName, texts, "tokens", function (err, result) {
                if (err) {
                    return console.log(err);
                }
                var xx = result;
                $("#nlpAccordion").accordion("option", "active", 2);
            })


        }
        self.searchRulesToDataTable = function (words, phrase) {

            self.searchRules(words, phrase, function (err, data) {
                self.searResultToDataTables(data);
            })

        }
        self.getWordInThesaurus = function (treeData, word) {
            if (word.charAt(word.length - 1) == 's')
                word = word.substring(0, word.length - 1)
            //  console.log(word)
            var concepts = [];
            for (var key in treeData) {
                var treeConcept = treeData[key].text;
                if (treeConcept) {
                    if (treeConcept.toLowerCase() == word.toLowerCase()) {
                        concepts.push(treeData[key]);
                    }
                    if (treeConcept.synonyms) {
                        treeConcept.synonyms.forEach(function (synonym) {

                            if (synonyms.toLowerCase() == word.toLowerCase()) {
                                concepts.push(treeData[key]);
                            }
                        })
                    }
                }


            }
            return concepts;


        }
        self.analyseAllRules = function () {

            var allTokens = [];
            var payload = {
                findDocuments: 1,
                options: {
                    from: 0,
                    size: self.elasticParams.size,
                    indexName: self.elasticParams.index,
                    word: "*",
                    booleanSearchMode: "and",
                    andWords: [],

                }
            };


            var queryField = self.elasticParams.queryField
            if (queryField != "") {
                payload.options.queryField = queryField;
            }
            $("#dataTable").html("");
            var treeData = $("#treeDiv1").jstree()._model.data;
//search all rules
            $.ajax({
                type: "POST",
                url: self.elasticParams.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {
                    async.eachSeries(data.docs, function (doc, callbackEachDoc) {
                            // forEach rules extract nouns
                            coreNlp.analyzeTexts("all", [["", "", doc.Texte]], "tokens", function (err, analyze) {

                                // forEach word search if exist thesaurus term
                                if (analyze && analyze.length > 0) {
                                    var nouns = analyze[0].tokens.nouns
                                    nouns.forEach(function (noun) {


                                        var concepts = self.getWordInThesaurus(treeData, noun.word);
                                        if (concepts.length > 0) {

                                            //console.log(JSON.stringify(concept.text));


                                            /*  var tokens = {
                                                  concept: "??",
                                                  id: doc.id,
                                                  tokens: analyze,
                                                  sentences: doc.Texte.split(".")
                                              }*/
                                            allTokens.push(analyze[0]);

                                        }
                                    })

                                }

                                callbackEachDoc();
                            })

                        }, function (err) {

                            var groups = [];
                            currentGroup = [];
                            allTokens.forEach(function (token) {
                                currentGroup.push(token)
                                if (currentGroup.length > 100) {
                                    groups.push(currentGroup);
                                    currentGroup = [];
                                }

                            })
                            groups.push(currentGroup);
                            async.eachSeries(groups, function (group, callback) {
                                coreNlp.currentTokens = group;
                                nlp.exportToNeo4j(false,function(err,result){
                                    if(err)
                                        console.log(err);
                                    callback();
                                });

                            })


                        }
                    )


                }
                , error: function (err) {
                    console.log(err.responseText)
                    return callback(err)


                    return (err);
                }

            });
        }


        self.searchRules = function (words, phrase, callback) {

            //var concept = skosTree.currentNodeData.text;
            var sourceConcept = words;
            if (!sourceConcept)
                sourceConcept = $("#QuestionWordsInput").val();
            var targetConcept = $("#targetSearchExpression").val();
            if (sourceConcept == null || sourceConcept == "")
                return
            var synonyms = [];//skosTree.currentNodeData.synonyms;
            var mainWord = null;
            var andWords = [];
            var slop = null;
            if (phrase) {
                slop = sourceConcept.split(" ").length + 1
                mainWord = sourceConcept;
            } else {
                andWords = sourceConcept.split(" ");
                mainWord = andWords[0];
                andWords.splice(0, 1);
            }
            if (targetConcept && targetConcept.length > 0) {
                andWords = andWords.concat(targetConcept.split(" "));
            }


            var payload = {
                findDocuments: 1,
                options: {
                    from: 0,
                    size: self.elasticParams.size,
                    indexName: self.elasticParams.index,
                    word: mainWord,
                    booleanSearchMode: "and",
                    andWords: andWords,
                    slop: slop
                    /*  getAssociatedWords: {
                          indexName: [self.elasticParams.size],
                          word: associatedWords,
                          size: 100,
                          iterations: 5,
                          classifierSource: ""

                      }*/
                }
            };


            if (false && associatedWords.length > 0)
                payload.options.andWords = associatedWords;

            if (false && options.format)
                payload.options.format = options.format;

            var queryField = self.elasticParams.queryField
            if (queryField != "") {
                payload.options.queryField = queryField;
            }
            $("#dataTable").html("");
            $.ajax({
                type: "POST",
                url: self.elasticParams.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {

                    return callback(null, data)


                }
                , error: function (err) {
                    console.log(err.responseText)
                    return callback(err)


                    return (err);
                }

            });
        }

        self.searResultToDataTables = function (data) {
            $("#searchResultCount").html(data.total)
            var dataSet = []
            for (var i = 0; i < data.length; i++) {
                dataSet.push([data[i].words, data[i].id, data[i].Texte])

            }


            var html = "<table id=\"dataTable\" class=\"display\" style=\"width:100%;height:400px;font-size: 10px\"></table>";
            $("#elasticDataTableContainer").height(400).html(html);
            var table = $('#dataTable').DataTable({
                columns: [
                    {title: "words", width: "100px"},
                    {title: "id", width: "100px"},
                    {title: "Texte"},
                ],
                data: dataSet
            });
            self.elasticDatatable = table;

            $('#dataTable tbody').on('click', 'tr', function () {
                console.log(table.row(this).data());
                $(this).toggleClass('selected');
                self.currentRule = table.row(this).data();
            });
            $("#nlpAccordion").accordion("option", "active", 1);
        }


        self.getCloseConceptsInDoc = function (relations, ruleKey, ruleConcept, tokens, distance, treeData) {
            var conceptOffset = 0;
            var nouns = tokens.nouns
            for (var i = 0; i < nouns.length; i++) {

                nouns[i].word = nouns[i].word.toLowerCase();
                var nounWord = nouns[i].word
                if (ruleConcept.indexOf(nounWord) > -1) {
                    if (conceptOffset == 0)
                        conceptOffset = nouns[i].index;
                    else {//average of each noun
                        conceptOffset += nouns[i].index;
                        conceptOffset = conceptOffset / 2
                    }
                }

            }

            for (var i = 0; i < nouns.length; i++) {
                var nounObj = nouns[i];
                var nounWord = nouns[i].word
                if (nounWord.length < 3)
                    continue;
                if (ruleConcept.indexOf(nounWord) < 0) {
                    for (var j = 0; j < treeData.length; j++) {
                        var treeConcept = treeData[j].text.toLowerCase();
                        var id = treeData[j].id;

                        if (treeConcept.indexOf(nounWord) > -1) {
                            if (!relations[nounWord]) {
                                relations[nounWord] = {count: 0, start: ruleConcept, occurences: [],}
                            }
                            relations[nounWord].count += 1;
                            relations[nounWord].occurences.push({
                                name: treeConcept,
                                id: id,
                                ruleKey: ruleKey,
                                distance: Math.abs(conceptOffset - nounObj.index),
                                verbs: tokens.verbs,
                                numValues: tokens.numValues
                            })
                        }

                    }

                }

            }
            return relations;


        }
        self.exportToNeo4j = function (deleteGraph,callback) {
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
                   return  callback(null, data.length)

                }
                , error: function (err) {
                    console.log(err.responseText)
                   return  callback(err);


                }

            });
        }


        return self;


    }
)
();