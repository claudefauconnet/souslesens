var externalRessourcesCommon = (function(){
 var self = {};
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

//moved  var currentExternalUri;


var labelsGenericTypes={
		chaudron$Auteur :"Person",
		chaudron$notice:"Book",
		chaudron$motMatiere :"Book",
		chaudron$Nom_geographique:"Location",
		hist_antiq$Personne:"Person",
		hist_antiq$Lieu:"Location",
		hist_antiq$motMatiere:"Book"
	
}





   self.listExternalItems=function(source,object,target){
	if( !subGraph){
		common.setMessage("impossible to search info : no subGraph Attr");
		console.error("no subGraph");
		return;
	}
	var key=subGraph.replace(/-/g,'_')+"$"+object.label
	
	var genericLabel=labelsGenericTypes[key];
	var fnName="list"+source+genericLabel;
	var fn=window[fnName];
if(typeof fn === 'function') {
	fn(object, target);
	}
	
	
	
}


   self.searhExternalResource=function(){

	var source=$("#externalSourceSelect").val();
	var word="";
	if(currentObject && currentObject.name)
	var word0= currentObject.name;
	if(!word0 && currentObject && currentObject[Gparams.defaultNodeNameProperty])
		var word0= currentObject[Gparams.defaultNodeNameProperty];
	var word=prompt ("chercher",word0);
	if(source && source.length>0 && word && word.length>3){
		var fnName="searchInTitle"+source;
		var fn=window[fnName];
		if(typeof fn === 'function') {
		fn(word,externalInfoPanel);
		}
		
	}
	
}


   self.htmlEncode=function(value) {
	// create a in-memory div, set it's inner text(which jQuery
	// automatically encodes)
	// then grab the encoded contents back out. The div never exists on the
	// page.
	return $('<div/>').text(value).html();
}

   self.encode_utf8=function(s) {
	  return unescape(encodeURIComponent(s));
	}


   self.showExternalressourcesList=function(objs,target){
	var strImage;
	var dbPediaHtmlArray = "<table>";
	for ( var i=0;i< objs.length;i++) {
		var obj=objs[i];
		var str = "<tr>";
		str += "<td>"

		if (obj["thumbnail"]) {
			var src = obj["thumbnail"].value;
self.generateExternalImg(src);

		}
		str += "<span>";
		// str+="<B>Wikipedia EN</B><br>";
		for ( var key in obj) {
			if (key == "id" && obj[key].value.startsWith("http")) {
				
					str +="<img src='icons/details.jpg' width='20px' onclick=showExternalResourceDetails('"+obj[key].value+"');>";
			
			} else if (key == "thumbnail") {
				;
			} else if (key == "x" && obj[key].value.startsWith("http")) {
				str +="<img src='icons/details.jpg' width='10px' onclick=showExternalResourceDetails('"+obj[key].value+"');>";

			} else if (key == "abstract") {
				continue;
			} else {
				var val = obj[key].value;
				var p = val.indexOf("http://");
				if (p == 0)
					val = "<a href='" + val + "'>" + val
							+ "</a>";

				str += "<i>" + key + "</i> :";
				str += val + "<br>";
			}

		}
		str += "<span>"

		// str += obj["abstract"].value;
		str += "</td>"
		str += "<td>"
		if (strImage)
			str +=strImage;

		str += "</td>"
		str += "<tr>"
		// var oldHtml = $("#infoPanel").html();

		dbPediaHtmlArray += str;
	}
	dbPediaHtmlArray += "</table";
	$(target).html(dbPediaHtmlArray);
}



    self.associateExternalResourceToNode = function () {
        var source = $("#externalSourceSelect").val();
        var prop = {};
        prop["uri_" + source] = currentExternalUri;
        modifyData.updateProperties(currentObject, prop);

    }

   self.showExternalResourceDetails=function(uri){
	currentExternalUri=uri;

	$("#nodeDetailsDiv").html("  <button onclick='self.associateExternalResourceToNode()'>"+
		"Associer  cette page au noeud courant </button><br"+
		"<iframe width='"+((totalWidth / 4 * 3) - 50)+"' height='"+(totalHeight - 150)+"' src='"+uri+"'>");
//	$("#nodeDetailsDiv").attr("src",uri);

}

   self.generateExternalImg=function(src) {
	var imgWidth = $("#imagePanel").width();
	var imgHeight = $("#imagePanel").height();
	var imgSize;
	imgWidth="50px";
	if (imgWidth > imgHeight)
		imgSize = "height='" + imgHeight + "'";
	else
		imgSize = "width='" + imgWidth + "'";

	var strImage = "<a href='" + src + "' target='blank_'><img src='" + src
			+ "' " + imgSize + " align='center'></a>";
	
	return strImage;
}



 return self;
})()