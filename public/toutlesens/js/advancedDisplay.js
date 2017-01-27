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
var data;
var propertyType = "";
var nClasses = 5;
var distinctPropertyValues = [];
var currentlabel;
var propertyRange = {
    min: 10000000,
    max: -10000000
};

var intPattern = /-?[0-9]+/
var rangePattern = /-?[0-9]+_-?[0-9]+/
var decorationObjs = [];
var storedDecorationObjs = {};
function loadStoredDecorationObjs() {
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
                    $("#graphDecorationTabsDiv").tabs("option", "active", 1);

                fillSelectOptionsWithStringArray(storedDecorationObjsSelect, names);
            }


        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
        }

    });


}


function saveDisplaySet() {
    var name = $("#storedDecorationObjsName").val();
    var description = $("#storedDecorationObjsDescription").val();
    var scope = $("#storedDecorationObjsScope").val();
    $("#dialogAdvancedSearch").dialog("close");
    if (!name || name == "") {
        $("#dialogMessage").html("le nom est obligatoire");
        return;
    }
    var obj = {
        name: name,
        value: decorationObjs,
        description: description,
        scope: scope
    };

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


function loadGraphDisplaylabels() {
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
    fillSelectOptionsWithStringArray(nodesLabelsSelect, labels);

}
function onLabelClick(select) {
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
    fillSelectOptionsWithStringArray(nodesLabelsPropertiesSelect, props);

}

function setNoClasses(){
    nClasses=-1;
    onPropertyClick(nodesLabelsPropertiesSelect,true)
}
function onPropertyClick(select, noClasses) {
    propertyRange = {
        min: 10000000,
        max: -10000000,
    };
    decorationObjs = [];
    distinctPropertyValues = [];
    var pattern = /_[0-9]*/;
    currentlabel = $("#nodesLabelsSelect").val();
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
                node.name = node.nom;
            if (pattern.test(node.name) == true)
                continue;
            if (node[property] && !propertyType) {
                if ( !noClasses && isInt(node[property]) && nClasses > 0) {
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
        fillSelectOptionsWithStringArray(graphDecorationValues, distinctPropertyValues);

    }
    else if (propertyType == "number") {
     //   propertyRange=roundRange(propertyRange);
     //   setNumberOfclasses(propertyRange.nClasses)
       // $("#nClasses").val(propertyRange.nClasses)
        var classes = buildRangeClasses(propertyRange, nClasses);
        fillSelectOptionsWithStringArray(graphDecorationValues, classes);

    } else

        fillSelectOptionsWithStringArray(graphDecorationValues, []);
}

function buildRangeClasses(propertyRange, n) {
    var size = propertyRange.max - propertyRange.min;
    var classes = [];
    for (var i = 0; i < n; i++) {
        var min = Math.round(propertyRange.min + ((size / n) * i));
        var max = Math.round(propertyRange.min + ((size / n) * (i + 1)));
        var aClass = min + "_" + max;
        if (max - min >= 1)
            classes.push(aClass);
    }
    return classes

}


function setPropertyValueOptionColor() {
    document.getElementById('graphDecorationColor').jscolor.hide()

    var color = "#" + $("#colorInput").val();
    var value = $("#graphDecorationValues").val();
    if (!value)
        return;
    var i = $("#graphDecorationValues").prop('selectedIndex');
    $("#graphDecorationValues").val("");
    $("#graphDecorationValues option:eq(" + i + ")").css("backgroundColor", color);
    setPropertyValueAttr(value, color, "none", "none");

}


function setPropertyValueOptionSize() {
    var size = $("#graphDecorationSize").val();
    var value = $("#graphDecorationValues").val();
    if (!value)
        return;
    var i = $("#graphDecorationValues").prop('selectedIndex');
    $("#graphDecorationValues option:eq(" + (i++) + ")").text(value + ";size" + size);
    setPropertyValueAttr(value, "none", size, "none");
}


function setAutoRangeColors() {
    var p = d3.scale.category10();
    var r = p.range();
    var i = 0;
    $("#graphDecorationValues option").each(function () {
        var value = $(this).val();
        //  $(this).css("fill", r[i])
        $("#graphDecorationValues option:eq(" + i + ")").css("backgroundColor", r[i]);
        setPropertyValueAttr(value, r[i++], "none", "none");
    });
    showGraphDecorationObjs();
}
function setAutoRangeSize() {
    var size = $("#graphDecorationSize").val();
    if (!size || size == "")
        size = 20;
    else
        size = parseInt(size);
    var i = 0;
    $("#graphDecorationValues option").each(function () {
        var value = $(this).val()
        $("#graphDecorationValues option:eq(" + (i++) + ")").text(value + ";size" + size);

        setPropertyValueAttr(value, "none", size += 10, "none");
    });
    showGraphDecorationObjs();
}


function setAutoAllColors() {
    var color = $("#graphDecorationColor").val();
    var i = 0;
    $("#graphDecorationValues option").each(function () {
        var value = $(this).val();
        $("#graphDecorationValues option:eq(" + i + ")").css("backgroundColor", color);
        setPropertyValueAttr(value, color, "none", "none");
    });
    showGraphDecorationObjs();
}

function setAutoAllSize() {
    var size = $("#graphDecorationSize").val();
    var i = 0;
    $("#graphDecorationValues option").each(function () {
        var value = $(this).val();
        setPropertyValueAttr(value, "none", size, "none");
    });
    showGraphDecorationObjs();
}
function setAutoAllShape() {
    var shape = $("#graphDecorationShape").val();
    var i = 0;
    $("#graphDecorationValues option").each(function () {
        var value = $(this).val();
        setPropertyValueAttr(value, "none", "none", shape);
    });
    showGraphDecorationObjs();
}


function setPropertyValueAttr(value, color, size, shape) {

    var label = $("#nodesLabelsSelect").val();
    var property = $("#nodesLabelsPropertiesSelect").val();
    if (!value)
        value = $("#graphDecorationValues").val();
    if (rangePattern.test(value))
        value = value;
    else if (isInt(value))
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
        var p = decorationObj.value.indexOf("_");
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

function clearGraphDecorationValues() {
    decorationObjs = [];
    document.getElementById("graphDecorationValues").options.length = 0;
}

function showGraphDecorationObjs(_decorationObjs) {
    /*    if (_decorationObjs)
     decorationObjs = decorationObjs;
     var strArray = [];
     for (var i = 0; i < decorationObjs.length; i++) {
     var obj = decorationObjs[i];
     strArray.push(JSON.stringify(obj));

     }
     fillSelectOptionsWithStringArray(graphDecorationDoneValues, strArray);*/
}


function showPaletteDialog() {// ??

}

function setNumberOfclasses(nClasses) {
    if(!nClasses)
        nClasses = parseInt($("nClassesInput").val());
    var classes = buildRangeClasses(propertyRange, nClasses);
    onPropertyClick(nodesLabelsPropertiesSelect);
    // fillSelectOptionsWithStringArray(graphDecorationValues, classes);
}


function initDecorationDiv() {
    data = window.parent.cachedResultArray;
    dataModel = window.parent.dataModel;
    loadStoredDecorationObjs();
    // initNeoModel(subGraph);
    if (!currentlabel) {
        loadGraphDisplaylabels();
    }
    else {
        $("#graphDecorationTabsDiv").tabs("option", "active", 0);

    }

}


function execute() {
    var groupByClass = $("#groupByClassCBx").prop("checked");
    setDataDecoration(groupByClass);
    if($("#crossLabel").prop("checked"))
    $('#groupByLabelsCbx', window.parent.document).prop("checked","checked");

    window.parent.hideAdvancedDisplay();
    window.parent.prepareRawDataAndDisplay(data);
    window.parent.drawDecorationLegend(decorationObjs);


}

function executeStoredDecorationObjs() {
    var name = $("#storedDecorationObjsSelect").val();
    decorationObjs = storedDecorationObjs[name].value;
    execute();
}


function onStoredDecorationObjsSelect() {



    var name = $("#storedDecorationObjsSelect").val();
    var text = storedDecorationObjs[name].description;
    setPropertyValueAttr(storedDecorationObjs[name].value)
    $("#storedDecorationObjsTA").html(text);
}


function setDataDecoration(groupByClass) {
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


                    if (isInt(value) && decorationObj.type == "range") {

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


function isInt(value) {
    return intPattern.test("" + value);
}

function roundRange(range) {

    var magnMin = ("" + Math.abs(range.min)).length;
    var magnMax = ("" + Math.abs(range.max)).length;
    var value0 = Math.pow(10, magnMin - 1);
    var value1 = Math.pow(10, magnMax - 1);
    var value0 = Math.floor(range.min / value0) * value0;
    var value1 = Math.ceil(range.max / value1) * value1;
    var nclasses=Math.abs((value0-value1)/ Math.pow(10, magnMin - 1))
    return {min: value0, max: value1,nClasses:nClasses};
}
