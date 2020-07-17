let badIngredients = [];
let okContainingIngredients = [];

/**
 * Make a request.
 * @param {string} type - "GET" or "POST".
 * @param {string} url - The url to make the request to.
 * @param {object} parameters - An object with keys being parameter keys and values being parameter values to send with the request.
 * @param {function} callback - Callback function to run upon request completion.
 * @param {boolean} useFormData - True if we should use form data instead of json.
 * @param {object} headers - Headers to add
 */
function makeRequest(type, url, parameters, callback, errorCallback, useFormData, headers) {
    var parameterKeys = Object.keys(parameters);

    //url = "http://" + window.location.hostname + url;
    if( (type == "GET" || type == "DELETE") && parameterKeys.length ) {
        var parameterArray = [];
        for( var i=0; i<parameterKeys.length; i++ ) {
            parameterArray.push( parameterKeys[i] + "=" + parameters[parameterKeys[i]] );
        }
        url = url + (url.match(/\?/) ? "&" : "?") + parameterArray.join("&");
    }
   
    var xhttp = new XMLHttpRequest();
    xhttp.open(type, url, true);

    if( (type != "GET" && type != "DELETE") && parameterKeys.length ) {
        if( !useFormData ) {
            xhttp.setRequestHeader("Content-type", "application/json");
        }
    }

    if( headers ) {
        for( let header in headers ) {
            xhttp.setRequestHeader(header, headers[header]);
        }
    }

    xhttp.onreadystatechange = function() {
        if( this.readyState == 4 ) {
            if( this.status == 200 || this.status == 201 ) {
                if( callback ) { callback(this.responseText); }
            }
            else {
                if( errorCallback ) { errorCallback(this.responseText); }
            }
        }
    }    
    if( (type != "GET" && type != "DELETE") && Object.keys(parameters).length ) {
        var sendParameters;
        if( useFormData ) {
            sendParameters = new FormData();
            for ( var key in parameters ) {
                sendParameters.append(key, parameters[key]);
            }
        }
        else {
            sendParameters = JSON.stringify(parameters);
        }
        xhttp.send( sendParameters );
    }
    else {
        xhttp.send();
    }
}

/**
 * Load bad ingredients.
 * @param {Function} callback - The callback to run once finished.
 */
function loadBadIngredients( callback ) {
    chrome.storage.local.get(["foodCubBadList"], function(result) {
        if( result && result.foodCubBadList ) {
            badIngredients = result.foodCubBadList.split("\n");
            okContainingIngredients = badIngredients.filter(el => el.match(/^\^/)).map(el => el.substring(1));
            badIngredients = badIngredients.filter(el => el.match(/^[^\^]/));
        }
        if( callback ) callback();
    });
}

/**
 * Determine if ingredients are bad.
 * @param {Array<string>} ingredients - A list of ingredients to check against.
 * @returns {boolean} True if the ingredients are bad, false if not.
 */
function ingredientsAreBad( ingredients ) {
    for( let ingredient of ingredients ) {
        for( let badIngredient of badIngredients ) {
            if( ingredient.toLowerCase().indexOf( badIngredient.toLowerCase() ) != -1 ) {
                isBad = true;
                for( let okContainingIngredient of okContainingIngredients ) {
                    // If there is an OK containing ingredient that contains the bad ingredient and the ingredient contains it (e.g. say we allow almondmilk but not milk), then that is ok
                    if( okContainingIngredient.toLowerCase().indexOf(badIngredient.toLowerCase()) != -1 && ingredient.toLowerCase().indexOf( okContainingIngredient.toLowerCase() ) != -1 ) isBad = false;
                }
                if( isBad ) return true;
            }
        }
    }
    return false;
}