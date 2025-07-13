# Adapta Hackathon Agent Recommender API

API para recomendação de produtos usando embeddings e similaridade com Fastify, LangChain, pgvector e Supabase.

## ✅ Status: COMPLETO (95%)

### Funcionalidades Implementadas
- ✅ CRUD para Solution Owners com embeddings automáticos
- ✅ CRUD para Solution Products com embeddings automáticos  
- ✅ Sistema de chat com histórico em threads
- ✅ Onboarding de usuários com contexto personalizado
- ✅ Sistema de recomendações por similaridade
- ✅ Resumos automáticos de conversas
- ✅ Atualização automática de contexto do usuário
- ✅ Busca por similaridade em produtos/owners/contextos
- ✅ Documentação Swagger completa

## 🚀 Setup Rápido

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp env.example .env
```

Editar `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_PROJECT_ID=your_project_id
OPENAI_API_KEY=your_openai_api_key
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Configurar Supabase
Execute o conteúdo do arquivo `SQL_FUNCTIONS.sql` no SQL Editor do Supabase.

### 4. Executar API
```bash
npm run dev
```

### 5. Acessar Documentação
- API: http://localhost:3000
- Docs: http://localhost:3000/docs
- Health: http://localhost:3000/health

## 📋 Endpoints Principais

### Solution Owners
```bash
# Criar solution owner
POST /api/solution-owners
{
  "company_name": "TechCorp",
  "domain": "tech.com",
  "metadata": {
    "industry": "Technology",
    "size": "Medium",
    "focus": "AI Solutions"
  },
  "output_base_prompt": {
    "style": "professional",
    "tone": "technical",
    "expertise": "AI/ML"
  }
}

# Listar owners
GET /api/solution-owners?limit=10&offset=0

# Buscar por similaridade
POST /api/solution-owners/search
{
  "query": "AI technology company",
  "threshold": 0.7,
  "limit": 5
}
```

### Solution Products
```bash
# Criar produto
POST /api/solution-products
{
  "owner_id": "uuid-do-owner",
  "metadata": {
    "name": "AI Chatbot Platform",
    "category": "Software",
    "price": "Enterprise",
    "features": ["NLP", "ML", "Analytics"]
  },
  "output_base_prompt": {
    "description": "Advanced AI chatbot platform",
    "benefits": ["24/7 support", "Cost reduction", "User satisfaction"]
  }
}

# Buscar produtos por owner
GET /api/solution-products?owner_id=uuid-do-owner

# Buscar por similaridade
POST /api/solution-products/search
{
  "query": "chatbot artificial intelligence",
  "threshold": 0.7,
  "limit": 10
}
```

### Chat e Histórico
```bash
# Enviar mensagem
POST /api/chat/message
{
  "session_id": "session-123",
  "message": {
    "role": "user",
    "content": "Preciso de uma solução de chatbot para minha empresa"
  },
  "user_id": "user-456"
}

# Buscar histórico
GET /api/chat/history/session-123?limit=50&offset=0

# Buscar threads do usuário
GET /api/chat/threads/user-456?days_back=30
```

### Onboarding e Contexto
```bash
# Onboarding do usuário
POST /api/users/onboarding
{
  "user_id": "user-456",
  "metadata": {
    "company": "StartupXYZ",
    "industry": "E-commerce",
    "needs": ["Customer support", "Automation"],
    "budget": "10k-50k",
    "timeline": "Q1 2024"
  },
  "output_base_prompt": {
    "preferences": "Cost-effective solutions",
    "priorities": ["ROI", "Ease of use", "Scalability"]
  }
}

# Buscar contexto do usuário
GET /api/users/user-456/context

# Atualizar contexto
PUT /api/users/user-456/context
{
  "metadata": {
    "updated_needs": ["AI integration", "Analytics"]
  }
}
```

### Recomendações
```bash
# Gerar recomendações personalizadas
POST /api/recommendations
{
  "user_id": "user-456",
  "session_id": "session-123",
  "limit": 10,
  "similarity_threshold": 0.7
}

# Buscar produtos por texto
POST /api/recommendations/search
{
  "query": "AI chatbot customer support",
  "limit": 5,
  "similarity_threshold": 0.8
}

# Produtos similares
GET /api/recommendations/similar/product-uuid?limit=5&similarity_threshold=0.8
```

## 🎯 Fluxo Completo de Uso

### 1. Cadastrar Solution Owner
```bash
curl -X POST http://localhost:3000/api/solution-owners \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "AI Solutions Inc",
    "domain": "aisolutions.com",
    "metadata": {
      "industry": "Artificial Intelligence",
      "established": "2020",
      "employees": "50-100",
      "specialties": ["NLP", "Computer Vision", "Automation"]
    },
    "output_base_prompt": {
      "approach": "Data-driven AI solutions",
      "values": ["Innovation", "Reliability", "Scalability"]
    }
  }'
```

### 2. Cadastrar Produtos
```bash
curl -X POST http://localhost:3000/api/solution-products \
  -H "Content-Type: application/json" \
  -d '{
    "owner_id": "uuid-retornado-acima",
    "metadata": {
      "name": "Smart Customer Support Bot",
      "category": "Customer Service",
      "pricing": "SaaS - $299/month",
      "features": ["24/7 availability", "Multi-language", "CRM integration"],
      "target_audience": "E-commerce, SaaS companies"
    },
    "output_base_prompt": {
      "value_proposition": "Reduce support costs by 60% while improving customer satisfaction",
      "key_benefits": ["Cost reduction", "Response time improvement", "24/7 availability"]
    }
  }'
```

### 3. Fazer Onboarding do Usuário
```bash
curl -X POST http://localhost:3000/api/users/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "metadata": {
      "company": "E-Shop Pro",
      "industry": "E-commerce",
      "company_size": "50-100 employees",
      "current_challenges": ["High support volume", "Response time", "Cost control"],
      "budget_range": "$200-500/month",
      "decision_timeline": "Next quarter"
    },
    "output_base_prompt": {
      "priorities": ["Cost efficiency", "Easy integration", "Proven ROI"],
      "evaluation_criteria": ["Price", "Features", "Support quality"]
    }
  }'
```

### 4. Iniciar Conversa
```bash
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "conv-789",
    "user_id": "user-123",
    "message": {
      "role": "user",
      "content": "Preciso de uma solução para automatizar o atendimento ao cliente da minha loja online. Recebemos cerca de 200 tickets por dia e queremos reduzir custos mantendo a qualidade."
    }
  }'
```

### 5. Gerar Recomendações
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user-123",
    "session_id": "conv-789",
    "limit": 5,
    "similarity_threshold": 0.7
  }'
```

## 🔧 Arquitetura

### Estrutura de Pastas
```
src/
├── config/          # Configurações (DB, env)
├── types/           # Tipos TypeScript e DTOs
├── services/        # Lógica de negócio
│   ├── embeddings.service.ts    # Geração de embeddings
│   ├── summary.service.ts       # Resumos com LLM
│   ├── chat.service.ts          # Orquestração de chat
│   └── recommendation.service.ts # Engine de recomendações
├── repositories/    # Acesso a dados
├── routes/          # Endpoints da API
└── index.ts         # Servidor principal
```

### Fluxo de Dados
1. **Input**: Usuário envia dados (owner, produto, mensagem)
2. **Embeddings**: Texto → vetor usando OpenAI
3. **Storage**: Dados + embeddings salvos no Supabase
4. **Chat**: Mensagens → resumo → atualização contexto
5. **Recommendations**: Contexto + thread → similarity search → produtos

### Tecnologias
- **Fastify**: Web framework rápido
- **LangChain**: Integração com LLMs
- **OpenAI**: Embeddings e resumos
- **Supabase**: Banco PostgreSQL + pgvector
- **TypeScript**: Type safety
- **Zod**: Validação de dados

## 📊 Similarity Search

### Como Funciona
1. Texto é convertido em embedding (vetor 1536 dimensões)
2. Busca por cosine similarity no banco
3. Threshold padrão: 0.7 (70% similaridade)
4. Resultados ordenados por relevância

### Otimização
- Índices IVFFLAT para busca vetorial rápida
- Funções SQL customizadas para performance
- Cache de embeddings para reutilização

## 🧪 Testes

### Testar Endpoints
```bash
# Health check
curl http://localhost:3000/health

# Swagger UI
open http://localhost:3000/docs

# Teste completo
npm run test
```

### Validar Similaridade
```bash
# Criar produto
POST /api/solution-products + dados

# Buscar similar
POST /api/solution-products/search
{
  "query": "mesmas palavras-chave do produto criado",
  "threshold": 0.5
}
# Deve retornar o produto criado com alta similaridade
```

## 🚀 Deploy

### Environment Variables
```env
NODE_ENV=production
PORT=8080
LOG_LEVEL=warn
# ... outras variáveis
```

### Build
```bash
npm run build
npm start
```

## 🔒 Segurança

### Configurar RLS no Supabase
```sql
-- Habilitar Row Level Security
ALTER TABLE solutions_owner ENABLE ROW LEVEL SECURITY;

-- Criar políticas conforme necessário
CREATE POLICY "Enable access" ON solutions_owner FOR ALL USING (true);
```

### Rate Limiting
```typescript
// Adicionar ao Fastify se necessário
await fastify.register(import('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute'
});
```

## 🐛 Troubleshooting

### Problemas Comuns

1. **Embeddings vazios**: Verificar OpenAI API key
2. **Similarity search não funciona**: Executar SQL_FUNCTIONS.sql
3. **Erro de conexão**: Verificar credenciais Supabase
4. **Performance lenta**: Verificar índices no banco

### Logs
```bash
# Logs detalhados
LOG_LEVEL=debug npm run dev

# Logs de produção
LOG_LEVEL=warn npm start
```

## 📈 Performance

### Métricas Esperadas
- **Embeddings**: ~100ms por texto
- **Similarity search**: ~50ms para 10 resultados
- **Chat processing**: ~500ms (embedding + summary + update)
- **Recommendations**: ~200ms

### Otimizações
- Batch embeddings quando possível
- Cache de embeddings frequentes
- Índices adequados no banco
- Pooling de conexões

## 🎁 Funcionalidades Extras

### Analytics
```bash
# Padrões de conversa
GET /api/chat/patterns/user-123

# Padrões de recomendação  
GET /api/recommendations/patterns/user-123
```

### Maintenance
```bash
# Limpar mensagens antigas
DELETE /api/chat/cleanup?days_old=90
```

### Search Avançado
```bash
# Buscar mensagens por conteúdo
POST /api/chat/search
{
  "query": "chatbot pricing",
  "session_id": "optional",
  "limit": 20
}
```

---

**Desenvolvido para o Adapta Hackathon** 🚀

Para dúvidas ou contribuições, consulte a documentação completa em `/docs` ou acesse o Swagger UI. 
