'use strict';

import './options.css';

const statusDiv = document.getElementById("status") as HTMLElement;

const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const endpointInput = document.getElementById("endpoint") as HTMLInputElement;
const deploymentInput = document.getElementById("deployment") as HTMLInputElement;
const maxTokensInput = document.getElementById("maxTokens") as HTMLInputElement;
const temperatureInput = document.getElementById("temperature") as HTMLInputElement;

const timeout = 3000;

// Define the options interface
interface ExtensionOptions {
    apiKey: string;
    endpoint: string;
    deployment: string;
    maxTokens: number;
    temperature: number;
}

// Get the saved options from storage
function restoreOptions(): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (result) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                apiKeyInput.value = result.apiKey;
                endpointInput.value = result.endpoint;
                maxTokensInput.value = result.maxTokens;
                temperatureInput.value = result.temperature;
                deploymentInput.value = result.deployment;
                resolve();
            }
        });
    });
}

// Save the options to storage
function saveOptions(): Promise<void> {
    let options: ExtensionOptions = {
        apiKey: apiKeyInput.value,
        endpoint: endpointInput.value,
        deployment: deploymentInput.value,
        maxTokens: Number(maxTokensInput.value),
        temperature: Number(temperatureInput.value),
    };

    if (
        isNaN(options.temperature) ||
        Number(options.temperature) < 0 ||
        Number(options.temperature) > 1
    ) {
        statusDiv.textContent = "Temperature must be a number between 0 and 1.";
        setTimeout(() => {
            statusDiv.textContent = "";
        }, timeout);
        return Promise.resolve();
    }

    if (
        isNaN(options.maxTokens) || options.maxTokens < 0) {
        statusDiv.textContent = "The Max Tokens must be a number bigger than 0";
        setTimeout(() => {
            statusDiv.textContent = "";
        }, timeout);
        return Promise.resolve();
    }


    return new Promise((resolve, reject) => {
        chrome.storage.sync.set(options, () => {
            if (chrome.runtime.lastError) {
                // Update status to let user know options were saved.
                statusDiv.textContent = `There was an error saving the options: ${chrome.runtime.lastError.message}.`;
                setTimeout(() => {
                    statusDiv.textContent = "";
                }, timeout);
                reject(chrome.runtime.lastError);
            } else {
                // Update status to let user know options were saved.
                statusDiv.textContent = "Options saved.";
                setTimeout(() => {
                    statusDiv.textContent = "";
                }, timeout);
                resolve();
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save")!.addEventListener("click", saveOptions);

// Export the functions
export { ExtensionOptions };
