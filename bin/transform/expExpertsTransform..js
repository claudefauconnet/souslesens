var fs = require('fs');
var request = require('request');
var souslesensRestAPI = require('../restAPI.js');

var inputFileTest = "D:\\Framatome\\import\\expAnonyms.csv";
var pseudosFileTest = "D:\\Framatome\\import\\pseudos.csv"


var neo4jUrl = 'http://neo4j:souslesens@127.0.0.1:7474/db/data/cypher';

function toCsv(file) {
    var data = "" + fs.readFileSync(file);


    var strExperts = "name\tjobTitle\tage2018\tlevel\tBU\tdivision\tsite\tcountry\tManagerName\tdomainId\tdomain\tCompetences\tCompetencesIn\n";
    var strKeyWords = "name\tkeyword\n";
    var strSubDomains = "name\tdomain\tsubDomain\n";
    var strCompetences = "name\tdomain\tsubDomain\n";
    var lines = data.split("\n");

    for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();


        if (line.length < 50)
            break;

        var cols = line.split("\t");


        for( var k=0;k<cols.length;k++){

            if(k!=1 && k!=12)
            strExperts += cols[k] + "\t"
        }
        strExperts+= domainId  + "\n";
      //  strExperts += cols[0] + "\t" + cols[2] + "\t" + cols[3] + "\t" + cols[4] + "\t" + cols[5] + "\t" + cols[6] + "\t" + cols[7]+ "\t" + cols[8]  + "\t" + domainId  + "\n";


        var colKeyWords = cols[1];

        colKeyWords = colKeyWords.replace(/[,//]/g, ";");
        var keywords = colKeyWords.split(";")
        for (var k = 0; k < keywords.length; k++) {
            if (keywords[k].length > 0)
                strKeyWords += cols[0] + "\t" + keywords[k] + "\n"
        }


        if (cols.length >12) {
            //  console.log("errors cols");


            var domainId = cols[12].substring(0, cols[12].indexOf("-")).trim();
            //   for (var j = 0; j < cols.length; j++) {
            var colSubDomains = cols[12];
            var subDomains = colSubDomains.split(";")
            for (var k = 0; k < subDomains.length; k++) {
                if (subDomains[k].length > 0) {
                    var subDomain = subDomains[k];
                    //  subDomain = subDomain.replace(/ - XXX/g, "").trim();
                    var p = subDomain.indexOf(".")
                    if (p > 0) {
                        strSubDomains += cols[0] + "\t" + subDomain.substring(0, p) + "\t" + subDomain + "\n"
                    }
                    else {
                        strSubDomains += cols[0] + "\t" + "" + "\t" + subDomain + "\n"
                        console.log("no domain for subdomain " + subDomain + "user " + cols[0]);
                    }

                }

            }
        }

      /*  var colCompetences = cols[12];
        var competences = colCompetences.split(";")
        for (var k = 0; k < competences.length; k++) {
            if (competences[k].length > 0) {
                var competence = competences[k];
                //  subDomain = subDomain.replace(/ - XXX/g, "").trim();
                var p = competence.indexOf(".")
                if (p > 0) {
                    strCompetences += cols[0] + "\t" + subDomain.substring(0, p) + "\t" + subDomain + "\n"
                }
                else{
                    strSubDomains += cols[0] + "\t" + "" + "\t" + subDomain + "\n"
                    console.log("no domain for subdomain "+subDomain+ "user "+ cols[0]);
                }

            }

        }*/


        // }


    }

    var rootPath = file.substring(0, file.lastIndexOf("\\") + 1);
    // console.log("rootPath :" + rootPath);
    fs.writeFileSync(rootPath + "main.csv", strExperts);
    fs.writeFileSync(rootPath + "keyWords.csv", strKeyWords);
    fs.writeFileSync(rootPath + "subDomains.csv", strSubDomains);
    console.log("DONE csv import files are in " +rootPath);
}

function anonym2Real(file, inverse) {
    var subGraph="experts";
    var colSource = 0;
    var colTarget = 1;
    if (inverse) {
        colSource = 1;
        colTarget = 0;
    }
    var data = "" + fs.readFileSync(file);
    var statements = [];
    var lines = data.split("\n");


    var pseudCols = {
        name: [],
        domain: [],
        subDomain: []
    }
    for (var i = 1; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.length < 10)
            break;
        var cols = line.split("\t");
        if (cols < 3)
            continue;

        pseudCols[cols[2]].push({source: cols[colSource], target: cols[colTarget]});

        /*    var str = "MATCH (n) where n.name=\"" + cols[colSource] + "\" set  n." + cols[2] + "=\"" + cols[colTarget] + "\"";
            var statement = {statement: str};
            statements.push(statement);*/
    }

    //   var payload = {statements: statements};
    for (var key in pseudCols) {

        var dataStr = JSON.stringify(pseudCols[key]).replace(/\"source\"/g, "source").replace(/\"target\"/g, "target");
        var matchStatement = "WITH " + dataStr + " AS pairs UNWIND pairs AS p MATCH (n) WHERE n.name = p.source and n.subGraph=\""+subGraph+"\"SET n." + key + " = p.target ";
        console.log(matchStatement);

        var payload = {query: matchStatement}
        request({
                url: neo4jUrl,
                json: payload,
                method: 'POST',
            },
            function (err, res) {

                if (err)
                    console.log(err)
                else if (res.body && res.body.errors && res.body.errors.length > 0) {
                    console.log(JSON.stringify(res.body.errors))
                    console.log(res.body.errors)
                }
                else
                    console.log(null, res.body)
            });

    }


    console.log("DONE");
}

importCSVtoNeo = function () {

    /* updateNeoFromCSV: function (params, callback) {

          fileName: " not needed if mappings is present. Name of the original file else ignored: used to find recorded mappings (MUST end with .csv)",
             mappings: "JSON of mappings between csv or mongo and Neo4j: this json can be generated with exportMappings request. if present and not empty fileName is not needed",
             csvData: "the CSV content URIencoded",
             subGraph: "name of the subGraph : can be different from the recorded one",*/
    var rootPath = inputFileTest.substring(0, inputFileTest.lastIndexOf("\\") + 1);
    var csvData = "" + fs.readFileSync(rootPath + "main.csv");
    csvData = encodeURI(csvData);
    var params = {

        mappings: JSON.stringify(mappingMain),
        csvData: csvData,
        subGraph: "experts2"


    }
    souslesensRestAPI.updateNeoFromCSV(params, function (err, result) {
        if (err)
            return console.log(err);
        return result;

    })
}


var mappingMain = {
    "Nodes_experts.people_name": {
        "mongoDB": "main.csv",
        "type": "node",
        "request": {
            "mongoCollectionNode": "main.csv",
            "exportedFields": "all",
            "mongoField": "name",
            "mongoKey": "name",
            "distinctValues": "true",
            "mongoIdField": "name",
            "label": "people",
            "mongoQuery": "{}",
            "subGraph": "experts"
        },
        "name": "Nodes_experts.people_name",
        "date": "Thu May 24 2018 18:41:09 GMT+0200 (Paris, Madrid (heure d’été))"
    },
    "Nodes_experts.division_division": {
        "mongoDB": "main.csv",
        "type": "node",
        "request": {
            "mongoCollectionNode": "main.csv",
            "exportedFields": "BU",
            "mongoField": "division",
            "mongoKey": "division",
            "distinctValues": "true",
            "mongoIdField": "division",
            "label": "division",
            "mongoQuery": "{}",
            "subGraph": "experts"
        },
        "name": "Nodes_experts.division_division",
        "date": "Thu May 24 2018 18:42:40 GMT+0200 (Paris, Madrid (heure d’été))"
    },
    "Nodes_experts.site_site": {
        "mongoDB": "main.csv",
        "type": "node",
        "request": {
            "mongoCollectionNode": "main.csv",
            "exportedFields": "country",
            "mongoField": "site",
            "mongoKey": "site",
            "distinctValues": "true",
            "mongoIdField": "site",
            "label": "site",
            "mongoQuery": "{}",
            "subGraph": "experts"
        },
        "name": "Nodes_experts.site_site",
        "date": "Thu May 24 2018 18:43:04 GMT+0200 (Paris, Madrid (heure d’été))"
    },
    "Rels_experts.people->site:locatedIn": {
        "mongoDB": "main.csv",
        "type": "relation",
        "request": {
            "mongoCollectionRel": "main.csv",
            "mongoSourceField": "name",
            "neoSourceKey": "name",
            "neoSourceLabel": "people",
            "mongoTargetField": "site",
            "neoTargetLabel": "site",
            "neoTargetKey": "site",
            "relationType": "locatedIn",
            "neoRelAttributeField": "",
            "mongoQueryR": "{}",
            "subGraph": "experts"
        },
        "name": "Rels_experts.people->site:locatedIn",
        "date": "Thu May 24 2018 18:43:52 GMT+0200 (Paris, Madrid (heure d’été))"
    },
    "Rels_experts.people->division:worksIn": {
        "mongoDB": "main.csv",
        "type": "relation",
        "request": {
            "mongoCollectionRel": "main.csv",
            "mongoSourceField": "name",
            "neoSourceKey": "name",
            "neoSourceLabel": "people",
            "mongoTargetField": "division",
            "neoTargetLabel": "division",
            "neoTargetKey": "division",
            "relationType": "worksIn",
            "neoRelAttributeField": "",
            "mongoQueryR": "{}",
            "subGraph": "experts"
        },
        "name": "Rels_experts.people->division:worksIn",
        "date": "Thu May 24 2018 18:44:31 GMT+0200 (Paris, Madrid (heure d’été))"
    },
    "Nodes_experts.domain_domain": {
        "mongoDB": "main.csv",
        "type": "node",
        "request": {
            "mongoCollectionNode": "main.csv",
            "exportedFields": "none",
            "mongoField": "domain",
            "mongoKey": "domain",
            "distinctValues": "true",
            "mongoIdField": "domain",
            "label": "domain",
            "mongoQuery": "{}",
            "subGraph": "experts"
        },
        "name": "Nodes_experts.domain_domain",
        "date": "Thu May 24 2018 18:55:57 GMT+0200 (Paris, Madrid (heure d’été))"
    },
    "Rels_experts.people->domain:hasDomain": {
        "mongoDB": "main.csv",
        "type": "relation",
        "request": "{\n\"mongoCollectionRel\":\"main.csv\",\"mongoSourceField\":\"name\",\"neoSourceKey\":\"name\",\"neoSourceLabel\":\"people\",\"mongoTargetField\":\"domain\",\"neoTargetLabel\":\"domain\",\"neoTargetKey\":\"domain\",\"relationType\":\"hasDomain\",\"neoRelAttributeField\":\"\",\"mongoQueryR\":\"{}\",\"subGraph\":\"experts\"}",
        "name": "Rels_experts.people->domain:hasDomain",
        "date": "Thu May 24 2018 18:56:48 GMT+0200 (Paris, Madrid (heure d’été))"
    }
}


//**********************************************Command Line args***********************************
const args = process.argv;
if (args.length > 2) {
    var file = args[3];
    if (args[2] == "toCsv") {
        toCsv(file);
    }

    else if (args[2] == "anonym2Real") {
        anonym2Real(file);
    }
    else if (args[2] == "real2anonym") {
        anonym2Real(file, true);
    }


}
else {
    var message = "usage  :\n toCsv  inputFile -> generates files csv for souslesens import\n from inputFile";
    message += "anonym2Real peudosFile  -> replaces pseudos by real values of peudosFile\n";
    message += "Real2anonym peudosFile  -> replaces real values by pseudo of peudosFile\n";
    console.log(message)
}


if (true) {
    toCsv(inputFileTest);
}
if (false) {
    anonym2Real(pseudosFileTest, true);
}

if(false){
    importCSVtoNeo();
}



