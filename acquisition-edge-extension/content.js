// content.js - Injected into BizBuySell and BizQuest

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

function autoFillForm(profile, container = document) {
  // Find inputs
  const inputs = Array.from(container.querySelectorAll("input"));
  const textareas = Array.from(container.querySelectorAll("textarea"));

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

  const triggerEvents = (element) => {
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  };

  if (nameInput && profile.name) {
    nameInput.value = profile.name;
    triggerEvents(nameInput);
  }
  if (phoneInput && profile.phone) {
    phoneInput.value = profile.phone;
    triggerEvents(phoneInput);
  }
  if (emailInput && profile.email) {
    emailInput.value = profile.email;
    triggerEvents(emailInput);
  }
  if (zipInput && profile.zip) {
    zipInput.value = profile.zip;
    triggerEvents(zipInput);
  }

  if (messageInput) {
    const today = new Date().toLocaleDateString();
    messageInput.value = `Please send me the NDA so I can review the financials. ${today}`;
    triggerEvents(messageInput);
  }

  return { success: true };
}

function injectAutoFillIcon() {
  // Find all forms that look like contact forms
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    // Check if it has a name, email, or phone input
    const hasContactFields = Array.from(form.querySelectorAll('input')).some(i => 
      ['name', 'first', 'last', 'email', 'phone', 'tel'].some(k => 
        i.name?.toLowerCase().includes(k) || 
        i.id?.toLowerCase().includes(k) || 
        i.placeholder?.toLowerCase().includes(k)
      )
    );

    if (hasContactFields && !form.querySelector('.dealscout-autofill-btn')) {
      // Find the first text input to dock the icon
      const firstInput = form.querySelector('input[type="text"], input[type="email"], input[type="tel"]');
      if (firstInput && firstInput.parentElement) {
        const btn = document.createElement('div');
        btn.className = 'dealscout-autofill-btn';
        btn.innerHTML = \`
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2"></rect>
            <circle cx="12" cy="5" r="2"></circle>
            <path d="M12 7v4"></path>
            <line x1="8" y1="16" x2="8" y2="16"></line>
            <line x1="16" y1="16" x2="16" y2="16"></line>
          </svg>
        \`;
        btn.style.cssText = \`
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          z-index: 1000;
          background: #0f172a;
          color: #fbbf24;
          border-radius: 4px;
          padding: 6px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: 1px solid #fbbf24;
          transition: all 0.2s ease;
        \`;
        btn.title = 'Auto-Fill with DealScout';
        
        btn.addEventListener('mouseover', () => {
          btn.style.background = '#334155';
          btn.style.transform = 'translateY(-50%) scale(1.1)';
        });
        btn.addEventListener('mouseout', () => {
          btn.style.background = '#1e293b';
          btn.style.transform = 'translateY(-50%) scale(1)';
        });
        
        // Ensure parent is relative for absolute positioning
        const parentStyle = window.getComputedStyle(firstInput.parentElement);
        if (parentStyle.position === 'static') {
          firstInput.parentElement.style.position = 'relative';
        }

        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          chrome.storage.local.get(['profile'], (result) => {
            const profile = result.profile || {};
            autoFillForm(profile, form);
            
            // Visual feedback
            const originalHtml = btn.innerHTML;
            btn.innerHTML = \`
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            \`;
            setTimeout(() => {
              btn.innerHTML = originalHtml;
            }, 2000);
          });
        });

        firstInput.parentElement.appendChild(btn);
      }
    }
  });
}

// Run injection on load and observe DOM changes for dynamically loaded forms
injectAutoFillIcon();
const observer = new MutationObserver((mutations) => {
  let shouldInject = false;
  for (let mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldInject = true;
      break;
    }
  }
  if (shouldInject) {
    injectAutoFillIcon();
  }
});
observer.observe(document.body, { childList: true, subtree: true });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    sendResponse(scrapeDealData());
  } else if (request.action === "autofill") {
    sendResponse(autoFillForm(request.profile));
  }
  return true;
});
