-- Funções SQL para busca por similaridade no Supabase
-- Execute estas funções no SQL Editor do Supabase

-- Habilitar extensão pgvector se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS vector;

-- Função para buscar solution owners similares
CREATE OR REPLACE FUNCTION match_solution_owners(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  company_name text,
  domain text,
  metadata jsonb,
  output_base_prompt jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    so.id,
    so.company_id,
    so.company_name,
    so.domain,
    so.metadata,
    so.output_base_prompt,
    so.created_at,
    so.updated_at,
    1 - (so.embeddings <=> query_embedding) AS similarity
  FROM solutions_owner so
  WHERE so.embeddings IS NOT NULL
    AND 1 - (so.embeddings <=> query_embedding) > match_threshold
  ORDER BY so.embeddings <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Função para buscar solution products similares
CREATE OR REPLACE FUNCTION match_solution_products(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  product_id uuid,
  owner_id uuid,
  metadata jsonb,
  title text,
  categories text[],
  description text,
  url text,
  image_url text,
  output_base_prompt jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float,
  owner_info jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.product_id,
    sp.owner_id,
    sp.metadata,
    sp.title,
    sp.categories,
    sp.description,
    sp.url,
    sp.image_url,
    sp.output_base_prompt,
    sp.created_at,
    sp.updated_at,
    1 - (sp.embeddings <=> query_embedding) AS similarity,
    jsonb_build_object(
      'company_name', so.company_name,
      'domain', so.domain,
      'metadata', so.metadata
    ) AS owner_info
  FROM solutions_owner_products sp
  LEFT JOIN solutions_owner so ON so.id = sp.owner_id
  WHERE sp.embeddings IS NOT NULL
    AND 1 - (sp.embeddings <=> query_embedding) > match_threshold
  ORDER BY sp.embeddings <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Função para buscar user contexts similares
CREATE OR REPLACE FUNCTION match_user_contexts(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  context_id uuid,
  user_id uuid,
  metadata jsonb,
  output_base_prompt jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    uc.id,
    uc.context_id,
    uc.user_id,
    uc.metadata,
    uc.output_base_prompt,
    uc.created_at,
    uc.updated_at,
    1 - (uc.embeddings <=> query_embedding) AS similarity
  FROM users_enhanced_context uc
  WHERE uc.embeddings IS NOT NULL
    AND 1 - (uc.embeddings <=> query_embedding) > match_threshold
  ORDER BY uc.embeddings <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Função para buscar documentos genéricos (usado na configuração base)
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  table_name text DEFAULT 'solutions_owner_products'
)
RETURNS TABLE (
  id uuid,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  sql_query text;
BEGIN
  sql_query := format(
    'SELECT id, metadata, 1 - (embeddings <=> $1) AS similarity 
     FROM %I 
     WHERE embeddings IS NOT NULL 
       AND 1 - (embeddings <=> $1) > $2 
     ORDER BY embeddings <=> $1 
     LIMIT $3',
    table_name
  );
  
  RETURN QUERY EXECUTE sql_query USING query_embedding, match_threshold, match_count;
END;
$$;

-- Índices para otimizar busca por similaridade
CREATE INDEX IF NOT EXISTS solutions_owner_embeddings_idx ON solutions_owner USING ivfflat (embeddings vector_cosine_ops);
CREATE INDEX IF NOT EXISTS solutions_owner_products_embeddings_idx ON solutions_owner_products USING ivfflat (embeddings vector_cosine_ops);
CREATE INDEX IF NOT EXISTS users_enhanced_context_embeddings_idx ON users_enhanced_context USING ivfflat (embeddings vector_cosine_ops);

-- Políticas de RLS (Row Level Security) - opcional, ajustar conforme necessário
-- ALTER TABLE solutions_owner ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE solutions_owner_products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users_enhanced_context ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users_chat_history ENABLE ROW LEVEL SECURITY;

-- Exemplo de política para permitir acesso público (ajustar conforme necessário)
-- CREATE POLICY "Enable read access for all users" ON solutions_owner FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON solutions_owner FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update access for all users" ON solutions_owner FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete access for all users" ON solutions_owner FOR DELETE USING (true);

-- Repetir para outras tabelas conforme necessário... 
