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

        str += "<table style='border-style:solid;font-size:12px; '>"
        var relName = "zz"

        if (currentObject.id) {
            if (!currentObject.neoAttrs)
                currentObject.neoAttrs = {}
            str += "<tr><td style='color:" + nodeColors[currentObject.label] + "'>";
            str += "Node <b>" + currentObject.neoAttrs[Schema.schema.defaultNodeNameProperty] + "</b></td>";
            str += "<td><img  src='./images/filter.png'  width='15px'  title='set filter' onclick='filters.showFilterDialog(\"" + currentObject.label + "\",\"" + relName + "\")'></td>"
            if (Gparams.graphAllowPaint)
                str += "<td><img  src='./images/paint.jpg'  width='15px'  title='set filter' onclick='paint.showPaintDialog(\"" + currentObject.label + "\",\"" + relName + "\")'></td>"
            str += "</tr>";
        }
        else if (currentLabel) {
            str += "<tr> </tr><td style='background-color:" + nodeColors[currentLabel] + "'>";
            str += " Label <b>" + currentLabel + "</b></td>";
            str += "<td><img  src='./images/filter.png'  width='15px'  title='set filter' onclick='filters.showFilterDialog(\"" + currentLabel + "\",\"" + relName + "\")'></td>"
            if (Gparams.graphAllowPaint)
                str += "<td><img  src='./images/paint.jpg'  width='15px'  title='set filter' onclick='paint.showPaintDialog(\"" + currentLabel + "\",\"" + relName + "\")'></td>"
            str += "</tr>";
        }


        str += "<tr align='center'  class='italicSpecial'><td><span class='bigger'>Relations</span></td><td></td><td></td></tr>";//<td>Exclure<br><input type='checkbox' id='#comuteAllFiltersRelationsExclude' onchange='filters.comuteAllFilters(this)'></td></tr>";

        var labelFilters = [];
        for (var i = 0; i < data.length; i++) {
            var filterObj = data[i];

            for (var k = 0; k < filterObj.rels.length; k++) {
                var relName = filterObj.rels[k];


                if (!self.currentFilters[relName]) {
                    self.currentFilters[relName] = {name: relName, labels: [], selected: false};

                }
            }
            for (var k = 0; k < filterObj.labels.length; k++) {
                for (var j = 0; j < filterObj.labels[k].length; j++) {
                    var label = filterObj.labels[k][j];
                    if (Array.isArray(label))
                        label = label[0];
                    if (labelFilters.indexOf(label) < 0)
                        labelFilters.push(label);
                    if (self.currentFilters[relName].labels.indexOf(label) < 0)
                        self.currentFilters[relName].labels.push(label);
                }
            }

        }


        for (var relName in self.currentFilters) {


            str += "<tr align='center' class='relationType'>";
            str += "<td class='filterName'  id='relation:" + relName + "' style='color:" + linkColors[relName] + "'>";
            str += " relation <b>" + relName + "</b></td>";
            str += "<td> <img  src='./images/filter.png'  width='15px' title='set filter' onclick='filters.showFilterDialog(null,\"" + relName + "\")'></td>"
            if (Gparams.graphAllowPaint)
                str += "<td> <img  src='./images/paint.jpg'  width='15px' title='set filter' onclick='paint.showPaintDialog(null,\"" + relName + "\")'></td>"

            str += "</tr>";
        }
        str += "<tr align='center'  class='italicSpecial'><td><span class='bigger'>labels</span></td><td></td><td></td></tr>";//<td>Exclure<br><input type='checkbox' id='#comuteAllFiltersRelationsExclude' onchange='filters.comuteAllFilters(this)'></td></tr>";

        for (var j = 0; j < labelFilters.length; j++) {

            var label = labelFilters[j];
            if (label != currentLabel) {
                str += "<tr align='center'>";
                //str += "<td><button  onclick='filters.showFilterDialog(\"" + label + "\",\"" + relName + "\")'><img  src='./icons/filter.png'  width='15px'></button></td>";
                //  str += "<td class='filterName' id='endNode:" + label + "' style='background-color:" + nodeColors[label] + "'>";
                str += "<td class='filterName' id='endNode:" + label + "'  '>";
                str += "<span style='background-color:" + nodeColors[label] + ";width:15px;height:15px;'>&nbsp;&nbsp;&nbsp;</span>"
                str += "label <b>" + label + "</b></td>";
                str += "<td><img  src='./images/filter.png'  width='15px'  title='set filter' onclick='filters.showFilterDialog(\"" + label + "\",\"" + relName + "\")'></td>"
                if (Gparams.graphAllowPaint)
                    str += "<td><img  src='./images/paint.jpg'  width='15px'  title='set filter' onclick='paint.showPaintDialog(\"" + label + "\",\"" + relName + "\")'></td>"

                str += "</tr>";


            }
        }
        str += "</tr>";
        str += "<tr><td colspan='3' >&nbsp;</B></td></td></tr>";


        // str += "<tr class='italicSpecial'><td colspan='3'><span
        // class='bigger'>Relations</span></tr>";


        str += "</table>"
        $("#filtersDiv").html(str);


        if (!customizeUI.hideFilters == true)
            $("#filtersDiv").css("visibility", "visible");

        $(".filterName").on("click", function (event) {
            var mode = "only";
            if (event.ctrlKey) {
                var mode = "add"
            }
            paint.closePaintDialog();
            var array = this.id.split(":");
            var option = "all";
            if ($(this).hasClass("displayIcon-selected")) {
                option = "remove";
                $(this).removeClass("displayIcon-selected");
            } else {
                $(this).addClass("displayIcon-selected");
            }
            filters.filterOnProperty(option, mode, array[0], array[1])

        })

        // generateGraph(currentObject.id,drawGraph);
    }


    self.setQueryFilters = function (generateGraph) {

        var ok = true;
        var allRelTypesStr = "";
        var allNodeLabelsStr = "";
        for (var i = 0; i < self.currentSelectdFilters.length; i++) {
            var filter = self.currentSelectdFilters[i];
            value = filter.value;
            operator = filter.operator;
            property = filter.property;
            filterMode = filter.filterMode;

            if (filter.off == true)
                continue;


            // no property but all nodes or relations
            if (property == "all") {

                type = filter.type;
                if (filterMode == "endNode") {
                    if (allNodeLabelsStr.length > 0)
                        allNodeLabelsStr += " OR ";
                    allNodeLabelsStr += "m:" + type;
                }
                else if (filterMode == "relation") {
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


                if (filterMode == "relation") {
                    if (common.isNumber(value))

                        toutlesensData.whereFilter += "r[0]." + property + operator + value + " ";
                    else
                        toutlesensData.whereFilter += "r[0]." + property + operator + "\"" + value + "\" ";

                }
                else if (filterMode == "startNode") {
                    if (common.isNumber(value))
                        toutlesensData.whereFilter += "node1." + property + operator + value + " ";
                    else
                        toutlesensData.whereFilter += "node1." + property + operator + "\"" + value + "\" ";

                }
                else if (filterMode == "endNode") {
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

        if (generateGraph) {
            toutlesensController.addToHistory = true;
            toutlesensController.generateGraph(null, true);
        }


    }


    self.showFilterDialog = function (label, reltype) {
        $("#dialog").dialog("option", "title", "Graph filter");
        if (label) {
            $("#dialog").load("htmlSnippets/filterDialog.html", function () {
                //   $("#previouspropertiesDiv").html(self.printPropertyFilters(true));
                self.initLabelPropertySelection(label);
                $("#dialog").dialog("open");

            });
        }
        else {
            $("#dialog").load("htmlSnippets/filterDialog.html", function () {


                self.initRelationPropertySelection(reltype);
                //    $("#previouspropertiesDiv").html(self.printPropertyFilters(true));
                $("#dialog").dialog("open");
            });
        }


    }


    self.initRelationPropertySelection = function (type, selectId) {
        self.postFilter = null;
        var relations = Schema.getRelationsByType(type);
        var propertiesArray = ["ALL"];
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
        $("#propertiesSelectionTypeSpan").html("Relation type" + type);
        $("#propertiesSelectionDialog_filterModeInput").val("relation");
        $("#propertiesSelectionDialog_typeInput").val(type);
        if (!selectId)
            selectId = document.getElementById("propertiesSelectionDialog_propsSelect")
        common.fillSelectOptionsWithStringArray(selectId, propertiesArray)

    }

    self.initLabelPropertySelection = function (type, selectId) {

        self.postFilter = null;
        var properties = Schema.schema.properties[type];
        var propertiesArray = ["ALL"];
        for (var key in properties) {
            propertiesArray.push(key);
        }
        propertiesArray.sort();

        $("#propertiesSelectionTypeSpan").html("Node label " + type);
        $("#propertiesSelectionDialog_typeInput").val(type);
        $("#propertiesSelectionDialog_filterModeInput").val("endNode");

        if (!selectId)
            selectId = document.getElementById("propertiesSelectionDialog_propsSelect")
        common.fillSelectOptionsWithStringArray(selectId, propertiesArray)

    }


    self.filterOnProperty = function (option, booleanOption, filterMode, type, property, operator, value) {


        if (!property)
            property = $("#propertiesSelectionDialog_propsSelect").val();
        if (!value)
            value = $("#propertiesSelectionDialog_valueInput").val();
        if (!filterMode)
            filterMode = $("#propertiesSelectionDialog_filterModeInput").val();
        if (!operator)
            operator = $("#propertiesSelectionDialog_operatorSelect").val();
        if (!type)
            type = $("#propertiesSelectionDialog_typeInput").val();


        if (booleanOption == "only") {
            $(".displayIcon-selected").each(function (index, value) {
                if (this.id != filterMode + ":" + type)
                    $(this).removeClass("displayIcon-selected");
            });

            self.currentSelectdFilters = [];
        }
        self.synchronizeRelsAndlabels(filterMode, type);

        var newFilter = null;
        if (property == "ALL" || option == "all") {
            newFilter = {
                property: "all",
                filterMode: filterMode,
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
                filterMode: filterMode,
                operator: operator,
                type: type

            }
        }
        if (newFilter)
            self.currentSelectdFilters.push(newFilter);
        $("#dialog").dialog("close");
        self.setQueryFilters(true);
    }

    self.applyAllRelationsFilter = function () {
        for (var key in self.currentFilters) {
            newFilter = {
                property: "all",
                filterMode: "relation",
                type: key
            }
            self.currentSelectdFilters.push(newFilter);

            $("#relation_" + key).addClass("displayIcon-selected");
        }
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
                var str1 = "";
                if (filter.property == "all")
                    str1 = "all " + filter.filterMode + " " + filter.type;
                else

                    str1 += filter.type + " : " + filter.property + " " + filter.operator + " " + filter.value

                str += str1 + str2 + "<br>";

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


    self.synchronizeRelsAndlabels = function (filterMode, type) {
        if (filterMode == "relation") {
            var labels = self.currentFilters[type].labels;

            $(".filterName").each(function (index, value) {
                var p=this.id.indexOf(":");
                var name = this.id.substring(p+1)
                var eachType = this.id.substring(0,p)
                if ( eachType=="endNode" && labels.indexOf(name) > -1)
                    $(this).addClass("displayIcon-selected");
            });

        }
        else if (filterMode == "endNode") {
            var rels = []
            for (var key in self.currentFilters) {
                labels = self.currentFilters[key].labels;
                if (labels.indexOf(type) > -1)
                    rels.push(key)
            }

            $(".filterName").each(function (index, value) {
                var p=this.id.indexOf(":");
                var name = this.id.substring(p+1)
                var eachType = this.id.substring(0,p)
                if ( eachType=="relation" && rels.indexOf(name) > -1)
                    $(this).addClass("displayIcon-selected");
            });


        }


    }


    return self;


})


()
