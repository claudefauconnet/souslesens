var dataTable = (function () {
    var self = {};

    self.dataSet = [];
    self.columns = [];


    self.loadNodes = function ( query,options) {
        if(!options)
            options={};
        toutlesensData.cachedResultArray = null;
        self.dataSet = [];
        self.columns = [];

        var payload = {
            match: query
            // match: "MATCH path=(n)-[r]->(m) "+ self.getCurrentWhereClause() + "return count(r) as countRel;"
        }


        $.ajax({
            type: "POST",
            url: advancedSearch.neo4jProxyUrl,
            data: payload,
            dataType: "json",
            success: function (json, textStatus, jqXHR) {


                var tableData = toutlesensData.neoNodeResultToColumnDataSet(json);
                self.columns = tableData.columns;
                self.dataSet = tableData.dataSet;

                var columns2 = []
                for (var i = 0; i < self.columns.length; i++) {
                    columns2.push({title: self.columns[i]})
                }


                // $("#graphDiv").html("<br><br><br><div id='dataTableDiv'></div><table style=' z-index:100 ' id='dataTable'></table></div>");
               var containerDiv="graphDiv";
                if(options.containerDiv)
                    containerDiv=options.containerDiv

                $("#graphInfosDiv").css("visibility", "hidden")
                $("#"+containerDiv).html("<br><br><br></div><table style=' z-index:100 ' id='dataTable'  class='myDatatable cell-border display nowrap'></table>");
                $('#dataTable').css("font-size", "10px");


                var height = $("#graphDiv").height() - 50
                $('#dataTable').width("100%").height(height);
                var table = $('#dataTable').DataTable({
                    data: self.dataSet,
                    columns: columns2,
                    scrollX: true,
                    scrollY: height - 100,
                    fixedColumns: {
                        heightMatch: 'none'
                    },
                    dom: 'Bfrtip',
                    buttons: [
                        //'copyHtml5',
                        'excelHtml5',
                        'csvHtml5',
                        'pdfHtml5'
                    ]
                })
             /*   table.buttons().container()
                    .appendTo( $('.col-sm-6:eq(0)', table.table().container() ) );*/


                $('#dataTable tbody').on('click', 'tr', function (event) {
                    if ($(this).hasClass('selected')) {
                        $(this).removeClass('selected');
                        $("#dataTable tbody tr").css("height", "20px");
                    }
                    else {
                        $('tr.selected').removeClass('selected');
                        $(this).addClass('selected');
                        var px = event.clientX;
                        var py = event.clientY;
                        var idx = table.cell('.selected', 0).index();
                        // var data = table.row( idx.row ).data();
                        var line = dataTable.dataSet[idx.row];
                        currentObject = {id: line[line.length - 1]};

                        toutlesensController.dispatchAction("nodeInfos", currentObject.id);
                        toutlesensController.showPopupMenu(px, py, "nodeInfo");
                    }
                });


            }
            , error: function (err) {
                var x = err;
            }
        })
    }



    return self;

})()

