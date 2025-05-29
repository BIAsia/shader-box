import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(request: Request) {
    // Add debug logging
    console.log('API Key exists:', !!OPENROUTER_API_KEY);
    console.log('Environment:', process.env.NODE_ENV);

    if (!OPENROUTER_API_KEY) {
        console.error('OpenRouter API key is not configured in environment variables');
        return NextResponse.json(
            {
                error: 'Server configuration error: API key not found. Please check environment variables.',
                debug: {
                    env: process.env.NODE_ENV,
                    hasKey: !!OPENROUTER_API_KEY
                }
            },
            { status: 500 }
        );
    }

    try {
        const { image } = await request.json();

        if (!image) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        console.log('Making request to OpenRouter API...');
        console.log('Image data length:', image.length);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
                'X-Title': 'AI Color Extractor'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this image and extract its main color(Avoid excessive saturation) along with 4 complementary colors that would work well together. Return ONLY a JSON object with exactly this structure, no markdown or explanation: {"mainColor": "#HEXCODE", "derivativeColors": ["#HEXCODE1", "#HEXCODE2", "#HEXCODE3", "#HEXCODE4"]}. All colors must be valid hex codes starting with #.'
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: image
                                }
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('OpenRouter API error response:', errorData);
            throw new Error(
                errorData.error?.message ||
                `Failed to analyze image. Status: ${response.status}. ${JSON.stringify(errorData)}`
            );
        }

        const data = await response.json();
        console.log('OpenRouter API response received');

        if (!data.choices?.[0]?.message?.content) {
            console.error('Unexpected API response format:', data);
            throw new Error('Invalid response format from API');
        }

        const content = data.choices[0].message.content;
        console.log('Raw API response content:', content);

        // Try to extract JSON from the response if it's wrapped in markdown
        let jsonContent = content;
        try {
            // If the content is wrapped in markdown code blocks, extract just the JSON
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1];
            }

            const colors = JSON.parse(jsonContent);

            if (!colors.mainColor || !Array.isArray(colors.derivativeColors) || colors.derivativeColors.length !== 4) {
                throw new Error('Invalid color data format received from API');
            }

            // Validate hex color formats
            const isValidHex = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);
            if (!isValidHex(colors.mainColor) || !colors.derivativeColors.every(isValidHex)) {
                throw new Error('Invalid hex color format received from API');
            }

            return NextResponse.json(colors);
        } catch (parseError) {
            console.error('Failed to parse API response:', parseError);
            console.error('Raw content:', content);
            console.error('Attempted to parse:', jsonContent);
            throw new Error('Failed to parse color data from API response');
        }
    } catch (error) {
        console.error('Error analyzing image:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to analyze image',
                debug: {
                    env: process.env.NODE_ENV,
                    hasKey: !!OPENROUTER_API_KEY
                }
            },
            { status: 500 }
        );
    }
} 