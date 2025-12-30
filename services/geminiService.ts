
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  // В Vite мы настроили подмену process.env.API_KEY через vite.config.ts
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "Ключ AI не найден. Проверьте настройки окружения.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const summary = transactions.slice(0, 20).map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date.split('T')[0] // Только дата для экономии токенов
  }));

  const prompt = `
    Ты - финансовый аналитик. Проанализируй данные в BYN (бел. рублях):
    ${JSON.stringify(summary)}

    Напиши 2-3 коротких предложения с анализом и один совет. 
    Используй эмодзи. Ответ на русском.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 250
      }
    });

    return response.text || "Анализ временно недоступен.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Не удалось получить совет от AI.";
  }
};
