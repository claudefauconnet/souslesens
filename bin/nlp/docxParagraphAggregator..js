var intraParagraphSeparator = "<br>"
var docxParagraphAggregator = {


    /**
     *
     * decompose le tableau en lignes de texte :
     *       si plus de deux colonnes et le texte des cellules des premières lignes est court (maxCellLenghtTosplitTable:20 caracteres)
     *       dans ce cas renvoie plusieurs lignes de paragraphe (une pour chaque ligne de tableau à partir de la deuxieme ligne
     *       sinon renvoie tout le tableau formaté dans un seul paragraphe
     *
     * @param table
     * @return an array of formated paragraphs
     */
    getTableParagraphs: function (table, split, tocId) {

        function shouldSplitTable() {
            var maxAvgCellLengthTosplitTable = 20
            var avgFirstRowCellsLength = {sum: 0, count: 0};
            var colNames = [];
            table.rows.forEach(function (line, index) {
                line.forEach(function (cell) {
                    if (index == 0) {
                        avgFirstRowCellsLength.sum += cell.length;
                        avgFirstRowCellsLength.count++;
                        colNames.push(cell);
                    }
                })


            })
            if (avgFirstRowCellsLength.sum > 0) {

                if ((avgFirstRowCellsLength.sum / avgFirstRowCellsLength.count) < maxAvgCellLengthTosplitTable) {
                    return colNames;
                }
            }
            return null;
        }

        function splitTableLines(colNames) {
            var paragraphs = [];

            table.rows.forEach(function (line, indexRow) {
                if (indexRow == 0)
                    return;
                var lineObj = {type: "splitTable", values: {}}
                line.forEach(function (cell, indexCell) {
                    lineObj.values[colNames[indexCell]] = cell;
                })

              //  var text = "{" + lineObj + "}"
                paragraphs.push(JSON.stringify({text: lineObj, parentTocId: tocId}))
            })
            return paragraphs;
        }

        function formatTable() {
            var paragraphs = [];

            var tableObj = {type: "table", rows: []}

            table.rows.forEach(function (line, indexRow) {
                var lineObj = []
                line.forEach(function (cell, indexCell) {
                    lineObj.push(cell);
                })
                tableObj.rows.push(lineObj)

            })
            var text = JSON.stringify(tableObj)
            paragraphs.push("{" + {text: text, parentTocId: tocId} + "}")
            return paragraphs;
        }

        if (split) {
            var colNames = shouldSplitTable();
            if (colNames)
                return splitTableLines(colNames);
            else
                return formatTable();
        } else
            return formatTable();

    },
    /**
     *
     *
     *    pour les paragraphes bullet points (puces)
     *   - si le paragraphe contient  du  texte avant les bullet points  on groupe tous du les bullet points dans le meme groupedParagraphs
     *   -sinon on les sépare en creant un groupedParagraphs par bulletpoint paragraph
     *
     *
     * @param paragraph
     * @param split
     * @param tocId
     */

    setBulletsParagraphs: function (currentGroupedParagraph, bulletparagraphs, split, tocId) {


        return currentGroupedParagraph

    },


    /**
     *
     *Groupe les paragraphes à l'intérieur des chapitres dans des groupedParagraphs
     *
     * un chapitre est un paragraphe qui a un attribut tocId
     *
     * entre deux chaptitres on groupe dans le meme groupedParagraph les paragraphes en les séparant par un <br> sauf si le paragraphe courant a un attribut linBreak=true,
     * dans ce cas on commence un nouveau  groupedParagraphs au sein du chapitre
     *
     *
     * pour les paragraphes bullet points (puces)
     *   - si le chapitre contient  du  texte avant les bullet points  on groupe tous du les bullet points dans le meme groupedParagraphs
     *   -sinon on les sépare en creant un groupedParagraphs par bulletpoint paragraph
     *
     *
     *
     *
     * pour chaque tableau  associé à un paragrphe:
     *  - si le paragraphe auquel est rattaché le tableau contient un texte en plus du tableau on insère le tableau après le texte dans le meme groupedParagraphs
     *  - si le paragraphe du  tableau ne contient pas de texte et le nombre de colonnes est <3 on considere le tableau comme tableau cosmétique et on l'écalte en plusieurs paragraphes
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


    groupParagraphs: function (jsonParagraphs) {
        var currentBulletParagraphs = [];

        function getNewGroupedParagraph(style) {
            currentBulletParagraphs = []
            var obj = {
                "text": "",
                "paragraphIndexes": [],
                "startOffset": 0,
                "endOffset": 0,
                "parentTocId": ""

            };
            if (style)
                obj.style = style;
            return obj;
        }

        function getNewChapter() {
            return {
                "title": "",
                "paragraphs": [],
                "tocId": ""
            };
        }

        function isBulletParagraph(paragraph) {
            if (!paragraph.style)
                return false;
            return ["ol", "ul", "ul2"].indexOf(paragraph.style) > -1;
        }


        var groupedJson = []
        var currentChapter;

        var currentGroupedParagraph = getNewGroupedParagraph();
        jsonParagraphs.forEach(function (paragraph, indexParagraph) {
            var isBulletCurrentParagraph = isBulletParagraph(paragraph);

            if (indexParagraph == 71) {
                xx = 2
                console.log(currentChapter.title)
            }

            if (indexParagraph == 0) {
                currentChapter = getNewChapter();
                currentChapter.title = "noChapter";
                currentChapter.tocId = "0";
                groupedJson.push(currentChapter);
            }
            else if (paragraph.tocId) {// paragraph is a chapter
                currentChapter.paragraphs.push(currentGroupedParagraph)

                currentChapter = getNewChapter();
                currentGroupedParagraph = getNewGroupedParagraph(paragraph.style)
                currentChapter.title = paragraph.title;
                currentChapter.tocId = paragraph.tocId;
                groupedJson.push(currentChapter);
            }
            else {

                if (paragraph.parentTocId == currentChapter.tocId || currentChapter.tocId == "0") {

                    // si pas de line break on aggrège les paragraphes en un seul sinon on ajoute un paragraphe
                    if (paragraph.isLineBreak) {
                        if (currentGroupedParagraph) {
                            currentChapter.paragraphs.push(currentGroupedParagraph)
                        }
                        currentGroupedParagraph = getNewGroupedParagraph(paragraph.style);


                        // si bulletPoints accumule bulletparagraphs
                    } else if (isBulletCurrentParagraph) {
                        currentBulletParagraphs.push(paragraph)
                    }
                    else {
                        if (currentGroupedParagraph.text.length > 0)
                            currentGroupedParagraph.text += intraParagraphSeparator;
                        currentGroupedParagraph.text += paragraph.text;
                        currentGroupedParagraph.paragraphIndexes.push(paragraph.paragraphIndex)
                        if (currentGroupedParagraph.startOffset == 0)
                            currentGroupedParagraph.startOffset = paragraph.startOffset;
                        currentGroupedParagraph.endOffset = paragraph.endOffset;
                        currentGroupedParagraph.parentTocId = paragraph.parentTocId;

                    }

                    // process all bulletparagraphs a la fin des paragraphe bullets ou à la fin du chapitre
                    if (currentBulletParagraphs.length > 0 && (!isBulletCurrentParagraph || indexParagraph == jsonParagraphs.length - 1 || !isBulletParagraph(jsonParagraphs[indexParagraph + 1]))) {
                        // on split les bullets si elles sont en tête de chapitre sinon on les aggrege au paragraphe courant
                        var split = currentChapter.paragraphs.length == 0;
                        var bulletArray = []
                        currentBulletParagraphs.forEach(function (bulletsParagraph) {
                            if (split) {
                                if (currentGroupedParagraph) {
                                    currentChapter.paragraphs.push(bulletsParagraph)
                                }
                                currentGroupedParagraph = getNewGroupedParagraph(paragraph.style);
                                if (currentGroupedParagraph.text.length > 0)
                                    currentGroupedParagraph.text += intraParagraphSeparator;
                                currentGroupedParagraph.text += bulletsParagraph.text;
                                currentGroupedParagraph.parentTocId = currentChapter.tocId;

                            } else {//on les aggrege au paragraphe courant
                                bulletArray.push({type: paragraph.style, text: bulletsParagraph.text})

                            }


                        })
                        if (bulletArray.length > 0) {
                            if (currentGroupedParagraph.text.length > 0)
                                currentGroupedParagraph.text += intraParagraphSeparator;
                            var bulletText = "";

                            if (!currentGroupedParagraph.bullets) {
                                currentGroupedParagraph.bullets = [];
                                var offset = currentGroupedParagraph.text.length
                                bulletArray.forEach(function (bullet) {
                                    currentGroupedParagraph.bullets.push({
                                        type: bullet.type,
                                        offset: offset,
                                        text: bullet.text
                                    })
                                    offset += bullet.text.length;
                                    //   bulletText = "!!" + JSON.stringify(bullet) + "!!"
                                })
                            }
var xx= currentGroupedParagraph.text;

                          //  currentGroupedParagraph.text += bulletText;//"{"+JSON.stringify(bulletArray)+"}";
                        }
                    }


                    //gestion des tables
                    if (paragraph.tables && paragraph.tables.length > 0) {
                        paragraph.tables.forEach(function (table) {

                            // si le chapitre n'a pas de paragraphe au dessus du tableau, le tableau est décomposé en lignes le cas écheant (voir description function getTableParagraphs
                            // chaque ligne sera considéree comme un paragraphe
                            var split = (currentChapter.paragraphs.length == 0)
                            var tablesParagraphs = docxParagraphAggregator.getTableParagraphs(table, split, currentChapter.tocId);
                            if (tablesParagraphs) {
                                tablesParagraphs.forEach(function (tableParagraph) {
                                    if (split) {
                                        if (currentGroupedParagraph) {
                                            currentChapter.paragraphs.push(currentGroupedParagraph)
                                        }
                                        currentGroupedParagraph = getNewGroupedParagraph();
                                        if (currentGroupedParagraph.text.length > 0)
                                            currentGroupedParagraph.text += intraParagraphSeparator;
                                        currentGroupedParagraph.text += tableParagraph.text;
                                        currentGroupedParagraph.parentTocId = currentChapter.tocId;

                                    } else {
                                        currentGroupedParagraph.text += tableParagraph.text

                                    }

                                })
                            }
                        })


                    }

                }
            }


        })
        return groupedJson;

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