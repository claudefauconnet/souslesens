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

var dbName;
var storedQueries;
// messageDivId=document.getElementById("message");

$(function() {
	initDBs();
	// storedQueries= new StoredQueries(qHistory,jsonStr,jsonStr);

});

function createDB() {
	dbName = $("#dbName").val();
	if (!dbName || !dbName.length > 0) {
		setMessage("enter dbName", "red");
	}
	proxy_createDB(dbName);

}

function createNodeNature() {
	var dbName = $("#dbName").val();
	if (!dbName || !dbName.length > 0) {
		setMessage("enter dbName", "red");
	}
	if (!nodeNatureName || !nodeNatureName.length > 0) {
		setMessage("enter nodeNatureName", "red");
	}

	if (!nodeNatureColor || !nodeNatureColor.length > 0) {
		setMessage("enter nodeNatureColor", "red");
	}

	var obj = {
		type : "nodeNature",
		name : $(nodeNatureName).val(),
		color : $(nodeNatureColor).val()
	};

	proxy_addItem(dbName, "admin", obj);
}

function executeAction(action) {
	var fieldsStr = $("#fields").val();
	var fieldsObj = JSON.parse(fieldsStr);

	$("#stateDisplay").html("");
	dbName = $("#dbName").val();
	if (!dbName || !dbName.length > 0) {
		setMessage("enter dbName", "red");
	}
	var jsonStr = $("#jsonStr").val();
	if (!jsonStr || !jsonStr.length > 0) {
		setMessage("enter json", "red");
	}
	addQuery(jsonStr);
	var collectionName = $("#collectionName").val();
	if (!collectionName || !collectionName.length > 0) {
		setMessage("enter collectionName", "red");
	}
	try {
		var obj0;
		if (jsonStr == null || jsonStr == "") {
			obj0 = [ {} ];
		} else {
			obj0 = JSON.parse(jsonStr);
			if (obj0 == null)
				obj0 = [ {} ];
		}
		if (!$.isArray(obj0)) {
			obj0 = [ obj0 ];
		}

		var result = "";
		for (var i = 0; i < obj0.length; i++) {
			obj = obj0[i];
			if (action == "add")
				result = proxy_addItem(dbName, collectionName, obj);
			else if (action == "update")
				result = proxy_updateItem(dbName, collectionName, obj);
			else if (action == "delete")
				result = proxy_deleteItem(dbName, collectionName, obj.id);
			else if (action == "get") {
				if (!isEmpty(fieldsObj))
					result = proxy_loadDataFields(dbName, collectionName, obj,
							fieldsObj);
				else
					result = proxy_loadData(dbName, collectionName, obj);

			} else if (action == "exportCSV") {
				if (!isEmpty(fieldsObj))
					result = proxy_loadDataFields(dbName, collectionName, obj,
							fieldsObj);
				else
					result = proxy_loadData(dbName, collectionName, obj);
				var sep = "\t";
				if ($("#csvSep")) {
					sep = $("#csvSep").val();
				}
				var body = formatResultToCsv(result, sep);
				$("#resultTextArea").val(body);
				$("#mongoTabs").tabs({
					active : 1
				});
				return;
			} else if (action == "exportJson") {
				if (!isEmpty(fieldsObj))
					result = proxy_loadDataFields(dbName, collectionName, obj,
							fieldsObj);
				else
					result = proxy_loadData(dbName, collectionName, obj);
				$("#resultTextArea").val(JSON.stringify(result));
				$("#mongoTabs").tabs({
					active : 1
				});
				return;
			} else if (action == "importJson") {
				// importResultJson(dbName, collectionName, obj);
				alert("to implement...");
				return;
			}

		}
		if ($.isArray(result)) {
			// $("#resultTextArea").val(JSON.stringify(result));
			var headers = Spreadsheet_GetHeader(result);
			processResult(result, headers);
			// drawSpreadSheet(resultSheet, null, result);
			drawResultSpreadSheet(headers, result);
			$("#mongoTabs").tabs({
				active : 0
			});

		} else {
			setMessage(result, "green");
		}
	} catch (e) {
		setMessage(e, "red");
	}

}

function addQuery(q) {

	if ($.inArray(q, $("#qHistory").val()) < 0) {
		var val = qHistory.options.length + 1;
		$("#qHistory").append($('<option/>', {
			value : val,
			text : q,
		}));
		$("#qHistory").sort(function(a, b) {
			a = a.value;
			b = b.value;

			return b - a;
		});
	}
}

function selectQuery() {
	$("#jsonStr").val($(qHistory).text());
}

function saveQueries() {
	dbName = $("#dbName").val();
	var q = $("#qHistory").text();
	var obj = JSON.parse('{"type":"query"}",{"value":' + q + '}');
	proxy_addItem(dbName, "admin", obj);
}

function loadQueries() {
	dbName = $("#dbName").val();
	var queries = proxy_loadData(dbName, 'admin', {
		type : "query"
	});
	for (var i = 0; i < queries.length; i++) {
		$("#qHistory").append($('<option/>', {
			value : queries[i].name,
			text : queries[i].name
		}));
	}

}

function initDBs() {
	var dbs = proxy_getDBNames("admin", 'admin', {});
	for (var i = 0; i < dbs.length; i++) {
		var str = dbs[i].name;
		$("#dbSelect").append($('<option/>', {
			value : str,
			text : str
		}));
	}
}

function initCollections() {
	var dbName = $("#dbSelect").val();
	var dbs = proxy_getCollectionNames(dbName, 'admin', {});
	for (var i = 0; i < dbs.length; i++) {
		var str = dbs[i].name;
		$("#collSelect").append($('<option/>', {
			value : str,
			text : str
		}));
	}
}

function processResult(jsonArray, headers) {
	for (var i = 0; i < jsonArray.length; i++) {
		for (var j = 0; j < headers.length; j++) {
			if (!jsonArray[i][headers[j]]) {
				jsonArray[i][headers[j]] = "";
			}
		}
	}
}

function drawResultSpreadSheet(headers, data) {
	if ($('#colHeader').is(":checked")) {
		var headers2 = {}
		for (var i = 0; i < headers.length; i++) {
			headers2[headers[i]] = headers[i];
		}
		for (var i = 0; i < data.length; i++) {
			for ( var prop in data[i])
				if ($.isPlainObject(data[i][prop]) || $.isArray(data[i][prop])) {
					data[i][prop] = JSON.stringify(data[i][prop]);
				}
		}
		data.splice(0, 0, headers2);
	}
	$(resultSheet).handsontable({
		data : data,
		minSpareRows : 1,
		rowHeaders : true,
		contextMenu : true,
		colHeaders : headers,
		// columns:[{},{},{type:'autocomplete',source:getNatures(), strict:
		// true}],
		// fixedColumnsLeft: 1,
		columnSorting : true,
		stretchH : 'all',
		search : true,
		contextMenu : true
	});

}

function onColorChange(picker) {

}

function executeScript() {
	var str = $("#jsonStr").val();
	var script = document.createElement("script");
	script.appendChild(document.createTextNode(str));
	(document.body || document.head || document.documentElement)
			.appendChild(script);

}

function replaceLatinChars() {
	db.feeds2.find({
		hashcode : -996749175
	}).forEach(function(doc) {
		var title = doc.title;
		console.log(title);

	});
}

function isEmpty(obj) {
	return Object.keys(obj).length === 0;
}


