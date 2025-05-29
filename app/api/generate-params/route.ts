import { NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Helper function to check if a color is too bright
const isColorTooBright = (hexColor: string): boolean => {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate perceived brightness using the formula: (R * 299 + G * 587 + B * 114) / 1000
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Consider colors with brightness > 180 (out of 255) as too bright
    return brightness > 180;
};

export async function POST(request: Request) {
    if (!OPENROUTER_API_KEY) {
        console.error('OpenRouter API key is not configured');
        return NextResponse.json(
            { error: 'Server configuration error: API key not found' },
            { status: 500 }
        );
    }

    try {
        const { prompt, shaderId, shaderCategory, shaderType, currentParams } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'No prompt provided' },
                { status: 400 }
            );
        }

        // Select appropriate parameter usage guides based on shader category
        let colorUsageGuide = '';
        let shapeUsageGuide = '';
        let colorConstraints = '';

        switch (shaderCategory) {
            case 'effect':
                colorUsageGuide = `
- color1: Primary effect color, used for the main visual effect
- color2: Transition color, used for effect gradients and transitions
- color3: Overlay color, used for effect layering
- color4: Highlight color, used for effect highlights
- bgColor: Base color, affects the overall effect tone
- lightness: Effect intensity, controls the overall effect strength`;
                break;

            case 'background':
                if (shaderType === 'dynamic') {
                    colorUsageGuide = `
- color1: Primary pattern color for main visual elements
- color2: Secondary pattern color for supporting elements
- color3: Detail color for transitions and fine details
- color4: Accent color for highlights and decorations
- bgColor: Base background color (MUST be dark or medium dark to ensure text readability)
- lightness: Overall pattern brightness (keep moderate to ensure text visibility)`;
                    colorConstraints = `
IMPORTANT COLOR CONSTRAINTS for dynamic background shaders:
1. bgColor MUST be dark or medium-dark (avoid bright colors like white, light gray, or very light pastels)
2. All colors should maintain good contrast with white text
3. Avoid very bright or saturated colors that might compete with overlaid content
4. Prefer deeper, richer colors that provide a subtle background`;
                } else if (shaderId.includes('Gradient')) {
                    colorUsageGuide = `
- color1: Primary gradient start color
- color2: Primary gradient end color
- color3: Secondary gradient start color
- color4: Secondary gradient end color
- bgColor: Base background color
- lightness: Overall gradient brightness`;
                    shapeUsageGuide = `
Shape parameters affect the gradient pattern:
- position: Controls the gradient center position
- scaleX/Y: Controls gradient stretch
- complex: Affects gradient complexity
- morph: Controls gradient pattern morphing`;
                } else if (shaderId.includes('Curve')) {
                    colorUsageGuide = `
- color1: Primary curve color
- color2: Secondary curve color
- color3: Curve decoration color
- color4: Curve highlight color
- bgColor: Background base color
- lightness: Overall curve brightness`;
                    shapeUsageGuide = `
Shape parameters affect the curve characteristics:
- position: Controls curve position offset
- scaleX/Y: Controls curve stretch
- complex: Affects curve complexity
- morph: Controls curve deformation`;
                } else {
                    colorUsageGuide = `
- color1: Primary pattern color for main visual elements
- color2: Secondary pattern color for supporting elements
- color3: Detail color for transitions and fine details
- color4: Accent color for highlights and decorations
- bgColor: Base background color
- lightness: Overall pattern brightness`;
                    shapeUsageGuide = `
Shape parameters affect the pattern:
- position: Controls pattern center position
- scaleX/Y: Controls pattern scale
- complex: Affects pattern complexity
- morph: Controls pattern transformation`;
                }
                break;

            default:
                colorUsageGuide = `
- color1: Primary color for main elements
- color2: Secondary color for supporting elements
- color3: Detail color for decorative elements
- color4: Accent color for visual highlights
- bgColor: Base background color
- lightness: Overall brightness`;
                break;
        }

        const systemPrompt = `You are a shader parameter generator specializing in ${shaderCategory} shaders. Your task is to generate color and shape parameters based on the given prompt and shader category.

The shader "${shaderId}" is in the "${shaderCategory}" category${shaderType ? ` and is of type "${shaderType}"` : ''}. The parameters have the following specific uses:

${colorUsageGuide}

${shapeUsageGuide}

${colorConstraints}

IMPORTANT PARAMETER CONSTRAINTS:
1. Keep these parameters close to their default values unless specifically requested:
   - lightness: prefer values around 0
   - position: prefer values close to {x: 0, y: 0}
   - scaleX and scaleY: prefer values close to 1.0
   - complex: prefer values close to 1.0~2.0
2. Focus variations mainly on:
   - colors (color1, color2, color3, color4, bgColor)
   - complex (pattern complexity)
   - morph (pattern transformation)

Return ONLY a JSON object with this exact structure:
{
  "color": {
    "color1": "#HEXCODE",
    "color2": "#HEXCODE",
    "color3": "#HEXCODE",
    "color4": "#HEXCODE",
    "bgColor": "#HEXCODE",
    "lightness": number (0-1, prefer close to 0)
  },
  "shape": {
    "position": {"x": number (-1 to 1, prefer close to 0), "y": number (-1 to 1, prefer close to 0)},
    "scaleX": number (0.1-2, prefer close to 1),
    "scaleY": number (0.1-2, prefer close to 1),
    "complex": number (0-10),
    "morph": number (0-1)
  }
}

Consider the shader category and parameter usage when generating values. All colors must be valid hex codes. All numbers must be within their specified ranges.

Current prompt: ${prompt}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
                'X-Title': 'Shader Box'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: `Generate parameters for the ${shaderId} shader that represents: ${prompt}`
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.error?.message ||
                `Failed to generate parameters. Status: ${response.status}`
            );
        }

        const data = await response.json();

        if (!data.choices?.[0]?.message?.content) {
            throw new Error('Invalid response format from API');
        }

        const content = data.choices[0].message.content;
        let jsonContent = content;

        try {
            // If the content is wrapped in markdown code blocks, extract just the JSON
            const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1];
            }

            const params = JSON.parse(jsonContent);

            // Validate color parameters
            const isValidHex = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);
            const isValidNumber = (num: number, min: number, max: number) =>
                typeof num === 'number' && !isNaN(num) && num >= min && num <= max;

            if (!params.color || !params.shape) {
                throw new Error('Missing required parameters');
            }

            // For dynamic shaders, ensure bgColor is not too bright
            if (shaderType === 'dynamic' && isColorTooBright(params.color.bgColor)) {
                // Darken the color by reducing each component by 40%
                const r = Math.floor(parseInt(params.color.bgColor.slice(1, 3), 16) * 0.6).toString(16).padStart(2, '0');
                const g = Math.floor(parseInt(params.color.bgColor.slice(3, 5), 16) * 0.6).toString(16).padStart(2, '0');
                const b = Math.floor(parseInt(params.color.bgColor.slice(5, 7), 16) * 0.6).toString(16).padStart(2, '0');
                params.color.bgColor = `#${r}${g}${b}`;
            }

            // Validate colors
            if (!isValidHex(params.color.color1) ||
                !isValidHex(params.color.color2) ||
                !isValidHex(params.color.color3) ||
                !isValidHex(params.color.color4) ||
                !isValidHex(params.color.bgColor) ||
                !isValidNumber(params.color.lightness, 0, 1)) {
                throw new Error('Invalid color parameters');
            }

            // Validate shape parameters
            if (!isValidNumber(params.shape.position.x, -1, 1) ||
                !isValidNumber(params.shape.position.y, -1, 1) ||
                !isValidNumber(params.shape.scaleX, 0.1, 2) ||
                !isValidNumber(params.shape.scaleY, 0.1, 2) ||
                !isValidNumber(params.shape.complex, 0, 10) ||
                !isValidNumber(params.shape.morph, 0, 1)) {
                throw new Error('Invalid shape parameters');
            }

            return NextResponse.json(params);
        } catch (parseError) {
            console.error('Failed to parse API response:', parseError);
            throw new Error('Failed to parse parameters from API response');
        }
    } catch (error) {
        console.error('Error generating parameters:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate parameters' },
            { status: 500 }
        );
    }
} 