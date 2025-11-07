-- Adicionar categorias Gastos Fixos e Gastos Variáveis
INSERT INTO public.categories (name, color, icon) 
VALUES 
  ('Gastos Fixos', '#22c55e', 'calendar-check'),
  ('Gastos Variáveis', '#f97316', 'trending-up')
ON CONFLICT DO NOTHING;

-- Criar tabela de atividades/notificações
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_name TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para activities (apenas leitura, não permite alteração)
CREATE POLICY "Todos podem visualizar atividades"
ON public.activities
FOR SELECT
USING (true);

CREATE POLICY "Sistema pode criar atividades"
ON public.activities
FOR INSERT
WITH CHECK (true);