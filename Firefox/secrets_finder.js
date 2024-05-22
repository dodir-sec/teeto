(function () {
  const scripts = document.getElementsByTagName("script");
  const secretsRegex = [
    { "Slack Token": "(xox[p|b|o|a]-[0-9]{12}-[0-9]{12}-[0-9]{12}-[a-z0-9]{32})" },
    { "Amazon MWS Auth Token": "amzn\\.mws\\.[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}" },
    { "AWS API Key": "AKIA[0-9A-Z]{16}" },
    { "Facebook Access Token": "EAACEdEose0cBA[0-9A-Za-z]+" },
    { "Facebook OAuth": "[f|F][a|A][c|C][e|E][b|B][o|O][o|O][k|K].*['|\"][0-9a-f]{32}['|\"]" },
    { "Generic API Key": "[a|A][p|P][i|I][_]?[k|K][e|E][y|Y].*['|\"][0-9a-zA-Z]{32},45}['|\"]" },
    { "Google API Key": "AIza[0-9A-Za-z\\-_]{35}" },
    { "Google User Content API Key": "[0-9]+-[0-9A-Za-z_]{32}\\.apps\\.googleusercontent\\.com" },
    { "Google OAuth Access Token": "ya29\\.[0-9A-Za-z\\-_]+" },
    { "Heroku API Key": "[h|H][e|E][r|R][o|O][k|K][u|U].*[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}" },
    { "PayPal Braintree Access Token": "access_token\\$production\\$[0-9a-z]{16}\\$[0-9a-f]{32}" },
    { "Stripe API Key": "sk_live_[0-9a-zA-Z]{24}" },
    { "Stripe Restricted API Key": "rk_live_[0-9a-zA-Z]{24}" },
    { "Twitter Access Token": "[t|T][w|W][i|I][t|T][t|T][e|E][r|R].*[1-9][0-9]+-[0-9a-zA-Z]{40}" },
    { "Twitter OAuth": "[t|T][w|W][i|I][t|T][t|T][e|E][r|R].*['|\"][0-9a-zA-Z]{35},44}['|\"]" }
  ]
  const baseUrl = extractDomain(window.location.origin)
  const pageContent = document.documentElement.outerHTML;
  let secretsResults = new Set;


  getDomainData(baseUrl)
  function addSecret(secretToAdd) {
    if (!isExist(secretToAdd.secret)) {
      secretsResults.add({ name: secretToAdd.name, secret: secretToAdd.secret });
    }
  }

  function fetchAndTestRegex(scriptSrc) {
    fetch(scriptSrc)
      .then(response => response.text())
      .then(scriptContent => {
        secretsRegex.forEach(regex => {
          const pattern = new RegExp(Object.values(regex)[0], 'g');
          const key = Object.keys(regex)[0];
          const matches = scriptContent.matchAll(pattern);
          for (const match of matches) {
            addSecret({ name: key, secret: match[0] });
          }
        });
      })
      .catch(error => {
        console.error("An error occurred while fetching:", scriptSrc, error);
      });
  }

  for (let script of scripts) {
    if (script.src) {
      fetchAndTestRegex(script.src);
    }
  }

  secretsRegex.forEach(regex => {
    const pattern = new RegExp(Object.values(regex)[0], 'g');
    const key = Object.keys(regex)[0];
    const matches = pageContent.matchAll(pattern);
    for (const match of matches) {
      addSecret({ name: key, secret: match[0] });
    }
  });

  function isExist(secret) {
    return Array.from(secretsResults).some(result => result.secret === secret);
  }

  function writeResults() {
    const output = Array.from(secretsResults).sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    return output;
  }

  new Promise(resolve => setTimeout(resolve, 3000)).then(() => {
    browser.runtime.sendMessage({ action: "returnSecrets", data: writeResults() });
  });


  async function getDomainData(domain) {
    return new Promise(resolve => {
      browser.storage.local.get([domain], result => {
        secretsResults =  new Set(result[domain].secrets)
        resolve(result[domain]);
      });
    });
  }

})();

function extractDomain(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return null;
  }
}


