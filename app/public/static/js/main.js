 

    var map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([0, 0], 4);  // Increased default zoom level from 2 to 4
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        minZoom: 2,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var markers = L.layerGroup().addTo(map);
    var tempMarker;
    var addingReview = false;
    var clickedLatLng;

    function getUserLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                console.log("Geolocation successful:", lat, lng);
                map.setView([lat, lng], 15);  // Increased zoom level from 13 to 15 for user's location
                fetchReviews();
            }, function(error) {
                console.log("Error getting user location:", error);
                fallbackToDefaultLocation();
            }, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
            fallbackToDefaultLocation();
        }
    }

    function fallbackToDefaultLocation() {
        map.setView([40.7128, -74.0060], 13); // New York City
        fetchReviews();
    }

    document.addEventListener('DOMContentLoaded', function() {
        getUserLocation();
        map.on('click', onMapClick);
        map.on('moveend', onMapMoveEnd);
        document.getElementById('add-review-btn').addEventListener('click', toggleAddReviewMode);
        document.getElementById('filter-btn').addEventListener('click', showFilterOptions);
    });

    function toggleAddReviewMode() {
        addingReview = !addingReview;
        document.getElementById('map').classList.toggle('custom-cursor', addingReview);
        document.getElementById('add-review-btn').textContent = addingReview ? '×' : '+';
    }

    function onMapClick(e) {
        if (addingReview) {
            clickedLatLng = e.latlng;
            showInlineForm(e.containerPoint);
        }
    }

    function showInlineForm(point) {
        var form = document.getElementById('inline-form');
        form.style.display = 'block';
        form.style.left = (point.x + 10) + 'px';
        form.style.top = (point.y + 10) + 'px';
    }

    function closeInlineForm() {
        document.getElementById('inline-form').style.display = 'none';
        toggleAddReviewMode();
    }

    function submitReview() {
        var content = document.getElementById('review-content').value;
        var rating = document.getElementById('review-rating').value;
        
        if (!content.trim()) {
            alert('Please enter a review content.');
            return;
        }
        
        var reviewData = {
            lat: clickedLatLng.lat,
            lng: clickedLatLng.lng,
            content: content.trim(),
            rating: parseInt(rating, 10) // Explicitly parse as base 10 integer
        };
        
        // Ensure rating is always a number
        if (isNaN(reviewData.rating)) {
            reviewData.rating = 5; // Default to 5 if parsing fails
        }
        
        console.log('Sending review data:', reviewData);
        
        showLoadingIndicator();
        
        fetch('/api/review', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(reviewData),
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(review => {
            addReviewMarker(review);
            closeInlineForm();
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('Error submitting review:', error);
            hideLoadingIndicator();
            alert('Failed to submit review. Please try again.');
        });
    }

    function addReviewMarker(review) {
        var markerColor = getMarkerColor(review.rating);
        var markerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div style='background-color:${markerColor};' class='marker-pin'>
                    <span class="marker-emoji">${getRatingEmoji(review.rating)}</span>
                </div>
            `,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });
        var marker = L.marker([review.lat, review.lng], {icon: markerIcon})
            .bindPopup(`
                <strong>${getRatingEmoji(review.rating)}</strong>
                <p>${sanitizeInput(review.content.substring(0, 50))}${review.content.length > 50 ? '...' : ''}</p>
                <button onclick="showFullReview('${review.id}')">Read More</button>
            `);
        markers.addLayer(marker);
    }

    function getMarkerColor(rating) {
        return rating === 5 ? '#2ECC40' : '#FF4136'; // Green for Recommend, Red for Avoid
    }

    function getRatingEmoji(rating) {
        return rating === 5 ? '👍' : '🚫';
    }

    function sanitizeInput(input) {
        return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function showFilterOptions() {
        // Implement filter options UI here
        console.log("Show filter options");
    }

    function fetchReviews() {
        var bounds = map.getBounds();
        var center = bounds.getCenter();
        var radius = center.distanceTo(bounds.getNorthEast()) / 1000; // Convert to km
        
        fetch(`/api/reviews?lat=${center.lat}&lng=${center.lng}&radius=${radius}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(reviews => {
                markers.clearLayers(); // Clear existing markers
                reviews.forEach(addReviewMarker);
                hideLoadingIndicator();
            })
            .catch(error => {
                console.error('Error fetching reviews:', error);
                hideLoadingIndicator();
                alert('Failed to load reviews. Please try again later.');
            });
    }

    function showLoadingIndicator() {
        document.getElementById('loading-indicator').classList.remove('hidden');
    }

    function hideLoadingIndicator() {
        document.getElementById('loading-indicator').classList.add('hidden');
    }

    function showFullReview(reviewId) {
        fetch(`/api/review/${reviewId}`)
            .then(response => response.json())
            .then(review => {
                // Create a custom popup with the full review content
                var popup = L.popup()
                    .setLatLng([review.lat, review.lng])
                    .setContent(`
                        <h3>${getRatingEmoji(review.rating)} Review</h3>
                        <p>${sanitizeInput(review.content)}</p>
                        <small>Posted on: ${new Date(review.created).toLocaleString()}</small>
                    `)
                    .openOn(map);
                hideLoadingIndicator();
            })
            .catch(error => {
                console.error('Error fetching full review:', error);
                hideLoadingIndicator();
            });
    }

    function onMapMoveEnd() {
        fetchReviews();
    }