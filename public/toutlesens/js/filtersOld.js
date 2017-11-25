/**
 * Created by claud on 25/09/2017.
 */

var filters = (function () {
    var self = {};
    var currentPropertiesMap;
    self.hasFiltersSelected = false;
    self.currentFilters = {};
    self.currentSelectdFilters = []

    self.initGraphFilters = function (data) {
        self.hasFiltersSelected = false;
        self.currentFilters = {};
        self.currentSelectdFilters = []
        self.postFilter = null;

        $("#innerLegendDiv").html("");


        var str = "";
        var targetLabels = [];
        var relationTypes = [];


        var checked = "' checked='checked' ";
        var noChecked = "";
        var onclick = " onclick='filters.startQueryFilterMode() '"
        onclick = "onclick='filters.onFilterCbxClik(this);'";

        str += "<table >"

        // str += "<tr class='italicSpecial'><td ><span
        // class='bigger'>Noeuds</span></td><td>Inclure</td><td>Exclure</td></tr>";
        str += "<tr align='center'  class='italicSpecial'><td><span class='bigger'>Relations/labels</span></td><td></td><td>Include<br><input type='checkbox' id='#comuteAllFiltersRelationsInclude' " + noChecked + "  onchange='filters.comuteAllFilters(this)'></td></tr>";//<td>Exclure<br><input type='checkbox' id='#comuteAllFiltersRelationsExclude' onchange='filters.comuteAllFilters(this)'></td></tr>";
        for (var i = 0; i < data.length; i++) {
            var filterObj = data[i];
            for (var k = 0; k < filterObj.rels.length; k++) {
                var relName = filterObj.rels[k];


                if (!self.currentFilters[relName]) {
                    self.currentFilters[relName] = {name: relName, labels: [], selected: false};

                }
                for (var j = 0; j < filterObj.labels.length; j++) {
                    var label = filterObj.labels[j][0];
                    if (self.currentFilters[relName].labels.indexOf(label) < 0)
                        self.currentFilters[relName].labels.push(label);
                }
            }
        }
        for (var relName in self.currentFilters) {
            var relLabels = self.currentFilters[relName].labels;
            str += "<tr align='center' class='relationType'>";
            str += "<td style='background-color:" + linkColors[relName] + "'>";
            str += relName + "</td>";
            str += "<td> <img  src='./icons/filter.png'  width='15px' onclick='filters.showFilterDialog(\"" + relName + "\")'></td>"
            //  str += "<td><button onclick='filters.showFilterDialog(\"" + relName + "\")'>+</button></td>";
            //  str += "<td style='background-color:" + linkColors[relName] + "'>" + relName + "</td>";
            str += "<td><input type='checkbox' name='graphRelationsFilterCbx' value='"
                + relName + "'" + onclick + noChecked + "/></td> "

            str += "</tr>";

            for (var j = 0; j < relLabels.length; j++) {

                var label = relLabels[j];

                str += "<tr align='center'>";
                //str += "<td><button  onclick='filters.showFilterDialog(\"" + label + "\",\"" + relName + "\")'><img  src='./icons/filter.png'  width='15px'></button></td>";
                str += "<td style='color:" + nodeColors[label] + "'>";
                str += label + "</td>";
                str += "<td><img  src='./icons/filter.png'  width='15px' onclick='filters.showFilterDialog(\"" + label + "\",\"" + relName + "\")'>"
                str += "<td><input type='checkbox' name='graphNodesFilterCbx' value='"
                    + relName + "#" + label + "'" + onclick + noChecked + "/></td> "

                str += "</tr>";


            }
            str += "</tr>";
            str += "<tr><td colspan='3' >&nbsp;</B></td></td></tr>";
        }


        // str += "<tr class='italicSpecial'><td colspan='3'><span
        // class='bigger'>Relations</span></tr>";


        str += "</table>"
        $("#filtersDiv").html(str);


        if (!customizeUI.hideFilters == true)
            $("#filtersDiv").css("visibility", "visible");
        // generateGraph(currentObject.id,drawGraph);
    }


    self.checkPreviouscheckedFilters = function (filtersObj) {
        if (filtersObj == "all")
            return;
        for (var key in filtersObj) {

            var relCbxs = $("[name=graphRelationsFilterCbx]");

            for (var i = 0; i < relCbxs.length; i++) {
                if (relCbxs.value == key) {
                    relCbxs[i].checked = "checked"
                }
                for (var k = 0; k < filtersObj[key].labels.length; k++) {
                    var labelCbxs = $("[name=graphNodesFilterCbx]");
                    for (var j = 0; j < labelCbxs.length; j++) {
                        if (labelCbxs[j].value == key + "#" + filtersObj[key].labels[k]) {
                            labelCbxs[i].checked = "checked"
                        }
                    }
                }
            }


        }


    }

    self.comuteAllFilters = function (caller, mode) {
        var str = "";
        var status = true;
        if (caller == "all") {
            str = "#comuteAllFiltersRelationsInclude";
        }
        if (caller) {
            str = $(caller).attr("id");
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
                var name = "zzz";

            }

        }
        if (status == false) {
            self.currentFilters = {};
            self.currentSelectdFilters = [];
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
            toutlesensController.generateGraph(currentObject.id, true);
        }
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
            toutlesensController.generateGraph(currentObject.id, true);
        }
    }

    self.setQueryFilters = function () {

        dontReInitFilterGraph = true;


        var relRelTypesFilters = [];
        var nodeLabelFilters = [];
        var relRelTypesExcludedFilters = [];
        var nodeLabelExcludedFilters = [];
        var id = currentObject.id;

        var relCbxes = $("[name=graphRelationsFilterCbx]");
        for (var i = 0; i < relCbxes.length; i++) {
            if (relCbxes[i].checked) {
                if (relRelTypesFilters.indexOf(relCbxes[i].value) < 0)
                    relRelTypesFilters.push(relCbxes[i].value);

            }
        }
        var labelCbxes = $("[name=graphNodesFilterCbx]");
        for (var i = 0; i < labelCbxes.length; i++) {
            if (labelCbxes[i].checked) {
                var label = labelCbxes[i].value.split("#")[1]
                if (nodeLabelFilters.indexOf(label) < 0)
                    nodeLabelFilters.push(label);
            }
        }

        /*   var labelExludedCbxes = $("[name=graphNodesFilterExcludeCbx]");
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


         }*/

        // if no filter return false
        if (relRelTypesFilters.length + nodeLabelFilters.length == 0) {
            self.hasFiltersSelected = false;
            return;
        }
        self.hasFiltersSelected = true;

        toutlesensData.queryNodeLabelFilters = "";
        toutlesensData.queryExcludeNodeFilters = "";
        if (nodeLabelFilters.length != labelCbxes.length) {
            for (var i = 0; i < nodeLabelFilters.length; i++) {
                if (i > 0)
                    toutlesensData.queryNodeLabelFilters += " OR ";
                toutlesensData.queryNodeLabelFilters += "m:" + nodeLabelFilters[i];
            }
        }
        if (toutlesensData.queryNodeLabelFilters.length > 0)
            toutlesensData.queryNodeLabelFilters = " and (" + toutlesensData.queryNodeLabelFilters + ") ";


        toutlesensData.queryRelTypeFilters = "";
        if (relRelTypesFilters.length != relCbxes.length) {
            for (var i = 0; i < relRelTypesFilters.length; i++) {
                if (i > 0)
                    toutlesensData.queryRelTypeFilters += "|";
                toutlesensData.queryRelTypeFilters += relRelTypesFilters[i];

            }


            if (toutlesensData.queryRelTypeFilters.length > 0)
                toutlesensData.queryRelTypeFilters = ":" + toutlesensData.queryRelTypeFilters;

        }


        /*  if (nodeLabelExcludedFilters.length != labelExludedCbxes.length) {
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


         }*/
        return;
    }

    self.onFilterCbxClik = function (cbx) {
        var relName = cbx.value;


        if (cbx.name.indexOf("graphRelation") == 0) {//if relation filter
            filters.currentFilters[relName].selected = true;
            var labels = filters.currentFilters[relName].labels;
            for (var i = 0; i < labels.length; i++) {
                $("[value='" + relName + "#" + labels[i] + "']").prop("checked", cbx.checked)
            }

        }
        if (cbx.name.indexOf("graphNode") == 0) {//if relation filter

            var value = cbx.value;
            var relName = value.substring(0, value.indexOf("#"));

            var relCbx = $("[value='" + relName + "']")[0];
            relCbx.checked = cbx.checked;
        }

        if (cbx.checked == true)
            toutlesensController.generateGraph(currentObject.id, true);
    }
    self.backToNonFilteredGraph = function () {
        isInPathGraphAction = false;
        currentGraphRequestType = currentGraphRequestType_FROM_NODE;
        toutlesensController.generateGraph();
        $("#accordionRepresentation").accordion({
            active: 0
        });
    }
    self.showFilterDialog = function (type) {

        $("#dialog").load("htmlSnippets/propertySelection.html", function () {


            self.initRelationPropertySelection(type);
            $("#previouspropertiesDiv").html(self.printPropertyFilters(true));
            $("#dialog").dialog("open");
        });


    }
    self.showFilterDialog = function (label, relType) {
        $("#dialog").load("htmlSnippets/propertySelection.html", function () {
            $("#previouspropertiesDiv").html(self.printPropertyFilters(true));
            self.initLabelPropertySelection(label);
            $("#dialog").dialog("open");

            var cbxs = $('[name=graphRelationsFilterCbx]');
            for (var i = 0; i < cbxs.length; i++) {
                if (cbxs[i].value == relType)
                    $(cbxs[i]).prop("checked", "checked");
            }
        });
    }

    self.initRelationPropertySelection = function (type) {
        self.postFilter = null;
        var relations = Schema.getRelationsByType(type);
        var propertiesArray = [""];
        for (var i = 0; i < relations.length; i++) {
            for (var j = 0; j < relations[i].properties.length; j++) {
                var property = relations[i].properties[j];
                if (propertiesArray.indexOf(property) < 0)
                    propertiesArray.push(property);
            }
        }
        propertiesArray.sort();
        $("#propertiesSelectionTypeSpan").html(type);
        $("#propertiesSelectionDialog_natureInput").val("relation");
        var select = document.getElementById("propertiesSelectionDialog_propsSelect")
        common.fillSelectOptionsWithStringArray(select, propertiesArray)

    }

    self.initLabelPropertySelection = function (type) {
        self.postFilter = null;
        var properties = Schema.schema.properties[type];
        var propertiesArray = [""];
        for (var key in properties) {
            propertiesArray.push(key);
        }
        propertiesArray.sort();

        $("#propertiesSelectionTypeSpan").html(type);
        $("#propertiesSelectionDialog_natureInput").val("startNode");
        var select = document.getElementById("propertiesSelectionDialog_propsSelect")
        common.fillSelectOptionsWithStringArray(select, propertiesArray)

    }

    /* self.initpropertySelection = function (type) {
     self.postFilter=null;
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
     $("#propertiesSelectionTypeSpan").html(type);
     var select = document.getElementById("propertiesSelectionDialog_propsSelect")
     common.fillSelectOptions(select, propertiesArray, "name")

     }*/
    self.outLineProperty = function () {
        var prop = $("#propertiesSelectionDialog_propsSelect").val();
        var type = currentPropertiesMap.type;
        var cbxs = $('[name=graphRelationsFilterCbx]');
        for (var i = 0; i < cbxs.length; i++) {
            var mode = "unchecked";

            if (cbxs[i].value == type) {

                mode = "checked"
                $(cbxs[i]).prop("checked", mode);
            } else
                $(cbxs[i]).removeAttr("checked");
        }

        Gparams.visibleLinkProperty = prop;
        toutlesensController.generateGraph(currentObject.id, true);
        $("#dialog").dialog("close");

        $("#innerLegendDiv").html("relation witdh -> " + currentPropertiesMap.type + "<br>" + prop);
    }


    self.filterOnProperty = function () {
        var property = $("#propertiesSelectionDialog_propsSelect").val();
        var value = $("#propertiesSelectionDialog_valueInput").val();
        var nature = $("#propertiesSelectionDialog_natureInput").val();
        var operator = $("#propertiesSelectionDialog_operatorSelect").val();

        if (!property  ) {
            toutlesensController.setGraphMessage("enter a  property", "stop");
        }
       else if (!value  ) {
            toutlesensController.setGraphMessage("enter a value for the property", "stop");

        } else {
            self.currentSelectdFilters.push({
                property: property,
                value: value,
                nature: nature,
                operator: operator

            })
        }
        var ok = true;
        for (var i = 0; i < self.currentSelectdFilters.length; i++) {

            var filter = self.currentSelectdFilters[i];
            value = filter.value;
            operator=filter.operator;
            property=filter.property;
            nature=filter.nature;

            if (filter.off == true)
                continue;
            var where = ""


            if (operator == "contains") {
                operator = "=~ ";
                value = ".*" + value + ".*"

            }
            if (toutlesensData.whereFilter != "")
                toutlesensData.whereFilter += " AND ";


            if (nature == "relation") {
                if (common.isNumber(value))

                    toutlesensData.whereFilter += "r[0]." + property + operator + value + " ";
                else
                    toutlesensData.whereFilter += "r[0]." + property + operator + "\"" + value + "\" ";

            }
            else if (nature == "startNode") {
                if (common.isNumber(value))
                    toutlesensData.whereFilter += "node1." + property + operator + value + " ";
                else
                    toutlesensData.whereFilter += "node1." + property + operator + "\"" + value + "\" ";

            }

        }

        toutlesensController.generateGraph(null, true);
        $("#dialog").dialog("close");

    }
    self.printPropertyFilters = function (withCbx) {
        var str = "";
        if(self.currentSelectdFilters.length==0)
            str = "No filter "
        else {
            for (var i = 0; i < self.currentSelectdFilters.length; i++) {
                if (self.currentSelectdFilters[i].off == true)
                    continue;
                var filter = self.currentSelectdFilters[i];
                var str2 = "";
                if (withCbx)
                    str2 += "<input type='checkbox' name='propertyFilterSelectedCbx' onchange='filters.onPopertyFilterSelectedCbx(this)' value='F#" + i + "' checked='checked'>"
                str += filter.property + " " + filter.operator + " " + filter.value + str2 + "<br>";

            }
        }
        return str;
    }
    self.onPopertyFilterSelectedCbx = function (cbx) {
        var p = parseInt(cbx.value.substring(2));
        if (cbx.checked==false)
            self.currentSelectdFilters[p].off = true;
        else
            self.currentSelectdFilters[p].off = false;
    }

    self.printRelationsFilters = function (withCbx) {
        var str = "";
        for (var key in  self.currentFilters) {
            filter = self.currentFilters[key];
            if (filter.selected == true)
                str += "Relation :" + filter.name
        }
        return str;
    }


    return self;


})
()
