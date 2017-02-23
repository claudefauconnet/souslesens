
var langResources = {}

$(function() {
	var queryParams = getQueryParams(document.location.search);

	if (!queryParams.lang && window.parent.toFlareJson)
	 queryParams.lang = window.parent.lang;
	if (queryParams.lang)
		Gparams.lang = queryParams.lang;
	setLangage(Gparams.lang);
});

function setLangage(lang) {

	for ( var key in langResources[lang]) {
		var str = langResources[lang][key]
		$("#" + key).html(str);

	}

}

