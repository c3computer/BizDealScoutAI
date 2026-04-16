import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, ChatMessage, DealOpportunity, InvestorProfile, DealFile } from "../types";
import mammoth from 'mammoth';

const MODEL_ID = 'gemini-3-flash-preview'; // Used for extraction with search
const ANALYSIS_MODEL = 'gemini-3.1-pro-preview'; // Used for complex reasoning (MAX mode)

// Helper for error handling
const createFriendlyError = (error: any, context: string): Error => {
  console.error(`Error in ${context}:`, error);
  let msg = "An unexpected error occurred.";
  
  if (error instanceof Error) {
    msg = error.message;
  } else if (typeof error === 'string') {
    msg = error;
  } else if (error && typeof error === 'object') {
    try {
      msg = JSON.stringify(error);
    } catch (e) {
      msg = "Unknown error object.";
    }
  }

  // Check for 413 Payload Too Large
  if (msg.includes('413') && msg.includes('Too Large')) {
    return new Error(`Failed to ${context}: The documents you attached are too large for the AI to process. Please remove some files or use smaller files (under 5MB each).`);
  }

  return new Error(`Failed to ${context}: ${msg}`);
};

// Helper for retry
const runWithRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return runWithRetry(fn, retries - 1);
    }
    throw error;
  }
};

export const extractDealMetrics = async (url: string): Promise<Partial<DealOpportunity>> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  // --- ANTI-SCRAPING STRATEGY ---
  let listingId = '';
  const idMatch = url.match(/[\/-](\d{5,10})(\/|$|\?)/);
  if (idMatch) {
    listingId = idMatch[1];
  }

  const prompt = `
    Task: Extract business financial metrics AND a representative image URL for this listing.
    
    Target URL: ${url}
    ${listingId ? `Detected Listing ID: ${listingId}` : ''}

    STRATEGY (BYPASS BLOCKS):
    1. Perform a Google Search for the URL.
    2. ALSO Search for "BizBuySell listing ${listingId}" (if ID is present) or the listing title.
    3. **CRITICAL**: The target website likely blocks automated access. **DO NOT rely on opening the page.**
    4. **INSTEAD**: Read the **Google Search Result Snippets** (the text under the blue links) and look for Image results in the search data.
    5. Look for text patterns like: "Cash Flow: $200,000", "Revenue: $1,000,000", "Asking Price: $500,000".
    
    Extract these specific metrics from the search snippets:
    1. Asking Price (number)
    2. Revenue (Annual/Gross) (number)
    3. Cash Flow / SDE (Seller Discretionary Earnings) (number)
    4. Business Type / Keywords (string)
    5. Image URL (string) - A URL to the main photo of the business listing if available in search results.
    
    Return a raw JSON object (no markdown formatting) with keys: askingPrice (number or null), revenue (number or null), sde (number or null), keywords (string or null), imageUrl (string or null).
    Use null for missing values. Ensure valid JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");
    
    // Clean up potential markdown code blocks since we aren't enforcing MIME type
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract JSON object if surrounded by other text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleanText;

    const parsed = JSON.parse(jsonString);
    
    // If everything is null/empty, it means we couldn't find any data
    if (!parsed.askingPrice && !parsed.revenue && !parsed.sde && !parsed.keywords) {
      throw new Error("No business data found for this URL.");
    }

    return parsed;

  } catch (error) {
    console.error("Import Error Details:", error);
    throw createFriendlyError(error, "Data Import");
  }
};

// Helper to decode base64 content to text
const decodeBase64ToText = (base64: string): string => {
    try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
    } catch (e) {
        console.error("Failed to decode base64 text", e);
        return "";
    }
};

// Helper to process a file into a Gemini Part
const processFileToPart = async (ai: GoogleGenAI, file: DealFile): Promise<any> => {
  // Check cache first
  if (file.extractedText) {
    return { text: `[Document: ${file.name}]\n${file.extractedText}` };
  }
  if (file.geminiFileUri) {
    return {
      fileData: {
        fileUri: file.geminiFileUri,
        mimeType: file.mimeType
      }
    };
  }

  // If data is missing but we have a downloadUrl, fetch it
  let fileData = file.data;
  if (!fileData && file.downloadUrl) {
    try {
      console.log(`Fetching ${file.name} from Firebase Storage...`);
      const response = await fetch(file.downloadUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      fileData = await new Promise((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Get base64 part
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error(`Failed to fetch file ${file.name} from Storage`, e);
      throw new Error(`Failed to download file ${file.name} for analysis.`);
    }
  }

  if (!fileData) {
    throw new Error(`File ${file.name} has no data and no download URL.`);
  }

  // Handle .docx files using mammoth
  if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.toLowerCase().endsWith('.docx')) {
    try {
      const binaryString = atob(fileData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
      if (result.value) {
        file.extractedText = result.value; // Cache it
        return { text: `[Document: ${file.name}]\n${result.value}` };
      }
    } catch (e) {
      console.error(`Failed to extract text from docx file ${file.name}:`, e);
      // If extraction fails, we might still try to send it, but it will likely fail.
    }
  }

  // If it's a text-based file, decode it and send as text
  if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json' || file.mimeType.includes('csv')) {
    const textContent = decodeBase64ToText(fileData);
    if (textContent) {
      file.extractedText = textContent; // Cache it
      return { text: `[Document: ${file.name}]\n${textContent}` };
    }
  }

  // For all other files (PDF, images, etc.), upload to Gemini File API to cache the URI
  // This prevents sending large base64 strings on every chat message
  try {
    console.log(`Uploading ${file.name} to Gemini File API for caching...`);
    // Convert base64 back to Blob efficiently using fetch
    const base64Response = await fetch(`data:${file.mimeType};base64,${fileData}`);
    const blob = await base64Response.blob();
    
    const uploadRes = await ai.files.upload({ file: blob as any, mimeType: file.mimeType });
    console.log(`Successfully uploaded ${file.name} to Gemini File API: ${uploadRes.uri}`);
    
    file.geminiFileUri = uploadRes.uri; // Cache it
    return {
      fileData: {
        fileUri: uploadRes.uri,
        mimeType: file.mimeType
      }
    };
  } catch (e) {
    console.error(`Failed to upload ${file.name} to Gemini File API, falling back to inline data:`, e);
    // Fallback to inline data if upload fails
    return {
      inlineData: {
        mimeType: file.mimeType,
        data: fileData
      }
    };
  }
};

export const analyzeDeal = async (
  profile: InvestorProfile,
  deal: DealOpportunity,
  metrics: { multiple: string; margin: string }
): Promise<AnalysisResult> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];

  // Add Files (Images/PDFs/Text)
  if (deal.files && deal.files.length > 0) {
    for (const file of deal.files) {
      const part = await processFileToPart(ai, file);
      if (part) {
        parts.push(part);
      }
    }
  }

  // Construct Text Prompt
  const promptText = `
    You are Acquisition Edge, a contrarian private equity analyst.
    
    INVESTOR PROFILE:
    - Goals: ${profile.goals}
    - Must Haves: ${profile.mustHaves}
    - Superpowers: ${profile.superpowers}
    
    DEAL DETAILS:
    - Listing URL: ${deal.listingUrl || 'None provided'}
    - Keywords: ${deal.keywords}
    - Asking Price: $${deal.askingPrice}
    - Revenue: $${deal.revenue}
    - SDE: $${deal.sde}
    - Multiple: ${metrics.multiple}x
    - Margin: ${metrics.margin}%
    - Notes/Description: ${deal.notes}
    
    TASK:
    Analyze this deal. Be skeptical. Look for risks.
    If files are attached, use them to verify numbers or find hidden issues.
    
    CRITICAL INSTRUCTIONS FOR THE MEMORANDUM (markdown field):
    At the very bottom of the Deal Memorandum, you MUST include:
    1. The Listing URL: ${deal.listingUrl || 'None provided'} (format as a clickable markdown link if a URL is provided).
    2. Document Citations: Cite any documents used in your determination. If no financial documents were attached or used, explicitly note that "Only the listing was used to make the deal scoring memorandum."
    
    OUTPUT JSON format:
    {
      "markdown": "# Deal Analysis\n\n...",
      "score": number (0-100),
      "groundingUrls": [] 
    }
  `;
  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
        model: ANALYSIS_MODEL,
        contents: { parts },
        config: {
            responseMimeType: "application/json"
        }
    });

    const text = response.text;
    if (!text) throw new Error("No analysis returned");
    return JSON.parse(text);
  } catch (error) {
    throw createFriendlyError(error, "Deal Analysis");
  }
};

export const summarizeCall = async (
  file: DealFile,
  participants: string
): Promise<string> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    You are an expert private equity analyst. Review the following broker/seller call recording.
    Participants on the call: ${participants || 'Unknown'}
    
    Please provide a detailed summary of the call, including:
    1. Key takeaways and deal highlights
    2. Any red flags or risks mentioned
    3. Financial details discussed
    4. Next steps or action items
    
    Format the output as a clean, professional text summary.
  `;

  try {
    const filePart = await processFileToPart(ai, file);
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: {
        parts: [
          filePart,
          { text: prompt }
        ]
      }
    });

    return response.text || "No summary generated.";
  } catch (error) {
    throw createFriendlyError(error, "Call Summary");
  }
};

export const generateGrowthStrategy = async (
    profile: InvestorProfile,
    deal: DealOpportunity
): Promise<AnalysisResult> => {
    let apiKey = process.env.GEMINI_API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      Create a Growth & Exit Strategy for this business.
      
      Business: ${deal.keywords}
      Context: ${deal.growthContext}
      Investor Superpowers: ${profile.superpowers}
      
      OUTPUT JSON format:
      {
        "markdown": "# Growth Playbook\n\n...",
        "score": 0,
        "groundingUrls": []
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model: ANALYSIS_MODEL,
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.text;
        if (!text) throw new Error("No strategy returned");
        return JSON.parse(text);
    } catch (error) {
        throw createFriendlyError(error, "Growth Strategy");
    }
};

export const queryCapitalRaisingChat = async (
  profile: InvestorProfile,
  deal: DealOpportunity,
  analysis: DealAnalysis | null,
  chatHistory: ChatMessage[],
  newMessage: string,
  mainChatHistory?: ChatMessage[],
  loiTerms?: LOITerms | null
): Promise<string> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];

  // 1. Attach Files for Context
  if (deal.files && deal.files.length > 0) {
    for (const file of deal.files) {
      const part = await processFileToPart(ai, file);
      if (part) {
        parts.push(part);
      }
    }
  }

  // Create a copy of deal without files to avoid sending huge base64 strings in text
  const { files, ...dealWithoutFiles } = deal;

  // 2. Build Context String
  const contextString = `
You are an expert Private Money and Creative Finance Strategist, heavily influenced by the methods of Codie Sanchez (boring businesses, acquisition fees, OPM, equity splits) and Pace Morby (creative finance, SubTo, seller finance, Gator lending, PMLs).

Your goal is to help the user structure a deal to raise private capital based on the seller's offer and terms. You must break down the deal terms and profitability across 4 main stages:
1. Acquisition (e.g., 2% acquisition fee charged at deal inception, Gator lending for EMD)
2. Monthly Profit (The spread or equity split on monthly cash flow)
3. Refinance before final sale (Paying off short-term PMLs or seller finance balloons using Commercial loans, SBA 7a, DSCR, etc.)
4. Exit Planning / Sale (Final equity payout, capital gains, selling the asset)

IMPORTANT RULES FOR DEAL TERMS:
- You MUST align your capital raising structure with the terms already negotiated or discussed in the "DEAL AI CHAT HISTORY" and "LOI TERMS" below.
- If the LOI or Chat History states we are offering the seller $300k cash, your structure CANNOT offer seller financing. You must raise the $300k cash from investors or lenders.
- Assume the Earnest Money Deposit (EMD) is $0 unless an EMD amount is explicitly stipulated in the LOI offer or chat history. There is not always an EMD on business buying.
- ONLY list or reference "The Morby Method" (Pre-Transfer Refinance) if it is actively being used in the specific deal structure being proposed. Do not assume every offer will begin with a Morby Method Refi. If it is not being used, do not mention it.

If the Morby Method IS being used, here is the methodology to reference for tax savings:
# The Morby Method Applied to Business Acquisition

This is a legitimate and powerful structure. Let me break down exactly what's happening mechanically, then show you the tax math you can put in front of the seller.

---

## The Core Mechanic: Refi Before Transfer

The seller's instinct is to **sell** the business for $2M. The strategy is to reframe the transaction so that the **LLC borrows** $1M before the transfer, then the seller only "sells" $1M — not $2M. Since loan proceeds are not taxable income, the seller pockets the first $1M completely tax-free.

---

## Deal Structure Step-by-Step

### What the Seller Originally Wanted:
| Component | Amount | Terms |
|---|---|---|
| Down Payment | $1,000,000 | At close |
| Seller Carry Note | $1,000,000 | 5 yrs @ 8% |
| **Total** | **$2,000,000** | |

---

### The Reframed Structure:

**Step 1 — The LLC Takes a Business Loan (Pre-Transfer)**
- The bakery LLC applies for a **$1M business term loan** (against its assets, cash flow, and SDE)
- An SDE of $1M/year makes this business highly bankable — most lenders will look at a 3–4x SDE multiple for collateral, so a $1M loan against a $2M+ asset is very serviceable
- The **seller receives $1M in loan proceeds directly from the LLC** before ownership changes hands
- This is a **distribution or management fee** from the LLC — **not a sale**, therefore **not a capital gains event**
- The $1M is **received tax-free** (debt is not income)

**Step 2 — Buyer Acquires the LLC Membership Interest**
- Instead of selling the *assets* of the bakery, the seller transfers his **LLC membership interest** to you
- The sale price for the membership interest is now **$1M** (not $2M — because the LLC just borrowed $1M and distributed it to the seller)
- You, the buyer, now **own the LLC** — which means you now **own the loan obligation** as well
- You make the loan payments from the business's cash flow

**Step 3 — Seller Carries the Remaining $1M**
- The seller holds a **$1M seller carry note** at 8% over 5 years
- Monthly payment: approximately **$20,276/month**
- This note is reported on the **installment sale method**, spreading his taxable gain over 5 years — not all in year one

---

## The Tax Comparison (This Is Your Pitch)

Assume the seller's **original basis in the LLC is ~$200,000** (common for a bakery built over time — equipment, leasehold, etc.).

### ❌ Traditional Sale (What He Thinks He Wants)

| Item | Amount |
|---|---|
| Total Sale Price | $2,000,000 |
| Adjusted Basis | ($200,000) |
| **Taxable Capital Gain** | **$1,800,000** |
| Federal Long-Term Cap Gains (20%) | $360,000 |
| Net Investment Income Tax (3.8%) | $68,400 |
| **Total Federal Tax Owed** | **$428,400** |
| **Net In His Pocket** | **$1,571,600** |

> Florida has no state income tax, so this is his full exposure — but this is still brutal.

---

### ✅ Morby Method Structure (What You're Offering)

| Item | Amount |
|---|---|
| LLC Loan Proceeds Received (Tax-Free) | $1,000,000 |
| Seller Carry Note (Installment Sale) | $1,000,000 |
| **Adjusted Basis** | ($200,000) |
| **Taxable Gain on the Installment Sale** | **$800,000** |
| Federal Long-Term Cap Gains (20%) | $160,000 |
| Net Investment Income Tax (3.8%) | $30,400 |
| **Total Federal Tax Owed** | **$190,400** |
| **Net In His Pocket** | **$1,809,600** |

---

## The Number That Closes the Conversation

| | Traditional Sale | Morby Structure |
|---|---|---|
| Gross Proceeds | $2,000,000 | $2,000,000 |
| Tax Paid | $428,400 | $190,400 |
| **Net to Seller** | **$1,571,600** | **$1,809,600** |
| **Difference** | | **+$238,000** |

**You're not asking him to take less. You're showing him how to keep $238,000 more of what he already negotiated — while you get the same deal.**

---

## How the SDE Makes This Work for You

With **$1M+ SDE** annually, here's your debt service reality check:

| Obligation | Annual Payment |
|---|---|
| Business Loan ($1M, ~7%, 10yr) | ~$139,200/yr |
| Seller Carry ($1M, 8%, 5yr) | ~$243,312/yr |
| **Total Annual Debt Service** | **~$382,512/yr** |
| SDE Available | $1,000,000+ |
| **Cash Flow After Debt** | **~$617,488/yr** |

Your **DSCR (Debt Service Coverage Ratio)** is approximately **2.6x** — extremely bankable and very comfortable.

---

## Important Structuring Notes to Protect Everyone

There are a few things that need to be handled carefully with a CPA and business attorney:

**Step Transaction Doctrine** — The IRS can collapse a refinance and a sale into one transaction if they're too close in time or appear coordinated. The refinance should have business justification independent of the sale (equipment purchase, working capital, etc.), and there should be a reasonable time buffer between the loan closing and the membership transfer.

**The Loan Terms** — If you go SBA, be aware that SBA 7(a) loans have change-of-ownership provisions that require lender notification. A conventional business term loan or a private/hard money bridge may be cleaner for this structure.

**Installment Sale Agreement** — The seller carry note needs to be properly documented with a promissory note, a personal guarantee from you, and ideally a UCC-1 filing against the LLC assets as collateral for the seller.

**LLC Operating Agreement** — The membership interest transfer needs to be reflected in an amended operating agreement and any required state filings.

---

## The One-Liner to Open the Conversation

> *"You told me you want $2M. I'm not asking you to take less. I'm showing you a structure where you walk away with $238,000 more than a traditional sale — and your accountant can verify every number before we sign anything."*

That framing gets you past the ego of a seller who's anchored on his original terms, because you're not fighting his number — you're improving his outcome.

INVESTOR PROFILE:
${JSON.stringify(profile, null, 2)}

DEAL DETAILS:
${JSON.stringify(dealWithoutFiles, null, 2)}

PREVIOUS ANALYSIS:
${analysis ? JSON.stringify(analysis, null, 2) : 'No analysis available yet.'}

LOI TERMS (AGREED UPON TERMS):
${loiTerms ? JSON.stringify(loiTerms, null, 2) : 'No LOI terms extracted yet.'}

DEAL AI CHAT HISTORY (NEGOTIATION CONTEXT):
${mainChatHistory && mainChatHistory.length > 0 ? mainChatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join('\n') : 'No chat history available.'}

CAPITAL RAISING CHAT HISTORY:
${chatHistory.map(msg => `${msg.role.toUpperCase()}: ${msg.text}`).join('\n')}

USER MESSAGE:
${newMessage}

Provide a strategic, actionable response focusing on how to structure the capital stack, what to offer private money lenders (PMLs), and how to maximize profitability across the 4 stages. Be specific about interest rates, equity splits, and timelines.
`;

  parts.push({ text: contextString });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
    });

    return response.text || "I couldn't generate a response. Please try again.";
  } catch (error) {
    throw createFriendlyError(error, 'generate capital raising strategy');
  }
};

export const queryDealChat = async (
  history: ChatMessage[],
  newMessage: string,
  context: {
    deal: DealOpportunity,
    analysis: DealAnalysis | null
  }
): Promise<string> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];

  // 1. Attach Files for Context (NotebookLLM Style)
  if (context.deal.files && context.deal.files.length > 0) {
    for (const file of context.deal.files) {
      const part = await processFileToPart(ai, file);
      if (part) {
        parts.push(part);
      }
    }
  }

  // 2. Build Context String
  const contextString = `
    SYSTEM CONTEXT (DEAL DATA):
    - Business: ${context.deal.keywords}
    - Revenue: $${context.deal.revenue}
    - SDE: $${context.deal.sde}
    - Asking: $${context.deal.askingPrice}
    - Notes: ${context.deal.notes}
    
    ${context.analysis ? `PRIOR ANALYSIS (MEMORANDUM): \n ${context.analysis.markdown}` : ''}

    CHAT HISTORY:
    ${history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
    
    USER QUESTION: ${newMessage}
    
    INSTRUCTIONS:
    You are an expert Deal Consultant (Acquisition Edge Chat). 
    Answer the user's question specifically about THIS deal using the provided metrics, notes, files, and analysis.
    Be concise, helpful, and reference specific numbers from the documents if possible.
    
    CRITICAL OBJECTIVE: The major take-away of this chat is to create the Terms of the offer to present to the seller. 
    Always aim to offer the best terms given the data uploaded and what the seller is asking. 
    Utilize creative financing strategies for buying businesses taught by Codie Sanchez and Pace Morby (e.g., Seller Financing, Earn-outs, Subject-To, minimal money down, performance-based payouts).
    When the user is ready, clearly outline the proposed terms (Purchase Price, Earnest Money, Due Diligence Period, Closing Date, Training Period, Non-Compete).
  `;
  
  parts.push({ text: contextString });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    throw createFriendlyError(error, "Chat Response");
  }
};

export const generateChatPresentation = async (
  history: ChatMessage[],
  context: {
    deal: DealOpportunity,
    analysis: AnalysisResult | null
  }
): Promise<string> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];

  // 1. Attach Files for Context
  if (context.deal.files && context.deal.files.length > 0) {
    for (const file of context.deal.files) {
      const part = await processFileToPart(ai, file);
      if (part) {
        parts.push(part);
      }
    }
  }

  // 2. Build Context String
  const contextString = `
    SYSTEM CONTEXT (DEAL DATA):
    - Business: ${context.deal.keywords}
    - Revenue: $${context.deal.revenue}
    - SDE: $${context.deal.sde}
    - Asking: $${context.deal.askingPrice}
    - Notes: ${context.deal.notes}
    
    ${context.analysis ? `PRIOR ANALYSIS (MEMORANDUM): \n ${context.analysis.markdown}` : ''}

    CHAT HISTORY:
    ${history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
    
    INSTRUCTIONS:
    You are an expert Deal Consultant. Based on the Chat History and the Deal Data, generate a "Chat Presentation" in Markdown format.
    This presentation should act like a Deal Memorandum PDF but specifically focus on the insights, score changes, and relevant AI Chat box-specific changes recommended during the Deal Chat AI conversation.
    
    Be sure to highlight:
    1. Key takeaways from the chat conversation.
    2. Any recommended changes to the deal score based on the chat.
    3. Specific actionable recommendations or changes discussed in the chat.
    
    Format the output as a professional, easy-to-read Markdown document with clear headings, bullet points, and bold text for emphasis.
  `;
  
  parts.push({ text: contextString });

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: { parts },
    });
    return response.text || "I couldn't generate a presentation.";
  } catch (error) {
    throw createFriendlyError(error, "Chat Presentation Generation");
  }
};

export const generatePersonalizedPlaybook = async (
  profile: InvestorProfile,
  answers: Record<string, string>
): Promise<string> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) throw new Error("Missing Gemini API Key");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert M&A Advisor and Deal Consultant using the Contrarian Thinking framework for business acquisition.
    Your task is to generate a highly personalized, actionable Standard Operating Procedure (SOP) & Playbook for a buyer.

    INVESTOR PROFILE (The "Buy Box"):
    - Goals: ${profile.goals}
    - Must Haves: ${profile.mustHaves}
    - Superpowers: ${profile.superpowers}

    BUYER'S SPECIFIC STRATEGY (Q&A Answers):
    ${Object.entries(answers).map(([q, a]) => `- Q: ${q}\n  A: ${a}`).join('\n')}

    INSTRUCTIONS:
    Write a comprehensive, professional, and highly actionable Playbook in Markdown format.
    Do not use generic advice; tailor every phase to the exact answers provided above.
    
    Structure the Playbook exactly like this:
    # 🏢 [Buyer Name/Company] Acquisition SOP & Playbook

    ## 🎯 The "Buy Box" (Core Criteria)
    (Synthesize their profile into bullet points: Financials, Locations, Target Industries, Excluded Industries, Financing, Operations)

    ## ⏱️ Daily/Weekly Schedule
    (Create a realistic time-blocked schedule based on their stated time commitment answer. Break it down by Sourcing, Outreach, and Deal Structuring)

    ## 📋 Phase 1: Sourcing & Triage
    (How they will find deals based on their sourcing answer. E.g., if they said direct-to-seller, give them a script and process for that. If brokers, give them a process for BizBuySell alerts)

    ## 📋 Phase 2: Outreach & Positioning
    (How to pitch themselves to sellers/brokers based on their superpowers and background)

    ## 📋 Phase 3: Negotiation & Financing
    (How to structure the deal based on their preferred financing method answer. E.g., if Seller Finance, give them the "Pace Morby SubTo" pitch. If SBA, give them the SBA checklist)

    ## 📋 Phase 4: Due Diligence & Operations
    (How to handle DD based on their advisor team answer, and how to transition the business based on their operator strategy answer - e.g., promoting a #2 vs hiring a GM)

    ## 💡 Best Practices for Your Specific Model
    (Give 3-4 highly specific, contrarian tips that perfectly align with their unique profile and answers)

    Format with clean markdown, emojis for headers, and bold text for emphasis. Make it look like a premium consulting deliverable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
    });
    return response.text || "Failed to generate playbook.";
  } catch (error) {
    console.error("Playbook Error", error);
    throw new Error("Failed to generate playbook.");
  }
};

export const extractLOITerms = async (history: ChatMessage[]): Promise<any> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analyze the following chat history between a user and an Acquisition Edge Deal Consultant.
    Extract the finalized or most recently proposed terms for a Letter of Intent (LOI).
    
    CHAT HISTORY:
    ${history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n')}
    
    Return ONLY a valid JSON object with the following keys (use empty strings if a value is not found):
    {
      "purchasePrice": "string (e.g., '1,500,000' or 'TBD')",
      "earnestMoney": "string (e.g., '50,000' or 'TBD')",
      "dueDiligenceDays": "string (e.g., '30' or '60')",
      "closingDate": "string (e.g., '30 days after DD' or specific date)",
      "trainingPeriod": "string (e.g., '14 days' or '3 months')",
      "nonCompetePeriod": "string (e.g., '2 years' or '5 years')"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Error extracting LOI terms:", error);
    throw new Error("Failed to extract LOI terms from chat.");
  }
};