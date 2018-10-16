var config=require("./config..js");


var formatToColumns = {

    format: function (sourceJson) {

        function getTableJson(table) {
            var line = "<table>;// style='border-style: solid;border-width: 1px;border-color: #0000cc'>";
            if( !table.rows)
                return "";
            table.rows.forEach(function (row, indexRow) {
                line += "<tr>";
                row.forEach(function (cell, indexCell) {
                    line += "<td>";
                    line += cell;
                    line += "</td>";
                })
                line += "<tr>";
            })
            line += "</table>";

            return line;
        }

        function extractImages(images, fileName) {
         var line=""
            images.forEach(function(image,index){
                var url = image.replace("media/", config.imagesServerUrl + "" + fileName +"/");
                  if(index>0)
                      line+=" | ";
                  line += url;
          })
            return line;
        }


        function removeHtmlTags(text) {
            var regex = /<([^>^\/]*)>(.*)(<[^>^]*>)/;
            var array = regex.exec(text)

            if (array && array.length == 4) {
                return array[2];
            }
            return text;
        }

        function formatBullets(paragraph) {

            if( paragraph.isSplitBullet){
                if(paragraph.text=="")
                    return "";
                return "<ul-li>"+paragraph.text+"</ul-li>"
            }
            var bullets = paragraph.bullets;
            if (!bullets || bullets.length == 0) {
                return paragraph.text;
            }
            var bulletsText = "";
            var start = 0;
            var bulletPrefix="<"+paragraph.style+">";
            bulletsText+=bulletPrefix;
            bullets.forEach(function (bullet, index) {
                if (index == 0)
                    start = bullet.offset;
                bulletsText += "<"+paragraph.style+"-li>" + bullet.text +"</"+paragraph.style+"-li>"
            })

            return paragraph.text.substring(0, start) + bulletsText + paragraph.text.substring(start + 1)

        }

/* *************************end internal functions****************************/





        var line = ""



        //tables
        var cellTables = "";
        if (sourceJson.paragraph.tables) {
            sourceJson.paragraph.tables.forEach(function (table) {
                if (table.type == "table") {
                    cellTables+= getTableJson(table);
                }

                // on cree un tableau avec chaque ligne
                else if (table.type == "splitTable") {
                    var json={rows:[]};
                    table.values.forEach(function (obj) {
                      var row=[]
                        for (var key in obj) {
                           row.push(key);
                            row.push(obj[key]);

                        }
                        json.rows.push(row)

                    })
                    cellTables+= getTableJson(table);
                }
            })
        }

        sourceJson.paragraph.text= removeHtmlTags( sourceJson.paragraph.text);
        //images
        var cellImages = extractImages(sourceJson.paragraph.images, sourceJson.fileName);
        sourceJson.paragraph.text =sourceJson.paragraph.text .replace(/{{"image":.*}}/gm,"");

        //bullets

        sourceJson.paragraph.text = formatBullets(sourceJson.paragraph);
        sourceJson.paragraph.text = sourceJson.paragraph.text.replace(/<br>/gm, "\n");




        //infos
        sourceJson.docTitle= removeHtmlTags(sourceJson.chapter.title);
        var cellDocTitle =sourceJson.fileName + "  " + sourceJson.docTitle


        //titre
        line += sourceJson.chapter.title+"\t";

       line+=sourceJson.paragraph.text+"\t";


       line+=cellTables+"\t";

        line+=cellDocTitle+"\t";

        line+=cellImages+"\t";




    
        line=line.replace(/\n/gm,"<br>")
        line=line.replace(/\r/gm,"")
        
        return line;


    }


}

module.exports = formatToColumns;