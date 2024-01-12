chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "executeScript") {
        chrome.scripting.executeScript({
            target: { tabId: sender.tab.id },
            code: request.script
        }, (injectionResults) => {
            sendResponse({ results: injectionResults[0].result });
        });
        return true; // indicate we will send the response asynchronously
    } else if (request.action === "fetchUrl") {
        fetch(request.url)
            .then(response => response.text())
            .then(text => sendResponse({ text }))
            .catch(error => sendResponse({ error: error.toString() }));
        return true; // indicate we will send the response asynchronously
    } else if (request.action === "analyzeEndpoints") {
        sendResponse({ message: "Endpoints received" });
    } else if (request.action === "analyzeSecrets") {
        sendResponse({ message: "Secrets received" });
    }
});
