var fs = require('fs');


const csv=require('csvtojson');
var header=[];
var jsonArray=[]

var filePath="D:\\ATD_Baillet\\graphes\\versements2.csv"
var data=""+fs.readFileSync(filePath);
data=data.replace(/\r/gm,"");
data=data.replace(/,/gm,";");
data=data.replace(/\t/gm,",");
csv({noheader: false, trim: true, delimiter: "auto"})

    .fromString(data)
    .on('json', function (json) {

        for (var key in json) {
            if (header.indexOf(key) < 0)
                header.push(key);


        }

            jsonArray.push(json);

    })
    .on('done', function () {

        var str="";
        jsonArray.forEach(function(line,indexLine){

            header.forEach(function(col,indexCol){
                if(indexCol>0)
                   str+="\t";
                if( indexLine==0)
                  str+=col;
                else
                    str+=line[col];

            })
            str+="\n";
        })
       console.log(str)

    });

/*const jsonArray=await csv().fromFile(csvFilePath);

var path = require('path');

var filePath="D:\\ATD_Baillet\\graphes\\Tableau_MagasinsUTF.csv"
var data=""+fs.readFileSync(filePath);

data=data.replace(/\r/gm,"");



var isMultilineText=false;
var str=""
for (var i=0;i< data.length;i++) {
    var char = data.charAt(i);
    if (char == "\"")
        isMultilineText = (!isMultilineText)

        if (char == "\n" && isMultilineText)
          var xx=1  ;
        else
            str += char;


}

console.log(str)*/

