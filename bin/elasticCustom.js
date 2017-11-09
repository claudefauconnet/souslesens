var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var fs=require("fs");
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


    },
    getMetaData:function(input){
       var metas={};
        var contentRegex = /<meta name="(.*)" content="(.*)">/gm;
        var contentArray;
       while(( contentArray = contentRegex.exec(input))!=null){



                var name=contentArray[1]
                var output = contentArray[2].replace(/[\n\r]*/gm, "");
                output =output.replace(/<br>/gm, "");
                metas[name]=output;
            }



        return metas;
    }
}


var data=""+fs.readFileSync("D:\\Total\\Requirements\\EP\\ELE\\GS_EP_ELE_001-Req-3.-1.html")
elasticCustom.getMetaData(data);

module.exports = elasticCustom;