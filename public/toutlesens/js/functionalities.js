
function initFunctionalities(){
    var profile=Gparams.profiles[Gparams.currentProfile];
    hideFunctionalities(profile);
    disableFunctionalities(profile)
}

function hideFunctionalities(profile) {
    if (!profile)
        return;
    for (var i = 0; i < profile.hide.length; i++) {
        $("#" + profile.hide[i]).css("visibility", "hidden");
    }


}
function disableFunctionalities(profile) {
    if (!profile)
        return;
    for (var i = 0; i < profile.disable.length; i++) {
        $("#" + profile.disable[i]).prop('disabled', true);
    }
}