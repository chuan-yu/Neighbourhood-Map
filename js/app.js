'use strict';
ko.bindingHandlers.modal = {
    update: function(element, valueAccessor) {
        var errorMessage = ko.unwrap(valueAccessor());
        if (errorMessage) {
             $(element).modal('show');
         } else {
            $(element).modal('hide');
         }

    }
};

function MapViewModel() {
    //Data

    var self = this;

    self.currentInfoWindow = null;
    // place objects from Google Places service
    self.allPlaces = ko.observableArray([]);
    // places to be shown on the UI
    self.placesShown = ko.observableArray([]);
    // Place currently selected
    self.currentItem = ko.observable();
    self.query = ko.observable('');
    self.infoWindow = new google.maps.InfoWindow();
    self.hasError = ko.observable(false);
    self.errorMessage = ko.observable('');
    // place objects with additional details from other APIs
    self.placesWithDetails = ko.computed(function(){
        var placesWithDetails = [];
        for (var i = 0; i < self.allPlaces().length; i++) {
            var place = self.allPlaces()[i];
            self.get4SquareDetails(place);
            place.marker = self.createMarker(place);
            placesWithDetails.push(place);
        }
        self.placesShown(placesWithDetails);
        return placesWithDetails;
    }, this);


    //Operations

    // Initialize the app
    self.init = function() {
        self.getPlaces();
        self.addInfoWindowListener();
    };

    // Get places using Google Places service
    self.getPlaces = function() {
        // Get restaurants within 2000 metres of the centre
        var request = {
            location: center,
            radius: '2000',
            types: ['food']
        };
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch(request, searchCallback);

        function searchCallback(results, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                // Save the places results in the viewModel property
                self.allPlaces(results);
            } else {
                self.errorMessage('Google Places service is not available. '+
                    'You may not be able to see locations.');
            }
        }
    };

    // Using places information from Google Places service
    // to get more details from 3rd-party APIs and mark the places
    // on the map.
    self.getPlaceDetails = function() {
        self.allPlaces().forEach(function(place){
            self.get4SquareDetails(place);
            place.marker = self.createMarker(place);
            self.placesWithDetails.push(place);
        });

        //Initially, all places are to be shown
        self.placesShown(self.placesWithDetails());
    };

    // Create a marker on the map
    self.createMarker = function(place) {
        var location = place.geometry.location;
        var marker = new google.maps.Marker({
            position: location,
            map: map
        });

        // Add click listener to marker
        marker.addListener('click', function(){
            self.selectItem(place);
            map.panTo(this.getPosition());
        });
        return marker;
    };

    // Get place details from Four Square
    self.get4SquareDetails = function(place) {
        var location = place.geometry.location;
        var latLng = location.lat() + ',' + location.lng();
        var name = place.name;
        var url = 'https://api.foursquare.com/v2/venues/search?' +
            'll=' + latLng +
            '&query=' + name +
            '&near=Singapore' +
            '&intent=checkin' +
            '&limit=1' +
            '&v=20160928' +
            '&client_id=5TAIH3KK4S33N0OIYGFJA3MSAIR2GF05ZVNFP3CYDPFWZQEI' +
            '&client_secret=5H1U14GEG1Y1EU1RGBDGUDZN52GPYVHTK0F5URCXRTHWVVHS';

        $.getJSON(url, function(data) {
            place.fourSquare = data.response.venues[0];
        }).fail(function() {
            self.errorMessage('Four Square is not reachable. ' +
                'You may not be able to see Four Square Popularity');
        });

    };

    // The function to be called when a place is selected on the list
    self.selectItem = function(item) {
        if (self.currentItem()) {
            // Stop current marker's animation
            setMarkerAnimation(self.currentItem().marker, null);
            // close current place's InfoWindow
            self.infoWindow.close();
        }
        // Set the new currentItem
        self.currentItem(item);
        // Set bounce animation for new currentItem
        setMarkerAnimation(self.currentItem().marker, google.maps.Animation.BOUNCE);
        // Create or open InfoWindow for new currentItem
        self.openInfoWindow();
    };

    // Function to open infoWindow for selected place
    self.openInfoWindow = function() {
            var placeInfoStr = '<h5>' + self.currentItem().name + '</h5>' +
                '<p>' + self.currentItem().vicinity + '</p>';
            var fourSquareStr = '';

            if (typeof self.currentItem().fourSquare != 'undefined') {
                fourSquareStr = '<p>' +
                '<strong>Four Sqaure Popularity: </strong>' +
                self.currentItem().fourSquare.stats.checkinsCount + ' check-ins' +
                '</p>';
            } else {
                fourSquareStr = '<p>' +
                '<strong>Four Sqaure Popularity: </strong>' +
                'Popularity data not available' +
                '</p>';
            }

            var contentString = '<div id="content">' +
                placeInfoStr + fourSquareStr +
                '</div>';

            self.infoWindow.setContent(contentString);
            self.infoWindow.open(map, self.currentItem().marker);
    };

    self.addInfoWindowListener = function() {
        google.maps.event.addListener(self.infoWindow, 'closeclick', function(){
            setMarkerAnimation(self.currentItem().marker, null);
        })
    };


    // The function to handle search
    self.search = function() {
        // Clear all markers from the map
        self.setMarkerVisibility(self.placesShown(), false);
        // Close opened InfoWindow
        self.infoWindow.close();
        // Clear all places shown
        self.placesShown([]);

        // Add places from the search results to the places to be shown array
        for (var x in self.placesWithDetails()) {
            if (self.placesWithDetails()[x].name.toLowerCase().indexOf(self.query().toLowerCase()) >= 0) {
                self.placesShown.push(self.placesWithDetails()[x]);
            }
        }

        //Show markers
        self.setMarkerVisibility(self.placesShown(), true);
    };


    // Set map for markers. Used to show and hide markers on the map
    self.setMarkerVisibility = function(places, isVisible) {
        for (var i = 0;  i < places.length; i++) {
            places[i].marker.setVisible(isVisible);
        }
    };

    // Function to refresh the page
    self.reload = function() {
        location.reload();
    };

    //Subscriptions

    // When query is changed, call search function
    self.query.subscribe(self.search);

    // Helper functions
    function setMarkerAnimation(marker, animation) {
        marker.setAnimation(animation);
    }


    self.init();

}