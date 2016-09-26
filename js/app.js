
// Custom binding for Google Maps
ko.bindingHandlers.googlemap = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();
        var center = ko.unwrap(value.center);
        var options = {
            center: center,
            zoom: 16
        };
        var map = new google.maps.Map(element, options);
        viewModel.map = map;
        var request = {
            location: center,
            radius: '2000',
            types: ['restaurant']
        };

        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, searchCallback);

        function searchCallback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                var placeMarkers = createPlaceMarkers(results, map);
                viewModel.placeMarkers(placeMarkers);
            }
        }
    }
};

function createPlaceMarkers(places, map) {
    var placeMarkers = [];
    for (var i = 0; i < places.length; i++) {
        var location = places[i].geometry.location;
        var marker = new google.maps.Marker({
            position: location,
            map: map
        });
        placeMarkers.push([places[i], marker]);
    }
    return placeMarkers;
}

function createInfoWindow(placeMarker, map) {
    var place = placeMarker()[0];
    var marker = placeMarker()[1];

    console.log(place.name);

    var contentString = '<div id="content">' +
        '<div id="siteNotice">' +
        '<h5>' + place.name + '</h5>' +
        '<p>' + place.vicinity + '</h5>' +
        '</div>' +
        '</div>';

    var infoWindow = new google.maps.InfoWindow({
        content: contentString
    });

    infoWindow.open(map, marker);

    return infoWindow;
}

function MapViewModel() {
    var self = this;
    var currentInfoWindow = null;

    self.map = null;
    self.placeMarkers = ko.observableArray([]);
    self.center = ko.observable(new google.maps.LatLng(1.300527, 103.902021));
    self.currentItem = ko.observable();


    self.selectItem = function(item) {
        if (currentInfoWindow) {
            currentInfoWindow.close();
        }
        self.currentItem(item);
        currentInfoWindow = createInfoWindow(self.currentItem, self.map);
        console.log(item[0]);
        console.log(item[1]);
    };
}