var elasticProxy = (function () {
    var self = {};
    self.elasticParams = {
        size: 5000,
        index: "totalref2",
        queryField: "Texte",
        elasticUrl: "../../../elastic"
    }

    var allConcepts = []


    self.createCorpusGraph = function () {

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

//search all rules
        $.ajax({
            type: "POST",
            url: self.elasticParams.elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var iterations = 0;
                async.eachSeries(data.docs, function (doc, callbackEachDoc) {
                        // forEach rules extract nouns
                        var text = doc.Texte;//+ " "+doc.Title;
                        if (false && iterations++ > 5)
                            return callbackEachDoc();

                        if (doc.id == "7081")
                            var xxx = 3;

                        coreNlp.analyzeTexts("all", [["", "", text]], "tokens", function (err, analyze) {

                            // forEach word search if exist thesaurus term
                            if (analyze && analyze.length > 0) {
                                var nouns = analyze[0].tokens.nouns
                                var inThesaurus = 0;
                                nouns.forEach(function (noun) {
                                    var concepts = nlp.getWordConceptsInThesaurus(noun.word).concepts;
                                    if (concepts.length > 0)
                                        inThesaurus++;


                                })
                                if (inThesaurus > 0)
                                    allTokens.push({doc: doc, tokens: analyze[0]});
                                else
                                    console.log("no word in thesaurus " + doc.id)

                            }

                            return callbackEachDoc();
                        })

                    }, function (err) {

                        neo4jProxy.exportToNeo4j(allTokens, function (err, result) {
                            if (err)
                                console.log(err);
                            console.log("DONE")
                        });


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
    self.createNeoConcepts = function () {

        var treeData = $("#treeDiv1").jstree()._model.data;

        var keys = Object.keys(treeData);
        async.eachSeries(keys, function (key, callbackKey) {

            var conceptKey = key.substring(8);
            var conceptWord = treeData[key].text;

            if (conceptWord != "Diesel engines")
              ;// return callbackKey();

            if (!conceptWord)
                return callbackKey();
            var synonyms = treeData[key].data.synonyms;
            var payload = {
                findDocuments: 1,
                options: {
                    from: 0,
                    size: self.elasticParams.size,
                    indexName: self.elasticParams.index,
                    word: conceptWord,
                    booleanSearchMode: "or",
                    andWords: synonyms,
                    slop:2,
                    queryField: "Texte"

                }
            };

            synonyms.push(conceptWord);
            $.ajax({
                type: "POST",
                url: self.elasticParams.elasticUrl,
                data: payload,
                dataType: "json",
                success: function (data, textStatus, jqXHR) {

                    allConcepts.push({conceptKey: conceptKey, conceptWord: conceptWord, docs: data.docs})


                    return callbackKey();
                }, error: function (err) {
                    console.log(err);
                    return callbackKey();
                }
            })


        }, function (err) {
            var statements = [];

//console.log(JSON.stringify(allConcepts,null,2))
            allConcepts.forEach(function (concept) {
                statements.push({statement: "MERGE  (n:concept { name: \"" + concept.conceptKey + "\",word:\"" + concept.conceptWord.replace(/"/g, "") + "\",subGraph:\"totalRef\"})"});
                concept.docs.forEach(function (doc) {
                    statements.push({statement: "match (n:fragment { name: \"" + doc.id + "\"}),  (m:concept { name: \"" + concept.conceptKey + "\"}) create (n)-[:hasConcept]->(m)"});

                })


            })
            //   console.log(JSON.stringify(statements))
            neo4jProxy.executeStatements(statements, function (err, result) {
                if (err)
                    return console.log(err);
                return console.log("DONE");
            })


        })


    }


    return self;
})()