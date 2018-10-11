var bot = {

    getTemplate: function () {
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

            obj.maxLines=50;
            obj.wrap= true;

        }

        return obj;


    }


}


//bot.htmlToBotObj("<h1>Reference documents</h1>")


module.exports = bot;