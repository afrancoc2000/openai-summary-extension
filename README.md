# Summary Assistant for Articles 

This browser extension helps users generate summaries for articles found on web pages. It calculates the word count and reading time of an article, and then uses OpenAI to generate a concise summary of the text. The extension displays the word count, reading time, and generated summary in a popup. 

## Installation 

- Clone the code from the source repository.
- Follow the instructions given by your browser, pointing to the src folder:
    - Microsoft Edge: https://learn.microsoft.com/en-us/microsoft-edge/extensions-chromium/getting-started/extension-sideloading
    - Chrome: https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked

## Usage 

- Navigate to a web page containing an article you want to summarize.
- Click the extension icon in the browser toolbar to open the popup.
- The popup will display the word count and estimated reading time of the article.
Click the "Generate summary" button to create a summary using OpenAI. Note that this action may incur costs depending on your OpenAI API usage.
- The generated summary will be displayed in the popup.
- If the article is too long and exceeds the maximum token limit for the OpenAI API, a warning message will be displayed, and only the first part of the article will be summarized. 

Note: The extension requires an OpenAI API key, deployment, and endpoint to work correctly. Make sure to set these values in the extension's options.