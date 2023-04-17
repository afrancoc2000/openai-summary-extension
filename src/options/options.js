// Saves options to chrome.storage
const saveOptions = () => {
  const status = document.getElementById("status");
  const apiKey = document.getElementById("apiKey").value;
  const endpoint = document.getElementById("endpoint").value;
  const deployment = document.getElementById("deployment").value;
  const maxTokens = document.getElementById("maxTokens").value;
  const temperature = document.getElementById("temperature").value;
  const timeout = 3000;

  if (
    isNaN(temperature) ||
    Number(temperature) < 0 ||
    Number(temperature) > 1
  ) {
    status.textContent = "Temperature must be a number between 0 and 1.";
    setTimeout(() => {
      status.textContent = "";
    }, timeout);
    return;
  }

  if (
    isNaN(maxTokens) ||
    parseInt(maxTokens) < 0 
  ) {
    status.textContent = "The Max Tokens must be a number bigger than 0";
    setTimeout(() => {
      status.textContent = "";
    }, timeout);
    return;
  }

  chrome.storage.sync.set(
    {
      apiKey: apiKey,
      endpoint: endpoint,
      deployment: deployment,
      maxTokens: maxTokens,
      temperature: temperature,
    },
    () => {
      // Update status to let user know options were saved.
      status.textContent = "Options saved.";
      setTimeout(() => {
        status.textContent = "";
      }, timeout);
    }
  );
};

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
const restoreOptions = () => {
  chrome.storage.sync.get(
    {
      apiKey: "",
      endpoint: "",
      deployment: "",
      maxTokens: "0",
      temperature: "0",
    },
    (items) => {
      document.getElementById("apiKey").value = items.apiKey;
      document.getElementById("endpoint").value = items.endpoint;
      document.getElementById("maxTokens").value = items.maxTokens;
      document.getElementById("temperature").value = items.temperature;

      for (option of document.getElementById("deployment").options) {
        if (option.value === items.deployment) {
          option.selected = true;
          break;
        }
      }
    }
  );
};

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
