var fs = require('fs');
var path = require('path');
var execSync = require('child_process').execSync;


var fileInfos = {

    getDirInfos: function (apath, callback) {
        var acls = {};
        if (path.sep == "\\") {//windows

            var regexExtractDate = /([0-9]+)/;
            var shell = require('node-powershell');

            var ps0 = new shell({
                executionPolicy: 'Bypass',
                noProfile: true
            });
            ps0.addCommand('dir -Path \"' + apath + '\"  | ConvertTo-Json')
            ps0.invoke()
                .then(function (output) {
                    var obj = JSON.parse(output);
                    for (var i = 0; i < obj.length; i++) {
                        var time = regexExtractDate.exec(obj[i].LastWriteTimeUtc)[0]
                        acls[obj[i].FullName] = {lastModifiedTime: time, length: obj[i].Length};


                    }
                    ps0.dispose();
                    var ps = new shell({
                        executionPolicy: 'Bypass',
                        noProfile: true
                    });
                    ps.addCommand('Get-ChildItem -Path \"' + apath + '\" | Get-Acl  | ConvertTo-Json')
                    ps.invoke()
                        .then(function (output) {
                            //   console.log(output);
                            var obj = JSON.parse(output);
                            ;

                            for (var i = 0; i < obj.length; i++) {
                                var path0 = obj[i].Path;
                                path0 = path0.substring(path0.indexOf("::") + 2)
                                acls[path0].group = obj[i].Group;
                                acls[path0].owner = obj[i].Owner;

                            }
                            ps.dispose();
                            return callback(null, acls)
                        })


                        .catch(function (err) {
                            console.log(err);
                            ps.dispose();
                            return  callback(err)
                        });
                }).catch(function (err) {
                console.log(err);
                ps0.dispose();
                return  callback(err)
            })







        }
        else {//others
            var cmd = 'find  '+apath+'/*.* -type f -exec stat -c "{!name!:!%n!,!size!:%s,!rights!:!%A!,!group!:!%G!,!user!:!%U!,!lastModifiedTime!:!%y!}," {} +'
            
            var outputStr = ""+execSync(cmd);
            outputStr="[" + outputStr.replace(/!/g,"\"") + "{}]";
            console.log(outputStr);
            var output = JSON.parse(outputStr);
            for (var i = 0; i < output.length; i++) {
                if(output[i].name){
                    var name=output[i].name.replace("//","/");
                    acls[name] = {
                        lastModifiedTime:  output[i].lastModifiedTime,
                        group: output[i].group,
                        owner: output[i].user,
                        length: output[i].size

                    }
                }
            }
            callback(null, acls)
        }
    }


    , getUserCredentials: function (user) {

    }

    , checkUserAccessToFile: function () {

    }
    ,getStringHash:function(str){

            var hash = 5381,
                i    = str.length;

            while(i) {
                hash = (hash * 33) ^ str.charCodeAt(--i);
            }

            /* JavaScript does bitwise operations (like XOR, above) on 32-bit signed
             * integers. Since we want the results to be always positive, convert the
             * signed int to an unsigned by doing an unsigned bitshift. */
            return hash >>> 0;


    }


}


module.exports = fileInfos;

if (false) {
    var apath = "";
    if (path.sep == "\\")
        apath = "D:\\GitHub\\souslesens\\public\\toutlesens\\images"
    else
        apath = "/var/lib/nodejs/souslesens/config/schemas/"

    fileInfos.getDirInfos(apath, function (err, result) {
        console.log(JSON.stringify(result, null, 2))
    });
}
if (false) {
    apath = "D:\\GitHub\\souslesens\\public\\toutlesens\\images"
   var xx= fileInfos.getStringHash(apath);
    console.log(xx);


}