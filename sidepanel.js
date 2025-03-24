document.addEventListener('DOMContentLoaded', () => {
    const summaryDiv = document.getElementById('summary');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].id) {
            chrome.runtime.sendMessage({ message: "get_page_content" }, function (response) {
                loadingDiv.style.display = 'none'; // Hide loading message
                if (response.summary) {
                    // Convert the summary to a bullet-point list
                    const summaryList = document.createElement('ul');
                    const summaryPoints = response.summary.split('\n'); // Assuming Gemini API returns each point on a new line
                    summaryPoints.forEach(point => {
                        if (!point) return; // Skip empty points
                        const listItem = document.createElement('li');
                        listItem.textContent = point.replace(/^\*\s*/, '');
                        summaryList.appendChild(listItem);
                    });
                    summaryDiv.appendChild(summaryList);
                } else if (response.error) {
                    errorDiv.textContent = response.error;
                    errorDiv.style.display = 'block';
                } else {
                    errorDiv.textContent = "An unknown error occurred.";
                    errorDiv.style.display = 'block';
                }
            });
        } else {
            loadingDiv.style.display = 'none';
            errorDiv.textContent = "Failed to retrieve the current webpage.";
            errorDiv.style.display = 'block';
        }
    });
});