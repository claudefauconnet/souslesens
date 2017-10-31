var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var elasticCustom = {

    processContent: function (input) {
        /*   parser.parseString(input, function (err, result) {
         if (err) {
         if (callback)
         return callback(err);


         }
         });*/

        var contentRegex = /<div id="ReqContent">([\s\S]*)<\/div>/gm;
        var contentArray = contentRegex.exec(input);
        if (contentArray && contentArray.length > 1) {
            var output = contentArray[1].replace(/[\n\r]*/gm, "");
            output =output.replace(/<br>/gm, "");
            return output;
        }
        else {
            return "";
        }


    }
}


module.exports = elasticCustom;