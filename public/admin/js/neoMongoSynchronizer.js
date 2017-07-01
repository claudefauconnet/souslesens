/**
 * Created by claud on 21/06/2017.
 */
var neoMongoSynchronizer=(function(){
    var self={};



    self.synchronize=function() {
        var dbName = $("#dbName").val();
        var collection = $("#mongoCollectionObjs").val();
        if (!collection)
            return;
        var mongoQuery = {id:2016020}
        self.importNodeNeo(dbName,collection, mongoQuery);

    }




    self.callNeo=function() {




       var  str = "MATCH (n) return n limit 25";
        console.log(str);
        var payload = {match: str};


        $.ajax({
            type: "POST",
            url: "http://localhost:3002/neo",
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
    var xx=data;
            },
            error: function (xhr, err, msg) {
                console.log(xhr);
                console.log(err);
                console.log(msg);
            },


        });
    }


    self.importNodeNeo=function(dbName,type,mongoQuery){
        var params=self.neoMappings.objects[type];
        if(!mongoQuery){
            mongoQuery=self.mongoDefaultQuery;

        }

        var payload= {
            find:1,
            dbName: dbName,
            collectionName: params.mongoCollection,
            query: mongoQuery
        }
      self.callMongo(payload, function(result){
            //for (var i=0;i<result.length;i++){
                for (var i=0;i<1;i++){
                var attrsStr="";
                var props={subGraph:dbName+"XX"}
                for (var i=0;i<params.neoProps.length;i++){
                    var prop=params.neoProps[i];
                    props[prop]=result[i][prop];
                }
                var strProps=JSON.stringify(props).replace(/"(\w+)"\s*:/g, '$1:');// quote the keys in json;
               //   strProps=JSON.parse(strProps)
                var neoCreateStr="create (n:"+params.neoLabel+" "+strProps+")";
                console.log(neoCreateStr);


                var data=
                {

                    "payload" : neoCreateStr +" RETURN n",
                    "urlSuffix":"/db/data/transaction/commit",
                    cypher:1

                }
                self.callCypher(data,function(result){
                    var www=result
                })

            }

        })



    }

    self.callMongo=function( payload, callback) {
        $("#message").val("");
      var   urlSuffix = "";
        $.ajax({
            type: "POST",
            url: Gparams.mongoProxyUrl + urlSuffix,
            data: payload,
            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                callback(data);
            },
            error: function (xhr, err, msg) {
                $("#message").css("color", red);
                $("#message").html(err);
                console.log(xhr);
                console.log(err);
                console.log(msg);
            }
        });
    }

    self.callCypher=function(payload, callback) {
        $("#message").val("");


        $.ajax({
            type: "POST",
            url: Gparams.neo4jProxyUrl ,
            data: payload,

            dataType: "json",
            success: function (data, textStatus, jqXHR) {
                callback(data);
            },
            error: function (xhr, err, msg) {
                $("#message").css("color", red);
                $("#message").html(err);
                console.log(xhr);
                console.log(err);
                console.log(msg);
            }
        });
    }



    self.neoMappings={
        objects:{
            technologies:{
                mongoCollection:"technologies",
                mongoDefaultQuery:{},
                neoLabel:"technology",
                neoProps:["id","name","dexcription"]

            }
        }




    }

   return self;
})();