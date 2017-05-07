/**
 * Created by claud on 07/05/2017.
 */


var simpleUI = function () {

    self = {};

    var cloudInited=false;


    self.listResult = function (resultArray) {

        tags = getCloudTagData(resultArray);
        updateTagCloud();


    }


    function getCloudTagData(resultArray) {
if(cloudInited===false){
    cloudInited=true;
    initCloud();
}
        clearCloud();
        var tagCloudObj = {};
        var distinctLabelsLabels = [];
        var maxFreq = 0;
        for (var i = 0; i < resultArray.length; i++) {
            var nodes = resultArray[i].nodes;
            for (var j = 0; j < nodes.length; j++) {
                var nom = nodes[j].properties.nom;
                var label = nodes[j].labels[0];
                var str = nom + "_" + label;
                if (!tagCloudObj[str]) {
                    tagCloudObj[str] = {
                        distance: 0,
                        nom: nom,
                        label: label,
                        freq: 1
                    }

                }
                tagCloudObj[str].distance += j;
                tagCloudObj[str].freq += i;
                maxFreq += 1;


                if (distinctLabelsLabels.indexOf(label) < 0)
                    distinctLabelsLabels.push(label);
            }
        }
        var tagCloudData = [];
        for (var key in tagCloudObj) {
            tagCloudData.push({
                freq: Math.round(maxFreq / [key].freq),
                value: distinctLabelsLabels.indexOf(tagCloudObj[key].label),
                key: tagCloudObj[key].nom,
            });
        }
        return tagCloudData;

    }


    function clearCloud() {
        var items = d3.select("#vis").selectAll("*");
        items = items[0];
        if (!items)
            return;
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            if (item.__data__) {
                d3.select(item).remove();
            }
        }

    }


    return self;
}();