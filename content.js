/**
* Food Cub Content Script to run on all Food Lion pages.
*/

let maxTriesScope = 30;
let maxTriesUser = 10;
let getUserTries = 0;

window.addEventListener("load", function() {
    loadBadIngredients( function() {
        // Inject the function on the page for use.
        window.addEventListener('foodCubUpdateItems', updateItems);
        var script = document.createElement("script");
        script.textContent = "var foodCubGetScopeTries = 0; var foodCubMaxTries = "+maxTriesScope+"; var foodCubGetScopes = " + foodCubGetScopes.toString() + "; foodCubGetScopes(); var foodCubUpdater = " + foodCubUpdater.toString() + "; foodCubUpdater();";
        document.body.appendChild(script);
    } );
});

/**
 * Update food cub if the url changes.
 */
function foodCubUpdater() {
    let currentUrl = window.location.href;
    setInterval( function() {
        if( window.location.href != currentUrl ) {
            currentUrl = window.location.href;
            setTimeout( function() {
                foodCubGetScopeTries = 0;
                foodCubGetScopes();
            }, 2000 ); // Delay just to get rid of the old items
        }
    }, 200 );
}

/**
 * Load the item info for the page.
 * @param {Event} event - The event from the page.
 */
function updateItems(event) {
    // we can't get scopes for elements, so we'll have to get scopes this way.
    let hrefs = JSON.parse(event.detail.items);
    let products = document.querySelectorAll(".product-cell");
    if( !products.length ) return;

    getUser( function(result) {
        let auth = result.foodCubAuth;

        // create user and set the user to the local auth variable
        let createAndSet = function( callback ) {
            createUser( function() {
                getUser( function(result) {
                    auth = result.foodCubAuth;
                    if( callback ) callback();
                } );
            }, event.detail.version );
        }

        // Get the product details
        let getProducts = function() {
            let index = 0;
            for( let product of products ) {
                let href = hrefs[index];
        
                makeRequest("GET", href, {}, function(p) { return function(result) {
                    
                    // This is where we update the product icon if it is bad
                    let isBad = false;
                    let ingredients = JSON.parse(result).ingredients;
                    if( ingredients ) {
                        ingredients = ingredients.split(", ");
                        isBad = ingredientsAreBad(ingredients);

                        if( isBad ) {
                            try {
                                p.setAttribute("style", "background-color: #ff000080");
                            }
                            catch(err) {/*ok*/}
                        }
                    }

                } }(product), function(response) {
                    // We are unauthroized so we need to create a new user
                    if (response && JSON.parse(response).status == 401) {
                        console.log("Invalid token, trying again");
                        if( getUserTries < maxTriesUser ) {
                            createAndSet( getProducts ); // try again
                            getUserTries ++
                        }
                    }
                    return; // don't try any longer.
                }, null, {
                    "authorization": auth,
                    "x-uanta-mode": "grocery",
                    "user-context": event.detail.userContext
                });
        
                //return;
                index++;
            }
        
        };

        // Depending on whether we have a token or not, potentially create and set one or not
        if( !auth ) createAndSet( getProducts );
        else getProducts();

    } );

}

/**
 * Get the user.
 * @param {Function} [callback] - The callback function. 
 */
function getUser( callback ) {
    chrome.storage.local.get(["foodCubAuth"], callback);
}

/**
 * Create the Food Lion user.
 * @param {Function} [callback] - The callback function.
 * @param {string} version - The food lion API version.
 */
function createUser( callback, version ) {
    // create the user session
    makeRequest("POST", "/api/v2/user_sessions", {
        "binary": "web-ecom",
        "binary_version": version,
        "is_retina": false,
        "os_version": navigator.platform,
        "pixel_density": window.devicePixelRatio.toPrecision(2),
        "push_token": "",
        "screen_height": screen.height,
        "screen_width": screen.width
    }, function(data) {
        let authInfo = JSON.parse(data);

        let auth = "Bearer " + authInfo.session_token;
        // create the user
        makeRequest("POST", "/api/v2/users", {}, function() {
            chrome.storage.local.set({"foodCubAuth": auth}, callback);
        }, null, null, {
            "authorization": auth
        }); 
    });
}

/**
 * Get all the angular scopes.
 * This is injected into the page to have access to the angular element.
 */
function foodCubGetScopes() {
    var scopes = [];

    function visit(scope) {
        scopes.push(scope);
    }
    function traverse(scope) {
        visit(scope);
        if (scope.$$nextSibling)
            traverse(scope.$$nextSibling);
        if (scope.$$childHead)
            traverse(scope.$$childHead);
    }

    let injector = angular.element(document.body).injector();
    if( !injector ) {
        if( foodCubGetScopeTries < foodCubMaxTries ) {
            foodCubGetScopeTries++;
            setTimeout( foodCubGetScopes, 250 );
        }
        return;
    }

    traverse(injector.get('$rootScope'));
    let items = scopes.filter( el => el.item || (el.placement && el.placement.product) ).map( el => ( el.item ? el.item.href : "/api/v2" + el.placement.product.href) );
    items = [...new Set(items)];
    
    if( !items.length ) {
        if( foodCubGetScopeTries < foodCubMaxTries ) {
            foodCubGetScopeTries++;
            setTimeout( foodCubGetScopes, 250 );
        }
        return;
    }

    let authScope = scopes.filter( el => el.auth )[0].auth;
    let userContext = btoa( JSON.stringify({"StoreId": authScope.user.store.id, "FulfillmentType": authScope.getContext().intent}) );

    window.dispatchEvent( new CustomEvent('foodCubUpdateItems', { detail: {items: JSON.stringify(items), version: angular.element(document.body).injector().get("$rootScope").config.version, userContext: userContext} }) );
}