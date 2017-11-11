/**
 * Created by claud on 25/09/2017.
 */

var filters = (function () {
    var self = {};
    var currentPropertiesMap

    self.initGraphFilters = function (labels, relations) {
        $("#innerLegendDiv").html("");
        if (false && dontReInitFilterGraph == true)
            return;

        if (!labels) {
            console.log("!!! no labels for filters")
            return;//   labels = [currentLabel];
        }
        var str = "";
        var targetLabels = [];
        var relationTypes = [];

        targetLabels = labels;
        relationTypes = relations;
        /*   for (var j = 0; j < labels.length; j++) {
         var label = labels[j];
         if (Schema) {
         for (var key in Schema.schema.relations){
         var relation= Schema.schema.relations[key];


         }

         } else {/// old approach
         var relations = dataModel.relations[label];

         if (!relations)
         return;
         for (var i = 0; i < relations.length; i++) {
         if (relationTypes.indexOf(relations[i].relType) < 0)
         relationTypes.push(relations[i].relType);
         if (targetLabels.indexOf(label) < 0)
         targetLabels.push(label);

         }
         }
         }*/

        var checked = "' checked='checked' ";
        var onclick = " onclick='filters.startQueryFilterMode() '"
        onclick = "onclick='filters.onFilterCbxClik();'";
        var noChecked = "";
        str += "<table>"

        // str += "<tr class='italicSpecial'><td ><span
        // class='bigger'>Noeuds</span></td><td>Inclure</td><td>Exclure</td></tr>";
        str += "<tr align='center' class='italicSpecial'><td></td><td><span class='bigger'>Noeuds</span></td><td>Inclure<br><input type='checkbox' id='#comuteAllFiltersNodesInclude' checked='checked' onchange='filters.comuteAllFilters(this)'></td></tr>";//<td>Exclure<br><input type='checkbox' id='#comuteAllFiltersNodesExclude' onchange='filters.comuteAllFilters(this)'></td></tr>";
        for (var i = 0; i < targetLabels.length; i++) {
            str += "<tr align='center'>";
            str += "<td><button onclick='filters.labelDoMore(\"" + relationTypes[i] + "\")'>+</button></td>";
            str += "<td style='background-color:" + nodeColors[targetLabels[i]] + "'>" + targetLabels[i] + "</td>";
            str += "<td><input type='checkbox' name='graphNodesFilterCbx' value='"
                + targetLabels[i] + "'" + onclick + checked + "/></td> "
            /*   str += "<td>"
             + "<input type='checkbox' name='graphNodesFilterExcludeCbx' value='"
             + targetLabels[i] + "'" + onclick + noChecked + "/> "*/

            str += "</tr>";
        }
        str += "<tr><td colspan='3' >&nbsp;</B></td></td></tr>";

        // str += "<tr class='italicSpecial'><td colspan='3'><span
        // class='bigger'>Relations</span></tr>";
        str += "<tr align='center'  class='italicSpecial'><td></td><td><span class='bigger'>Relations</span></td><td>Inclure<br><input type='checkbox' id='#comuteAllFiltersRelationsInclude' checked='checked'  onchange='filters.comuteAllFilters(this)'></td></tr>";//<td>Exclure<br><input type='checkbox' id='#comuteAllFiltersRelationsExclude' onchange='filters.comuteAllFilters(this)'></td></tr>";

        for (var i = 0; i < relationTypes.length; i++) {
            str += "<tr align='center'>";
            var key = relationTypes[i];
            var relKey = relationTypes[i];
            var p = relKey.indexOf("#");
            if (p > -1)
                relKey = relKey.substring(0, p);
            str += "<td><button onclick='filters.relDoMore(\"" + relationTypes[i] + "\")'>+</button></td>";
            str += "<td style='background-color:" + linkColors[relKey] + "'>" + relationTypes[i] + "</td>";

            +relationTypes[i] + "'" + onclick + checked + "/></td> "
            str += "<td><input type='checkbox' name='graphRelationsFilterCbx' value='"
                + relationTypes[i] + "'" + onclick + checked + "/></td> "
            /*  str += "<td><input type='checkbox' name='graphRelationsFilterExcludeCbx' value='"
             + relationTypes[i] + "'" + onclick + noChecked + "/> ";*/
            str += "</tr>";

        }

        str += "</table>"
        $("#filtersDiv").html(str);

        //selectLeftTab("#graphQueryFiltersTab");

        /*
         * var relCbxes = $("[name=graphRelationsFilterCbx]"); for (var i = 0; i <
         * relCbxes.length; i++) { relCbxes[i].checked = false; } var labelCbxes =
         * $("[name=graphNodesFilterCbx]"); for (var i = 0; i < labelCbxes.length;
         * i++) { labelCbxes[i].checked = false; }
         */
        if (!customizeUI.hideFilters == true)
            $("#filtersDiv").css("visibility", "visible");
        // generateGraph(currentObjId,drawGraph);
    }

    self.comuteAllFilters = function (caller, mode) {
        var status = true;
        if (caller) {
            var str = $(caller).attr("id");
            var status = $(caller).prop("checked");
        }
        else {
            if (mode == "off")
                status = false;
            else
                status = false;
        }

        self.comuteAll = function (cbxs, mode) {
            var relCbxes = $("[name=" + cbxs + "]");
            for (var i = 0; i < relCbxes.length; i++) {
                $(relCbxes[i]).prop("checked", mode);
            }

        }

        if (str == "#comuteAllFiltersRelationsInclude")
            self.comuteAll("graphRelationsFilterCbx", status);
        if (str == "#comuteAllFiltersRelationsExclude")
            self.comuteAll("graphRelationsFilterExcludeCbx", status);
        if (str == "#comuteAllFiltersNodesInclude")
            self.comuteAll("graphNodesFilterCbx", status);
        if (str == "#comuteAllFiltersNodesExclude")
            self.comuteAll("graphNodesFilterExcludeCbx", status);

        if (status) {//on  all checked action
            self.setQueryFilters();
            toutlesensController.generateGraph(currentObjectId, true);
        }
    }

    self.setQueryFilters = function () {

        dontReInitFilterGraph = true;


        var relRelTypesFilters = [];
        var nodeLabelFilters = [];
        var relRelTypesExcludedFilters = [];
        var nodeLabelExcludedFilters = [];
        var id = currentObjectId;

        var relCbxes = $("[name=graphRelationsFilterCbx]");
        for (var i = 0; i < relCbxes.length; i++) {
            if (relCbxes[i].checked) {
                relRelTypesFilters.push(relCbxes[i].value);

            }


        }
        var labelCbxes = $("[name=graphNodesFilterCbx]");
        for (var i = 0; i < labelCbxes.length; i++) {
            if (labelCbxes[i].checked) {
                nodeLabelFilters.push(labelCbxes[i].value);

            }

        }
        var labelExludedCbxes = $("[name=graphNodesFilterExcludeCbx]");
        for (var i = 0; i < labelExludedCbxes.length; i++) {
            if (labelExludedCbxes[i].checked) {
                nodeLabelExcludedFilters.push(labelExludedCbxes[i].value);

            }

        }

        var relExcludesCbxes = $("[name=graphRelationsFilterExcludeCbx]");
        for (var i = 0; i < relExcludesCbxes.length; i++) {
            if (relExcludesCbxes[i].checked) {
                relRelTypesExcludedFilters.push(relExcludesCbxes[i].value);

            }


        }

        toutlesensData.queryNodeFilters = "";
        toutlesensData.queryExcludeNodeFilters = "";
        if (nodeLabelFilters.length != labelCbxes.length) {
            for (var i = 0; i < nodeLabelFilters.length; i++) {
                if (i > 0)
                    toutlesensData.queryNodeFilters += " OR ";
                toutlesensData.queryNodeFilters += "m:" + nodeLabelFilters[i];
            }
        }
        if (toutlesensData.queryNodeFilters.length > 0)
            toutlesensData.queryNodeFilters = " and (" + toutlesensData.queryNodeFilters + ") ";


        toutlesensData.queryRelFilters = "";
        if (relRelTypesFilters.length != relCbxes.length) {
            for (var i = 0; i < relRelTypesFilters.length; i++) {
                if (i > 0)
                    toutlesensData.queryRelFilters += "|";
                toutlesensData.queryRelFilters += relRelTypesFilters[i];

            }


            if (toutlesensData.queryRelFilters.length > 0)
                toutlesensData.queryRelFilters = ":" + toutlesensData.queryRelFilters;

        }


        if (nodeLabelExcludedFilters.length != labelExludedCbxes.length) {
            for (var i = 0; i < nodeLabelExcludedFilters.length; i++) {
                toutlesensData.queryExcludeNodeFilters += " and NOT m:"
                    + nodeLabelExcludedFilters[i];

            }

        }


        if (relRelTypesExcludedFilters.length != relExcludesCbxes.length) {
            for (var i = 0; i < relRelTypesExcludedFilters.length; i++) {
                if (i > 0)
                    toutlesensData.queryExcludeRelFilters += ",";
                toutlesensData.queryExcludeRelFilters += "\"" + relRelTypesExcludedFilters[i]
                    + "\"";

            }
            if (toutlesensData.queryExcludeRelFilters.length > 0)
                toutlesensData.queryExcludeRelFilters = "  and  NONE( rel in r WHERE type(rel) IN ["
                    + toutlesensData.queryExcludeRelFilters + "])"


        }
    }

    self.onFilterCbxClik = function () {
        toutlesensController.generateGraph(currentObjectId, true);
    }
    self.backToNonFilteredGraph = function () {
        isInPathGraphAction = false;
        currentGraphRequestType = currentGraphRequestType_FROM_NODE;
        toutlesensController.generateGraph();
        $("#accordionRepresentation").accordion({
            active: 0
        });
    }
    self.relDoMore = function (type) {

        $("#dialog").load("/htmlSnippets/relPropertySelection.html", function () {
            self.initRelPropertySelection(type);
            $("#dialog").dialog("open")
        });


    }
    self.labelDoMore = function (label) {
        $("#dialog").load("/htmlSnippets/labelPropertySelection.html");
        $("#dialog").dialog("open")
    }

    self.initRelPropertySelection = function (type) {
        var xx = Schema.schema;
        var result = toutlesensData.cachedResultArray;
        var propertiesObj = {};
        for (var i = 0; i < result.length; i++) {
            var relProps = result[i].relProperties;
            for (var k = 0; k < relProps.length; k++) {
                var props2 = relProps[k].properties;
                for (var key in props2) {
                    if (!propertiesObj[key]) {
                        propertiesObj[key] = {
                            name: key,
                            min: 99999999999999,
                            max: -999999999999999,
                            values: [],
                            cumulValue: 0,
                            count: 0
                        }
                    }
                    value = props2[key];
                    if (util.isNumber) {
                        propertiesObj[key].min = Math.min(propertiesObj[key].min, value);
                        propertiesObj[key].max = Math.max(propertiesObj[key].max, value);
                        propertiesObj[key].cumulValue += value;
                        propertiesObj[key].count += 1;

                    } else {
                        propertiesObj[key].count += 1;
                        if (propertiesObj[key].values.indexOf(value) < 0)
                            propertiesObj[key].values.push(value);


                    }
                }


            }
        }
        currentPropertiesMap = {
            type: type,
            properties: propertiesObj
        };
        var propertiesArray = [""]
        for (var key in propertiesObj) {
            propertiesArray.push(propertiesObj[key])
        }
        $("#relPropertiesSelectionRelationSpan").html(type);
        var select = document.getElementById("relPropertiesSelectionDialogSelect")
        common.fillSelectOptions(select, propertiesArray, "name")

    }
    self.setRelationStrokeWitdh = function () {
        var prop = $("#relPropertiesSelectionDialogSelect").val();
        var type = currentPropertiesMap.type;
        var cbxs = $('[name=graphRelationsFilterCbx]');
        for (var i = 0; i < cbxs.length; i++) {
            var mode = "unchecked";

            if (cbxs[i].value == type) {

            mode = "checked"
            $(cbxs[i]).prop("checked", mode);
        }else
                $(cbxs[i]).removeAttr("checked");
        }

        Gparams.visibleLinkProperty = prop;
        toutlesensController.generateGraph(currentObjectId, true);
        $("#dialog").dialog("close");

        $("#innerLegendDiv").html("relation witdh -> "+currentPropertiesMap.type+"/"+prop);
    }

    self.applyRelPropFilter = function () {
        var propOnly = $("#relPropertiesSelectionDialogSelect").val();
        var whereOnlyRelProp = ""
        for (var key in currentPropertiesMap) {
            if (key != propOnly) {
                if (whereOnlyRelProp != "")
                    whereOnlyRelProp += " AND ";
                whereOnlyRelProp += " NOT HAS(r:" + key + ")";

            }
        }
        toutlesensData.whereFilter = whereOnlyRelProp;
        self.generateGraph(null, true, function (err, result) {
            var xx = result;

        })

    }

    return self;


})()
