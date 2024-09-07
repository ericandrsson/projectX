import { debounce, showErrorToaster, hideLoadingIndicator } from './utils.js';
import { map, updateMarkers } from './map.js';

export let currentFilter = 'all';
export let currentPlace = null;

export const debouncedFetchReviews = debounce(function() {
    if (!currentPlace) return;

    var bounds = map.getBounds();
    var center = bounds.getCenter();
    var radius = center.distanceTo(bounds.getNorthEast()) / 1000;
    
    let url = `/api/reviews?lat=${center.lat}&lng=${center.lng}&radius=${radius}`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(reviews => {
            updateMarkers(reviews);
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('Error fetching reviews:', error);
            hideLoadingIndicator();
            showErrorToaster(error.error || 'Failed to load reviews. Please try again later.');
        });
}, 300);

export function submitReview(reviewData) {
    // Implement this function
}

export function deleteReview(reviewId) {
    // Implement this function
}