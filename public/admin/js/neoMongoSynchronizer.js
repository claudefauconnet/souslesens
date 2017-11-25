/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
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
            url: Gparams.neo4jProxyUrl,
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