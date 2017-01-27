/**
 * Created by claud on 18/01/2017.
 */



function roundRange(range) {

    var magnMin = ("" + Math.abs(range.min)).length;
    var magnMax = ("" + Math.abs(range.max)).length;
    var value0 = Math.pow(10, magnMin - 1);
    var value1 = Math.pow(10, magnMax - 1);
    var value0 = Math.floor(range.min / value0) * value0;
    var value1 = Math.ceil(range.max / value1) * value0;
    var nclasses=Math.abs((value0-value1)/ Math.pow(10, magnMin - 1))
    return {min: value0, max: value1};
}
var range={min: -850, max: -26}


roundRange(range);


var value=856;

var magn=(""+value).length;

var result=Math.pow(10,magn-1);

var result1=Math.floor(value/result)*result
var result2=Math.ceil(value/result)*result
console.log(result);
