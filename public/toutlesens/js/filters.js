/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2018 Claude Fauconnet claude.fauconnet@neuf.fr
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
var filters = (function () {
    var self = {};
    self.currentSelectdFilters = [];

    /**
     *
     * initialize filterDialog.html with result from neo4j
     *
     * @param data neo4j DataSet
     */

    self.init = function (data) {
        var labels = [];
        var relTypes = [];
        for (var i = 0; i < data.length; i++) {
            var filterObj = data[i];
            for (var k = 0; k < filterObj.labels.length; k++) {
                var label = filterObj.labels[k][0];

                if (labels.indexOf(label) < 0)
                    labels.push(label);

            }
            for (var k = 0; k < filterObj.rels.length; k++) {
                var relType = filterObj.rels[k];

                if (relTypes.indexOf(relType) < 0)
                    relTypes.push(relType);

            }

        }
        labels.splice(0, 0, "");
        relTypes.splice(0, 0, "");
        common.fillSelectOptionsWithStringArray(propertiesSelectionDialog_labelSelect, labels);
        common.fillSelectOptionsWithStringArray(propertiesSelectionDialog_relTypeSelect, relTypes);

        filters.initLabelPropertySelection("", propertiesSelectionDialog_propsSelect);
        $("#propertiesSelectionDialog_propsSelect").val(Schema.getNameProperty())

    }


    /**
     *
     * reinitialize toutlesensData filters
     *
     *
     */

    self.removeAllFilters = function () {
        toutlesensData.queryNodeLabelFilters = "";
        toutlesensData.whereFilter = "";
        toutlesensData.queryNodeLabelFilters = "";
    }


    /**
     * initialize a select with the properties defined in the schema for this relation type
     *
     *
     * @param type relationType
     * @param selectId select to initialize
     */

    self.initRelationPropertySelection = function (type, selectId) {
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
        $("#propertiesSelectionTypeSpan").html("Relation type" + type);
        $("#propertiesSelectionDialog_filterModeInput").val("relation");
        $("#propertiesSelectionDialog_typeInput").val(type);
        if (!selectId)
            selectId = document.getElementById("propertiesSelectionDialog_propsSelect")
        common.fillSelectOptionsWithStringArray(selectId, propertiesArray)

    }

    /**
     * initialize a select with the properties defined in the schema for this label
     *
     *
     * @param type label
     * @param selectId select to initialize
     */
    self.initLabelPropertySelection = function (type, selectId) {

        self.postFilter = null;
        var properties = [];
        if (type == "") {
            var allLabels = Schema.getAllLabelNames();
            for (var i = 0; i < allLabels.length; i++) {
                properties.push(Schema.schema.properties[allLabels[i]])
            }

        } else
            properties = [Schema.schema.properties[type]];
        var propertiesArray = [""];
        for (var i = 0; i < properties.length; i++) {
            for (var key in properties[i]) {
                if (propertiesArray.indexOf(key) < 0)
                    propertiesArray.push(key);
            }
        }
        propertiesArray.sort();

        $("#propertiesSelectionTypeSpan").html("Node label " + type);
        $("#propertiesSelectionDialog_typeInput").val(type);
        $("#propertiesSelectionDialog_filterModeInput").val("endNode");

        if (!selectId)
            selectId = document.getElementById("propertiesSelectionDialog_propsSelect")
        common.fillSelectOptionsWithStringArray(selectId, propertiesArray)

    }

    /**
     *
     *  method filtering visJs graph directly without executing a cypher query
     * @param option
     * @param booleanOption
     * @param filterMode
     * @param type
     * @param property
     * @param operator
     * @param value
     */
    self.filterGraphOnProperty = function (option, booleanOption, filterMode, type, property, operator, value) {


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
        visjsGraph.filterGraph(property, operator, value, type);

    }

    /**
     *
     *
     * initalialize currentFilters with filterDialog.html inputs
     *
     *
     *
     * @param option
     * @param booleanOption
     * @param filterMode
     * @param type
     * @param property
     * @param operator
     * @param value
     */
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


        if (option == "remove") {
            for (var i = 0; i < self.currentSelectdFilters.length; i++) {
                if (self.currentSelectdFilters[i].type == type)
                    self.currentSelectdFilters.splice(i, 1);
            }
        }

        if (booleanOption == "only") {
            $(".paintIcon").each(function (index, value) {
                if (this.id != "paintIcon_" + type)
                    $(this).css("visibility", "hidden")
                else
                    $(this).css("visibility", "visible")
            });


            $(".displayIcon-selected").each(function (index, value) {
                if (this.id != filterMode + ":" + type)
                    $(this).removeClass("displayIcon-selected");


            });

            self.currentSelectdFilters = [];
        }
        else {

            ;
        }


        var newFilter = null;
        if (property == "" || option == "all") {
            newFilter = {
                property: "all",
                filterMode: filterMode,
                type: type
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





    /**
     *
     * set toutlesensData request criteria by translating self.currentSelectdFilters objects into cypher match conditions
     *
     *
     * @param generateGraph if true will call   generateGraph
     */




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
                if (filterMode == "endNode" && type != "") {
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
                    value = "(?i).*" + value + ".*"

                }
                if (toutlesensData.whereFilter != "")
                    toutlesensData.whereFilter += " AND ";


                if (filterMode == "relation") {
                    if (common.isNumber(value))

                        toutlesensData.whereFilter += "r." + property + operator + value + " ";
                    else
                        toutlesensData.whereFilter += "r." + property + operator + "\"" + value + "\" ";

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
            toutlesensController.generateGraph(null, {applyFilters: true});
            self.addCurrentFilterToFiltersDiv(filter)
        }


    }

    /**
     *  human readable text of current label Filters
     *
     *
     * @returns {string} text of property filters
     */
    self.printPropertyFilters = function () {
        var str = "";
        if (self.currentSelectdFilters.length == 0)
            str = "No filter "
        else {
            for (var i = 0; i < self.currentSelectdFilters.length; i++) {
                if (self.currentSelectdFilters[i].off == true)
                    continue;
                var filter = self.currentSelectdFilters[i];
                var str2 = "";
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





    /**
     *  human readable text of current relations Filters
     *
     *
     * @returns {string} text of property filters
     */

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
