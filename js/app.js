
// Custom binding for Google Maps
ko.bindingHandlers.googlemap = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        // Create the map
        var value = valueAccessor();
        var center = ko.unwrap(value.center);
        var options = {
            center: center,
            zoom: 16
        };
        var map = new google.maps.Map(element, options);
        viewModel.map = map;

        // Get restaurants within 2000 metres of the centre
        var request = {
            location: center,
            radius: '2000',
            types: ['restaurant']
        };
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, searchCallback);

        function searchCallback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                // Save the places results in the viewModel property
                viewModel.allPlaces(results);
            }
        }
    }
};

function MapViewModel() {

    //Data

    var self = this;

    self.currentInfoWindow = null;
    self.map = null;
    // place objects from Google Places service
    self.allPlaces = ko.observableArray([]);
    // place objects with additional details from other APIs
    self.placesWithDetails = ko.observableArray([]);
    // places to be shown on the UI
    self.placesShown = ko.observableArray([]);
    // The center of the map
    self.center = ko.observable(new google.maps.LatLng(1.300527, 103.902021));
    // Place currently selected
    self.currentItem = ko.observable();
    self.query = ko.observable("");

    //Operations

    // Using places information from Google Places service
    // to get more details from 3rd-party APIs and mark the places
    // on the map.
    self.getPlaceDetails = function() {
        for (var i = 0; i < self.allPlaces().length; i++) {
            var place = self.allPlaces()[i];
            self.get4SquareDetails(place);
            place.marker = self.createMarker(place);
            self.placesWithDetails.push(place);
        }

        // Initially, all places are to be shown
        self.placesShown(self.placesWithDetails());
    };

    // Create a marker on the map
    self.createMarker = function(place) {
        var location = place.geometry.location;
        var marker = new google.maps.Marker({
            position: location,
            map: self.map
        });

        // Add click listener to marker
        marker.addListener('click', function(){
            self.selectItem(place);
        });
        return marker;
    };

    // Get place details from Four Square
    self.get4SquareDetails = function(place) {
        var location = place.geometry.location;
        var latLng = location.lat() + ',' + location.lng();
        var name = place.name;
        var url = "https://api.foursquare.com/v2/venues/search?" +
            "ll=" + latLng +
            "&query=" + name +
            "&near=Singapore" +
            "&intent=checkin" +
            "&limit=1" +
            "&v=20160928" +
            "&client_id=5TAIH3KK4S33N0OIYGFJA3MSAIR2GF05ZVNFP3CYDPFWZQEI" +
            "&client_secret=5H1U14GEG1Y1EU1RGBDGUDZN52GPYVHTK0F5URCXRTHWVVHS";

        $.getJSON(url, function(data) {
            place.fourSquare = data.response.venues[0];
        }).fail(function() {
            console.log("Four Square information cannot be loaded.");
        })

    };

    // The function to be called when a place is selected on the list
    self.selectItem = function(item) {
        if (self.currentItem()) {
            // Stop current marker's animation
            setMarkerAnimation(self.currentItem().marker, null);
            // close current place's InfoWindow
            self.closeCurrentInfoWindow();
        }
        // Set the new currentItem
        self.currentItem(item);
        // Set bounce animation for new currentItem
        setMarkerAnimation(self.currentItem().marker, google.maps.Animation.BOUNCE);
        // Create or open InfoWindow for new currentItem
        self.createInfoWindow();
    };

    // Function to create infoWindow for selected place
    self.createInfoWindow = function() {

        // If infoWindow already exists, open it. Otherwise create one.
        if (self.currentItem().infoWindow) {
            self.currentItem().infoWindow.open(self.map, self.currentItem().marker);
        } else {
            var placeInfoStr = '<h5>' + self.currentItem().name + '</h5>' +
                '<p>' + self.currentItem().vicinity + '</p>';
            var fourSquareStr = "";

            if (typeof self.currentItem().fourSquare != 'undefined') {
                fourSquareStr = '<p>' +
                '<strong>Four Sqaure Popularity: </strong>' +
                self.currentItem().fourSquare.stats.checkinsCount + ' check-ins' +
                '</p>';
            }

            var contentString = '<div id="content">' +
                placeInfoStr + fourSquareStr +
                '</div>';
            var infoWindow = new google.maps.InfoWindow({
                content: contentString
            });
            infoWindow.open(self.map, self.currentItem().marker)
            self.currentItem().infoWindow = infoWindow;
        }
    };

    // The function to handle search
    self.search = function(q) {
        // Clear all markers from the map
        self.setMapOnAll(self.placesShown(), null);
        // Clear all places shown
        self.placesShown([]);

        // Add places from the search results to the places to be shown array
        for (var x in self.placesWithDetails()) {
            if (self.placesWithDetails()[x].name.toLowerCase().indexOf(q.toLowerCase()) >= 0) {
                self.placesShown.push(self.placesWithDetails()[x]);
            }
        }

        // Show markers
        self.setMapOnAll(self.placesShown(), self.map);
    };


    // Set map for markers. Used to show and hide markers on the map
    self.setMapOnAll = function(places, map) {
        for (var i = 0;  i < places.length; i++) {
            places[i].marker.setMap(map);
        }
    }

    self.closeCurrentInfoWindow = function() {
        if (self.currentItem()) {
            self.currentItem().infoWindow.close();
        }
    }

    //Subscriptions

    // When allPlaces are changed, call getPlaceDetails function
    self.allPlaces.subscribe(self.getPlaceDetails);

    // When query is changed, call search function
    self.query.subscribe(self.search);

    // Helper functions
    function setMarkerAnimation(marker, animation) {
        marker.setAnimation(animation);
    }

}
