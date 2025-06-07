
import { z } from "zod";

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Email validation schema
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .min(1, "Email is required");

// Interviewer code validation
export const interviewerCodeSchema = z
  .string()
  .min(1, "Interviewer code is required")
  .max(20, "Interviewer code must be 20 characters or less")
  .regex(/^[A-Za-z0-9-_]+$/, "Interviewer code can only contain letters, numbers, hyphens, and underscores");

// Location validation
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
});

// Session data validation
export const sessionSchema = z.object({
  interviewer_id: z.string().uuid(),
  project_id: z.string().uuid().optional(),
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  start_address: z.string().optional(),
});

// Interview data validation
export const interviewSchema = z.object({
  session_id: z.string().uuid(),
  candidate_name: z.string().min(1, "Candidate name is required").max(100),
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  start_address: z.string().optional(),
});

// Project data validation
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date must be in YYYY-MM-DD format"),
  excluded_islands: z.array(z.enum(['Bonaire', 'Saba', 'Sint Eustatius'])).optional(),
});

// Interviewer data validation
export const interviewerSchema = z.object({
  code: interviewerCodeSchema,
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),
  email: emailSchema.optional(),
  island: z.enum(['Aruba', 'Bonaire', 'Curaçao', 'Saba', 'Sint Eustatius', 'Sint Maarten']).optional(),
});

// Sanitization functions
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export const sanitizeInterviewerCode = (code: string): string => {
  return code.trim().toUpperCase();
};

// Validation helper functions
export const validateAndSanitize = <T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        errors: error.errors.map(err => err.message) 
      };
    }
    return { 
      success: false, 
      errors: ['Validation failed'] 
    };
  }
};
