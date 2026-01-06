-- Adicionar coluna de dia de vencimento
ALTER TABLE public.planned_expenses 
ADD COLUMN due_day INTEGER DEFAULT 1;