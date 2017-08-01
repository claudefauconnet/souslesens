/**
 * Created by claud on 31/07/2017.
 */
var d3Graph=(function(){
    var self=  {};
    var baseUrl=window.location.href;
    baseUrl=baseUrl.substring(0,baseUrl.lastIndexOf(":")+1);


  /* self.openGraph=function(){
        var subGraph=$("#subGraph").val();
       var url=baseUrl+"3002/toutlesens/indexPOT.html?subGraph="+subGraph;
      //  var url="http://localhost:3002/toutlesens/indexPOT.html?subGraph="+subGraph;
        $("#graphIframe").attr('src',url);

    }*/

    self.updateGraphData=function(){
        var subGraph=$("#subGraphPOT").val();
        var dbName=$("#mongoDbName").val();
        var url=baseUrl+"3002/rest?updateNeo=1";
        var payload={

            "sourceType":"MongoDB",
            "dbName":dbName,
            "subGraph":subGraph

        }
        $.ajax({
            url : url,
            data : payload,
            dataType: "json",
            type : 'POST',
            error : function(error ,ajaxOptions, thrownError){

                console.log(error);
                console.log(thrownError);
                setMessage("server error" + thrownError);
            }
            ,
            success : function(data) {
                $("#message").html(data);
                startGraph();

            }
        });



    }





    return self;
})()