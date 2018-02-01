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
var util = (function () {
    var self = {};
    var colSep = ",";
    var lineSep = "\n";
    var dataTable;
    var keyStr = "ABCDEFGHIJKLMNOP" +
        "QRSTUVWXYZabcdef" +
        "ghijklmnopqrstuv" +
        "wxyz0123456789+/" +
        "=";

    self.encode64 = function (input) {
        input = escape(input);
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        do {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";
        } while (i < input.length);

        return output;
    }

    self.decode64 = function (input) {
        var output = "";
        var chr1, chr2, chr3 = "";
        var enc1, enc2, enc3, enc4 = "";
        var i = 0;

        // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
        var base64test = /[^A-Za-z0-9\+\/\=]/g;
        if (base64test.exec(input)) {
            //  $("#message").css("color","green");
            //   $("#message").html("File is  accepted  : " +result);
            /*  alert("There were invalid base64 characters in the input text.\n" +
             "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
             "Expect errors in decoding.");*/
        }
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        do {
            enc1 = keyStr.indexOf(input.charAt(i++));
            enc2 = keyStr.indexOf(input.charAt(i++));
            enc3 = keyStr.indexOf(input.charAt(i++));
            enc4 = keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }

            chr1 = chr2 = chr3 = "";
            enc1 = enc2 = enc3 = enc4 = "";

        } while (i < input.length);

        return unescape(output);
    }


    self.countColSep = function (str, colSep) {
        var regex = new RegExp(colSep, "g")
        var match = str.match(regex);
        if (match)
            return match.length;
        return -1;
    }

    self.csv2json = function (csv, _colSep) {

        colSep = _colSep;
        var lines = csv.split(lineSep);
        var header = [];
        var headerSize;
        var objs = [];
        var obj = null;

        for (var i = 0; i < lines.length; i++) {
            var emptyCols = 0;
            lines[i] = lines[i].replace(/\r/g, "")
            var cols = lines[i].split(colSep);

            if (i == 0) {
                header = cols;

            } else {

                obj = {}
                for (var j = 0; j < cols.length; j++) {
                    var value = cols[j];
                    if (value)
                        value = value.trim();
                    if (cols[0] == "")
                        emptyCols += 1
                    value = common.convertNumStringToNumber(value);
                    obj[header[j]] = value;
                }
            }
            if (emptyCols > 0)// first col empty we stop
                break;
            if (cols.length != header.length) {
                return {error: "ERROR :line" + i + " has a wrong number of col separators :" + lines[i]}
            }
            if (obj)
                objs.push(obj);

        }
        return objs;


    }

    self.initDBsSelect = function (select, preffix) {
        if (false)
            return;
        var dbs = devisuProxy.getDBNames();
        var names = [];
        for (var i = 0; i < dbs.length; i++) {
            var name = dbs[i].name;
            if (!preffix || (preffix && name.indexOf(preffix) == 0))
                names.push(name);

        }
        common.fillSelectOptionsWithStringArray(select, names, true)
    }

    self.fillDataTable = function (header, dataSet, tableId) {
        $.fn.dataTable.ext.errMode = 'none';
        var columns = []
        for (var i = 0; i < header.length; i++) {
            columns.push({title: header[i]})
        }

        if (dataTable)
            dataTable.destroy();
        dataTable = $('#' + tableId).DataTable({
            data: dataSet,
            columns: columns,
            paging: true,
            searching: true

        });

        dataTable.columns.adjust().draw();
    }


    self.sortByField = function (data, field, desc) {
        var p = 1;
        if (desc)
            p = -1;
        var out = data.sort(function (a, b) {
            a = a[field];
            b = b[field];
            if (!a || !b)
                return 1;

            if (a > b)
                return 1 * p;
            if (a < b)
                return -1 * p;
            return 0;

        })
        return out;
    }


    self.find = function (data, field, value, firstValue, withoutIndexes) {
        var result = [];
        var indexes = []
        for (var i = 0; i < data.length; i++) {
            if (data[i][field] == value)
                if (firstValue) {
                    if (!withoutIndexes)
                        data[i].$findIndexes = [i];
                    return data[i];
                }
                else {
                    indexes.push(i);
                    result.push(data[i]);
                }

        }
        if (!withoutIndexes)
            result.$findIndexes = indexes;
        return result;
    }


    /**
     * Traverses a javascript object, and deletes all circular values
     * @param source object to remove circular references from
     * @param censoredMessage optional: what to put instead of censored values
     * @param censorTheseItems should be kept null, used in recursion
     * @returns {undefined}
     */
    self.preventCircularJson = function (source, censoredMessage, censorTheseItems) {
        //init recursive value if this is the first call
        censorTheseItems = censorTheseItems || [source];
        //default if none is specified
        censoredMessage = censoredMessage || "CIRCULAR_REFERENCE_REMOVED";
        //values that have allready apeared will be placed here:
        var recursiveItems = {};
        //initaite a censored clone to return back
        var ret = {};
        //traverse the object:
        for (var key in source) {
            var value = source[key]
            if (typeof value == "object") {
                //re-examine all complex children again later:
                recursiveItems[key] = value;
            } else {
                //simple values copied as is
                ret[key] = value;
            }
        }
        //create list of values to censor:
        var censorChildItems = [];
        for (var key in recursiveItems) {
            var value = source[key];
            //all complex child objects should not apear again in children:
            censorChildItems.push(value);
        }
        //censor all circular values
        for (var key in recursiveItems) {
            var value = source[key];
            var censored = false;
            censorTheseItems.forEach(function (item) {
                if (item === value) {
                    censored = true;
                }
            });
            if (censored) {
                //change circular values to this
                value = censoredMessage;
            } else {
                //recursion:
                value = self.preventCircularJson(value, censoredMessage, censorChildItems.concat(censorTheseItems));
            }
            ret[key] = value

        }

        return ret;
    }

    self.joinData = function (data1, key1, data2, key2, fields1, fields2, strict) {// if strict jointure ouverte
        if (!data1 || !data2)
            return null;
        var joinData = []
        for (var i = 0; i < data1.length; i++) {
            var obj1 = data1[i];
            var obj3 = {};
            for (var key in obj1) {
                obj3[key] = obj1[key];

            }

            var value = data1[i][key1];
            if (data1[i].id == 104) {
                var xx = "aaa"

            }
            var objs2 = self.find(data2, key2, value);
            if (objs2.length == 0 && !strict)
                joinData.push(obj3);
            else {

                for (var j = 0; j < objs2.length; j++) {
                    var obj2 = objs2[j];
                    for (var key in obj2) {// on n'écrase pas avec obj2 les champs existant das obj1

                        if (!obj3.key) {


                            obj3[key] = obj2[key];
                        }
                    }
                    joinData.push(obj3);

                }

            }

        }
        joinData.key=key2;
        return joinData;
    }

    self.convertHyperlinks = function (str) {
        if (common.isNumber(str))
            return str;

        var regex = /http.+?(?= )/g


        var array = str.match(regex);
        if (array) {
            for (var i = 0; i < array.length; i++) {
                str = str.replace(array[0], "<a  target='_blanck' href='" + array[0] + "'>" + array[0] + "</a>")
            }
        }


        return str;
    }


    self.addTabToTab=function(newTabName,newTabId,toTabDiv){
        $("<li><a href='#"+newTabId+"'>"+newTabName+"</a></li>")
            .appendTo("#"+toTabDiv);
        $("<div id='"+newTabId+"'>aa</div>").appendTo("#"+toTabDiv);
        $("#"+toTabDiv).tabs("refresh");
    }

    /*self.removeTabFromTab=function(newTabId,fromTabDiv){
        $()
        $("<li><a href='#"+tabId+"'>"+newTabName+"</a></li>")
            .appendTo("#"+toTabDiv);
        $("<div id='\"+tabId+\"'>????</div>").appendTo("#"+toTabDiv);
        $("#"+toTabDiv).tabs("refresh");
    }*/

    return self;
})();