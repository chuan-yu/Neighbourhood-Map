'use strict';
var map;
var center;
// Start KnockOutJS bindings
function init() {
    center = new google.maps.LatLng(1.300527, 103.902021);
    var options = {
        center: center,
        zoom: 16
    };
    map = new google.maps.Map(document.getElementById('map'), options);
    ko.applyBindings(new MapViewModel);
}

function googleError() {
    // In case of error, apply bindings anyway
    // Errors are handled in the View Model
    ko.applyBindings(new MapViewModel);
}