// Start KnockOutJS bindings
function init() {
    ko.applyBindings(new MapViewModel)
};

function error(serviceName) {
    $('#error_modal').modal('show');
    $('.error-message').text("Couldn't load " +
        serviceName + ". " +
        "Please check your network settings.");
    $('.btn-refresh').click(function() {
        location.reload();
    });
}