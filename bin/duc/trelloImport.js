

var jsonFileStorage=require('../jsonFileStorage.js');


var trelloImport={



    import:function(file){

        jsonFileStorage.retrieve(file, function(err,json){
            var listsObj={}
            var lists=json.lists;
            for(var i=0;i<lists.length;i++){
                var idList=lists[i].id;
                if(!listsObj[idList] )
                    listsObj[idList]={list:lists[i].name,cards:[]}
            }



            var cards=json.cards;

            for(var i=0;i<cards.length;i++){
                var idList=cards[i].idList;


                listsObj[idList].cards.push({name:cards[i].name,id:cards[i].id});
            }


            var str="idList\tlist\tcardName\tidCard\n";
            for(var idList in listsObj){

                for( var i= 0;i< listsObj[idList].cards.length;i++){
                    str+=idList+"\t"+listsObj[idList].list+"\t"+listsObj[idList].cards[i].name+"\t"+listsObj[idList].cards[i].id+"\n";
                }

            }
            console.log(str);

        })
    }




}
module.exports=trelloImport;


var file="../../schemas/trelloDUC.json";

trelloImport.import(file);