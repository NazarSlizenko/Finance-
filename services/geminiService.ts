
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const summary = transactions.map(t => ({
    type: t.type,
    amount: t.amount,
    category: t.category,
    date: t.date
  }));

  const prompt = `
    Ты - персональный финансовый помощник. Проанализируй данные о доходах и расходах пользователя в белорусских рублях (BYN):
    ${JSON.stringify(summary)}

    Предоставь краткий и стильный отчет (не более 3-4 предложений). 
    Отметь главные категории трат, дай совет по экономии или похвали за хороший баланс.
    Используй эмодзи. Отвечай на русском языке.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Не удалось получить рекомендации. Попробуйте добавить больше транзакций.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ой! Наши финансовые алгоритмы сейчас отдыхают. Попробуйте позже.";
  }
};
