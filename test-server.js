// Servidor simples de teste (sem banco de dados)
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Servidor de teste funcionando!'
  });
});

// Rota simples
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API funcionando',
    port: PORT
  });
});

// Erro handling
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({ error: err.message });
});

// Iniciar
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
});
