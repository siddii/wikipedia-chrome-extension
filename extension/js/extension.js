'use strict';

function AtomFeedParser($window) {
    function getElementValue(entry, tagName) {
        for (var i = 0; i < entry.childNodes.length; i++) {
            if (entry.childNodes[i].tagName === tagName && tagName === 'link') {
                return entry.childNodes[i].attributes['href'].textContent;
            }
            else if (entry.childNodes[i].tagName === tagName) {
                return entry.childNodes[i].textContent;
            }
        }
        return '';
    }

    this.toJSON = function (data) {
        var parser = new $window.DOMParser();
        var xmlDoc = parser.parseFromString(data, "text/xml");
        var entries = xmlDoc.getElementsByTagName('entry');
        var feeds = [];
        for (var i = 0; i < entries.length; i++) {
            feeds.push({title: getElementValue(entries[i], 'title'),
                link: getElementValue(entries[i], 'link'),
                content: getElementValue(entries[i], 'summary')});
        }
        return feeds;
    };
}

AtomFeedParser.$inject = ['$window'];

function WikipediaFeeds($http, LocalStorageService, AtomFeedParser) {
    this.loadFeeds = function (tab) {
        var feedUrl = tab.feedUrl ? tab.feedUrl : tab.pageUrl;
        var feedData = LocalStorageService.getCache(feedUrl);
        if (feedData !== null) {
            return feedData;
        }
        if (tab.feedUrl) {
            return $http.get(feedUrl,
                {
                    transformResponse: function (response) {
                        return tab.feedUrl ? AtomFeedParser.toJSON(response) : response;
                    }
                }).then(function (response) {
                    LocalStorageService.setCache(feedUrl, response.data);
                    return response.data;
                });
        }
        else {
            return  $http.get(feedUrl).then(function (response) {
                    if (tab.preRenderFn) {
                        new Function("response", tab.preRenderFn)(response);
                    }
                    return [{feed: {content: response.data}}];
            });
        }

    };
}
WikipediaFeeds.$inject = ['$http', 'LocalStorageService', 'AtomFeedParser'];

var selectedTabPrefKey = 'selectedTab';

function WikipediaAppController($scope, $http, WikipediaFeeds, LocalStorageService, extensionURL, $templateCache) {

    $templateCache.put('templates/feed.html', $http.get(extensionURL + 'templates/feed.html'));
    $templateCache.put('templates/page.html', $http.get(extensionURL + 'templates/page.html'));

    $scope.Feeds = {};
    $scope.FeedIndex = {};

    $scope.$watch(selectedTabPrefKey, function (newValue) {
        LocalStorageService.setValue(selectedTabPrefKey, newValue);
    });

    $scope.feedType = function(tab) {
        var feedType = tab.feedUrl ? 'feed' : 'page';
        return  feedType;
    };

    $scope.isDropDownTab = function (tab) {
        return tab.dropdown;
    };

    $scope.isNotDropDownTab = function (tab) {
        return !tab.dropdown;
    };

    $scope.getTabsForDropdown = function (dropdown) {
      var tabs = [];
      for(var i=0; i < $scope.tabs.length; i++) {
          if ($scope.tabs[i].dropdown === dropdown) {
              tabs.push($scope.tabs[i]);
          }
      }
      return tabs;
    };

    $http.get(extensionURL + 'app.json').success(function (app) {
        $scope.lang = app.defaultLang;
        $scope.tabs = app[$scope.lang].tabs;
        $scope.dropdowns = [];
        $scope.tabs.filter(function (element){
            if (element.dropdown && $scope.dropdowns.indexOf(element.dropdown) === -1) {
                $scope.dropdowns.push(element.dropdown);
            }
        });


        $scope.baseUrl = app[$scope.lang].baseUrl;
        $scope.selectedTab = LocalStorageService.getValue(selectedTabPrefKey, $scope.tabs[0]);
        var tab = $scope.tabs.filter(function (tab) {
            return tab.id === $scope.selectedTab.id;
        })[0];
        $scope.loadTab(tab);
    });
    $scope.loadTab = function (tab) {
        $scope.selectedTab = tab;
        if (!$scope.Feeds[tab.id]) {
            $scope.Feeds[tab.id] = WikipediaFeeds.loadFeeds(tab);
        }
    };
}

WikipediaAppController.$inject = ['$scope', '$http', 'WikipediaFeeds', 'LocalStorageService', 'extensionURL', '$templateCache'];

function LocalStorageService() {
    var cacheTime = 1000 * 60 * 30; //30 min

    this.setCache = function (key, value) {
        localStorage[key] = JSON.stringify({date: new Date().getTime(), value: value});
    };

    this.getCache = function (key) {
        if (key in localStorage) {
            var object = JSON.parse(localStorage[key]);
            if ((new Date().getTime() - object.date) < cacheTime) {
                return object.value;
            }
        }
        return null;
    };

    this.setValue = function (key, value) {
        if (value) {
            localStorage[key] = JSON.stringify(value);
        }
    };

    this.getValue = function (key, defaultValue) {
        return (localStorage[key] !== undefined) ? JSON.parse(localStorage[key]) : defaultValue;
    }
}

var App = angular.module('Wikipedia', []);

App.config(function () {
    $('#search').typeahead({
        source: function (query, process) {
            return $.get('http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=' + query + '&namespace=0&suggest=', function (data) {
                return process(data[1]);
            });
        }
    });
});

App.service('WikipediaFeeds', WikipediaFeeds);
App.service('LocalStorageService', LocalStorageService);
App.service('AtomFeedParser', AtomFeedParser);
App.directive('feedsTab', function($timeout){
    return {
        link: function(scope, element, attrs){
            if (scope.tab.postRenderFn) {
                var postRenderFunc = new Function("scope", "element", "attrs", scope.tab.postRenderFn);
                $timeout(function (){
                    postRenderFunc(scope, element, attrs);
                }, 0);
            }
        }
    }
});

App.value('extensionURL', chrome.extension.getURL('/'));