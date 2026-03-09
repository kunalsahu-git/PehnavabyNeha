'use server';
/**
 * @fileOverview A Genkit flow for generating creative and brand-consistent product descriptions.
 *
 * - generateProductDescription - A function that handles the product description generation process.
 * - GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * - GenerateProductDescriptionOutput - The return type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  category: z.string().describe('The category of the product (e.g., "Saree", "Dress", "Jewellery").'),
  fabric: z.string().describe('The primary fabric of the product (e.g., "Silk", "Cotton", "Chiffon").'),
  features: z.array(z.string()).describe('A list of key features or design elements of the product (e.g., "embroidered details", "flowy silhouette", "detachable belt").'),
  occasion: z.string().optional().describe('The primary occasion for which the product is suitable (e.g., "Wedding", "Festive", "Casual").'),
  style: z.string().optional().describe('The overall style or aesthetic of the product (e.g., "Bohemian", "Classic", "Modern ethnic").'),
  keywords: z.array(z.string()).optional().describe('Additional keywords or themes associated with the product.'),
  length: z.string().optional().describe('The length of the garment (e.g., "mini", "midi", "maxi", "floor-length").'),
  tone: z.string().default('luxurious, elegant, warm, feminine').describe('The desired tone for the description. Default is "luxurious, elegant, warm, feminine".'),
});
export type GenerateProductDescriptionInput = z.infer<typeof GenerateProductDescriptionInputSchema>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z.string().describe('The AI-generated product description.'),
});
export type GenerateProductDescriptionOutput = z.infer<typeof GenerateProductDescriptionOutputSchema>;

export async function generateProductDescription(input: GenerateProductDescriptionInput): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const generateProductDescriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert copywriter for "Pehnava by Neha", a luxury boutique specializing in women's fashion with a focus on South Asian heritage, editorial feel, warmth, and femininity. Your task is to craft a creative, engaging, and brand-consistent product description based on the provided attributes.

Keep the tone: {{{tone}}}.

Product Name: {{{productName}}}
Category: {{{category}}}
Fabric: {{{fabric}}}
Features: {{#each features}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
{{#if occasion}}Occasion: {{{occasion}}}{{/if}}
{{#if style}}Style: {{{style}}}{{/if}}
{{#if keywords}}Keywords: {{#each keywords}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{#if length}}Length: {{{length}}}{{/if}}

Create a compelling, detailed product description that highlights its unique selling points, appeals to our target audience, and reflects the brand's luxury aesthetic. The description should be approximately 150-250 words and suitable for an e-commerce product page. Focus on sensory details, how the product makes the wearer feel, and its versatility.
`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateProductDescriptionPrompt(input);
    return output!;
  }
);
