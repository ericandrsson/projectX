const LOADING_TIMEOUT = 300;
let loadingTimeoutId;

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showErrorToaster(message) {
    const toaster = document.getElementById('error-toaster');
    const messageElement = document.getElementById('error-message');
    messageElement.textContent = message;
    toaster.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
    setTimeout(() => {
        hideErrorToaster();
    }, 5000);
}

function hideErrorToaster() {
    const toaster = document.getElementById('error-toaster');
    toaster.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
}

function showLoadingIndicator() {
    if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
    }
    
    loadingTimeoutId = setTimeout(() => {
        document.getElementById('loading-indicator').classList.remove('hidden');
    }, LOADING_TIMEOUT);
}

function hideLoadingIndicator() {
    if (loadingTimeoutId) {
        clearTimeout(loadingTimeoutId);
    }
    
    document.getElementById('loading-indicator').classList.add('hidden');
}

function sanitizeInput(input) {
    return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export { 
    debounce, 
    showErrorToaster, 
    hideErrorToaster, 
    showLoadingIndicator, 
    hideLoadingIndicator, 
    sanitizeInput 
};