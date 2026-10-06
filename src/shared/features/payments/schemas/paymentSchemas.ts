import { z } from 'zod';

export const paymentMethodSchema = z.enum(['cash', 'online']);
export const supportedPaymentMethodsSchema = z.enum(['cash', 'online', 'both']);
