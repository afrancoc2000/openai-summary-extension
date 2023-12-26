'use strict';

import { ExtensionOptions } from './options';
import './popup.css';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { loadSummarizationChain } from "langchain/chains";
import { PromptTemplate } from 'langchain/prompts';

(function () {

  const button = document.querySelector("button") as HTMLElement;
  const actionsDiv = document.querySelector(".mdl-card__actions") as HTMLElement;
  const wordCountMessage = document.querySelector("#wordCount") as HTMLElement;
  const readTimeMessage = document.querySelector("#readTime") as HTMLElement;
  const summaryMessage = document.querySelector("#summary") as HTMLElement;
  const warningMessage = document.querySelector("#warning") as HTMLElement;
  const wordMatchRegExp = /[^\s]+/g;

  const wordsPerMinute = 200;

  var article = "";
  var extOptions: ExtensionOptions = {
    apiKey: "",
    endpoint: "",
    deployment: "",
    temperature: 0,
    apiVersion: "",
    chunkSize: 0,
    chunkOverlap: 0,
  };

  actionsDiv.style.display = "none";
  warningMessage.style.display = "none";

  function fillBasicInfo(wordCount: number) {
    const readingTime = Math.round(wordCount / wordsPerMinute);
    wordCountMessage!.textContent = `The article 📄 has ${wordCount} words.`;
    readTimeMessage!.textContent = `It takes ⏱️ ${readingTime} min to read it.`;
  }

  function fillOpenAIInfo() {
    summaryMessage.textContent = "Generating summary...";
    queryOpenAILangChain(article, extOptions)
      .then((response: string) => {
        summaryMessage.textContent = response;
      })
      .catch((error: any) => {
        console.error("Error generating summary:", error);
        summaryMessage.textContent = "Error generating summary. Please try again.";
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

  async function queryOpenAILangChain(text: string, config: ExtensionOptions): Promise<string> {
    const llm = new ChatOpenAI({
      azureOpenAIApiKey: config.apiKey,
      azureOpenAIBasePath: `${config.endpoint}/openai/deployments/`,
      azureOpenAIApiVersion: config.apiVersion,
      azureOpenAIApiDeploymentName: config.deployment,
      temperature: config.temperature,
    });

    const numTokens = await llm.getNumTokens(article);
    console.log(`This article will use ${numTokens} tokens`);

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: config.chunkSize, chunkOverlap: config.chunkOverlap });
    const docs = await splitter.createDocuments([text]);

    const promptTemplate = `Write a concise summary of the following:
    {text}
    CONCISE SUMMARY:`;
    const prompt = PromptTemplate.fromTemplate(promptTemplate);

    const refineTemplate = `Your job is to produce a final summary\n
    We have provided an existing summary up to a certain point: {existing_answer}\n
    We have the opportunity to refine the existing summary
    (only if needed) with some more context below.\n
    ------------\n
    {text}\n
    ------------\n
    Given the new context, refine the original summary about 120 words
    If the context isn't useful, return the original summary.`;
    const refinePrompt = PromptTemplate.fromTemplate(refineTemplate);

    const chain = loadSummarizationChain(llm, {
      type: "refine",
      questionPrompt: prompt,
      refinePrompt: refinePrompt,
    });

    const response = await chain.run(docs);
    return response;
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
