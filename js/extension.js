
function WikipediaExtensionController($scope, $http) {
    $http.get('settings.json').success(function (settings) {
        console.log('settings = ', settings);
        $scope.settings = settings;

        if ($scope.settings.featuredFeed) {
            $http.get($scope.settings.featuredFeed).success(function (featuredFeeds) {
                console.log('Featured Feeds = ', featuredFeeds);
            });
        }
    })
}
WikipediaExtensionController.$inject = ['$scope', '$http'];

angular.module('wikipedia', [], function (){
    console.log('Wikipedia module initialised');
});