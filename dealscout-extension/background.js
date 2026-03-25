// background.js

const STAGE_COLORS = {
  "Due Diligence": "#800080", // Purple
  "LOI Sent": "#FF0000", // Red
  "Offer Made": "#FFA500", // Orange
  "Seller Call": "#FFD700", // Yellow
  "Broker Call": "#0000FF", // Blue
  "CIM/Financials Received": "#008000", // Green
  "POF Sent": "#FFA500", // Orange
  "Financials Requested": "#0000FF", // Blue
  "NDA Signed": "#FFD700", // Yellow
  NEW: "#CCCCCC", // Gray
};

const STAGE_PRECEDENCE = [
  "Due Diligence",
  "LOI Sent",
  "Offer Made",
  "Seller Call",
  "Broker Call",
  "CIM/Financials Received",
  "POF Sent",
  "Financials Requested",
  "NDA Signed",
  "NEW",
];

function getHighestStage(crmData) {
  if (!crmData) return "NEW";
  for (let stage of STAGE_PRECEDENCE) {
    if (crmData[stage]) return stage;
  }
  return "NEW";
}

function updateIcon(tabId, color) {
  // Create a dynamic icon using OffscreenCanvas
  const canvas = new OffscreenCanvas(16, 16);
  const ctx = canvas.getContext("2d");

  // Draw a circle with the color
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(8, 8, 8, 0, 2 * Math.PI);
  ctx.fill();

  // Draw a 'D' for DealScout
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "10px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("D", 8, 8);

  const imageData = ctx.getImageData(0, 0, 16, 16);
  chrome.action.setIcon({ tabId: tabId, imageData: imageData }, () => {
    if (chrome.runtime.lastError) {
      console.log("Icon update ignored:", chrome.runtime.lastError.message);
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    chrome.storage.local.get(["deals"], (result) => {
      const deals = result.deals || {};
      const deal = deals[tab.url];
      const highestStage = getHighestStage(deal?.crm);
      const color = STAGE_COLORS[highestStage] || STAGE_COLORS["NEW"];
      updateIcon(tabId, color);
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateIcon") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const highestStage = getHighestStage(request.crm);
        const color = STAGE_COLORS[highestStage] || STAGE_COLORS["NEW"];
        updateIcon(tabs[0].id, color);
      }
    });
  }
});
