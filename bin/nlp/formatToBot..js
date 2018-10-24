var config = require("./config..js");
var formatToBot = {


    format: function (sourceJson) {

        var body = [

            {
                "type": "Container",
                "items": [
                    {
                        "separator": true,
                        "spacing": "medium",
                        "type": "TextBlock",
                        "text": "Titre Chapitre",
                        "weight": "bolder",
                        "size": "medium",
                        "wrap": true
                    },
                    {
                        "type": "TextBlock",
                        "text": "Content ...\n * bullet 1 \n  * bullet 2",
                        "wrap": true,
                        "color": "accent",
                        "maxlines": 4
                    },
                    {
                        "type": "ColumnSet",
                        "columns": []
                    },

                    {
                        "type": "ImageSet",
                        "imageSize": "medium",
                        "images": [
                            {
                                "type": "Image",
                                "url": "https://picsum.photos/200/200?image=100"
                            },
                            {
                                "type": "Image",
                                "url": "https://picsum.photos/300/200?image=200"
                            }
                        ]
                    },
                    {
                        "type": "FactSet",
                        "facts": [

                            {
                                "title": "Score :",
                                "value": "88"
                            }
                        ]
                    }
                ]
            }
        ]


        function removeHtmlTags(text) {
            var regex = /<([^>^\/]*)>(.*)(<[^>^]*>)/;
            var array = regex.exec(text)

            if (array && array.length == 4) {
                return array[2];
            }
            return text;
        }

        function extractImages(images, fileName) {
            var imageSet = {
                "type": "ImageSet",
                "imageSize": "large",
                "images": []
            }


            images.forEach(function (image, index) {
                var url = image.replace("media/", config.imagesServerUrl + "" + fileName + "/");

                imageSet.images.push({
                    "type": "Image",
                    "url": url
                });


            })
            return imageSet;
        }


        function formatBullets(paragraph) {
            //    var bullets = getEmbeddedJsons(paragraph.text)


            if (paragraph.isSplitBullet) {
                return "- " + paragraph.text + "\n"
            }
            var bullets = paragraph.bullets;
            if (!bullets || bullets.length == 0) {
                return paragraph.text;
            }


            var bulletsText = "";
            var bulletPrefix = "- ";
            if (paragraph.style = "ol") {
                bulletPrefix = "- ";
            }
            var start = 0;
            bullets.forEach(function (bullet, index) {
                if (index == 0)
                    start = bullet.offset;
                bulletsText += bulletPrefix + bullet.text + "\n";
            })
            if (start == 0)
                return bulletsText + paragraph.text.substring(start);
            else
                return paragraph.text.substring(0, start)+"\n" + bulletsText + paragraph.text.substring(start+1)

        }


        function getTableJson(table) {
            function rotateClockwise(matrix) {
                var a = matrix;
                var n = a.length;
                for (var i = 0; i < n / 2; i++) {
                    for (var j = i; j < n - i - 1; j++) {
                        var tmp = a[i][j];
                        a[i][j] = a[n - j - 1][i];
                        a[n - j - 1][i] = a[n - i - 1][n - j - 1];
                        a[n - i - 1][n - j - 1] = a[j][n - i - 1];
                        a[j][n - i - 1] = tmp;
                    }
                }
                return a;
            }

            function rotateCounterClockwise(matrix) {
                var a = matrix;
                var n = a.length;
                for (var i = 0; i < n / 2; i++) {
                    for (var j = i; j < n - i - 1; j++) {
                        var tmp = a[i][j];
                        a[i][j] = a[j][n - i - 1];
                        a[j][n - i - 1] = a[n - i - 1][n - j - 1];
                        a[n - i - 1][n - j - 1] = a[n - j - 1][i];
                        a[n - j - 1][i] = tmp;
                    }
                }
                return a;
            }

            var jsonArray = [];
            var columns = [];
            var cellsMatrix = []
            //setMatrix
            var colsLength = 0
            table.rows.forEach(function (row, indexRow) {
                row.forEach(function (cell, indexCell) {
                    colsLength = indexCell + 1
                    if (indexCell == 0)
                        cellsMatrix.push([])
                    //   console.log(indexRow+"  "+indexCell+"  "+cellsMatrix.length+"  "+cellsMatrix[indexRow].length)
                    try {
                        cellsMatrix[indexRow].push(cell);
                    } catch (e) {
                        var xx = table;
                    }

                })

            })
            //rotate
            cellsMatrix = rotateCounterClockwise(cellsMatrix);
            //build formatToBot json
            cellsMatrix.forEach(function (col, indexCol) {
                var obj = {
                    "type": "Column",
                    "items": []
                }
                jsonArray.push(obj);
                col.forEach(function (rowCell, indexRow) {
                    if(rowCell && rowCell.text)
                    obj.items.push({type: "TextBlock", text: rowCell.text});
                })
            })

            var jsonArray = jsonArray.reverse();
            jsonArray.splice(colsLength, jsonArray.length - colsLength);
            return jsonArray;
        }


        /* *************************end internal functions****************************/

        //titre
        body[0].items[0].text = removeHtmlTags(sourceJson.chapter.title);


        //tables
        if (sourceJson.paragraph.tables) {
            sourceJson.paragraph.tables.forEach(function (table) {
                if (table.type == "table") {
                    var tableJson = getTableJson(table);
                    if (tableJson && tableJson.length > 0) {
                        body[0].items[2].columns = tableJson;
                    }

                }
                else if (table.type == "splitTable") {

                    table.values.forEach(function (obj) {
                        var fact = {}
                        for (var key in obj) {
                            fact.title = key;
                            fact.value = obj[key];
                        }
                        body[0].items[4].facts.push(fact);
                    })
                }
            })
        }


        //images
        var imageSet = extractImages(sourceJson.paragraph.images, sourceJson.fileName);
        if (imageSet.images.length > 0) {
            sourceJson.paragraph.text = sourceJson.paragraph.text.replace(/{{"image":.*}}/gm, "")
            body[0].items[3] = imageSet;
        }


        //bullets
        sourceJson.paragraph.text = formatBullets(sourceJson.paragraph);
        sourceJson.paragraph.text = sourceJson.paragraph.text.replace(/<br>/gm, "\n");
        body[0].items[1].text = sourceJson.paragraph.text;


        //facts
        var docTitleObj = {
            "title": "Document :",
            "value": sourceJson.fileName + "  " + sourceJson.docTitle
        }
        var parentObj = {
            "title": "parent/§ :",
            "value": sourceJson.chapter.parent + " / " + sourceJson.chapter.tocNumber
        }
        body[0].items[4].facts.splice(0, 0, parentObj);
        body[0].items[4].facts.splice(0, 0, docTitleObj);


        if (imageSet.images.length == 0) {
            body[0].items.splice(3, 1);// images
        }


        return body;
    }


}

module.exports = formatToBot;