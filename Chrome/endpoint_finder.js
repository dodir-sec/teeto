(async function () {

  let paramNameSet = [];
  let pathResults = new Set;

  let scripts = document.getElementsByTagName("script");
  let pageContent = document.documentElement.outerHTML;
  let regex1 = /(?<=(\"|\'|\`))\/[a-zA-Z0-9_?&=\/\-\#\.]*(?=(\"|\'|\`))/g;
  let regex2 = /^(http|https):\/\/[^ "]+$/g;
  let regex3 = /^(http|https):\/\/[^\s/$.?#].[^\s]*$/ig;

  let regexList = [regex1, regex2, regex3];

  const baseUrl = extractDomain(window.location.origin)
  const nodeModulesRegex = /node_modules/;

await getDomainData(baseUrl)

  function addPath(path, source) {
    let absoluteUrl = path.startsWith('/') ? baseUrl + path : path;
    getUrlParams(absoluteUrl)
    absoluteUrl = deleteTrailingSlashes(absoluteUrl)
    const exists = Array.from(pathResults).some(result => removeHttpOrHttps(result.endpoint) === removeHttpOrHttps(absoluteUrl));
    if (!nodeModulesRegex.test(absoluteUrl) && !exists) {
      pathResults.add({ endpoint: window.location.protocol+'//'+absoluteUrl, source: source });
    }
  }

  function removeHttpOrHttps(inputString) {
    // Check if the string contains "http://" and remove it
    if (inputString.includes("http://")) {
      inputString = inputString.replace("http://", "");
    }
  
    // Check if the string contains "https://" and remove it
    if (inputString.includes("https://")) {
      inputString = inputString.replace("https://", "");
    }
  
    return inputString;
  }

  function fetchAndTestRegex(scriptSrc) {
    fetch(scriptSrc)
      .then(function (response) {
        return response.text()
      })
      .then(function (scriptContent) {
        for (let regex of regexList) {
          var matches = scriptContent.matchAll(regex);

          for (const match of matches) {
            const isSlash = isItSlashe(match[0])
            if (!isSlash && baseUrl !== match[0]) addPath(match[0], scriptSrc);
          }

        }
      })
      .catch(function (error) {
        console.log("An error occurred: ", error)
      });
  }

  for (let i = 0; i < scripts.length; i++) {
    let scriptSrc = scripts[i].src;
    if (scriptSrc != "") {
      fetchAndTestRegex(scriptSrc);
    }
  }

  // Get params from HTML forms & inputs
  getFormsParams()
  function getFormsParams() {
    let parser = new DOMParser().parseFromString(pageContent, "text/html");
    let forms = parser.getElementsByTagName('form');

    for (let i = 0; i < forms.length; i++) {
      const form = forms[i];
      const formElements = form.elements;

      for (let j = 0; j < formElements.length; j++) {
        const element = formElements[j];

        if (element.type !== 'submit' && !!element.name) {
          let paramName = element.name
          !paramNameSet.some(param => param === paramName) && paramNameSet.push(paramName);
        }
      }
    }

    for (let regex of regexList) {
      var matches = pageContent.matchAll(regex);
      for (const match of matches) {
        addPath(match[0], 'HTML');
      }
    }
  }

  // Get params from urls
  function getUrlParams(url) {
    const paramsRegex = /[?&]([^=&]+)(?:=([^&]*))?/g;
    let match;

    while ((match = paramsRegex.exec(url)) !== null) {
      const paramName = decodeURIComponent(match[1]);
      if (!!paramName && !paramNameSet.some(param => param === paramName)) paramNameSet.push(paramName);
    }
  }

  function writeResults() {
    const output = Array.from(pathResults).sort(function (a, b) {
      return a.endpoint.localeCompare(b.endpoint);
    });
    return output;
  }

  async function getDomainData(domain) {
    return new Promise(resolve => {
      chrome.storage.local.get([domain], result => {
        pathResults = new Set(result[domain].endpoints)
        paramNameSet = result[domain].params
        resolve(result[domain]);
      });
    });
  }

  new Promise(resolve => setTimeout(resolve, 3e3)).then(() =>{
    const curRef=  window.location.href
    getUrlParams(curRef)
    chrome.runtime.sendMessage({ action: "returnResults", data: writeResults(), params: paramNameSet })})
})();

function deleteTrailingSlashes(url) {
  if (!url) return url;
  if (
    url.charAt(url.length - 1) === '/' ||
    url.charAt(url.length - 1) === '?' ||
    url.charAt(url.length - 1) === '_' ||
    url.charAt(url.length - 1) === '.'
  ) {
    return deleteTrailingSlashes(url.slice(0, -1));
  }
  return url;
}

function isItSlashe(url) {
  const regex = /^[\/\\]+$/;
  return regex.test(url);
}

function extractDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    // Handle error appropriately
    return null;
  }
}

