// content.js - Injected into BizBuySell

function scrapeDealData() {
  const data = {
    url: window.location.href,
    title: document.title,
    askingPrice: "",
    cashFlow: "",
    ebitda: "",
    grossRevenue: "",
    yearEstablished: "",
    brokerName: "",
    brokerPhone: "",
    brokerFirm: "",
  };

  // Helper to find text next to a label
  const findMetric = (label) => {
    const elements = Array.from(
      document.querySelectorAll("p, div, span, b, strong, dt, dd, li, h1, h2, h3, h4, h5, h6")
    );
    
    // Find elements that contain the label directly in their text content
    const matchingElements = elements.filter(el => {
      // Check if this element contains the label, but none of its children do
      // This ensures we get the deepest element containing the label
      if (!el.textContent.includes(label)) return false;
      for (let i = 0; i < el.children.length; i++) {
        if (el.children[i].textContent.includes(label)) return false;
      }
      return true;
    });

    for (let el of matchingElements) {
      // 1. Check if the value is in the same element (e.g., <p>Asking Price: $100k</p>)
      let text = el.textContent.replace(label, "").trim();
      // Clean up any weird characters like newlines or multiple spaces
      text = text.replace(/\s+/g, ' ');
      
      // If we found some text and it's reasonably short (not a whole paragraph)
      if (text && text.length < 50 && text !== ":") {
        // Remove leading colon if present
        if (text.startsWith(":")) text = text.substring(1).trim();
        return text;
      }
      
      // 2. Check the next sibling node (could be a text node)
      let nextNode = el.nextSibling;
      if (nextNode && nextNode.nodeType === Node.TEXT_NODE && nextNode.nodeValue.trim()) {
        let val = nextNode.nodeValue.trim();
        if (val.startsWith(":")) val = val.substring(1).trim();
        if (val.length < 50) return val;
      }
      
      // 3. Check the next element sibling (e.g., <dt>Asking Price:</dt><dd>$100k</dd>)
      let nextEl = el.nextElementSibling;
      if (nextEl) {
        let val = nextEl.textContent.trim().replace(/\s+/g, ' ');
        if (val.startsWith(":")) val = val.substring(1).trim();
        if (val && val.length < 50) return val;
      }
      
      // 4. Check parent's text content just in case
      let parentText = el.parentElement?.textContent.replace(label, "").trim().replace(/\s+/g, ' ');
      if (parentText && parentText.length < 50 && parentText !== ":") {
        if (parentText.startsWith(":")) parentText = parentText.substring(1).trim();
        return parentText;
      }
    }
    
    return "";
  };

  data.askingPrice = findMetric("Asking Price:") || findMetric("Asking Price");
  data.cashFlow = findMetric("Cash Flow (SDE):") || findMetric("Cash Flow:") || findMetric("Cash Flow");
  data.ebitda = findMetric("EBITDA:") || findMetric("EBITDA");
  data.grossRevenue = findMetric("Gross Revenue:") || findMetric("Gross Revenue");
  data.yearEstablished = findMetric("Established:") || findMetric("Year Established");

  // Broker Info
  const brokerSection = Array.from(document.querySelectorAll("div, p")).find(
    (el) => el.textContent.includes("Business Listed By:"),
  );
  if (brokerSection) {
    const lines = brokerSection.textContent
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const listedByIndex = lines.findIndex((l) =>
      l.includes("Business Listed By:"),
    );
    if (listedByIndex !== -1 && lines.length > listedByIndex + 1) {
      data.brokerName = lines[listedByIndex + 1];
      if (lines.length > listedByIndex + 2) {
        data.brokerFirm = lines[listedByIndex + 2];
      }
    }
  }

  // Phone number (might need to click to reveal)
  const revealBtn = Array.from(
    document.querySelectorAll("a, button, span"),
  ).find(
    (el) =>
      el.textContent.toLowerCase().includes("show phone") ||
      el.textContent.toLowerCase().includes("click to reveal") ||
      el.id?.toLowerCase().includes("showphone"),
  );

  if (revealBtn) {
    revealBtn.click();
    // Wait a tiny bit for it to reveal, though we might just grab what's there
  }

  const phoneEl = document.querySelector(
    'a[href^="tel:"], .phone, [id*="phone" i]',
  );
  if (phoneEl) {
    data.brokerPhone = phoneEl.textContent.trim();
  }

  return data;
}

function autoFillForm(profile) {
  // Find inputs
  const inputs = Array.from(document.querySelectorAll("input"));
  const textareas = Array.from(document.querySelectorAll("textarea"));

  const findInput = (keywords) =>
    inputs.find((i) =>
      keywords.some(
        (k) =>
          i.name?.toLowerCase().includes(k) ||
          i.id?.toLowerCase().includes(k) ||
          i.placeholder?.toLowerCase().includes(k),
      ),
    );

  const nameInput = findInput(["name", "first", "last"]);
  const phoneInput = findInput(["phone", "tel"]);
  const emailInput = findInput(["email"]);
  const zipInput = findInput(["zip", "postal"]);
  const messageInput = textareas.find(
    (t) =>
      t.name?.toLowerCase().includes("message") ||
      t.id?.toLowerCase().includes("message"),
  );

  if (nameInput && profile.name) nameInput.value = profile.name;
  if (phoneInput && profile.phone) phoneInput.value = profile.phone;
  if (emailInput && profile.email) emailInput.value = profile.email;
  if (zipInput && profile.zip) zipInput.value = profile.zip;

  if (messageInput) {
    const today = new Date().toLocaleDateString();
    messageInput.value = `Please send me the NDA so I can review the financials. ${today}`;
  }

  return { success: true };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    sendResponse(scrapeDealData());
  } else if (request.action === "autofill") {
    sendResponse(autoFillForm(request.profile));
  }
  return true;
});
