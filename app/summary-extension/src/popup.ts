'use strict';

import { ExtensionOptions } from './options';
import './popup.css';

(function () {

  const button = document.querySelector("button") as HTMLElement;
  const actionsDiv = document.querySelector(".mdl-card__actions") as HTMLElement;
  const wordCountMessage = document.querySelector("#wordCount") as HTMLElement;
  const readTimeMessage = document.querySelector("#readTime") as HTMLElement;
  const summaryMessage = document.querySelector("#summary") as HTMLElement;
  const warningMessage = document.querySelector("#warning") as HTMLElement;
  const wordMatchRegExp = /[^\s]+/g;
  const chatContext = "You are a reader assistant that provides summaries for articles.";
  const chatQuery = "Provide a summary of the text below that captures its main idea.";

  const contextTokens = 50;
  const reservedTokens = 200;
  const tokensPerWord = 1.5;
  const wordsPerMinute = 200;
  const maxTokensMap: Map<string, number> = new Map([
    ['code-davinci-002', 8001],
    ['text-davinci-003', 4097],
    ['gpt-3.5-turbo-0301', 4096],
    ['gpt-3.5-turbo', 4096],
    ['gpt-35-turbo-0301', 4096],
    ['gpt-4-0314', 8192],
    ['gpt-4-32k-0314', 8192],
  ]);

  var wordCount = 0;
  var article = "";
  var extOptions: ExtensionOptions = {
    apiKey: "",
    endpoint: "",
    deployment: "",
    maxTokens: 0,
    temperature: 0,
  };
  var displayWarning = false;

  actionsDiv.style.display = "none";
  warningMessage.style.display = "none";

  function fillBasicInfo(wordCount: number) {
    const readingTime = Math.round(wordCount / wordsPerMinute);
    wordCountMessage!.textContent = `The article 📄 has ${wordCount} words.`;
    readTimeMessage!.textContent = `It takes ⏱️ ${readingTime} min to read it.`;
  }

  function fillOpenAIInfo() {
    summaryMessage.textContent = "Generating summary...";
    queryOpenAI(article, extOptions, (response: string) => {
      if (displayWarning) warningMessage.style.display = "block";
      summaryMessage.textContent = response;
    });
  }

  function getConfig(): Promise<ExtensionOptions> {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result as ExtensionOptions);
        }
      });
    });
  }

  function queryOpenAI(text: string, config: ExtensionOptions, sendResponse: (response: string) => void) {
    const maxTokens = getMaxTokens(text, config.deployment);
    var analysisText = text;
    if (maxTokens <= reservedTokens) {
      analysisText = getFirstXWords(
        text,
        wordCount - Math.round((reservedTokens - maxTokens) / tokensPerWord)
      );
      displayWarning = true;
    }

    buildQuery(analysisText, config)
      .then((response) => response.json())
      .then((jsonData) => sendResponse(processOpenAIResponse(jsonData)))
      .catch((error) => sendResponse(error));
  }

  function getFirstXWords(text: string, count: number) {
    var newText = text.split(/\s+/).slice(0, count).join(" ");
    console.log("new text: " + newText);
    return newText;
  }

  function getMaxTokens(text: string, deployment: string) {
    const words = [...text.matchAll(wordMatchRegExp)];
    const wordCount = words.length;
    const deploymentMaxTokens = maxTokensMap.get(deployment) ? maxTokensMap.get(deployment)! : 0;
    const maxTokens = deploymentMaxTokens - contextTokens - Math.round(wordCount * tokensPerWord);
    return maxTokens;
  }

  function queryOpenAICompletion(text: string, config: ExtensionOptions) {
    const data = {
      prompt: `${chatContext}\n${chatQuery}\n${text}`,
      max_tokens: getMaxTokens(text, config.deployment),
      temperature: Number(config.temperature),
      frequency_penalty: 0,
      presence_penalty: 0,
      top_p: 1,
      best_of: 1,
      stop: null,
    };

    return fetch(
      `${config.endpoint}/openai/deployments/${config.deployment}/completions?api-version=2022-12-01`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": config.apiKey,
        },
        body: JSON.stringify(data),
      }
    );
  }

  function queryOpenAIChat(text: string, config: ExtensionOptions) {
    const data = {
      messages: [
        { role: "system", content: `${chatContext}` },
        { role: "user", content: `${chatQuery}\n${text}` },
      ],
      max_tokens: getMaxTokens(text, config.deployment),
      temperature: Number(config.temperature),
      frequency_penalty: 0,
      presence_penalty: 0,
      top_p: 0.95,
      stop: null,
    };

    return fetch(
      `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=2023-03-15-preview`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": config.apiKey,
        },
        body: JSON.stringify(data),
      }
    );
  }

  function buildQuery(text: string, config: ExtensionOptions) {
    if (
      config.deployment === "code-davinci-002" ||
      config.deployment === "text-davinci-003"
    ) {
      return queryOpenAICompletion(text, config);
    } else {
      return queryOpenAIChat(text, config);
    }
  }

  function processOpenAIResponse(response: any) {
    if (response.error) {
      displayWarning = false;
      return response.error.message;
    }

    const choice = response.choices[0];
    if (choice.text) {
      return choice.text;
    } else {
      return choice.message.content;
    }
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id!, { type: 'ARTICLE' }, (response) => {
      if (response && response.article) {
        let words = [...response.article.matchAll(wordMatchRegExp)];
        let wordCount = words.length;
        article = response.article;
        fillBasicInfo(wordCount);
        actionsDiv.style.display = "block";

        getConfig().then((options) => {
          extOptions = options;
          const maxTokens = getMaxTokens(article, options.deployment);
          if (maxTokens <= reservedTokens) {
            summaryMessage.textContent =
              "This article would use more than the max tokens allowed, so, if you choose to generate the summary, only the first part of the article will be summarized.";
          }
        });
      }
      else {
        wordCountMessage.textContent = "No article in this page";
      }
    });
  });

  button.addEventListener("click", async () => {
    fillOpenAIInfo();
  });

})();
