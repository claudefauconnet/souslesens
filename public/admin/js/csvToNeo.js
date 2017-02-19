/**
 * Created by claud on 06/02/2017.
 */
var currentCsvObject;
function setCsvImportFields(json) {
    currentCsvObject = json;

    fillSelectOptionsWithStringArray(fieldSelect, json.header);
    fillSelectOptionsWithStringArray(collSelect,[json.name]);
    $("#collSelect").val(json.name);
    $("#mongoCollectionRel").val(json.name);
    $("#mongoCollectionNode").val(json.name);

    fillSelectOptionsWithStringArray(dbSelect,  [json.name]);
//  $("#dbSelect").val('CSV');
    loadRequests();
    onCollSelect();


}