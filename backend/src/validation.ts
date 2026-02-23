import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const businessUpdateSchema = z.object({
  industry: z.string().optional(),
  botPersonality: z.string().optional(),
  customInstructions: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  name: z.string().optional(),
  twilioPhone: z.string().optional(),
});

export const bookingCreateSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(3),
  serviceType: z.string().optional(),
  date: z.string().min(1),
  time: z.string().min(1),
  notes: z.string().optional().nullable(),
});

export const bookingStatusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
});

export const scannerScanSchema = z.object({
  url: z.string().url(),
});

