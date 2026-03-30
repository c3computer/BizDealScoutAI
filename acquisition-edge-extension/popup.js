// popup.js

document.addEventListener("DOMContentLoaded", () => {
  // Tab Switching
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".panel")
        .forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target).classList.add("active");
    });
  });

  // Load Settings
  chrome.storage.local.get(["profile", "deals"], (result) => {
    if (result.profile) {
      document.getElementById("set-name").value = result.profile.name || "";
      document.getElementById("set-phone").value = result.profile.phone || "";
      document.getElementById("set-email").value = result.profile.email || "";
      document.getElementById("set-zip").value = result.profile.zip || "";
      document.getElementById("set-api-url").value =
        result.profile.apiUrl || "";
    }
    updateQueueDisplay(result.deals || {});
    checkCurrentTab(result.deals || {});
  });

  // Save Settings
  document.getElementById("btn-save-settings").addEventListener("click", () => {
    const profile = {
      name: document.getElementById("set-name").value,
      phone: document.getElementById("set-phone").value,
      email: document.getElementById("set-email").value,
      zip: document.getElementById("set-zip").value,
      apiUrl: document.getElementById("set-api-url").value,
    };
    chrome.storage.local.set({ profile }, () => {
      document.getElementById("status-indicator").innerText = "Settings Saved";
      setTimeout(
        () => (document.getElementById("status-indicator").innerText = "Ready"),
        2000,
      );
    });
  });

  let currentDealData = null;
  let currentUrl = null;

  function checkCurrentTab(deals) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        currentUrl = tabs[0].url;
        if (deals[currentUrl]) {
          currentDealData = deals[currentUrl];
          displayDealData(currentDealData);
          loadCrmState(currentDealData.crm || {});
        }
      }
    });
  }

  // Scrape Data
  document.getElementById("btn-scrape").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0] || !tabs[0].id) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: "scrape" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          document.getElementById("status-indicator").innerText =
            "Scrape Failed: Refresh page";
          return;
        }
        if (response) {
          currentDealData = response;
          currentUrl = response.url;
          displayDealData(response);
          document.getElementById("status-indicator").innerText = "Scraped!";
        } else {
          document.getElementById("status-indicator").innerText =
            "Scrape Failed";
        }
      });
    });
  });

  // Auto-Fill
  document.getElementById("btn-autofill").addEventListener("click", () => {
    chrome.storage.local.get(["profile"], (result) => {
      const profile = result.profile || {};
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0] || !tabs[0].id) return;
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "autofill", profile },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(chrome.runtime.lastError.message);
              document.getElementById("status-indicator").innerText =
                "Auto-Fill Failed: Refresh page";
              return;
            }
            if (response?.success) {
              document.getElementById("status-indicator").innerText =
                "Form Filled!";
            }
          },
        );
      });
    });
  });

  function displayDealData(data) {
    document.getElementById("deal-data-container").style.display = "block";
    const infoHtml = `
      <div><strong>Price:</strong> ${data.askingPrice || "N/A"}</div>
      <div><strong>SDE:</strong> ${data.cashFlow || "N/A"}</div>
      <div><strong>Rev:</strong> ${data.grossRevenue || "N/A"}</div>
      <div><strong>Broker:</strong> ${data.brokerName || "N/A"}</div>
    `;
    document.getElementById("deal-info-display").innerHTML = infoHtml;
  }

  // CRM State Management
  const crmMap = {
    "crm-nda": "NDA Signed",
    "crm-fin-req": "Financials Requested",
    "crm-pof": "POF Sent",
    "crm-cim": "CIM/Financials Received",
    "crm-broker-call": "Broker Call",
    "crm-seller-call": "Seller Call",
    "crm-offer": "Offer Made",
    "crm-loi": "LOI Sent",
    "crm-dd": "Due Diligence",
  };

  function loadCrmState(crm) {
    for (const [id, key] of Object.entries(crmMap)) {
      document.getElementById(id).checked = !!crm[key];
    }
  }

  function getCrmState() {
    const crm = {};
    for (const [id, key] of Object.entries(crmMap)) {
      crm[key] = document.getElementById(id).checked;
    }
    return crm;
  }

  // Save Deal
  document.getElementById("btn-save-deal").addEventListener("click", () => {
    if (!currentDealData) return;

    currentDealData.crm = getCrmState();
    currentDealData.status = "CONTACTED";

    chrome.storage.local.get(["deals"], (result) => {
      const deals = result.deals || {};
      deals[currentUrl] = currentDealData;
      chrome.storage.local.set({ deals }, () => {
        updateQueueDisplay(deals);
        document.getElementById("status-indicator").innerText =
          "Saved to Queue";
        chrome.runtime.sendMessage({
          action: "updateIcon",
          crm: currentDealData.crm,
        });
      });
    });
  });

  // Listen for checkbox changes to auto-save CRM state if deal is already saved
  Object.keys(crmMap).forEach((id) => {
    document.getElementById(id).addEventListener("change", () => {
      if (currentUrl) {
        chrome.storage.local.get(["deals"], (result) => {
          const deals = result.deals || {};
          if (deals[currentUrl]) {
            deals[currentUrl].crm = getCrmState();
            chrome.storage.local.set({ deals }, () => {
              chrome.runtime.sendMessage({
                action: "updateIcon",
                crm: deals[currentUrl].crm,
              });
            });
          }
        });
      }
    });
  });

  function updateQueueDisplay(deals) {
    const queueList = document.getElementById("queue-list");
    const dealKeys = Object.keys(deals);
    document.getElementById("queue-count").innerText = dealKeys.length;

    if (dealKeys.length === 0) {
      queueList.innerHTML =
        '<div style="text-align:center; color:#94a3b8; padding: 20px;">Queue is empty</div>';
      return;
    }

    queueList.innerHTML = dealKeys
      .map((url) => {
        const d = deals[url];
        return `
        <div class="queue-item">
          <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">
            ${d.title || url}
          </div>
          <div class="badge">${d.askingPrice || "?"}</div>
        </div>
      `;
      })
      .join("");
  }

  // Send Batch to Acquisition Edge API
  document.getElementById("btn-send-batch").addEventListener("click", () => {
    chrome.storage.local.get(["deals", "profile"], async (result) => {
      const deals = result.deals || {};
      const profile = result.profile || {};
      let apiUrl = profile.apiUrl;

      if (!apiUrl) {
        alert("Please set your Acquisition Edge App URL in Settings first.");
        return;
      }

      // Remove trailing slash
      if (apiUrl.endsWith("/")) apiUrl = apiUrl.slice(0, -1);

      if (Object.keys(deals).length === 0) {
        alert("Queue is empty.");
        return;
      }

      try {
        const btn = document.getElementById("btn-send-batch");
        btn.innerText = "Sending...";
        btn.disabled = true;

        const response = await fetch(`${apiUrl}/api/extension/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deals: Object.values(deals) }),
        });

        if (response.ok) {
          document.getElementById("batch-status").style.display = "block";
          
          // Clear queue automatically on success
          chrome.storage.local.set({ deals: {} }, () => {
            updateQueueDisplay({});
            // Reset the current deal CRM state visually if it was in the queue
            if (currentUrl) {
              loadCrmState({});
              chrome.runtime.sendMessage({ action: "updateIcon", crm: {} });
            }
          });

          setTimeout(() => {
            document.getElementById("batch-status").style.display = "none";
          }, 3000);
        } else {
          throw new Error("API returned " + response.status);
        }
      } catch (err) {
        alert("Failed to send batch: " + err.message);
      } finally {
        const btn = document.getElementById("btn-send-batch");
        btn.innerText = "Send Batch to Acquisition Edge";
        btn.disabled = false;
      }
    });
  });

  // Clear Queue Manually
  document.getElementById("btn-clear-queue").addEventListener("click", () => {
    chrome.storage.local.set({ deals: {} }, () => {
      updateQueueDisplay({});
      if (currentUrl) {
        loadCrmState({});
        chrome.runtime.sendMessage({ action: "updateIcon", crm: {} });
      }
      document.getElementById("status-indicator").innerText = "Queue Cleared";
      setTimeout(() => {
        document.getElementById("status-indicator").innerText = "Ready";
      }, 2000);
    });
  });
});
