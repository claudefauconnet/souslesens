

self.showThumbnail = function (relativePath) {
    var url = self.imagesRootPath + relativePath.replace("%2F", "/");
    var str2 = ' <img id="thumbnailImage" src="' + url + '" border="0" height="real_height" width="real_width"  onclick="toutlesensController.showImage(\'' + url + '\')" onload="resizeImg(this, null, 300);">'
    if ($("#largeImageCBX").prop("checked")) {
        self.showImage(url);
    }
    $("#imagePanel").html(str2);

}

self.nextImage = function () {

    if (currentThumbnails.currentIndex < currentThumbnails.length - 1) {
        currentThumbnails.currentIndex++;
        self.showThumbnail(currentThumbnails[currentThumbnails.currentIndex].path)
        highlightNode(currentThumbnails[currentThumbnails.currentIndex].id)
    }
}
self.previousImage = function () {
    if (currentThumbnails.currentIndex > 0) {
        currentThumbnails.currentIndex--;
        self.showThumbnail(currentThumbnails[currentThumbnails.currentIndex].path)
        highlightNode(currentThumbnails[currentThumbnails.currentIndex].id)
    }

}

self.rotateImage = function (negative) {
    self.rotate = function (divId, angle) {
        var deg = $("#" + divId).data('rotate') || 0;
        var rotate = 'rotate(' + angle + 'deg)';
        $("#" + divId).css({
            '-webkit-transform': rotate,
            '-moz-transform': rotate,
            '-o-transform': rotate,
            '-ms-transform': rotate,
            'transform': rotate
        });

    }

    var angle = 90;
    if (negative)
        angle = -90;
    self.rotate("thumbnailImage", angle);
    var oldW = $("#largeImage").css("width");
    var oldH = $("#largeImage").css("height");
    var divHeight = $("#nodeDetailsDiv").css("height");
    var ratio = parseInt(divHeight.replace("px", "")) / parseInt(oldW.replace("px", ""));
    $("#largeImage").css("width", parseInt(oldW.replace("px", "")) * ratio); // Set new width
    $("#nodeDetailsDiv").css("top", "100px");
    // $("#largeImage").css("height",  oldW);
    self.rotate("largeImage", angle);


}