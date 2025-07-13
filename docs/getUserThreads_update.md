# Atualização do método getUserThreads

## Resumo das mudanças

O método `getUserThreads` foi atualizado para incluir as mensagens das threads no response, conforme solicitado.

## Alterações implementadas

### Antes:
```typescript
async getUserThreads(userId: string): Promise<
  Array<{
    session_id: string;
    message_count: number;
    last_activity: string;
    summary?: string;
  }>
>
```

### Depois:
```typescript
async getUserThreads(userId: string): Promise<
  Array<{
    session_id: string;
    message_count: number;
    last_activity: string;
    summary?: string;
    messages: Array<{
      id: number;
      message: Record<string, any>;
      timestamp: string;
    }>;
  }>
>
```

## Mudanças no código

1. **Tipo de retorno**: Adicionado campo `messages` ao tipo de retorno
2. **Busca de mensagens**: Alterado de `findRecentBySessionId` para `findAllBySessionId` para buscar todas as mensagens da thread
3. **Mapeamento de mensagens**: Adicionado mapeamento das mensagens no formato esperado

## Endpoint afetado

- **GET** `/api/chat/threads/:userId`
- **Response**: Agora inclui o array `messages` para cada thread

## Exemplo de response

```json
[
  {
    "session_id": "session-123",
    "message_count": 5,
    "last_activity": "2024-01-15T10:30:00Z",
    "summary": "Discussão sobre implementação de API",
    "messages": [
      {
        "id": 1,
        "message": {
          "role": "user",
          "content": "Como implementar a API?"
        },
        "timestamp": "1"
      },
      {
        "id": 2,
        "message": {
          "role": "assistant",
          "content": "Você pode começar definindo os endpoints..."
        },
        "timestamp": "2"
      }
    ]
  }
]
```

## Considerações

- A performance pode ser impactada para usuários com muitas threads e mensagens
- Considere implementar paginação ou limitação de mensagens se necessário
- O campo `timestamp` está sendo preenchido com o `id` da mensagem convertido para string 

# User Enhanced Context Repository Updates

## Novos Métodos de Upsert

### `upsert(data: OnboardingInput)`

**Descrição**: Implementa a lógica de "upsert" para contextos de usuário:
- Se existe um contexto para o usuário, atualiza o contexto existente
- Se não existe, cria um novo contexto

**Parâmetros**:
- `data`: Dados do onboarding do usuário (`OnboardingInput`)

**Retorno**: `UserEnhancedContextResponse`

**Exemplo de uso**:
```typescript
const userContext = await userEnhancedContextRepository.upsert({
  user_id: "user123",
  metadata: { preferences: "tech" },
  output_base_prompt: { style: "casual" }
});
```

### `upsertWithThreadSummary(userId: string, threadSummary: string, metadata?: Record<string, any>)`

**Descrição**: Implementa a lógica de "upsert" com resumo de thread:
- Se existe um contexto para o usuário, atualiza com o resumo da thread
- Se não existe, cria um novo contexto e depois atualiza com o resumo

**Parâmetros**:
- `userId`: ID do usuário
- `threadSummary`: Resumo da thread de conversa
- `metadata`: Metadados adicionais (opcional)

**Retorno**: `UserEnhancedContextResponse`

**Exemplo de uso**:
```typescript
const userContext = await userEnhancedContextRepository.upsertWithThreadSummary(
  "user123",
  "Usuário interessado em soluções de automação",
  { preferences: "tech", industry: "fintech" }
);
```

## Mudanças no Método Existente

### `updateWithThreadSummary()`

**Alteração**: Agora retorna `null` se o contexto do usuário não for encontrado (anteriormente causava erro).

**Comportamento atual**:
- Se o contexto existe: atualiza com o resumo da thread
- Se o contexto não existe: retorna `null`

**Recomendação**: Use `upsertWithThreadSummary()` em vez de `updateWithThreadSummary()` para garantir que o contexto seja criado se não existir.

## Fluxo de Uso Recomendado

### Para Onboarding:
```typescript
// Sempre use upsert para onboarding
const userContext = await userEnhancedContextRepository.upsert(onboardingData);
```

### Para Atualização com Thread:
```typescript
// Use upsertWithThreadSummary para garantir que funcione mesmo se o contexto não existir
const userContext = await userEnhancedContextRepository.upsertWithThreadSummary(
  userId,
  threadSummary,
  metadata
);
```

### Para Verificação de Existência:
```typescript
// Verificar se existe antes de fazer operações específicas
const existingContext = await userEnhancedContextRepository.findByUserId(userId);
if (existingContext) {
  // Fazer update
} else {
  // Fazer create
}
```

## Benefícios

1. **Robustez**: Não falha mais se o contexto não existir
2. **Simplicidade**: Um método único para criar ou atualizar
3. **Consistência**: Comportamento previsível independente do estado atual
4. **Logging**: Logs detalhados sobre qual operação foi executada (create vs update) 
