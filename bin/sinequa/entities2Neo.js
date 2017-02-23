/**
 * Created by claud on 21/02/2017.
 */
var exportMongoToNeoBatch = require('../exportMongoToNeo');
var fs = require('fs');
var path = require('path');
var neoImportObjects = require('../neoImportObjects.js');


//***************************************Params****************************************************
var toProcessArray = [
    {
        sinequaFilePath: './neoNormes_surete.csv',
        neoSubGraph: 'SinequaSurete',
        regexArray: ['regexNormeInt', 'regexNormeExt', 'regexLegalLaw', 'regexLegalReg']
    }
];

var regeDefs = {
    regexNormeInt: {regex: "([GS|CR|LI]{2}[- ]MS[- ][A-Z]{3,4}[- ][0-9]{2,4})", sourceLabel: "internalStandard",targetLabel:"internalStandardX",relType:"refersTo"},
    regexNormeExt: {regex: "([GS|CR|LI]{2}[- ]MS[- ][A-Z]{3,4}[- ][0-9]{2,4})", sourceLabel: "internalStandard",targetLabel:"internalStandardX",relType:"refersTo"},
    regexLegalLaw: {regex: "(L. *[0-9]+-?[0-9]*-?[0-9]*)", sourceLabel: "law",targetLabel:"lawX",relType:"refersTo"},
    regexLegalReg: {regex: "(R. *[0-9]+-?[0-9]*-?[0-9]*)", sourceLabel: "regulation",targetLabel:"regulationX",relType:"refersTo"},
}

//******************************************************************************************



function parse(text, regex, sourceLabel, targetLabel,relType, subGraph){

    var lines = text.split('\n');
    var newObjs = [];

    for (var i = 0; i < lines.length; i++) {
        var p=lines[i].indexOf('\t');
        var filename=lines[i].substring(0,p);
        var line=lines[i].substring(p+1);
        var linkedDocs = [];
        /*      var array;
     while ((array = regex.exec(line)) !== null) {
                linkedDocs.push(array[0])
        }
        if (filename) {
            newObjs[filename] = linkedDocs;
        }*/

    var array=line.split(";");
    for(var i=0;i<array.length;i++){
        if(!array[i].match(/([0-9]*,[0-9]*)/) && linkedDocs.indexOf(array[i]<0) ){
            linkedDocs.push(array[i])
        }

    }
        if (filename) {
            newObjs[filename] = linkedDocs;
        }


    }

    writeNodesToNeo(newObjs, sourceLabel,targetLabel, relType, subGraph);

}


function writeNodesToNeo(newObjs, sourceLabel,targetLabel, relType, subGraph) {
    var nodesArray = [];
    var relsArray = [];
    for (var key in newObjs) {
        var obj = {
            nom: key,
            subGraph: subGraph,
            id: key
        }
        nodesArray.push(obj);
        for (var i = 0; i < newObjs[key].length; i++) {
            obj = {
                nom: newObjs[key][i],
                subGraph: subGraph,
                id: newObjs[key][i],
                label:sourceLabel
            }
            nodesArray.push(obj);

            var relObj = {
                source: key,
                target: newObjs[key][i],
                label:targetLabel
            }
            relsArray.push(relObj);


        }

    }
    neoImportObjects.writeNodesToNeoNodes( nodesArray, function (result) {
        var nodeMappings = result;

        var params = {
            sourceField: "source",
            targetField: "target",
            relationType: relType,
            neoRelAttributeField: "",
            sourceLabel:sourceLabel,
            targetLabel:targetLabel
        }
        neoImportObjects.importRelations(relsArray, nodeMappings, params, function (err, result) {
            if(err) {
                console.log(err);
            }else{
                console.log("imported "+result.length +" "+params.relationType);
            }
            var xx = result;
        });


    });
}





for (var i = 0; i < toProcessArray.length; i++) {
    var params = toProcessArray[i];
    var data = "" + fs.readFileSync(params.sinequaFilePath);
    for (var j = 0; j < params.regexArray.length; j++) {
        var regexObj=regeDefs[params.regexArray[j]]
        var regexStr = regexObj.regex;
        var regex = new RegExp(regexStr, 'gm');
        var subGraph = params.neoSubGraph;
        var sourceLabel=regexObj.sourceLabel;
        var targetLabel=regexObj.targetLabel;
        var relType=regexObj.relType;
        parse(data, regex, sourceLabel, targetLabel,relType, subGraph);
    }
}


