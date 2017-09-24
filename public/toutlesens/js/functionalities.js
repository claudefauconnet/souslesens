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

var functionalities = (function(){
 var self = {};

   self.initFunctionalities=function(){
    var profile=Gparams.profiles[Gparams.currentProfile];
self.hideFunctionalities(profile);
self.disableFunctionalities(profile)
}

   self.hideFunctionalities=function() {
       return;
       var  profile=profiles[Gparams.currentProfile]
    if (!profile)
        return;
    for (var i = 0; i < profile.hide.length; i++) {
        $("#" + profile.hide[i]).css("visibility", "hidden");
    }


}
   self.disableFunctionalities=function(profile) {
       return;
    if (!profile)
        return;
    for (var i = 0; i < profile.disable.length; i++) {
        $("#" + profile.disable[i]).prop('disabled', true);
    }
}
 return self;
})()