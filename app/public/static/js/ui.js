import { map } from './map.js';
import { debouncedFetchReviews, currentPlace } from './api.js';
import { showErrorToaster } from './utils.js';

export let isMovingMap = true;
export let addingReview = false;

export function setupUI() {
    document.getElementById('zoom-in-btn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoom-out-btn').addEventListener('click', () => map.zoomOut());
    document.getElementById('move-map-btn').addEventListener('click', () => toggleMapMode(true));
    document.getElementById('add-review-btn').addEventListener('click', () => toggleMapMode(false));

    setupFilterDropdown();
    setupPlaceSearch();
}

function setupFilterDropdown() {
    const filterDropdown = document.getElementById('filter-dropdown');
    if (filterDropdown) {
        filterDropdown.addEventListener('change', function(e) {
            currentFilter = e.target.value;
            debouncedFetchReviews();
        });
    } else {
        console.error('Filter dropdown not found in DOM.');
    }
}

export function toggleMapMode(moving) {
    isMovingMap = moving;
    addingReview = !moving;
    
    const moveBtn = document.getElementById('move-map-btn');
    const addBtn = document.getElementById('add-review-btn');
    const mapElement = document.getElementById('map');
    
    // Reset both buttons to default state
    moveBtn.classList.remove('bg-blue-500', 'text-white', 'hover:bg-blue-600');
    addBtn.classList.remove('bg-blue-500', 'text-white', 'hover:bg-blue-600');
    moveBtn.classList.add('bg-white', 'text-gray-700', 'hover:bg-gray-200');
    addBtn.classList.add('bg-white', 'text-gray-700', 'hover:bg-gray-200');
    
    // Apply active state to the selected button
    if (moving) {
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

export function setupPlaceSearch() {
    // Implement this function
}

export function showPlaceSelectionModal() {
    // Implement this function
}

export function showInlineForm(latlng) {
    // Implement this function
}

export function selectPlace(placeId, lat, lng) {
    currentPlace = placeId;
    map.setView([lat, lng], 13);
    document.getElementById('search-results').innerHTML = '';
    document.getElementById('place-search').value = '';
    history.pushState(null, '', `/${placeId}`);
    debouncedFetchReviews();
}

// Export all necessary functions
export { setupFilterDropdown, setupModalSearch };