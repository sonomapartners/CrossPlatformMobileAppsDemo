/// <reference path="../knockout-3.3.0.js" />
(function (global) {
    "use strict";

    global.ToDoList = global.ToDoList || {};
    global.ToDoList.Services = global.ToDoList.Services || {};

    var oauthResult = null;

    function authenticate(clientId, redirectUri) {
        var deferred = $.Deferred();

        var url = [
			'https://login.salesforce.com/services/oauth2/authorize?response_type=token&display=touch&client_id=',
			encodeURIComponent(clientId),
			'&redirect_uri=',
			encodeURIComponent(redirectUri)
        ].join('');

        var loginWindow = window.open(url, "_blank", "location=no");

        loginWindow.addEventListener('loadstart', function (event) {
            if (event.url.indexOf(redirectUri) == 0) {
                var fragment = event.url.split('#')[1]
                oauthResult = {};
                var pairs = fragment.split('&');
                for (var i in pairs) {
                    var keyAndValue = pairs[i].split('=');
                    oauthResult[decodeURIComponent(keyAndValue[0])] = decodeURIComponent(keyAndValue[1]);
                }

                loginWindow.close();
                deferred.resolve(oauthResult);
            }
        });

        return deferred.promise();
    };

    function restApiRequest(path, method, data, contentType) {
        return $.ajax(
			oauthResult.instance_url + '/services/data/v34.0' + path,
			{
			    method: method,
			    dataType: 'json',
			    contentType: contentType,
			    data: data,
			    headers: { 'Authorization': 'Bearer ' + oauthResult.access_token }
			}
		).error(function (error) { console.log(JSON.stringify(error)); });
    };

    function getQueryResults(query, target) {
        console.log('Executing query: ' + query);

        return restApiRequest('/query/', 'GET', { q: query })
			.then(function onQueryResults(results) {
			    console.log('query results: ' + JSON.stringify(results));

			    if (ko.isWriteableObservable(target))
			        target(results.records);

			    return results;
			});
    }

    function updateRecord(objectName, objectId, fieldValues) {
        return restApiRequest(
			'/sobjects/' + objectName + '/' + objectId,
			'PATCH',
			JSON.stringify(fieldValues),
			'application/json');
    };

    function createRecord(objectName, fieldValues) {
        return restApiRequest(
			'/sobjects/' + objectName + '/',
			'POST',
			JSON.stringify(fieldValues),
			'application/json');
    };

    function getCurrentUserId() {
        var index = oauthResult.id.lastIndexOf('/');
        return oauthResult.id.substr(index + 1);
    }

    ToDoList.Services.authenticate = authenticate;
    ToDoList.Services.getQueryResults = getQueryResults;
    ToDoList.Services.getCurrentUserId = getCurrentUserId;
    ToDoList.Services.updateRecord = updateRecord;
    ToDoList.Services.createRecord = createRecord;

})(window);