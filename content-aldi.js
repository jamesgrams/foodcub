/**
* Food Cub Content Script to run on all Aldi pages.
*/

let maxTriesProducts = 15;
let currentTriesProducts = 0;
let currentTimeout;

window.addEventListener("load", function() {
    loadBadIngredients( function() {
        newPage();
        updater();
    } );
});

/**
 * New page events.
 */
function newPage() {
    currentTriesProducts = 0;
    clearTimeout(currentTimeout);
    updateItems();
}

/**
 * Update food cub if the url changes.
 */
function updater() {
    let currentUrl = window.location.href;
    setInterval( function() {
        if( window.location.href != currentUrl || document.querySelector(".item-card a:not(.foodcub-seen)") ) {
            currentUrl = window.location.href;
            setTimeout( newPage, 2000 ); // Delay just to get rid of the old items
        }
    }, 200 );
}

/**
 * Load the item info for the page.
 */
function updateItems() {
    // we can't get scopes for elements, so we'll have to get scopes this way.
    let products = document.querySelectorAll(".item-card a:not(.foodcub-seen)");
    if( !products.length ) {
        if( currentTriesProducts < maxTriesProducts ) {
            currentTriesProducts++;
            currentTimeout = setTimeout(updateItems, 250);
        }
        return;
    }

    for( let product of products ) {
        product.classList.add("foodcub-seen");
        let href = product.getAttribute("href").replace("store","v3/containers");
        makeRequest("GET", href, {}, function(p) { return function(result) {
            
            // This is where we update the product icon if it is bad
            let isBad = false;
            let ingredients;
            try {
                ingredients = JSON.parse(result).container.modules.filter( el => el.id.startsWith("item_details_attributes") )[0].data.details.filter( el => el.header == "Ingredients")[0].body;
            }
            catch(err) {
                // there are no ingredients
            }
            if( ingredients ) {
                ingredients = ingredients.split(", ");
                isBad = ingredientsAreBad(ingredients);

                if( isBad ) {
                    try {
                        p.parentElement.setAttribute("style", "background-color: #ff000080");
                    }
                    catch(err) {/*ok*/}
                }
            }
            else {
                p.parentElement.setAttribute("style", "background-color: #ffeb0080");
            }

        } }(product) );
    }

}