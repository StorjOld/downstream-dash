$(function() {

    var farmers = [],
        markers = [],
        countryLegend = {},
        rotation;

    var currentInfo = $('#side-menu ul'),
        body = $('body');

    var earth = new WE.map('earth_div', {
        sky: true,
        atmosphere: true
    });


    // This line adds support for MapQuest Aerial tiles
    WE.tileLayer('http://otile2.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg', {
        attribution: 'Tiles Courtesy of MapQuest.'
    }).addTo(earth);


    // Start a rotation animation
    rotation = setInterval(function() {
        var c = earth.getPosition();
        if (c[0] && c[1]) {
            earth.setCenter([c[0], c[1] + 0.1]);
        }
    }, 30);


    // Opening and closing the side menu
    $('#open-side-menu').on('click', function() {
        body.toggleClass('open');
    });


    // This function sends an ajax get request to /online,
    // fetches a list of farmers and coordinates
    // then renders the globe.
    var getData = function() {
        $.ajax({
            url: 'http://verify.driveshare.org/api/downstream/status/list/by/d/uptime',
            success: function(data) {
                farmers = data.farmers.filter(function(farmer) {
                	return farmer.uptime > 0;
                });
                generateLegend(farmers);
                render();
            }
        });
    }

    // Fetch data for the globe once initially, 
    // and then every 5 seconds.
    getData();
    setInterval(getData, 5000);

    // This function returns a random hex color.
    var randomColor = function() {
        return '#' + (Math.random().toString(16) + '0000000').slice(2, 8);
    }

    // Maps all the countries of farmers to a randomly defined color.
    var generateLegend = function(farmers) {
        var country, j;
        for (j = 0; j < farmers.length; j++) {
            country = farmers[j].location.country;
            if (!countryLegend.hasOwnProperty(country)) {
                countryLegend[country] = randomColor();
            }
        }
    }

    // This function handles everything related to updating the HTML
    // with the returned data from the AJAX call:
    var render = function() {
        var entry;
        if (!farmers.length) {

            // If there isn't anybody online
            // Show an appropriate message and empty the summary and the list section
            currentInfo.empty();
            $('#no-members').show();
            $('.summary').html('');

        } else {
            // If there are people online:
            // On every call clear the side-menu list and globe markers and fill them up with new info.
            currentInfo.empty();
            $('#no-members').hide();
            for (var i = 0; i < Math.min(10, farmers.length); i++) {
                // Populate the side-menu with the farmers, ranked by uptime.
                currentInfo.append($('<li id="farmer' + (i + 1) + '" class="entry ' + (!farmers[i].online ? "offline": "") + '"></li>'));
                entry = $('#farmer' + (i + 1));
                entry.append($('<span class="color-effect"></span>').css('background-color', countryLegend[farmers[i].location.country]));
                entry.append($('<div class="farmerId">' + farmers[i].address + '</div>'));
                entry.append($('<span class="count">' + Math.round(farmers[i].uptime) + '%</span>'));

            }

            // Summary information
            $('.summary').html(farmers.length + ' farmers <span>/</span> ' + Object.keys(countryLegend).length + ' countries');
        }


        // Calculate number of side-menu entries depending on screen size.
        showEntries();
        $(window).resize(showEntries);


        // Adding the markers to the globe.

        // First remove all existing markers from the globe and clear the array they are stored in.
        markers.forEach(function(b) {
            earth.removeMarker(b);
        });
        markers = [];


        // For each ip location create a new marker
        farmers.forEach(function(a) {
        	var country = a.location.country;
        	var city = a.location.city;
        	var state = a.location.state;
        	var numContracts = a.contracts;
        	var heartbeats = a.heartbeats;
        	var testFileSize = a.size;
            
            markers.push(WE.marker([a.location.lat, a.location.lon]).addTo(earth).bindPopup('This farmer from <strong>' + (city ? city : country) + '</strong>' + (state ? ', <strong>' + state + '</strong>' : '') + ' has <strong>' + numContracts + '</strong> contract(s) and passed <strong>' + heartbeats + '</strong> heartbeats with ' + testFileSize + '-byte test files.', {
                maxWidth: 150,
                maxHeight: 100,
                closeButton: true
            }));

            // Color the markers depending on the country they are in.
            $(markers[markers.length - 1].element.firstChild).css('background', countryLegend[a.location.country]);
        });


        // Rotate the globe to the desired farmer from the list
        $('.entry').on('click', function() {
            if ($(window).width() < 800) {
                body.removeClass('open');
            }
            clearInterval(rotation);
            var index = $(this).attr('id').split('farmer')[1] - 1;
            earth.panTo([farmers[index].location.lat, farmers[index].location.lon]);
        });

    }


    $('#earth_div').on('click touchstart touchend', function() {
        // Stop the rotation when the earth is clicked or touched
        clearInterval(rotation);

        // If the screen is small close the side menu as well.
        if ($(window).width() < 800) {
            body.removeClass('open');
        }
    });


    // Shows only a part of the entries depending on the screen size
    var showEntries = function() {
        var screenHeight = $(window).height(),
            sideMenuEntriesSpace = screenHeight - 250, // Exclude the title and the summary height
            numberOfEntries = Math.round(sideMenuEntriesSpace / 55); // 55 is the height of an entry in pixels

        // The list of countries on the sidebar
        var countries = $('#side-menu .entry');

        // Hide all countries
        countries.hide();

        // Show only as many countries as would fit on the window
        countries.slice(0, numberOfEntries).show();
    }


    // Open the side menu on start up if the app is running on a big screen.
    if ($(window).width() > 800) {
        body.addClass('open');
    } else {
        earth.setZoom(1.8);
    }

});
