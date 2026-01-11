-- Adicionar person_id na tabela de pagamentos de gastos previstos
ALTER TABLE public.planned_expense_payments 
ADD COLUMN person_id uuid REFERENCES public.people(id);