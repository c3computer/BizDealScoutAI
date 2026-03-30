import { GoogleGenAI } from "@google/genai";
import { AnalysisResult, ChatMessage, DealOpportunity, InvestorProfile, DealFile } from "../types";

const MODEL_ID = 'gemini-3-flash-preview'; // Used for extraction with search
const ANALYSIS_MODEL = 'gemini-3.1-pro-preview'; // Used for complex reasoning (MAX mode)

// Helper for error handling
const createFriendlyError = (error: any, context: string): Error => {
  console.error(`Error in ${context}:`, error);
  let msg = "An unexpected error occurred.";
  if (error instanceof Error) msg = error.message;
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
      },
    });

    const text = response.text;
    if (!text) throw new Error("No data returned from AI");
    
    // Clean up potential markdown code blocks since we aren't enforcing MIME type
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Extract JSON object if surrounded by other text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleanText;

    return JSON.parse(jsonString);

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
    deal.files.forEach(file => {
        // Check if text based (CSV, JSON, TXT)
        // Note: We explicitly set 'text/csv' for converted Excel files in FileUploader
        if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json' || file.mimeType.includes('csv')) {
             const textContent = decodeBase64ToText(file.data);
             if (textContent) {
                 parts.push({ text: `[Document: ${file.name}]\n${textContent}` });
             }
        } else {
            // Images, PDFs, etc.
            parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data
                }
            });
        }
    });
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

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: file.mimeType,
            data: file.data
          }
        },
        { text: prompt }
      ]
    }
  });

  return response.text || "No summary generated.";
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

export const queryDealChat = async (
  history: ChatMessage[],
  newMessage: string,
  context: {
    deal: DealOpportunity,
    analysis: AnalysisResult | null
  }
): Promise<string> => {
  let apiKey = process.env.GEMINI_API_KEY || '';
  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];

  // 1. Attach Files for Context (NotebookLLM Style)
  if (context.deal.files && context.deal.files.length > 0) {
    context.deal.files.forEach(file => {
      if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json' || file.mimeType.includes('csv')) {
           const textContent = decodeBase64ToText(file.data);
           if (textContent) {
               parts.push({ text: `[Document: ${file.name}]\n${textContent}` });
           }
      } else {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data
            }
          });
      }
    });
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
  `;
  
  parts.push({ text: contextString });

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: { parts },
    });
    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Chat Error", error);
    throw new Error("Chat failed to respond.");
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
    context.deal.files.forEach(file => {
      if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json' || file.mimeType.includes('csv')) {
           const textContent = decodeBase64ToText(file.data);
           if (textContent) {
               parts.push({ text: `[Document: ${file.name}]\n${textContent}` });
           }
      } else {
          parts.push({
            inlineData: {
              mimeType: file.mimeType,
              data: file.data
            }
          });
      }
    });
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
    console.error("Presentation Generation Error", error);
    throw new Error("Failed to generate presentation.");
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