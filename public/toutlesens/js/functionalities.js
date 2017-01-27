var profiles = {};
profiles.minimum = {
    hide: ["lang_52", "lang_62","listDownloadButton"],
    disable: ["listDownloadButton"]

}
profiles.all = {
    hide: [],
    disable: []
}
$(function () {
    var profile=profiles[Gparams.currentProfile];
    hideFunctionalities(profile);
    disableFunctionalities(profile)
})

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