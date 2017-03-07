/**
 * Created by claud on 24/02/2017.
 */
var storedDecorationObjs = {};

function drawStoredParams(divId,callback){
    str="<table><tr><td><select id='storedParamsSelect'></select></td>" +
        "<button onclick='"+callback+"();'</tr></table>"

}
function loadStoredParams() {
    return;
    var payload = {"load": "displayParams", "user": Gparams.user};
    $.ajax({
        type: "POST",
        url: Gparams.storedParamsUrl,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            storedDecorationObjs = data;
            var names = [];
            for (var key in data) {
                names.push(key);
            }
            if (names.length > 0) {
                if (!currentlabel)
                  //  $("#storedParamsSelect").tabs("option", "active", 1);

                fillSelectOptionsWithStringArray(storedParamsSelect, names);
            }


        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }

    });


}

function saveStoredParams(obj) {

    var payload = {save: "displayParams", obj: JSON.stringify(obj), "user": Gparams.user};
    $.ajax({
        type: "POST",
        url: Gparams.storedParamsUrl,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var xx = data;


        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }

    });


}