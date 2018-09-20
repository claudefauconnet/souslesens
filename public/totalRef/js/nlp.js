var nlp = (function () {

        var self = {};
        var currentRule = null;
        self.maxRules = 10;
        self.elasticDatatable = null;
        self.currentQuestionWordsAssociations = []
        var treeData;

        self.elasticParams = {
            size: 5000,
            index: "totalref2",
            queryField: "Texte",
            elasticUrl: "../../../elastic"
        }


        self.combination = function (arr) {

            var i, j, temp
            var result = []
            var arrLen = arr.length
            var power = Math.pow
            var combinations = power(2, arrLen)

            // Time & Space Complexity O (n * 2^n)

            for (i = 0; i < combinations; i++) {
                temp = ''

                for (j = 0; j < arrLen; j++) {
                    // & is bitwise AND
                    if ((i & power(2, j))) {
                        temp += arr[j] + ","
                    }
                }
                result.push(temp)
            }
            var result2 = [];

            result.forEach(function (str) {
                var result3 = str.split(",");
                if (result3[result3.length - 1] == "")
                    result3.splice(result3.length - 1, 1);
                result2.push(result3);
            })


            return result2;
        }


        self.analyzeQuestion = function (question) {
            $("#neo4jResponseDiv").html("")

            self.currentQuestionWordsAssociations = []
            var texts = [["", "question", question]]
            var conceptName = $("#QuestionInput").val().toLowerCase();
            coreNlp.analyzeTexts(conceptName, texts, "tokens", function (err, result) {
                if (err) {
                    return console.log(err);
                }
                var str = "";
                var associations = [];


                var nouns = result[0].tokens.nouns;

                var nounWords = [];
                for (var i = 0; i < nouns.length; i++) {
                    nounWords.push(nouns[i].word)
                }


                var str = "<table>";
                nounWords.forEach(function (word, index) {
                    str += "<tr><td>" + word + "<td><td>";
                    var concepts = self.getWordConcepts(word)
                    if (concepts.concepts.length > 0) {

                        str += "<select class='questionWord concept' style='color :green;font-weight: bold'><option>" + word + "</option><option></option></select>";
                    }
                    else if (concepts.pseudoConcepts.length > 0) {

                        var options = "<option>" + "" + "</option><option>" + word + "</option>";
                        concepts.pseudoConcepts.forEach(function (concept) {
                            options += "<option>" + concept.name + "</option>"
                        })
                        str += "<select class='questionWord concept' style='color :blue;font-weight: bold'>" + options + "</select>";
                    }
                    else {
                        str += "<input class='questionWord word' value='" + word + "'/>";
                    }
                    str += "</td></tr>"

                })
                str += "</table>";

                $("#QuestionConceptsInput").html(str);


                //  $("#QuestionWordsInput").val(associations[0].toString());
                $("#nlpAccordion").accordion("option", "active", 0);

            })
        }

        self.getWordsCombinations = function () {
            var concepts = [];
            var words = [];
            var inputs = $('#QuestionConceptsInput').find(".questionWord").each(function (input) {
                var value = $(this).val();
                var isConcept= ($(this).attr('class').indexOf("concept")>-1);
                if(value!="") {
                    if(isConcept)
                    concepts.push(value)
                    else
                        words.push(value)
                }

            })


            associations = self.combination(concepts);


            associations.sort(function (a, b) {
                if (a.length > b.length)
                    return -1;
                if (a.length < b.length)
                    return 1;
                return 0;


            })
            self.currentQuestionWordsAssociations = associations;
        }


        self.searchQuestionRules = function (nonSingleWord) {
            self.getWordsCombinations();
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


        self.getWordConcepts = function (word) {
            if (!treeData)
                treeData = $("#treeDiv1").jstree()._model.data;

            if (word.charAt(word.length - 1) == 's')
                word = word.substring(0, word.length - 1)
            //  console.log(word)
            var concepts = [];
            var pseudoConcepts = [];
            for (var key in treeData) {
                var conceptName = key.substring(8);
                var treeConcept = treeData[key].text;

                if (treeConcept) {
                    if (treeConcept.toLowerCase() == word.toLowerCase()) {
                        concepts.push({name: conceptName, type: "concept"});
                    }
                    else if (treeConcept.toLowerCase().indexOf(word.toLowerCase()) > -1) {
                        pseudoConcepts.push({name: conceptName, type: "concept"})
                    }

                    treeData[key].data.synonyms.forEach(function (synonym) {

                        if (synonym.toLowerCase() == word.toLowerCase()) {
                            concepts.push({name: conceptName, type: "synonym"});
                        }
                        else if (synonym.toLowerCase().indexOf(word.toLowerCase()) > -1) {

                            pseudoConcepts.push({name: conceptName, type: "synonym"});
                        }
                    })


                }
            }
            return {concepts: concepts, pseudoConcepts: pseudoConcepts};

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

        self.printResponses = function (allResponses) {
            var str = "<ul>";

            allResponses.forEach(function (line) {
                if (true || line.responses.length > 0) {
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
        }


        return self;


    }
)
();