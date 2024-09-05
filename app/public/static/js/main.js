    const MIN_ZOOM = 10;  // Reduced from 14 to allow more zooming out
    const MAX_ZOOM = 19;
    const INITIAL_ZOOM = 15;
    const LOADING_TIMEOUT = 300;

    let loadingTimeoutId;

    var map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM
    }).setView([0, 0], INITIAL_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var markers = L.layerGroup().addTo(map);
    var tempMarker;
    var addingReview = false;
    var clickedLatLng;

    let currentFilter = 'all';

    function getUserLocation() {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;
                console.log("Geolocation successful:", lat, lng);
                map.setView([lat, lng], 15);
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
        map.setView([40.7128, -74.0060], 13);
        fetchReviews();
    }

    document.addEventListener('DOMContentLoaded', function() {
        getUserLocation();
        map.on('click', onMapClick);
        map.on('moveend', onMapMoveEnd);
        map.on('zoomend', onMapMoveEnd);
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

        const form = document.getElementById('inline-form');
        if (form) {
            console.log('Inline form found in DOM');
        } else {
            console.error('Inline form not found in DOM');
        }

        const filterDropdown = document.getElementById('filter-dropdown');
        console.log('Attempting to find filter dropdown');
        if (filterDropdown) {   
            console.log('Filter dropdown found:', filterDropdown);
            filterDropdown.addEventListener('change', function(e) {
                console.log('Dropdown change event fired');
                currentFilter = e.target.value;
                console.log('Filter changed to:', currentFilter);
                fetchReviews();
            });
            console.log('Change event listener added to filter dropdown');
        } else {
            console.error('Filter dropdown not found in DOM. Make sure the element with id "filter-dropdown" exists in your HTML.');
        }

        // Log the initial filter value
        console.log('Initial filter value:', currentFilter);

        // Manually trigger initial fetch
        fetchReviews();

        // Add this new event listener
        document.addEventListener('click', function(e) {
            if (e.target && e.target.closest('.delete-review-btn')) {
                console.log('Delete button clicked');
                var reviewId = e.target.closest('.delete-review-btn').getAttribute('data-review-id');
                deleteReview(reviewId);
            }
        });
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
            e.originalEvent.stopPropagation();
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
        formContainer.innerHTML = '';
        
        const loadingPlaceholder = '<div class="text-center p-4">Loading form...</div>';
        
        const popup = L.popup({
            minWidth: 300,
            maxWidth: 300,
            keepInView: true,
            closeOnClick: false,
            offset: [0, -2]
        })
        .setLatLng(latlng)
        .setContent(loadingPlaceholder)
        .openOn(map);

        console.log('Popup opened with loading placeholder');

        htmx.ajax('GET', '/components/inline_form', {
            target: '#form-container',
            swap: 'innerHTML',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(() => {
            return new Promise(resolve => {
                setTimeout(() => {
                    const formContent = formContainer.innerHTML;
                    console.log('Form content received:', formContent);
                    resolve(formContent);
                }, 500);
            });
        })
        .then(formContent => {
            if (!formContent.trim()) {
                throw new Error('Form content is empty');
            }
            popup.setContent(formContent);
            console.log('Inline form loaded and shown as popup');
            
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
            addingReview = false;
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
        const maxChars = 30;
        const truncatedContent = review.content.length > maxChars 
            ? review.content.substring(0, maxChars) + '...' 
            : review.content;

        const markerColor = review.rating === 5 ? 'bg-green-500' : 'bg-red-500';
        const markerEmoji = review.rating === 5 ? '👍' : '🚫';

        var markerHtml = `
            <div class="flex items-center">
                <div class="relative w-8 h-8 rounded-full shadow-md ${markerColor}">
                    <span class="absolute inset-0 flex items-center justify-center text-lg">
                        ${markerEmoji}
                    </span>
                </div>
                <div class="ml-2 px-2 py-1 bg-white rounded-lg shadow-md border border-gray-300 max-w-[150px] overflow-hidden text-overflow-ellipsis whitespace-nowrap">
                    <span class="text-sm">${sanitizeInput(truncatedContent)}</span>
                </div>
            </div>
        `;

        var markerIcon = L.divIcon({
            className: 'custom-div-icon',
            html: markerHtml,
            iconSize: [200, 40],
            iconAnchor: [16, 20]
        });

        var marker = L.marker([review.lat, review.lng], {icon: markerIcon})
            .on('click', function() {
                showFullReview(review.id);
            });

        markers.addLayer(marker);
    }

    function getRatingEmoji(rating) {
        return rating === 5 ? '👍' : '🚫';
    }

    function sanitizeInput(input) {
        return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function showFilterOptions() {
        console.log("Show filter options");
    }

    function fetchReviews() {
        showLoadingIndicator();
        var bounds = map.getBounds();
        var center = bounds.getCenter();
        var radius = center.distanceTo(bounds.getNorthEast()) / 1000;
        
        console.log(`Fetching reviews for lat: ${center.lat}, lng: ${center.lng}, radius: ${radius}, filter: ${currentFilter}`);
        
        let url = `/api/reviews?lat=${center.lat}&lng=${center.lng}&radius=${radius}`;
        
        if (currentFilter && currentFilter !== 'all') {
            const ratingValue = currentFilter === 'recommend' ? 5 : 1;
            url += `&rating=${ratingValue}`;
        }
        
        console.log('Fetching from URL:', url);

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(reviews => {
                console.log('Received reviews:', reviews);
                markers.clearLayers();
                reviews.forEach(addReviewMarker);
                console.log('Added markers for filtered reviews');
                hideLoadingIndicator();
            })
            .catch(error => {
                console.error('Error fetching reviews:', error);
                hideLoadingIndicator();
                alert('Failed to load reviews. Please try again later.');
            });
    }

    function showLoadingIndicator() {
        // Clear any existing timeout
        if (loadingTimeoutId) {
            clearTimeout(loadingTimeoutId);
        }
        
        // Set a new timeout
        loadingTimeoutId = setTimeout(() => {
            document.getElementById('loading-indicator').classList.remove('hidden');
        }, LOADING_TIMEOUT); // Use the constant for the timeout duration
    }

    function hideLoadingIndicator() {
        // Clear the timeout if it hasn't fired yet
        if (loadingTimeoutId) {
            clearTimeout(loadingTimeoutId);
        }
        
        // Hide the loading indicator
        document.getElementById('loading-indicator').classList.add('hidden');
    }

    function showFullReview(reviewId) {
        showLoadingIndicator();
        fetch(`/api/review/${reviewId}`)
            .then(response => response.json())
            .then(review => {
                var popupContent = `
                    <div class="p-4 relative">
                        <div class="flex justify-between items-center mb-2">
                            <h3 class="text-xl font-bold">${getRatingEmoji(review.rating)} Review</h3>
                            <button class="delete-review-btn text-gray-500 hover:text-red-500 focus:outline-none" data-review-id="${reviewId}">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <p class="mb-4">${sanitizeInput(review.content)}</p>
                        <small class="text-gray-500">Posted on: ${new Date(review.created).toLocaleString()}</small>
                    </div>
                `;

                var popup = L.popup({
                    className: 'review-popup-container',
                    maxWidth: 300
                })
                    .setLatLng([review.lat, review.lng])
                    .setContent(popupContent)
                    .openOn(map);

                hideLoadingIndicator();
            })
            .catch(error => {
                console.error('Error fetching full review:', error);
                hideLoadingIndicator();
                alert('Failed to load review details. Please try again.');
            });
    }

    function deleteReview(reviewId) {
        console.log('Delete review function called with ID:', reviewId);
        if (confirm('Are you sure you want to delete this review?')) {
            console.log('Deletion confirmed');
            showLoadingIndicator();
            fetch(`/api/review/${reviewId}`, {
                method: 'DELETE',
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Review deleted:', data);
                map.closePopup();
                fetchReviews(); // Refresh the reviews on the map
                hideLoadingIndicator();
            })
            .catch(error => {
                console.error('Error deleting review:', error);
                hideLoadingIndicator();
                alert('Failed to delete review. Please try again.');
            });
        } else {
            console.log('Deletion cancelled');
        }
    }

    function onMapMoveEnd() {
        console.log('Map moved or zoomed. Current zoom:', map.getZoom());
        fetchReviews();
    }