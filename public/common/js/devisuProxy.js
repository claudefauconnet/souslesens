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

var serverUrl = "../devisu";
// ************** general CRUD*********************************************
function proxy_callServer(action){
	params = "action="+action;
	return executeQuery(params, "GET", "json");
	
}

function proxy_loadData(dbName, collectionName, jsonQuery, callback, jsonProcessing) {
	return proxy_loadDataFields(dbName, collectionName, jsonQuery,null, callback, jsonProcessing);
	
/*	if (jsonQuery)
		jsonQuery = JSON.stringify(jsonQuery);
	else
		jsonQuery = "";
if(!jsonProcessing){
	jsonProcessing="";
}
else{
	jsonProcessing = JSON.stringify(jsonProcessing);
	jsonProcessing = encodeURIComponent(jsonProcessing);
}

	params = "action=loadData&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonQuery=" + jsonQuery+"&jsonProcessing="+jsonProcessing;
	return executeQuery(params, "GET", "json", callback);*/
}


function proxy_loadDataFields(dbName, collectionName, jsonQuery,fields, callback, jsonProcessing) {
	if (jsonQuery)
		jsonQuery = JSON.stringify(jsonQuery);
	else
		jsonQuery = "";
	if (fields)
		fields = JSON.stringify(fields);
	else
		fields = "";
	
if(!jsonProcessing){
	jsonProcessing="";
}
else{
	jsonProcessing = JSON.stringify(jsonProcessing);
	jsonProcessing = encodeURIComponent(jsonProcessing);
}

	params = "action=loadDataFields&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonQuery=" + jsonQuery+"&fields="+fields+"&jsonProcessing="+jsonProcessing;
	return executeQuery(params, "GET", "json", callback);
}

/*
 * starTime and endTime are long

 */
function proxy_getDataBetweenDates( dbName, collectionName,dateField,startTime, endTime,  jsonQuery,  jsonFields,jsonProcessing){
	jsonQuery = JSON.stringify(jsonQuery);
	jsonQuery = encodeURIComponent(jsonQuery);
	jsonFields = JSON.stringify(jsonFields);
	jsonFields = encodeURIComponent(jsonFields);
	jsonProcessing = JSON.stringify(jsonProcessing);
	jsonProcessing = encodeURIComponent(jsonProcessing);
	params = "action=getDataBetweenDates&dbName=" + dbName + "&collectionName=" + collectionName +"&jsonProcessing="+jsonProcessing+ "&jsonFields=" + jsonFields + "&jsonQuery=" + jsonQuery+"&dateField="+dateField+"&startTime="+startTime+"&endTime="+endTime;
	return executeQuery(params, "GET", "json", null);
}

function proxy_saveData(dbName, collectionName, jsonData) {
	if (!$.isArray(jsonData))
		jsonData = [ jsonData ];
	jsonData = JSON.stringify(jsonData);
	jsonData = encodeURIComponent(jsonData);
	params = "action=saveData&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonData=" + jsonData;
	var data = "random=" + Math.random() + "&" + params;
	proxy_saveDataPOST(data, null, "message");
	return "data saved";
}

function proxy_addItems(dbName, collectionName, jsonData) {
	if (!$.isArray(jsonData))
		jsonData = [ jsonData ];
	for (var i = 0; i < jsonData.length; i++) {
		proxy_addItem(dbName, collectionName, jsonData[i]);
	}
	return jsonData.length+" items added";
}

function proxy_addItem(dbName, collectionName, jsonData, withoutModifiedBy) {
	if (!withoutModifiedBy)
		jsonData.modifiedBy = userLogin;
	jsonData = JSON.stringify(jsonData);
	jsonData = encodeURIComponent(jsonData);
	params = "action=addItem&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonData=" + jsonData;

	return executeQuery(params, "GET", "json");
	
}

function proxy_updateItem(dbName, collectionName, jsonData, withoutModifiedBy) {
	if (!withoutModifiedBy)
		jsonData.modifiedBy = userLogin;
	jsonData = JSON.stringify(jsonData);
	jsonData = encodeURIComponent(jsonData);
	params = "action=updateItem&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonData=" + jsonData;

	executeQuery(params, "GET", "json", messageCallBackOk);
	return "item saved";
}

function proxy_updateItemByQuery(dbName, collectionName, jsonQuery, jsonData, withoutModifiedBy) {
	if (!withoutModifiedBy)
		jsonData.modifiedBy = userLogin;
	if (jsonQuery)
		jsonQuery = JSON.stringify(jsonQuery);
	else
		jsonQuery = "";
	jsonData = JSON.stringify(jsonData);
	jsonData = encodeURIComponent(jsonData);
	params = "action=updateItemByQuery&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonData=" + jsonData + "&jsonQuery=" + jsonQuery;

	executeQuery(params, "GET", "json", messageCallBackOk);
	return "item saved";
}
function proxy_updateItemFields(dbName, collectionName, jsonQuery, jsonFields) {
	if (jsonQuery)
		jsonQuery = JSON.stringify(jsonQuery);
	else
		return "query object is mandatory";
	jsonFields = JSON.stringify(jsonFields);
	jsonFields = encodeURIComponent(jsonFields);
	params = "action=updateItemFields&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonFields=" + jsonFields + "&jsonQuery=" + jsonQuery;
	executeQuery(params, "GET", "json", messageCallBackOk);
	return "item saved";
}

function proxy_updateItems(dbName, collectionName, jsonData) {
	jsonData = JSON.stringify(jsonData);
	jsonData = encodeURIComponent(jsonData);
	params = "action=updateItems&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonData=" + jsonData;
	executeQuery(params, "GET", "json", messageCallBackOk);
	return "items saved";
}

function proxy_deleteItem(dbName, collectionName, id) {
	params = "action=deleteItem&dbName=" + dbName + "&collectionName=" + collectionName + "&id=" + id;
	executeQuery(params, "GET", "json", messageCallBackOk);
	return "item deleted";
}

function proxy_deleteItemByQuery(dbName, collectionName, jsonQuery,withoutConfirmMessage){
	
	jsonQuery = JSON.stringify(jsonQuery);
	if( !withoutConfirmMessage && !confirm("Delete objects from collection "+dbName+"."+collectionName + " whith query "+jsonQuery +" ?"))
		return;
	params = "action=deleteItemByQuery&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonQuery=" + jsonQuery;
	executeQuery(params, "GET", "json", messageCallBackOk);
	return "item deleted";
	
}


function proxy_getGroupStat( dbName, collectionName,  jsonQuery, operator,  field){
	jsonQuery = JSON.stringify(jsonQuery);
	params = "action=getGroupStat&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonQuery=" + jsonQuery+ "&operator=" + operator+ "&field=" + field;
	return executeQuery(params, "GET", "json", null);
}


function proxy_count(dbName, collectionName, jsonQuery) {
	jsonQuery = JSON.stringify(jsonQuery);
	params = "action=count&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonQuery=" + jsonQuery;
	return executeQuery(params, "GET", "json", null);

}

function proxy_getDistinct(dbName, collectionName, jsonQuery, key) {
	jsonQuery = JSON.stringify(jsonQuery);
	key = encodeURIComponent(key);
	params = "action=getDistinct&dbName=" + dbName + "&collectionName=" + collectionName + "&jsonQuery=" + jsonQuery + "&key=" + key;
	return executeQuery(params, "GET", "json", null);

}

// ****************************** specific to
// graph*************************************
function getGraphAlldescendantLinksAndNodes(dbName, id) {
	params = "action=getGraphAlldescendantLinksAndNodes&dbName=" + dbName + "&id=" + id;
	return executeQuery(params, "GET", "json", null);
}

// ****************************** specific to
// radar*************************************
function proxy_addNewRadarItem(dbName) {
	params = "action=addNewRadarItem&dbName=" +dbName;
	return executeQuery(params, "GET", "json", null);
}

/*function proxy_updateRadarCoordinates(dbName, collectionName,id, coordx, coordy) {
	params = "action=updateRadarCoordinates&dbName=" + dbName  + "&collectionName="+collectionName+"&id=" + id + "&coordx=" + coordx + "&coordy=" + coordy;
	executeQuery(params, "GET", "json", messageCallBackOk);
}*/

function proxy_updateItemJsonFromRadar(dbName,collectionName, id, jsonData) {
	jsonData = JSON.stringify(jsonData);
	jsonData = encodeURIComponent(jsonData);
	params = "action=updateItemJsonFromRadar&dbName=" + dbName + "&collectionName="+collectionName+"&id=" + id + "&jsonData=" + jsonData;
	executeQuery(params, "POST", "json", messageCallBackOk);
}

function proxy_getRadarPoints(dbName, radarName,collectionName,jsonQuery,callback) {
	jsonQuery = JSON.stringify(jsonQuery);
	jsonQuery = encodeURIComponent(jsonQuery);
	params = "action=getRadarPoints&dbName=" + dbName + "&jsonQuery=" + jsonQuery+"&radarName="+radarName+"&collectionName="+collectionName;
	executeQuery(params, "GET", "json", callback);

}

function proxy_getRadarDetails(dbName, radarName, id) {
	params = "action=getRadarDetails&dbName=" + dbName + "&id=" + id+"&radarName="+radarName;
	executeQuery(params, "GET", "json", XXX);
}

function proxy_updateRadarComment(dbName, collectionName,id, jsonData) {
	jsonData = JSON.stringify(jsonData);
	jsonData = encodeURIComponent(jsonData);
	params = "action=updateRadarComment&dbName=" + dbName + "&collectionName="+collectionName+"&jsonData=" + jsonData;
	executeQuery(params, "GET", "json", messageCallBackOk);
}

// *****************************others**************************************************

function proxy_saveRadarXml(fileName, xmlData, callback) {
	var formData = new FormData();
	formData.append("dbName", fileName);
	formData.append("xmlData", xmlData);
	$.ajax({
		url : 'radarUpload',
		data : formData,
		cache : false,
		contentType : false,
		processData : false,
		type : 'POST',
		error : function(response) {
			console.log(response);
			setMessage("Server Error", "red");
		},
		success : function(data) {
			if (callback)
				callback();
			setMessage("Xml saved", "green");
		}
	});
}

function proxy_tryLogin(dbName, login, password) {
	params = "action=tryLogin&dbName=" + dbName + "&login=" + login + "&password=" + password;
	return executeQuery(params, "GET", "json", null);
}

function proxy_getCollectionNames(dbName) {
	params = "action=getCollectionNames&dbName=" + dbName;
	return executeQuery(params, "GET", "json", null);
}

function proxy_getDBNames(dbName) {
	params = "action=getDBNames&dbName=" + dbName;
	return executeQuery(params, "GET", "json", null);

}

// ****************************admin********************************************************

function proxy_createDB(dbName) {
	params = "action=createDB&dbName=" + dbName;
	executeQuery(params, "GET", "json", messageCallBackOk);
}

function proxy_executeAction(action) {
	params = "action=" + action;
	executeQuery(params, "GET", "json", messageCallBackOk);
}

// ****************************other********************************************************
function proxy_execSql(dbName, sqlConn, sqlRequest) {
	params = "action=execSql&dbName=" + dbName + "&sqlRequest=" + sqlRequest + "&sqlConn=" + sqlConn;
	return executeQuery(params, "GET", "json", null);
}

function proxy_executeJavascript(dbName, script) {
	script = encodeURIComponent(jsonData);
	params = "action=executeJavascript&dbName=" + dbName + "&script=" + script ;
	return executeQuery(params, "GET", "json", null);
}



// *****************************RSS3D***************************************************
/*
 * expression regexp periodType :$year $month $dayOfMonth $hour
 * 
 */
function proxy_aggregateFeeds(expression, periodType, jsonQuery) {
	expression = encodeURIComponent(expression);
	jsonQuery = JSON.stringify(jsonQuery);
	jsonQuery = encodeURIComponent(jsonQuery);
	params = "action=aggregateFeeds&expression=" + expression + "&periodType=" + periodType + "&jsonQuery=" + jsonQuery;
	return executeQuery(params, "GET", "json", null);

}

function proxy_getFeeds(expression, jsonQuery, limit) {
	expression = encodeURIComponent(expression);
	jsonQuery = JSON.stringify(jsonQuery);
	jsonQuery = encodeURIComponent(jsonQuery);
	params = "action=getFeeds&expression=" + expression + "&jsonQuery=" + jsonQuery + "&limit=" + limit;
	return executeQuery(params, "GET", "json", null);

}



/** *******************************calls execution********************* */

function messageCallBackOk(d) {
	// var str=JSON.stringify(d);
	setMessage(d.OK, "green");
}

function executeQuery(params, method, format, callback) {
	var url = serverUrl + "?random=" + Math.random() + "&" + params;
	var d = null;
	if (true || url.length > 2048) {
		method = "POST";
		url = serverUrl + "?random=" + Math.random();
		d = params;
	}
	if (callback == null) { // synchronous
		var data;
		$.ajax({
			type : method,
			url : url,
			dataType : format,
			data : d,
			async : false,
			success : function(d) {
				
				  for (var i = 0; i < d.length; i++) { //$(d[i]._id).remove();$(d[i].lastModified).remove();
					  if(d[i] && d[i]._id)
						  delete d[i]._id;
					  if(d[i] && d[i].lastModified)
						  delete d[i].lastModified; 
					  };
				
				data = d;
			},
			error : function(error ,ajaxOptions, thrownError){
				
				console.log(error);
				console.log(thrownError);
				setMessage("server error" + thrownError);
			}

		});
		return data;
	} else { // asynchronous
		$.ajax({
			type : method,
			url : url,
			dataType : format,
			async : false,
			success : callback,
			data : d,
			error : function(xhr, ajaxOptions, thrownError) {
				console.log(error);
				console.log(thrownError);
				setMessage("server error" + thrownError);
			}

		});
	}
}

function getXmlDoc(fileName) {
	var doc;
	$.ajax({
		type : "GET",
		url : fileName,
		dataType : "xml",
		async : false,
		success : function(data) {
			doc = data;
		},
		error : function(xhr, ajaxOptions, thrownError) {
			console.log(fileName);
			console.error(xhr.status);
			console.error(thrownError);
			setMessage("server error");
			doc = null; // "<?xml version="1.0" encoding="UTF-8"
						// standalone="no"?>"
		}

	});
	return doc;
}

function getTextDoc(filename) {
	var doc;
	$.ajax({
		type : "GET",
		url : fileName,
		dataType : "text",
		async : false,
		success : function(data) {
			doc = data;
		},
		error : function(xhr, ajaxOptions, thrownError) {
			console.log(url);
			console.error(xhr.status);
			console.error(thrownError);
			setMessage("server error");
		}

	});
	return doc;
}

function proxy_saveDataPOST(data, dataType, messageDivId, url) {
	if (!url)
		url = serverUrl;

	$.ajax({
		type : "POST",
		url : url,
		data : data,
		success : function(data) {
			var message = "<font color='green'>Data saved</font>";
			setMessage(message);
		},
		error : function(xhr, ajaxOptions, thrownError) {
			console.log(url);
			console.error(xhr.status);
			console.error(thrownError);

			setMessage("server error", "red");
		}

	});
}
