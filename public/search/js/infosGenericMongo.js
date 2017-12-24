var infosGenericMongo = (function () {
    var self = {};
    self.isModifying = 0;
    self.allDynamicSelectValues = {};

    self.setAttributesValue = function (collection, obj, attrObject) {


        for (var key in attrObject) {
            var value = "";
            if (obj)
                var value = obj[key];
            if (!value)
                value = "";
            var type = attrObject[key].type;
            var _userRole = userRole;
            if (!_userRole)
                _userRole = window.parent.userRole
            //  if (!_userRole)
            _userRole = "write"
            if (type && type == 'readOnly' || _userRole == "read") {
                value = util.convertHyperlinks(value);
                attrObject[key].value = "&nbsp;:&nbsp;<b>" + value + "</b>";
                continue;
            }

            var selectValues = null;


            var selectFields = Schema.schema.fieldsSelectValues[collection];
            if (selectFields) {
                selectValues = selectFields[key];
                if (selectValues) {
                    if (selectValues.source) {
                        selectValues.source.field = key;
                        selectValues = self.getDynamicSelectValues(selectValues.source);
                    } else {

                        selectValues.sort();
                    }
                }

            }


            if (type && type == 'select' && selectValues) {
                var str = "<select onchange='infosGenericMongo.incrementChanges();' class='objAttrInput' id='attr_" + key + "'>"
                str += "<option  value=''></option>";
                for (var i = 0; i < selectValues.length; i++) {

                    var val = selectValues[i];
                    var strId;
                    var strText;
                    if (val.id) {//dynamic select
                        strText = val.name;
                        strId = val.id;
                    } else {//simple value and text
                        strText = val;
                        strId = val;
                    }

                    var selected = "";
                    if (value == selectValues[i])
                        selected = " selected ";

                    str += "<option value='" + strId + "' " + selected
                        + " >" + strText + "</option>";
                }

                str += "</select>";
                value = str;
            }

            else if (type == 'password') {
                value = "<input type='password' onchange='infosGenericMongo.incrementChanges();' class='objAttrInput' " + strCols + "id='attr_"
                    + key + "' value='" + value + "'>";
            }
            else if (!type || type == 'text') {
                var cols = attrObject[key].cols;
                var rows = attrObject[key].rows;
                var strCols = ""

                if (rows) {// textarea
                    if (cols)
                        strCols = " cols='" + cols + "' ";
                    rows = " rows='" + rows + "' ";
                    value = "<textArea  onchange='infosGenericMongo.incrementChanges();' class='objAttrInput' " + strCols + rows
                        + "id='attr_" + key + "' >" + value + "</textarea>";
                } else {
                    if (cols)
                        strCols = " size='" + cols + "' ";
                    value = "<input onchange='infosGenericMongo.incrementChanges();' class='objAttrInput' " + strCols + "id='attr_"
                        + key + "' value='" + value + "'>";
                }
            }
            attrObject[key].value = value;
        }

    }

    self.getDynamicSelectValues = function (source) {
        var dynamicSelectValuesField = {};
        self.allDynamicSelectValues[source.field] = dynamicSelectValuesField;
        var sourceSelectValues = [];
        var sourceSelectIds = [];
        var query = {};
        if (source.query) {

            for (var key in source.query) {
                if (source.query[key].indexOf("$") == 0)
                    query [key] = eval(source.query[key].substring(1));
                else
                    query [key] = source.query[key];

            }

        }
        /*  if (source.distinct) {
         var options = devisuProxy.getDistinct(dbName, source.collection, query, source.distinct);
         return options;
         }
         else {*/
        var options = devisuProxy.loadData(dbName, source.collection, query);
        var field = "name";
        if (source.distinct)
            field = source.distinct;
        for (var i = 0; i < options.length; i++) {
            dynamicSelectValuesField[options[i][field]] = options[i].id;
            var name = options[i][field];
            var id = options[i].id;

            if (sourceSelectIds.indexOf(name) < 0) {
                sourceSelectIds.push(id);
                sourceSelectValues.push(name);
                // sourceSelectValues.push({id: id, name: name});
            }
        }
        return util.sortByField(sourceSelectValues, "name");
        // }
    }


    self.drawAttributes = function (attrObject, zoneId) {
        var str = "<table>";
        var strHidden = "";
        for (var key in attrObject) {

            var strVal = attrObject[key].value;


            var title = attrObject[key].title;

            if (attrObject[key].type == 'hidden') {
                strHidden += "<input type='hidden' id='attr_" + key + "' value='" + strVal + ">"
            } else {
                className = 'mandatoryFieldLabel';
                if (!title)
                    title = key;
                var className = 'fieldLabel';
                var desc = attrObject[key].desc;
                if (desc && desc.length > 0)
                    title+= "<img onclick=  'common.setMessage(\""+desc+"\",\"blue\",\"window.parent.attrsTabMessage\")'; src='images/info.jpg' width='15px' title='" + desc + "'>"

                if (attrObject[key].control == 'mandatory')
                    className = 'mandatoryFieldLabel';

                str += "<tr><td align='right'><span class=" + className + ">" + title + "</span></td><td><span class='fieldvalue'>" + strVal + "</span></td></tr>";
            }
        }
        str += "</table>" + strHidden;
        $("#" + zoneId).html(str);

    }

    self.incrementChanges = function () {
        self.isModifying += 1;
    }


    self.setModifiedValues = function (obj, classId) {
        var fields = $(classId);
        if (!obj)
            obj = {}
        for (var i = 0; i < fields.length; i++) {

            var fieldId = $(fields[i]).attr('id').substring(5);
            var fieldValue = $(fields[i]).val();
            if (!fieldValue || fieldValue.length == 0)
                continue;
            if (fieldValue == " ")
                continue;

            obj[fieldId] = fieldValue;

        }
        return obj;

    }


    self.getSelectFromData = function (data, valueField, textField, currentValue, callback) {
        var str = "<select size='20' onchange='" + callback + "(this)'>"

        for (var i = 0; i < data.length; i++) {
            var value = data[i][valueField];
            var text = data[i][textField];
            var checked = "";
            if (value && value)
                checked = "checked='checked'";

            str += "<option value='" + value + "'" + checked + ">" + text + " </option>";
        }
        str += "</select>";
        return str;
    }

    self.isFieldModified = function (obj, field) {
        var fieldValue = $("#attr_" + field).val();
        if (!obj[field] || fieldValue != "" + obj[field]) {
            return true;
        }
        return false;

    }

    self.getFormFieldValue = function (field) {
        var fieldValue = $("#attr_" + field).val();
        return common.convertNumStringToNumber(fieldValue);


    }


    self.validateInput = function (display, obj) {
        var message = "<ul>";
        var ok = true;
        for (var groupKey in display) {
            var group = display[groupKey];
            for (var fieldKey in group) {
                var validation = group[fieldKey].validation;
                if (validation) {
                    if (validation.mandatory) {
                        if (!obj[fieldKey] || obj[fieldKey] == "") {
                            message += "<li>field " + fieldKey + " is mandatory</li>";
                            ok = false;
                        }
                    }

                }
            }


        }
        if (ok)
            return {validated: true}
        return {validated: false, reason: message};
    }


    self.save = function (dbName, collection, obj, display, additionalAttrsObj) {
        infosGenericMongo.isModifying=false;
        var fields = $(".objAttrInput")
        for (var i = 0; i < fields.length; i++) {

            var fieldValue = $(fields[i]).val();
            if (!fieldValue) {// || fieldValue.length == 0) {
                continue;
            }

            var key = fields[i].id.replace("attr_", "");

            fieldValue = common.convertNumStringToNumber(fieldValue);
            obj[key] = fieldValue;
        }
        if (display) {
            var result = self.validateInput(display, obj);
            if (result.validated == false)
                return {status: "validationError", data: result.reason};

        }


        obj.userLogin = userLogin;
        //  obj.lastModified="";
        if (additionalAttrsObj) {
            for (var key in additionalAttrsObj) {
                obj[key] = additionalAttrsObj[key];
            }
        }

        if (!obj.id) {//new
            var result = devisuProxy.addItem(dbName, collection, obj, false);

            window.parent.common.setMessage(result.status, "green", "attrsTabMessage");
            obj.id = result.object.id;
            obj._id = result.object._id;

            if (Gparams.synchronizeMongoToNeo) {
                mongoToNeoSynchronizer.pushToNeo("create", {dbName: dbName, collection: collection}, result.object);
            }


            obj.newId = true;


            return {status: "created", data: obj};
        }
        else {//update
            //  if(obj._id)
            //   obj.mongoId=obj._id.$oid;
            var result = devisuProxy.saveData(dbName, collection, obj);

            window.parent.common.setMessage(result.id, "green", "attrsTabMessage");
            if (Gparams.synchronizeMongoToNeo) {
                mongoToNeoSynchronizer.pushToNeo("update", {dbName: dbName, collection: collection}, obj);
            }
            return {status: "modified", data: obj};
        }

    }


    self.replaceRelations = function (dbName, relationCollection, query, objs, callback) {
        var executeMongo = function () {
            devisuProxy.deleteItemByQuery(dbName, relationCollection, query, true, function (result) {

                devisuProxy.addItems(dbName, relationCollection, objs, function (result) {
                    callback(null, result)
                })
            });
        }
        if (Gparams.synchronizeMongoToNeo) {
            mongoToNeoSynchronizer.pushToNeo("delete", {
                dbName: dbName,
                collection: relationCollection
            }, query, function (err, result) {
                executeMongo();
                for (var i = 0; i < objs.length; i++) {
                    mongoToNeoSynchronizer.pushToNeo("create", {
                        dbName: dbName,
                        collection: relationCollection
                    }, objs[i], function (err, result) {

                    });
                }
            });

        }
        else
            executeMongo();

    }


    return self;
})()