-- Criar tabela de pessoas
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para pessoas
CREATE POLICY "Todos podem visualizar pessoas" 
ON public.people 
FOR SELECT 
USING (true);

CREATE POLICY "Todos podem criar pessoas" 
ON public.people 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar pessoas" 
ON public.people 
FOR UPDATE 
USING (true);

CREATE POLICY "Todos podem deletar pessoas" 
ON public.people 
FOR DELETE 
USING (true);

-- Adicionar coluna person_id na tabela expenses
ALTER TABLE public.expenses 
ADD COLUMN person_id UUID REFERENCES public.people(id);

-- Criar tabela de orçamentos por categoria
CREATE TABLE public.category_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(category_id, month, year)
);

-- Enable RLS
ALTER TABLE public.category_budgets ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para orçamentos
CREATE POLICY "Todos podem visualizar orçamentos" 
ON public.category_budgets 
FOR SELECT 
USING (true);

CREATE POLICY "Todos podem criar orçamentos" 
ON public.category_budgets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Todos podem atualizar orçamentos" 
ON public.category_budgets 
FOR UPDATE 
USING (true);

CREATE POLICY "Todos podem deletar orçamentos" 
ON public.category_budgets 
FOR DELETE 
USING (true);

-- Adicionar coluna person_id na tabela activities
ALTER TABLE public.activities 
ADD COLUMN person_id UUID REFERENCES public.people(id);