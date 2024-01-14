
loadDataForCurrentDomain();

async function loadDataForCurrentDomain() {
  try {
    const domain = await getCurrentTabDomain();
    if (!domain) return;

    const domainData = await getDomainData(domain);
    if (domainData && (domainData.endpoints.length > 0 || domainData.secrets.length > 0 || domainData.params.length > 0)) {
      displayDataContainer();
      document.getElementById('clear-results').style.display = "block";
      document.getElementById('download-all-data').style.display = "block";
      document.getElementById('scan-again').style.display = "block";
      loadDomainDataToUI(domainData['endpoints'], 'endpoints');
      loadDomainDataToUI(domainData['secrets'], 'secrets');
      loadDomainDataToUI(domainData['params'], 'params');
    } else {
      displayStartContainer();
    }
  } catch (error) {
    console.error('Error in loadDataForCurrentDomain:', error);
  }
}

async function initializeDomainData(domain) {
  try {
    const result = await getDomainData(domain);
    if (!result) {
      await setDomainData(domain, { 'endpoints': [], 'params': [], 'secrets': [] });
    }
  } catch (error) {
    console.error('Error initializing domain data:', error);
  }
}

function loadDomainDataToUI(dataArray, dataType) {
  let resultsDiv = document.getElementById(dataType + "-results");
  resultsDiv.textContent = '';

  if (dataArray && dataArray.length > 0) {
    dataArray.forEach(function (dataObj) {
      appendDataToDiv(dataObj, dataType);
    });
  } else {
    resultsDiv.style.display = 'flex';
    resultsDiv.innerHTML = '<img class="nothing-found" src="imgs/7486754.png" >'
    resultsDiv.style.alignItems = 'center';
    resultsDiv.style.justifyContent = 'center';
  }
}

function appendDataToDiv(dataObj, dataType) {
  switch (dataType) {
    case 'endpoints':
      appendEndpointToResultsDiv(dataObj, document.getElementById('endpoints-results'));
      break;
    case 'secrets':
      appendSecretToResultsDiv(dataObj, document.getElementById('secrets-results'));
      break;
    case 'params':
      appendEndpointToParamsDiv(dataObj, document.getElementById('params-results'));
      break;
    default:
      console.log('Unknown data type:', dataType);
  }
}

//init
document.getElementById('find-endpoints').addEventListener('click', async function () {
  try {
    // Update UI
    displayDataContainer();
    document.getElementById('endpoints-loader').style.display = "flex";
    document.getElementById('params-loader').style.display = "flex";
    document.getElementById('secrets-loader').style.display = "flex";
    document.getElementById('loading-progress').style.display = "flex";

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      const tabId = tabs[0].id;

      await initializeDomainData(domain);

      // Execute scripts separately
      await executeEndpointFinder(tabId);

      await waitForEndpointResults();

      await executeSecretsFinder(tabId);

      waitForSecretsResults();

      document.getElementById('scan-again').style.display = "block";


    }
  } catch (error) {
    console.error('Error in find-endpoints event listener:', error);
  }
});

//scan again
document.getElementById('scan-again').addEventListener('click', async function () {
  try {
    // Update UI
    document.getElementById('endpoints-loader').style.display = "flex";
    document.getElementById('params-loader').style.display = "flex";
    document.getElementById('secrets-loader').style.display = "flex";
    document.getElementById('loading-progress').style.display = "flex";
    document.getElementById('endpoints-results').style.display = 'none';
    document.getElementById('secrets-results').style.display = 'none';
    document.getElementById('params-results').style.display = 'none';

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0) {
      const tabId = tabs[0].id;

      // Execute scripts separately
      await executeEndpointFinder(tabId);

      await waitForEndpointResults();

      await executeSecretsFinder(tabId);

      waitForSecretsResults();

      document.getElementById('scan-again').style.display = "block";
    }
  } catch (error) {
    console.error('Error in find-endpoints event listener:', error);
    // Handle error appropriately
  }
});

function waitForEndpointResults() {
  return new Promise((resolve) => {
    chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
      if (request.action === "returnResults") {
        chrome.runtime.onMessage.removeListener(listener);
        resolve();
      }
    });
  });
}

function waitForSecretsResults() {
  return new Promise((resolve) => {
    chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
      if (request.action === "returnSecrets") {
        chrome.runtime.onMessage.removeListener(listener);
        resolve();
      }
    });
  });
}

async function executeEndpointFinder(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['endpoint_finder.js'],
    });
  } catch (error) {
    console.error('Error executing Endpoint Finder Script:', error);
  }
}

async function executeSecretsFinder(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['secrets_finder.js']
    });
  } catch (error) {
    console.error('Error executing Secrets Finder Script:', error);
  }
}

document.getElementById('clear-results').addEventListener('click', function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0) {
      let url = new URL(tabs[0].url);
      let domain = url.hostname;

      // Delete the domain data completely
      chrome.storage.local.remove(domain, function () {
        document.getElementById('endpoints-results').style.display = 'none';
        document.getElementById('secrets-results').style.display = 'none';
        document.getElementById('params-results').style.display = 'none';
        document.getElementById('data-container').style.display = 'none';
        document.getElementById('start-container').style.display = 'block';
        document.getElementById('clear-results').style.display = "none";
        document.getElementById('download-all-data').style.display = "none";
        document.getElementById('footer').style.display = "none";
        document.getElementById('scan-again').style.display = "none";
        document.getElementById('loading-progress').style.display = "none";


      });
    }
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  switch (request.action) {
    case "returnResults":
      handleReturnResults(request).then(() => {
      }).catch(error => {
        console.error("Error handling returnResults", error);
      });
      break;
    case "returnParams":
      handleReturnParams(request).then(() => {
      }).catch(error => {
        console.error("Error handling returnParams", error);
      });
      break;
    case "returnSecrets":
      handleReturnSecrets(request).then(() => {
      }).catch(error => {
        console.error("Error handling returnSecrets", error);
      });
      break;
    default:
      console.log("Unknown action:", request.action);
  }

  // It's important to return true if you want to use sendResponse asynchronously.
  return true;
});

async function handleReturnResults(request) {

  let resultsDiv = document.getElementById('endpoints-results');

  let uniqueEndpoints = Array.from(new Set(request.data.map(JSON.stringify))).map(JSON.parse);

  if (!uniqueEndpoints?.length) {
    displayNoDataFound(resultsDiv, 'endpoints');
    document.getElementById('endpoints-loader').style.display = "none";
    return;
  }

  resultsDiv.style.display = 'block';
  resultsDiv.textContent = '';

  const domain = await getCurrentTabDomain();
  if (!domain) return;

  let domainData = await getDomainData(domain) || { 'endpoints': [], 'params': [], 'secrets': [] };
  domainData['endpoints'] = uniqueEndpoints;

  // Call handleReturnParams synchronously to ensure order
  domainData['params'] = await handleReturnParams(request.params);

  await setDomainData(domain, domainData);

  uniqueEndpoints.forEach(endpointObj => {
    appendEndpointToResultsDiv(endpointObj, resultsDiv);
  });

  document.getElementById('params-loader').style.display = "none";
  document.getElementById('endpoints-loader').style.display = "none";
  document.getElementById('clear-results').style.display = "block";
  document.getElementById('download-all-data').style.display = "block";
}

async function handleReturnParams(params) {
  let paramsDiv = document.getElementById('params-results');

  let uniqueParams = Array.from(new Set(params.map(JSON.stringify))).map(JSON.parse);
  if (!uniqueParams?.length) {
    displayNoDataFound(paramsDiv, 'params');
    document.getElementById('params-loader').style.display = "none";
    return [];
  }

  paramsDiv.style.display = 'block';
  paramsDiv.textContent = '';

  uniqueParams.forEach(paramObj => {
    appendEndpointToParamsDiv(paramObj, paramsDiv);
  });

  return uniqueParams;
}

async function handleReturnSecrets(request) {
  let secretsDiv = document.getElementById('secrets-results');

  let uniqueSecrets = Array.from(new Set(request.data.map(JSON.stringify))).map(JSON.parse);

  if (!uniqueSecrets?.length) {
    displayNoDataFound(secretsDiv, 'secrets');
    document.getElementById('secrets-loader').style.display = "none";
    document.getElementById('loading-progress').style.display = "none";
    return;
  }

  secretsDiv.style.display = 'block';
  secretsDiv.textContent = '';

  const domain = await getCurrentTabDomain();
  if (!domain) return;

  let domainData = await getDomainData(domain) || { 'endpoints': [], 'params': [], 'secrets': [] };
  domainData['secrets'] = uniqueSecrets;

  await setDomainData(domain, domainData);

  uniqueSecrets.forEach(secretObj => {
    appendSecretToResultsDiv(secretObj, secretsDiv);
  });

  document.getElementById('loading-progress').style.display = "none";
  document.getElementById('secrets-loader').style.display = "none";

}

function appendEndpointToResultsDiv(endpointObj, resultsDiv) {
  resultsDiv.style.display = 'block';
  var endpointElement = document.createElement('div');
  endpointElement.classList.add('url-box');

  var a = document.createElement('a');
  a.classList.add('url-link');
  a.textContent = endpointObj.endpoint;
  a.href = endpointObj.endpoint;
  a.target = '_blank"'
  a.addEventListener('click', function (e) {
    e.preventDefault();
    chrome.tabs.create({ url: a.href });
  });

  endpointElement.appendChild(a);
  resultsDiv.appendChild(endpointElement);
}

function appendSecretToResultsDiv(secretObj, secretsDiv) {
  secretsDiv.style.display = 'block';
  let secretElement = document.createElement('div');
  secretElement.className = 'secret';

  let secretName = document.createElement('p');
  let secretText = document.createElement('p');

  secretName.textContent = secretObj.name + ': ';
  secretName.className = 'secret-name';


  secretText.textContent = secretObj.secret;
  secretText.className = 'secret-text';

  secretElement.appendChild(secretName);
  secretElement.appendChild(secretText);

  secretsDiv.appendChild(secretElement);
}

function appendEndpointToParamsDiv(paramsObj, paramsDiv) {
  paramsDiv.style.display = 'block';
  let paramsElement = document.createElement('div');
  paramsElement.className = 'params';

  let paramsName = document.createElement('p');
  let paramsText = document.createElement('p');

  paramsName.className = 'params-name';
  paramsText.className = 'params-text';

  paramsText.textContent = paramsObj;

  paramsElement.appendChild(paramsName);
  paramsElement.appendChild(paramsText);

  paramsDiv.appendChild(paramsElement);
}

// Utility Functions
async function getCurrentTabDomain() {
  const queryOptions = { active: true, currentWindow: true };
  const tabs = await chrome.tabs.query(queryOptions);
  if (tabs.length > 0) {
    let url = new URL(tabs[0].url);
    return url.hostname;
  }
  return null;
}

async function getDomainData(domain) {
  return new Promise(resolve => {
    chrome.storage.local.get([domain], result => {
      resolve(result[domain]);
    });
  });
}

async function setDomainData(domain, data) {
  return new Promise(resolve => {
    chrome.storage.local.set({ [domain]: data }, () => {
      resolve();
    });
  });
}

function displayNoDataFound(element, dataType) {
  element.innerHTML = '<img class="nothing-found" src="imgs/7486754.png" >'
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
}

function displayDataContainer() {
  document.getElementById('data-container').style.display = "block";
  document.getElementById('start-container').style.display = "none";
  document.getElementById('footer').style.display = "flex";
}

function displayStartContainer() {
  document.getElementById('data-container').style.display = "none";
  document.getElementById('start-container').style.display = "block";
  document.getElementById('footer').style.display = "none";
}

