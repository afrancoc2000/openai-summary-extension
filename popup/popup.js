const button = document.querySelector("button");
const wordCountMessage = document.querySelector("#wordCount");
const readTimeMessage = document.querySelector("#readTime");
const summaryMessage = document.querySelector("#summary");
const wordMatchRegExp = /[^\s]+/g;

button.addEventListener("click", async () => {
  wordCountMessage.textContent = "Generating summary...";

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {}, function (response) {
      if (response && response.article) {
        const words = response.text.matchAll(wordMatchRegExp);
        const wordCount = [...words].length;
        const readingTime = Math.round(wordCount / 200);
        wordCountMessage.textContent = `The article 📄 has ${wordCount} words.`;
        readTimeMessage.textContent = `It takes ⏱️ ${readingTime} min to read it.`;
      } else {
        wordCountMessage.textContent = "No article in this page";
      }
    });
  });
});
