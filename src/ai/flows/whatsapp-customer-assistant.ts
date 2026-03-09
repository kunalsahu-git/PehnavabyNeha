'use server';
/**
 * @fileOverview This file implements an AI-powered WhatsApp customer assistant flow.
 *
 * - whatsappCustomerAssistant - An async wrapper function to interact with the AI assistant.
 * - WhatsappCustomerAssistantInput - The input type for the assistant.
 * - WhatsappCustomerAssistantOutput - The output type for the assistant's response.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * Input schema for the WhatsApp customer assistant flow.
 */
const WhatsappCustomerAssistantInputSchema = z.object({
  query: z.string().describe("The customer's question or message via WhatsApp."),
  userId: z.string().describe("The unique identifier of the customer interacting with the assistant."),
});
export type WhatsappCustomerAssistantInput = z.infer<typeof WhatsappCustomerAssistantInputSchema>;

/**
 * Output schema for the WhatsApp customer assistant flow.
 */
const WhatsappCustomerAssistantOutputSchema = z.object({
  response: z.string().describe("The AI assistant's helpful and relevant response to the customer."),
});
export type WhatsappCustomerAssistantOutput = z.infer<typeof WhatsappCustomerAssistantOutputSchema>;

/**
 * A mock tool to retrieve a list of orders for a specific customer.
 * In a real application, this would query the database for the user's orders.
 */
const getCustomerOrdersTool = ai.defineTool(
  {
    name: 'getCustomerOrders',
    description: 'Retrieves a list of all orders for a given customer. Use this when the user asks about their orders in general.',
    inputSchema: z.object({
      userId: z.string().describe('The ID of the customer whose orders are being requested.'),
    }),
    outputSchema: z.array(
      z.object({
        orderId: z.string().describe('The unique identifier for the order.'),
        status: z.string().describe('The current status of the order (e.g., Delivered, Shipped, Pending Payment).'),
        totalAmount: z.number().describe('The total monetary amount of the order.'),
        orderDate: z.string().describe('The date the order was placed in YYYY-MM-DD format.'),
      })
    ),
  },
  async (input) => {
    // Mock implementation: Replace with actual database query for orders associated with input.userId
    if (input.userId === 'customer123') {
      return [
        {
          orderId: 'PN1001',
          status: 'Delivered',
          totalAmount: 1500,
          orderDate: '2023-10-20',
        },
        {
          orderId: 'PN1005',
          status: 'Shipped',
          totalAmount: 2200,
          orderDate: '2023-11-15',
        },
        {
          orderId: 'PN1010',
          status: 'Pending Payment',
          totalAmount: 950,
          orderDate: '2024-01-01',
        },
      ];
    }
    return [];
  }
);

/**
 * A mock tool to retrieve detailed information for a specific order by its ID.
 * In a real application, this would query the database for detailed order information.
 */
const getOrderDetailsTool = ai.defineTool(
  {
    name: 'getOrderDetails',
    description: 'Retrieves detailed information for a specific order by its ID. Use this when the user asks about a particular order using an order number.',
    inputSchema: z.object({
      orderId: z.string().describe('The ID of the specific order to retrieve details for.'),
    }),
    outputSchema: z
      .object({
        orderId: z.string(),
        status: z.string(),
        totalAmount: z.number(),
        orderDate: z.string(),
        shippingAddress: z.string().describe('The full shipping address for the order.'),
        trackingNumber: z.string().nullable().describe('The tracking number for the shipment, if available.'),
        items: z.array(z.object({ name: z.string(), quantity: z.number(), price: z.number() })).describe('List of items in the order.'),
      })
      .nullable(),
  },
  async (input) => {
    // Mock implementation: Replace with actual database query for order details
    if (input.orderId === 'PN1001') {
      return {
        orderId: 'PN1001',
        status: 'Delivered',
        totalAmount: 1500,
        orderDate: '2023-10-20',
        shippingAddress: '123 Fashion St, Elegant City, 12345',
        trackingNumber: null,
        items: [{ name: 'Crimson Saree', quantity: 1, price: 1500 }],
      };
    } else if (input.orderId === 'PN1005') {
      return {
        orderId: 'PN1005',
        status: 'Shipped',
        totalAmount: 2200,
        orderDate: '2023-11-15',
        shippingAddress: '456 Boutique Ave, Chic Town, 67890',
        trackingNumber: 'TRACK12345PN',
        items: [
          { name: 'Fusion Dress', quantity: 1, price: 1200 },
          { name: 'Gold Earrings', quantity: 1, price: 1000 },
        ],
      };
    } else if (input.orderId === 'PN1010') {
      return {
        orderId: 'PN1010',
        status: 'Pending Payment',
        totalAmount: 950,
        orderDate: '2024-01-01',
        shippingAddress: '789 Glamour Rd, Style Village, 11223',
        trackingNumber: null,
        items: [
          { name: 'Kurta Set', quantity: 1, price: 950 }
        ],
      };
    }
    return null;
  }
);

/**
 * A mock tool to provide information about the store's return and exchange policy.
 * In a real application, this would fetch static content from a CMS or config.
 */
const getReturnsPolicyTool = ai.defineTool(
  {
    name: 'getReturnsPolicy',
    description: 'Provides information about the return and exchange policy of Pehnava by Neha. Use this when the user asks about returns or exchanges.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    // Mock implementation: Replace with actual policy retrieval
    return `Pehnava by Neha offers a 7-day return policy for unworn, unwashed items with tags still attached. Returns must be initiated within 7 days of delivery. Custom-made items are not eligible for return. For more details or to initiate a return, please visit our website's returns page or contact human support.`;
  }
);

/**
 * A mock tool to provide information about the store's shipping policies.
 * In a real application, this would fetch static content from a CMS or config.
 */
const getShippingPolicyTool = ai.defineTool(
  {
    name: 'getShippingPolicy',
    description: 'Provides information about the shipping policies, delivery times, and charges of Pehnava by Neha. Use this when the user asks about shipping or delivery.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    // Mock implementation: Replace with actual policy retrieval
    return `We offer free standard shipping on all orders within India. Orders are typically processed within 1-2 business days and delivered within 5-7 business days. Express shipping options may be available for an additional charge. International shipping is currently not available.`;
  }
);

/**
 * The Genkit prompt definition for the WhatsApp customer assistant.
 * This prompt instructs the AI to act as a helpful customer service agent
 * and leverages tools to answer specific queries.
 */
const whatsappCustomerAssistantPrompt = ai.definePrompt({
  name: 'whatsappCustomerAssistantPrompt',
  input: { schema: WhatsappCustomerAssistantInputSchema },
  output: { schema: WhatsappCustomerAssistantOutputSchema },
  tools: [getCustomerOrdersTool, getOrderDetailsTool, getReturnsPolicyTool, getShippingPolicyTool],
  system: `You are Pehnava by Neha's AI-powered WhatsApp customer assistant, designed to provide instant, helpful answers to common questions about orders, shipping, and returns.
Your goal is to be polite, efficient, and maintain the luxury, editorial, warm, feminine, and South Asian heritage feel of the brand.

You have access to the following tools to retrieve specific information:
- 'getCustomerOrders': Use this to list a customer's recent orders when they ask generally about their orders.
- 'getOrderDetails': Use this when a customer provides a specific order ID and asks for details about that order (e.g., status, tracking, items).
- 'getReturnsPolicy': Use this when a customer asks about returning items or the return policy.
- 'getShippingPolicy': Use this when a customer asks about shipping, delivery times, or charges.

When using tools for order-related questions, always ensure you use the provided 'userId' for getCustomerOrders, and if possible, extract the 'orderId' from the user's query for getOrderDetails.

If you cannot find relevant information using your tools, or if the question is outside your scope, politely state that you can't help with that specific query and suggest they contact human support for further assistance.
Keep responses concise and to the point.
`,
  prompt: `Customer Query: {{{query}}}
Customer ID: {{{userId}}}`,
});

/**
 * The main Genkit flow for the WhatsApp customer assistant.
 * This flow takes a customer query and userId, then uses the defined prompt
 * (which can leverage tools) to generate a relevant response.
 */
const whatsappCustomerAssistantFlow = ai.defineFlow(
  {
    name: 'whatsappCustomerAssistantFlow',
    inputSchema: WhatsappCustomerAssistantInputSchema,
    outputSchema: WhatsappCustomerAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await whatsappCustomerAssistantPrompt(input);
    if (!output) {
      throw new Error('Failed to get a response from the AI assistant.');
    }
    return output;
  }
);

/**
 * Initiates a conversation with the Pehnava by Neha WhatsApp AI assistant.
 * @param input - The customer's query and their user ID.
 * @returns The AI assistant's response.
 */
export async function whatsappCustomerAssistant(
  input: WhatsappCustomerAssistantInput
): Promise<WhatsappCustomerAssistantOutput> {
  return whatsappCustomerAssistantFlow(input);
}
