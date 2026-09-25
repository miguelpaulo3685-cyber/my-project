const http = require('http');
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  const path = req.url.split('?')[0].replace(/\/+$/, '') || '/';

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Servidor', 'enem-api-app-js');

  if (path === '/' || path === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', servidor: 'app.js', time: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ erro: 'rota nao encontrada', url: req.url, servidor: 'app.js' }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ App rodando na porta ${PORT}`);
});
