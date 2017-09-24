/*******************************************************************************
 * SOUSLESENS LICENSE************************
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2016-2017 Claude Fauconnet claude.fauconnet@neuf.fr
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

var ObjectID = require('mongodb').ObjectID;
Util = {

    prepareJsonForMongo: function (obj) {
      /*  if (!(typeof obj === "object"))
            obj = JSON.parse(obj);*/

        for (var key in obj) {

            var value = obj[key];
            if (!(typeof value === "object")) {
                if (key == "_id") {
                  /*  if(ObjectID.isValid(value))
                        obj[key] = new ObjectID(id);*/
                    var id = "" + obj[key];
                    if (id.length > 24)
                        id = substring(id.length - 24);


                    while (id.length < 24){
                        id = "F" + id;
                    }
                    console.log(id);
                      obj[key] = new ObjectID.createFromHexString(id);
                   // obj[key] = new ObjectID(id);

                }

                else if (!isNaN(value) && value.indexOf) {
                    if ( value.indexOf(".") > -1)
                        value = parseFloat(value)
                    else
                        value = parseInt(value)
                    obj[key] = value;
                }
            }
        }
    }
}


module.exports = Util;