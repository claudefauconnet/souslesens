function setGraphActionsHelp(){
	
	
	str="Actions possible sur le graphe :<ul>" +
			"<li> click sur un noeud : affiche les informations du noeud</li>"+
			"<li> double click sur un noeud : ce noeud devient le noeud central </li>";
			
	
	if ($("#representationSelect").val() == "FLOWER") {
		str+="<li> double click sur un Label : ferme ou ouvre les noeuds de ce label </li>";
	}
	
	str+="</ul>";
	
	$("#helpDiv").html(str);	
	

}