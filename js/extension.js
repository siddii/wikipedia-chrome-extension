
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

function WikipediaAppController($scope, $http) {
//    $http.get('settings.json').success(function (settings){
//        $scope.lang = settings.defaultLang
//        console.log('########### WikipediaAppController $scope.lang = ', $scope.lang);
//        $scope.settings = settings[$scope.lang];
//        console.log('########### WikipediaAppController $scope.settings = ', $scope.settings);
//    });
    $scope.lang = 'en';
    $scope.settings = {
        "language": "English",
        "baseURL": "http://en.wikipedia.org/",
        "featuredArticlesFeed": {
            "title": "Featured Articles",
            "url": "http://en.wikipedia.org/w/api.php?action=featuredfeed&amp;feed=featured&amp;feedformat=atom"
        },
        "featuredPicturesFeed": {
            "title": "Featured Pictures",
            "url": "http://en.wikipedia.org/w/api.php?action=featuredfeed&amp;feed=potd&amp;feedformat=atom"
        },
        "qotdFeed": {
            "title": "Quote Of the Day",
            "url": "http://en.wikipedia.org/w/api.php?action=featuredfeed&amp;feed=onthisday&amp;feedformat=atom"
        }
    };
}
WikipediaAppController.$inject = ['$scope', '$http'];

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