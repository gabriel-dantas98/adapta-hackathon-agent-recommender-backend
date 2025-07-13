## 2025-07-13 00:37:08

# Fastify Ecosystem Compatibility Issues

## Problem: Version Mismatch "@fastify/swagger expected '5.x' fastify version, '4.29.1' is installed"

### Root Cause
- @fastify/swagger v9.x requires Fastify v5.x
- fastify-type-provider-zod v5.x requires Fastify v5.x
- Project was using Fastify v4.29.1 with incompatible plugin versions

### Solution Applied
1. **Downgrade @fastify/swagger**: 9.5.1 → 8.15.0
2. **Downgrade fastify-type-provider-zod**: 5.0.2 → 1.1.9
3. **Keep Fastify**: 4.29.1 (stable)

### Commands Used
```bash
# Update package.json dependencies
npm install --force
```

### Compatibility Matrix (Critical Reference)
```
Fastify v4.x:
- @fastify/swagger: v8.x
- fastify-type-provider-zod: v1.x
- @fastify/swagger-ui: v2.x (compatible)

Fastify v5.x:
- @fastify/swagger: v9.x
- fastify-type-provider-zod: v5.x
- @fastify/swagger-ui: v3.x
```

### Key Lessons
1. **Always check peer dependency compatibility** before upgrading
2. **Fastify ecosystem has strict version requirements**
3. **Downgrading plugins is often safer than upgrading core framework**
4. **Use --force flag when npm detects peer dependency conflicts**
5. **Swagger UI works correctly with redirects (302 to ./docs/static/index.html)**

### Verification Steps
1. Server starts without compatibility errors
2. Health endpoint responds: GET /health
3. Swagger UI accessible at /docs with redirect
4. All API endpoints functional

### Common npm Error Patterns
- "ERESOLVE could not resolve" - peer dependency conflict
- "expected 'X.x' version, 'Y.y' is installed" - version mismatch
- Use `npm install --force` or `--legacy-peer-deps` as workaround

### Future Prevention
- Always check plugin compatibility before updates
- Pin exact versions for critical plugins
- Test all endpoints after dependency changes
- Document working version combinations 
