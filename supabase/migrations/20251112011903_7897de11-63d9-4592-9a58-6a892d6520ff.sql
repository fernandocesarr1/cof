-- Criar bucket para fotos de pessoas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true);

-- Políticas de storage para avatars
CREATE POLICY "Todos podem visualizar avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Todos podem fazer upload de avatars"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Todos podem atualizar avatars"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars');

CREATE POLICY "Todos podem deletar avatars"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars');

-- Adicionar coluna avatar_url na tabela people
ALTER TABLE people ADD COLUMN avatar_url text;