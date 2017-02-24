/**
 * Created by claud on 21/02/2017.
 */
var exportMongoToNeoBatch = require('../exportMongoToNeo');
var fs = require('fs');
var path = require('path');
var neoImportObjects = require('../neoImportObjects.js');
var existingNodes=[];

//***************************************Params****************************************************
var toProcessArray = [
    {
        sinequaFilePath: './normes_refMSX.csv',
        neoSubGraph: 'SinequaRefMS',
        regexArray: ['regexNormeInt']//, 'regexLegalReg']
    }

];

var regeDefs = {
    regexNormeInt: {regex: "([GS|CR|LI]{2}[- ]MS[- ][A-Z]{3,4}[- ][0-9]{2,4})", sourceLabel: "document",targetLabel:"internalStandard",relType:"refersTo"},
    regexNormeExt: {regex: "([GS|CR|LI]{2}[- ]MS[- ][A-Z]{3,4}[- ][0-9]{2,4})", sourceLabel: "document",targetLabel:"externalStandard",relType:"refersTo"},
    regexLegalLaw: {regex: "([L|R]. *[0-9]+-?[0-9]*-?[0-9]*)", sourceLabel: "document",targetLabel:"law",relType:"refersTo"},
    regexLegalReg: {regex: "(R. *[0-9]+-?[0-9]*-?[0-9]*)", sourceLabel: "document",targetLabel:"regulation",relType:"refersTo"},
}

//******************************************************************************************



function parse(text, regex, sourceLabel, targetLabel,relType, subGraph) {

    var lines = text.split('\n');
    var newObjs = [];

    for (var i = 0; i < lines.length; i++) {

        var cells = lines[i].split('\t');
        if (cells.length > 2) {
            for (var j = 0; j < cells.length; j++) {
                var obj = {
                    id: cells[0],
                    nom: cells[1]
            }
                var linkedDocs = [];
                var array;
                while ((array = regex.exec(cells[2])) !== null) {
                    linkedDocs.push(array[0])
                }
                obj.targets = linkedDocs;
                if(obj.targets.length>0)
                newObjs.push(obj);

            }
        }




    }
    writeNodesToNeo(newObjs, sourceLabel, targetLabel, relType, subGraph);
}


function writeNodesToNeo(newObjs, sourceLabel,targetLabel, relType, subGraph) {
    var nodesArray = [];
    var relsArray = [];
    var uniqueNodes=[];

    for (var i = 0; i < newObjs.length; i++) {
        var newObj = newObjs[i];

        var objNode = {
            nom: newObj.nom,
            subGraph: subGraph,
            id: newObj.id,
            label: sourceLabel
        }
        if(uniqueNodes.indexOf(objNode.id)<0) {
            uniqueNodes.push(objNode.id);
            nodesArray.push(objNode);
        }
        if (newObj.targets){
            for (var j = 0; j < newObj.targets.length; j++) {

                var target = newObj.targets[j];
                if(uniqueNodes.indexOf(target)<0) {
                    uniqueNodes.push(target);
                    var targetNode = {
                        nom: target,
                        subGraph: subGraph,
                        id: target,
                        label: targetLabel
                    }
                    nodesArray.push(targetNode);
                }
                var relObj = {
                    source: objNode.id,
                    target: target,

                }

                relsArray.push(relObj);


            }
    }

    }
    neoImportObjects.writeNodesToNeoNodes( nodesArray, function (result) {
        var nodeMappings = result;;
        for(var i=0;i<result.length;i++){
            existingNodes.push(result[i].mongoId);
        }

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


