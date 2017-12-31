var request = require('request');
var googleAPIkey = "AIzaSyD43jXOtn2Qseo0JGd84VnCR3AgV9a4wjo";
var googleAPIproxy = {


    getEntities: function (text, callback) {

        var url = "https://language.googleapis.com/v1/documents:analyzeEntities?fields=entities%2Clanguage&key=" + googleAPIkey;
        var data = {
            "document": {
                "type": "PLAIN_TEXT",
                "content": text
            }
        }

        var options = {
            method: 'post',
            body: data,
            json: true,
            url: url
        }
        request(options, function (err, res, body) {
            if (err) {
                 console.error('ERROR:', err);
                return callback(err);
            }
            if(body.error){
                console.error('ERROR:', body.error.message);
                return callback(body.error.message);
            }
            var entities=body.entities
            callback(null, entities);
        });


    }

}


//googleAPIproxy.getEntities("Camille TAROT et ses critiques de la théorie girardienne La théorie durkheimienne de l’effervescence : Durkheim avec sa thèse du sacré,");

module.exports=googleAPIproxy;