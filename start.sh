#!/bin/bash

echo "🚀 Iniciando MedGo..."
echo ""

# Verificar se Docker está rodando
if ! docker ps > /dev/null 2>&1; then
  echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop primeiro."
  exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Subir containers
echo "📦 Subindo containers Docker..."
docker-compose up -d

# Aguardar PostgreSQL ficar pronto
echo "⏳ Aguardando PostgreSQL ficar pronto..."
until docker exec medgo-postgres pg_isready -U medgo > /dev/null 2>&1; do
  sleep 1
done

echo "✅ PostgreSQL está pronto"
echo ""

# Executar migrations
echo "🔄 Executando migrations do banco de dados..."
cd apps/api-gateway
npx prisma migrate dev --name init
cd ../..

echo ""
echo "✨ MedGo está pronto para uso!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Rodar API Gateway:        pnpm dev:api"
echo "   2. Rodar Web Dashboard:      pnpm dev:web"
echo "   3. Rodar Analytics Service:  pnpm dev:analytics"
echo ""
echo "🔗 URLs importantes:"
echo "   - API Gateway:      http://localhost:3001"
echo "   - Web Dashboard:    http://localhost:3000"
echo "   - Analytics:        http://localhost:3004"
echo "   - Adminer (DB):     http://localhost:8080"
echo "   - Prisma Studio:    pnpm db:studio"
echo ""
