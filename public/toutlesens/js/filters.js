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
            str += "<tr align='center'  class='italicSpecial'><td><span class='bigger'>Relations/labels</span></td><td></td><td></td></tr>";//<td>Exclure<br><input type='checkbox' id='#comuteAllFiltersRelationsExclude' onchange='filters.comuteAllFilters(this)'></td></tr>";
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
                str += " relation <b>" + relName + "</b></td>";
                str += "<td> <img  src='./images/filter.png'  width='15px' title='set filter' onclick='filters.showFilterDialog(null,\"" + relName + "\")'></td>"
                str += "<td> <img  src='./images/paint.jpg'  width='15px' title='set filter' onclick='paint.showPaintDialog(null,\"" + relName + "\")'></td>"

                str += "</tr>";

                for (var j = 0; j < relLabels.length; j++) {

                    var label = relLabels[j];

                    str += "<tr align='center'>";
                    //str += "<td><button  onclick='filters.showFilterDialog(\"" + label + "\",\"" + relName + "\")'><img  src='./icons/filter.png'  width='15px'></button></td>";
                    str += "<td style='color:" + nodeColors[label] + "'>";
                    str += "label <b>" + label + "</b></td>";
                    str += "<td><img  src='./images/filter.png'  width='15px'  title='set filter' onclick='filters.showFilterDialog(\"" + label + "\",\"" + relName + "\")'></td>"
                    str += "<td><img  src='./images/paint.jpg'  width='15px'  title='set filter' onclick='paint.showPaintDialog(\"" + label + "\",\"" + relName + "\")'></td>"

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


     /*   self.checkPreviouscheckedFilters = function (filtersObj) {
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


        }*/

     /*   self.comuteAllFilters = function (caller, mode) {
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
        }*/


       /* self.comuteAllFilters = function (caller, mode) {
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
        }*/

        self.setQueryFilters = function (generateGraph) {

            var ok = true;
            var allRelTypesStr = "";
            var allNodeLabelsStr = "";
            for (var i = 0; i < self.currentSelectdFilters.length; i++) {
                var filter = self.currentSelectdFilters[i];
                value = filter.value;
                operator = filter.operator;
                property = filter.property;
                nature = filter.nature;

                if (filter.off == true)
                    continue;


                // no property but all nodes or relations
                if (property == "all") {

                    type = filter.type;
                    if (nature == "endNode") {
                        if (allNodeLabelsStr.length > 0)
                            allNodeLabelsStr += " OR ";
                        allNodeLabelsStr += "m:" + type;
                    }
                    else if (nature == "relation") {
                        if (allRelTypesStr.length > 0)
                            allRelTypesStr += "|";
                        allRelTypesStr += type;
                    }


                }
                else {// set property where clause

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
                    else if (nature == "endNode") {
                        if (common.isNumber(value))
                            toutlesensData.whereFilter += "m." + property + operator + value + " ";
                        else
                            toutlesensData.whereFilter += "m." + property + operator + "\"" + value + "\" ";

                    }
                }

            }

            if (allNodeLabelsStr.length > 0) {
                toutlesensData.queryNodeLabelFilters = " and  (" + allNodeLabelsStr + ") ";
            }

            if (allRelTypesStr.length > 0)
                toutlesensData.queryRelTypeFilters = ":" + allRelTypesStr;

            if(generateGraph)
                toutlesensController.generateGraph(null, true);



        }

      /*  self.onFilterCbxClik = function (cbx) {
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
        }*/
      /*  self.backToNonFilteredGraph = function () {
            isInPathGraphAction = false;
            currentGraphRequestType = currentGraphRequestType_FROM_NODE;
            toutlesensController.generateGraph();
            $("#accordionRepresentation").accordion({
                active: 0
            });
        }*/



        self.showFilterDialog = function (label, reltype) {
            $("#dialog").dialog("option", "title", "Graph filter");
            if (label) {
                $("#dialog").load("htmlSnippets/propertySelection.html", function () {
                    $("#previouspropertiesDiv").html(self.printPropertyFilters(true));
                    self.initLabelPropertySelection(label);
                    $("#dialog").dialog("open");

                    /*  var cbxs = $('[name=graphRelationsFilterCbx]');
                     for (var i = 0; i < cbxs.length; i++) {
                     if (cbxs[i].value == relType)
                     $(cbxs[i]).prop("checked", "checked");
                     }*/
                });
            }
            else {
                $("#dialog").load("htmlSnippets/propertySelection.html", function () {


                    self.initRelationPropertySelection(reltype);
                    $("#previouspropertiesDiv").html(self.printPropertyFilters(true));
                    $("#dialog").dialog("open");
                });
            }


        }




        self.initRelationPropertySelection = function (type) {
            self.postFilter = null;
            var relations = Schema.getRelationsByType(type);
            var propertiesArray = [""];
            for (var i = 0; i < relations.length; i++) {
                if (relations[i].properties) {
                    for (var j = 0; j < relations[i].properties.length; j++) {
                        var property = relations[i].properties[j];
                        if (propertiesArray.indexOf(property) < 0)
                            propertiesArray.push(property);
                    }
                }
            }
            propertiesArray.sort();
            $("#propertiesSelectionTypeSpan").html("Relation type"+type);
            $("#propertiesSelectionDialog_natureInput").val("relation");
            $("#propertiesSelectionDialog_typeInput").val(type);
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

            $("#propertiesSelectionTypeSpan").html("Node label "+type);
            $("#propertiesSelectionDialog_typeInput").val(type);
            $("#propertiesSelectionDialog_natureInput").val("startNode");
            var select = document.getElementById("propertiesSelectionDialog_propsSelect")
            common.fillSelectOptionsWithStringArray(select, propertiesArray)

        }


     /*   self.outLineProperty = function () {
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
        }*/


        self.filterOnProperty = function (option) {
            var property = $("#propertiesSelectionDialog_propsSelect").val();
            var value = $("#propertiesSelectionDialog_valueInput").val();
            var nature = $("#propertiesSelectionDialog_natureInput").val();
            var operator = $("#propertiesSelectionDialog_operatorSelect").val();
            var type = $("#propertiesSelectionDialog_typeInput").val();

            var newFilter = null;
            if (option == "all") {
                newFilter = {
                    property: "all",
                    nature: nature,
                    type: type
                }

            }
            if (option == "remove") {
                for (var i = 0; i < self.currentSelectdFilters.length; i++) {
                    if (self.currentSelectdFilters[i].type == type)
                        self.currentSelectdFilters.splice(i, 1);
                }
            }


            else if (!property) {
                toutlesensController.setGraphMessage("enter a  property", "stop");

            }

            else if (!value) {
                toutlesensController.setGraphMessage("enter a value for the property", "stop");

            }
            else {
                newFilter = {
                    property: property,
                    value: value,
                    nature: nature,
                    operator: operator,
                    type: type

                }
            }
            if (newFilter)
                self.currentSelectdFilters.push(newFilter);
            $("#dialog").dialog("close");
            self.setQueryFilters(true);
        }




        self.printPropertyFilters = function (withCbx) {
            var str = "";
            if (self.currentSelectdFilters.length == 0)
                str = "No filter "
            else {
                for (var i = 0; i < self.currentSelectdFilters.length; i++) {
                    if (self.currentSelectdFilters[i].off == true)
                        continue;
                    var filter = self.currentSelectdFilters[i];
                    var str2 = "";
                    if (withCbx)
                        str2 += "<input type='checkbox' name='propertyFilterSelectedCbx' onchange='filters.onPopertyFilterSelectedCbx(this)' value='F#" + i + "' checked='checked'>";
                   var str1="";
                    if(filter.property=="all")
                        str1="all "+filter.nature+" "+filter.type;
                    else

                        str1 +=filter.type+" : "+ filter.property + " " + filter.operator + " " + filter.value

                  str+=str1 + str2 + "<br>";

                }
            }
            return str;
        }
        self.onPopertyFilterSelectedCbx = function (cbx) {
            var p = parseInt(cbx.value.substring(2));
            if (cbx.checked == false)
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
