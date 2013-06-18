"use strict";

function SettingsService($http) {
    var settings = $http.get('settings.json');
    this.getLanguages = function (){
        return settings.default;
    };
}

SettingsService.$inject = ['$http'];


angular.module('wikipedia-services', []).service('settings', SettingsService);