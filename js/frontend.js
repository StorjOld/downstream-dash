document.addEventListener('DOMContentLoaded', function(event) {

    var farmers = [],
        markers = [],
        countries = {},
        farmerLegend = {},
        beatMe = [],
        rotation;

    var currentInfo = document.getElementsByTagName('ul')[0],
        body = document.getElementsByTagName('body')[0];

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
    document.getElementById('open-side-menu').addEventListener('click', function() {
        body.classList.toggle('open');
    }, false);

    // Maps all farmers to a random color and generates
    // an object of countries. Also keeps track of 
    // heartbeat count.
    var generateLegend = function(farmers) {
        countries = {};
        beatMe = [];

        for (var j = 0; j < farmers.length; j++) {
            if (!(farmers[j].id in farmerLegend)) {
                farmerLegend[farmers[j].id] = {
                    color: randomColor(farmers[j].online),
                    beats: farmers[j].heartbeats
                };
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

    // This function sends an ajax get request to fetch
    // a list of farmers and coordinates, then renders 
    // the globe.
    var getData = function() {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                farmers = data.farmers.filter(function(farmer) {
                    return farmer.uptime > 0;
                });
                generateLegend(farmers);
                render();
            }

        }
        xhr.open('GET', 'http://verify.driveshare.org/api/downstream/status/list/by/d/uptime');
        xhr.send();
    }

    // Return window width.
    function getWidth() {
        if (self.innerHeight) {
            return self.innerWidth;
        }

        if (document.documentElement && document.documentElement.clientHeight) {
            return document.documentElement.clientWidth;
        }

        if (document.body) {
            return document.body.clientWidth;
        }
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
        } else {
            var rgbArray = color.replace('rgb(', '').replace(')', '').split(',');
        }

        // Calculate luminance.
        var L = (299 * rgbArray[0] + 587 * rgbArray[1] + 114 * rgbArray[2]) / 1000;

        // Return black or white, depending on luminance.
        return L > 130 ? 'highlightBlack' : 'highlightWhite';
    }

    // This function handles everything related to updating the HTML
    // with the returned data from the AJAX call:
    var render = function() {
        var entry;
        if (!farmers.length) {

            // If there isn't anybody online
            // Show an appropriate message and empty the summary and the list section
            currentInfo.empty();
            document.getElementById('no-farmers').style.display = 'block';
            document.getElementsByClassName('.summary')[0].innerHTML = '';
        } else {
            // If there are people online:
            // On every call clear the side-menu list and globe markers and fill them up with new info.
            currentInfo.innerHTML = null;
            document.getElementById('no-farmers').style.display = 'none';

            for (var i = 0; i < farmers.length; i++) {
                // Populate the side-menu with the farmers, ranked by uptime.
                var newEntry = document.createElement('li');
                newEntry.setAttribute('id', 'farmer' + (i + 1));
                newEntry.className = 'entry ' + (!farmers[i].online ? 'offline' : '');

                var newColorSpan = document.createElement('span');
                newColorSpan.className = 'color-effect';
                newColorSpan.style.backgroundColor = farmerLegend[farmers[i].id].color;
                newEntry.appendChild(newColorSpan);

                var newDiv = document.createElement('div');
                newDiv.className = 'farmerId';
                newDiv.innerHTML = farmers[i].address;
                newEntry.appendChild(newDiv);

                var newCountSpan = document.createElement('span');
                newCountSpan.className = 'count';
                newCountSpan.innerHTML = Math.round(farmers[i].uptime) + '%';
                newEntry.appendChild(newCountSpan)

                currentInfo.appendChild(newEntry);
            }

            // Summary information
            document.getElementsByClassName('summary')[0].innerHTML = farmers.length + ' farmers <span>/</span> ' + Object.keys(countries).length + ' countries';
        }

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
            var currentMarker = markers[markers.length - 1].element.firstChild;
            currentMarker.style.background = farmerLegend[a.id].color;
            if (beatMe.indexOf(a.id) > -1) {
                currentMarker.classList.add('beat');
            } else if (!a.online) {
                currentMarker.classList.add('offline');
            }
        });


        // Rotate the globe to the desired farmer from the list
        var entries = document.getElementsByClassName('entry');

        for (var i = 0; i < entries.length; i++) {
            entries[i].addEventListener('click', function() {
                if (getWidth() < 800) {
                    body.classList.remove('open');
                }
                clearInterval(rotation);
                var index = this.getAttribute('id').split('farmer')[1] - 1;
                earth.panTo([farmers[index].location.lat, farmers[index].location.lon]);
            });

            entries[i].addEventListener('mouseover', function() {
                this.classList.add(invertColor(this.getElementsByClassName('color-effect')[0].style.backgroundColor));
            });

            entries[i].addEventListener('mouseout', function() {
                this.classList.remove('highlightWhite');
                this.classList.remove('highlightBlack');
            });
        }
    }


    var earthDiv = document.getElementById('earth_div');
    ['click', 'touchstart', 'touchend'].forEach(function(event) {
        earthDiv.addEventListener(event, function() {
            clearInterval(rotation);
            if (getWidth() < 800) {
                body.classList.remove('open');
            }
        });
    });


    // Open the side menu on start up if the app is running on a big screen.
    if (getWidth() > 800) {
        body.classList.add('open');
    } else {
        earth.setZoom(1.8);
    }

});
