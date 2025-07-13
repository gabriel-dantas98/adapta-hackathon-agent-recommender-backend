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
