
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

    $scope.loadFeed=function(){
        Feed.parseFeed($scope.feedSrc).then(function(res){
            $scope.feeds=res.data.responseData.feed.entries;
            for(var i=0; i < $scope.feeds.length; i++) {
                var feedElement = angular.element($scope.feeds[i].content);
                feedElement.find('img').each(function (idx, imgNode) {
                    imgNode.src = imgNode.src.replace('chrome-extension:', 'http:');
                });
                feedElement.find('a').each(function (idx, aNode) {
                    aNode.target = "_new";
                    aNode.href = aNode.href.replace('file:', 'http:');
                });
                $scope.feeds[i].content = feedElement.html();
            }
        });
    };

    $scope.feedSrc = 'http://en.wikipedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=atom';
    $scope.loadFeed();
}
WikipediaExtensionController.$inject = ['$scope', '$http', 'FeedService'];

var App = angular.module('wikipedia', ["ngSanitize"], function (){
    console.log('Wikipedia module initialised');
});


App.factory('FeedService',['$http',function($http){
    return {
        parseFeed : function(url){
            return $http.jsonp('https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
        }
    }
}]);