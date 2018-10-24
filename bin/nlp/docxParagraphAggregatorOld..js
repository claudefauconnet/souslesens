var intraParagraphSeparator = "<br>"
var docxParagraphAggregatorOld = {


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
    getTableParagraphs: function (paragraph, table, split, tocId) {

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
            var tableParagraphs = [];
            var offset = 0;
            table.rows.forEach(function (line, indexRow) {
                if (indexRow == 0) {
                    offset = table.startOffset - paragraph.startOffset;
                    return;
                }
                var lineObj = {offset: offset, type: "splitTable", values: []}

                line.forEach(function (cell, indexCell) {
                    var key = colNames[indexCell]
                    var obj = {};
                    obj[key] = cell;
                    lineObj.values.push(obj);
                    offset += cell.length;
                })

                //  var text = "{" + lineObj + "}"
                tableParagraphs.push(lineObj)
            })
            return tableParagraphs;
        }

        function formatTable() {


            var tableParagraphs = [];

            var tableObj = {type: "table", rows: []}

            table.rows.forEach(function (line, indexRow) {
                var lineObj = []
                line.forEach(function (cell, indexCell) {
                    lineObj.push(cell);
                })
                tableObj.rows.push(lineObj)

            })

            tableParagraphs.push(tableObj);
            return tableParagraphs;
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
     * entre deux chaptitres on groupe dans le meme groupedParagraph les paragraphes en les séparant par un <br> sauf si le paragraphe courant a un attribut lineBreak=true,
     * dans ce cas on commence un nouveau  groupedParagraphs au sein du chapitre
     *
     *
     * pour les paragraphes bullet points (puces)
     *   - si le chapitre contient  du  texte avant les bullet points  on groupe tous  les bullet points dans le meme groupedParagraphs
     *   -sinon on les sépare en creant un groupedParagraphs par bulletpoint paragraph
     *
     *
     *
     *
     * pour chaque tableau  associé à un paragraphe:
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

        var chapterLevelMap = [[], [], [], [], [], [], [], [], [], [], [], []]
        var chapterTiles = []


        function registerChapterLevelMap(chapterIndex, style, title) {
            var level = style.substring(1);
            //  chapterLevelMap[level].push(chapterIndex);
            chapterLevelMap[level].push(chapterIndex);
            chapterTiles.push(title);

        }


        function removeEmptyTextLines(chapters) {
            chapters.forEach(function (chapter, chapterIndex) {
                var goodParagraphs = [];
                if (chapter.paragraphs) {
                    chapter.paragraphs.forEach(function (paragraph) {
                        if ((paragraph.title && paragraph.title.length > 0) || (paragraph.text && paragraph.text.length > 0) || (paragraph.images && paragraph.images.length > 0) || (paragraph.tables && paragraph.tables.length > 0) || (paragraph.bullets && paragraph.bullets.length > 0))
                            goodParagraphs.push(paragraph);
                        else {
                            console.log(JSON.stringify(paragraph, null, 2))
                        }

                    })
                }
                chapters[chapterIndex].paragraphs = goodParagraphs;
            })

        }

        /***
         *
         * reconstitue la TOC avec les niveaux de style(h1..h4) imbriqués
         *
         *
         * @param chapters
         * @returns {*}
         */
        function applyChapterLevelMap(chapters) {

            chapters.forEach(function (chapter, indexChapter) {
                //  console.log(chapters[indexChapter].number + "  " + chapters[indexChapter].title)
                chapters[indexChapter].tocNumber = ""
                var chapterNumber = "";
                var done = false;
                chapterLevelMap.forEach(function (level, indexMap) {
                    if (!chapterLevelMap[indexMap].currentIndice)
                        chapterLevelMap[indexMap].currentIndice = 0;

                    var indice = level.indexOf(indexChapter);
                    if (indice > -1) {


                        chapterLevelMap[indexMap].currentIndice += 1;
                        chapterNumber += chapterLevelMap[indexMap].currentIndice + "."
                        for (var i = indexMap; i < chapterLevelMap.length - 1; i++) {
                            chapterLevelMap[i + 1].currentIndice = 0;
                        }
                        chapters[indexChapter].tocNumber = chapterNumber;
                        var done = true;
                        //   console.log(indexChapter + "  " + chapters[indexChapter].tocNumber + "  " + chapters[indexChapter].title)
                        return;
                    } else {

                        var parentIndice = chapterLevelMap[indexMap].currentIndice;
                        if (parentIndice && !done) {
                            chapterNumber += (parentIndice) + ".";

                        }
                    }
                })
            })
            return chapters;
        }

        setChapterParents = function (chapters) {

            function findTocNumberTitle(str) {
                var title = null;
                if (str == "") {
                    return title;
                }
                chapters.forEach(function (chapter, indexChapter) {
                    if (chapter.tocNumber == str) {
                        title = chapter.title;
                        //  console.log(str +"  "+title)
                        if (title == "noChapter")
                            title = null;

                    }
                })
                return title;
            }


            function recurse(parentTitle, tocNumber, recurseLevel) {

                var p = tocNumber.lastIndexOf(".");
                if (p > -1) {

                    var str1 = tocNumber.substring(0, p + 1)
                    var parent = findTocNumberTitle(str1);
                    if (parent) {
                        if (recurseLevel > 0)
                            parentTitle = parent + "/" + parentTitle;
                        var q = tocNumber.lastIndexOf(".", p - 1)
                        if (q > -1 && q < tocNumber.length - 1) {
                            var str2 = tocNumber.substring(0, q + 1)
                            if (true || str2.length > 2)
                                parentTitle = recurse(parentTitle, str2, recurseLevel + 1)
                        }

                    }
                }
                return parentTitle;
            }

            chapters.forEach(function (chapter, indexChapter) {
                var parentStr = ""
                var p = 0;
                var str = chapter.tocNumber;
                if (str.length > 4)
                    var xx = 3

                parentStr = recurse(parentStr, chapter.tocNumber, 0)
                if (parentStr != "") {
                    var ww = 1;
                }
                chapters[indexChapter].parent = parentStr;
            })


            return chapters;
        }


        function getNewGroupedParagraph(style) {
            currentBulletParagraphs = []
            var obj = {
                "text": "",
                "paragraphIndexes": [],
                "startOffset": 0,
                "endOffset": 0,
                "parentTocId": "",
                "tables": [],
                "images": []

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


//console.log(JSON.stringify(jsonParagraphs,null,2))
        jsonParagraphs.forEach(function (paragraph, indexParagraph) {


            console.log("" + indexParagraph + " / " + paragraph.title + " / " + paragraph.text + " / " + paragraph.style+ " / " + paragraph.version)


            if (indexParagraph == 139)
                var x = 1


            var isBulletCurrentParagraph = isBulletParagraph(paragraph);


            // process all bulletparagraphs a la fin des paragraphe bullets ou à la fin du chapitre
            if (currentBulletParagraphs.length > 0 && !isBulletCurrentParagraph) {
                if (!isBulletCurrentParagraph || indexParagraph == jsonParagraphs.length - 1 || !isBulletParagraph(jsonParagraphs[indexParagraph + 1])) {

                    /*    currentChapter.paragraphs.push(currentGroupedParagraph);
                        currentGroupedParagraph=getNewGroupedParagraph()
                        currentBulletParagraphs = [];*/

                    // on split les bullets si elles sont en tête de chapitre sinon on les aggrege au paragraphe courant
                    var split = false;// =currentChapter.paragraphs.length == 0;

                    //   currentChapter.paragraphs.push(currentGroupedParagraph)
                    //   currentGroupedParagraph = getNewGroupedParagraph(paragraph.style);
                    if (currentGroupedParagraph.text.length > 0)
                        currentGroupedParagraph.text += intraParagraphSeparator;
                    if (!currentGroupedParagraph.bullets)
                        currentGroupedParagraph.bullets = [];
                    currentBulletParagraphs.forEach(function (bullet) {


                        var offset = currentGroupedParagraph.text.length

                        currentGroupedParagraph.bullets.push({
                            type: bullet.style,
                            offset: offset,
                            text: bullet.text
                        })
                        offset += bullet.text.length;


                    })
                    currentChapter.paragraphs.push(currentGroupedParagraph);
                    currentGroupedParagraph = getNewGroupedParagraph();


                    var xx = 1


                }
            }


            if (indexParagraph == 0) {
                currentChapter = getNewChapter();
                currentChapter.title = "noChapter";
                currentChapter.tocId = "0";
                groupedJson.push(currentChapter);
            }

            // nouveau chapitre (style h..)
            else if (paragraph.style && paragraph.style.indexOf("h") == 0) {//titre de chapitre) {/

                // ajoute le précedent paragraphe au précedent chapitre
             //   if (currentGroupedParagraph.length > 0)
                    currentChapter.paragraphs.push(currentGroupedParagraph)


                //
                currentChapter.level = paragraph.style;
                registerChapterLevelMap(groupedJson.length, paragraph.style, paragraph.title)
                currentChapter = getNewChapter();
                currentGroupedParagraph = getNewGroupedParagraph(paragraph.style)
                currentChapter.title = paragraph.title;
                if (currentChapter.title == "")// cas de paragraphes sans titre (h4)
                    currentChapter.title = "--";
                if (paragraph.text && paragraph.text.length > 0)
                    currentGroupedParagraph.text += paragraph.text;
                currentChapter.tocId = paragraph.tocId;
                groupedJson.push(currentChapter);
            }
            else {


                if (true || paragraph.parentTocId == currentChapter.tocId || currentChapter.tocId == "0") {
                    // si pas de line break on aggrège les paragraphes en un seul sinon on ajoute un paragraphe

                    if (paragraph.isLineBreak) {
                        if (currentGroupedParagraph) {
                            currentChapter.paragraphs.push(currentGroupedParagraph)
                        }
                        currentGroupedParagraph = getNewGroupedParagraph(paragraph.style);


                        // si bulletPoints accumule bulletparagraphs
                    } else if (isBulletCurrentParagraph) {
                        paragraph.isSplitBullet = true;
                        currentBulletParagraphs.push(paragraph)
                    }
                    else {
                        if (currentGroupedParagraph.text.length > 0)
                            currentGroupedParagraph.text += intraParagraphSeparator;
                        currentGroupedParagraph.text += paragraph.text;
                        if (currentGroupedParagraph.text == "")
                            currentGroupedParagraph.text = paragraph.title;
                        currentGroupedParagraph.paragraphIndexes.push(paragraph.paragraphIndex)
                        if (currentGroupedParagraph.startOffset == 0)
                            currentGroupedParagraph.startOffset = paragraph.startOffset;
                        currentGroupedParagraph.endOffset = paragraph.endOffset;
                        currentGroupedParagraph.parentTocId = paragraph.parentTocId;
                        paragraph.images.forEach(function (image) {
                            currentGroupedParagraph.images.push(image);
                        })


                    }


                    //gestion des tables
                    if (paragraph.tables && paragraph.tables.length > 0) {
                        paragraph.tables.forEach(function (table) {

                            // si le chapitre n'a pas de paragraphe au dessus du tableau, le tableau est décomposé en lignes le cas écheant (voir description function getTableParagraphs
                            // chaque ligne sera considéree comme un paragraphe
                            var split = true;//(currentChapter.paragraphs.length == 0);
                            var tablesParagraphs = docxParagraphAggregator.getTableParagraphs(paragraph, table, split, currentChapter.tocId);
                            if (tablesParagraphs) {
                                tablesParagraphs.forEach(function (tableParagraph) {
                                    if (split) {
                                        if (currentGroupedParagraph) {
                                            currentGroupedParagraph.tables.push(tableParagraph)
                                            currentChapter.paragraphs.push(currentGroupedParagraph)
                                        }
                                        currentGroupedParagraph = getNewGroupedParagraph();

                                        /*   paragraph.images.forEach(function (image) {
                                               currentGroupedParagraph.images.push(image);
                                           })*/


                                    } else {
                                        tablesParagraphs.forEach(function (table) {
                                            currentGroupedParagraph.tables.push(table)
                                        })


                                    }

                                })
                            }
                        })


                    }

                }
            }


        })
        currentChapter.paragraphs.push(currentGroupedParagraph)
        // groupedJson.push(currentChapter);

        applyChapterLevelMap(groupedJson)
        setChapterParents(groupedJson);
        groupedJson.tables = jsonParagraphs.tables
        //  removeEmptyTextLines(groupedJson)
        return groupedJson;

    }
}
module.exports = docxParagraphAggregator