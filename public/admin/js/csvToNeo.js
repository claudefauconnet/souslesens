/**
 * Created by claud on 06/02/2017.
 */
var currentCsvObject;
function setCsvImportFields(json){
    currentCsvObject=json;

        fillSelectOptionsWithStringArray(fieldSelect, json.header);
    $("#collSelect").append($('<option/>', {
        value: json.name,
        text: json.name,
    }));

    fillSelectOptionsWithStringArray(dbSelect, ['','csv']);
    $("#dbSelect.selectedIndex").val('csv');


}