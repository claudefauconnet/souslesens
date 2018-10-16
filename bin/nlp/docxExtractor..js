var fs = require('fs');


var xml2js = require('xml2js');
var parser = new xml2js.Parser();

var path = require('path');
var dom = require('xmldom').DOMParser
var docxParagraphAggregator = require("../nlp/docxParagraphAggregator..js")


// utilitary functions

var extractRunText = function (run, docRels) {
    var runStr = "";


    var textStr = ""
    /* for (var i = 0; i < run.childNodes.length; i++) {
          var child = run.childNodes[i];
          if (child.tagName == "w:t") {
              var textStr = ""
              for (var l = 0; l < child.childNodes.length; l++) {
                  var textChild = child.childNodes[l]
                  if (textChild.data && textChild.data != "")
                      textStr += textChild.data;
              }
              runStr += textStr.replace(/\n/g, "");

          } else if (child.tagName == "a:blip") {
              runStr += extractImage(run, docRels)
          }

      }*/
    var texts = run.getElementsByTagName("w:t")

    for (var k = 0; k < texts.length; k++) {
        var textStr = ""
        for (var l = 0; l < texts[k].childNodes.length; l++) {
            var textChild = texts[k].childNodes[l]
            if (textChild.data && textChild.data != "")
                textStr += textChild.data;
        }
        runStr += textStr.replace(/\n/g, "");


    }

    var images = run.getElementsByTagName("pic:pic")
    for (var k = 0; k < images.length; k++) {
        runStr += "{{\"image\":\"" + extractImage(images[k], docRels) + "\"}}"
    }
    return runStr;

}
// provisoire
var extractMathFormula = function (mathRun) {
    var runStr = "";
    var texts = mathRun.getElementsByTagName("m:t")

    for (var k = 0; k < texts.length; k++) {
        var textStr = ""
        for (var l = 0; l < texts[k].childNodes.length; l++) {
            var textChild = texts[k].childNodes[l]
            if (textChild.data && textChild.data != "")
                textStr += textChild.data;
        }
        runStr += textStr.replace(/\n/g, "");


    }
    return runStr;
}

var extractImage = function (imageRun, docRels) {
    if (!docRels)
        return "";
    var urlPrefix = "./"
    var imgName = "";
    var images = imageRun.getElementsByTagName("a:blip")

    for (var k = 0; k < images.length; k++) {
        var id = images[k].getAttribute("r:embed");
        if (docRels[id])
            imgName = docRels[id].target

    }
    return imgName;


}


var getAllElementsByTagNameDepth = function (element, tagName) {
    function recurse(element, tagName, result) {
        if (!element.getElementsByTagName)
            return result;
        result = result || [];
        var elements = element.getElementsByTagName(tagName);
        for (var i = 0; i < elements.length; i++) {
            result.push(elements[i])
        }
        if (elements.length > 0)
            ;//  return result;
        for (var i = 0; i < element.childNodes.length; i++) {
            recurse(element.childNodes[i], tagName, result)
        }
        return result;


    }

    return recurse(element, tagName, [])

}

var getPstyles = function () {
    var styles = body.getElementsByTagName("w:pStyle");
    for (var j = 0; j < styles.length; j++) {
        var attrs = styles[j].attributes;
        for (var k = 0; k < attrs.length; k++) {
            var value = attrs[k].value
            if (docxExtactor.stylesArray.indexOf(value) < 0)
                docxExtactor.stylesArray.push(value)
        }
    }
    console.log(docxExtactor.stylesArray);

}

var getDocPstylesOffsets = function (body) {
    var stylesArray = [];
    if (body) {
        var pPrs = body.getElementsByTagName("w:pPr");

        for (var i = 0; i < pPrs.length; i++) {
            var styleObj = {offset: pPrs[i].columnNumber};

            var styles = pPrs[i].getElementsByTagName("w:pStyle");
            for (var j = 0; j < styles.length; j++) {
                var styleValue = styles[j].getAttribute("w:val");
                var htmlStyle = docxExtactor.pStyles[styleValue];
                if (!htmlStyle) {
                    //                console.log("!!!style not  in pStylesMap " + styleValue);
                    // htmlStyle=styleValue
                }
                else {
                    styleObj.style = htmlStyle;
                    stylesArray.push(styleObj);
                }
            }
        }
    }
    return stylesArray;

}


var docxExtactor = {

    pStyles: {
        RfrentielTexte1avecpuces: "ul",
        Paragraphedeliste: "ol",
        Listepuces2: "ul2",
        RfrentielTexte2: "ul2",
        //  Listepuces2: "ul",
        Titre1: "h1",
        Titre2: "h2",
        Titre3: "h4",
        Titre2: "h4",
        TM1: "p",
        TM2: "p",


    },


    stylesArray: [],


// p parents =w:tc,w:body
// r parents=w:p,w:ins,w:hyperlink,w:del;
// t parents=w:r
// w:bookmarkStart parents  =w:p
// w:bookmarkEnd parents=w:p
// hyperlink parents=w:p
// w:tbl parents=w:body


    extractContentJson: function (doc, docRels) {

        /******************  internal functions*******************************/

        function setParagraphTablesContent(jsonParagraphs, jsonTables) {

            jsonTables.forEach(function (table, indexTable) {
                var offset = table.startOffset;
                var found = false
                jsonParagraphs.forEach(function (paragraph, index) {
                    if (!jsonParagraphs[index].tables)
                        jsonParagraphs[index].tables = [];

                    if (offset > paragraph.startOffset && offset < paragraph.endOffset) {
                        jsonParagraphs[index].tables.push(table);
                        found = true;
                    }

                })
                if (found == false) {
                    if (!jsonParagraphs.globalTables)
                        jsonParagraphs.globalTables = [];
                    jsonParagraphs.globalTables.push("table-#" + indexTable)
                }
            })
            return jsonParagraphs;


        }

        //***************************  gestion des styles******************************
        function setStyles(json) {

            var json2 = [];
            json.forEach(function (paragraph, index) {


                var paragraphStyle = null;//get paragraph Style by offsets
                stylesArray.some(function (style) {
                    if (paragraph.startOffset < style.offset && paragraph.endOffset > style.offset) {
                        paragraphStyle = style.style;
                        paragraph.style = style.style;

                        return true;
                    }
                    return false;

                })

                if (paragraph.text == "" && paragraph.title == "" && !paragraph.tableIndices)
                    return;

                if (paragraphStyle) {

                    if (paragraphStyle.indexOf("h") == 0) {
                        paragraph.title = "<" + paragraphStyle + ">" + paragraph.title + "</" + paragraphStyle + ">"
                    }
                }


                json2.push(paragraph)

            })


            return json2;

        }


        /******************  end internal functions*******************************/




        var json = [];
        var bodyStr = "";
        var currentTocId = "";
        var jsonTables = [];

        var body = doc.documentElement.getElementsByTagName("w:body")[0];

        //<w:pStyle w:val="Titre2"/>
        var stylesArray = getDocPstylesOffsets(body);

        var tables = body.getElementsByTagName("w:tbl");

        for (var j = 0; j < tables.length; j++) {
            var jsonTable = docxExtactor.extractTable(tables[j])
            jsonTable.startOffset = tables[j].columnNumber

            jsonTables.push(jsonTable)

        }


        var paragraphs = body.getElementsByTagName("w:p")


        var runStr;
        for (var i = 0; i < paragraphs.length; i++) {


            if (paragraphs[i].parentNode.tagName == "w:tc")// cellule de tableau
                continue;

            var obj = {status: "normal", title: "", text: "", paragraphIndex: i};

            //si pas de run et pas de formule c'est un saut de ligne qui délimite un paragraphe
            if (paragraphs[i].getElementsByTagName("w:r").length == 0 && paragraphs[i].getElementsByTagName("m:oMath").length == 0) {

                json.push({paragraphIndex: i, isLineBreak: true, parentTocId: currentTocId})
                continue;
            }

            for (var j = 0; j < paragraphs[i].childNodes.length; j++) {
                var child = paragraphs[i].childNodes[j];


                obj.startOffset = paragraphs[i].columnNumber
                if (i < paragraphs.length - 1)
                    obj.endOffset = paragraphs[i + 1].columnNumber - 1
                else
                    obj.sendOffset = 999999999;


                if (child.tagName == "w:bookmarkStart") {
                    obj.status = "bookmark";

                    var attrs = child.attributes;
                    for (var k = 0; k < attrs.length; k++) {
                        if (attrs[k].name && attrs[k].value) {
                            if (attrs[k].name == "w:name")
                                obj.tocId = attrs[k].value
                        }

                        currentTocId = obj.tocId;


                    }
                }


                if (child.tagName == "w:bookmarkEnd") {
                    obj.status = "normal";
                    obj.text = "";
                }

                runStr = "";
                if (child.tagName == "w:ins") {//ins revisions

                    var runs = child.getElementsByTagName("w:r")
                    for (var k = 0; k < runs.length; k++) {
                        runStr += extractRunText(runs[k], docRels)


                    }
                }
                if (child.tagName == "m:oMath") {//math formulas
                    runStr = extractMathFormula(child);
                }
                if (child.tagName == "w:r") {
                    runStr = extractRunText(child, docRels);
                }


                if (obj.status == "bookmark") {
                    obj.title += runStr;
                }
                if (obj.status == "normal") {
                    obj.text += runStr;
                }


            }

            if (obj.text.indexOf("This guide") > -1)
                var ww = 1;

            if (true || obj.title != "" || obj.text != "") {
                if (!obj.tocId && currentTocId) {
                    obj.parentTocId = currentTocId
                }
                delete obj.status
                json.push(obj);
            }

        }
        json = setParagraphTablesContent(json, jsonTables)
        json = setStyles(json);
        var toc = docxExtactor.extractTOC(doc, true);
        //     console.log(JSON.stringify(toc,null,2))
        try {
            docxExtactor.checkParagraphAndTocConsistency(toc, json);
        }catch(e){
           throw(e);
        }
        docxExtactor.setParagraphsParents(toc, json);
        json = docxParagraphAggregator.groupParagraphs(json)
        //     console.log(JSON.stringify(json,null,2))


        json.tables = jsonTables

        return json;
    },

    extractHeaderJson: function (filePath) {
        var headerTables = []
        var xmlStr = "" + fs.readFileSync(filePath);
        var doc = new dom().parseFromString(xmlStr);
        var headerTablesElts = doc.documentElement.getElementsByTagName("w:tbl");
        if (headerTablesElts) {
            for (var j = 0; j < headerTablesElts.length; j++) {
                headerTables.push(docxExtactor.extractTable(headerTablesElts[j]))
            }
        }

        return headerTables
    },

    setParagraphsParents: function (toc, jsonContent) {
        if (Object.keys(toc).length == 0) {
            console.log("TOC is old Model  !!! not processed")

            return jsonContent;
        }

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
            } else {// cas des sous sous chapitres non dans TOC ( voir GM 317) 4.3.1
                if (indexChapter > 0) {
                    jsonContent[indexChapter].parent = jsonContent[indexChapter - 1].parent;
                    jsonContent[indexChapter].key = jsonContent[indexChapter - 1].key;
                }
            }
        })


    },

    getRelsMap: function (filePath, types) {

        var docRels = {};//id and relative url

        var xmlStr = "" + fs.readFileSync(filePath);
        var doc = new dom().parseFromString(xmlStr);
        var relations = doc.documentElement.getElementsByTagName("Relationship");
        for (var i = 0; i < relations.length; i++) {
            var obj = {
                id: relations[i].getAttribute("Id"),
                target: relations[i].getAttribute("Target"),
                type: relations[i].getAttribute("Type")
            }
            obj.type = obj.type.substring(obj.type.lastIndexOf("/") + 1)
            if (!types || types.indexOf(type))
                docRels[obj.id] = obj;
        }
        return docRels;


    }
    ,
    extractTable: function (tblElt) {


        var table = {rows: []};


        var columns = tblElt.getElementsByTagName("w:tr");
        for (var k = 0; k < columns.length; k++) {
            var row = [];
            table.rows.push(row)
            var cells = columns[k].getElementsByTagName("w:tc");

            for (var y = 0; y < cells.length; y++) {
                var cell = extractRunText(cells[y]);
                row.push(cell);

            }


        }
        return table;
        // console.log(JSON.stringify(json,null,2))
    },
    extractDocTables: function (doc) {


        var jsonTables = [];
        var body = doc.documentElement.getElementsByTagName("w:body")[0];
        var tables = body.getElementsByTagName("w:tbl");


        for (var j = 0; j < tables.length; j++) {
            jsonTables.push(extractTable(tables[j]));
        }
        return jsonTables;
    },


    /**
     *
     * if not returnFlatJson returns a tree
     * returnFlatJson return a map of chapters with tocIds as keys
     *
     **/
    extractTOC: function (doc, returnFlatJson) {


        function extractTocKey(tocText) {
            if (tocText.indexOf("4.3") > -1) {
                var xx = 2
            }
            var regex = /(\d+\.?)/g
            var array;
            var key = "";
            while (array = regex.exec(tocText)) {
                key += array[0];
            }
            return key;
        }


        var tocArray = []
        var elements = doc.documentElement.getElementsByTagName("w:hyperlink");

        if (elements.length == 0) {
            console.log("TOC is old Model  !!! not processed")
        }

        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var obj = {text: ""};
            var str = "";

            var regexCleanTitle = /(.*[^\d])\d*/
            var str = extractRunText(element)
            str = regexCleanTitle.exec(str)[1];
            obj.text = str;

            var attrs = element.attributes;
            var attrsObj = {}
            for (var j = 0; j < attrs.length; j++) {
                if (attrs[j].name && attrs[j].value) {
                    attrsObj[attrs[j].name] = attrs[j].value;
                }
                if (attrsObj["w:anchor"])
                    obj.anchor = (attrsObj["w:anchor"])
            }
            tocArray.push(obj);


        }


        //build toc Tree structure

        var tocMap = {}
        tocArray.forEach(function (obj, index) {
            var key = extractTocKey(obj.text)
            var title = obj.text.substring(key.length);
            var key = "#" + key;
            if (key.charAt(key.length - 1) != ".") {//exemple     1 -	Reference documents
                key += ".";
            }


            var obj2 = {title: title, key: "" + key, children: [], anchor: obj.anchor};
            tocMap[key] = obj2;
        })


//set parents
        for (var key in tocMap) {
            var p = key.substring(0, key.length - 1).lastIndexOf(".")
            if (p < 0) {
                tocMap[key].parent = "#";
                continue;
            }
            var key2 = key.substring(0, p + 1);
            var parent = tocMap[key2];
            if (parent) {
                tocMap[key].parentAnchor = parent.anchor
                tocMap[key].parent = parent;
            }
            else {

                tocMap[key].parent = "#";
            }

        }

        if (returnFlatJson) {
            var tocMap2 = {}
            for (var key in tocMap) {
                tocMap2[tocMap[key].anchor] = tocMap[key];
            }


            return tocMap2;
        }

//build tree
        var tocStruct = [];

        function recurseParent(obj) {
            while (obj && obj.parent != "#") {
                obj.parent.children.push(obj);
                obj.parentKey = obj.parent;
                recurseParent(obj.parent);
                obj.parent = "#";
            }


        }

        for (var key in tocMap) {
            if (tocMap[key].parent == "#")
                tocStruct.push(tocMap[key])

            recurseParent(tocMap[key])


        }


        //console.log(JSON.stringify(tocStruct, null, 2))
        return tocStruct;


    },


    /***
     *
     *   corrige les erreurs de bookmark en enlevant le tocId dans les paragraphes qui ne sont pas dans la TOC (voir GM 318.xml line 4612)
     *
     * @param toc
     * @param jsonContent
     */
    checkParagraphAndTocConsistency: function (toc, jsonContent) {
        if (Object.keys(toc).length == 0) {
            throw "Unbable to parese TOC !";
            console.log("TOC is old Model  !!! not processed")

            return jsonContent;
        }
        jsonContent.forEach(function (line, index) {
            if (line.tocId && !toc[line.tocId]) {
                jsonContent[index].tocId = null;
                if (index > 0)
                    if (jsonContent[index - 1].parentTocId)
                        jsonContent[index].parentTocId = jsonContent[index - 1].parentTocId;
                    else
                        jsonContent[index].parentTocId = jsonContent[index - 1].tocId
            }
            return jsonContent;
        })
    },

    linkContentJsonToToc: function (toc, content) {


        var contentMap = {}
        var nTocParagraphs = []
        content.forEach(function (line, index) {

            if (line.tocId)
                contentMap[line.tocId] = line;
            else
                nTocParagraphs.push(line)
        })


        function recurse(obj) {
            var tocId = obj.anchor;
            var tocContent = contentMap[tocId];
            if (tocContent) {
                obj.content = tocContent;
            }
            obj.children.forEach(function (child, index) {
                recurse(child)
            })
        }


        toc.forEach(function (line) {
            recurse(line);


        })
        toc.splice(0, 0, content[0])


        tablesContent = {};
        content.tables.forEach(function (table, index) {
            tablesContent["table-#" + index] = table;
        })

        return {body: toc, tablesContent: tablesContent};

    },


    extractXmlFilesFromDocXDir: function (dir, callback) {


        try {


            var unzip = require("unzip");
            dir = path.resolve(dir)
            var docxFiles = fs.readdirSync(dir)
            docxFiles.forEach(function (docPath) {
                var docPath = path.resolve(dir + "/" + docPath);
                if (docPath.indexOf(".docx") > -1 || docPath.indexOf(".docm") > -1) {
                    fs.createReadStream(docPath)
                        .pipe(unzip.Parse())
                        .on('entry', function (entry) {
                            function isWithHeader2(docName) {
                                var docsWitherHeader2 = [110, 112, 318, 677, 686, 900];
                                var yes = false
                                docsWitherHeader2.forEach(function (number) {
                                    if (docName.indexOf("_" + number + "_") > -1) {
                                        yes = true;
                                    }
                                })
                                return yes;
                            }

                            var fileName = entry.path;
                            var type = entry.type; // 'Directory' or 'File'
                            var size = entry.size;
                            var docName = docPath.substring(docPath.lastIndexOf(path.sep) + 1, docPath.lastIndexOf("."));
                            var isWithHeader2 = isWithHeader2(docName);
                            var documentXmlDirPath = dir + "/documents/";
                            if (!fs.existsSync(documentXmlDirPath)) {
                                fs.mkdir(documentXmlDirPath);
                            }
                            var documentXmlMediaDirPath = dir + "/documents/media";
                            if (!fs.existsSync(documentXmlMediaDirPath)) {
                                fs.mkdir(documentXmlMediaDirPath);
                            }

                            if (entry.path === "word/document.xml") {
                                var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" + docName + ".xml");
                                entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                            }
                            else if (!isWithHeader2 && entry.path === "word/header1.xml") {
                                var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" + docName + "_header.xml");
                                entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                            }
                            else if (isWithHeader2 && entry.path === "word/header2.xml") {
                                var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" + docName + "_header.xml");
                                entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                            }
                            else if (entry.path === "word/_rels/document.xml.rels") {
                                var unzippedWordDirPath = path.resolve(documentXmlDirPath + "/" + docName + "_rels.xml");
                                entry.pipe(fs.createWriteStream(unzippedWordDirPath));
                            }
                            else if (entry.path.indexOf("word/media") > -1) {
                                var docMediaDir = documentXmlMediaDirPath + "/" + docName;
                                if (!fs.existsSync(docMediaDir))
                                    fs.mkdirSync(docMediaDir);
                                var name = entry.path.substring(entry.path.lastIndexOf("/") + 1)
                                var mediaPath = path.resolve(docMediaDir + "/" + name);
                                entry.pipe(fs.createWriteStream(mediaPath));
                            }
                            else {
                                entry.autodrain();
                            }


                        }).on('error', function (error) {
                        console.log(error + "  " + docPath)

                    });
                }
            })
            console.log("DONE");

        }
        catch (e) {
            console.log(e);
        }

    },

    /**
     *
     * extrait uniquement les tableaux à l'interieur des paragraphes
     *
     *
     */
    getTablesinParagraphs: function (xml) {
        var paragraphJsonTables = [];
        var contentJson = docxExtactor.extractContentJson(xml);
        contentJson.tables.forEach(function (table) {
            if (true || table.tocId)
                paragraphJsonTables.push(table)
            /* if (table.inParagraph)
                 ;// paragraphJsonTables.push(table)*/


        })

        return paragraphJsonTables;
    },


}

module.exports = docxExtactor;

if (false) {
    docxExtactor.extractXmlFilesFromDocXDir("D:\\Total\\docs\\GS MEC Word");

}
if (false) {
    var filePath = "D:\\Total\\NLP\\document.xml";
    var data = "" + fs.readFileSync(filePath);
    var cleanXml = data;// data.replace(/>/gm, ">\n");

    var contentJson = docxExtactor.extractContentJson(cleanXml);
    //console.log(JSON.stringify(contentJson, null, 2))
    //  console.log("******************************************************************");

    var toc = docxExtactor.extractTOC(cleanXml);
    //  console.log(JSON.stringify(toc, null, 2))
    //  console.log("******************************************************************");

    var linkedContentJson = docxExtactor.linkContentJsonToToc(toc, contentJson);
    //  console.log(JSON.stringify(linkedContentJson, null, 2))

    var toc = docxExtactor.extractTOC(cleanXml, true);
    var csv = docxExtactor.contentToCsv(contentJson, toc);
    console.log(csv);
    // var tablesJson = extractTables(cleanXml)
}

