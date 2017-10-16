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
 *******************************************************************************/

var chronology = (function(){
 var self = {};



//moved  var AgeMaxStart = -800;
//moved  var AgeMaxEnd = 500;
//moved  var ageDebut = 0;
//moved  var agefin = 0
//moved  var scaleV = 0.2;
//moved  var chronoBackgroundResults = [];
//moved  var CHRONOCHART_LAYOUT = "H";
//moved  var isChartSliderInitialized = false;
//moved  var civilisatonColors = {};
//moved  var civilisationsDraw = null;
//moved  var periodesDraw = null;
//moved  var svg = null;
//moved  var civData = {};
//moved  var perData = {};
//moved  var eventsColors={};

/*moved  var drawingParams = {

	spacingV : 30,
	spacingCiv : 100,
	periodeHeight : 50,
	periodeSpacing : 30,
	perDataperiodeVertOffset : 10,
	civVertOffset : 100,
	civSpacing : 60,
	pointHeight : 10,
	pointSpacingV : 2,
	pointMinWidth : 30,
	graphWidth : 3000,
	graphHeight : 3000,
	periodeColor : "grey",
	civOpacity : .2,
	periodeOpacity : .2,
	pointOpacity : .9,
	pointTextColor : "4323F3",
	eventsPalette:["#1F145F","#610953","#6A830D","#89700D"],
	

}*/


//*************chronology.js
    var AgeMaxStart=null;
    var AgeMaxEnd=500;
    var ageDebut=0;
    var agefin=0;
    var scaleV=0.2;
    var chronoBackgroundResults=null;
    var CHRONOCHART_LAYOUT="H";
    var isChartSliderInitialized=false;
    var civilisatonColors=null;
    var civilisationsDraw=null;
    var periodesDraw=null;
    var svg=null;
    var civData=null;
    var perData=null;
    var eventsColors=null;
    var drawingParams={

        spacingV : 30,
        spacingCiv : 100,
        periodeHeight : 50,
        periodeSpacing : 30,
        perDataperiodeVertOffset : 10,
        civVertOffset : 100,
        civSpacing : 60,
        pointHeight : 10,
        pointSpacingV : 2,
        pointMinWidth : 30,
        graphWidth : 3000,
        graphHeight : 3000,
        periodeColor : "grey",
        civOpacity : .2,
        periodeOpacity : .2,
        pointOpacity : .9,
        pointTextColor : "4323F3",
        eventsPalette:["#1F145F","#610953","#6A830D","#89700D"],


    }

   self.initChronology=function() {


	$("#timeSlider").rangeSlider({
		bounds : {
			min : -5000,
			max : 500,
		}
	}).bind("valuesChanged", function(e, data) {
		AgeMaxStart = Math.floor(data.values.min / 100) * 100
		AgeMaxEnd = Math.ceil(data.values.max / 100) * 100
		if (isChartSliderInitialized == true)
self.drawChronoChart();
		isChartSliderInitialized = true;
		
	});
	$("#timeSlider").rangeSlider("values", AgeMaxStart, AgeMaxEnd);
	var rangeSliderValues = $("#slider").rangeSlider("values");
//	console.log(rangeSliderValues.min + " " + rangeSliderValues.max);
self.initGraphDivScroll();
self.initEventsColors();
}


   self.initEventsColors=function(){
	eventsColors["Personne"]=drawingParams.eventsPalette[3];
	eventsColors["Oeuvre"]=drawingParams.eventsPalette[2];
	eventsColors["Evenement"]=drawingParams.eventsPalette[1];
}

   self.initGraphDivScroll=function(){
	$( "#graphContainerDiv" ).scroll(function(e) {
		var target=e.currentTarget;
		
		var scrollTop=target.scrollTop;
		if(!svg)
			return;
		var leg=svg.selectAll(".legendH");
		leg.attr("transform",function(d) {
		
			return "translate( 0,"+ scrollTop + ")";
		});
		
	});
}

   self.initEventTypes=function() {
	// .........................;;;
	var limitation = "";//' where n[Gparams.defaultNodeNameProperty]="Rome Antique" ';// !!!!!!!!!!!!!!!!!!!!!!!Rome
	// Antique
	var query = "MATCH (n:Civilisation) " + limitation
			+ "return n,labels(n),ID(n)";

	executeQuery(QUERY_TYPE_MATCH, query, initCivilisationsCallback);
}

   self.initCivilisationsCallback=function(result) {
	var data = result[0].data;

	for (var i = 0; i < data.length; i++) {
		var civ = data[i].row[0];
		var civId = data[i].row[2]
		$("#chronoCivilisationSelect").append($('<option>', {
			text : civ[Gparams.defaultNodeNameProperty],
			pointHeight : 30,
			pointSpacingV : 10,
			value : civ.civId
		}).css("color", drawingParams.eventsPalette[i]));

	}
}

   self.drawChronoChartSpreadsheet=function() {
	var whereCivilisation = "";
	var civilisationId = $("#chronoCivilisationSelect").val();
	if (civilisationId && civilisationId.length > 0)
		whereCivilisation = " and m[Gparams.defaultNodeNameProperty]='" + civilisationId + "' ";
	else
		return;

	var selectedEvents = []
	$("input[name='eventType']:checked").each(function() {
		selectedEvents.push($(this).val());
	});
	var whereEvents = "";
	if (selectedEvents.length > 0) {
		whereEvents = "  (";
		for (var i = 0; i < selectedEvents.length; i++) {
			if (i > 0)
				whereEvents += " OR ";
			whereEvents += 'labels(n)=["' + selectedEvents[i] + '"]';
		}
		whereEvents += ")";
	}
	var rangeSliderValues = $("#timeSlider").rangeSlider("values");
	ageDebut = Math.round(rangeSliderValues.min/100)*100;
	ageFin = (Math.round(rangeSliderValues.max/100)+1)*100;;

	var query = "MATCH (n)-[r]-(m:Civilisation)   WHERE "//(labels(n)=['Evenement'] or labels(n)=['Oeuvre'])"
		+whereEvents
		+whereCivilisation
		+"and  n.datedebut>= "
		
			+ ageDebut
			+ " and n.datefin<="
			+ ageFin
			
			+ "   return n,labels(n),ID(n) ORDER BY  n.agedebut";
	console.log(query);
	executeQuery(QUERY_TYPE_MATCH, query, drawChronoSpreadSheetCallback);
	
	
	
	
	
}


   self.drawChronoSpreadSheetCallback=function(result){
	var data = result[0].data;
	var objs=[];
	for (var i = 0; i < data.length; i++) {

		var obj = data[i].row[0];
		obj.label= data[i].row[1][0];
		obj.id= data[i].row[2];
		
		var zzz=obj;
		
		objs.push(obj)
		
		
		
		
		
	}
self.drawChronoHtml(objs);
}





   self.drawChronoHtml=function(objs){
	//var str="<table border='1' class='chronoSheet'><tr><td>date debut</td><td>date fin</td><td>&nbsp;</td></tr>";
	var str="<table border='1' class='chronoSheet'><tr><td>date debut</td><td>&nbsp;</td></tr>";
	
	for (var i = 0; i < objs.length; i++) {
		var obj=objs[i];
		var color=nodeColors[obj.label];
	//	str+="<tr><td>"+obj.datedebut+"</td><td>"+obj.datefin+"</td><td><B><font color='"+color+"'> <a  href='javascript:showInfosById("+obj.id+")'>"+obj[Gparams.defaultNodeNameProperty]+"</font></B></td></tr>"
		str+="<tr><td>"+obj.datedebut+"</td><td><B><font color='"+color+"'> <a  href='javascript:showInfosById("+obj.id+")'>"+obj[Gparams.defaultNodeNameProperty]+"</font></B></td></tr>"
		
	}
	str+="</table>";
	$("#graphDiv").html(str);
	
	
}



   self.drawChronoChart=function() {
self.drawChronoChartSpreadsheet();
	return;
	
	var whereCivilisation = "";
	var civilisation = $("#chronoCivilisationSelect").val();
	if (civilisation && civilisation.length > 0)
		whereCivilisation = " and ID(civ)=" + civilisation + " ";
	else 
		return;

	var selectedEvents = []
	$("input[name='eventType']:checked").each(function() {
		selectedEvents.push($(this).val());
	});
	var whereEvents = "";
	if (selectedEvents.length > 0) {
		whereEvents = " and (";
		for (var i = 0; i < selectedEvents.length; i++) {
			if (i > 0)
				whereEvents += " OR ";
			whereEvents += 'labels(n)=["' + selectedEvents[i] + '"]';
		}
		whereEvents += ")";
	}

	var rangeSliderValues = $("#timeSlider").rangeSlider("values");
	ageDebut = Math.round(rangeSliderValues.min/100)*100;
	ageFin = (Math.round(rangeSliderValues.max/100)+1)*100;;

	var query = "MATCH (n)-[r]-(per:Periode)-[r2]-(civ:Civilisation) WHERE   n.datedebut>="
			+ ageDebut
			+ " and n.datefin<="
			+ ageFin
			+ whereCivilisation
			+ whereEvents
			+ "   return n,labels(n),ID(n),per,ID(per),civ,ID(civ) ORDER BY civ[Gparams.defaultNodeNameProperty],civ.per, n.agedebut";
	console.log(query);
	executeQuery(QUERY_TYPE_MATCH, query, drawChronoChartCallback);
}

   self.drawChronoChartCallback=function(result) {
	var data = result[0].data;
self.structureData(data);
self.setGraphLimits(graphData);
self.setCoordinates(graphData);

self.clearGraph();
self.drawBackground();
self.mapToArray(mapToArray(graphData.civilisations));
self.mapToArray(mapToArray(graphData.periodes));
	draw(graphData.points);

}

   self.structureData=function(data) {
	// extraction des différents objets

	var graphData = {
		points : [],
		periodes : {},
		civilisations : {},
		civilisationsOffsetV : 100,
		nPeriodes : 0,
		nPoints : 0,
	}
	var nCiv = 6;
	for (var i = 0; i < data.length; i++) {

		var civObj = data[i].row[5];
		civObj.id = data[i].row[6];
		civObj.opacity = drawingParams.civOpacity;
		civObj.x = 9999999;
		civObj.y = 0;
		civObj.h = 0;
		civObj.w = 0;
		civObj.label = "civ";

		if (!graphData.civilisations["civ_" + civObj.id]) {
			graphData.civilisations["civ_" + civObj.id] = {
				offsetV : 0,
				nPeriodes : 0,
				nPoints : 0,

			};
			civObj.color = palette[nCiv++];
			graphData.civilisations["civ_" + civObj.id].obj = civObj;

		}

		var periodeObj = data[i].row[3];
		periodeObj.id = data[i].row[4];
		periodeObj.color = drawingParams.periodeColor;
		periodeObj.opacity = drawingParams.periodeOpacity;
		periodeObj.civilisationId = civObj.id;
		periodeObj.label = "per";
		var perKey="per_"+periodeObj.datedebut ;
		if (!graphData.periodes[perKey]) {
			graphData.periodes[perKey] = {
				offsetV : 10,
				nPoints : 0
			};
			graphData.periodes[perKey].obj = periodeObj;
		}

		var pointObj = data[i].row[0];
		pointObj.label = data[i].row[1][0];
		pointObj.id = data[i].row[2];
		pointObj.periodeId =periodeObj.id;
		pointObj.periodeKey =perKey;
		pointObj.civilisationId = civObj.id;
		pointObj.color = color = eventsColors[pointObj.label];
		pointObj.opacity = drawingParams.pointOpacity;

		graphData.points.push(pointObj);
	}
	graphData.points.sort(function(a,b){
		var x=a.datedebut
		var y=b.datedebut;
		if(x>y)
			return 1;
		if(x<y)
			return -1;
		return 0;
	});
	
	return graphData;

}

   self.setGraphLimits=function(graphData) {
	;//
	/*
	 * var ageMin =ageDebut;//5000000; var ageMax =ageFin;// -5000000; for ( var
	 * key in graphData.periodes) { var periode = graphData.periodes[key].obj;
	 * ageMax = Math.max(ageMax, periode.datefin); ageMin = Math.min(ageMin,
	 * periode.datedebut); }
	 */
	drawingParams._ageMin = ageDebut;
	drawingParams._ageMax = ageFin;
	drawingParams._scaleH = drawingParams.graphWidth/ Math.abs(ageFin -ageDebut) /// 3;// pourquoi

}

   self.setCoordinates=function(graphData) {
 var previousPeriodeXmax=0;
	for (var i = 0; i < graphData.points.length;i++) {

		var point = graphData.points[i];
		var periode = graphData.periodes[point.periodeKey];
		var civilisation = graphData.civilisations["civ_"
				+ point.civilisationId];
		if (point.datecreation)
			point.datedebut = point.datecreation
		if (!point.datedebut) {
			console
					.log(point[Gparams.defaultNodeNameProperty]
							+ " n' a pas de date de debut ou de creation");
			continue;
		}
		if (point.datefin)
			point.w = Math.abs(point.datefin - point.datedebut)
					* drawingParams._scaleH;
		else
			point.w = drawingParams.pointMinWidth;
		// *********calcul coododonnées relatives
		point.h = drawingParams.pointHeight;
		point.x = (Math.abs(point.datedebut - drawingParams._ageMin) * drawingParams._scaleH);
		point.y = periode.offsetV;
		graphData.periodes[point.periodeKey].offsetV += drawingParams.pointHeight
				+ drawingParams.pointSpacingV;

		periode.nPoints += 1;
		civilisation.nPoints += 1;
		graphData.periodes[ point.periodeKey].nPoints += 1;
		graphData.civilisations["civ_" + point.civilisationId].nPoints += 1;
		graphData.nPoints += 1;

	}
	var perKeys=[];
	for ( var key in graphData.periodes) {
		perKeys.push(key);
	}
	
	perKeys.sort(function(a,b){
		var x=parseInt(a.substring(4));
		var y=parseInt(b.substring(4));
		if(x>y)
			return 1;
		if(x<y)
			return -1;
		return 0;
	});


	for ( var i=0;i<perKeys.length;i++) {
		var periode = graphData.periodes[perKeys[i]].obj;
		var civilisation = graphData.civilisations["civ_"
				+ periode.civilisationId];
		periode.x = (Math.abs(periode.datedebut - drawingParams._ageMin) * drawingParams._scaleH);
		periode.w = Math.abs(periode.datefin - periode.datedebut)
				* drawingParams._scaleH;
		periode.h = drawingParams.pointHeight * graphData.periodes[perKeys[i]].nPoints;
		if (!periode.h || periode.h == 0)
			periode.h = drawingParams.pointHeight;	
		periode.y = civilisation.offsetV;
		
		if(periode.x>previousPeriodeXmax){
		graphData.civilisations["civ_" + periode.civilisationId].offsetV += periode.h
				+ drawingParams.periodeSpacing;
		}
		previousPeriodeXmax=periode.x+periode.w;
		
		graphData.civilisations["civ_" + periode.civilisationId].obj.x = Math
				.min(periode.x, civilisation.obj.x);
		graphData.civilisations["civ_" + periode.civilisationId].obj.w += periode.w;
		graphData.civilisations["civ_" + periode.civilisationId].nPeriodes += 1;
		graphData.nPeriodes += 1;

	}
	for ( var key in graphData.civilisations) {
		var civilisation = graphData.civilisations[key];
		if (civilisation.nPoints == 0) {
			civilisation.nPoints = drawingParams.pointHeight;
		}
		graphData.civilisations[key].obj.h = (drawingParams.pointHeight * civilisation.nPoints)
				+ (drawingParams.periodeSpacing * civilisation.nPeriodes);
		graphData.civilisations[key].obj.y = graphData.civilisationsOffsetV;
		graphData.civilisationsOffsetV += civilisation.obj.h
				+ drawingParams.civSpacing;
		;

	}
	// *********calcul coododonnées Y absolues
	for ( var key in graphData.periodes) {
		var periode = graphData.periodes[key].obj;
		var civilisation = graphData.civilisations["civ_"
				+ periode.civilisationId];
		graphData.periodes[key].obj.y += civilisation.obj.y;
	}

	for (var i = 0; i < graphData.points.length; i++) {
		var point = graphData.points[i];
		var periode = graphData.periodes[point.periodeKey];
		graphData.points[i].y += periode.obj.y;
	}

	// suppression des points avec de mauvaises coordonnées
	var toRemove = [];
	for (var i = 0; i < graphData.points.length; i++) {
		var point = graphData.points[i];
		if (isNaN(point.x + point.y + point.h + point.w)) {
			toRemove.push(i);
			console.log("!!!!!!!!!!!Remove point : " + JSON.stringify(point));

		}
	}
	for (var i = 0; i < toRemove.length; i++) {
		graphData.points.splice(i, 1);
	}

}

   self.mapToArray=function(map) {
	var array = [];
	
	
	
	for (var key in map){
		
	
		var obj = map[key];
		if ($.isArray(obj))
			array.push(map[key]);
		else
			array.push(map[key].obj);
	}
	return array;
}

   self.clearGraph=function() {

	$("#graphDiv").html("");
	d3.select("svg").selectAll("*").remove();

}

   self.drawBackground=function() {

	// **********dessin des lignes du fond*****************
	svg = d3.selectAll("#graphDiv").append("svg").attr("width",
			drawingParams.graphWidth).attr("height", drawingParams.graphHeight);// .on("click",clickBG);
	
	var legendH=svg.append("g").attr("class", "legendH").attr("x", 0).attr("y", 0);
	
	
	for (var i = ageDebut; i < ageFin; i += 50) {
		var x = ((i - ageDebut) * drawingParams._scaleH) + 10;
		svg.append("line").attr("class", "hline").attr("x1", x).attr("y1", 40)
				.attr("x2", x).attr("y2", drawingParams.graphHeight).attr(
						"stroke", "black").attr("stroke-width", 0.5);

		legendH.append("text").attr("class", "vertLegend").attr("x", x + "px")
				.attr("y", 10).text("" + i).attr("font-family", "sans-serif")
				.attr("font-size", "12px").attr("fill", "red").attr(
						"text-anchor", "middle")

	}
}

function draw(data) {
	var currentType;
	hasNoEndDate=false;
	var gPoint = svg.selectAll("svg").data(data).enter().append("g").attr("id",
			function(d, i) {

				return "P_" + d.id;
			}).attr("transform", function(d, i) {
		// console.log(JSON.stringify(d))
		currentType = d.label
		if(!d.datefin){
			hasNoEndDate=true;
		}
		var dx = d.x;
		var dy = d.y;

		return "translate(" + dx + "," + dy + ")";
	}).on("click", clickNode).on('dblclick', dblclick);

	gPoint.append("rect").attr("width", function(d) {
		return d.w;
	}).attr("height", function(d) {
		return d.h;
	}).attr("fill", function(d) {
		var color = d.color;
		if (!color)
			return Gparams.defaultNodeColor;
		return color;
		return color;
	}).attr("stroke", "black").on("click", clickNode2).style("opacity",
			function(d) {
				return d.opacity;
			});

	if (currentType == "civ") {

		gPoint.append("text").text(function(d) {
			return d[Gparams.defaultNodeNameProperty];
		}).attr("font-size", "24px").attr("text-anchor", "middle").attr("fill",
				function(d) {
					return d.color;
				}).attr("transform", function(d) {
			var dx = d.w / 2;
			return "translate(" + dx + ",-15)";
		});
	} else if (currentType == "per") {

		gPoint.append("text").text(function(d) {
			return d[Gparams.defaultNodeNameProperty];
		}).attr("font-size", "18px").attr("text-anchor", "middle").attr("fill",
				function(d) {
					return d.color;
				}).attr("transform", function(d) {
			var dx = d.w / 2;
			return "translate(" + dx + ",-2)";
		});
	} else {

		gPoint.append("text").text(function(d) {
			return d[Gparams.defaultNodeNameProperty];
		}).attr("font-size", "10px").attr("text-anchor", "start").attr("fill",
				function(d) {
					return d.color;//"purple";
					drawingParams.pointTextColor;

				}).attr("transform", function(d) {

			var dx = d.w / 2;

			return "translate(" + dx + ",-4),rotate(-45)";
		});
		
		gPoint.append("rect").attr("width",1) 
		.attr("height", 16)
		.attr("x",function(d) {return 0;})
		.attr("y", function(d) {return -3;});
		if(!hasNoEndDate){
		gPoint.append("rect").attr("width",1) 
		.attr("height", 16)
		.attr("x",function(d) {return d.w;})
		.attr("y", function(d) {return -3;})
		}
		
	}
}

// ///////////////////////////////:///////////////////OLD///////////////////////////////////////

// ///////////////////////////////:///////////////////OLD///////////////////////////////////////
// ///////////////////////////////:///////////////////OLD///////////////////////////////////////
// ///////////////////////////////:///////////////////OLD///////////////////////////////////////

   self.clickNode=function(d) {

	var e = d3.event;
toutlesensController.hidePopupMenu();
	selectedNode = d3.select(this).datum();

	if (e.ctrlKey) {

	} else if (e.altKey) {
		;
d3forceGraphClass.scrollToCenter();
	} else {

		showInfos(selectedNode);

	}
}
   self.clickNode2=function() {

	var e = d3.event;
toutlesensController.hidePopupMenu();
	selectedNode = d3.select(this).datum();

	if (e.ctrlKey) {

	} else if (e.altKey) {
		;
d3forceGraphClass.scrollToCenter();
	} else {

		showInfos(selectedNode);

	}
	return false;
}
function dblclick(d) {
	selectedNode = d3.select(this).datum();
	var id = selectedNode.id;
toutlesensController.generateGraph(id);
}

   self.getObjXposition=function(obj) {

}
 return self;
})()