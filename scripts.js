// Troca de abas instantânea (Sem recarregar a página)
        function trocarAba(nomeAba, elementoNav) {
            // Esconde todas as abas
            document.querySelectorAll('.aba-conteudo').forEach(aba => {
                aba.classList.remove('ativa');
            });

            // Mostra a aba escolhida
            document.getElementById('aba-' + nomeAba).classList.add('ativa');

            // Atualiza o destaque na barra inferior
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('ativo');
            });
            elementoNav.classList.add('ativo');
        }

        // Inicialização e dados salvos no navegador
        window.onload = function() {
            carregarDadosPerfil();
            carregarPostsSalvos();
            atualizarAreasGrid();
            verificarEAtualizarCache();
            carregarCapasSalvas();
        };

        /* ==================== MÓDULO DE QUESTÕES DIÁRIAS ==================== */

        // Banco de reserva (offline) — usado só se a API do ENEM estiver indisponível ou sem internet
        const bancoReserva = {
            linguagens: [
                { enunciado: "Qual figura de linguagem consiste em atribuir características humanas a seres inanimados ou animais?", alternativas: ["Metáfora", "Personificação", "Hipérbole", "Metonímia"], correta: 1, dificuldade: 1, explicacao: "A resposta certa é Personificação (também chamada de prosopopeia). Ela acontece quando damos características humanas — como falar, sentir ou pensar — a algo que não é humano, tipo 'o vento sussurrou' ou 'a lua sorriu'. Metáfora é uma comparação implícita, hipérbole é exagero, e metonímia é trocar uma palavra por outra com sentido próximo (ex: 'ler Machado de Assis' em vez de 'ler um livro de Machado')." },
                { enunciado: "Em 'A empresa demitiu 200 funcionários', a palavra 'empresa' está em sentido:", alternativas: ["Denotativo", "Metonímico", "Ambíguo", "Nenhum dos anteriores"], correta: 1, dificuldade: 2, explicacao: "É metonímia porque 'empresa' (a instituição) está no lugar de quem realmente tomou a decisão (os donos ou diretores). É comum usar o nome do todo (a empresa) pra representar uma parte específica dele (as pessoas que mandam nela)." },
                { enunciado: "Qual das opções é uma oração subordinada adverbial condicional?", alternativas: ["Estudei porque quis", "Se chover, não sairei", "Quero que você estude", "Estudei e passei"], correta: 1, dificuldade: 2, explicacao: "'Se chover, não sairei' apresenta uma condição — a segunda parte da frase só acontece SE a primeira acontecer. Esse é o critério: a oração 'se chover' estabelece a condição pra que a outra ação (não sair) se realize. As demais frases mostram causa ('porque'), finalidade ('que você estude') ou simples soma de fatos ('e passei')." },
                { enunciado: "O gênero textual predominante em uma bula de remédio é:", alternativas: ["Narrativo", "Instrucional", "Dissertativo", "Descritivo"], correta: 1, dificuldade: 1, explicacao: "Bula de remédio serve pra orientar o uso correto do medicamento — 'tome X comprimidos a cada Y horas', 'não use se estiver grávida'. Esse tipo de texto, com passo a passo e orientações, é chamado de instrucional." },
                { enunciado: "Assinale a frase com uso correto da crase:", alternativas: ["Vou à pé", "Cheguei à uma hora", "Refiro-me à ela", "Isso é prejudicial à saúde"], correta: 3, dificuldade: 3, explicacao: "Crase é a junção da preposição 'a' com o artigo feminino 'a'. 'À saúde' está correto porque existe o artigo antes de 'saúde' (a saúde) e o verbo 'prejudicial a' exige a preposição 'a'. Nas outras: 'a pé' não leva crase (locução masculina), 'à uma hora' só leva crase se especificar a hora exata do relógio, e antes de pronome pessoal ('ela') não se usa crase." }
            ],
            humanas: [
                { enunciado: "Qual processo histórico está diretamente associado à Revolução Industrial?", alternativas: ["Êxodo rural", "Feudalismo", "Absolutismo", "Colonialismo mercantil"], correta: 0, dificuldade: 1, explicacao: "Com as fábricas surgindo nas cidades, muita gente do campo se mudou pra trabalhar nelas — esse movimento é o êxodo rural. Feudalismo e colonialismo mercantil são de períodos anteriores, e o absolutismo (reis com poder total) já estava em declínio quando a Revolução Industrial começou." },
                { enunciado: "A Guerra Fria foi marcada principalmente pela disputa ideológica entre:", alternativas: ["França e Alemanha", "EUA e URSS", "Inglaterra e Espanha", "China e Japão"], correta: 1, dificuldade: 1, explicacao: "A Guerra Fria (1947-1991) foi a disputa entre o capitalismo, liderado pelos Estados Unidos, e o socialismo, liderado pela União Soviética (URSS). Não houve guerra direta entre eles, por isso o nome 'fria' — a disputa era mais ideológica, tecnológica e de influência sobre outros países." },
                { enunciado: "Na Grécia Antiga, o conceito de cidadania era restrito a:", alternativas: ["Todos os habitantes", "Homens livres nascidos na cidade", "Apenas comerciantes", "Apenas estrangeiros"], correta: 1, dificuldade: 2, explicacao: "Na Grécia Antiga, ser cidadão (com direito de participar da política) era privilégio de homens livres, nascidos na própria cidade-estado. Mulheres, escravizados e estrangeiros (chamados de metecos) ficavam de fora dessa participação política." },
                { enunciado: "Qual filósofo iluminista é associado ao conceito de 'contrato social'?", alternativas: ["Descartes", "Rousseau", "Aristóteles", "Santo Agostinho"], correta: 1, dificuldade: 2, explicacao: "Jean-Jacques Rousseau escreveu a obra 'Do Contrato Social', defendendo que a sociedade e o governo surgem de um acordo entre as pessoas, que abrem mão de parte da própria liberdade em troca de viver em coletividade com regras." },
                { enunciado: "A urbanização acelerada no Brasil se intensificou principalmente a partir de qual década?", alternativas: ["1920", "1950", "1980", "2000"], correta: 1, dificuldade: 3, explicacao: "A partir da década de 1950, o Brasil passou por uma industrialização mais forte (impulsionada, por exemplo, pelo governo de Juscelino Kubitschek), o que atraiu muita gente do campo pras cidades em busca de emprego — é quando a população urbana começa a crescer rapidamente." }
            ],
            natureza: [
                { enunciado: "Qual organela é responsável pela respiração celular?", alternativas: ["Ribossomo", "Mitocôndria", "Complexo de Golgi", "Núcleo"], correta: 1, dificuldade: 1, explicacao: "A mitocôndria é conhecida como a 'usina de energia' da célula: é ela que transforma os nutrientes em ATP (energia que a célula usa), através do processo de respiração celular. Ribossomo produz proteínas, Golgi empacota substâncias, e o núcleo guarda o material genético." },
                { enunciado: "A lei da conservação de energia afirma que a energia:", alternativas: ["Pode ser criada", "Pode ser destruída", "Não se cria nem se destrói", "Sempre aumenta"], correta: 2, dificuldade: 1, explicacao: "Essa é uma das leis mais fundamentais da física: a energia não surge do nada nem desaparece — ela só se transforma de um tipo pra outro (por exemplo, energia elétrica virando energia térmica numa lâmpada)." },
                { enunciado: "Qual é a unidade básica da hereditariedade?", alternativas: ["Célula", "Gene", "Proteína", "Cromossomo inteiro"], correta: 1, dificuldade: 2, explicacao: "O gene é o trecho de DNA que carrega a informação pra uma característica específica (cor dos olhos, tipo sanguíneo etc.) e é passado dos pais pros filhos. Vários genes juntos formam os cromossomos." },
                { enunciado: "Em uma reação química exotérmica, o sistema:", alternativas: ["Absorve calor", "Libera calor", "Não troca energia", "Perde massa"], correta: 1, dificuldade: 2, explicacao: "'Exo' vem de 'para fora' — numa reação exotérmica, o sistema libera calor para o ambiente (é por isso que você sente calor perto de uma fogueira, por exemplo). O oposto, quando o sistema absorve calor do ambiente, se chama endotérmica." },
                { enunciado: "A aceleração da gravidade na superfície terrestre é aproximadamente:", alternativas: ["6,8 m/s²", "9,8 m/s²", "12,8 m/s²", "15,8 m/s²"], correta: 1, dificuldade: 3, explicacao: "O valor padrão usado em física básica é 9,8 m/s² (às vezes arredondado pra 10 m/s² pra facilitar as contas). É a taxa com que a velocidade de um objeto em queda livre aumenta a cada segundo, por causa da gravidade da Terra." }
            ],
            matematica: [
                { enunciado: "Qual é o resultado de 2³ + 3²?", alternativas: ["13", "15", "17", "19"], correta: 2, dificuldade: 1, explicacao: "2³ significa 2×2×2 = 8. 3² significa 3×3 = 9. Somando: 8 + 9 = 17." },
                { enunciado: "A soma dos ângulos internos de um triângulo é:", alternativas: ["90°", "180°", "270°", "360°"], correta: 1, dificuldade: 1, explicacao: "Essa é uma regra fixa da geometria: em qualquer triângulo, não importa o formato, os três ângulos internos sempre somam 180°." },
                { enunciado: "Se f(x) = 2x + 3, qual o valor de f(5)?", alternativas: ["10", "13", "15", "8"], correta: 1, dificuldade: 2, explicacao: "É só substituir o x por 5 na fórmula: f(5) = 2×5 + 3 = 10 + 3 = 13." },
                { enunciado: "Qual a probabilidade de tirar um número par em um dado de 6 faces?", alternativas: ["1/6", "1/3", "1/2", "2/3"], correta: 2, dificuldade: 2, explicacao: "O dado tem 6 números (1 a 6), e desses, 3 são pares (2, 4 e 6). Probabilidade é casos favoráveis dividido por casos possíveis: 3/6, que simplificando dá 1/2." },
                { enunciado: "A raiz quadrada de 144 é:", alternativas: ["11", "12", "13", "14"], correta: 1, dificuldade: 3, explicacao: "Raiz quadrada é achar o número que, multiplicado por ele mesmo, dá o valor de dentro da raiz. 12 × 12 = 144, então a raiz quadrada de 144 é 12." }
            ]
        };

        const nomesAreas = { linguagens: "Linguagens", humanas: "Ciências Humanas", natureza: "Ciências da Natureza", matematica: "Matemática" };

        /* ============ INTEGRAÇÃO COM A API PÚBLICA DO ENEM (api.enem.dev) ============
           A API tem questões reais de provas de 2009 a 2023. Em vez de chamar a API
           toda vez que o aluno abre a página, a gente busca um lote de questões e
           guarda em cache no navegador por alguns dias (CACHE_VALIDADE_DIAS). */

        const CACHE_VALIDADE_DIAS = 7;
        const disciplinaParaArea = { "linguagens": "linguagens", "ciencias-humanas": "humanas", "ciencias-natureza": "natureza", "matematica": "matematica" };
        const anosDisponiveis = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2022, 2023];

        function chaveCacheArea(area) { return `cache_api_${area}`; }

        function lerCacheArea(area) {
            const bruto = localStorage.getItem(chaveCacheArea(area));
            if (!bruto) return null;
            try {
                const cache = JSON.parse(bruto);
                const idadeDias = (Date.now() - cache.timestamp) / (1000 * 60 * 60 * 24);
                if (idadeDias > CACHE_VALIDADE_DIAS || !cache.questoes || cache.questoes.length < 5) return null;
                return cache.questoes;
            } catch (e) { return null; }
        }

        // Dificuldade não é pública oficialmente na API (a TRI real do INEP não divulga esse parâmetro),
        // então usamos um valor aproximado até vocês calibrarem isso com dados reais de uso.
        function dificuldadeAproximada() {
            return 1 + Math.floor(Math.random() * 3);
        }

        function converterQuestaoAPI(q) {
            const indiceCorreta = q.alternatives.findIndex(a => a.isCorrect);
            if (indiceCorreta === -1) return null;
            const letraCorreta = q.alternatives[indiceCorreta].letter;
            return {
                enunciado: q.context && q.context.trim() ? q.context : q.title,
                imagem: (q.files && q.files.length > 0) ? q.files[0] : null,
                alternativas: q.alternatives.map(a => a.text && a.text.trim() ? a.text : "(alternativa em imagem — ver enunciado)"),
                correta: indiceCorreta,
                dificuldade: dificuldadeAproximada(),
                ano: q.year || null,
                comando: q.alternativesIntroduction || null,
                // Explicação gerada automaticamente a partir dos dados da própria API (a API não fornece
                // uma explicação pedagógica pronta — isso aqui é montado com o comando oficial da questão
                // e a alternativa correta, pra pelo menos indicar o raciocínio esperado).
                explicacao: null
            };
        }

        function pausa(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

        // A API do ENEM não libera CORS pra chamadas feitas via JavaScript de outros sites
        // (só permite navegação direta no navegador). Por isso, se a chamada direta falhar,
        // a gente refaz através de um proxy público que adiciona os cabeçalhos de CORS.
        // OBS: isso é uma solução temporária — o ideal, mais pra frente, é vocês terem uma
        // função própria (ex: Vercel/Cloudflare Worker) fazendo esse papel, pra não depender
        // de um serviço de terceiros.
        async function buscarComContornoDeCORS(url) {
            try {
                const respostaDireta = await fetch(url);
                if (respostaDireta.ok) return respostaDireta;
            } catch (erroDireto) {
                // segue pro proxy
            }
            const urlProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            return fetch(urlProxy);
        }

        // Busca VÁRIAS provas (anos) de uma vez e junta tudo num pool grande por área.
        // Isso garante bastante variedade de questões reais do ENEM, sem depender do banco de reserva.
        async function atualizarCacheDaAPI() {
            const QTD_PROVAS_POR_ATUALIZACAO = 6; // quantas provas (anos) buscar de uma vez
            const anosEscolhidos = embaralhar(anosDisponiveis).slice(0, QTD_PROVAS_POR_ATUALIZACAO);
            const porArea = { linguagens: [], humanas: [], natureza: [], matematica: [] };
            let algumaProvaFuncionou = false;

            for (const ano of anosEscolhidos) {
                try {
                    for (let offset = 0; offset < 200; offset += 50) {
                        const resposta = await buscarComContornoDeCORS(`https://api.enem.dev/v1/exams/${ano}/questions?limit=50&offset=${offset}`);
                        if (!resposta.ok) break;
                        const dados = await resposta.json();

                        dados.questions.forEach(q => {
                            const area = disciplinaParaArea[q.discipline];
                            if (!area) return; // ignora língua estrangeira (inglês/espanhol) e itens sem área mapeada
                            const convertida = converterQuestaoAPI(q);
                            if (convertida) porArea[area].push(convertida);
                        });

                        if (!dados.metadata || !dados.metadata.hasMore) break;
                        await pausa(150); // pequena pausa entre chamadas pra não sobrecarregar a API
                    }
                    algumaProvaFuncionou = true;
                } catch (erro) {
                    console.warn(`Não foi possível buscar a prova do ENEM ${ano}.`, erro);
                }
            }

            if (!algumaProvaFuncionou) {
                console.warn("Não foi possível atualizar as questões pela API do ENEM. Usando banco de reserva.");
                return false;
            }

            Object.keys(porArea).forEach(area => {
                if (porArea[area].length >= 5) {
                    localStorage.setItem(chaveCacheArea(area), JSON.stringify({ questoes: porArea[area], timestamp: Date.now(), anos: anosEscolhidos }));
                }
            });
            return true;
        }

        // Decide de onde tirar as 5 questões: cache válido (API) ou banco de reserva offline.
        function obterQuestoesArea(area) {
            const doCache = lerCacheArea(area);
            if (doCache) return doCache;
            return bancoReserva[area];
        }

        async function verificarEAtualizarCache(forcar = false) {
            const precisaAtualizar = forcar || Object.keys(nomesAreas).some(area => !lerCacheArea(area));
            if (!precisaAtualizar) return;

            const indicador = document.getElementById('statusApi');
            if (indicador) indicador.innerText = "Buscando questões reais em várias provas do ENEM...";

            const ok = await atualizarCacheDaAPI();

            if (indicador) indicador.innerText = ok ? "" : "Sem internet — usando banco de reserva";
            atualizarAreasGrid();
        }
        /* ============ FIM DA INTEGRAÇÃO COM A API ============ */

        let quiz = { area: null, perguntas: [], indice: 0, respostas: [], inicioQuestao: 0, timerRef: null };

        function chaveHoje(area) {
            const hoje = new Date().toISOString().slice(0, 10);
            return `questoes_${area}_${hoje}`;
        }

        function lerStatsArea(area) {
            const salvo = localStorage.getItem(chaveHoje(area));
            return salvo ? JSON.parse(salvo) : { respondidas: 0, acertos: 0, tempoTotal: 0, triSoma: 0, triCount: 0 };
        }

        function salvarStatsArea(area, stats) {
            localStorage.setItem(chaveHoje(area), JSON.stringify(stats));
        }

        function atualizarAreasGrid() {
            const grid = document.getElementById('areasGrid');
            grid.innerHTML = '';
            Object.keys(nomesAreas).forEach(area => {
                const stats = lerStatsArea(area);
                const meta = 5;
                const pct = Math.min(100, Math.round((stats.respondidas / meta) * 100));
                const mediaAcertos = stats.respondidas > 0 ? Math.round((stats.acertos / stats.respondidas) * 100) : 0;
                const triMedio = stats.triCount > 0 ? Math.round(stats.triSoma / stats.triCount) : 0;
                const div = document.createElement('div');
                div.className = 'area-card';
                div.onclick = () => iniciarQuiz(area);
                div.innerHTML = `
                    <h3>${nomesAreas[area]}</h3>
                    <div class="area-stat">Hoje: <b>${stats.respondidas}</b> questões</div>
                    <div class="area-stat">Acertos: <b>${mediaAcertos}%</b></div>
                    <div class="area-stat">TRI média: <b>${triMedio || '-'}</b></div>
                    <div class="barra-progresso"><div class="barra-progresso-fill" style="width:${pct}%"></div></div>
                `;
                grid.appendChild(div);
            });
        }

        function embaralhar(array) {
            return [...array].sort(() => Math.random() - 0.5);
        }

        function iniciarQuiz(area) {
            quiz = {
                area: area,
                perguntas: embaralhar(obterQuestoesArea(area)).slice(0, 5),
                indice: 0,
                respostas: [],
                inicioQuestao: 0,
                timerRef: null
            };
            document.getElementById('telaAreas').classList.add('escondido');
            document.getElementById('telaResultado').classList.add('escondido');
            document.getElementById('telaQuiz').classList.remove('escondido');
            document.getElementById('quizAreaLabel').innerText = nomesAreas[area];
            mostrarQuestaoAtual();
        }

        // Converte um markdown bem simples (**negrito** e quebras de linha) da API em HTML seguro
        function formatarTexto(texto) {
            const escapado = texto
                .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            return escapado
                .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                .replace(/\n/g, "<br>");
        }

        function mostrarQuestaoAtual() {
            const p = quiz.perguntas[quiz.indice];
            document.getElementById('quizProgresso').innerText = `Questão ${quiz.indice + 1} de ${quiz.perguntas.length}`;
            document.getElementById('quizAno').innerText = p.ano ? `ENEM ${p.ano}` : "Banco de treino";
            document.getElementById('quizEnunciado').innerHTML = formatarTexto(p.enunciado);

            // Remove imagem e legenda da questão anterior, se houver
            const imgAntiga = document.getElementById('quizImagem');
            if (imgAntiga) imgAntiga.remove();
            const fonteAntiga = document.getElementById('quizFonte');
            if (fonteAntiga) fonteAntiga.remove();

            if (p.imagem) {
                const img = document.createElement('img');
                img.id = 'quizImagem';
                img.className = 'quiz-imagem';
                img.src = p.imagem;
                img.alt = 'Imagem de apoio da questão';
                document.getElementById('quizEnunciado').insertAdjacentElement('beforebegin', img);

                const fonte = document.createElement('p');
                fonte.id = 'quizFonte';
                fonte.className = 'quiz-fonte';
                fonte.innerText = p.ano
                    ? `Fonte: prova oficial do ENEM ${p.ano} (via api.enem.dev)`
                    : `Imagem de apoio — banco de treino`;
                document.getElementById('quizEnunciado').insertAdjacentElement('beforebegin', fonte);
            }

            const container = document.getElementById('quizAlternativas');
            container.innerHTML = '';
            p.alternativas.forEach((alt, i) => {
                const btn = document.createElement('button');
                btn.className = 'alt-btn';
                btn.innerText = alt;
                btn.onclick = () => responderQuestao(i);
                container.appendChild(btn);
            });

            // Esconde a explicação da questão anterior
            document.getElementById('quizExplicacao').classList.add('escondido');
            document.getElementById('btnProxima').innerText = (quiz.indice === quiz.perguntas.length - 1) ? "Ver resultado" : "Próxima questão";

            quiz.inicioQuestao = Date.now();
            let segundos = 0;
            document.getElementById('quizTimer').innerText = '0s';
            clearInterval(quiz.timerRef);
            quiz.timerRef = setInterval(() => {
                segundos++;
                document.getElementById('quizTimer').innerText = segundos + 's';
            }, 1000);
        }

        // Monta o texto de explicação: usa a explicação escrita à mão (banco de treino)
        // ou monta uma explicação a partir do comando oficial da questão (quando vem da API,
        // que não fornece uma explicação pedagógica pronta).
        function montarExplicacao(p) {
            if (p.explicacao) return p.explicacao;
            const letraCorreta = String.fromCharCode(65 + p.correta); // 0->A, 1->B...
            let texto = `A alternativa correta é a "${letraCorreta}) ${p.alternativas[p.correta]}".`;
            if (p.comando) texto += ` Isso porque o comando da questão pede: "${p.comando}" — e essa é a única alternativa que responde exatamente a isso, sem fugir do que o texto/enunciado está tratando.`;
            texto += ` Vale reler o enunciado com atenção e comparar cada alternativa com o que foi pedido — normalmente as erradas trazem uma ideia parecida, mas que desvia do ponto central.`;
            return texto;
        }

        function responderQuestao(indiceEscolhido) {
            clearInterval(quiz.timerRef);
            const p = quiz.perguntas[quiz.indice];
            const tempoGasto = Math.round((Date.now() - quiz.inicioQuestao) / 1000);
            const acertou = indiceEscolhido === p.correta;

            const botoes = document.querySelectorAll('#quizAlternativas .alt-btn');
            botoes.forEach((b, i) => {
                b.disabled = true;
                if (i === p.correta) b.classList.add('correta');
                else if (i === indiceEscolhido) b.classList.add('errada');
            });

            quiz.respostas.push({ acertou, tempoGasto, dificuldade: p.dificuldade });

            const textoResultado = document.getElementById('quizResultadoTexto');
            textoResultado.innerText = acertou ? "✅ Você acertou!" : "❌ Você errou.";
            textoResultado.className = `quiz-resultado-texto ${acertou ? 'acertou' : 'errou'}`;
            document.getElementById('quizTextoExplicacao').innerText = montarExplicacao(p);
            document.getElementById('quizExplicacao').classList.remove('escondido');
        }

        function avancarQuestao() {
            quiz.indice++;
            if (quiz.indice < quiz.perguntas.length) {
                mostrarQuestaoAtual();
            } else {
                finalizarQuiz();
            }
        }

        // Cálculo simplificado inspirado na lógica da TRI: questões difíceis acertadas valem mais,
        // erros em questões fáceis pesam mais que erros em questões difíceis.
        function calcularTRI(respostas) {
            let pontos = 500;
            respostas.forEach(r => {
                const peso = 30 + (r.dificuldade * 25);
                pontos += r.acertou ? peso : -peso * 0.4;
            });
            return Math.max(0, Math.min(1000, Math.round(pontos)));
        }

        function finalizarQuiz() {
            const acertos = quiz.respostas.filter(r => r.acertou).length;
            const tempoTotal = quiz.respostas.reduce((s, r) => s + r.tempoGasto, 0);
            const tempoMedio = Math.round(tempoTotal / quiz.respostas.length);
            const tri = calcularTRI(quiz.respostas);

            const stats = lerStatsArea(quiz.area);
            stats.respondidas += quiz.respostas.length;
            stats.acertos += acertos;
            stats.tempoTotal += tempoTotal;
            stats.triSoma += tri;
            stats.triCount += 1;
            salvarStatsArea(quiz.area, stats);

            document.getElementById('resAcertos').innerText = `${acertos}/${quiz.respostas.length}`;
            document.getElementById('resTempoTotal').innerText = `${tempoTotal}s`;
            document.getElementById('resTempoMedio').innerText = `${tempoMedio}s`;
            document.getElementById('resTRI').innerText = tri;

            document.getElementById('telaQuiz').classList.add('escondido');
            document.getElementById('telaResultado').classList.remove('escondido');
        }

        function continuarRespondendo() {
            iniciarQuiz(quiz.area);
        }

        function voltarParaAreas() {
            document.getElementById('telaResultado').classList.add('escondido');
            document.getElementById('telaQuiz').classList.add('escondido');
            document.getElementById('telaAreas').classList.remove('escondido');
            atualizarAreasGrid();
        }
        /* ================== FIM MÓDULO DE QUESTÕES DIÁRIAS ================== */

        function carregarDadosPerfil() {
            if (localStorage.getItem('perfil_nome')) {
                document.getElementById('viewNome').innerText = localStorage.getItem('perfil_nome');
                document.getElementById('editNome').value = localStorage.getItem('perfil_nome');
            }
            if (localStorage.getItem('perfil_bio')) {
                const bioSalva = localStorage.getItem('perfil_bio');
                document.getElementById('viewBio').innerHTML = `<p>${bioSalva.replace(/\n/g, '<br>')}</p>`;
                document.getElementById('editBioText').value = bioSalva;
            }
            if (localStorage.getItem('perfil_foto')) {
                const avatarDiv = document.getElementById('avatarDiv');
                avatarDiv.style.backgroundImage = `url(${localStorage.getItem('perfil_foto')})`;
                avatarDiv.innerText = ''; 
            }
        }

        let editando = false;
        function alternarEdicao() {
            const viewNome = document.getElementById('viewNome');
            const editNome = document.getElementById('editNome');
            const viewBio = document.getElementById('viewBio');
            const editBioContainer = document.getElementById('editBioContainer');
            const btnEditar = document.getElementById('btnEditar');

            if (!editando) {
                editNome.value = viewNome.innerText;
                viewNome.classList.add('escondido');
                editNome.classList.remove('escondido');

                viewBio.classList.add('escondido');
                editBioContainer.classList.remove('escondido');

                btnEditar.innerText = "Salvar Alterações";
                editando = true;
            } else {
                const novoNome = editNome.value;
                const novaBio = document.getElementById('editBioText').value;

                viewNome.innerText = novoNome;
                viewBio.innerHTML = `<p>${novaBio.replace(/\n/g, '<br>')}</p>`;

                localStorage.setItem('perfil_nome', novoNome);
                localStorage.setItem('perfil_bio', novaBio);

                editNome.classList.add('escondido');
                viewNome.classList.remove('escondido');

                editBioContainer.classList.add('escondido');
                viewBio.classList.remove('escondido');

                btnEditar.innerText = "Editar Perfil";
                editando = false;
            }
        }

        function carregarFoto(event) {
            const arquivo = event.target.files[0];
            if (arquivo) {
                const leitor = new FileReader();
                leitor.onload = function(e) {
                    const base64Image = e.target.result;
                    const avatarDiv = document.getElementById('avatarDiv');
                    avatarDiv.style.backgroundImage = `url(${base64Image})`;
                    avatarDiv.innerText = ''; 
                    
                    localStorage.setItem('perfil_foto', base64Image);
                }
                leitor.readAsDataURL(arquivo);
            }
        }

        function criarPost() {
            const textoArea = document.getElementById('textoPost');
            const texto = textoArea.value.trim();

            if (!texto) {
                alert("Escreva alguma coisa antes de publicar!");
                return;
            }

            const nomeUsuario = localStorage.getItem('perfil_nome') || "miguel_lopes";
            const fotoUsuario = localStorage.getItem('perfil_foto');
            const inicialUsuario = nomeUsuario.charAt(0).toUpperCase();

            const novoPostObj = {
                autor: nomeUsuario,
                tempo: "Agora mesmo",
                conteudo: texto,
                curtidas: 0,
                foto: fotoUsuario || null,
                inicial: inicialUsuario
            };

            let posts = JSON.parse(localStorage.getItem('feed_posts')) || [];
            posts.unshift(novoPostObj); 
            localStorage.setItem('feed_posts', JSON.stringify(posts));

            textoArea.value = "";
            carregarPostsSalvos();
        }

        function carregarPostsSalvos() {
            const feedContainer = document.getElementById('feedContainer');
            let postsSalvos = JSON.parse(localStorage.getItem('feed_posts')) || [];

            let htmlPosts = `
                <div class="post-card">
                    <div class="post-header">
                        <div class="post-avatar">M</div>
                        <div class="post-autor">
                            <h4>miguel_lopes</h4>
                            <span>Há 2 horas • Engenharia Mecânica - UFF</span>
                        </div>
                    </div>
                    <div class="post-conteudo">
                        Lista de Cálculo 2 concluída com sucesso! Foco total nas equações diferenciais essa semana. ⚙️🔥
                    </div>
                    <div class="post-acoes">
                        <span onclick="curtir(this)">❤️ Curtir (14)</span>
                        <span>💬 Comentar (3)</span>
                    </div>
                </div>
            `;

            postsSalvos.forEach(p => {
                let estiloAvatar = p.foto ? `background-image: url(${p.foto});` : '';
                let textoAvatar = p.foto ? '' : p.inicial;

                htmlPosts += `
                    <div class="post-card">
                        <div class="post-header">
                            <div class="post-avatar" style="${estiloAvatar}">${textoAvatar}</div>
                            <div class="post-autor">
                               <h4>${p.autor}</h4>
                               <span>${p.tempo} • UFF</span>
                            </div>
                        </div>
                        <div class="post-conteudo">
                            ${p.conteudo}
                        </div>
                        <div class="post-acoes">
                            <span onclick="curtir(this)">❤️ Curtir (${p.curtidas})</span>
                            <span>💬 Comentar (0)</span>
                        </div>
                    </div>
                `;
            });

            feedContainer.innerHTML = htmlPosts;
        }

        function curtir(elemento) {
            let textoAtual = elemento.innerText;
            let match = textoAtual.match(/\d+/);
            if (match) {
                let num = parseInt(match[0]) + 1;
                elemento.innerText = `❤️ Curtir (${num})`;
            }
        }

        /* ==================== SISTEMA DE CAPAS ESTILO NOTION (adicionado) ==================== */
        let capaEditandoIndex = null;
        let capaImagemAtual = null;   // imagem (base64) sendo editada no momento
        let capaPosX = 50;
        let capaPosY = 50;
        let arrastandoCapa = false;
        let arrasteInicioX = 0;
        let arrasteInicioY = 0;
        let arrastePosXInicial = 50;
        let arrastePosYInicial = 50;

        function chaveCapas() { return 'perfil_capas_grid'; }

        function lerCapasSalvas() {
            const bruto = localStorage.getItem(chaveCapas());
            return bruto ? JSON.parse(bruto) : {};
        }

        function salvarCapasNoStorage(capas) {
            localStorage.setItem(chaveCapas(), JSON.stringify(capas));
        }

        function aplicarCapaNoCard(index, dados) {
            const card = document.getElementById('capaItem' + index);
            if (!card) return;
            if (dados && dados.url) {
                const posX = (dados.posX !== undefined) ? dados.posX : 50;
                const posY = (dados.posY !== undefined) ? dados.posY : ((dados.pos !== undefined) ? dados.pos : 50);
                card.style.backgroundImage = `url(${dados.url})`;
                card.style.backgroundSize = 'cover';
                card.style.backgroundPosition = `${posX}% ${posY}%`;
                card.classList.add('tem-capa');
            } else {
                card.style.backgroundImage = '';
                card.classList.remove('tem-capa');
            }
        }

        function carregarCapasSalvas() {
            const capas = lerCapasSalvas();
            Object.keys(capas).forEach(index => aplicarCapaNoCard(index, capas[index]));
        }

        function abrirEditorCapa(index) {
            capaEditandoIndex = index;
            const capas = lerCapasSalvas();
            const dados = capas[index];

            const preview = document.getElementById('capaPreviewArraste');
            const btnEscolher = document.getElementById('btnEscolherImagemCapa');

            if (dados && dados.url) {
                capaImagemAtual = dados.url;
                capaPosX = dados.posX;
                capaPosY = dados.posY;
                preview.style.backgroundImage = `url(${capaImagemAtual})`;
                preview.style.backgroundPosition = `${capaPosX}% ${capaPosY}%`;
                preview.classList.remove('escondido');
                btnEscolher.innerText = "🔄 Trocar imagem";
            } else {
                capaImagemAtual = null;
                capaPosX = 50;
                capaPosY = 50;
                preview.style.backgroundImage = '';
                preview.classList.add('escondido');
                btnEscolher.innerText = "📷 Escolher imagem";
            }

            document.getElementById('capaInputArquivo').value = '';
            document.getElementById('modalCapa').classList.remove('escondido');
        }

        function fecharEditorCapa() {
            document.getElementById('modalCapa').classList.add('escondido');
            capaEditandoIndex = null;
        }

        function fecharEditorCapaSeClicarFora(event) {
            if (event.target.id === 'modalCapa') fecharEditorCapa();
        }

        // Carrega a imagem escolhida do dispositivo (igual à foto de perfil) — evita
        // o problema de link externo quebrado que deixava a capa toda preta.
        function carregarImagemCapa(event) {
            const arquivo = event.target.files[0];
            if (!arquivo) return;

            const leitor = new FileReader();
            leitor.onload = function(e) {
                capaImagemAtual = e.target.result;
                capaPosX = 50;
                capaPosY = 50;

                const preview = document.getElementById('capaPreviewArraste');
                preview.style.backgroundImage = `url(${capaImagemAtual})`;
                preview.style.backgroundPosition = '50% 50%';
                preview.classList.remove('escondido');

                document.getElementById('btnEscolherImagemCapa').innerText = "🔄 Trocar imagem";
            };
            leitor.readAsDataURL(arquivo);
        }

        // Arraste manual da imagem dentro do quadro (tipo ajustar papel de parede do celular)
        function iniciarArrasteCapa(clientX, clientY) {
            if (!capaImagemAtual) return;
            arrastandoCapa = true;
            arrasteInicioX = clientX;
            arrasteInicioY = clientY;
            arrastePosXInicial = capaPosX;
            arrastePosYInicial = capaPosY;
            const preview = document.getElementById('capaPreviewArraste');
            if (preview) preview.classList.add('arrastando');
        }

        function moverArrasteCapa(clientX, clientY) {
            if (!arrastandoCapa) return;
            const preview = document.getElementById('capaPreviewArraste');
            if (!preview) return;
            const largura = preview.offsetWidth || 1;
            const altura = preview.offsetHeight || 1;

            const deltaX = clientX - arrasteInicioX;
            const deltaY = clientY - arrasteInicioY;

            capaPosX = Math.min(100, Math.max(0, arrastePosXInicial - (deltaX / largura) * 100));
            capaPosY = Math.min(100, Math.max(0, arrastePosYInicial - (deltaY / altura) * 100));

            preview.style.backgroundPosition = `${capaPosX}% ${capaPosY}%`;
        }

        function finalizarArrasteCapa() {
            arrastandoCapa = false;
            const preview = document.getElementById('capaPreviewArraste');
            if (preview) preview.classList.remove('arrastando');
        }

        // Botão esquerdo do mouse
        document.addEventListener('mousedown', function(e) {
            if (e.button === 0 && e.target.closest('#capaPreviewArraste')) {
                iniciarArrasteCapa(e.clientX, e.clientY);
            }
        });
        document.addEventListener('mousemove', function(e) {
            moverArrasteCapa(e.clientX, e.clientY);
        });
        document.addEventListener('mouseup', function() {
            finalizarArrasteCapa();
        });

        // Toque (celular)
        document.addEventListener('touchstart', function(e) {
            if (e.target.closest('#capaPreviewArraste')) {
                const t = e.touches[0];
                iniciarArrasteCapa(t.clientX, t.clientY);
            }
        }, { passive: true });
        document.addEventListener('touchmove', function(e) {
            if (arrastandoCapa) {
                const t = e.touches[0];
                moverArrasteCapa(t.clientX, t.clientY);
            }
        }, { passive: true });
        document.addEventListener('touchend', function() {
            finalizarArrasteCapa();
        });

        function salvarCapa() {
            if (capaEditandoIndex === null) return;

            if (!capaImagemAtual) {
                removerCapa();
                return;
            }

            const dados = {
                url: capaImagemAtual,
                posX: Math.round(capaPosX),
                posY: Math.round(capaPosY)
            };

            const capas = lerCapasSalvas();
            capas[capaEditandoIndex] = dados;
            salvarCapasNoStorage(capas);
            aplicarCapaNoCard(capaEditandoIndex, dados);
            fecharEditorCapa();
        }

        function removerCapa() {
            if (capaEditandoIndex === null) return;
            const capas = lerCapasSalvas();
            delete capas[capaEditandoIndex];
            salvarCapasNoStorage(capas);
            aplicarCapaNoCard(capaEditandoIndex, null);
            capaImagemAtual = null;
            fecharEditorCapa();
        }
        