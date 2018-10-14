var bot = {
    config: {
        imagesServerUrl: "http://vps254642.ovh.net/scoreparts/media/"

    },


    getBotJsonText: function (sourceJson) {

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

        function extractImages(text, fileName) {
            var imageSet = {
                "type": "ImageSet",
                "imageSize": "medium",
                "images": []
            }
            //return imageSet;
            //   text="{{image:media/image10.emf}}"

            var imageArray;
            // while((imageArray = /{{image:(.*)}}/.exec(text))!=null){
            imageArray = /{{image:(.*)}}/.exec(text);
            if (imageArray != null) {
                var url = imageArray[1].replace("media/", bot.config.imagesServerUrl + "" + fileName + "/");

                imageSet.images.push({
                    "type": "Image",
                    "url": url
                });


            }
            return imageSet;
        }


        function getEmbeddedJsons(text) {
            var bullets = [];

         var regex = /[^{^}]{(.*)}/gm;
          var regex = /!!(.*)!!/gm;

            var array = [];
            while ((array = regex.exec(text)) != null) {
                if (array.length > 0) {
                    var jsonStr = array[1];
                  //  console.log(jsonStr)
                    try {
                        var jsonArray = JSON.parse(jsonStr);

                    if (jsonArray.forEach) {

                        jsonArray.forEach(function (line) {
                            bullets.push({start: array.index, json: line})
                        })
                    }
                    }catch(e){
                        console.log(text)
                        console.log(e);
                    }

                }
            }
            return bullets;
        }

        function formatBullets(paragraph) {
        //    var bullets = getEmbeddedJsons(paragraph.text)
            var bullets=paragraph.bullets;
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

            return paragraph.text.substring(0, start) + bulletsText + paragraph.text.substring(start + 1)

        }


        //format bullets
        /*
        {[{"type":"ol","text":"Rotors, which have exhibited high vibrations as they pass through their critical speed."},{"type":"ol","text":"Rotors, which accelerates slowly through their critical speed during operation."},{"type":"ol","text":"Rotors which are running on or near their critical speed."},{"type":"ol","text":"Rotors, which are very sensitive to unbalance."},{"type":"ol","text":"Rotors for equipment in extremely critical service."},{"type":"ol","text":"Rotors going to inaccessible locations, such as offshore."},{"type":"ol","text":"Very long and flexible rotors."},{"type":"ol","text":"Places where a critical rotor cannot be run in its intended casing prior to installation."}]}
         */

        //format tables


        function formatTables(text) {

            //format bullets
            /*
            {[{"type":"ol","text":"Rotors, which have exhibited high vibrations as they pass through their critical speed."},{"type":"ol","text":"Rotors, which accelerates slowly through their critical speed during operation."},{"type":"ol","text":"Rotors which are running on or near their critical speed."},{"type":"ol","text":"Rotors, which are very sensitive to unbalance."},{"type":"ol","text":"Rotors for equipment in extremely critical service."},{"type":"ol","text":"Rotors going to inaccessible locations, such as offshore."},{"type":"ol","text":"Very long and flexible rotors."},{"type":"ol","text":"Places where a critical rotor cannot be run in its intended casing prior to installation."}]}
             */

            //format tables


        }

        body[0].items[0].text = removeHtmlTags(sourceJson.chapter.title);
console.log(sourceJson.paragraph.text)
if(sourceJson.paragraph.text.indexOf("The correction planes are between bearings")>-1)
    var xxx=3;
        sourceJson.paragraph.text = formatBullets(sourceJson.paragraph);
       // sourceJson.paragraph.text = formatTables(sourceJson.paragraph);

        sourceJson.paragraph.text = sourceJson.paragraph.text.replace(/<br>/gm, "\n")
        body[0].items[1].text = sourceJson.paragraph.text;


        var docTitleObj = {
            "title": "Document :",
            "value": sourceJson.docTitle
        }
        body[0].items[3].facts.splice(0, 0, docTitleObj);


        var imageSet = extractImages(sourceJson.paragraph.text, sourceJson.fileName);
        if (imageSet.images.length > 0) {
            body[0].items[2] = imageSet;
        }
        else {
            body[0].items.splice(2, 1);// images
        }


        return body;//JSON.stringify(body);
    }


}


//bot.htmlToBotObj("<h1>Reference documents</h1>")


module.exports = bot;