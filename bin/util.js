/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
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
var fs = require('fs');
var ObjectID = require('mongodb').ObjectID;
Util = {

    prepareJsonForMongo: function (obj) {
        /*  if (!(typeof obj === "object"))
         obj = JSON.parse(obj);*/

        for (var key in obj) {

            var value = obj[key];
            if (!(typeof value === "object")) {
                if (key == "_id") {
                    /*  if(ObjectID.isValid(value))
                     obj[key] = new ObjectID(id);*/
                    var id = "" + obj[key];
                    if (id.length > 24)
                        id = id.substring(id.length - 24);


                    while (id.length < 24) {
                        id = "F" + id;
                    }
                    console.log(id);
                    obj[key] = new ObjectID.createFromHexString(id);
                    // obj[key] = new ObjectID(id);

                }

                else if (!isNaN(value) && value.indexOf) {
                    if (value.indexOf(".") > -1)
                        value = parseFloat(value)
                    else
                        value = parseInt(value)
                    obj[key] = value;
                }
            }
        }
    }
    ,
    base64_encodeFile: function (file) {
        // read binary data
        var bitmap = fs.readFileSync(file);
        // convert binary data to base64 encoded string
        return new Buffer(bitmap).toString('base64');
    }
    ,
    convertNumStringToNumber: function (value) {
        if (value.match && value.match(/.*[a-zA-Z\/\\$].*/))
            return value;
        if (Util.isInt(value))
            return parseInt(value)
        if (Util.isFloat(value))
            return parseFloat(value)
        if (value == "true")
            return true;
        if (value == "false")
            return false;
        return value;

    },
    isNumber: function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
    ,

    isInt: function (value) {
        return /-?[0-9]+/.test("" + value);

    },
    isFloat: function (value) {
        return /-?[0-9]+[.,]+[0-9]?/.test("" + value);

    },

     cleanFieldsForNeo:function(obj) {
    var obj2 = {};
    for (var key in obj) {

        var key2 = key.replace(/-/g, "_");

        key2 = key2.replace(/ /g, "_");
        if (key2 != "") {
            var valueObj = obj[key];

            var value = "" + valueObj;
            if (isNaN(valueObj)) {
                value = value.replace(/[\n|\r|\t]+/g, " ");
                value = value.replace(/&/g, " and ");
                value = value.replace(/"/g, "'");
                value = value.replace(/,/g, "\\,");
                value = value.replace(/\//g, "%2F");
                value = value.replace(/\\/g,"")
            }
            else if (value.indexOf(".") > -1)
                value = parseFloat(value)
            else
                value = parseInt(value)


            obj2[key2] = value;
        }
    }

    return obj2;

}

}
/*var array=[128,1430,8324]
for(var i=0;i<array.length;i++){
    var x=array[i]
    console.log(x+"  "+Math.round(Math.log10(x)));
}*/

module.exports = Util;