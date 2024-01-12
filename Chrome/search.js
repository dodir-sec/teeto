function setupSearch(inputId, resultsContainerId) {
    document.getElementById(inputId).addEventListener('input', function (e) {
        const searchQuery = e.target.value.toLowerCase();
        const resultsElements = document.querySelectorAll(`#${resultsContainerId} div`);
        console.log('!!resultsElements?.sretgserserydrtyhrdtyhlength',resultsElements);
            resultsElements.forEach(elem => {
            const text = elem.textContent.toLowerCase();
             elem.style.display = text.includes(searchQuery) ? '' : 'none' 
            });
console.log('resultsElementsresultsElementsresultsElementsresultsElements',Array.from(resultsElements).some(elem=>elem.style.display !== 'none'));
    });
}

// Setup search for each tab
setupSearch('search-endpoints', 'endpoints-results');
setupSearch('search-secrets', 'secrets-results');
setupSearch('search-params', 'params-results');
