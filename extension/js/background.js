function getClickHandler() {
    return function (info) {
        if (info.selectionText) {
            var searchUrl = 'http://en.wikipedia.org/w/index.php?search=' + info.selectionText;
            chrome.tabs.getAllInWindow(undefined, function (tabs) {
                for (var i = 0, tab; tab = tabs[i]; i++) {
                    if (tab.url && tab.url === searchUrl) {
                        chrome.tabs.update(tab.id, {selected: true});
                        return;
                    }
                }
                chrome.tabs.create({url: searchUrl});
            });
        }
    };
}

chrome.contextMenus.create({
    "title": "Search \"%s\" in Wikipedia",
    "type": "normal",
    "contexts": ["selection"],
    "onclick": getClickHandler()
});