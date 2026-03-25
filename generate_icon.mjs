import { GoogleGenAI } from "@google/genai";
import fs from "fs";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateIcon() {
  try {
    console.log('Generating icon...');
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A professional, modern app icon for a Chrome extension named Deal Scout AI. It features a stylized minimalist magnifying glass or radar with a subtle dollar sign. Dark theme background with amber and cyan accents. Flat vector style, clean, no text, perfectly centered, solid background.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        fs.writeFileSync('./dealscout-extension/icon128.png', Buffer.from(base64Data, 'base64'));
        console.log('Icon generated successfully and saved to dealscout-extension/icon128.png!');
        break;
      }
    }
  } catch (error) {
    console.error('Error generating icon:', error);
  }
}

generateIcon();
