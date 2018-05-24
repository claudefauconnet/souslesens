var util=require("../util.js")
var fs=require('fs');

var path="D:\\Framatome\\anonyms.txt"
var str=""+fs.readFileSync();

var anonyms=util.csv2json(str,"\t")


for(var i=0;i<anonyms.length;i++){

}