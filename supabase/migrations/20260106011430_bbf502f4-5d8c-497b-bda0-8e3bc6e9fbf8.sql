-- Tabela para gastos previstos/recorrentes
CREATE TABLE public.planned_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para rastrear pagamentos mensais dos gastos previstos
CREATE TABLE public.planned_expense_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  planned_expense_id UUID NOT NULL REFERENCES public.planned_expenses(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(planned_expense_id, month, year)
);

-- Enable RLS
ALTER TABLE public.planned_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_expense_payments ENABLE ROW LEVEL SECURITY;

-- Policies for planned_expenses
CREATE POLICY "Todos podem visualizar gastos previstos" 
ON public.planned_expenses FOR SELECT USING (true);

CREATE POLICY "Todos podem criar gastos previstos" 
ON public.planned_expenses FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos podem atualizar gastos previstos" 
ON public.planned_expenses FOR UPDATE USING (true);

CREATE POLICY "Todos podem deletar gastos previstos" 
ON public.planned_expenses FOR DELETE USING (true);

-- Policies for planned_expense_payments
CREATE POLICY "Todos podem visualizar pagamentos" 
ON public.planned_expense_payments FOR SELECT USING (true);

CREATE POLICY "Todos podem criar pagamentos" 
ON public.planned_expense_payments FOR INSERT WITH CHECK (true);

CREATE POLICY "Todos podem atualizar pagamentos" 
ON public.planned_expense_payments FOR UPDATE USING (true);

CREATE POLICY "Todos podem deletar pagamentos" 
ON public.planned_expense_payments FOR DELETE USING (true);