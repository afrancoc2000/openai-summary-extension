'use strict';

import './options.css';

const statusDiv = document.getElementById("status") as HTMLElement;

const apiKeyInput = document.getElementById("apiKey") as HTMLInputElement;
const endpointInput = document.getElementById("endpoint") as HTMLInputElement;
const deploymentInput = document.getElementById("deployment") as HTMLInputElement;
const temperatureInput = document.getElementById("temperature") as HTMLInputElement;
const apiVersionInput = document.getElementById("apiVersion") as HTMLInputElement;
const chunkSizeInput = document.getElementById("chunkSize") as HTMLInputElement;
const chunkOverlapInput = document.getElementById("chunkOverlap") as HTMLInputElement;

const timeout = 3000;

// Define the options interface
interface ExtensionOptions {
    apiKey: string;
    endpoint: string;
    deployment: string;
    temperature: number;
    apiVersion: string;
    chunkSize: number;
    chunkOverlap: number;
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
                deploymentInput.value = result.deployment;
                temperatureInput.value = result.temperature;
                apiVersionInput.value = result.apiVersion;
                chunkSizeInput.value = result.chunkSize;
                chunkOverlapInput.value = result.chunkOverlap;
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
        temperature: Number(temperatureInput.value),
        apiVersion: apiVersionInput.value,
        chunkSize: Number(chunkSizeInput.value),
        chunkOverlap: Number(chunkOverlapInput.value),
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

    if (isNaN(options.chunkSize) || options.chunkSize < 0) {
        statusDiv.textContent = "The chunk size must be a number bigger than 0";
        setTimeout(() => {
            statusDiv.textContent = "";
        }, timeout);
        return Promise.resolve();
    }

    if (isNaN(options.chunkOverlap) || options.chunkOverlap < 0) {
        statusDiv.textContent = "The chunk overlap must be a number bigger than 0";
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
