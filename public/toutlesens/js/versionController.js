var versionController = (function () {

    var self = {};

    self.versions = {}


    self.initVersions = function () {
        var xx = $("#findTabs");
        var xxx = $("#findTabs").find('#advancedQueriesTabLi');
        self.versions["1_googleLike"] = {
            hiddenElts: [
                //advancedQueriesDiv
                ($("#findTabs").find("li")[3]),
                $("#advancedQueriesDiv"),
                //highlightDiv
                ($("#tabs-analyzePanel").find("li")[2]),
                $("#highlightDiv"),
                //highlightDiv
                ($("#tabs-analyzePanel").find("li")[1]),
                $("#filterDiv"),


                /*  $("#paintAccordion").find("h3")[1],
                  $("#paintAccordion").find("div")[1],*/

            ]

        }

        self.versions["0_full"] = {
            hiddenElts: []
        }


    }


    self.applyVersion = function (version, show) {
        if (!version)
            version = Gparams.displayVersion;
        if (!self.versions[version])
            return alert("this version does not exist");
        var toHide = self.versions[version].hiddenElts;

        for (var i = 0; i < toHide.length; i++) {
            if (!show)
                $(toHide[i]).hide();
            else
                $(toHide[i]).show();
        }


    }

    self.displayAll = function () {
        for (var key in self.versions) {
            self.applyVersion(key, true);
        }
    }

    self.onDisplayVersionsSelect = function (select) {

        var version = $(select).val();
        if (version == "0_full") {
            self.displayAll();
        }
        else
            self.applyVersion(version)


    }
    self.initDisplayVersionsSelect = function () {
        $("#displayVersionsSelect").append($('<option>'));
        for (var key in self.versions) {
            $("#displayVersionsSelect").append($('<option>', {
                value: key,
                text: key
            }))
        }
        $("#displayVersionsSelect").val(Gparams.displayVersion)
    }

    return self;
})();