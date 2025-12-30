
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  // Безопасно получаем ключ, учитывая специфику Vite и браузера
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
  
  if (!apiKey) {
    return "API ключ не настроен. Пожалуйста, добавьте его в конфигурацию.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const summary = transactions.map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date
  }));

  const prompt = `
    Ты - персональный финансовый помощник. Проанализируй данные о доходах и расходах в белорусских рублях (BYN):
    ${JSON.stringify(summary)}

    Предоставь очень краткий отчет (3 предложения). 
    Дай один конкретный совет по экономии на основе данных.
    Используй эмодзи. Отвечай на русском.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    return response.text || "Не удалось проанализировать данные.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Не удалось связаться с AI. Проверьте настройки ключа.";
  }
};
