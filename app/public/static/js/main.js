 

    var map = L.map('map', {
        zoomControl: false,  // Disable default zoom control
        attributionControl: false,
        minZoom: 12,  // Set minimum zoom level
        maxZoom: 18  // Set maximum zoom level
    }).setView([0, 0], 13);  // Start at zoom level 13
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
        map.on('zoomend', onMapMoveEnd); // Added zoom event listener
        document.getElementById('zoom-in-btn').addEventListener('click', function() {
            map.zoomIn();
        });
        document.getElementById('zoom-out-btn').addEventListener('click', function() {
            map.zoomOut();
        });
        document.getElementById('add-review-btn').addEventListener('click', function() {
            console.log('Add review button clicked');
            toggleAddReviewMode();
        });
        document.getElementById('filter-btn').addEventListener('click', showFilterOptions);

        // Remove this line as we'll no longer use a static template
        // window.reviewMarkerTemplate = document.getElementById('review-marker-template').innerHTML;

        const form = document.getElementById('inline-form');
        if (form) {
            console.log('Inline form found in DOM');
        } else {
            console.error('Inline form not found in DOM');
        }
    });

    function toggleAddReviewMode() {
        addingReview = !addingReview;
        document.getElementById('map').classList.toggle('custom-cursor', addingReview);
        document.getElementById('add-review-btn').textContent = addingReview ? '×' : '+';
        console.log('Add review mode toggled:', addingReview);

        if (!addingReview) {
            closeInlineForm();
        }
    }

    function closeInlineForm() {
        map.closePopup();
        addingReview = false;
        document.getElementById('map').classList.remove('custom-cursor');
        document.getElementById('add-review-btn').textContent = '+';
        console.log('Inline form closed');
    }

    function onMapClick(e) {
        console.log('Map clicked. Adding review:', addingReview);
        if (addingReview) {
            e.originalEvent.stopPropagation(); // Stop event propagation
            clickedLatLng = e.latlng;
            console.log('Clicked location:', clickedLatLng);
            showInlineForm(clickedLatLng);
        } else if (!map.hasLayer(L.popup())) {
            closeInlineForm();
        }
    }

    function showInlineForm(latlng) {
        console.log('showInlineForm called with latlng:', latlng);
        const formContainer = document.getElementById('form-container');
        if (!formContainer) {
            console.error('Form container not found');
            return;
        }
        formContainer.innerHTML = ''; // Clear previous content
        
        // Create a loading placeholder
        const loadingPlaceholder = '<div class="text-center p-4">Loading form...</div>';
        
        // Open the popup immediately with the loading placeholder
        const popup = L.popup({
            minWidth: 300,
            maxWidth: 300,
            keepInView: true,
            closeOnClick: false,
            offset: [0, -2]  // Move the popup 20 pixels upwards
        })
        .setLatLng(latlng)
        .setContent(loadingPlaceholder)
        .openOn(map);

        console.log('Popup opened with loading placeholder');

        // Fetch the form content
        htmx.ajax('GET', '/components/inline_form', {
            target: '#form-container',
            swap: 'innerHTML',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(() => {
            return new Promise(resolve => {
                // Wait a short time to ensure the content is loaded
                setTimeout(() => {
                    const formContent = formContainer.innerHTML;
                    console.log('Form content received:', formContent);
                    resolve(formContent);
                }, 100);
            });
        })
        .then(formContent => {
            if (!formContent.trim()) {
                throw new Error('Form content is empty');
            }
            // Update the popup content
            popup.setContent(formContent);
            console.log('Inline form loaded and shown as popup');
            
            // Disable adding review mode after showing the form
            addingReview = false;
            document.getElementById('add-review-btn').textContent = '+';
            document.getElementById('map').classList.remove('custom-cursor');
        })
        .catch(error => {
            console.error('Error loading inline form:', error);
            popup.setContent('Failed to load the review form. Please try again.');
            addingReview = false;
            document.getElementById('add-review-btn').textContent = '+';
            document.getElementById('map').classList.remove('custom-cursor');
        });
    }

    function submitReview() {
        const content = document.getElementById('review-content').value;
        const rating = document.getElementById('review-rating').value;
        
        if (!content.trim()) {
            alert('Please enter a review content.');
            return;
        }
        
        if (!clickedLatLng || !clickedLatLng.lat || !clickedLatLng.lng) {
            alert('Invalid location. Please try clicking on the map again.');
            return;
        }
        
        var reviewData = {
            lat: clickedLatLng.lat,
            lng: clickedLatLng.lng,
            content: content.trim(),
            rating: parseInt(rating, 10)
        };
        
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
            addingReview = false; // Set addingReview to false after submitting
            document.getElementById('add-review-btn').textContent = '+';
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('Error submitting review:', error);
            hideLoadingIndicator();
            alert('Failed to submit review. Please try again.');
        });
    }

    function addReviewMarker(review) {
        const maxChars = 30; // Maximum characters to show
        const truncatedContent = review.content.length > maxChars 
            ? review.content.substring(0, maxChars) + '...' 
            : review.content;

        var markerHtml = `
            <div class="flex items-center">
                <div class="relative w-8 h-8 rounded-full shadow-md ${getMarkerColor(review.rating)}">
                    <span class="absolute inset-0 flex items-center justify-center text-lg">
                        ${getRatingEmoji(review.rating)}
                    </span>
                </div>
                <div class="ml-2 px-2 py-1 bg-white rounded-lg shadow-md" style="border: 1px solid black; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span class="text-sm">${sanitizeInput(truncatedContent)}</span>
                </div>
            </div>
        `;

        var markerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: markerHtml,
            iconSize: [200, 40],  // Increased width to accommodate the text
            iconAnchor: [16, 20]  // Adjusted to center the icon
        });

        var marker = L.marker([review.lat, review.lng], {icon: markerIcon})
            .on('click', function() {
                showFullReview(review.id);
            });

        markers.addLayer(marker);
    }

    function getMarkerColor(rating) {
        return rating === 5 ? 'bg-green-500' : 'bg-red-500';
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
        
        console.log(`Fetching reviews for lat: ${center.lat}, lng: ${center.lng}, radius: ${radius}`);
        
        fetch(`/api/reviews?lat=${center.lat}&lng=${center.lng}&radius=${radius}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(reviews => {
                console.log('Received reviews:', reviews);
                markers.clearLayers(); // Clear existing markers
                reviews.forEach(addReviewMarker);
                console.log('Added markers for reviews:', reviews.length);
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
        showLoadingIndicator();
        fetch(`/api/review/${reviewId}`)
            .then(response => response.json())
            .then(review => {
                var popup = L.popup({
                    className: 'review-popup-container'
                })
                    .setLatLng([review.lat, review.lng])
                    .setContent(`
                        <div class="review-popup p-4">
                            <h3 class="text-xl font-bold mb-2">${getRatingEmoji(review.rating)} Review</h3>
                            <p class="mb-4">${sanitizeInput(review.content)}</p>
                            <small class="text-gray-500">Posted on: ${new Date(review.created).toLocaleString()}</small>
                        </div>
                    `)
                    .openOn(map);
                hideLoadingIndicator();
            })
            .catch(error => {
                console.error('Error fetching full review:', error);
                hideLoadingIndicator();
                alert('Failed to load review details. Please try again.');
            });
    }

    function onMapMoveEnd() {
        console.log('Map moved or zoomed. Current zoom:', map.getZoom());
        fetchReviews();
    }