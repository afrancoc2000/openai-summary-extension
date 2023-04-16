const button = document.querySelector("button");
const actionsDiv = document.querySelector(".mdl-card__actions");
const wordCountMessage = document.querySelector("#wordCount");
const readTimeMessage = document.querySelector("#readTime");
const summaryMessage = document.querySelector("#summary");
const wordMatchRegExp = /[^\s]+/g;
const chatContext =
  "You are a reader assistant that provides summaries for articles.";
const chatQuery =
  "Provide a summary of the text below that captures its main idea.";
const contextTokens = 50;
const reservedTokens = 200;
const maxTokensMap = {
  "code-davinci-002": 8001,
  "text-davinci-003": 4097,
  "gpt-3.5-turbo-0301": 4096,
  "gpt-3.5-turbo": 4096,
  "gpt-35-turbo-0301": 4096,
  "gpt-4-0314": 8192,
  "gpt-4-32k-0314": 8192,
};

var words = [];
var wordCount = 0;
var text = "";
var config = {};

actionsDiv.style.display = "none";

chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {
    if (response && response.article) {
      words = [...response.text.matchAll(wordMatchRegExp)];
      wordCount = words.length;
      text = response.text;
      fillBasicInfo();
      actionsDiv.style.display = "block";

      getConfig((extConfig) => {
        config = extConfig;
        const maxTokens = getMaxTokens(text, config.deployment);
        if (maxTokens <= reservedTokens) {
          summaryMessage.textContent =
            "This article would use more than the max tokens allowed, so, if you choose to generate the summary, only the first part of the article will be summarized.";
        }
      });
    } else {
      wordCountMessage.textContent = "No article in this page";
    }
  });
});

button.addEventListener("click", async () => {
  fillOpenAIInfo();
});

function fillBasicInfo() {
  const readingTime = Math.round(wordCount / 200);
  wordCountMessage.textContent = `The article 📄 has ${wordCount} words.`;
  readTimeMessage.textContent = `It takes ⏱️ ${readingTime} min to read it.`;
}

function fillOpenAIInfo() {
  summaryMessage.textContent = "Generating summary...";
  queryOpenAI(text, config, (response) => {
    summaryMessage.textContent = response;
  });
}

function getConfig(sendResponse) {
  chrome.storage.sync.get(
    {
      apiKey: "",
      endpoint: "",
      deployment: "",
      maxTokens: "0",
      temperature: "0",
    },
    (items) => {
      sendResponse(items);
    }
  );
}

function queryOpenAI(text, config, sendResponse) {
  const maxTokens = getMaxTokens(text, config.deployment);
  var analysisText = text;
  var initText = "";
  if (maxTokens <= reservedTokens) {
    analysisText = getFirstXWords(
      text,
      wordCount - Math.round((reservedTokens - maxTokens) / 1.5)
    );
    initText =
      "*** This article would use more than the max tokens allowed, so only the first part of the article was summarized. *** \n";
  }

  buildQuery(analysisText, config)
    .then((response) => response.json())
    .then((jsonData) => sendResponse(processOpenAIResponse(jsonData, initText)))
    .catch((error) => sendResponse(error));
}

function getFirstXWords(text, count) {
  var newText = text.split(/\s+/).slice(0, count).join(" ");
  console.log("new text: " + newText);
  return newText;
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  } else {
    return Promise.reject(
      new Error("We're sorry, OpenAI returned an error " + response.statusText)
    );
  }
}

function getMaxTokens(text, deployment) {
  const words = [...text.matchAll(wordMatchRegExp)];
  const wordCount = words.length;
  const maxTokens =
    maxTokensMap[deployment] - contextTokens - Math.round(wordCount * 1.5);
  return maxTokens;
}

function queryOpenAICompletion(text, config) {
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

function queryOpenAIChat(text, config) {
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

function buildQuery(text, config) {
  if (
    config.deployment === "code-davinci-002" ||
    config.deployment === "text-davinci-003"
  ) {
    return queryOpenAICompletion(text, config);
  } else {
    return queryOpenAIChat(text, config);
  }
}

function processOpenAIResponse(response, initText) {
  if (response.error) {
    return response.error.message;
  }

  const choice = response.choices[0];
  if (choice.text) {
    return initText + choice.text;
  } else {
    return initText + choice.message.content;
  }
}
