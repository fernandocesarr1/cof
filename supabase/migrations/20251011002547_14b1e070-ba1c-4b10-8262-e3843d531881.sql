-- Criar tabela de categorias
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B5CF6',
  icon TEXT NOT NULL DEFAULT 'tag',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Criar tabela de despesas
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Habilitar RLS (mas permitir acesso público para app familiar)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir todas as operações (app familiar compartilhado)
CREATE POLICY "Todos podem visualizar categorias"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar categorias"
  ON public.categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar categorias"
  ON public.categories FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar categorias"
  ON public.categories FOR DELETE
  USING (true);

CREATE POLICY "Todos podem visualizar despesas"
  ON public.expenses FOR SELECT
  USING (true);

CREATE POLICY "Todos podem criar despesas"
  ON public.expenses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Todos podem atualizar despesas"
  ON public.expenses FOR UPDATE
  USING (true);

CREATE POLICY "Todos podem deletar despesas"
  ON public.expenses FOR DELETE
  USING (true);

-- Inserir algumas categorias padrão
INSERT INTO public.categories (name, color, icon) VALUES
  ('Alimentação', '#10b981', 'utensils'),
  ('Transporte', '#3b82f6', 'car'),
  ('Saúde', '#ef4444', 'heart-pulse'),
  ('Educação', '#8b5cf6', 'graduation-cap'),
  ('Lazer', '#f59e0b', 'gamepad-2'),
  ('Moradia', '#06b6d4', 'home'),
  ('Outros', '#6b7280', 'tag');