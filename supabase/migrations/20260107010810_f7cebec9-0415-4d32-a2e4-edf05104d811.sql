-- Add paid_amount column to track actual paid value
ALTER TABLE public.planned_expense_payments 
ADD COLUMN paid_amount numeric;