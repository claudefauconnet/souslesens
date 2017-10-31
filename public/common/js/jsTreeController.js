/**
 * Created by claud on 20/10/2017.
 */
var jsTreeController = (function () {

    var self = {};
self.nodesData={}
    self.load = function (data, divId, callback) {
    for(var i=0;i<data.length;i++){
        self.nodesData[data[i].id]=data[i].data;
    }
        var plugins = [];
        plugins.push("sort");
        plugins.push("search");
        plugins.push("contextmenu");
        plugins.push("dnd");

        types = [];

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
                       /* 'contextmenu': {
                            'items': customMenu
                        },*/
                        "dnd": {
                            // check_while_dragging: true
                        },
                        "types": types,
                        "plugins": plugins,





                }
            ).bind("move_node.jstree", function (e, data) {
                return jsTreeController.ondDropEnd(data);


            });




function customMenu(){
    var items=[];;
        items ["menu1" ] = {
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
        self.onMenuAdd=function(menuItem){
}
var xx=1;
    }


    return self;

})()