var users=(function(){

    var self={};
    var options= { mode: 'code'}
    self.editor ;


    self.loadUsersJson=function(){
        var serverRootUrl="";
        var path = "./config/users/users.json";
        var paramsObj = {
            path: path,
            retrieve: true,

        }

        $.ajax({
            type: "POST",
            url: "../.." + serverRootUrl + "/jsonFileStorage",
            data: paramsObj,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                var json = data;
                self.editor.set(json);
            },

            error: function (err) {
                console.log(err);

            }
        })

    }

    self.saveUsersJson=function(){
        var serverRootUrl="";
        var json=self.editor.get();
        var path = "./config/users/users.json";
        var paramsObj = {
            path: path,
            store: true,
            data:json

        }
        var serverRootUrl="";
        $.ajax({
            type: "POST",
            url: "../.." + serverRootUrl + "/jsonFileStorage",
            data: paramsObj,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                console.log("file saved")
            },

            error: function (err) {
                console.log(err);

            }
        })
    }







    return self;



})()
