
function WikipediaExtensionController($scope, $http, Feed) {
//    $http.get('settings.json').success(function (settings) {
//        console.log('settings = ', settings);
//        $scope.settings = settings;
//
//        if ($scope.settings.featuredFeed) {
//            $http.get($scope.settings.featuredFeed).success(function (featuredFeeds) {
//                console.log('Featured Feeds = ', featuredFeeds.feed);
//            });
//        }
//    });

    var extensionURL = chrome.extension.getURL('/');

    $scope.loadFeed=function(){
        Feed.parseFeed($scope.feedSrc).then(function(res){
            $scope.feeds=res.data.responseData.feed.entries;
            if ($scope.feeds.length > 0) {
                $scope.feeds.sort(function (feed1, feed2) {
                  return new Date(feed1.publishedDate) > new Date(feed2.publishedDate);
                });
            }
            for(var i=0; i < $scope.feeds.length; i++) {
                var feedElement = angular.element('<div>' + $scope.feeds[i].content + '</div>');
                feedElement.find('img').each(function (idx, imgNode) {
                    imgNode.src = imgNode.src.replace('chrome-extension://', 'http://');
                });
                feedElement.find('a').each(function (idx, aNode) {
                    aNode.target = "_new";
                    aNode.href = aNode.href.replace('file:', 'http:');
                    aNode.href = aNode.href.replace(extensionURL, 'http://en.wikipedia.org/');
                });
                $scope.feeds[i].content = feedElement.html();
                console.log('######### $scope.feeds[i].content = ', $scope.feeds[i].content);
            }
        });
    };

    $scope.feedSrc = 'http://en.wikipedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=atom';
    $scope.loadFeed();

    $('#feed-carousel').bind('slide', function (){

    });
}
WikipediaExtensionController.$inject = ['$scope', '$http', 'FeedService'];

var App = angular.module('wikipedia', [], function (){
    console.log('Wikipedia module initialised');
});


App.factory('FeedService',['$http',function($http){
    return {
        parseFeed : function(url){
            return $http.jsonp('https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
        }
    }
}]);