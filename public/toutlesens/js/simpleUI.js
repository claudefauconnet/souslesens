/*******************************************************************************
 * TOUTLESENS LICENCE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr
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

var simpleUI = (function(){
 var self = {};




//moved  var simpleUI = function () {

    self = {};

    var cloudInited=false;


    self.listResult = function (resultArray) {

self.getCloudTagData(resultArray);
        updateTagCloud();


    }


       self.getCloudTagData=function(resultArray) {
if(cloudInited===false){
    cloudInited=true;
    initCloud();
}
self.clearCloud();
        var tagCloudObj = {};
        var distinctLabelsLabels = [];
        var maxFreq = 0;
        for (var i = 0; i < resultArray.length; i++) {
            var nodes = resultArray[i].nodes;
            for (var j = 0; j < nodes.length; j++) {
                var nom = nodes[j].properties[Gparams.defaultnodeNameField];
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
                key: tagCloudObj[key][Gparams.defaultnodeNameField],
            });
        }
        return tagCloudData;

    }


       self.clearCloud=function() {
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
})();
