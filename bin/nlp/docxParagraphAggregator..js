var docxParagraphAggregator = {
    /**
     *
     * copie le contenu du paragraphe( text +[tableau] dans le parapgrphe précédent et le supprime
     *
     * @param json
     * @param index
     * @param withArray   is true aggrege aussi les tableaux du paragraphe
     */

    aggregateToPreviousParapagraph: function (json, index, withArray) {
        if (json.length > index || index == 0)
            return console.log("!!!!!!error  aggregateToPreviousParapagraph : index > json.length or index==0")
        if (!json[index - 1].text)
            json[index - 1].text = "";
        json[index - 1].text += json[index].text;
        if (withArray) {
            if (json[index - 1].tableIndices) {
                json[index - 1].tableIndices = [];
            }
            json[index].tableIndices.forEach(function (tableIndice) {
                json[index - 1].push(tableIndice)
            })

        }
        return json


    },


    /**
     *
     *
     * pour chaque tableau
     *
     * si le paragraphe du  tableau contient un texte en plus du tableau on insère le tableau après le texte
     * si le paragraphe du  tableau ne contient pas de texte et le nombre de colonnes est <3 on considere le tableau comme tableau cosmétique et on l'écalte en plusieurs paragraphes
     *
     *
     *
     *
     *
     *
     * @param jsonParagraphs
     * @param jsonTables
     * @returns {*}
     */








    aggregateTables: function (jsonParagraphs, jsonTables) {


    },

    groupParagraphs: function (jsonParagraphs) {
        function getNewGroupedParagraph() {
            return {
                "text": "",
                "paragraphIndexes": [],
                "startOffset": 0,
                "endOffset": 0,
                "parentTocId": ""
            };
        }

        function getNewChapter() {
            return {
                "title": "",
                "paragraphs": [],
                "tocId": ""
            };
        }


        var groupedJson = []
        var currentChapter;
        var currentGroupedParagraph  = getNewGroupedParagraph();
        jsonParagraphs.forEach(function (paragraph, index) {
            if (index == 0) {
                currentChapter = getNewChapter();
                currentChapter.title = "noChapter";
                currentChapter.tocId = "noChapter";
                groupedJson.push(currentChapter);
            }
            else if (paragraph.tocId) {
                if (!currentChapter) {
                    currentChapter = getNewChapter();
                }
                currentChapter.title = paragraph.title;
                currentChapter.tocId = paragraph.tocId;
                groupedJson.push(currentChapter);
            }
            else {
                if (paragraph.parentTocId == currentChapter.tocId) {
                    

                    if (paragraph.isLineBreak) {// si pas de line break on aggrge les paragraphes en un seul sinon on ajoute un paragraphe
                        if (currentGroupedParagraph) {
                            currentChapter.paragraphs.push(currentGroupedParagraph)
                        }
                        currentGroupedParagraph = getNewGroupedParagraph()

                    } else {
                        currentGroupedParagraph.text += paragraph.text;
                        currentGroupedParagraph.paragraphIndexes.push(paragraph.paragraphIndex)
                        if (currentGroupedParagraph.startOffset == 0)
                            currentGroupedParagraph.startOffset = paragraph.startOffset;
                        currentGroupedParagraph.endOffset = paragraph.endOffset;
                        currentGroupedParagraph.parentTocId = paragraph.parentTocId;

                    }

                }
            }


        })

    },
    /**
     *
     *
     *
     *
     *  pour chaque paragraphe brut (correspondant à une balise w:p dans le xml) :
     *
     *
     *
     *
     *
     *
     *
     *
     * 1) on aggrège les tableaux de chaque paragraphe le cas échéant
     * 2) on aggrège les bulltes points le cas écheéant
     *
     * 3) si le paragraphe ne correspond pas à un chapitre (pas de tocId) on lui affecte les informations du premier paragraphe antérieur qui est un chapitre
     *
     *
     *
     *
     * @param json
     * @returns {*[]}
     */
    aggregateParagraphs: function (jsonParagraphs) {
        jsonParagraphs = docxParagraphAggregator.aggregateTables(jsonParagraphs, jsonTables);
        //  console.log(JSON.stringify(json, null, 2))
        jsonParagraphs = docxParagraphAggregator.aggregateBullets(jsonParagraphs);

        var json2 = [{paragraphs: [], title: "noChapter"}];
        var currentParagraph = null;


        jsonParagraphs.forEach(function (paragraph, index) {


            if (!paragraph.tocId && !currentParagraph && paragraph.text != "") {// pas dans TOC
                json2[0].paragraphs.push({text: paragraph.text})
            }
            else if (paragraph.tocId) {//chapitre
                // if(paragraph.text=="" && paragraph.title=="")
                // return;
                currentParagraph = {tocId: paragraph.tocId, title: paragraph.title, paragraphs: [],};
                currentParagraph.paragraphs.push(obj);

                if (paragraph.tableIndices)
                    currentParagraph.tableIndices = paragraph.tableIndices


                if (paragraph.text != "") {
                    currentParagraph.paragraphs.push({text: paragraph.text});

                }

                json2.push(currentParagraph)

            }
            else if (!paragraph.tocId) {//paragraphe simple
                var obj = {}

                if (paragraph.text.trim() != "")
                    obj.text = paragraph.text

                if (currentParagraph) {
                    currentParagraph.paragraphs.push(obj);
                    if (paragraph.tableIndices) {
                        if (!currentParagraph.tableIndices)
                            currentParagraph.tableIndices = [];
                        paragraph.tableIndices.forEach(function (indice) {
                            currentParagraph.tableIndices.push(indice);
                        })


                    }
                }
            }


        })
        return json2;
    }
    , /**
     *
     *
     * pour chaque paragraphe qui a des bullets (ul or ol)
     *
     * si le paragraphe précedent est un chapitre on se contente de mettre les balises html ul, li..
     * si le paragraphe précedent n'est pas un chapitre on ajoute les balises html et on aggrège le paragraphe au précédent
     *si le paragraphe précedent est déja un élément de liste  (sous liste) on ajoute les balises html et on aggrège le paragraphe au précédent
     *
     *
     *
     * @param json
     * @returns {*[]}
     */

    aggregateBullets: function (json) {
        var previousParagraphStyle = null;
        var json2 = [];
        json.forEach(function (paragraph, index) {
            if (paragraph.style) {
                var paragraphStyle = paragraph.style

                if (paragraphStyle == "ul" || paragraphStyle == "ul2" || paragraphStyle == "ol") {
                    var beginListStr = ""
                    if (previousParagraphStyle != "ul" && previousParagraphStyle != "ol" && paragraphStyle != "ul2")
                        beginListStr = "<" + paragraphStyle + ">"
                    if ((previousParagraphStyle == null || previousParagraphStyle == "ul") && paragraphStyle == "ul2")
                        beginListStr = "<" + "ul" + ">"
                    paragraph.text = beginListStr + "<li>" + paragraph.text + "</li>"


                }


            }
            if (previousParagraphStyle == "ul2" && paragraphStyle == "ul") {// close ul2 or li
                json2[json2.length - 1].text += "</" + "ul" + ">";
            }
            if (previousParagraphStyle != null && (previousParagraphStyle == "ul" || paragraphStyle == "ul2" || previousParagraphStyle == "ol") && paragraphStyle != previousParagraphStyle) {// close ul or li

                json2[json2.length - 1].text += "</" + previousParagraphStyle + ">";
            }


            if (paragraphStyle)
                previousParagraphStyle = paragraphStyle;


            // on ajoute le texte des puces "ul" ou "ol"  au précédent paragraphe
            if ((paragraphStyle == "ul" || paragraphStyle == "ul2" || paragraphStyle == "ol")) {

                json2[json2.length - 1].text += paragraph.text;
                if (paragraph.tableIndices) {
                    paragraph.tableIndices.forEach(function (tableIndice) {
                        if (!json2[json2.length - 1].tableIndices)
                            json2[json2.length - 1].tableIndices = []
                        json2[json2.length - 1].tableIndices.push(tableIndice);
                    })
                }

            } else {
                json2.push(paragraph);

            }
        })

    }

}

module.exports = docxParagraphAggregator