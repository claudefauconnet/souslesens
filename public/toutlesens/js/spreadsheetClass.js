
/**************************  TOUTLESENS LICENCE*************************

The MIT License (MIT)

Copyright (c) 2016 Claude Fauconnet claude.fauconnet@neuf.fr

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

**********************************************************************/


function Spreadsheet(spreadsheetDivId, dbName, collection, query, headers, columns, colWidths) {
	var spreadsheetDivId0 = document.getElementById(spreadsheetDivId);
	this.spreadsheet = $("#" + spreadsheetDivId);
	var dbName = dbName;
	var collection = collection;
	this.query = query;
	this.headers = headers;
	this.columns = columns;
	this.colWidths = colWidths;
	this.renderers = {};
	this.fieldsToAdd = {};
	this.onCellClickCallBack = null;
	var self = this;

	var spreadsheet0;
	var data;
	var linesToBeDeleted = [];
	var linesToModified = []

	this.load = function(data_) {
		if (true) {
		//	$(spreadsheetDivId0).html("");
		}
		linesToBeDeleted = [];
		linesToModified = []
		if (this.headers && !this.columns) {
			this.columns = [];
			for (var i = 0; i < this.headers.length; i++) {
				var header = this.headers[i];
				var renderer = this.renderers[header];
				if (renderer) {
					this.columns.push({
						data : header,
						renderer : renderer
					});
				} else {
					this.columns.push({
						data : header
					});
				}
			}

		}

		if (!data_) {
			data_ = proxy_loadData(dbName, collection, query, null);
			data_.splice(999, 10000);
		}
		self.data = data_;

		/*
		 * for (var i = 0; i < data_.length; i++) { var dateObj =
		 * data_[i]["pubDate"]; if (dateObj) data_[i]["pubDate"] =
		 * dateObj.$date;
		 * 
		 * dateObj = data_[i]["crawlDate"]; if (dateObj) data_[i]["crawlDate"] =
		 * dateObj.$date; }
		 */

		spreadsheet0 = this.spreadsheet;

		/*
		 * offset = Handsontable.Dom.offset(spreadsheetDivId0); availableWidth =
		 * Handsontable.Dom.innerWidth(document.body) - offset.left +
		 * window.scrollX; availableHeight =
		 * Handsontable.Dom.innerHeight(document.body) - offset.top +
		 * window.scrollY;
		 * 
		 * availableWidth=1000; availableHeight=800;
		 * spreadsheetDivId0.style.width = availableWidth + 'px';
		 * spreadsheetDivId0.style.height = availableHeight + 'px';
		 * spreadsheetDivId0.style.overflow="hidden";
		 */

		this.spreadsheet.handsontable({
			data : data_,
			minCols : 3,
			minRows : 1,
			minSpareRows : 1,
			colHeaders : this.headers,
			rowHeaders : true,
			colWidths : this.colWidths,
			contextMenu : [ "remove_row" ],
			columns : this.columns,
			columnSorting : true,
			stretchH : "all",
			search : true,
			manualColumnResize : true,
			beforeRemoveRow : deleteItem,
			afterChange : onAfterChange,
			afterOnCellMouseDown : this.onCellClick,
			renderAllRows : true

		});
	}

	this.onCellClick = function(event, coords, TD) {
		var handsontable = spreadsheet0.data("handsontable");
		var sortIndex = handsontable.sortIndex;

		var m = coords.row;
		if (sortIndex && sortIndex.length > 0) {
			m = handsontable.sortIndex[m][0];
		}
		var obj = self.data[m];

		self.onCellClickCallBack(event, coords, obj);
	}

	this.getSelectedObject = function(row) {
		var handsontable = spreadsheet0.data("handsontable");
		var sortIndex = handsontable.sortIndex;
		var m = row;
		if (sortIndex && sortIndex.length > 0) {
			m = handsontable.sortIndex[m][0];
		}
		return self.data[m];
	}

	this.getData = function() {
		var handsontable = this.spreadsheet.data("handsontable");
		return handsontable.getData();
	}

	this.save = function() {

		withoutModifiedBy = false;
		var handsontable = this.spreadsheet.data("handsontable");
		var data_ = handsontable.getData();

		for (var i = 0; i < data_.length; i++) {
			var item = data_[i];
			var notNullline = false; // arret sur les lignes vides
			for ( var prop in item) {
				if (item[prop] !== null && item[prop] !== "" && !$.isPlainObject(item[prop]))
					notNullline = notNullline | true;
			}
			if (notNullline === false)
				break;

			for ( var prop in this.fieldsToAdd) {
				item[prop] = this.fieldsToAdd[prop];
			}

			if (item.id) { // update
				if ($.inArray(item, linesToBeDeleted) < 0 && $.inArray(item, linesToModified) > -1) {
					proxy_updateItem(dbName, collection, item);
				}

			} else { // add

				proxy_addItem(dbName, collection, item);
			}
		}
		deleteRemovedItems();
		linesToModified = [];
	}

	this.setRenderer = function(renderer) {
		for ( var key in renderer)
			this.renderers[key] = renderer[key];
	}

	this.safeHtmlRenderer = function(instance, td, row, col, prop, value, cellProperties) {
		var escaped = Handsontable.helper.stringify(value);
		td.innerHTML = escaped;
		return td;
	}

	var onAfterChange = function(index, type) {
		if (index === true || type == "loadData") // c"est comme cela :
													// methode appelée deux fois
													// //
			// !!
			return;
		var handsontable = spreadsheet0.data("handsontable");
		var sortIndex = handsontable.sortIndex;

		var m = index[0][0];
		if (sortIndex && sortIndex.length > 0) {
			m = handsontable.sortIndex[m][0];
		}
		linesToModified.push(data[m]);

	}

	var deleteItem = function(index, amount) {

		if (index === true) // c"est comme cela : methode appelée deux fois //
			// !!
			return;
		var handsontable = spreadsheet0.data("handsontable");
		var sortIndex = handsontable.sortIndex;
		for (var i = 0; i < amount; i++) {
			var m = index + i;
			if (sortIndex && sortIndex.length > 0) {
				m = handsontable.sortIndex[m][0];
			}
			linesToBeDeleted.push(data[m]);
		}

	}

	var deleteRemovedItems = function() {

		for (var i = 0; i < linesToBeDeleted.length; i++) {
			proxy_deleteItem(dbName, collection, linesToBeDeleted[i].id);
		}

		linesToBeDeleted = [];

	}

}