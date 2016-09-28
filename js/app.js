
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
                viewModel.allPlaces(results);
            }
        }
    }
};

function clearMarkers(placeMarkers) {
    var placeMarkers = placeMarkers();
    for (var i = 0; i < placeMarkers.length; i++) {
        placeMarkers[i][1].setMap(null);
    }
}

function MapViewModel() {

    //Data

    var self = this;
    self.currentInfoWindow = null;

    self.map = null;
    self.allPlaces = ko.observableArray([]);
    self.placeMarkers = ko.observableArray([]);
    self.center = ko.observable(new google.maps.LatLng(1.300527, 103.902021));
    self.currentItem = ko.observableArray([]);
    self.query = ko.observable("");
    self.current4Square = ko.observable();

    //Operations

    self.selectItem = function(item) {
        if (self.currentInfoWindow) {
            self.currentInfoWindow.close();
        }
        self.currentItem(item);
        //console.log(self.currentItem());
        self.createInfoWindow(self.currentItem);
        //self.fourSquareSearch(self.currentItem()[0]);
    };

    self.createPlaceMarkers = function(places){
        var places = ko.unwrap(places);
        clearMarkers(self.placeMarkers);
        self.placeMarkers.removeAll();
        for (var i = 0; i < places.length; i++) {
            var location = places[i].geometry.location;
            var marker = new google.maps.Marker({
                position: location,
                map: self.map
            });
            self.placeMarkers.push([places[i], marker]);
        }
    };

    self.createInfoWindow = function(placeMarker) {
        var place = placeMarker()[0];
        var marker = placeMarker()[1];
        var contentString = '<div id="content">' +
            '<div id="siteNotice">' +
            '<h5>' + place.name + '</h5>' +
            '<p>' + place.vicinity + '</h5>' +
            '<p id="foursquare" data-bind="text: $root.current4Square"></p>'
            '</div>' +
            '</div>';

        // self.currentInfoWindow = new google.maps.InfoWindow();
        self.currentInfoWindow = new google.maps.InfoWindow({
            content: contentString
        });

        //self.currentInfoWindow.setContent(document.getElementById('info-window-container'));

        self.currentInfoWindow.open(self.map, marker);
    };

    self.search = function(q) {
        var allPlaces = self.allPlaces();
        var places = [];
        for (var x in allPlaces) {
            if (allPlaces[x].name.toLowerCase().indexOf(q.toLowerCase()) >= 0) {
                places.push(allPlaces[x]);
            }
        }
        console.log(places);
        self.createPlaceMarkers(places);
    };

    self.fourSquareSearch = function(place) {
        var location = place.geometry.location;
        var latLng = location.lat() + ',' + location.lng();
        var name = place.name;
        var url = "https://api.foursquare.com/v2/venues/search?" +
            "ll=" + latLng +
            "&name=" + name +
            "&near=Singapore" +
            "&intent=match" +
            "&v=20160928" +
            "&client_id=5TAIH3KK4S33N0OIYGFJA3MSAIR2GF05ZVNFP3CYDPFWZQEI" +
            "&client_secret=5H1U14GEG1Y1EU1RGBDGUDZN52GPYVHTK0F5URCXRTHWVVHS";
        console.log(url);

        $.getJSON(url, function(data) {
            self.current4Square(data.response.venues[0].stats.checkinsCount);
            console.log(self.current4Square())
        })

    };

    //Subscriptions
    self.allPlaces.subscribe(self.createPlaceMarkers);
    self.query.subscribe(self.search);
}
