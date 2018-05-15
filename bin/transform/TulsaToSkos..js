//https://github.com/innoq/iqvoc

var fs = require('fs');
var elasticProxy=require('../elasticProxy.js')

var path = "D:\\NLP\\Tulsa.txt"
var str = "" + fs.readFileSync(path);

var regex = /^DS/gm;
var array1 = [];
var i = 0;
var words = [];
var previousIndex = 0;
while ((array1 = regex.exec(str)) !== null) {
    var index = array1.index;
    var xx = array1[0];

    if (i++ > 0) {
        var str1 = str.substring(previousIndex, index);
        var lines = str1.split('\n');
        var xx = [];
        for (var i = 0; i < lines.length; i++) {
            var str2 = lines[i].replace(/ {2,}/g, "|");
            var parts = str2.split("|");
            xx.push(parts);
        }
        words.push(xx)

    }
    previousIndex = index;

}
/*
 BT:  broader term
      NT:  narrower term
      RT:  related term
      SN:  synonym
      USE: use instead
      UF:  used to mean
      USE Use ... (preferred synonym)
PLS Plus
UF Used For ... (invalid term)
WTH With
NT Narrow Term
BT Broad Term
SA See Also
A maximum of 26 characters (letters and spaces) is allowed for each term. A few terms require more characters than 26, therefore some abbreviations are necessary. The single asterisk entry designates the entire spelling of such descriptors.

Scope Note entries (double asterisk) are used to restrict the scope of a term or to define its meaning, to instruct the indexer to use additional terms also, to tell when the term was first available for indexing, to show what terms were used previously to describe this area, and to indicate changes in hierarchical relationships. Numbers in parentheses show applicable year ranges, e.g., (1965-2001).

USE entries indicate the valid term used for indexing instead of the entry term

PLS (Plus) indicates the second term of a two-term synonym; used with the USE statement.

UF (Used For) indicates an invalid term that is directed to the preferred term under which it is listed.

WTH (With) indicates the second term of a two-term synonym; used with the UF statement.

NT (Narrow Term) designates a term which is a more specific subdivision of the term.

BT (Broad Term) designates one or more hierarchically related terms, of which the concept is a logical subdivision.

SA (See Also) usually designates terms that are related but have not been directly connected in a vertical hierarchical relationship. In some cases, the SAs give information about the location of the feature or the features encompassed by the feature.
 */
//toSkos
var skosArray =[];

var regexSN = /SN([0-9]*)(.*)/g
for (var i = 0; i < words.length; i++) {
    var item = words[i];
    var obj = {};
    for (var j = 0; j < item.length; j++) {

        if (item[j][0] == "DS") {
            obj.concept = {
                id: item[0][2],
                label: item[0][1],

            };
        }

      else   if (item[j][0].indexOf("SN") == 0) {
         //   var array = regexSN.exec(item[0][1])

//console.log(item[j][0])
                obj.SN = {
                    type: item[j][0].substring(2,6),
                    label: item[j][0].substring(6),

                }


        }
        else if(item[j][0]!="")
            obj[item[j][0]] = { label:item[j][1]}
    }

    skosArray.push(obj);



}


elasticProxy.indexJsonArray("tulsathesaurus", "json", skosArray, {},function (err,result){
if(err)
    console.log(err);
});



