/**
 * Created by claud on 08/02/2017.
 */
var Discogs = require('disconnect').Client;


var db = new Discogs().database();
db.getRelease(176126, function(err, data){
    console.log(JSON.stringify(data));
});