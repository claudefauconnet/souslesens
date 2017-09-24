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

function testEsprima(){
	var input=$("#input").val();
	var syntax = esprima.parse(input,{loc:true});
	var input=$("#output").val(JSON.stringify(syntax));
		var file="test"
	var mySyntax = {

			functionDefs : [],
			functionCalls : [],
			variables : [],
			globalVariables : [],
			files : []
		};
	


		for (var i = 0; i < syntax.body.length; i++) {
			if (syntax.body[i].type == "VariableDeclaration") {
				for (var j = 0; j < syntax.body[i].declarations.length; j++) {
					var obj=syntax.body[i].declarations[j].id;
					obj.file=file;
					mySyntax.globalVariables.push(obj);
				}
			}
			if (syntax.body[i].type == "FunctionDeclaration") {
				var obj=syntax.body[i].id;
				obj.file=file;
				obj=processLoc(obj);
				mySyntax.functionDefs.push(obj);
				
				
			}

		}

		var functionCalls = grep(syntax, "type", "CallExpression");
		for (var i = 0; i < functionCalls.length; i++) {
			var obj=functionCalls[i].callee;
			if (!obj.name  || obj.name == "$")
				continue;
			obj.file=file;
			obj=processLoc(obj);
			mySyntax.functionCalls.push(obj)
		}

		;

	

	function grep(json, field, fieldValue) {
		var matches = []
		function recurse(child) {
			for ( var key in child) {
				var value = child[key];

				if (Array.isArray(value)) {
					for (var i = 0; i < value.length; i++) {
						recurse(value[i]);
					}
				} else if (value instanceof Object) {
					for ( var key2 in value) {
						recurse(value[key2]);
					}
				} else {
					if (value == fieldValue) {
						// console.log(JSON.stringify(child)+'\n')
						if (child[field] == fieldValue) {
							matches.push(child);
						}
					}

				}

			}

		}
		recurse(json);
		return matches

	}
}

function processLoc(obj){
	if(obj.loc){
		obj.startLine=obj.loc.start.line;
		obj.endLine=obj.loc.end.line;
		delete obj.loc;

	}
	return obj;
}


	
	
