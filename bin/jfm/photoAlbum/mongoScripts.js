/**
 * Created by claud on 30/01/2017.
 */
var  lastDoc;
var index=0
db.famille.find({}).sort({date:1}).forEach(function(doc){
    if(!lastDoc){
        lastDoc=doc;
    }
    else{
        var diff = Math.abs(doc.date - lastDoc.date);
        print(diff)
        if(diff> 1000*60*60*24*7){
            var obj={
                start :lastDoc.date,
                end :doc.date,
                id:"period"+(index++)
            }
            db.famillePeriods.save(obj);
            lastDoc=doc;
        }


    }

})



var  lastDoc;
var index=0
db.famillePeriods.find({}).forEach(function(doc){
    db.famille.find({
        date: {
            $gte:doc.start,
            $lt: doc.end
        }
    }).forEach(function(doc2){
        doc2.periodId=doc.id;
        db.famille.save(doc2);
    })
})



db.famille.find({}).forEach(function(doc2){
    doc2.path=doc2.path.substring(21);
    doc2.name=doc2.path.substring(doc2.path.lastIndexOf("/")+1);
    db.famille.save(doc2);
})



var regex=/([0-9]{4})-([0-9]{2})-([0-9]{2}).*/g

db.famille.find({}).forEach(function(doc){


    var date=doc.date.toJSON();
    print(date);
    if(date){

        var array=regex.exec(date)

        if(array && array.length>1){
            doc.year=parseInt(array[1])
            doc.month=parseInt(array[2])
            doc.day=parseInt(array[3])
            db.famille.save(doc);

        }
    }





    db.synsets.find({}).forEach(function(doc){
        if(doc.synonyms){
            var synonyms=doc.synonyms.split(";");
            if(synonyms){
                for(var i=1;i<synonyms.length;i++){
                    if(synonyms[i]&&synonyms[i].length>0){
                        var doc={lang:'FR',
                            nameA:synonyms[0],
                            nameB:synonyms[i],
                            thesaurus:doc.category
                        }
                        db.synonyms.save(doc);
                    }
                }
            }

        }

    })

    db.synonyms.find({}).forEach(function(doc){
        db.node_words.find({keyWord:doc.nameA}).forEach(function(doc2){
            doc.conceptId=doc2.node_id;
            db.synonyms.save(doc);
        })

    })
    db.synonyms.find({}).forEach(function(doc){
        if(doc.conceptId){
            db.nodes2.find({id:doc.conceptId}).forEach(function(doc2){
                doc.concept=doc2.name;
                db.synonyms.save(doc);
            })
        }

    })




