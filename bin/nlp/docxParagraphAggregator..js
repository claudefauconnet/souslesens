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
    getTableParagraphs: function (table, split) {

        function getColNames() {
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

            return colNames;

        }

        function splitTableLines(colNames) {
            var tableParagraphs = [];
            var offset = 0;
            table.rows.forEach(function (line, indexRow) {
                if (indexRow == 0) {
                   return;
                }
                var lineObj = {type: "splitTable", values: []}

                line.forEach(function (cell, indexCell) {
                    if(colNames[indexCell]) {
                        var key = colNames[indexCell].text
                        var obj = {};
                        obj[key] = cell;
                        lineObj.values.push(obj);
                    }

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
            var colNames = getColNames();
            if (colNames)
                return splitTableLines(colNames);
            else
                return formatTable();
        } else
            return formatTable();

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
        var currentGroupedParagraph = null;
        var chapters = {};
        var currentGroupedParagraphIndex = 0;
        var chapterIndexes = [];
        var groupedJson = []

        var chapterLevelMap = [[], [], [], [], [], [], [], [], [], [], [], []];
          var  chapterTiles =[];

        var  registerChapterLevelMap=function (chapterIndex, style, title) {
            var level = style.substring(1);
            //  chapterLevelMap[level].push(chapterIndex);
            chapterLevelMap[level].push(chapterIndex);
            chapterTiles.push(title);

        }



            /***
             *
             * reconstitue la TOC avec les niveaux de style(h1..h4) imbriqués
             *
             *
             * @param chapters
             * @returns {*}
             */
            applyChapterLevelMap=function (chapters) {

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

        var setChapterParents=function (chapters) {

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


        function isBulletParagraph(paragraph) {
            if (!paragraph.style)
                return false;
            return ["ol", "ul", "ul2"].indexOf(paragraph.style) > -1;
        }

        function closeGroupedParagraphAndSetNew(paragraphIndex) {

            var newCurrentGroupedParagraph = {
                "text": "",
                "tables": [],
                "images": [],
                startParagraphIndex: paragraphIndex + 1,

            };

            if (paragraphIndex > 0) {// dont close  first

                for (var i = 1; i < chapterIndexes.length; i++) {
                    if (chapterIndexes[i] >= paragraphIndex) {
                        chapters[chapterIndexes[i - 1]].paragraphs.push(currentGroupedParagraph);
                        break;
                    }
                }
            }
            currentGroupedParagraph = newCurrentGroupedParagraph;

        }


        //**************************************************identify chapters****************************
        jsonParagraphs.forEach(function (paragraph, indexParagraph) {
            if (indexParagraph == 0) {
                var chapter = {
                    title: "noChapter",
                    paragraphs: []
                }
                chapters[indexParagraph] = chapter;
            }


            // nouveau chapitre (style h..)
            else if (paragraph.style && paragraph.style.indexOf("h") == 0) {
                if (paragraph.title == "")
                    paragraph.title = "";// cas de paragraphes sans titre (h4)

                var chapter = {
                    title: paragraph.title,
                    paragraphs: [],
                    level: paragraph.style
                }
                registerChapterLevelMap(groupedJson.length, paragraph.style, paragraph.title)
                chapters[indexParagraph] = chapter;
                chapterIndexes.push(indexParagraph);
                groupedJson.push(chapter);
            }
        })



//**************************************************set paragraphs****************************
        var currentBulletParagraphs = [];

        jsonParagraphs.forEach(function (paragraph, indexParagraph) {

        //    console.log("" + indexParagraph + " / " + paragraph.title + " / " + paragraph.text + " / " + paragraph.style + " / " + paragraph.version)


        /*    if (indexParagraph == 24)
                var x = 1
            if (paragraph.text && paragraph.text.indexOf("Rotor and test bench status before HSB:") > -1)
                var x = 2*/


            if (!currentGroupedParagraph)
                closeGroupedParagraphAndSetNew(0);



            var isBulletCurrentParagraph = isBulletParagraph(paragraph);

            // if bullet cumulate them into currentBulletParagraphs


            if (isBulletCurrentParagraph) {
                paragraph.isBullet = true;
                if (currentBulletParagraphs.length == 0)
                    currentBulletParagraphs.startBulletIndex = currentGroupedParagraph.text.length
                currentBulletParagraphs.push(paragraph);
                return;
            }

            // if only one bullet set after current Text in same groupedParagraph
            else if (currentBulletParagraphs.length == 1) {
                currentGroupedParagraph.text += "- "+intraParagraphSeparator + currentBulletParagraphs[0].text;

                currentBulletParagraphs = [];
                currentBulletParagraphs.startBulletIndex = 0;
                //  closeGroupedParagraphAndSetNew(indexParagraph);
            }
            // at the end of bullets add them to currentGroupedParagraph
            else if (currentBulletParagraphs.length > 1) {

                var bulletsArray = [];
                var bulletTables=[]
                currentBulletParagraphs.forEach(function (bullet) {

                    bulletsArray.push({
                        type: bullet.style,
                        offset: currentBulletParagraphs.startBulletIndex,
                        text: bullet.text
                    })
                    // tables inside bullet stacked a the end of the paragraph as a real array (cannot split table inside bullet paragraph)
                    if(bullet.tables) {
                        bullet.tables.forEach(function (table) {
                            var tablesParagraphs = docxParagraphAggregator.getTableParagraphs(table, false);
                            if (tablesParagraphs) {
                                tablesParagraphs.forEach(function (tableParagraph) {
                                    tablesParagraphs.forEach(function (table) {
                                        currentGroupedParagraph.tables.push(table)

                                    })

                                })
                            }
                        })

                    }


                });

                currentBulletParagraphs = [];
                currentGroupedParagraph.bullets = bulletsArray;
                currentBulletParagraphs.startBulletIndex = 0;

                closeGroupedParagraphAndSetNew(indexParagraph);

            }


            //if  new chapter or last chapter close currentBulletParagraphs
            if (chapters[indexParagraph] || indexParagraph == jsonParagraphs.length - 2) {
                return closeGroupedParagraphAndSetNew(indexParagraph)


            }

            //else apply group paragraph rules

            //if lineBreak close currentGroupedParagraph
            else if (paragraph.isLineBreak) {
                closeGroupedParagraphAndSetNew(indexParagraph)

            }

            else { // standard paragraph aggregate texts into currentGroupedParagraph
                if (currentGroupedParagraph.text.length > 0)
                    currentGroupedParagraph.text += intraParagraphSeparator;
                currentGroupedParagraph.text += paragraph.text;
                if (currentGroupedParagraph.text == "")
                    currentGroupedParagraph.text += paragraph.title;

                paragraph.images.forEach(function (image) {
                    currentGroupedParagraph.images.push(image);
                })


            }

            function setParagraphTables(paragraph){
                //gestion des tables
                if (paragraph.tables) {
                    paragraph.tables.forEach(function (table) {
                        var split = true;
                        var tablesParagraphs = docxParagraphAggregator.getTableParagraphs(table, split);
                        if (tablesParagraphs) {
                            tablesParagraphs.forEach(function (tableParagraph) {
                                if (split) {
                                    currentGroupedParagraph.tables.push(tableParagraph)
                                    closeGroupedParagraphAndSetNew(indexParagraph);
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


           setParagraphTables(paragraph);


        })
       applyChapterLevelMap(groupedJson)
      setChapterParents(groupedJson);
          groupedJson.tables = jsonParagraphs.tables
//  removeEmptyTextLines(groupedJson)
        return groupedJson;
    }

}


module.exports = docxParagraphAggregator