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
var syntax = {};

function initSyntax() {
	syntax = {

		functionDefs : {},
		functionCall : {},
		variables : [],
		globalvariables : [],
		files : []
	};
}

var globalText = "";

function analyzeJSdir(url) {
	globalText = "";
	initSyntax();
	var files = [ "chronology.js", "export.js", "externalRessources.BNF.js",
			"externalRessources.common.js", "externalRessources.DbPedia.js",
			"graphTraversal.js", "index.js", "modifyData.js", "params.js",
			"spreadsheetClass.js", "textOutputs.js", "toutlesensController.js",
			"toutlesensData.js" ];
	for (var i = 0; i < files.length; i++) {
		url = "http://localhost:8080/souslesens/toutlesens/js/" + files[i];
		$.ajax({
			url : url,
			async : false,
			success : function(result) {
				var p = url.lastIndexOf('/');
				var fileName = "";

				if (p > -1)
					fileName = url.substring(p + 1);
				else
					fileName = url;

				parseJS(result, fileName);

				if (i == files.length - 1) {
					setFunctionsCalls();
					saveSyntax(syntax);
					var result = JSON.stringify(syntax)
							.replace(/},/g, "},<br>")

					$("#result").html(result);
				}
			}
		});
		/*
		 * var request=$.ajax( url, { dataType: "json" } ), chained =
		 * request.then( function(result) { var p = url.lastIndexOf('/'); var
		 * fileName = ""; if (p > -1) fileName = url.substring(p + 1); else
		 * fileName = url;
		 * 
		 * parseJS(result, fileName); // console.log(JSON.stringify(rootNode));
		 * if(i==files.length-1){ processSyntax(); }
		 * 
		 * });
		 * 
		 * chained = request.then(
		 */

	}

}

function parseJS(txt, file) {
	globalText += txt + "\n";
	var length=txt.length;
	var offset = 0;
	var bracketStarts = [];
	var bracketEnds = [];
	var functionDefsArray=[];
	var l = syntax.files.length;
	if (l > 0)
		offset = syntax.files[l - 1].end + 1
	syntax.files.push({
		name : file,
		start : offset,
		end : offset + txt.length,

	});

	// console.log(JSON.stringify(syntax.files));
	var ob = -1;
	var cb = -1;
	var sf = -1;
	var sv = -1;
	var ev = -1;

	while ((ob = txt.indexOf("{", ++ob)) > -1) {
		bracketStarts.push(ob);
	}
	while ((cb = txt.indexOf("}", ++cb)) > -1) {
		bracketEnds.push(cb);
	}

	var bs = bracketStarts.length;
	var be = bracketEnds.length;
	if (bs != be) {
		console.log("!!!!code malformed on brackets " + bs + " / " + be);
		return;
	}

	
	var matches= txt.match(/function.*\(.*\)/g );
	if(matches){
		var lastStart=0;
	for (var i = 1; i < matches.length; i++) {
		
				var p=matches[i].indexOf("(")
		var fnName=matches[i].substring(8,p).trim();
				if(fnName.length>0){
		var start=txt.indexOf(matches[i]);
		lastStart=start;
		var params=matches[i].substring(p+1,matches[i].indexOf(")")).split();
		
		var fnObj={
				name : fnName,
				params : params,
				file : file,
				start : start,
				variables : []
			}
		syntax.functionDefs[fnName] =fnObj;
		functionDefsArray.push(fnObj)
				
	}
	}
	for( var i=1;i<functionDefsArray.length;i++){
		functionDefsArray[i-1].end=functionDefsArray[i].start;	
	}
	}
	functionDefsArray[functionDefsArray.length-1].end=txt.length-1
	
	
	var sv = ev = -1;

	while ((sv = txt.indexOf("var ", ++sv)) > -1) { // parse var
		ev = sv + 4 + getRegExFirstposition(txt.substring(sv + 4), /[ =]/g);

		var varName = txt.substring(sv + 4, ev);
		var v2 = txt.indexOf("function", sv);
		var v4 = txt.indexOf(";", sv);
		if (v2 < v4) {

			// parseFunctionDef(str,v2,file);
		} else {
			syntax.variables.push({
				name : varName,
				file : file,
				start : sv,
				end : ev,
				variables : []
			});
		}

	}
	processSyntax(bracketStarts, bracketEnds);

}



function processSyntax(bracketStarts, bracketEnds) {
	function setFunctionsEnd() {
		/*	for ( var key in syntax.functionDefs) {
			var functionDef = syntax.functionDefs[key];
			for (var i = 1; i < bracketStarts.length; i++) {
				if (functionDef.start >= bracketStarts[i - 1]
						&& functionDef.start < bracketStarts[i]) {
					var bracketEndsPos = bracketEnds[bracketStarts.length - i];
					syntax.functionDefs[key].end = bracketEndsPos;
				}
			}*
		}*/
	}
	function setVariablesLocation() {
		for (var i = 0; i < syntax.variables.length; i++) {
			for ( var key in syntax.functionDefs) {
				var fn = syntax.functionDefs[key];
				var variable = syntax.variables[i];
				if (variable.file == fn.file && variable.start > fn.start
						&& variable.end < fn.end) {
					syntax.functionDefs[key].variables.push(variable);
					syntax.variables[i].isLocal = true;

				}

			}

		}
		for (var i = 0; i < syntax.variables.length; i++) {
			if (!syntax.variables[i].isLocal
					&& syntax.globalvariables.indexOf(syntax.variables[i]) < 0)
				syntax.globalvariables.push(syntax.variables[i]);
		}

	}

	setFunctionsEnd();
	setVariablesLocation();

}
function setFunctionsCalls() {
	var i = 0;
	for ( var key in syntax.functionDefs) {

		var p, q = -1;
		while ((p = globalText.indexOf(key, q)) > -1 && i++ < 10000) {
			q = p + 1
			if (!syntax.functionCall[key])
				syntax.functionCall[key] = []
			syntax.functionCall[key].push({
				globalIndex : p
			})

		}
	}
	for ( var key in syntax.functionCall) {
		for (var i = 0; i < syntax.functionCall[key].length; i++) {
			var call = syntax.functionCall[key][i];
			for (var j = 0; j < syntax.files.length; j++) {
				// console.log(""+call.globalIndex+" "+syntax.files[j].start
				// +" "+syntax.files[j].end)
				if (call.globalIndex >= syntax.files[j].start
						&& call.globalIndex < syntax.files[j].end) {
					syntax.functionCall[key][i].file = syntax.files[j].name;
					syntax.functionCall[key][i].index = call.globalIndex
							- syntax.files[j].start;
				}
			}
		}

	}

	console.log(i);

}


function saveSyntax(syntax){
	for(var key in syntax.functionDefs){
	var data=syntax.functionDefs[key];
	var jsonData={
			mongoDB:"CFappsModels",
			collection:"souslesens",
			json:data
	}
	
	
	submitMongo("action=saveData", jsonData, function(result){
		console.log("done");
	})
	}
	
}

function submitMongo(query, data, callback) {

	// if(confirm("execute request ?"))
	jsonData = JSON.stringify(data);
	console.log(jsonData);
	jsonData = encodeURIComponent(jsonData);
	jsonData = "&jsonData=" + jsonData;

	var method = "POST";
	var format = "json";
	var callback = callback;
	var url = "../adminServlet?" + query + jsonData;
	$.ajax({
		type : method,
		url : url,
		dataType : format,
		async : false,
		success : callback,
		data : null,
		error : function(xhr, ajaxOptions, thrownError) {
			console.log(xhr);
			console.log(thrownError);
			//setMessage("server error" + thrownError);
		}

	});
}
