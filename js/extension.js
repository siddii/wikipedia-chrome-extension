'use strict';

function GoogleAjaxFeedService($http) {
    this.getFeed = function(url){
        return $http.jsonp('https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url), {cache: true});
    }
}
GoogleAjaxFeedService.$inject = ['$http'];

function WikipediaFeeds(GoogleAjaxFeedService, extensionURL, LocalStorageService) {
    function parseFeeds(res, baseURL) {
        var feedEntries = res.data.responseData.feed.entries;
        if (feedEntries.length > 0) {
            feedEntries.sort(function (feed1, feed2) {
                return new Date(feed1.publishedDate) > new Date(feed2.publishedDate);
            });
        }
        for (var i = 0; i < feedEntries.length; i++) {
            var feedElement = angular.element('<div>' + feedEntries[i].content + '</div>');
            feedElement.find('img').each(function (idx, imgNode) {
                imgNode.src = imgNode.src.replace('chrome-extension://', 'http://');
            });
            feedElement.find('a').each(function (idx, aNode) {
                aNode.target = "_new";
                aNode.href = aNode.href.replace('file:', 'http:');
                aNode.href = aNode.href.replace(extensionURL, baseURL);
            });
            feedEntries[i].content = feedElement.html();
        }
        return feedEntries;
    }

    this.loadFeeds = function (feedURL, baseURL) {
        var feedData = LocalStorageService.getCache(feedURL);
        if (feedData !== null) {
            return feedData;
        }
        return GoogleAjaxFeedService.getFeed(feedURL).then(function(res){
            var feedData = parseFeeds(res, baseURL);
            LocalStorageService.setCache(feedURL, feedData);
            return feedData;
        });
    };
}
WikipediaFeeds.$inject = ['GoogleAjaxFeedService', 'extensionURL', 'LocalStorageService'];

function WikipediaAppController($scope, $http, WikipediaFeeds) {
    $scope.Feeds = {};
    $scope.FeedIndex = {};
    $http.get('settings.json').success(function (settings){
        $scope.lang = settings.defaultLang;
        $scope.settings = settings[$scope.lang];
        $scope.loadFeedData('featuredArticles');
    });
    $scope.loadFeedData = function (tab){
        if (!$scope.Feeds[tab]) {
            $scope.Feeds[tab] = WikipediaFeeds.loadFeeds($scope.settings[tab].feedUrl, $scope.settings.baseUrl);
        }
    };

    $scope.showFeedIndex = function (feedIndex){
        console.log('FeedIndex = ' + feedIndex);
    }
}

WikipediaAppController.$inject = ['$scope', '$http', 'WikipediaFeeds'];

function LocalStorageService () {
    var cacheTime = 1000 * 60 * 30; //15 min

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
    }
}

var App = angular.module('Wikipedia', []);

App.service('WikipediaFeeds', WikipediaFeeds);
App.service('GoogleAjaxFeedService', GoogleAjaxFeedService);
App.service('LocalStorageService', LocalStorageService);

App.value('extensionURL', chrome.extension.getURL('/'));