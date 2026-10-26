require('dotenv').config();
const { Pool } = require('pg');

// Sem DATABASE_URL o pg tenta um banco em localhost e falha com um
// ECONNREFUSED que não diz qual é o problema real.
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL não está configurada. No Render: Environment > adicione DATABASE_URL com a URL do Neon.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migrações no Neon...');

    // Tabela de questões
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questoes (
        id SERIAL PRIMARY KEY,
        disciplina VARCHAR(50) NOT NULL,
        titulo TEXT NOT NULL UNIQUE,
        contexto TEXT,
        alternativas JSONB NOT NULL,
        correta INT NOT NULL,
        dificuldade INT DEFAULT 1,
        ano INT,
        imagem_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_questoes_disciplina ON questoes(disciplina);
      CREATE INDEX IF NOT EXISTS idx_questoes_created_at ON questoes(created_at DESC);

      -- Número e idioma (inglês/espanhol) da questão na prova, como a
      -- api.enem.dev informa. É o que permite achá-la nos microdados do INEP.
      ALTER TABLE questoes ADD COLUMN IF NOT EXISTS numero INT;
      ALTER TABLE questoes ADD COLUMN IF NOT EXISTS lingua VARCHAR(10);
      -- Área como a api.enem.dev mandou, quando o caderno do INEP indicou outra.
      ALTER TABLE questoes ADD COLUMN IF NOT EXISTS disciplina_api VARCHAR(50);

      -- Parâmetros da TRI calculados pelo INEP (pasta TRI/): A = discriminação,
      -- B = dificuldade, C = acerto ao acaso. Nulos quando não deu para casar.
      ALTER TABLE questoes ADD COLUMN IF NOT EXISTS tri_item INT;
      ALTER TABLE questoes ADD COLUMN IF NOT EXISTS tri_a REAL;
      ALTER TABLE questoes ADD COLUMN IF NOT EXISTS tri_b REAL;
      ALTER TABLE questoes ADD COLUMN IF NOT EXISTS tri_c REAL;
    `);
    console.log('✅ Tabela questoes criada');

    // Tabela de posts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        usuario_id VARCHAR(255) NOT NULL,
        conteudo TEXT NOT NULL,
        likes INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
    `);
    console.log('✅ Tabela posts criada');

    // Tabela de usuários
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        avatar_url TEXT,
        bio TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);

      -- Nunca guardamos a senha: apenas o hash scrypt, que nao pode ser revertido.
      -- O nome e apenas exibicao e pode repetir: duas pessoas podem se chamar
      -- Matheus. Quem identifica a conta e o e-mail, esse sim unico.
      ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_username_key;

      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS senha_hash TEXT;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP;
      -- Quando a pessoa aceitou os Termos e a Política de Privacidade.
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS termos_aceitos_em TIMESTAMP;
      -- Administradores moderam o feed. Só dá para virar admin pelo banco:
      -- UPDATE usuarios SET admin = TRUE WHERE email = '...';
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS admin BOOLEAN DEFAULT FALSE;

      -- Post escondido por denúncias, esperando um administrador revisar.
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS oculto BOOLEAN DEFAULT FALSE;

      -- Liga cada post à conta de quem escreveu, para apagar junto com ela.
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS autor_id INT REFERENCES usuarios(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_posts_autor ON posts(autor_id);
    `);
    console.log('✅ Tabela usuarios criada');

    // Sessões: guardamos o hash do token, não o token. Assim, quem ler o banco
    // não consegue se passar por ninguém.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessoes (
        token_hash TEXT PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        criada_em TIMESTAMP DEFAULT NOW(),
        expira_em TIMESTAMP NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessoes_usuario ON sessoes(usuario_id);
      CREATE INDEX IF NOT EXISTS idx_sessoes_expira ON sessoes(expira_em);
    `);
    console.log('✅ Tabela sessoes criada');

    // Links enviados por e-mail (redefinir senha, confirmar e-mail). Como nas
    // sessões, só o hash do token fica guardado.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tokens_email (
        token_hash TEXT PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL,
        expira_em TIMESTAMP NOT NULL,
        usado_em TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_tokens_email_usuario ON tokens_email(usuario_id, tipo);
    `);
    console.log('✅ Tabela tokens_email criada');

    // Cada resposta dada no site. É daqui que sai o nível de dificuldade:
    // a fonte das questões não informa se são fáceis ou difíceis, então
    // medimos pela proporção de quem acerta.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS respostas (
        id SERIAL PRIMARY KEY,
        questao_id INT NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
        usuario_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
        acertou BOOLEAN NOT NULL,
        segundos INT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_respostas_questao ON respostas(questao_id);
      CREATE INDEX IF NOT EXISTS idx_respostas_usuario ON respostas(usuario_id);
    `);
    console.log('✅ Tabela respostas criada');

    // Uma denúncia por pessoa por post: denunciar várias vezes não esconde o post.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS denuncias (
        post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        motivo VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (post_id, usuario_id)
      );
    `);
    console.log('✅ Tabela denuncias criada');

    // Perfil: fotos enviadas pelos alunos e publicações em galeria. A foto
    // fica no banco (bytea), já reduzida e sem metadados; some junto com a conta.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imagens (
        id SERIAL PRIMARY KEY,
        dono_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        dados BYTEA NOT NULL,
        criada_em TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_imagens_dono ON imagens(dono_id);

      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS foto_id INT REFERENCES imagens(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS publicacoes (
        id SERIAL PRIMARY KEY,
        autor_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        titulo VARCHAR(80) NOT NULL,
        texto VARCHAR(2000) NOT NULL DEFAULT '',
        capa_id INT REFERENCES imagens(id) ON DELETE SET NULL,
        capa_posicao SMALLINT NOT NULL DEFAULT 50,
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_publicacoes_autor ON publicacoes(autor_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS denuncias_publicacoes (
        publicacao_id INT NOT NULL REFERENCES publicacoes(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        motivo VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (publicacao_id, usuario_id)
      );
    `);
    console.log('✅ Tabelas do perfil criadas');

    // Simulados entregues, para o aluno ver o histórico em qualquer aparelho.
    // A redação fica junto: some quando a conta é excluída.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS simulados (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        dia SMALLINT NOT NULL,
        ano VARCHAR(10) NOT NULL,
        acertos SMALLINT NOT NULL,
        total SMALLINT NOT NULL,
        areas JSONB NOT NULL,
        tempo_ms INT,
        redacao TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_simulados_usuario ON simulados(usuario_id, created_at DESC);
    `);
    console.log('✅ Tabela simulados criada');

    // Reels: vídeos curtos do YouTube (resoluções e dicas), publicados só por
    // administradores. O vídeo fica no YouTube; aqui só o código dele.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reels (
        id SERIAL PRIMARY KEY,
        autor_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
        youtube_id VARCHAR(11) NOT NULL,
        titulo VARCHAR(100) NOT NULL,
        descricao VARCHAR(500) NOT NULL DEFAULT '',
        tipo VARCHAR(12) NOT NULL DEFAULT 'dica',
        area VARCHAR(12),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reels_data ON reels(created_at DESC);
      -- Canal do YouTube dono do vídeo: aparece como crédito no reel.
      ALTER TABLE reels ADD COLUMN IF NOT EXISTS canal VARCHAR(100);
      -- TikTok: o código do vídeo tem até 22 dígitos e a plataforma muda o player.
      ALTER TABLE reels ALTER COLUMN youtube_id TYPE VARCHAR(32);
      ALTER TABLE reels ADD COLUMN IF NOT EXISTS plataforma VARCHAR(10) NOT NULL DEFAULT 'youtube';
      ALTER TABLE reels ADD COLUMN IF NOT EXISTS link VARCHAR(300);

      CREATE TABLE IF NOT EXISTS reels_ignorados (
        youtube_id VARCHAR(32) PRIMARY KEY
      );
      ALTER TABLE reels_ignorados ALTER COLUMN youtube_id TYPE VARCHAR(32);
      CREATE TABLE IF NOT EXISTS reels_curtidas (
        reel_id INT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (reel_id, usuario_id)
      );
      CREATE TABLE IF NOT EXISTS reels_comentarios (
        id SERIAL PRIMARY KEY,
        reel_id INT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        texto VARCHAR(500) NOT NULL,
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reels_comentarios ON reels_comentarios(reel_id, id);
      CREATE TABLE IF NOT EXISTS reels_comentarios_denuncias (
        comentario_id INT NOT NULL REFERENCES reels_comentarios(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (comentario_id, usuario_id)
      );
      CREATE TABLE IF NOT EXISTS reels_salvos (
        reel_id INT NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (reel_id, usuario_id)
      );
    `);
    console.log('✅ Tabelas dos reels criadas');

    // ---------- Rede social de estudos ----------
    await pool.query(`
      -- Discussão de cada questão: aparece depois que o aluno responde.
      CREATE TABLE IF NOT EXISTS questoes_comentarios (
        id SERIAL PRIMARY KEY,
        questao_id INT NOT NULL REFERENCES questoes(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        resposta_a INT REFERENCES questoes_comentarios(id) ON DELETE CASCADE,
        texto VARCHAR(1000) NOT NULL,
        fixado BOOLEAN NOT NULL DEFAULT FALSE,
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_qcom_questao ON questoes_comentarios(questao_id, id);
      CREATE TABLE IF NOT EXISTS questoes_comentarios_uteis (
        comentario_id INT NOT NULL REFERENCES questoes_comentarios(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (comentario_id, usuario_id)
      );
      CREATE TABLE IF NOT EXISTS questoes_comentarios_denuncias (
        comentario_id INT NOT NULL REFERENCES questoes_comentarios(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (comentario_id, usuario_id)
      );

      -- Seguir pessoas e notificações.
      CREATE TABLE IF NOT EXISTS seguidores (
        seguidor_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        seguido_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (seguidor_id, seguido_id),
        CHECK (seguidor_id <> seguido_id)
      );
      CREATE INDEX IF NOT EXISTS idx_seguidores_seguido ON seguidores(seguido_id);
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        ator_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL,
        alvo_tipo VARCHAR(20),
        alvo_id INT,
        texto VARCHAR(200),
        lida BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario ON notificacoes(usuario_id, id DESC);

      -- Desafio da semana: as mesmas 10 questões para todo mundo.
      CREATE TABLE IF NOT EXISTS desafios (
        semana VARCHAR(10) PRIMARY KEY,
        questoes INT[] NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS desafio_resultados (
        semana VARCHAR(10) NOT NULL REFERENCES desafios(semana) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        acertos SMALLINT NOT NULL,
        nota SMALLINT,
        segundos INT NOT NULL,
        respostas JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (semana, usuario_id)
      );

      -- Turmas e grupos.
      CREATE TABLE IF NOT EXISTS grupos (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(60) NOT NULL,
        descricao VARCHAR(300) NOT NULL DEFAULT '',
        tipo VARCHAR(10) NOT NULL DEFAULT 'turma',
        codigo VARCHAR(12) UNIQUE,
        criador_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS grupo_membros (
        grupo_id INT NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        papel VARCHAR(10) NOT NULL DEFAULT 'membro',
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (grupo_id, usuario_id)
      );
      CREATE INDEX IF NOT EXISTS idx_grupo_membros_usuario ON grupo_membros(usuario_id);
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS grupo_id INT REFERENCES grupos(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_posts_grupo ON posts(grupo_id, created_at DESC);

      -- Reels enviados por alunos esperam a aprovação de um administrador.
      ALTER TABLE reels ADD COLUMN IF NOT EXISTS status VARCHAR(10) NOT NULL DEFAULT 'aprovado';
      CREATE INDEX IF NOT EXISTS idx_reels_status ON reels(status);
    `);
    // Grupos por objetivo, abertos para qualquer um entrar.
    await pool.query(`
      INSERT INTO grupos (nome, descricao, tipo)
      SELECT v.nome, v.descricao, 'objetivo' FROM (VALUES
        ('Medicina', 'Para quem sonha com o jaleco: Natureza pesada e redação afiada.'),
        ('Direito', 'Humanas, Linguagens e muita argumentação.'),
        ('Engenharias', 'Matemática e Física no centro de tudo.'),
        ('Computação e TI', 'Lógica, Matemática e tecnologia.'),
        ('Licenciaturas', 'Quem quer ensinar também precisa passar.'),
        ('Saúde (outros cursos)', 'Enfermagem, Odonto, Fisio, Nutrição, Farmácia e mais.'),
        ('Primeiro ENEM', 'Fazendo o ENEM pela primeira vez? Bora junto.')
      ) AS v(nome, descricao)
      WHERE NOT EXISTS (SELECT 1 FROM grupos g WHERE g.tipo = 'objetivo' AND g.nome = v.nome);
    `);
    console.log('✅ Tabelas da rede social criadas');

    // ---------- Comunidade viva ----------
    await pool.query(`
      -- Quem está no site agora (e em qual sala de estudo). Um sinal por minuto.
      CREATE TABLE IF NOT EXISTS presenca (
        usuario_id INT PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
        sala VARCHAR(20),
        desde TIMESTAMP NOT NULL DEFAULT NOW(),
        visto_em TIMESTAMP NOT NULL DEFAULT NOW(),
        ultimo_ciclo INT
      );
      CREATE INDEX IF NOT EXISTS idx_presenca_visto ON presenca(visto_em);

      -- O que acontece na comunidade: metas do dia, desafio feito, sequência,
      -- pergunta nova, melhor resposta, pomodoros. Fica 30 dias.
      CREATE TABLE IF NOT EXISTS atividades (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tipo VARCHAR(20) NOT NULL,
        texto VARCHAR(200),
        alvo_id INT,
        feito BOOLEAN NOT NULL DEFAULT FALSE,
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS atividades_denuncias (
        atividade_id INT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (atividade_id, usuario_id)
      );
      CREATE INDEX IF NOT EXISTS idx_atividades_recentes ON atividades(id DESC);
      CREATE INDEX IF NOT EXISTS idx_atividades_usuario ON atividades(usuario_id, tipo, created_at DESC);
      -- Uma reação por pessoa (0 = 👏, 1 = 🔥, 2 = 💡); trocar substitui.
      CREATE TABLE IF NOT EXISTS atividades_reacoes (
        atividade_id INT NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        emoji SMALLINT NOT NULL,
        PRIMARY KEY (atividade_id, usuario_id)
      );

      -- Salas de estudo: pomodoros completos e o bate-papo das pausas.
      CREATE TABLE IF NOT EXISTS pomodoros (
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        dia DATE NOT NULL,
        n SMALLINT NOT NULL DEFAULT 0,
        PRIMARY KEY (usuario_id, dia)
      );
      CREATE TABLE IF NOT EXISTS sala_mensagens (
        id SERIAL PRIMARY KEY,
        sala VARCHAR(20) NOT NULL,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        texto VARCHAR(300) NOT NULL,
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_sala_mensagens ON sala_mensagens(sala, id);
      CREATE TABLE IF NOT EXISTS sala_mensagens_denuncias (
        mensagem_id INT NOT NULL REFERENCES sala_mensagens(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (mensagem_id, usuario_id)
      );

      -- Pergunte à comunidade: dúvidas com respostas e a melhor marcada por quem perguntou.
      CREATE TABLE IF NOT EXISTS perguntas (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        area VARCHAR(20) NOT NULL,
        titulo VARCHAR(140) NOT NULL,
        texto VARCHAR(2000) NOT NULL DEFAULT '',
        melhor_resposta_id INT,
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_perguntas_recentes ON perguntas(id DESC);
      CREATE TABLE IF NOT EXISTS perguntas_respostas (
        id SERIAL PRIMARY KEY,
        pergunta_id INT NOT NULL REFERENCES perguntas(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        texto VARCHAR(2000) NOT NULL,
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_perguntas_respostas ON perguntas_respostas(pergunta_id, id);
      CREATE INDEX IF NOT EXISTS idx_perguntas_respostas_usuario ON perguntas_respostas(usuario_id);
      CREATE TABLE IF NOT EXISTS perguntas_respostas_uteis (
        resposta_id INT NOT NULL REFERENCES perguntas_respostas(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (resposta_id, usuario_id)
      );
      -- alvo_tipo: 'pergunta' ou 'resposta'.
      CREATE TABLE IF NOT EXISTS perguntas_denuncias (
        alvo_tipo VARCHAR(10) NOT NULL,
        alvo_id INT NOT NULL,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (alvo_tipo, alvo_id, usuario_id)
      );
      CREATE INDEX IF NOT EXISTS idx_respostas_usuario_data ON respostas(usuario_id, created_at);
    `);
    console.log('✅ Tabelas da comunidade criadas');

    // ---------- App e avisos ----------
    await pool.query(`
      -- Configurações que o próprio servidor cria e guarda (as chaves dos avisos).
      CREATE TABLE IF NOT EXISTS configuracoes (
        chave VARCHAR(40) PRIMARY KEY,
        valor TEXT NOT NULL
      );
      -- Cada navegador ou celular que aceitou receber avisos.
      CREATE TABLE IF NOT EXISTS push_inscricoes (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_push_usuario ON push_inscricoes(usuario_id);
      -- O que cada pessoa quer receber.
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aviso_sequencia BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aviso_sessao BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS email_semanal BOOLEAN NOT NULL DEFAULT TRUE;
    `);
    console.log('✅ Tabelas dos avisos criadas');

    // ---------- Correção de redação pela comunidade ----------
    await pool.query(`
      CREATE TABLE IF NOT EXISTS redacoes (
        id SERIAL PRIMARY KEY,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        tema VARCHAR(200) NOT NULL,
        texto TEXT NOT NULL,
        origem VARCHAR(10) NOT NULL DEFAULT 'livre',
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_redacoes_usuario ON redacoes(usuario_id, id DESC);
      -- Uma correção por pessoa por redação, nas 5 competências do ENEM (0 a 200, de 40 em 40).
      CREATE TABLE IF NOT EXISTS redacoes_correcoes (
        id SERIAL PRIMARY KEY,
        redacao_id INT NOT NULL REFERENCES redacoes(id) ON DELETE CASCADE,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        notas SMALLINT[] NOT NULL,
        comentarios JSONB NOT NULL DEFAULT '[]',
        geral VARCHAR(2000) NOT NULL,
        anulada VARCHAR(30),
        util BOOLEAN NOT NULL DEFAULT FALSE,
        oculto BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (redacao_id, usuario_id)
      );
      CREATE INDEX IF NOT EXISTS idx_correcoes_usuario ON redacoes_correcoes(usuario_id);
      -- alvo_tipo: 'redacao' ou 'correcao'.
      CREATE TABLE IF NOT EXISTS redacoes_denuncias (
        alvo_tipo VARCHAR(10) NOT NULL,
        alvo_id INT NOT NULL,
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        PRIMARY KEY (alvo_tipo, alvo_id, usuario_id)
      );
    `);
    console.log('✅ Tabelas das redações criadas');

    // Imagens das questões cadastradas à mão pela Administração (as que a
    // api.enem.dev não tem). São públicas, como as da prova.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS imagens_questoes (
        id SERIAL PRIMARY KEY,
        dados BYTEA NOT NULL,
        enviada_por INT REFERENCES usuarios(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Arena: partidas ao vivo (as salas ficam na memória do servidor; aqui
    // fica só o resultado), emblemas ganhos no baú e as questões erradas que
    // voltam dias depois ("revanche contra a questão").
    await pool.query(`
      CREATE TABLE IF NOT EXISTS arena_partidas (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(6) NOT NULL,
        criador_id INT REFERENCES usuarios(id) ON DELETE SET NULL,
        publica BOOLEAN NOT NULL DEFAULT FALSE,
        nivel VARCHAR(20), ritmo VARCHAR(20), area VARCHAR(50),
        jogadores INT NOT NULL, questoes INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS arena_resultados (
        partida_id INT REFERENCES arena_partidas(id) ON DELETE CASCADE,
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        posicao INT NOT NULL, pontos INT NOT NULL, acertos INT NOT NULL, total INT NOT NULL,
        melhor_sequencia INT NOT NULL DEFAULT 0, xp INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (partida_id, usuario_id)
      );
      CREATE INDEX IF NOT EXISTS idx_arena_resultados_usuario ON arena_resultados(usuario_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS arena_itens (
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        item VARCHAR(30) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (usuario_id, item)
      );
      CREATE TABLE IF NOT EXISTS arena_baus (
        id SERIAL PRIMARY KEY,
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        item VARCHAR(30) NOT NULL,
        repetido BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_arena_baus_usuario ON arena_baus(usuario_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS arena_revanche (
        usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
        questao_id INT REFERENCES questoes(id) ON DELETE CASCADE,
        volta_em TIMESTAMP NOT NULL,
        feito BOOLEAN NOT NULL DEFAULT FALSE,
        PRIMARY KEY (usuario_id, questao_id)
      );
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS emblema VARCHAR(30);
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aviso_arena BOOLEAN DEFAULT TRUE;
    `);
    console.log('✅ Tabelas da Arena criadas');

    // Mensagens diretas entre perfis, com bloqueio e denúncia.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS mensagens (
        id SERIAL PRIMARY KEY,
        de_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        para_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        texto VARCHAR(1000) NOT NULL,
        lida BOOLEAN NOT NULL DEFAULT FALSE,
        denunciada BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        CHECK (de_id <> para_id)
      );
      CREATE INDEX IF NOT EXISTS idx_mensagens_par ON mensagens (LEAST(de_id, para_id), GREATEST(de_id, para_id), id DESC);
      CREATE INDEX IF NOT EXISTS idx_mensagens_para ON mensagens (para_id) WHERE NOT lida;
      CREATE TABLE IF NOT EXISTS bloqueios (
        usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        bloqueado_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (usuario_id, bloqueado_id)
      );
      ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS quem_mensagem VARCHAR(10) DEFAULT 'seguindo';
      ALTER TABLE usuarios ALTER COLUMN quem_mensagem SET DEFAULT 'seguindo';
    `);
    // Uma vez só: quem ganhou 'todos' no período de teste passa para 'seguindo'
    // (desconhecido não puxa conversa com menor). Depois, vale o que cada um escolher.
    const jaMudou = await pool.query(`SELECT 1 FROM configuracoes WHERE chave = 'mensagens_so_seguindo'`);
    if (!jaMudou.rowCount) {
      await pool.query(`UPDATE usuarios SET quem_mensagem = 'seguindo' WHERE quem_mensagem IS NULL OR quem_mensagem = 'todos'`);
      await pool.query(`INSERT INTO configuracoes (chave, valor) VALUES ('mensagens_so_seguindo', 'feito') ON CONFLICT (chave) DO NOTHING`);
    }
    console.log('✅ Tabelas de mensagens criadas');

    // Tabela de histórico de cache
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cache_log (
        id SERIAL PRIMARY KEY,
        area VARCHAR(50),
        questoes_count INT,
        success BOOLEAN,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_cache_log_created_at ON cache_log(created_at DESC);
    `);
    console.log('✅ Tabela cache_log criada');

    console.log('✅ Todas as tabelas criadas com sucesso!');

    // Verificar dados
    const check = await pool.query('SELECT COUNT(*) FROM questoes');
    console.log(`📊 Total de questões em cache: ${check.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro nas migrações:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
