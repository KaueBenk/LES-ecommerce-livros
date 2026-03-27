# 📋 Guia de Visualização de Logs

## ✅ Correções Aplicadas

1. **logback-spring.xml** atualizado:
   - ✅ CONSOLE sempre ativo (importante para Docker)
   - ✅ Pattern mais legível e colorido
   - ✅ `immediateFlush=true` para logs em tempo real
   - ✅ Nível INFO para aplicação (não DEBUG para evitar spam)
   - ✅ Root logger SEMPRE inclui CONSOLE

2. **docker-compose.yml** atualizado:
   - ✅ `SPRING_OUTPUT_ANSI_ENABLED=ALWAYS` (cores nos logs)
   - ✅ Nível de log explícito via variável de ambiente

## 📊 Como Visualizar os Logs

### Opção 1: Ver logs do backend (últimas 50 linhas)
```bash
docker compose logs --tail=50 backend
```

### Opção 2: Seguir logs em tempo real (recomendado)
```bash
docker compose logs -f backend
```

### Opção 3: Ver logs de TODOS os serviços
```bash
docker compose logs -f
```

### Opção 4: Usar o script de teste
```bash
./test-logs.sh
```

## 🎯 O que você deve ver

Com a nova configuração, os logs devem aparecer assim:

```
les-backend  | 14:32:15.123 INFO  [main] c.k.l.LesecommercelivrosApplication : Starting LesecommercelivrosApplication
les-backend  | 14:32:16.456 INFO  [http-nio-8080-exec-1] c.k.l.controller.AuthController : [AUTH-CTRL] POST /auth/login
les-backend  | 14:32:16.789 INFO  [http-nio-8080-exec-1] c.k.l.service.AuthService : [AUTH] Login bem-sucedido - Email: user@example.com
```

## 🔧 Rebuild Necessário

Para aplicar as mudanças, rebuild o backend:

```bash
# Parar os containers
docker compose down

# Rebuild o backend (força rebuild da imagem)
docker compose build --no-cache backend

# Subir novamente
docker compose up
```

## 🐛 Troubleshooting

### Problema: Ainda não vejo logs
```bash
# Verificar se o container está rodando
docker ps

# Ver logs do container diretamente
docker logs les-backend

# Ver logs com timestamp
docker logs --timestamps les-backend
```

### Problema: Muitos logs do Spring/Hibernate
Os logs foram configurados para:
- `com.kauebenk.lesecommercelivros` → **INFO** (nossos logs)
- `org.springframework.*` → **WARN** (só warnings)
- `org.hibernate` → **WARN** (só warnings)

Se ainda estiver muito verboso, ajuste no docker-compose.yml:
```yaml
- LOGGING_LEVEL_COM_KAUEBENK_LESECOMMERCELIVROS=WARN
```

### Problema: Quero ver logs de SQL
Adicione no docker-compose.yml:
```yaml
- LOGGING_LEVEL_ORG_HIBERNATE_SQL=DEBUG
```

## 📁 Logs em Arquivo (opcional)

Os logs também são salvos em:
- `backend/lesecommercelivros/logs/app.log`
- `backend/lesecommercelivros/logs/app-error.log`

Mas note que dentro do Docker, esses arquivos ficam no container.
Para acessá-los:

```bash
# Copiar logs do container para local
docker cp les-backend:/app/logs ./backend-logs

# Ou acessar diretamente
docker exec les-backend cat /app/logs/app.log
```

## ✅ Validação

Após rebuild, você deve ver:
1. ✅ Logs do Spring Boot inicializando
2. ✅ Logs da nossa aplicação com prefixos [AUTH], [CHECKOUT], etc.
3. ✅ Logs de requisições HTTP
4. ✅ Logs de erros em destaque (vermelho)

