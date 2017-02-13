function addDaysToDate(date, days) {
    var oneDay = 1000 * 60 * 60 * 24;
    var newDate = new Date(date.getTime() + (oneDay * days));
//	var newDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
    return newDate;
}
function neoDateToDate(dateStr) {
    //Sat Oct 28 17:00:46 CET 1972
 //   Sun Dec 31 1899 00:00:00 GMT+0100 (Paris\, Madrid)
    var monthes = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
    }
    var regexDate=/[A-z]{3} ([A-z]{3}) ([0-9]{2}) ([0-9]{4})/
//    var regexDate = /[A-z] ([A-z]{3}) ([0-9]{2}).*([0-9]{4})/
    var dateArray = regexDate.exec(dateStr);
    var month=monthes[dateArray[1]];
    try {

       var date=new Date(dateArray[3], month, dateArray[2]);
       // console.log(+date+ "  "+dateStr)
        return date;
    }
    catch(e){
        console.log("bad date "+dateStr)
    }
}

function drawGant(where, groupField, startDateField, endDateField, duration) {
    if (!Gparams.gantt.startField && !startDateField) {
        alert("startField  is null");
        return;
    }
    if (!objectName)
        objectName = Gparams.gantt.name;
    var objectName="nom"
    if (!startDateField) {
        startDateField = Gparams.gantt.startField;
        if (!endDateField)
            endDateField = Gparams.gantt.endField;
    }


    var whereStr = " where n." + startDateField + " is not null";
    var endFieldReturn = "";
    if (!duration) {
        endFieldReturn = ",n." + endDateField + " as endDate";
        whereStr += " and  n." + endDateField + " is not null";
    }
    var groupFieldReturn="";
if(groupField)
    groupFieldReturn = ",n." +groupField + " as groupField";;
    if (where && where.length > 0)
        whereStr += " and " + where;
    if(subGraph)
        whereStr += " and n.subGraph='" + subGraph+"'";
    if(subGraph)
        whereStr += " and toInt(n.timestamp)>0"
    var query = "MATCH (n)" + whereStr
        + " return n." + startDateField + " as startDate " + endFieldReturn + ",n." + objectName + " as name "+groupFieldReturn+",id(n) as id, labels(n)  as labels limit 200"
    console.log(query)
    executeQuery(QUERY_TYPE_MATCH, query, function (data) {
        //	var data = result[0].data;
        var tasks = [];
        var taskNames = [];
        var taskStatus = {
            "SUCCEEDED": "bar",
            "FAILED": "bar-failed",
            "RUNNING": "bar-running",
            "KILLED": "bar-killed"
        };
        var maxTasks = 200;
        var distinctLabels = []
        for (var i = 0; i < Math.min(data.length, maxTasks); i++) {
           var startTime= parseInt(data[i].startDate);

    if(data[i].startTime<0)
        continue;
            var startDate=new Date(startTime);
           // var startDate = new Date(data[i].startDate);
          //  var startDate = neoDateToDate(data[i].startDate);
            var endDate;
            if (!data[i].endDate)
                endDate = addDaysToDate(startDate, duration)
            else
                endDate = new Date(data[i].endDate);
            var groupFieldValue=data[i].groupField;
            if(groupFieldValue)
                name=groupFieldValue;

            var name = data[i].name;
            var id = data[i].id;
            var label = data[i].labels[0];
            if (distinctLabels.indexOf(label) < 0)
                distinctLabels.push(label)
            name = "[" + label + "] " + name;
            tasks.push({
                "startDate": startDate,
                "endDate": endDate,
                "taskName": name,
                "label": label,
                id: id
            });
            taskNames.push(name);
        }

        tasks.sort(function (a, b) {
            return a.startDate - b.startDate;
        });
        var minDate = tasks[0].startDate;
        var maxDate = tasks[tasks.length - 1].endDate;
        tasks.sort(function (a, b) {
            if (a.startDate < b.stardDate)
                return 1;
            if (a.startDate > b.stardDate)
                return -1;
            return 0;
        });

        var format = "%H:%M";
        var format = "%Y";
        var timeDomainString = "1year";
        var height = 15 * tasks.length;
        var gantt = d3.gantt(gantDiv).taskTypes(taskNames).taskStatus(taskStatus)
            .tickFormat(format).height(height).width(800);

        gantt.timeDomainMode("fixed");
        changeTimeDomain(gantt, tasks, timeDomainString);

        gantt(tasks, "graphDiv");
        setGanttControls(minDate, maxDate, distinctLabels);

    });
}

function changeTimeDomain(gantt, tasks, timeDomainString) {
    this.timeDomainString = timeDomainString;
    switch (timeDomainString) {
        case "1hr":
            format = "%H:%M:%S";
            gantt.timeDomain([d3.time.hour.offset(getEndDate(tasks), -1),
                getEndDate()]);
            break;
        case "3hr":
            format = "%H:%M";
            gantt.timeDomain([d3.time.hour.offset(getEndDate(tasks), -3),
                getEndDate()]);
            break;

        case "6hr":
            format = "%H:%M";
            gantt.timeDomain([d3.time.hour.offset(getEndDate(tasks), -6),
                getEndDate()]);
            break;

        case "1day":
            format = "%H:%M";
            gantt.timeDomain([d3.time.day.offset(getEndDate(tasks), -1),
                getEndDate()]);
            break;

        case "1week":
            format = "%a %H:%M";
            gantt.timeDomain([d3.time.day.offset(getEndDate(tasks), -7),
                getEndDate()]);
        case "45Centuries":
            format = "%Y";
            gantt.timeDomain([d3.time.year.offset(getEndDate(tasks), -4500),
                getEndDate(tasks)]);
            break;
        case "1year":
            format = "%Y";
            gantt.timeDomain([d3.time.day.offset(getEndDate(tasks), -100),
                getEndDate(tasks)]);
            break;
        case "50years":
            format = "%Y";
            gantt.timeDomain([d3.time.year.offset(getEndDate(tasks), -50),
                getEndDate(tasks)]);
            break;
        default:
            format = "%H:%M"

    }
    gantt.tickFormat(format);
    gantt.redraw(tasks);
}

function getEndDate(tasks) {
    var lastEndDate = Date.now();
    if (tasks.length > 0) {
        lastEndDate = tasks[tasks.length - 1].endDate;
    }

    return lastEndDate;
}

function addTask() {

    var lastEndDate = getEndDate();
    var taskStatusKeys = Object.keys(taskStatus);
    var taskStatusName = taskStatusKeys[Math.floor(Math.random()
        * taskStatusKeys.length)];
    var taskName = taskNames[Math.floor(Math.random() * taskNames.length)];

    tasks.push({
        "startDate": d3.time.hour.offset(lastEndDate, Math.ceil(1 * Math
                .random())),
        "endDate": d3.time.hour.offset(lastEndDate, (Math
                .ceil(Math.random() * 3)) + 1),
        "taskName": taskName,
        "status": taskStatusName
    });

    changeTimeDomain(timeDomainString);
    gantt.redraw(tasks);
};

function removeTask() {
    tasks.pop();
    changeTimeDomain(timeDomainString);
    gantt.redraw(tasks);
};

function setGanttControls(starDate, endDate, labels) {
   /* $("#slider").dateRangeSlider({
        min: starDate,
        max: endDate
    });*/
   // fillSelectOptionsWithStringArray(ganttlabelsSelect, labels);

}

function drawFilteretGantt() {
    var label = $("#ganttlabelsSelect").val();
    var where = ""
    if (label != "") {
        where = 'n:' + label
    }

    drawGant(where);

}

