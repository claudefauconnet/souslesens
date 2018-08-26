var nlp = (function () {
        var self = {};
        var currentRule = null;
        self.elasticDatatable = null;
        self.elasticParams = {
            size: 5000,
            index: "totalreferentiel",
            queryField: "Texte",
            elasticUrl: "../../../elastic"
        }
        self.coreNlpParams = {
            url: "http://corenlp.run"
        }


        self.searchRules = function (phrase) {
            if (skosTree.currentNodeData == null)
                return
            //var concept = skosTree.currentNodeData.text;
            var concept = $("#searchExpression").val();
            var synonyms = skosTree.currentNodeData.synonyms;
            var mainWord = null;
            var andWords = null;
            var slop = null;
            if (phrase) {
                slop = concept.split(" ").length + 1
                mainWord = concept;
            } else {
                var andWords = concept.split(" ");
                var mainWord = andWords[0];
                andWords.splice(0, 1);
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


                }
                , error: function (err) {
                    console.log(err.responseText)

                    return (err);
                }

            });
        }

        self.initDataTable = function (dataSet) {
            var html = "<table id=\"dataTable\" class=\"display\" style=\"width:100%;font-size: 10px\"></table>";
            $("#elasticDataTableContainer").html(html);
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


        self.coreNlpAnalyze = function () {
            var allRulesRelations = {};
            if (!self.currentRule)
                return;
            var text = self.currentRule[1];
            var rules = self.elasticDatatable.rows('.selected').data();
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
                    async: false,
                    success: function (data, textStatus, jqXHR) {
                        var json = JSON.parse(data);
                        var relations = self.processCoreNlpResult(allRulesRelations, key, json, function (relations) {

                        });


                    }
                    , error: function (err) {
                        console.log(err.responseText)

                        return (err);
                    }

                });
            }
            console.log(JSON.stringify(allRulesRelations, null, 2))


        }

        self.processCoreNlpResult = function (relations, ruleKey, json, callback) {

            var sentences = json.sentences;
            var nouns = [];
            for (var i = 0; i < sentences.length; i++) {
                var tokens = sentences[i].tokens
                for (var j = 0; j < tokens.length; j++) {
                    if (tokens[j].pos.indexOf("NN") == 0) {
                        nouns.push(tokens[j])
                    }

                }


            }

            var text = "<ul>"
            for (var i = 0; i < nouns.length; i++) {

                text += "<li>" + nouns[i].word + "</li>"
            }
            text += "</li>"

            $("#coreNlpResultDiv").html(text);

            var treeData = skosTree.data;


            var concept = $("#searchExpression").val();
            var relations = self.getCloseConceptsInDoc(relations, ruleKey, concept, nouns, 10, treeData);
            callback(relations);

        }


        self.getCloseConceptsInDoc = function (relations, ruleKey, ruleConcept, nouns, distance, treeData) {
            var conceptOffset = 0;
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
                                distance:Math.abs(conceptOffset-nounObj.index)
                            })
                        }

                    }

                }

            }
            return relations;
            //  console.log(JSON.stringify(relations, null, 2))

        }

        return self;


    }
)();