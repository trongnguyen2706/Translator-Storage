console.log('[Vocab] background script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Vocab] message received:', msg)
    sendResponse({ status: 'ok' })
    return true
})