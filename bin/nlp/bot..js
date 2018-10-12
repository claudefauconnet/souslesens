var bot = {
 config:{
     imagesServerUrl:"http://vps254642.ovh.net/scoreparts/media/"

 },
    getTemplateXX: function () {
        var template = {
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.0",
            "body": [
                {
                    "type": "FactSet",
                    "facts": []
                },
                {
                    "type": "Container",
                    "items": []
                }]
        }
        return template;
    },


    getTemplate: function () {
        [

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

                        "type": "TextBlock",

                        "text": "* bullet 1",

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

                                "title": "Document :",

                                "value": "GM MEC 317"

                            },

                            {

                                "title": "Score :",

                                "value": "88"

                            }

                        ]

                    }

                ]

            }

        ]
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

        function formatText(text) {// gestion des puces
            if (text.indexOf("<li>") < 0)
                return text;
            text = text.replace(/<\/?ul>/gm, "");
            text = text.replace(/<\/li>/gm, "");
            text = text.replace(/<li>/gm, "\n * ");
            return text
        }

        function removeHtmlTags(text) {
            var regex = /<([^>^\/]*)>(.*)(<[^>^]*>)/;
            var array = regex.exec(text)

            if (array && array.length == 4) {
                return array[2];
            }
            return text;
        }

        function extractImages(text,fileName) {
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
            if(imageArray!=null){
          var url = imageArray[1].replace("media/", bot.config.imagesServerUrl+""+fileName + "/" );

              imageSet.images.push( {
                  "type": "Image",
                  "url": url
              });


            }
            return imageSet;
        }


        body[0].items[0].text = removeHtmlTags(sourceJson.chapter.title);
        body[0].items[1].text = formatText(sourceJson.paragraph.text);



        var docTitleObj = {
            "title": "Document :",
            "value": sourceJson.docTitle
        }
        body[0].items[3].facts.splice(0, 0, docTitleObj);





        var imageSet = extractImages(sourceJson.paragraph.text,sourceJson.fileName);
        if(imageSet.images.length>0){
            body[0].items[2]=imageSet;
        }
        else{
            body[0].items.splice(2, 1);// images
        }


        return JSON.stringify(body);
    },


    addParagraph: function (template, botSourceObj) {

        /*
          fileName: fileName,
                                docTitle: docTitle,
                                chapter: chapter,
                                paragraph: paragraph
         */
        var body = [
            {
                "type": "FactSet",
                "facts": []
            },
            {
                "type": "Container",
                "items": []
            }]

        body[0].facts.push({title: "file", value: botSourceObj.fileName});
        body[0].facts.push({title: "docTitle", value: botSourceObj.docTitle});
        if (botSourceObj.chapter) {
            template.body[0].facts.push({chapter: botSourceObj.chapter.parent})

            var title = botSourceObj.chapter.title;
            var text = botSourceObj.paragraph.text;

            body[1].items.push(bot.htmlToBotItem(title))
            body[1].items.push(bot.htmlToBotItem(text))
        }


        return JSON.stringify(body);

    },


    htmlToBotItem: function (html) {

        var regex = /<([^>^\/]*)>(.*)(<[^>^]*>)/;
        var array;
        var obj = {
            "type": "TextBlock",
        }

        array = regex.exec(html)

        if (array && array.length == 4) {

            if (array[1] == "h1") {
                obj.text = array[2];
                obj.size = "large"
            }

        }

        else {
            obj.text = html
            obj.size = "default"

            obj.maxLines = 50;
            obj.wrap = true;

        }

        return obj;


    }

}


//bot.htmlToBotObj("<h1>Reference documents</h1>")


module.exports = bot;