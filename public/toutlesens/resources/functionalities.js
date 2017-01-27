
var profiles={};
profiles.minimum={
		hide:["lang_52","lang_62","div_externalRessources"]
			
	}
profiles.all={
		hide:[]	
			
	}
$(function() {
hideFunctionalities(profiles[Gparams.currentProfile]);
})

function hideFunctionalities(profile){
	if(!profile)
		return;
	for(var i=0;i<profile.hide.length;i++){
		var www=$("#"+profile.hide[i]).html()
		$("#"+profile.hide[i]).css("visibility","hidden");
	}
	
	
}