var paramsController = (function () {
    var self = {}
    self.loadParams = function (edit) {

        var str = localStorage.getItem('toutlesensParams');
        var json = {}
        if (str) {
            json = JSON.parse(str);
            Gparams = json;
        }
        else {
            json = Gparams;
        }
        if (edit) {
            editor.set(json);
            $("#paramsMessage").html("");
        }
    }

    self.resetParams = function () {
        localStorage.removeItem('toutlesensParams');
        loadParams();
    }


    self.saveParams = function () {

        localStorage.setItem('toutlesensParams', editor.get());
        Gparams = editor.get();
        $("#paramsMessage").html("parameters saved locally");

    }

    return self;


})();