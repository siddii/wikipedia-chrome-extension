
function GoogleAjaxFeedService($http) {
    this.parseFeed = function(url){
        return $http.jsonp('https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
    }
}
GoogleAjaxFeedService.$inject = ['$http'];

function WikipediaFeeds(GoogleAjaxFeedService, extensionURL) {
    this.loadFeeds = function (feedURL, baseURL) {
        return GoogleAjaxFeedService.parseFeed(feedURL).then(function(res){
            var feedEntries=res.data.responseData.feed.entries;
            if (feedEntries.length > 0) {
                feedEntries.sort(function (feed1, feed2) {
                    return new Date(feed1.publishedDate) > new Date(feed2.publishedDate);
                });
            }
            for(var i=0; i < feedEntries.length; i++) {
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
        });
    };
}
WikipediaFeeds.$inject = ['GoogleAjaxFeedService', 'extensionURL'];

var App = angular.module('wikipedia', []);

App.service('WikipediaFeeds', WikipediaFeeds);
App.service('GoogleAjaxFeedService', GoogleAjaxFeedService);

App.value('extensionURL', chrome.extension.getURL('/'));

App.directive('wikipediafeeds', function ($timeout, $compile) {
    return  {
        restrict: 'E',
        replace: false,
        templateUrl: 'templates/feed.html',
        scope: true,
        controller: function ($scope, $element, $attrs, WikipediaFeeds, $timeout) {
            $scope.tabId = $element.parent().attr('id');
            $scope.baseURL = $attrs.baseUrl;
            $scope.feedSrc = $attrs.feedUrl;
            $scope.feeds = WikipediaFeeds.loadFeeds($scope.feedSrc, $scope.baseURL);
//            $element.find('.carousel').bind('slid', function (){
//                var $container = $('.container');
//                var $body = $('body');
//                console.log('###########    Adjusting Size');
//                $body.height($container.height() + 10);
//                $body.width($container.width() + 10);
//            });
        }
    }});
