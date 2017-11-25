/*******************************************************************************
 * SOUSLESENS LICENCE************************
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
/*var Gparams = {
 neo4jProxyUrl: "../http",
 };*/
var newSubgraph="";
function downloadNodeJson(outputType, outputObj) {
    var limit = parseInt($("#limit").val())
    var subGraphExport = $("#subGraphExportSelect").val();
    var whereSubGraph ="";
    if(subGraphExport!="")
     whereSubGraph = " where n.subGraph=\"" + subGraphExport + "\" ";
    var whereLabel = setWhereLabels();

     newSubgraph=prompt("import in subGraph ",subGraphExport);
if(newSubgraph==null)
    return;

    var match = "MATCH (n) " + whereSubGraph + whereLabel
        + "return  n,ID(n)  limit " + limit;
    console.log(match);
    callNeoMatch(match,null, function (data) {
        for(var i=0;i<data.length;i++){
            if(  data[i].n.properties )
            data[i].n.properties.subGraph=newSubgraph;

        }
        download(JSON.stringify(data),newSubgraph+".nodes.cypher", "text/plain");
       // download(newSubgraph+".nodes.cypher",JSON.stringify(data));
      /*  callExportToNeo("copyNodes", data, function (result) {
            var xx = result;

        });*/

    });

}


function downloadRelJson(outputType, outputObj) {
    var limit = parseInt($("#limit").val())
    var subGraphExport = $("#subGraphExportSelect").val();
    var whereSubGraph = " where n.subGraph=\"" + subGraphExport + "\" ";
    var match = "MATCH (n)-[r]->(m)" + whereSubGraph +""
        + " return  r limit " + limit;
    console.log(match);
    callNeoMatch(match,null, function (data) {
        download(JSON.stringify(data),newSubgraph+".relations.cypher", "text/plain");
       // download(newSubgraph+".relations.cypher",JSON.stringify(data));


    });

}


function setWhereLabels() {
    var exportedLabels = [];
    var exportCbxes = $("[name=labelCbx]");
    for (var i = 0; i < exportCbxes.length; i++) {
        if (exportCbxes[i].checked) {
            exportedLabels.push(exportCbxes[i].value);
        }
    }
    var whereLabel = " and (";
    for (var i = 0; i < exportedLabels.length; i++) {
        if(exportedLabels[i]=="")
            continue;
        if (i > 0)
            whereLabel += " OR ";

        var p=exportedLabels[i].indexOf(",");// multi labels
        if(  p>-1) {
            exportedLabels[i] = exportedLabels[i].substring(0, p);
            exportedLabels.push( exportedLabels[i].substring(p+1));
        }
        whereLabel += "n:" + exportedLabels[i];
    }
    whereLabel += ") ";
    return whereLabel;
}
function showResult(str, type) {
    download(type + ".cypher", str);
    if (str.length > 50000) {
        // console.log(str);

        str = str.substring(0, 50000)
            + "\n//*********** truncated***********************************";
    }
    $("#result").val(str);

}

function myStringify(objArray) {
    var str = "[";
    for (var i = 0; i < objArray.length; i++) {
        if (i > 0)
            str += ",";
        var j = 0;
        str += "{";
        for (var key in objArray[i]) {
            if (j++ > 0)
                str += ",";

            var val = objArray[i][key];
            if ($.isNumeric(val)) {
                if (("" + val).startsWith("0"))// pas de chiffre qui commence par 0 dans neo
                    val = ("" + val).substring(1);
                str += key + ":" + val;
            }
            else
                str += key + ":\"" + val + "\"";

        }
        str += "}";

    }
    str += "]";
    return str;

}

function downloadOld(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,'
        + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function onSubGraphExportSelect() {

    var subGraph = $("#subGraphExportSelect").val();
    $("#targetSubGraph").val(subGraph);
    setExportLabels(subGraph)
}

function setExportLabels(subGraph) {
    var checked = "checked='checked'";
    callNeoMatch(" MATCH (n) where n.subGraph=\"" + subGraph + "\" RETURN DISTINCT  LABELS(n) as name, COUNT(n) as count", null,function (labels) {
        str = "";
        str += "<table><tr align='center' class='italicSpecial'><td ><span class='bigger'>Noeuds</span></td><td>Inclure<br><input type='checkbox' checked='checked' id='#comuteAllFiltersNodesInclude' onchange='comuteAllCBXs(this)'></td>" +
            "</tr>";
        for (var i = 0; i < labels.length; i++) {
            str += "<tr align='center'>";
            str += "</td><td>" + labels[i].name + "(" + labels[i].count + ")";
            str += "<td><input type='checkbox' name='labelCbx' value='"
                + labels[i].name + "'" + checked  + "/> "

            str += "<td></tr>";
        }
        str += "<tr><td colspan='3' >&nbsp;</B></td></td></tr></table>";
        $("#labelsDiv").html(str);


    })
}

function comuteAllCBXs(caller) {
    var str = $(caller).attr("id");
    var status = $(caller).prop("checked");

    function comuteAll(cbxs, mode) {
        var relCbxes = $("[name=" + cbxs + "]");
        for (var i = 0; i < relCbxes.length; i++) {
            $(relCbxes[i]).prop("checked", mode);
        }

    }

    if (str == "#comuteAllFiltersNodesInclude")
        comuteAll("labelCbx", status);

}

function importOnServer(){
    var path=$("#importPathOnServer").val();
    if( path==""){
        $("#message").html("  server path is mandatory");
        return;
    }
    var payload = {
        serverPath: path,

    };
    $.ajax({
        type: "POST",
        url: Gparams.uploadToNeo,
        data: payload,
        dataType: "json",
        success: function (data, textStatus, jqXHR) {
            var xx = data;
            $("#message").html(data.result);
            $("#message").css("color", "green");
            if (callback)
                callback(null, data);
        },
        error: function (xhr, err, msg) {
            console.log(xhr);
            console.log(err);
            console.log(msg);
            if (err.result) {
                $("#message").html(err.result);
                $("#message").css("color", "red");

            }
            else {
                $("#message").html(err);

            }
            if (callback)
                callback(err, data);

        }
    })
}