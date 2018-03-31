var advancedSearch = (function () {

    self = {};
    self.userMappings = {};
    self.currentField = {}
    self.criteria = []

    self.showAdvancedQueryDialog = function () {
        $("#dialog").css("visibility", "visible");
        $("#dialog").load("htmlSnippets/advancedSearch.html", function () {
            $('#advancedSearchDialog_fieldInput').attr('disabled', 'disabled');
            var data = [];

            for (var key in  self.userMappings) {
                var node = {
                    id: key,
                    text: key,
                    parent: "#"
                }
                data.push(node);
                for (var key2 in  self.userMappings[key].fields) {
                    var child = {
                        id: key + "_" + key2,
                        text: key2,
                        parent: key,
                        data: self.userMappings[key].fields[key2]
                    }
                    data.push(child);
                }
            }
            $('#jsTreeDiv').jstree({

                'core': {
                    'data': data
                }

            }).on('select_node.jstree', function (node, selected, event) {

                self.advancedSearchOnFieldSelect(selected.node);
            })


            /*.on('loaded.jstree', function() {
                $('#jsTreeDiv').jstree('open_all');
            })*/


        })
    }

    self.advancedSearchOnFieldSelect = function (node) {
        if (node.parent != self.currentField.parent)
            self.clearAllCriteria()
        self.currentField = node;
        $("#advancedSearchDialog_fieldInput").val(node.text)
        var operators = [];
        if (node.data && node.data.type) {
            var type = node.data.type;
            if (type == "keyword") {
                operators.push("=")
            }
            else if (type == "text") {
                operators.push("contains");
                operators.push("=");
                operators.push("#");
            }
            else if (type == "integer") {
                operators.push(">");
                operators.push("=");
                operators.push("<");
                operators.push("beetween");
            }
            else if (type == "date") {
                operators.push(">");
                operators.push("=");
                operators.push("<");
                operators.push("beetween");
             /*   $(function () {
                    $("#advancedSearchDialog_valueInput").datepicker();
                });*/
            }
            for (var i = 0; i < operators.length; i++) {
                $("#advancedSearchDialog_operatorSelect").append("<option>" + operators[i] + "</option>");
            }

        }

    }
    self.addCriterion = function () {
        $("#advancedSearchDialog_searchDiv").css("visibility", "visible")
        var criterion = {
            index: self.currentField.parent,
            field: self.currentField.text,
            type: self.currentField.data.type,
            operator: $("#advancedSearchDialog_operatorSelect").val(),
            value: $("#advancedSearchDialog_valueInput").val()
        }

        var criterionStr = $("#advancedSearchDialog_fieldInput").val() + " " + criterion.operator + " " + criterion.value + "<br>"
        $("#advancedSearchDialog_criteriaDiv").append(criterionStr);
     //   if (criterion.type == "date") {
            self.criteria.push(criterion);



    }

    self.clearAllCriteria = function () {
        $("#advancedSearchDialog_searchDiv").css("visibility", "hidden")
        $("#advancedSearchDialog_criteriaDiv").html("");
        self.criteria = []
    }
    self.executeSearchQuery = function () {
        var rangeOperators = {
            "<": "lt",
            ">": "gt",
            "<=": "lte",
            ">=": "gte",

        }

        var queryElts = [];
        var rangeObj = null;
        var mustNotObj = {};
        var associatedWords = [];
        for (var i = 0; i < self.criteria.length; i++) {
            var criterion = self.criteria[i];
            var field = criterion.field;
            var value = criterion.value;
            var operator = criterion.operator;
            var value = criterion.value;
            var index = criterion.index;

            var queryElt = {};

            associatedWords.push(value);
            if (operator == ">" || operator == "<") {
                if (!rangeObj)
                    rangeObj = {range: {}};
                if (!rangeObj.range[field])
                    rangeObj.range[field] = {format: "dd/MM/yyyy||yyyy||MM/yyyy"};
                rangeObj.range[field][rangeOperators[operator]] = value;
            }
            else if (operator == "contains") {
                queryElt = {
                    "wildcard": {"content": "*" + value + "*"}
                }
                queryElts.push(queryElt);
            }
            else if (operator == "#") {
                mustNotObj = {
                    "match": {}
                };
                mustNotObj.match[field] = value;
            }


            else if (operator == "=") {
                var matchObj = {"match": {}}
                matchObj.match[field] = value;
                queryElts.push(matchObj);
            }

        }

        if (rangeObj) {

            queryElts = queryElts.concat(rangeObj);
        }

        var query =
            {
                "bool": {
                    "must": queryElts
                }
            }



        var classifierSourceStr = null;
        var payload = {
            findDocuments: 1,
            options: {
                from: 0,
                size: fetchSize,
                indexName: index,
                queryObject: query,

                getAssociatedWords: {
                    indexName: index,
                    word: associatedWords,
                    size: 100,
                    iterations: 5,
                    classifierSource: classifierSourceStr

                }
            }
        };


        $.ajax({
            type: "POST",
            url: elasticUrl,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
              //  $("#dialog").css("visibility", "hidden");
             //   $("#advancedSearchDialog_searchDiv").css("visibility", "hidden");

                searchUI.processSearchResults(data);

            }
            , error: function (xhr, err, msg) {
             //   $("#dialog").css("visibility", "hidden");
             //   $("#advancedSearchDialog_searchDiv").css("visibility", "hidden");

                return (err);
            }

        });


    }


    return self;


})
();