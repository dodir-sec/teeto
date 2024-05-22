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

  await getDomainData(baseUrl);

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
    return inputString.replace(/^(http:\/\/|https:\/\/)/, "");
  }

  function fetchAndTestRegex(scriptSrc) {
    fetch(scriptSrc)
      .then(response => response.text())
      .then(scriptContent => {
        regexList.forEach(regex => {
          const matches = scriptContent.matchAll(regex);
          for (const match of matches) {
            if (!isItSlashe(match[0]) && baseUrl !== match[0]) addPath(match[0], scriptSrc);
          }
        });
      })
      .catch(error => console.log("An error occurred: ", error));
  }

  for (let script of scripts) {
    if (script.src) {
      fetchAndTestRegex(script.src);
    }
  }

  getFormsParams();

  function getFormsParams() {
    let parser = new DOMParser().parseFromString(pageContent, "text/html");
    let forms = parser.getElementsByTagName('form');

    Array.from(forms).forEach(form => {
      Array.from(form.elements).forEach(element => {
        if (element.type !== 'submit' && element.name) {
          let paramName = element.name;
          if (!paramNameSet.includes(paramName)) paramNameSet.push(paramName);
        }
      });
    });

    regexList.forEach(regex => {
      const matches = pageContent.matchAll(regex);
      for (const match of matches) {
        addPath(match[0], 'HTML');
      }
    });
  }

  function getUrlParams(url) {
    const paramsRegex = /[?&]([^=&]+)(?:=([^&]*))?/g;
    let match;
    while ((match = paramsRegex.exec(url)) !== null) {
      const paramName = decodeURIComponent(match[1]);
      if (!paramNameSet.includes(paramName)) paramNameSet.push(paramName);
    }
  }

  async function getDomainData(domain) {
    try {
      let result = await browser.storage.local.get(domain);
      pathResults = new Set(result[domain]?.endpoints || []);
      paramNameSet = result[domain]?.params || [];
    } catch (error) {
      console.error("Failed to retrieve domain data: ", error);
    }
  }

  setTimeout(() => {
    const curRef = window.location.href;
    getUrlParams(curRef);
    browser.runtime.sendMessage({ action: "returnResults", data: Array.from(pathResults), params: paramNameSet });
  }, 3000);
})();

function deleteTrailingSlashes(url) {
  return url.replace(/[\/?_\.]+$/, '');
}

function isItSlashe(url) {
  return /^[\/\\]+$/.test(url);
}

function extractDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}
