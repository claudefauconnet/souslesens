/**
 * Created by claud on 17/01/2017.
 */
var neo=require('./neoProxy.js');
var fs=require('fs');

var data=fs.readFileSync("D://relations0.cypher");
data=""+data;
neo.match(data);



var path = "/db/data/batch";
var payload = [];
for (var i = 0; i < relations.length; i++) {


    var neoObj = {
        method: "POST",
        to: "/node/" + relations[i].sourceId + "/relationships",
        id: 3,
        body: {
            to: "" + relations[i].targetId,
            data: relations[i].data,
            type: relations[i].type
        }
    }
    // console.log(JSON.stringify(neoObj));
    payload.push(neoObj);

}
