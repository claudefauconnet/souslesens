var fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var path = require('path');
var dom = require('xmldom').DOMParser

var docxExtractor = require("./docxExtractor..js");


var docExtractorToCcv = {

    /**
     *
     * ecrit tous les tableaux à l'interieur des paragraphes de tous les document d'un repertoire    en csv
     *
     *
     */
    allParagraphArray2X: function (dir, format, sortByColsNumber) {

        function getTableColsNumber(tableJson) {
            var ncols=0;
            tableJson.rows.forEach(function (row, indexRow) {
                ncols=Math.max(row.length,ncols);

            })
            return ncols;
        }

        var xmlPaths = fs.readdirSync(dir)
        var jsonTables = [];
        var allTables = [];
        xmlPaths.forEach(function (xmlPath) {
            if (xmlPath.indexOf(".xml") < 0)
                return;
            if (xmlPath.indexOf("_header.xml") > -1)
                return;
            var filePath = path.resolve(dir + "/" + xmlPath);
            var xmlStr = "" + fs.readFileSync(filePath);
            var doc = new dom().parseFromString(xmlStr);
            var tables = docxExtractor.getTablesinParagraphs(doc)
            allTables.push({doc: xmlPath, tables: tables})
        })


        var strArray = [];

        allTables.forEach(function (docTables) {
            docTables.tables.forEach(function (table, index) {
                var str=""
                if (format == "html")
                    str += docExtractorToCcv.jsonTableToHtml(table) + "\n";
                else
                    str += docExtractorToCcv.jsonTableToCsv(table) + "\n";
                var obj = {content: str,doc:docTables.doc}
                if (sortByColsNumber) {
                    obj.colsNumber = getTableColsNumber(table);
                }
                strArray.push(obj);

            })
        })

        if (sortByColsNumber) {
           strArray= strArray.sort(function (a, b) {
                if (a.colsNumber > b.colsNumber)
                    return 1;
                if (a.colsNumber < b.colsNumber)
                    return -1;
                return 0;
            })

        }
        var str = "";
        if (format == "html") {
            str = "<html>";
            str += "<style>body{font-family:Verdana;font-size:12px} td{background-color :#a9b7d1;}</style>"
        }

        strArray.forEach(function (line,index) {
            console.log(line.colsNumber);
            str +=  "------------------colsNumber : " + line.colsNumber+ "-----------------\n"
            str += line.doc + "********************************************************************\n";
            str += line.content+"\n";

         //   console.log(line.colsNumber+ "  "+line.content)

        })


        if (format == "html") {
            str += "</html>"
            str = str.replace(/\n/gm, "<br>\n")
        }
      //  console.log(str)
        //  console.log(JSON.stringify(allParagraphJsonTables, null, 2))
        fs.writeFileSync(dir + "/allTablesOrdered.csv", str)
    },

    jsonTableToCsv: function (tableJson) {
        var str = "";
        tableJson.rows.forEach(function (row, indexRow) {
            if (indexRow > 0)
                str += "\n";
            row.forEach(function (cell, indexCell) {
                if (true || indexCell > 0)
                    str += "\t";
                str += cell.text
            })
        })
        return str;

    },


    jsonTableToHtml: function (tableJson) {
        var str = "<table border='1'>";
        tableJson.rows.forEach(function (row, indexRow) {
            str += "<tr>";
            row.forEach(function (cell, indexCell) {
                if (true || indexCell > 0)
                    str += "<td>";
                str += cell.text
                str += "</td>";
            })
            str += "</tr>";
        })
        str += "</table>"
        return str;

    },

    jsonContentsToCsv: function (dir) {
        var setChaptersParents = function (toc, jsonContent) {

            var aggregregateTocAncestors = function (str, tocLine) {
                if (tocLine) {
                    var sep = "";
                    if (str != "")
                        sep = " / ";
                    str = tocLine.key + "" + tocLine.title + sep + str;
                    if (tocLine.parentAnchor && tocLine.parentAnchor != "#") {
                        str = aggregregateTocAncestors(str, toc[tocLine.parentAnchor]);
                    }
                }
                return str;
            }
            jsonContent.forEach(function (chapter, indexChapter) {
                jsonContent[indexChapter].parents = ""
                var tocLine = toc[chapter.tocId];
                if (tocLine) {
                    var ancestors = aggregregateTocAncestors("", tocLine)
                    jsonContent[indexChapter].parent = ancestors
                    jsonContent[indexChapter].key = tocLine.key
                }else{// cas des sous sous chapitres non dans TOC ( voir GM 317) 4.3.1
                   if(indexChapter>0) {
                       jsonContent[indexChapter].parent = jsonContent[indexChapter - 1].parent;
                       jsonContent[indexChapter].key = jsonContent[indexChapter - 1].key;
                   }
                }
            })


        }
        var setPurposeAndScope = function (tables) {
            var str = "";
            if (tables.length > 0 && tables[0].rows[0]) {
                var cell0 = tables[0].rows[0][0].text;
                var cell1 = tables[0].rows[1][0].text;
                var index = cell0.indexOf("Purpose:");
                if (index == 0)
                    str += cell0.substring(index + "Purpose:".length);
                str += "\t";
                index = cell1.indexOf("Scope of application:");
                if (index == 0)
                    str += cell1.substring(index + "Scope of application:".length);
                str += "\t";

            }
            return str;
        }

        //add lines of table text to jscontent after each line containing tables
        var addTablesToChapters = function (jsonContent) {
            jsonContent.forEach(function (chapter, index) {
                if (chapter.tableIndices) {
                    chapter.tableIndices.forEach(function (tableIndice) {
                        var table = jsonContent.tables[tableIndice];
                        if (table) {
                            var tableText = docExtractorToCcv.jsonTableToHtml(table)
                            jsonContent[index].paragraphs.push({text: tableText})
                        }


                    })
                }

            })
            return jsonContent;


        }

        // le titre est dans la dernière ligne du tableau du fichier header1.xml
        var extractDocTitle = function (headerTables) {
            var docTitle = ""
            if (headerTables.length > 0) {
                var titleTable = headerTables[headerTables.length - 1];
                var lastRow = titleTable.rows[titleTable.rows.length - 1][0];
                docTitle = lastRow.text;
            }
            return docTitle;
        }

        var str = "id\tFile\tdocTitle\tpurpose\tscope\t\tparentChapters\tChapterKey\tChapter\tparagraphOrArray\n";
        var xmlPaths = fs.readdirSync(dir)
        var jsonTables = [];
        var allTables = [];

        xmlPaths.forEach(function (xmlPath) {
                if (xmlPath.indexOf(".xml") < 0)
                    return;
                if (xmlPath.indexOf("_header.xml") > -1)
                    return;

                var filePath = path.resolve(dir + "/" + xmlPath);
                if (fs.lstatSync(filePath).isDirectory())
                    return;
                var xmlStr = "" + fs.readFileSync(filePath);

               // console.log("---------" + filePath);
                var doc = new dom().parseFromString(xmlStr);
                var headerTables = docxExtractor.extractHeaderJson(filePath.replace(".xml", "_header.xml"))

                var jsonContent = docxExtractor.extractContentJson(doc);
                jsonContent = addTablesToChapters(jsonContent);
                var toc = docxExtractor.extractTOC(doc, true);
           //     console.log(JSON.stringify(toc,null,2))

                setChaptersParents(toc, jsonContent);

                var purposeAndScope = setPurposeAndScope(jsonContent.tables);

                var fileName = xmlPath.substring(0, xmlPath.lastIndexOf("."))
                var docTitle = extractDocTitle(headerTables);

                var startId=Math.round((Math.random()*100000))

                jsonContent.forEach(function (chapter,index) {
                    if(!chapter.key)
                        chapter.key="";
                    var rooTxt = fileName + "\t" + docTitle + "\t" + purposeAndScope + "\t" + chapter.parent + "\t" + chapter.key + "\t"+ chapter.title + "\t";;
                    chapter.paragraphs.forEach(function (paragraph) {
                        if (paragraph && paragraph.text) {

                            str += (startId++)+"\t"+rooTxt + paragraph.text + "\n"
                        }

                    })

                })

            }
        )
        //  console.log(str)
        fs.writeFileSync(dir + "/allDocsContent2.csv", str)
    },

    readDocumentsInDir:function(dir,callback){




    },


    contentToCsvXXXX: function (contentJson, tocJson) {

        var contentMap = {};
        contentJson.forEach(function (line) {
            if (line.tocId)
                contentMap[line.tocId] = line;
        })

        var colsep = "\t";
        var lineSep = "\n";

        function recurseParentChapter(str, chapter) {


            var tocObj = tocJson[chapter["tocId"]];
            if (tocObj) {
                var rootStr = str + tocObj.key + colsep + tocObj.title + colsep;
                if (tocObj.parentAnchor && tocObj.parentAnchor != "_") {
                    parentChapter = contentMap[tocObj.parentAnchor]
                    str += recurseParentChapter(str, parentChapter);
                }

            }


        }


        var csvHeader = "DocTitle" + colsep + "" + lineSep
        var csvBody = ""
        var rootStr = contentJson.docTitle


        contentJson.forEach(function (chapter) {
            var lineStr = recurseParentChapter("", chapter);

            var repeatedStr = chapter.title + colsep;
            if (chapter && chapter.paragraphs) {
                chapter.paragraphs.forEach(function (paragraph) {
                    lineStr += repeatedStr + paragraph.text + lineSep;
                })
            }
            lineStr = lineStr.replace(/\t\-/g, "");
            lineStr = lineStr.replace(/undefined/g, "");

            csvBody += rootStr + colsep + lineStr + lineSep;


        })
        return csvHeader + csvBody;


    }
}

module.exports = docExtractorToCcv;


var dir = "D:\\Total\\docs\\GM MEC Word\\documents\\test"
dir = "D:\\Total\\docs\\GM MEC Word\\documents"
if (false) {
    docExtractorToCcv.jsonContentsToCsv(dir);
}
if (true) {

    docExtractorToCcv.allParagraphArray2X(dir, "html",true);

}