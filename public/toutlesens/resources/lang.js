
var langResources = {}

$(function() {
	var queryParams = getQueryParams(document.location.search);

	//if (! Gparams.isInframe && !queryParams.lang && window.parent.toFlareJson)
    if (typeof isSouslesensIframe == 'undefined') // voir html des iframe filles
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

