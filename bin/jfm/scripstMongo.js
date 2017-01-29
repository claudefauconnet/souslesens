/**
 * Created by claud on 08/01/2017.
 */

db.javatheque.find({ "level_1" : "BERSIH DESA, MERTI DUSUN"}).forEach(function(doc){
    places =doc.level_2.split("-");
    for(var i=0;i<places.length;i++){
        var place=places[i].trim();
        if(i==0)
            doc.propinsi=place;
        if(i==1)
            doc.kabupaten=place;
        if(i==2)
            doc.kecamatan=place;
        if(i==3)
            doc.kelurahan=place;
        if(i==4)
            doc.dusun=place;
    }
    db.javatheque.save(doc);

});




db.javatheque.find().forEach(function(doc){
//printjson(doc);
    for(var i=1;i<10;i++){
        var value=doc["level_"+i];

        if(value){
            //	print(value);
            if(value.indexOf(".jpg")>-1  || value.indexOf(".JPG")>-1)
                doc.photo=value;
            else if(value.indexOf(".")>-1)
                doc.document=value;
        }

    }


    db.javatheque.save(doc);
})

