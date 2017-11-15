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
//index.html
var splitter;

var currentActionObj=null;
var Schema={};
//*************advancedDisplay.js
var data=null;
var propertyType="";
var nClasses=5;
var distinctPropertyValues=null;
var currentlabel=null;
var propertyRange=null;
var intPattern=/-?[0-9]+/;
var rangePattern=/-?[0-9]+~-?[0-9]+/;
var decorationObjs=null;
//*************advancedSearch.js
var currentCypherQueryTextArea="";
var currentNodeRole=null;
var matchIndex=0;
var currentTabIndex=0;

var currentLabel=null;
var limit=300;
var returnStr="EXTRACT(rel IN relationships(path) | type(rel)) as rels,nodes(path) as nodes, EXTRACT(node IN nodes(path) | ID(node)) AS ids, EXTRACT(node IN nodes(path) | labels(node)) as labels ";

//*************common.js
var dataPath="data";
var messageDivId="message";
var dbName=null;
var isIE8=false;
var filter=null;
var filterValue=null;
var isRadarReadOnly=true;
var http="";
var currentObject={};

var canModifyRadarDetails=false;
var rapahaelItemsSet=null;
var canModify=false;
var view="home";
var password="T0talr@d@r";
var authentify=false;
var identified=false;
var userRole="all";
var userLogin="anonymous";
var userName="anonymous";
var user=null;
var maxTentatives=5;
var nTentatives=0;
var positionControMode="CONFINED";
var radarAxes=null;
var IEversion=null;
var appname=null;
var version=null;
var queryParams=null;
var userRole="admin";
var userLogin="CF";
var userName="CF";
//*************d3bubble.js
var svg=null;
var width=null;
var format=null;
var color=null;
var pack=null;
//*************d3common.js
var currentMouseOverCoords=null;
var dragListener=null;


//*************d3modifiableGraph.js
var r=6;
var w=300;
var h=25;
var point=null;
var fontSize="12px";
var tiangleUpPath="M0,6L-6,6L0,-6L6,6L0,6";
var tiangleDownPath="M0,-6L-6,-6L0,6L6,-6L0,-6";
var rectPath="M-6,-6L-6,6L6,6L6,-6L-6,-6";
var minOpacity=.2;
var palette0=null;
var labelMaxSize=20;
var x0=null;
var y0=0;
var svgGraph=null;
var svgGraphLegend=null;
var isDragging=false;
var hoverRect=null;
var hoverText=null;
var currentRadarNode=null;
var yLegendOffset=0;
var hoverRect=null;
var hoverText=null;
var isResizing=false;
var resizeSquare=20;
var minTextBoxSize=20;
var selection=null;
var links=null;
var dragDx=null;
var dragDy=null;
var oldX=null;
var oldY=null;
var displayType="textBox";
var isReadOnly=false;

//*******************indexModules.html
var totalWidth;
var totalHeight;
processDataBeforeDrawingCallback = null;



//*************devisuProxy.js
var serverUrl="../devisu";
//*************externalRessources.common.js
var currentExternalUri=null;
//*************lang.js
var langResources={};
//*************modifyData.js
var currentRelationData=null;
var currentLabel=null;
var isNewNode=false;
//*************selection.js
var d3NodesSelection=null;
//*************simpleUI.js
var simpleUI=null;
//*************statistics.js
var statQueries=null;
//*************storedParams.js
var storedDecorationObjs=null;
//*************textOutputs.js
var jsonHtml="";
var outputFormat="";

//*************toutlesensController.js

var traversalToTree=true;
var traversalToGraph=false;
var traversalToSpredsheet=false;
var d3tree=null;
var spreadsheet=null;
var page=0;
var size=100;
var sep="\t";
var MaxNodesInWordsSelect=20;
var MaxNodesInPage=20;
var currentPageIndex=0;
var currentRequestCount=0;
var currentGraphPanel="";
var currentMode="read";
var currentGraphRequestType_FROM_NODE="simple";
var currentGraphRequestType_PATH="path";
var currentGraphRequestType_TRAVERSAL="traversal";
var currentGraphRequestType_FILTERED="filtered";
var currentGraphRequestType_NODES_ONLY="nodes_only";
var currentGraphRequestType=currentGraphRequestType_FROM_NODE;
var maxSpreadsheetRows=998;
var QUERY_TYPE_MATCH=0;
var QUERY_TYPE_LABELS=1;
var QUERY_TYPE_TRAVERSAL=2;
var QUERY_TYPE_GET_ID=3;
var currentQueryType = QUERY_TYPE_MATCH;;
var rIndices=1;
var currentLabel=null;
var currentRelation=null;
var currentMode=null;
var currentSourceNode=null;

var currentHiddenChildren=null;
var currentRelationActionTargetNode=null;

var startSearchNodesTime=null;
var nodeTypes=null;
var oldRightTabIndex=null;
var popopuPosition = {
    x: 0,
    y: 0
};

var limitResult=10000;
var oldData=null;
var addToOldData=true;
var oldTreeRootNode=null;
var treeSelectedNode=null;
var treeLevel=1;
var infoDisplayMode="PANEL";
var currentMousePosition=null;
var dontReInitFilterGraph=false;
var subGraph=null;
var queryParams=null;
var nodeColors={};
var linkColors={};
var green="green";
var blue="purple";
var red="red";
var labelsPositions=null;
var initialQuery="";
var currentVariable="";
var currentDisplayType="FLOWER";
var selectedObject=null;
var subGraph=null;
var d3tree=null;
var isAdvancedDisplayDialogInitialized=false;
var isAdvancedSearchDialogInitialized=false;
var isGanttDialogInitialized=false;
var popupMenuNodeInfoCache=null;
var currentDataStructure=null;
var currentThumbnails=null;
//*************toutlesensData.js
var excludeLabels=[];


var isZoomed=false;
var hoverRect=null;
var hoverText=null;
var legendNodeLabels=null;
var legendRelTypes=null;
//var navigationPath=null;
var maxEffectiveLevels=0;
var currentFlattenedData=null;
var foldedTreeChildren=null;
var exploredTree=null;
var CSVWithLabel=true;
var graphQueryTargetFilter="";

var graphQueryUnionStatement="";
var currentQueryParams=null;
var totalNodesToDraw=0;
var  whereStr="";