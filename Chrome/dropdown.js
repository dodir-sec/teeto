document.addEventListener('DOMContentLoaded', async function () {
  initializeDropdowns(['dropdown-1', 'dropdown-2', 'dropdown-3']);
  const domain = await getCurrentDomain();
  setupDomainSpecificListeners(domain);
});

async function getCurrentDomain() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length === 0 || !tabs[0].url) {
        console.error('Error: No active tab found.');
        reject('No active tab found.');
        return;
      }
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      resolve(domain);
    });
  });
}


function initializeDropdowns(dropdownIds) {
  dropdownIds.forEach(id => {
    const dropdown = document.getElementById(id);
    if (dropdown) initializeDropdown(dropdown);
  });
}

async function setupDomainSpecificListeners(domain) {
  try {
    const result = await getChromeStorage(domain);
    const domainData = result[domain];
    if (!domainData) {
      console.error(`No data found for domain: ${domain}`);
      return;
    }

    // Setup event listeners for domain-specific actions
    removeExistingListeners();

    document.getElementById('copy-all').addEventListener('click', () => copyData(domainData.endpoints, e => e.endpoint));
    document.getElementById('export-all').addEventListener('click', () => exportData(domainData.endpoints, ["Endpoint", "Source"], e => [e.endpoint, e.source]));
    document.getElementById('export-all-secrets').addEventListener('click', () => exportData(domainData.secrets, ["Name", "Secret"], e => [e.name, e.secret]));
    document.getElementById('copy-all-params').addEventListener('click', () => copyToClipboard(domainData.params.join('\n')));
    document.getElementById('copy-params-query').addEventListener('click', () => copyParamsAsQuery(domainData.params));
    document.getElementById('open-all-urls').addEventListener('click', () => openAllUrls(domainData.endpoints));
    //Suppoused to be in popup.js TODO: fix
    document.getElementById('download-all-data').addEventListener('click', () => {
      const data = {
        endpoints: domainData.endpoints,
        secrets: domainData.secrets,
        params: domainData.params
      };
      downloadAllDataInXlsx(data, domain);
    }
    );
  } catch (error) {
    console.error(error);
  }
}

function downloadAllDataInXlsx(data, domainName) {
  // Create a new workbook
  let workbook = XLSX.utils.book_new();

  // Add a sheet for each data type
  if (data.endpoints && data.endpoints.length > 0) {
    let wsEndpoints = XLSX.utils.json_to_sheet(data.endpoints);
    XLSX.utils.book_append_sheet(workbook, wsEndpoints, 'Endpoints');
  }

  if (data.secrets && data.secrets.length > 0) {
    let wsSecrets = XLSX.utils.json_to_sheet(data.secrets);
    XLSX.utils.book_append_sheet(workbook, wsSecrets, 'Secrets');
  }

  if (data.params && data.params.length > 0) {
    // Converting params to a format suitable for SheetJS
    let paramsFormatted = data.params.map(param => ({ Param: param }));
    let wsParams = XLSX.utils.json_to_sheet(paramsFormatted);
    XLSX.utils.book_append_sheet(workbook, wsParams, 'Params');
  }

  // Generate and save the file
  const fileName = `${domainName}-data.xlsx`; // Use the domain name in the file name
  XLSX.writeFile(workbook, fileName);
}

async function getChromeStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

function openAllUrls(endpoints) {
  if (!endpoints || !Array.isArray(endpoints)) {
    console.error('Endpoints are not available or not in expected format.');
    return;
  }
  endpoints.forEach(endpoint => {
    chrome.tabs.create({ url: endpoint.endpoint });
  }
  );
}

function removeExistingListeners() {
  const elements = ['copy-all', 'export-all', 'export-all-secrets', 'copy-all-params', 'copy-params-query'];
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      const newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);
    }
  });
}

function initializeDropdown(dropdown) {
  const selectedOption = dropdown.querySelector('.selected-option');
  const optionsContainer = dropdown.querySelector('.options-container');

  selectedOption.addEventListener('click', event => {
    optionsContainer.style.display = optionsContainer.style.display === 'block' ? 'none' : 'block';
    event.stopPropagation();
  });

  document.addEventListener('click', event => {
    if (!dropdown.contains(event.target)) {
      optionsContainer.style.display = 'none';
    }
  });
}

function copyData(dataArray, mapFunction) {
  if (!dataArray) {
    console.error(`Data not found`);
    return;
  }
  const text = dataArray.map(mapFunction).join('\n');
  copyToClipboard(text);
}

function exportData(dataArray, headers, mapFunction) {
  if (!dataArray) {
    console.error(`Data not found`);
    return;
  }
  let csvContent = headers.join(",") + "\n";
  dataArray.forEach(item => {
    csvContent += mapFunction(item).join(",") + "\n";
  });
  saveAs(new Blob([csvContent], { type: "text/csv;charset=utf-8" }), 'export.csv');
}

function copyParamsAsQuery(params) {
  if (!params || !Array.isArray(params)) {
    console.error('Params are not available or not in expected format.');
    return;
  }
  const queryString = params.map((param, index) => `${encodeURIComponent(param)}=TEETO${index + 1}`).join('&');
  copyToClipboard(queryString);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    document.getElementById('copy-msg').style.display = 'flex';
    setTimeout(() => document.getElementById('copy-msg').style.display = 'none', 1000);
  }).catch(error => console.error('Error copying text: ', error));
}

function saveAs(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
