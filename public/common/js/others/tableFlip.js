$.fn.tableflip = function (sourceTable) {
    function find_size(m, x, y) {
        var r = {w: 0, h: 0};

        while ((y+r.h < m.length) && (m[y][x] == m[y+r.h][x]))
            r.h++;

        while ((x+r.w < m[y].length) && (m[y][x] == m[y][x+r.w]))
            r.w++;

        return r;
    }

    function flip_matrix(m) {
        var mx = [];

        for (var y = 0; y < m.length; y++) {
            for (var x = 0; x < m[y].length; x++) {
                if (typeof(mx[x]) === "undefined")
                    mx[x] = [];

                mx[x][y] = m[y][x];
            }
        }

        return mx;
    }

    var rc = [];				// Table matrix
    var rcx = [];				// Flipped table matrix

    // Build table matrix
    sourceTable.after("<table><tbody></tbody></table>");
    var newTable = $(this).children("tbody");
    sourceTable.children("tbody").children("tr").each(function(rIndex, rItem){
        if (typeof(rc[rIndex]) === "undefined")
            rc[rIndex] = [];

        var x = 0;
        $(this).children("td").each(function(cIndex, dItem){
            var w = parseInt($(this).attr("colspan")) || 1;
            var h = parseInt($(this).attr("rowspan")) || 1;

            while (typeof(rc[rIndex][x]) !== "undefined")
                x++;

            for (var yy = 0; yy < h; yy++) {
                for (var xx = 0; xx < w; xx++) {
                    if (typeof(rc[rIndex+yy]) === "undefined")
                        rc[rIndex+yy] = [];

                    rc[rIndex+yy][x+xx] = $(this)[0].outerHTML;
                }
            }

            x += w;
        });
    });

    rcx = flip_matrix(rc);

    // Generate new table
    for (var y = 0; y < rcx.length; y++) {
        if(newTable.children("tr:eq("+y+")").html() == null){
            newTable.append("<tr></tr>");
        }

        for (var x = 0; x < rcx[y].length; x++) {
            if (typeof(rcx[y][x]) !== "undefined") {

                newTable.children("tr:eq("+y+")").append(rcx[y][x]);
                var cell = newTable.children("tr:eq("+y+")").find(':last-child');

                var r = find_size(rcx, x, y);

                cell.attr("rowspan", r.h);
                cell.attr("colspan", r.w);

                for (var yy = 0; yy < r.h; yy++) {
                    for (var xx = 0; xx < r.w; xx++) {
                        rcx[y+yy][x+xx] = undefined;
                    }
                }
            }
        }
    }

    return $(this);
}

