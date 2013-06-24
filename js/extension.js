
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


function WikipediaExtensionController($scope, WikipediaFeeds) {
    $scope.baseURL = 'http://en.wikipedia.org/';
    $scope.feedSrc = 'http://en.wikipedia.org/w/api.php?action=featuredfeed&feed=potd&feedformat=atom';
    console.log('$scope.baseURL= ', $scope.baseURL, '$scope.feedSrc = ', $scope.feedSrc);
    $scope.feeds = WikipediaFeeds.loadFeeds($scope.feedSrc, $scope.baseURL);
}

WikipediaExtensionController.$inject = ['$scope', 'WikipediaFeeds'];

var App = angular.module('wikipedia', [], function (){
    console.log('Wikipedia module initialised');
});

App.service('WikipediaFeeds', WikipediaFeeds);
App.service('GoogleAjaxFeedService', GoogleAjaxFeedService);

App.value('extensionURL', chrome.extension.getURL('/'));

