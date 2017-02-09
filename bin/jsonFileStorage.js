/**
 * Created by claud on 07/02/2017.
 */

var fs=require('fs');


var jsonFileStorage={

    store:function(path,json,callback){
        try {
            fs.writeFileSync(path, JSON.stringify(json));
            callback(null, "file saved")
        }
        catch(e){
            callback(e)
        }
    },
    retreive:function(path,callback){

        try {
            var str=fs.readFileSync(path)
            callback(null, JSON.parse(""+str))
        }
        catch(e){
            callback(e)
        }
    }





}
module.exports=jsonFileStorage;
