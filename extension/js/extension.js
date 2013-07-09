'use strict';

function GoogleAjaxFeedService($http) {
    this.getFeed = function(url){
        return $http.jsonp('https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url), {cache: true});
    }
}
GoogleAjaxFeedService.$inject = ['$http'];

function WikipediaFeeds(GoogleAjaxFeedService, $http, LocalStorageService) {
    function parseFeeds(res) {
        var feedEntries = res.data.responseData.feed.entries;
        if (feedEntries.length > 0) {
            feedEntries.sort(function (feed1, feed2) {
                return new Date(feed1.publishedDate) > new Date(feed2.publishedDate);
            });
        }
        return feedEntries;
    }

    this.loadFeeds = function (tab) {
        var feedUrl = tab.feedUrl;
        var feedData = LocalStorageService.getCache(feedUrl);
        if (feedData !== null) {
            return feedData;
        }
        if (tab.feedType === 'atom') {
            return $http.get(feedUrl,
                {transformResponse: function (data){
                    console.log('data = ', data);
                    var parser = new window.DOMParser();
                    var xmlDoc = parser.parseFromString( data, "text/xml" );
                    var entries = xmlDoc.getElementsByTagName('entry');
                    var jsonResponse = [];
                    for(var i=0; i < entries.length; i++) {
                        console.log('entries[i] = ', entries[i]);
                        console.log('#######    Title = ',typeof entries[i].getElementsByTagName('title')[0]);
                        jsonResponse.push({title: entries[i].getElementsByTagName('title')[0].innerHTML,
                            link: entries[i].getElementsByTagName('link')[0].innerText,
                            content: entries[i].getElementsByTagName('summary')[0].innerHTML});
                    }
                    return jsonResponse;
                }}).success(function (response) {
                    console.log('response = ', response);
                return response;
            });
        }
        else {
            return GoogleAjaxFeedService.getFeed(feedUrl).then(function(res){
                var feedData = parseFeeds(res);
                LocalStorageService.setCache(feedUrl, feedData);
                return feedData;
            });
        }
    };
}
WikipediaFeeds.$inject = ['GoogleAjaxFeedService', '$http', 'LocalStorageService'];

var selectedTabPrefKey = 'selectedTab';

function WikipediaAppController($scope, $http, WikipediaFeeds, LocalStorageService, extensionURL, $templateCache) {

    $templateCache.put('templates/feed.html', $http.get(extensionURL + 'templates/feed.html'));

//    $http.get('http://commons.wikimedia.org/w/api.php?action=featuredfeed&feed=motd&feedformat=atom&language=en').success(function (response) {
//        console.log('response = ', response);
//        angular.element(response).find('entry');
//    });

    $scope.Feeds = {};
    $scope.FeedIndex = {};

    $scope.$watch(selectedTabPrefKey, function (newValue){
        LocalStorageService.setValue(selectedTabPrefKey, newValue);
    });

    $scope.isDropDownTab = function (tab) {
        return tab.dropdown;
    };

    $scope.isNotDropDownTab = function (tab) {
        return !tab.dropdown;
    };

    $http.get(extensionURL + 'app.json').success(function (app){
        $scope.lang = app.defaultLang;
        $scope.tabs = app[$scope.lang].tabs;
        $scope.tabs.baseUrl = app[$scope.lang].baseUrl;
        $scope.selectedTab = LocalStorageService.getValue(selectedTabPrefKey, $scope.tabs[0]);
        var tab = $scope.tabs.filter(function (tab){return tab.id === $scope.selectedTab.id;})[0];
        $scope.loadTab(tab);
    });
    $scope.loadTab = function (tab){
        $scope.selectedTab = tab;
        if (!$scope.Feeds[tab.id]) {
            $scope.Feeds[tab.id] = WikipediaFeeds.loadFeeds(tab);
        }
    };
}

WikipediaAppController.$inject = ['$scope', '$http', 'WikipediaFeeds', 'LocalStorageService', 'extensionURL', '$templateCache'];

function LocalStorageService () {
    var cacheTime = 1000 * 60 * 30; //30 min

    this.setCache = function (key, value) {
        localStorage[key] = JSON.stringify({date:new Date().getTime(), value:value});
    };

    this.getCache = function(key) {
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

App.config(function (){
    $('#search').typeahead({
        source: function (query, process) {
            return $.get('http://en.wikipedia.org/w/api.php?action=opensearch&format=json&search='+query+'&namespace=0&suggest=', function (data) {
                return process(data[1]);
            });
        }
    });
});

App.service('WikipediaFeeds', WikipediaFeeds);
App.service('GoogleAjaxFeedService', GoogleAjaxFeedService);
App.service('LocalStorageService', LocalStorageService);

App.value('extensionURL', chrome.extension.getURL('/'));