/*
CC Coordinating conjunction
CD Cardinal number
DT Determiner
EX Existential there
FW Foreign word
IN Preposition or subordinating conjunction
JJ Adjective
JJR Adjective, comparative
JJS Adjective, superlative
LS List item marker
MD Modal
NN Noun, singular or mass
NNS Noun, plural
NNP Proper noun, singular
NNPS Proper noun, plural
PDT Predeterminer
POS Possessive ending
PRP Personal pronoun
PRP$ Possessive pronoun
RB Adverb
RBR Adverb, comparative
RBS Adverb, superlative
RP Particle
SYM Symbol
TO to
UH Interjection
VB Verb, base form
VBD Verb, past tense
VBG Verb, gerund or present participle
VBN Verb, past participle
VBP Verb, non­3rd person singular present
VBZ Verb, 3rd person singular present
WDT Wh­determiner
WP Wh­pronoun
WP$ Possessive wh­pronoun
WRB Wh­adverb

*/
var nlp = (function () {

        var self = {};
        var currentRule = null;
        self.elasticDatatable = null;
        self.currentRelations = null;
        self.elasticParams = {
            size: 5000,
            index: "totalreferentiel",
            queryField: "Texte",
            elasticUrl: "../../../elastic"
        }
        self.coreNlpParams = {
            url: "http://corenlp.run"
        }

        self.httpParams = {
            url: "../../../http"
        }


        self.searchRules = function (phrase) {

            //var concept = skosTree.currentNodeData.text;
            var sourceConcept = $("#sourceSearchExpression").val();
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

                    $("#searchResultCount").html(data.total)
                    var dataSet = [];
                    for (var i = 0; i < data.docs.length; i++) {
                        dataSet.push([data.docs[i].key, data.docs[i].Texte])

                    }

                    self.elasticDatatable = self.initDataTable(dataSet);
                    $("#nlpAccordion").accordion("option", "active", 0);

                }
                , error: function (err) {
                    console.log(err.responseText)

                    return (err);
                }

            });
        }

        self.initDataTable = function (dataSet) {
            var html = "<table id=\"dataTable\" class=\"display\" style=\"width:100%;height:500px;font-size: 10px\"></table>";
            $("#elasticDataTableContainer").height(650).html(html);
            var table = $('#dataTable').DataTable({
                columns: [
                    {title: "key", width: "100px"},
                    {title: "Texte"},
                ],
                data: dataSet
            });

            $('#dataTable tbody').on('click', 'tr', function () {
                console.log(table.row(this).data());
                $(this).toggleClass('selected');
                self.currentRule = table.row(this).data();
            });
            return table;
        }


        self.coreNlpAnalyze = function (processing) {
            var allRulesRelations = {};


            var rules = self.elasticDatatable.rows('.selected').data();
            var countRulesDone = 0;
            for (var i = 0; i < rules.length; i++) {
                var text = rules[i][1];
                var key = rules[i][0];

                var queryString = encodeURIComponent("properties={\"annotators\":\"tokenize,ssplit,lemma,pos\",\"outputFormat\":\"json\"}");
                var payload = encodeURIComponent(text)
                $.ajax({
                    type: "POST",
                    url: self.coreNlpParams.url + "?" + queryString,
                    data: payload,
                    dataType: "text",
                    //async: false,
                    success: function (data, textStatus, jqXHR) {
                        var json = JSON.parse(data);

                        var tokens = self.parseCoreNlpJson(json);


                        if ((countRulesDone++) == rules.length - 1) {
                            //concepts present in thesaurus
                            var concept = $("#sourceSearchExpression").val().toLowerCase();
                            if (processing == "thesaurus") {

                                self.processCoreNlpResultThesaurus(allRulesRelations, key, concept, tokens, function (relations) {

                                    var str = (JSON.stringify(allRulesRelations, null, 2));
                                    $("#coreNlpResultDiv").html(str.replace(/\n/g, "<br>"));
                                    $("#nlpAccordion").accordion("option", "active", 1);
                                    self.currentRelations = allRulesRelations;


                                });

                            }
                            //nouns, verbs and numValues in the selected fragments
                            else if (processing == "self") {
                                self.processCoreNlpResultSelectedFragments(allRulesRelations, key, concept, tokens, function (relations) {
                                    var str = (JSON.stringify(allRulesRelations, null, 2));
                                    $("#coreNlpResultDiv").html(str.replace(/\n/g, "<br>"));
                                    $("#nlpAccordion").accordion("option", "active", 1);
                                    self.currentRelations = allRulesRelations;


                                });

                            }


                        }
                    }
                    , error: function (err) {
                        console.log(err.responseText)

                        return (err);
                    }

                });
            }


        }
        self.parseCoreNlpJson = function (json) {
            var sentences = json.sentences;
            var nouns = [];
            var numValues = [];
            var verbs = [];
            for (var i = 0; i < sentences.length; i++) {
                var tokens = sentences[i].tokens
                for (var j = 0; j < tokens.length; j++) {

                    if (j < tokens.length - 1 && tokens[j].pos == ("CD") && tokens[j + 1].pos.indexOf("NN") == 0) {
                        numValues.push({word:(tokens[j].word + " " + tokens[j + 1].word),pos:"CD",index:tokens[j].index})
                    }

                    else if (tokens[j].pos == ("MD") && (j < tokens.length - 1 && tokens[j + 1].pos.indexOf("V") == 0))
                        verbs.push({word:(tokens[j].word + " " + tokens[j + 1].word),pos:"CD",index:tokens[j].index})

                    else if (tokens[j].pos == ("MD") && (j < tokens.length - 2 && tokens[j + 2].pos.indexOf("V") == 0))
                        verbs.push({word:(tokens[j].word + " " + tokens[j + 1].word + " " + tokens[j + 2].word),pos:"CD",index:tokens[j].index})


                    if (tokens[j].pos.indexOf("NN") == 0) {
                        if (tokens[j].word.length > 2)
                            nouns.push(tokens[j])
                    }



                }

            }


            return {nouns: nouns, verbs: verbs, numValues: numValues};
        }

        self.processCoreNlpResultSelectedFragments = function (relations, ruleKey, ruleConcept, tokens, callback) {
            var conceptOffset = 0;
            var nouns = tokens.nouns
            var numValues = tokens.numValues;
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
            for (var i = 0; i < numValues.length; i++) {
                var numValue = numValues[i];
                var numValueWord = numValues[i].word;
                if (!relations[numValueWord]) {
                    relations[numValueWord] = {count: 0, start: ruleConcept, occurences: [],}
                }
                relations[numValueWord].count += 1;
                relations[numValueWord].occurences.push({
                    name: numValueWord,
                    type: "numValue",
                    distance: Math.abs(conceptOffset - numValue.index),
                    verbs: tokens.verbs,

                })

            }


            for (var i = 0; i < nouns.length; i++) {
                var nounObj = nouns[i];
                var nounWord = nouns[i].word
                if (ruleConcept.indexOf(nounWord) < 0) {
                    if (!relations[nounWord]) {
                        relations[nounWord] = {count: 0, start: ruleConcept, occurences: [],}
                    }
                    relations[nounWord].count += 1;
                    relations[nounWord].occurences.push({
                        name: nounWord,
                        type: "noun",
                        distance: Math.abs(conceptOffset - nounObj.index),
                        verbs: tokens.verbs,

                    })

                }
            }

            return  callback(relations);


        },
            self.processCoreNlpResultThesaurus = function (relations, ruleKey, ruleConcept, tokens, callback) {

                var treeData = skosTree.data;

                var relations = self.getCloseConceptsInDoc(relations, ruleKey, concept, tokens, 10, treeData);
                callback(relations);

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
        self.exportToNeo4j = function () {
            var names=[];
            if (!self.currentRelations)
                return;
            deleteGraph = true;

            var statements = [];

            var sourceNodeName = $("#sourceSearchExpression").val();
            if (deleteGraph)
                statements.push({statement: "match(n)where n.subGraph=\"totalRef\" detach delete n"});
            statements.push({statement: "create (n:conceptSource { name: \"" + sourceNodeName + "\",subGraph:\"totalRef\"})"});

            for (var key in self.currentRelations) {

                var relation = self.currentRelations[key];
                for (var i = 0; i < relation.occurences.length; i++) {
                    var targetNodeName = relation.occurences[i].name;
                    if (names.indexOf(targetNodeName) > -1) {
                        continue;
                    }
                    names.push(targetNodeName);
                    var type = "concept";
                    if (relation.occurences[i].type)
                        type = relation.occurences[i].type;

                    statements.push({statement: "create (n:" + type + " { name: \"" + targetNodeName + "\",subGraph:\"totalRef\"})"});



                statements.push({statement: "match (n:conceptSource { name: \"" + sourceNodeName + "\"}), (m:" + type + " { name: \"" + targetNodeName + "\"}) create (n)-[:inSameRule]->(m)"});
            }
            }
            //  console.log(JSON.stringify(payload,null,2));
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


                }
                , error: function (err) {
                    console.log(err.responseText)

                    return (err);
                }

            });
        }


        return self;


    }
)();