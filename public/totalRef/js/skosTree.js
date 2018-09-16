var skosTree = (function () {
    var self = {}
    self.currentNodeData=null;
    self.data=null;


    self.loadTree = function (treeDivId, skosInput) {
        var ontology = $("#" + skosInput).val();
        var payload = {
            loadSkosToTree: 1,
            ontology: ontology,
        };
        jsTreeController.types = {
            "draft": {icon: "/toutlesens/icons/" + "BU.png"},
            "toValidate": {icon: "/toutlesens/icons/" + "DC.png"},
            "ok": {icon: "/toutlesens/icons/" + "BB.png"}
        }

        jsTreeController.addtionalMenuItems = {
            ":status-draft": {
                "separator_before": false,
                "separator_after": false,
                "label": "status-draft",
                "action": function (obj) {
                    obj.item.data.status = "draft";
                    obj.item.type = "draft"

                    var xxx = "";//  jsTreeController.jstree('delete_node', $node);

                }
            }
        }

        $.ajax({
            type: "POST",
            url: "/rdf",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                self.data=data;
                //  console.log(JSON.stringify(data,null,2))
                jsTreeController.load(data, treeDivId, function (node) {

                    self.currentNodeData=node.data
                    self.currentNodeData.id=node.id;
                    self.currentNodeData.text=node.text;
                    $("#sourceSearchExpression").val(node.text);
                 //   $("#" + treeDivId).jstree("select_node", "ul > li:first");
                    var selectedNode = $("#" + treeDivId).jstree("get_selected");
                    $("#" + treeDivId).jstree("open_node", selectedNode, false, true);
                    self.showSynonyms(node.data.synonyms)

                })
            }
        })
    }
    self.saveTree = function (DivId, thesaurusInput) {
        var treeData = $("#" + DivId).jstree()._model.data;
//console.log(JSON.stringify(treeData,null,2))
        var ontology = $("#" + thesaurusInput).val();
        var payload = {
            saveTreeToSkos: 1,
            ontology: ontology,
            treeData: treeData
        };


        $.ajax({
            type: "POST",
            url: "/rdf",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                admin.setMessage("thesaurus saved", "green")
            }
            , error: function (err) {
                admin.setMessage("Error", "red")
            }
        })
    }

    self.searchTree = function (searchInput) {
        var word = $("#" + searchInput).val();
        // $("#treeDiv1").jstree("search", word);
        $("#treeDiv1").jstree(true).search(word);
    }


    self.createTree = function (rootText, jsTreeDivId) {

        if (!rootText) {
            rootText = $('skosInput1').val();
        }
        rootText = "XX";
        var root = {text: rootText, parent: "#"}
        jsTreeController.load(root, jsTreeDivId, function (err, node) {

        })
    }
    self.createNode = function (jsTreeDivId) {
        var name = prompt("node name");
        if (name && name.length > 0) {
            var node = {
                text: name,
                children: [],
                id: Math.round(Math.random() * 100000000)
            }
            $('#' + jsTreeDivId).jstree().create_node("#", node, "first", function (www) {
                $('#' + jsTreeDivId).jstree('open_node', "#");

            })
        }

    }

    self.showSynonyms = function (synonyms) {
        var text = "<ul>"
        for (var i = 0; i < synonyms.length; i++) {
            text += "<li>" + synonyms[i] + "</li>"
        }
        text += "</ul>";
        $("#synonymsDiv").html(text);
        $("#nlpAccordion").accordion( "option", "active",3 );
    }




    return self;


})();