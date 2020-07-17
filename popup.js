window.addEventListener("load", function() {
    chrome.storage.local.get(["foodCubBadList"], function(result) {
        if( result.foodCubBadList ) document.querySelector("textarea").value = result.foodCubBadList;
    });

    var setting = false;
    document.querySelector("textarea").oninput = function(e) {
        if( !setting ) {
            setting = true;
            chrome.storage.local.set({"foodCubBadList": this.value}, function() {
                setting = false;
            });
        }
    }
    document.querySelector("textarea").onkeydown = function(e) {
        if( setting )  {
            e.preventDefault();
            return false;
        }
    }
});