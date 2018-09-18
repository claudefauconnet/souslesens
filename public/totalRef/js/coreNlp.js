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
var coreNlp = (function () {
    var self = {};

    var stopNouns=["title"]
    self.coreNlpParams = {
        url: "http://corenlp.run"
    }
    self.coreNlpParams = {
        url: "http://vps254642.ovh.net:9000/"

        // to startup corenlp on vps made  crontab -e @reboot /var/lib/coreNlp/ceoreNlp.sh
    }
    self.coreNlpParams = {
        url: "http://localhost:9001/"

        // to startup corenlp on vps made  crontab -e @reboot /var/lib/coreNlp/ceoreNlp.sh
    }


    self.currentTokens = null;
    self.openieTriples = null;



    self.analyzeTexts = function (conceptName, texts, processing, callback) {

        if (processing == "")
            return;


        self.currentTokens = null;
        self.openieTriples = null;

        if (processing == "tokens")
            self.currentTokens = [];
        if (processing == "openie")
            self.openieTriples = [];

        var allRulesRelations = {};
        async.eachSeries(texts, function (textObj, callbackEachText) {

            var words = textObj[0];
            var text = textObj[2];
if(!text || text.length==0 || !text.split) {
    console.log("null text id :"+textObj[1])
   return callbackEachText();
}

            var sentences = text.split(".")
            var id = textObj[1];
            var queryString = "";
            if (processing == "openie")
                queryString = encodeURIComponent("properties={\"annotators\":\"tokenize,ssplit,lemma,pos,openie\",\"outputFormat\":\"json\"}");
            else
                queryString = encodeURIComponent("properties={\"annotators\":\"tokenize,ssplit,lemma,pos\",\"outputFormat\":\"json\"}");
            var payload = text;//encodeURIComponent(text)
            $.ajax({
                    type: "POST",
                    url: self.coreNlpParams.url + "?" + queryString,
                    data: payload,
                    dataType: "text",
                    //async: false,
                    success: function (data, textStatus, jqXHR) {
//data=data.replace(//g)
                        try {
                            data=data.replace(/\0/g, '')
                            var json = JSON.parse(data);
                        } catch (e) {
                            console.log(text);
                            //console.log(data);
                            console.log(e);
                            var message=e.message
                            var pos=message.indexOf("position")+9;
                            pos=message.substring(pos,pos+5)
                            pos=parseInt(pos);;
                            console.log(pos);
                            console.log(data.substring(pos,pos+1));
                            if(pos>-1){
                                for(var i=0;i<5;i++){
                                    console.log("---"+data.charCodeAt(pos+9+i))
                                }
                            }
                           return  callbackEachText();
                        }


                        if (processing == "openie") {
                            var triples = self.parseCoreNlpOpenieJson(json);
                            triples = {concept: conceptName, id: id, triples: triples}
                            self.openieTriples.push(triples);


                        }
                        else {
                            if(json) {

                                var tokens = self.parseCoreNlpJson(json);
                                tokens = {concept: conceptName, id: id, tokens: tokens, sentences: sentences}
                                if (processing == "tokens") {
                                    self.currentTokens.push(tokens);


                                }
                            }
                            //concepts present in thesaurus
                            /*   else if (processing == "thesaurus") {

                                   self.processCoreNlpResultThesaurus(allRulesRelations, id, conceptName, tokens, function (relations) {

                                       var str = (JSON.stringify(allRulesRelations, null, 2));
                                       $("#coreNlpResultDiv").html(str.replace(/\n/g, "<br>"));
                                       $("#nlpAccordion").accordion("option", "active", 1);
                                       self.currentTokens = allRulesRelations;
                                       countNlpDone++;

                                   });
                                 }*/


                        }
                        return callbackEachText();

                    }
                    ,
                    error: function (err) {
                        console.log(err.responseText)
                        return callbackEachText(err);

                    }
                }
            );
        }, function (err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
            } else {
                if (processing == "openie") {
                    return callback(null, self.openieTriples);
                }
                else {
                    return callback(null, self.currentTokens);
                }
            }


        })
    }

    self.parseCoreNlpOpenieJson = function (json, tokens) {

        function getType(obj) {
            for (var i = 0; i < obj.objectSpan.length; i++) {
                if (tokens[obj.objectSpan[i]].pos == "CD")
                    return "numValue";
            }
            return "noun";
        }

        var triples = []
        var sentences = json.sentences;
        for (var i = 0; i < sentences.length; i++) {
            var openies = sentences[i].openie;
            var tokens = sentences[i].tokens;
            for (var j = 0; j < openies.length; j++) {
                var obj = openies[j];
                var triple = {
                    subject: obj.subject,
                    relation: obj.relation,
                    object: {name: obj.object, type: getType(obj, tokens)}
                }
                triples.push(triple);
            }
        }
        return triples;
    }

//extract nouns, verbs and numValues in the selected fragments
    self.parseCoreNlpJson = function (json) {
        var sentences = json.sentences;

        var nouns = [];
        var numValues = [];
        var verbs = [];
        var others=[];
        var sentenceObjs = [];
        for (var i = 0; i < sentences.length; i++) {
            sentenceObjs.push({index: i})
            var tokens = sentences[i].tokens
            for (var j = 0; j < tokens.length; j++) {

                if (j < tokens.length - 1 && tokens[j].pos == ("CD") && tokens[j + 1].pos.indexOf("NN") == 0) {
                   var matches=tokens[j].word.match(/\./g)
                    if(matches && matches.length>1)
                        continue;

                    if (tokens[j + 1].word.length < 4) {
                        numValues.push({

                            word: (tokens[j].word + " " + tokens[j + 1].word),
                            pos: "CD",
                            index: tokens[j].index,
                            sentence: i
                        })
                    }


                }

                /*  if (tokens[j].pos.indexOf("CD") == 0) {
                          tokens[j].sentence=i;
                      numValues.push(tokens[j])
                  }*/

                else if (tokens[j].pos == ("MD") && (j < tokens.length - 1 && tokens[j + 1].pos.indexOf("V") == 0))
                    verbs.push({
                        word: (tokens[j].word + " " + tokens[j + 1].word),
                        pos: "CD",
                        index: tokens[j].index,
                        sentence: i
                    })

                else if (tokens[j].pos == ("MD") && (j < tokens.length - 2 && tokens[j + 2].pos.indexOf("V") == 0))
                    verbs.push({
                        word: (tokens[j].word + " " + tokens[j + 1].word + " " + tokens[j + 2].word),
                        pos: "CD",
                        index: tokens[j].index,
                        sentence: i
                    })


                if (tokens[j].pos.indexOf("NN") == 0) {
                    if (stopNouns.indexOf(tokens[j].word.toLowerCase()) < 0) {
                        if (tokens[j].word.length > 2)
                            tokens[j].sentence = i;
                        nouns.push(tokens[j])
                    }
                }
//CF anti-surge
              //  if (tokens[j].pos.indexOf("JJ") == 0 && tokens[j].word.indexOf("-")>0) {
                if (tokens[j].pos.indexOf("JJ") == 0) {
                    if (stopNouns.indexOf(tokens[j].word.toLowerCase()) < 0) {
                        if (tokens[j].word.length > 2)
                            tokens[j].sentence = i;
                        nouns.push(tokens[j])
                    }
                }
                else{
                    if (stopNouns.indexOf(tokens[j].word.toLowerCase()) < 0) {
                        if (tokens[j].word.length > 2)
                            tokens[j].sentence = i;
                        others.push(tokens[j])
                    }
                }


            }

        }


        return {nouns: nouns, verbs: verbs, numValues: numValues,others:others, sentences: sentenceObjs};
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

        return callback(relations);


    },
        self.processCoreNlpResultThesaurus = function (relations, ruleKey, ruleConcept, tokens, callback) {

            var treeData = skosTree.data;

            var relations = nlp.getCloseConceptsInDoc(relations, ruleKey, concept, tokens, 10, treeData);
            callback(relations);

        }


    return self;
})
()