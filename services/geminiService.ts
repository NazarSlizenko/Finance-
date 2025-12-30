
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

/**
 * Generates financial advice based on recent transactions using Google GenAI SDK.
 */
export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  // Use API_KEY exclusively from process.env
  const apiKey = process.env.API_KEY;
  if (!apiKey) return "Настройте API_KEY для работы финансового помощника.";

  // Initialize with mandatory named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format transaction history for model analysis
  const history = transactions.slice(0, 15).map(t => ({
    t: t.type === 'INCOME' ? 'Доход' : 'Расход',
    a: t.amount,
    c: t.category,
    d: t.date.split('T')[0]
  }));

  const prompt = `Ты финансовый гуру. Проанализируй список операций в BYN (бел. рублях): ${JSON.stringify(history)}. 
    Дай один меткий совет по экономии или похвалу за баланс. Не более 30 слов. Используй эмодзи.`;

  try {
    // Using recommended model for Basic Text Tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        temperature: 0.8,
        // Optional: disable reasoning for lower latency in simple advice tasks
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    // Access the .text property directly as per latest SDK guidelines
    return response.text || "Сегодня без советов, всё идет по плану! 🇧🇾";
  } catch (err) {
    console.error("Gemini Error:", err);
    return "Не удалось связаться с финансовым оракулом.";
  }
};
