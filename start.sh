#!/bin/bash

echo "🚀 Iniciando API ENEM..."

# Rodar migrations na primeira inicialização
echo "🔄 Verificando banco de dados..."
npm run migrate

# Iniciar servidor
echo "✅ Tabelas prontas. Iniciando servidor..."
npm start
