$(function() {

    var farmers = [],
        markers = [],
        countries = {},
        farmerLegend = {},
        beatMe = [],
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


    // This function sends an ajax get request to fetch
    // a list of farmers and coordinates, then renders 
    // the globe.
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

    // This function returns a random color. If node is offline, it will return
    // a random color with 50% opacity.
    var randomColor = function(isOnline) {
        return 'rgba(' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ',' + Math.floor(Math.random() * 256) + ', ' + (isOnline ? 1 : 0.25) + ')';
    }

    // Returns white or black class depending on which 
    // color contrasts more with submitted color.
    var invertColor = function(color) {
        // If color is hex-formatted, convert to RGB
        if (color.indexOf('#') !== -1) {
            var rgbArray = [hexToR(color), hexToG(color), hexToB(color)];
        }  else {
            var rgbArray = color.replace('rgb(','').replace(')','').split(',');
        }

        // Calculate luminance.
        var L = (299 * rgbArray[0] + 587 * rgbArray[1] + 114 * rgbArray[2]) / 1000;

        // Return black or white, depending on luminance.
        return L > 130 ? 'highlightBlack' : 'highlightWhite';
    }

    // Maps all farmers to a random color and generates
    // an object of countries. Also keeps track of 
    // heartbeat count.
    var generateLegend = function(farmers) {
        countries = {};
        beatMe = [];

        for (var j = 0; j < farmers.length; j++) {
            if (!(farmers[j].id in farmerLegend)) {
                farmerLegend[farmers[j].id] = {color:randomColor(farmers[j].online), beats:farmers[j].heartbeats};
            }

            // Add farmer id to beatMe list if heartbeats have incremented.
            if (farmers[j].heartbeats > farmerLegend[farmers[j].id].beats) {
                beatMe.push(farmers[j].id);
                farmerLegend[farmers[j].id].beats = farmers[j].heartbeats;
            }

            // Update country list.
            countries[farmers[j].location.country] = true;
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
            for (var i = 0; i < farmers.length; i++) {
                // Populate the side-menu with the farmers, ranked by uptime.
                currentInfo.append($('<li id="farmer' + (i + 1) + '" class="entry ' + (!farmers[i].online ? "offline" : "") + '"></li>'));
                entry = $('#farmer' + (i + 1));
                entry.append($('<span class="color-effect"></span>').css('background-color', farmerLegend[farmers[i].id].color));
                entry.append($('<div class="farmerId">' + farmers[i].address + '</div>'));
                entry.append($('<span class="count">' + Math.round(farmers[i].uptime) + '%</span>'));

            }

            // Summary information
            $('.summary').html(farmers.length + ' farmers <span>/</span> ' + Object.keys(countries).length + ' countries');
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
            var firstBits = a.address.slice(0, 4);

            markers.push(WE.marker([a.location.lat, a.location.lon]).addTo(earth).bindPopup('Farmer <strong>' + firstBits + '</strong>&hellip; from <strong>' + (city ? city : country) + '</strong>' + (state ? ', <strong>' + state + '</strong>' : '') + ' has <strong>' + numContracts + '</strong> contract(s) and passed <strong>' + heartbeats + '</strong> heartbeats with ' + testFileSize + '-byte test files.', {
                maxWidth: 150,
                maxHeight: 100,
                closeButton: true
            }));

            // Color the markers.
            $(markers[markers.length - 1].element.firstChild).css('background', farmerLegend[a.id].color);
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

        // Invert text color on mouseenter, mouseleave of entry.
        $('.entry').on('mouseenter', function() {
            $(this).addClass(invertColor($(this).children('span.color-effect').css('background-color')));
        });

        $('.entry').on('mouseleave', function() {
             $(this).removeClass(invertColor($(this).children('span.color-effect').css('background-color')));
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
