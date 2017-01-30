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






