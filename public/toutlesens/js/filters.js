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
    self.currentLabels = [];
    self.currentRelTypes = []

    /**
     *
     * initialize filterDialog.html with result from neo4j
     *
     * @param data neo4j DataSet
     */

    self.init = function (data) {

        var labels = [];
        var relTypes = [];
        labels.splice(0, 0, "");
        relTypes.splice(0, 0, "");
        if (data) {
            for (var i = 0; i < data.length; i++) {
                var filterObj = data[i];
                for (var k = 0; k < filterObj.labels.length; k++) {
                    var label = filterObj.labels[k][0];

                    if (labels.indexOf(label) < 0)
                        labels.push(label);

                }
                self.currentLabels = labels;
                for (var k = 0; k < filterObj.rels.length; k++) {
                    var relType = filterObj.rels[k];

                    if (relTypes.indexOf(relType) < 0)
                        relTypes.push(relType);

                }

                self.currentRelTypes = relTypes;


            }
        } else {

            self.currentLabels = Schema.getAllLabelNames();
            self.currentRelTypes = Schema.getAllRelationNames();
            self.currentLabels.splice(0, 0, "");
            self.currentRelTypes.splice(0, 0, "");
        }


        var select = document.getElementById("propertiesSelectionDialog_propsSelect")
        if (select) {
            common.fillSelectOptionsWithStringArray(select, self.currentLabels);
            filters.initLabelProperty("", propertiesSelectionDialog_propsSelect);
            $("#propertiesSelectionDialog_propsSelect").val(Schema.getNameProperty())
        }

    }

    /**
     * inititialize   select  propertiesSelectionDialog_ObjectNameInput with current objectsType  : node or relation
     *
     *
     * @param select
     */

    self.setLabelsOrTypes = function (type) {
        // var type = $(select).val();
        if (self.currentLabels.length == 0) {
            self.currentLabels = Schema.getAllLabelNames();
            self.currentLabels.splice(0, 0, "");
        }
        if (type == "node")
            common.fillSelectOptionsWithStringArray(propertiesSelectionDialog_ObjectNameInput, self.currentLabels);
        else if (type == "relation")
            common.fillSelectOptionsWithStringArray(propertiesSelectionDialog_ObjectNameInput, self.currentRelTypes);

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
     * initialize a select with the properties defined in the schema for a relation type or a label
     *
     * @param  objectType : node or relation
     * @param type value of the type
     * @param selectId select to initialize
     */

    self.initProperty = function (objectType, type, selectId) {
        objectType = $('#propertiesSelectionDialog_ObjectTypeInput').val()
        if (objectType == "node")
            self.initLabelProperty(type, selectId);
        else if (objectType == "relation")
            self.initRelationProperty(type, selectId);

    }


    /**
     * initialize a select with the properties defined in the schema for this relation type
     *
     *
     * @param type relationType
     * @param selectId select to initialize
     */

    self.initRelationProperty = function (type, selectId) {
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
    self.initLabelProperty = function (type, selectId) {

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


        if (!selectId)
            selectId = document.getElementById("propertiesSelectionDialog_propsSelect")
        common.fillSelectOptionsWithStringArray(selectId, propertiesArray)
        $("#propertiesSelectionDialog_propsSelect").val(Schema.getNameProperty())

    }

    /**
     *
     *  method filtering visJs graph directly without executing a cypher query
     * @param option
     * @param booleanOption
     * @param objectType
     * @param objectName
     * @param property
     * @param operator
     * @param value
     */
    self.filterGraphOnProperty = function (option, booleanOption, objectType, objectName, property, operator, value) {
        if (booleanOption == "removeAll") {
            visjsGraph.previousGraph();

        }
        else {
            visjsGraph.filterGraph(objectType,booleanOption, property, operator, value, objectName);
        }

    }

    /**
     *
     *
     * initalialize currentFilters with filterDialog.html inputs
     *
     * if( self.queriesIds.length>1 ||  toutlesensController.currentActionObj.type=="pathes") we filter directly on graph (self.filterGraphOnProperty)
     *
     * @param option : remove or add
     * @param booleanOption : only , and ,all, not
     * @param objectType node or relation
     * @param objectName :value of the type
     * @param property
     * @param operator
     * @param value
     */
    self.filterOnProperty = function (option, booleanOption, objectType, objectName, property, operator, value) {

        $("#graphPopup").css("visibility", "hidden");
        if (!property)
            property = $("#propertiesSelectionDialog_propsSelect").val();
        if (!value)
            value = $("#propertiesSelectionDialog_valueInput").val();
        if (!objectType)
            objectType = $("#propertiesSelectionDialog_ObjectTypeInput").val();
        if (!operator)
            operator = $("#propertiesSelectionDialog_operatorSelect").val();
        if (!objectName)
            objectName = $("#propertiesSelectionDialog_ObjectNameInput").val();

        if (true || toutlesensData.queriesIds.length > 1 || toutlesensController.currentActionObj.type == "pathes") {
            self.filterGraphOnProperty(option, booleanOption, objectType, objectName, property, operator, value);
            return;
        }


        if (option == "remove") {
            for (var i = 0; i < self.currentSelectdFilters.length; i++) {
                if (self.currentSelectdFilters[i].objectName == objectName)
                    self.currentSelectdFilters.splice(i, 1);
            }
        }
        if (booleanOption == "removeAll") {
            self.currentSelectdFilters = [];

        }

        if (booleanOption == "only") {

            self.currentSelectdFilters = [];
        }


        else {

            ;
        }

        if (booleanOption != "removeAll") {
            var newFilter = null;
            if (property == "" || option == "all" || value == "") {
                newFilter = {
                    property: "all",
                    objectType: objectType,
                    objectName: objectName
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
                    objectType: objectType,
                    operator: operator,
                    objectName: objectName

                }
            }

            if (newFilter){
                if (booleanOption == "not") {
                    newFilter.booleanOp = "NOT";
                }
                self.currentSelectdFilters.push(newFilter);
            }




        }
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
            objectType = filter.objectType;

            if (filter.off == true)
                continue;


            // no property but all nodes or relations
            if (property == "all") {

                objectName = filter.objectName;
                if (objectType == "node" && objectName != "") {
                    if (allNodeLabelsStr.length > 0)
                        allNodeLabelsStr += " OR ";
                    allNodeLabelsStr += "m:" + objectName;
                }
                else if (objectType == "relation") {
                    if (allRelTypesStr.length > 0)
                        allRelTypesStr += "|";
                    allRelTypesStr += objectName;
                }


            }
            else {// set property where clause

                var where = "";




                if (operator == "contains") {
                    operator = "=~ ";
                    value = "(?i).*" + value + ".*"

                }
                if (toutlesensData.whereFilter != "")
                    toutlesensData.whereFilter += " AND ";


                if (objectType == "relation") {
                    if (common.isNumber(value))

                        toutlesensData.whereFilter += "r." + property + operator + value + " ";
                    else
                        toutlesensData.whereFilter += "r." + property + operator + "\"" + value + "\" ";

                }
                else if (objectType == "startNode") {
                    if (common.isNumber(value))
                        toutlesensData.whereFilter += "node1." + property + operator + value + " ";
                    else
                        toutlesensData.whereFilter += "node1." + property + operator + "\"" + value + "\" ";

                }
                else if (objectType == "endNode" || objectType == "node") {
                    if (common.isNumber(value))
                        toutlesensData.whereFilter += "m." + property + operator + value + " ";
                    else
                        toutlesensData.whereFilter += "m." + property + operator + "\"" + value + "\" ";

                }

                if (filter.booleanOp) {
                    toutlesensData.whereFilter=" "+ filter.booleanOp+" ("+toutlesensData.whereFilter+") ";
                }
            }

        }

        if (allNodeLabelsStr.length > 0) {
            var notOp=""
            if (filter.booleanOp) {
                notOp= " NOT "
            }
            toutlesensData.queryNodeLabelFilters = " and  "+notOp+"(" + allNodeLabelsStr + ") ";
        }

        if (allRelTypesStr.length > 0)
            toutlesensData.queryRelTypeFilters = ":" + allRelTypesStr;

        if (generateGraph) {
            toutlesensController.generateGraph(null, {useCurrentStatement: true});
          //  toutlesensController.generateGraph(null, {applyFilters: true});
            var message = self.printPropertyFilters() + "<br>" + self.printRelationsFilters
            $("filterMessage").html(message);

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
                    str1 = "all " + filter.objectType + " " + filter.objectName;
                else

                    str1 += filter.objectName + " : " + filter.property + " " + filter.operator + " " + filter.value

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
