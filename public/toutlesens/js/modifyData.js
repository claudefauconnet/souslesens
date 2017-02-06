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


var currentRelationData;
var currentLabel;
var isNewNode=false;
function drawFieldInputs(obj, label) {
	if(label)
		currentLabel=label;
	else
		currentLabel=obj.label;
	
	
	$("#nodeInputDiv").html("");
	var str = "<br><div id='inputPanel'>";

	// str += "<button
	// onclick='onDeleteNodeButton()'>Supprimer</button>&nbsp;&nbsp;";
	// str += "<button onclick=$('#graphDiv').html('')>Effacer</button>";
	str += "<button onclick=addPropertyToNode('')>Ajouter une propriete</button>";
	str += "<div id='inputFieldsNodes'>";
	str += "<hr><table id='inputFieldsNodesTable'>";
	if (subGraph) {
		str += "<tr><td><font color='blue'>subGraph</font></td><td><input type='hidden' class='inputFieldNode' id='field_subGraph' value="
			+ subGraph + ">subGraph</td></tr>";
		
	}


	str += "<tr><td>LABEL</td><td><select  class='inputFieldNode' id='field_label' value="
			+ currentLabel + "></select>></td></tr>";
	if (!obj &&  dataModel.labels[currentLabel].indexOf("nom")<0) {
		str += "<tr><td>nom</td><td><input  class='inputFieldNode' id='field_nom' value=''></td></tr>";
		
	}
	
	for (var i = 0; i < dataModel.labels[currentLabel].length; i++) {
		var fieldName = dataModel.labels[currentLabel][i];
		var fieldValue = "";
		
		
		if(fieldName=="subGraph")
		continue;
		if(obj && obj[fieldName]){
			fieldValue=obj[fieldName];
		}
		
		str += "<tr>"
		str += "<td>" + fieldName
				+ " : </td><td><input class='inputFieldNode' value='"
				+ fieldValue + "' id='field_" + fieldName + "'>" + "<td>";
		str += "</tr>"
	}

	str += "</table>"
		
	str += "</div>"
	//str += "<button onclick=saveNodeInput(true)>Enregistrer le noeud</button>&nbsp;";
	str += "</div>"
		
	$("#nodeInputDiv").append(str);
	initLabels(subGraph,"field_label");
	$("#field_label").val(currentLabel);
	
}

/*function drawModifyInputs(obj) {
	var str = "<br><div id='inputPanel'>";
//	str += "<button onclick=saveNodeInput()>Enregistrer</button>&nbsp;";
//	str += "<button onclick='onDeleteNodeButton("+obj.id+")'>Supprimer</button>&nbsp;&nbsp;";

	// str += "<button
	// onclick=$('#graphDiv').html('')>Effacer</button>&nbsp;<br>";

	str += "<div id='inputFieldsNodes'>";
	str += "<hr><table id='inputFieldsNodesTable'>";
	str += "<tr><td><font color='blue'>LABEL</font></td><td><input  class='inputFieldNode' id='field_LABEL' value="
			+ obj.type + "></td></tr>";

	if (subGraph && !obj.subGraph) {
		obj.subGraph = subGraph;
	}
	for ( var key in obj) {
		if (key == "id" || (key == "name" && obj.nom))
			continue;
		var hiddenStr="";
		if (key == "subGraph" || key == "label")
			hiddenStr= " type='hidden' ";
		var fieldName = key;
		var fieldValue = obj[key];

		str += "<tr>"
		str += "<td>" + fieldName
				+ " : </td><td><input "+hiddenStr+"class='inputFieldNode' value='"
				+ fieldValue + "' id='field_" + fieldName + "'>" + "<td>";
		str += "</tr>"
	}

	str += "</table>"
	str += "<button onclick=addPropertyToNode('')>+</button>";

	str += "</div>"
	$("#nodeInputDiv").html(str);
}*/

function addPropertyToNode() {
	var fieldName = prompt("nom de la nouvelle propriete");
	if (!fieldName || fieldName.length == 0)
		return;
	var str = "<td>" + fieldName
			+ " : </td><td><input class='inputFieldNode'  id='field_"
			+ fieldName + "'>" + "<td>";
	//currentLabel=currentObject.label;
	dataModel.labels[currentLabel].push(fieldName);
	dataModel.allProperties.push(fieldName);
	dataModel.allProperties.sort();
	
	// var html = $("#inputFieldsNodesTable").html();
	$("#inputFieldsNodesTable").append(str);
}

function onModifyNodeButton(){
	isNewNode=false
	var str=drawFieldInputs(currentObject);
    $("#accordionModifyPanel").accordion({
        active: 0
    });
	$("#nodeInputDiv").html(str);
	//saveNodeInput(currentObject===null?true:false);
}

function saveNodeInput() {
	var fields = $(".inputFieldNode")
	var obj = {}
	for (var i = 0; i < fields.length; i++) {

		var fieldId = $(fields[i]).attr('id').substring(6);
		var fieldValue = $(fields[i]).val();
		if (!fieldValue || fieldValue.length == 0)
			continue;

		obj[fieldId] = fieldValue

		obj[fieldId] = fieldValue;

	}
	
		
	writeNodeInNeo4j(obj);

	

}

function  onDeleteNodeButton(id){
	if (!id) 
		id=currentObjId;
		if(confirm("detruire le noeud definitivement ?"))
			deleteNodeInNeo4j(id);
	
}

function deleteNodeInNeo4j(id) {
	var query = "MATCH (n) where ID(n)=" + id + " OPTIONAL MATCH (n)-[r]-() DELETE r, n";
	executeQuery(QUERY_TYPE_MATCH, query, function() {
		setMessage("Noeud supprime !", "green");
	});

}






function writeNodeInNeo4j(obj) {
	var label = "";
	var props = "{"
	var i = 0;
	for ( var key in obj) {
		if (key == "label")
			label = obj[key];
		else {
			var value = obj[key];
			if (i++ > 0)
				props += ",";
			if ($.isNumeric(value))
				props += key + ':' + value;
			else {
				props += key + ':"' + value + '"';
			}

		}

	}

	props += "}"

	if (isNewNode===true) {
		currentLabel=label;
		startSearchNodesTime=new Date();
		var query = "CREATE (n:" + label + props + ") RETURN n.name,ID(n)"
		executeQuery(QUERY_TYPE_MATCH, query, function(result) {
			setMessage("Noeud cree !", "green");
			var id= result[0].data[0].row[1];
			
			$('#wordsSelect').append($('<option>', {
			    value: id,
			    text: obj.name
			}));
			
			$("#radarFiltersTab").hide().fadeIn();
			
			
			
		//	$("#nodesLabelsSelect").val("");
		
			/* $("#word").val(obj.nom)
			 searchNodesUI();*/
		
			/*$("#nodesLabelsSelect").val(currentLabel);
				$("#word").val(obj.nom),
				currentObject=obj;
				searchNodesUI($("#word"),null);
				$("#graphDiv").html("");*/
			
		});
	} else {
		var query = "MATCH (n) where ID(n)=" + currentObject.id + " SET n = "
				+ props + " RETURN n";

		executeQuery(QUERY_TYPE_MATCH, query, function() {
			setMessage("Noeud modifie !", "green");
			 dispatchAction("setAsRootNode");
			
		});

	}
}

function writeRelationInNeo4j(node1, relationType, node2) {
	var query = "MATCH (n),(m)" + "WHERE ID(n)=" + node1.id + " AND ID(m)="
			+ node2.id + " CREATE (n)-[r:" + relationType
			+ " { name : n.name + '<->' +m.name }]->(m)" + " RETURN r";
	executeQuery(QUERY_TYPE_MATCH, query, function() {
		setMessage("Relation cree !", "green");
		 dispatchAction("setAsRootNode");
	});
}

function updateProperties(obj, propsObj) {
	/*
	 * MATCH (n { name: 'Andres' }) SET n.surname = 'Taylor' RETURN n
	 */
	var neoId=obj.neoId;
		var i = 0;
		for ( var key in propsObj) {
			var props = ""
			if (key == "label")
				label = propsObj[key];
			else {
				var value = propsObj[key];
				if (i++ > 0)
					props += ",";
				if ($.isNumeric(value))
					props += "n."+key + '=' + value;
				else {
					props += "n."+key + '="' + value + '"';
				}

			}

		

	

	var query=query="Match (n) where ID(n)="+neoId+" set "+props+" return n";
		
	executeQuery(QUERY_TYPE_MATCH, query, function() {
		setMessage("Update done !", "green");
	});
		}
}





function onModifyMode() {
	$(".modifyPanelDiv").css("visibility", "hidden");
	var mode = $("#modifyModeSelect").val();
	if (mode == "createRelation") {
		$("#linkNodesDiv").css("visibility", "visible");
	}

}

function createNewLinkType() {
if(!currentRelationData ||  !currentRelationData.sourceNode || currentRelationData.targetNode){
	setMessage("select source and targetNode first");
}
	
	var newLinkType = prompt("nom du nouveau type de lien");
	if (newLinkType) {
		$("#linkType").append($('<option>', {
			value : newLinkType,
			text : newLinkType,
			selected : "selected"
		}));
		var newRelation={
				label1 : currentRelationData.sourceNode.label,
				relType : newLinkType,
				label2 : currentRelationData.targetNode.label,
				direction : "normal"
			}
		dataModel.relations[currentRelationData.sourceNode.label].push(newRelation);
	}
}

function createRelation() {
	if (!currentRelationData) {
		setMessage("selectionner les noeuds source et cible")
		return;
	}
	
	currentRelationData.type = $("#linkType").val();
	if (!currentRelationData.type || currentRelationData.type.length==0) {
		setMessage("selectionner les noeuds source et cible")
		return;
	}
	writeRelationInNeo4j(currentRelationData.sourceNode, currentRelationData.type,
			currentRelationData.targetNode);
}

function reverseLinkNodes(){
	if(!currentRelationData)
		return;
	var sourceNode=currentRelationData.targetNode;
	var targetNode=currentRelationData.sourceNode;
	currentRelationData = {
			sourceNode : sourceNode,
			targetNode :targetNode
		}
	$("#linkSourceNode").val(sourceNode.name);
	$("#linkSourceNode").css("color", nodeColors[sourceNode.label]);
	$("#linkSourceLabel").html(sourceNode.type);
	$("#linkTargetNode").val(targetNode.name);
	$("#linkTargetNode").css("color", nodeColors[targetNode.label]);
	$("#linkTargetLabel").html(targetNode.type);
	setLinkTypes();
}


function setLinkTypes(){
	var sourceLinks = dataModel.relations[currentRelationData.sourceNode.label];
	var links = [];
	for (var i = 0; i < sourceLinks.length; i++) {
		if (sourceLinks[i].label2 == currentRelationData.targetNode.label
				&& links.indexOf(sourceLinks[i].relType) < 0) {
			links.push(sourceLinks[i].relType);
		}
		
	}
	if(links.length==0){
        links=["relation"];
	}else {
        links.splice(0, 0, "");
    }
	fillSelectOptions(linkType, links);
	linkType.selectedindex=0;
}



function onCreateNodeButton(label, json) {
	var xxx = dataModel;
	isNewNode=true;
	var str = "<br>Label du noeud : <select  id='labelTypesSelect' onchange='drawFieldInputs(null,$(this).val())'><option></option>"
	for ( var key in dataModel.labels) {
		var selected="";
	/*	if(currentLabel && currentLabel==key)
			selected=" selected='selected'"*/
		str += "<option"+selected+">" + key + "</option>";
	//	str += "<option>" + key + "</option>";
	}
	str += "</select>"
	str += "<button onclick=addLabelType()>+</button>";
    $("#nodeInputDiv").html(str);
    $("#accordionModifyPanel").accordion({
        active: 1
    });
    $("#accordionModifyPanel").accordion({
        active: 0
    });

}

function addLabelType() {
	var label = prompt("nom du nouveau label");
	if (!label || label.length == 0)
		return;
	$("#labelTypesSelect").append(
			$('<option selected="selected"></option>').val(label).html(label));
	$("#nodesLabelsSelect").append(
			$('<option></option>').val(label).html(label));
	
	dataModel.labels[label] = [ 'subGraph', 'nom' ];
	drawFieldInputs(null, label);
}


