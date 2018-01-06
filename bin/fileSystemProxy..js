
var fs=require("fs")


var fileSystemProxy={
    getFileContent:function(path,callback){
       fs.readFile(path,{},function (err,result){
           if(err)
              return callback(err);
           return callback(null,""+result)
       })

    }

    ,

    saveFileContent:function(path,data,callback) {
        fs.writeFile(path, data, {}, function (err, result) {
            if (err)
                return callback(err);
            return callback(null, "" + result)
        })
    }

}

module.exports=fileSystemProxy;





