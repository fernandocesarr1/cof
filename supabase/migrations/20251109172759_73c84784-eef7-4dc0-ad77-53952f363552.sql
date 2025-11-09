-- Adicionar coluna tipo nas categorias
ALTER TABLE public.categories 
ADD COLUMN tipo TEXT NOT NULL DEFAULT 'variavel';

-- Atualizar categorias existentes
UPDATE public.categories 
SET tipo = 'fixo' 
WHERE name IN ('Gastos Fixos', 'Moradia', 'Transporte', 'Educação', 'Saúde');

UPDATE public.categories 
SET tipo = 'variavel' 
WHERE name IN ('Gastos Variáveis', 'Alimentação', 'Lazer', 'Outros');