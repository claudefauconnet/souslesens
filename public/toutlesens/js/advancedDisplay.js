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
var advancedDisplay = (function () {
    var self = {};

//moved  var data;
//moved  var propertyType = "";
//moved  var nClasses = 5;
//moved  var distinctPropertyValues = [];
//moved  var currentlabel;
    /*moved  var propertyRange = {
        min: 10000000,
        max: -10000000
    };*/

//moved  var intPattern = /-?[0-9]+/
//moved  var rangePattern = /-?[0-9]+~-?[0-9]+/
//moved  var decorationObjs = [];


    self.loadGraphDisplaylabels = function () {
        var labels = [];
        if (!data)
            return;
        for (var i = 0; i < data.length; i++) {
            var nodes = data[i].nodes;
            for (var j = 0; j < nodes.length; j++) {
                var nodeLabel = nodes[j].labels[0];

                if (labels.indexOf(nodeLabel) < 0)
                    labels.push(nodeLabel);
            }
        }
        common.fillSelectOptionsWithStringArray(nodesLabelsBISelect, labels);

    }
    self.onLabelClick = function (select) {
        $("#graphDecorationTabsDiv").tabs("option", "active", 0);
        propertyType = "";
        distinctPropertyValues = [];
        propertyRange = {
            min: 10000000,
            max: 0
        };
        decorationObjs = []


        // data=testData;
        var label = $(select).val();
        var props = dataModel.labels[label];
        var props = Schema.getLabelPropertiesNames(label)
        common.fillSelectOptionsWithStringArray(nodesLabelsPropertiesSelect, props);

    }

    self.setNoClasses = function () {
        nClasses = -1;
        self.onPropertyClick(nodesLabelsPropertiesSelect, true)
    }
    self.onPropertyClick = function (select, noClasses) {
        propertyRange = {
            min: 10000000,
            max: -10000000,
        };
        decorationObjs = [];
        distinctPropertyValues = [];
        var pattern = /__[0-9]*/;
        currentlabel = $("#nodesLabelsBISelect").val();
        var property = $(select).val();
        var propertyType = null;
        for (var i = 0; i < data.length; i++) {
            var nodes = data[i].nodes;
            for (var j = 0; j < nodes.length; j++) {
                var nodeLabel = nodes[j].labels[0];

                if (currentlabel != nodeLabel)
                    continue;
                var node = nodes[j].properties;
                if (!node.name)
                    node.name = node[Gparams.defaultNodeNameProperty];
                if (pattern.test(node.name) == true)
                    continue;
                if (node[property] && !propertyType) {
                    if (!noClasses && self.isInt(node[property]) && nClasses > 0) {
                        propertyType = "number"
                    } else
                        propertyType = "string"
                }

                if (propertyType == "string") {
                    if (distinctPropertyValues.indexOf(node[property]) < 0)
                        distinctPropertyValues.push(node[property]);
                }
                if (propertyType == "number" && node[property]) {
                    console.log(node[property])
                    propertyRange.min = Math.min(propertyRange.min, node[property]);
                    propertyRange.max = Math.max(propertyRange.max, node[property]);
                }

            }
        }

        if (propertyType == "string") {
            common.fillSelectOptionsWithStringArray(graphDecorationValues, distinctPropertyValues);

        }
        else if (propertyType == "number") {
            //   propertyRange=roundRange(propertyRange);
            //   setNumberOfclasses(propertyRange.nClasses)
            // $("#nClasses").val(propertyRange.nClasses)
            self.buildRangeClasses(propertyRange, nClasses);
            common.fillSelectOptionsWithStringArray(graphDecorationValues, classes);

        } else

            common.fillSelectOptionsWithStringArray(graphDecorationValues, []);
    }

    self.buildRangeClasses = function (propertyRange, n) {
        var size = propertyRange.max - propertyRange.min;
        var classes = [];
        for (var i = 0; i < n; i++) {
            var min = Math.round(propertyRange.min + ((size / n) * i));
            var max = Math.round(propertyRange.min + ((size / n) * (i + 1)));
            var aClass = min + "~" + max;
            if (max - min >= 1)
                classes.push(aClass);
        }
        return classes

    }


    self.setPropertyValueOptionColor = function () {
        document.getElementById('graphDecorationColor').jscolor.hide()

        var color = "#" + $("#colorInput").val();
        var value = $("#graphDecorationValues").val();
        if (!value)
            return;
        var i = $("#graphDecorationValues").prop('selectedIndex');
        $("#graphDecorationValues").val("");
        $("#graphDecorationValues option:eq(" + i + ")").css("backgroundColor", color);
        self.setPropertyValueAttr(value, color, "none", "none");

    }


    self.setPropertyValueOptionSize = function () {
        var size = $("#graphDecorationSize").val();
        var value = $("#graphDecorationValues").val();
        if (!value)
            return;
        var i = $("#graphDecorationValues").prop('selectedIndex');
        $("#graphDecorationValues option:eq(" + (i++) + ")").text(value + ";size" + size);
        self.setPropertyValueAttr(value, "none", size, "none");
    }


    self.setAutoRangeColors = function () {
        var p = d3.scale.category10();
        var r = p.range();
        var i = 0;
        $("#graphDecorationValues option").each(function () {
            var value = $(this).val();
            //  $(this).css("fill", r[i])
            $("#graphDecorationValues option:eq(" + i + ")").css("backgroundColor", r[i]);
            self.setPropertyValueAttr(value, r[i++], "none", "none");
        });
        self.showGraphDecorationObjs();
    }
    self.setAutoRangeSize = function () {
        var size = $("#graphDecorationSize").val();
        if (!size || size == "")
            size = 20;
        else
            size = parseInt(size);
        var i = 0;
        $("#graphDecorationValues option").each(function () {
            var value = $(this).val()
            $("#graphDecorationValues option:eq(" + (i++) + ")").text(value + ";size" + size);

            self.setPropertyValueAttr(value, "none", size += 10, "none");
        });
        self.showGraphDecorationObjs();
    }


    self.setAutoAllColors = function () {
        var color = "#" + $("#colorInput").val();
        var i = 0;
        $("#graphDecorationValues option").each(function () {
            var value = $(this).val();
            $("#graphDecorationValues option:eq(" + (i++) + ")").css("backgroundColor", color);
            self.setPropertyValueAttr(value, color, "none", "none");
        });
        self.showGraphDecorationObjs();
    }

    self.setAutoAllSize = function () {
        var size = $("#graphDecorationSize").val();
        var i = 0;
        $("#graphDecorationValues option").each(function () {
            var value = $(this).val();
            self.setPropertyValueAttr(value, "none", size, "none");
        });
        self.showGraphDecorationObjs();
    }
    self.setAutoAllShape = function () {
        var shape = $("#graphDecorationShape").val();
        var i = 0;
        $("#graphDecorationValues option").each(function () {
            var value = $(this).val();
            self.setPropertyValueAttr(value, "none", "none", shape);
        });
        self.showGraphDecorationObjs();
    }


    self.setPropertyValueAttr = function (value, color, size, shape) {

        var label = $("#nodesLabelsBISelect").val();
        var property = $("#nodesLabelsPropertiesSelect").val();
        if (!value)
            value = $("#graphDecorationValues").val();
        if (rangePattern.test(value))
            value = value;
        if (self.isInt(value))
            value = parseInt(value);
        if (!color)
            color = $("#graphDecorationColor").val();
        if (color & color.indexOf("#") < 0)
            color = "#" + color;
        if (!size)
            size = $("#graphDecorationSize").val();
        if (size)
            size = parseInt(size)
        if (!shape)
            shape = $("#graphDecorationShape").val();

        var type = "range";
        if (nClasses < 0)

            type = "value"

        var decorationObj = {

            label: label,
            property: property,
            value: value,
            color: color || "",
            size: size || "",
            shape: shape || "",
            type: type
        }

        if (type == "range") {
            var p = decorationObj.value.indexOf("~");
            decorationObj.RangeMin = parseInt(decorationObj.value.substring(0, p));
            decorationObj.RangeMax = parseInt(decorationObj.value.substring(p + 1));
        }

        var existing = false;
        for (var i = 0; i < decorationObjs.length; i++) {
            var obj = decorationObjs[i]
            if (obj.label == label && obj.property == property && obj.value == value) {
                existing = true;
                if (color && color != "none") {
                    decorationObjs[i].color = color;
                }
                if (size && size != "none") {
                    decorationObjs[i].size = size;
                }
                if (shape && shape != "none") {
                    decorationObjs[i].shape = shape;
                }
            }
        }
        if (!existing)
            decorationObjs.push(decorationObj);

    }

    self.clearGraphDecorationValues = function () {
        decorationObjs = [];
        document.getElementById("graphDecorationValues").options.length = 0;
    }

    self.showGraphDecorationObjs = function (_decorationObjs) {
        /*    if (_decorationObjs)
         decorationObjs = decorationObjs;
         var strArray = [];
         for (var i = 0; i < decorationObjs.length; i++) {
         var obj = decorationObjs[i];
         strArray.push(JSON.stringify(obj));

         }
         common.fillSelectOptionsWithStringArray(graphDecorationDoneValues, strArray);*/
    }


    self.showPaletteDialog = function () {// ??

    }

    self.setNumberOfclasses = function (nClasses) {
        if (!nClasses)
            nClasses = parseInt($("nClassesInput").val());
        self.buildRangeClasses(propertyRange, nClasses);
        self.onPropertyClick(nodesLabelsPropertiesSelect);
        // fillSelectOptionsWithStringArray(graphDecorationValues, classes);
    }


    self.initDecorationDiv = function () {
        data = toutlesensData.cachedResultArray;
        storedParams.loadStoredParams("decoration");
        if (!currentlabel) {
            self.loadGraphDisplaylabels();
        }
        else {
            $("#graphDecorationTabsDiv").tabs("option", "active", 0);

        }

    }


    self.executeDisplay = function () {
        var groupByClass = $("#groupByClassCBx").prop("checked");
        self.setDataDecoration(groupByClass);
        if (false && $("#crossLabel").prop("checked"))
            $('#groupByLabelsCbx', document).prop("checked", "checked");

        toutlesensDialogsController.hideAdvancedDisplay();
        toutlesensData.prepareRawDataAndDisplay(data);
        d3legend.drawDecorationLegend(decorationObjs);


    }

    self.executeStoredDecorationObjs = function () {
        var name = $("#storedDecorationObjsSelect").val();
        decorationObjs = storedDecorationObjs[name].value;
        execute();
    }


    self.onStoredDecorationObjsSelect = function () {


        var name = $("#storedDecorationObjsSelect").val();
        var text = storedDecorationObjs[name].description;
        self.setPropertyValueAttr(storedDecorationObjs[name].value)
        $("#storedDecorationObjsTA").html(text);
    }


    self.setDataDecoration = function (groupByClass) {
        console.log(JSON.stringify(decorationObjs));
        var isCrossLabel = $("#crossLabel").prop("checked")
        for (var k = 0; k < decorationObjs.length; k++) {
            var decorationObj = decorationObjs[k];
            for (var i = 0; i < data.length; i++) {
                var nodes = data[i].nodes;
                for (var j = 0; j < nodes.length; j++) {
                    var hasDecoration;
                    var nodeLabel = nodes[j].labels[0];
                    var nodeProperties = nodes[j].properties;
                    var value = nodeProperties[decorationObj.property];
                    if ((nodeLabel == decorationObj.label || isCrossLabel) && value) {
                        if (groupByClass)
                            decorationObj.groupOnGraph = true;


                        if (self.isInt(value) && decorationObj.type == "range") {

                            if (value >= decorationObj.RangeMin && value <= decorationObj.RangeMax)
                                data[i].nodes[j].decoration = decorationObj;

                        } else if (value == decorationObj.value || ("" + value).indexOf(decorationObj.value + "_") == 0) {
                            data[i].nodes[j].decoration = decorationObj;
                        }


                    } else {
                        data[i].nodes[j].decoration = {color: "#eee"};

                    }
                }
            }


        }


    }


    self.isInt = function (value) {
        return intPattern.test("" + value);
    }

    self.roundRange = function (range) {

        var magnMin = ("" + Math.abs(range.min)).length;
        var magnMax = ("" + Math.abs(range.max)).length;
        var value0 = Math.pow(10, magnMin - 1);
        var value1 = Math.pow(10, magnMax - 1);
        var value0 = Math.floor(range.min / value0) * value0;
        var value1 = Math.ceil(range.max / value1) * value1;
        var nclasses = Math.abs((value0 - value1) / Math.pow(10, magnMin - 1))
        return {min: value0, max: value1, nClasses: nClasses};
    }

    function saveStoredDecorationObjsDialog() {
        $("#dialog").dialog("option", "title", "enregistrer une representation");
        var str = "<table><tr><td>name</td><td><input id='storedDecorationObjsName'></input></td></tr>" +
            " <tr><td>description</td><td><textArea id='storedDecorationObjsDescription' <row='3' cols='30'></textArea></td></tr>" +
            " <tr><td>scope</td><td><select id='storedDecorationObjsScope'><option>public</option><option>private</option><option>groupe</option></select></td></tr>" +
            "<tr><td colspan=2'><span id='dialogMessage'></span></td></tr>"
        str += "</table><button onclick= saveDisplaySet()>OK</button>";
        $("#dialog").html(str);
        $("#dialog").dialog("open")//;.parent().position({ my: 'center', at: 'center', of: '#tabs-mainPanel' });
    }


    self.saveDisplaySet = function () {
        var obj = {
            name: $("#storedDecorationObjsName").val(),
            description: $("#storedDecorationObjsDescription").val(),
            scope: $("#storedDecorationObjsScope").val(),
            type: "decoration"
        }
        storedParams.saveStoredParams(obj);
    }

    return self;
})()