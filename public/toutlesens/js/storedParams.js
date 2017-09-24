/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 ******************************************************************************/

var storedParams = (function(){
 var self = {};

//moved  var storedDecorationObjs = {};

   self.drawStoredParams=function(divId,callback){
    str="<table><tr><td><select id='storedParamsSelect'></select></td>" +
        "<button onclick='"+callback+"();'</tr></table>"

}
   self.loadStoredParams=function() {
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

common.fillSelectOptionsWithStringArray(storedParamsSelect, names);
            }


        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }

    });


}

   self.saveStoredParams=function(obj) {

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
 return self;
})()