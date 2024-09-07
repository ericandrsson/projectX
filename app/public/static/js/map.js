const MIN_ZOOM = 10;
const MAX_ZOOM = 19;
const INITIAL_ZOOM = 15;

export let map;

export function initializeMap() {
    map = L.map('map', {
        zoomControl: false,
        attributionControl: true,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM
    }).setView([41.3851, 2.1734], INITIAL_ZOOM);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: MAX_ZOOM,
        minZoom: MIN_ZOOM,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    console.log('Map initialized');
    return map;
}


