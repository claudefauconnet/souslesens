/**
 * Created by claud on 11/02/2017.
 */

var request = require('request');
var token="LHCJUVuTVgwkEFKUepHHnnReuDYuSTDygpVSDzSE";



/*request('https://api.discogs.com/database/search?q=Mozart&token='+token, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body) // Show the HTML for the Google homepage.
    }
    var xxx=body
})*/

var options = {
    url: 'https://api.discogs.com/database/search?q=BWV1005&token='+token,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
    }
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        var info = JSON.parse(body);

    }

}

request(options, callback);
