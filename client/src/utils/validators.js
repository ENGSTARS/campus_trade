import { z } from 'zod'

const universityEmailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]*\.(edu|ac\.[a-z]{2,})$/i

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name is required'),
    email: z
      .string()
      .email('Enter a valid email')
      .regex(universityEmailRegex, 'Use a valid university email'),
    campus: z.string().min(2, 'Campus is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Confirm your password'),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(400, 'Keep your comment under 400 characters'),
})

export const reportSchema = z.object({
  reason: z.string().min(1, 'Please choose a reason'),
  details: z.string().max(250, 'Details should be 250 characters or less').optional(),
})

export const profileSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  bio: z.string().max(180, 'Bio should be 180 characters or less').optional(),
  campus: z.string().min(2, 'Campus is required'),
})

export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120, 'Title is too long'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description should be 500 characters or less'),
  price: z.coerce.number().positive('Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  condition: z.string().min(1, 'Condition is required'),
  type: z.enum(['NEW', 'SECOND_HAND']),
  campus: z.string().min(1, 'Campus is required'),
  imageUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^https?:\/\/\S+$/i.test(value), 'Enter a valid image URL'),
})
