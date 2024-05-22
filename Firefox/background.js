// Listen to messages from other parts of the extension.
browser.runtime.onMessage.addListener((request, sender) => {
    if (request.action === "executeScript") {
        return browser.scripting.executeScript({
            target: { tabId: sender.tab.id },
            code: request.script
        }).then(injectionResults => {
            return { results: injectionResults[0].result };
        });
    } else if (request.action === "fetchUrl") {
        return fetch(request.url)
            .then(response => response.text())
            .then(text => ({ text }))
            .catch(error => ({ error: error.toString() }));
    } else if (request.action === "analyzeEndpoints") {
        return Promise.resolve({ message: "Endpoints received" });
    } else if (request.action === "analyzeSecrets") {
        return Promise.resolve({ message: "Secrets received" });
    }
});
