/**
 * Created by claud on 20/10/2017.
 */
var jsTreeController = (function () {

    var self = {};
    self.nodesData = {};
    self.addtionalMenuItems = {};
    self.tree;
   /* self.getCustomMenu = function () {
    };*/
    self.types = {}
    self.load = function (data, divId, callback) {
        self.tree = $('#' + divId);
        if (!data)
            return;
        for (var i = 0; i < data.length; i++) {
            self.nodesData[data[i].id] = data[i].data;
        }
        var plugins = [];
        plugins.push("sort");
        plugins.push("search");
        plugins.push("contextmenu");
        plugins.push("dnd");


        $('#' + divId).jstree("destroy").empty();
        var jsTree = $('#' + divId)
            .on("select_node.jstree",
                function (evt, obj) {

                    callback(obj.node);

                }).on("loaded.jstree", function (evt, obj) {
                $('.jstree-classic li[rel="Role"] > a ').css("font-family", "verdana, sans-serif;");
                $('.jstree-classic li[rel="Role"] > a ').css("font-size", "10px");


            })
            .jstree({
                    'core': {
                        data: data,


                        // so that create works
                        'check_callback': function (operation, node, node_parent, node_position, more) {
                            // operation can be 'create_node', 'rename_node', 'delete_node', 'move_node' or 'copy_node'
                            // in case of 'rename_node' node_position is filled with the new node name
                            if (operation === "move_node") {
                                var sourceNode = node.data;
                                if (!more.ref)
                                    return true;
                                var targetNode = more.ref.data;
                                return jsTreeController.canDrop(sourceNode, targetNode);
                            }
                            return true;  //allow all other operations

                        },
                    },
                    'contextmenu': {
                        'items': self.getCustomMenu
                    },
                    "dnd": {
                        // check_while_dragging: true
                    },
                    "types": self.types,
                    "plugins": plugins,


                }
            ).bind("move_node.jstree", function (e, data) {
                return jsTreeController.ondDropEnd(data);


            });


        self.getCustomMenu = function ($node) {

            var items = {
                "Create": {
                    "separator_before": false,
                    "separator_after": false,
                    "label": "Create",
                    "action": function (obj) {
                        $node2 = self.tree.jstree('create_node', $node);
                        jsTreeController.tree.jstree('edit', $node2);
                    }
                },
                "Rename": {
                    "separator_before": false,
                    "separator_after": false,
                    "label": "Rename",
                    "action": function (obj) {
                        jsTreeController.tree.jstree('edit', $node);
                    }
                },
                "Remove": {
                    "separator_before": false,
                    "separator_after": false,
                    "label": "Remove",
                    "action": function (obj) {
                        jsTreeController.tree.jstree('delete_node', $node);
                    }
                }
            };
            var menuItemData = $.extend(true, {}, $node.data);//clone
            for (var key in self.addtionalMenuItems) {
                self.addtionalMenuItems[key].data = menuItemData;
                items[key] = self.addtionalMenuItems[key];
            }
            return items;

        }


        function customMenuOld() {
            var items = {};
            items ["menu1"] = {
                label: "Add  child ",
                data: [],
                action: (function (menuItem) {
                    self.onMenuAdd(menuItem);
                })

            }
            return items

        }

        self.canDrop = function (source, target) {

            return true;

        }
        self.ondDropEnd = function (data) {


        }
        self.onMenuAdd = function (menuItem) {
        }
        var xx = 1;

    }


    return self;

})()