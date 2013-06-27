
function GoogleAjaxFeedService($http) {
    this.getFeed = function(url){
        return $http.jsonp('https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url), {cache: true});
    }
}
GoogleAjaxFeedService.$inject = ['$http'];

function WikipediaFeeds(GoogleAjaxFeedService, extensionURL) {
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
        console.log("############# Loading Feeds = ", feedURL, baseURL);
        return GoogleAjaxFeedService.getFeed(feedURL).then(function(res){
            return parseFeeds(res, baseURL);
        });
    };
}
WikipediaFeeds.$inject = ['GoogleAjaxFeedService', 'extensionURL'];

function WikipediaAppController($scope, WikipediaFeeds, $http) {
    $scope.Feeds = {};
    $http.get('settings.json').success(function (settings){
        $scope.lang = settings.defaultLang
        $scope.settings = settings[$scope.lang];
    });
    $scope.loadFeedData = function (tab){
        $scope.Feeds[tab] = WikipediaFeeds.loadFeeds($scope.settings[tab].feedUrl, $scope.settings.baseUrl);
    }
}
WikipediaAppController.$inject = ['$scope', 'WikipediaFeeds', '$http'];

var App = angular.module('wikipedia', []);

App.service('WikipediaFeeds', WikipediaFeeds);
App.service('GoogleAjaxFeedService', GoogleAjaxFeedService);

App.value('extensionURL', chrome.extension.getURL('/'));


App.directive('wikipediafeeds', function ($timeout, $compile) {
    return  {
        restrict: 'E',
        replace: false,
        templateUrl: 'templates/feed.html',
        scope: {baseURL:'=baseUrl', feedURL:'=feedUrl'},
        controller: ['$scope', '$element', 'WikipediaFeeds', function($scope, $element, WikipediaFeeds) {
            console.log("Controller Instantiation", $scope.feedURL);
            $scope.tabId = $element.parent().attr('id');
            console.log('######### $scope= ', $scope.feedURL);
            $scope.feeds = WikipediaFeeds.loadFeeds($scope.feedURL, $scope.baseURL);
        }],
        link: function($scope, $element, $attrs) {
            console.log("###### Link ", $scope.feedURL)
        }
    }});