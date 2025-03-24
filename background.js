// Listen for the extension icon to be clicked
chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// Create a context menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "summarizePage",
        title: "Summarize this page with Gemini",
        contexts: ["page"]
    });
});

// Listen for context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "summarizePage") {
        chrome.sidePanel.open({ windowId: tab.windowId });
    }
});

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.message === "get_page_content") {
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) { // Query for active tab
                if (tabs && tabs[0] && tabs[0].id) {
                    const activeTabId = tabs[0].id; // Get the active tab ID
                    // Execute script to extract text content directly from the page
                    chrome.scripting.executeScript({
                        target: { tabId: activeTabId }, // Use the queried active tab ID
                        function: () => {
                            return document.body.innerText;
                        }
                    },
                        (results) => {
                            if (results && results[0] && results[0].result) {
                                const pageContent = results[0].result;
                                // Call Gemini API and send the response
                                fetchSummary(pageContent)
                                    .then(summary => sendResponse({ summary: summary }))
                                    .catch(error => sendResponse({ error: error }));
                            } else {
                                sendResponse({ error: "Failed to get page content" });
                            }
                        });
                } else {
                    sendResponse({ error: "Could not get active tab ID." });
                }
            });
            return true;  // Important!  Indicates you want to send a response asynchronously
        }
    }
);

// Function to fetch the summary from Gemini API
async function fetchSummary(text) {
    // Replace with your actual Gemini API endpoint and API key
    const apiKey = 'AIzaSyAw29_Amdg5CLdc1J9KcKLttHbtMNKaMVs';
    // e.g., 'https://generative.googleapis.com/v1/models/gemini-pro:generateContent?key=' + apiKey;
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `請用中文重點摘要以下內容，每一項摘要一行，用純文字格式：\n${text}` }] }],
                safetySettings: [
                    {
                        "category": "HARM_CATEGORY_HARASSMENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_HATE_SPEECH",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ],
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        // Assuming the summary is in data.candidates[0].content.parts[0].text
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Invalid Gemini API response format");
        }
    } catch (error) {
        console.error("Error fetching summary:", error);
        throw error; // Re-throw to be handled in the side panel
    }
}