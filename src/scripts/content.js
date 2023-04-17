chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const article = document.querySelector("article");
  if (article) {
    sendResponse({ article: true, text: article.innerText });
  } else {
    sendResponse({ article: false, text: null });
  }
});
