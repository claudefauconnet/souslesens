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
           var str= JSON.stringify( Gparams);// for presentation
            json = JSON.parse(str);
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

        localStorage.setItem('toutlesensParams', JSON.stringify(editor.get(),null,2));
        Gparams = editor.get();
        $("#paramsMessage").html("parameters saved locally");

    }

    return self;


})();