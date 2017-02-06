/**
 * Created by claud on 01/02/2017.
 */
var personsA=db.PersonPerson.distinct("Person A");
var personsB=db.PersonPerson.distinct("Person B");
for(var i=0;i<personsB.length;i++){
    if(personsA.indexOf(personsB[i])<0)
        personsA.push(personsB[i]);
}
printjson(personsA);
for(var i=0;i<personsA.length;i++){
    var doc={name:personsA[i]};
    db.persons.save(doc);



}