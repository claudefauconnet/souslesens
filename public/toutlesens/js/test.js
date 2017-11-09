var GSobj = {};
db.similarities.find({}).limit(100000).forEach(function (doc) {
    var start = db.import.findOne({"_id": doc.startRule});
    var end = db.import.findOne({"_id": doc.endRule});
    var relId = start.ruleGS + "_" + end.ruleGS;

    if (!GSobj[relId]) {
        GSobj[relId] = {
            startGS: start.ruleGS,
            endGS: end.ruleGS,
            startBranch: start.branch,
            endBranch: end.branch,
            startDomain: start.domain,
            endDomain: end.domain,
            count: 0,
            score_5: 0,
            score_6: 0,
            score_7: 0,
            score_8: 0,
            score_9: 0,
            score_1: 0,
            scoreCumul: 0
        }
    }
    var score = doc.score
    if (score < 0.6)
        GSobj[relId].score_5 += 1
    else if (score < 0.6)
        GSobj[relId].score_6 += 1
    else if (score < 0.7)
        GSobj[relId].score_7 += 1
    else if (score < 0.8)
        GSobj[relId].score_8 += 1
    else if (score < 0.9)
        GSobj[relId].score_9 += 1
    else if (score == 1)
        GSobj[relId].score_1 += 1


    GSobj[relId].count += 1;
    GSobj[relId].scoreCumul += score;


})

//printjson(GSobj);
for (var key in GSobj) {
    db.GSsimilarities.save(GSobj[key]);

}
