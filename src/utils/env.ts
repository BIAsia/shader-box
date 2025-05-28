// Environment variable utility functions
export const getOpenRouterApiKey = (): string => {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
        console.warn('OpenRouter API key is not set in environment variables');
        return '';
    }
    return apiKey;
}; 