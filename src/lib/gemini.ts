import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('Gemini API key not found. AI features will be disabled.');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export const generateAIAnswer = async (question: string, description: string): Promise<string> => {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const prompt = `
You are a helpful programming assistant. Please provide a detailed, accurate answer to the following question:

Question: ${question}

Description: ${description}

Please provide:
1. A clear explanation
2. Code examples if applicable
3. Best practices
4. Any relevant warnings or considerations

Format your response in HTML with proper tags for better readability.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating AI answer:', error);
    throw new Error('Failed to generate AI answer');
  }
};