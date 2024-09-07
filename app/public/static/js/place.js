import { initializeMap, map } from './map.js';

const MapState = {
    MOVING: 'Moving',
    PINNING: 'Pinning'
};

let mapState = MapState.MOVING;
let clickedLatLng;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded event fired');
    const map = initializeMap();

    // Set up map event listeners
    map.on('click', onMapClick);
    map.on('moveend', onMapMoveEnd);
    map.on('zoomend', onMapZoomEnd);

    // Set up UI event listeners
    document.getElementById('zoom-in-btn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoom-out-btn').addEventListener('click', () => map.zoomOut());
    document.getElementById('move-map-btn').addEventListener('click', () => setMapState(MapState.MOVING));
    document.getElementById('add-review-btn').addEventListener('click', () => setMapState(MapState.PINNING));
});

function onMapClick(e) {
    if (mapState === MapState.PINNING) {
        e.originalEvent.stopPropagation();
        clickedLatLng = e.latlng;
        showAddReviewForm(clickedLatLng);
    }
}

function onMapMoveEnd() {
    console.log('Map moved');
    // Implement any functionality needed when the map stops moving
}

function onMapZoomEnd() {
    console.log('Map zoom changed');
    // Implement any functionality needed when the map zoom changes
}

function setMapState(newState) {
    mapState = newState;
    
    const moveBtn = document.getElementById('move-map-btn');
    const addBtn = document.getElementById('add-review-btn');
    const mapElement = document.getElementById('map');
    
    // Reset both buttons to default state
    moveBtn.classList.remove('bg-blue-500', 'text-white', 'hover:bg-blue-600');
    addBtn.classList.remove('bg-blue-500', 'text-white', 'hover:bg-blue-600');
    moveBtn.classList.add('bg-white', 'text-gray-700', 'hover:bg-gray-200');
    addBtn.classList.add('bg-white', 'text-gray-700', 'hover:bg-gray-200');
    
    // Apply active state to the selected button
    if (newState === MapState.MOVING) {
        moveBtn.classList.remove('bg-white', 'text-gray-700', 'hover:bg-gray-200');
        moveBtn.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
        map.dragging.enable();
        mapElement.classList.remove('cursor-tag');
        mapElement.classList.add('cursor-hand');
    } else {
        addBtn.classList.remove('bg-white', 'text-gray-700', 'hover:bg-gray-200');
        addBtn.classList.add('bg-blue-500', 'text-white', 'hover:bg-blue-600');
        map.dragging.disable();
        mapElement.classList.remove('cursor-hand');
        mapElement.classList.add('cursor-tag');
    }
}

function showAddReviewForm(latlng) {
    const formContainer = document.getElementById('form-container');
    if (!formContainer) {
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
        
        setMapState(MapState.PINNING);
    })
    .catch(error => {
        console.error('Error loading inline form:', error);
        popup.setContent('Failed to load the review form. Please try again.');
        setMapState(MapState.MOVING);
    });
}

function submitReview() {
    const content = document.getElementById('review-content').value;
    const rating = document.getElementById('review-rating').value;
    
    if (!content.trim()) {
        showErrorToaster('Please enter a review content.');
        return;
    }
    
    if (!clickedLatLng || !clickedLatLng.lat || !clickedLatLng.lng) {
        showErrorToaster('Invalid location. Please try clicking on the map again.');
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
        hideLoadingIndicator();
    })
    .catch(error => {
        console.error('Error submitting review:', error);
        hideLoadingIndicator();
        showErrorToaster('Failed to submit review. Please try again.');
    });
}

function closeInlineForm() {
    console.log('closeInlineForm called');
    map.closePopup();
    setMapState(MapState.MOVING);
}