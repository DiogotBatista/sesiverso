# MVP online da cidade interativa — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` para execução direta ou `superpowers:subagent-driven-development` se o usuário escolher delegação. Executar e marcar as tarefas abaixo em ordem.

**Goal:** Entregar um link utilizável no celular para nomear uma cidade, fazer cinco escolhas durante o vídeo principal e assistir aos cinco vídeos selecionados em sequência.

**Architecture:** Uma página estática com dados, estilos e lógica embutidos. Um player principal controla as pausas; dois players silenciosos mostram prévias; o player principal é reutilizado para a sequência final. Um validador e uma página pequena de testes consultam os mesmos dados e funções via iframe de mesma origem, sem duplicar a configuração.

**Tech Stack:** HTML, CSS, JavaScript e APIs nativas de vídeo; Python apenas para servir arquivos localmente. Sem dependências de execução, instalação de pacotes ou build.

**Spec:** `docs/superpowers/specs/2026-09-14-jogo-video-interativo-design.md`

## Restrições globais

- MVP online por HTTPS, para celular em retrato e paisagem; offline fica para depois.
- Nome obrigatório após trim, limite de 60 caracteres, exibido com `textContent`.
- Cinco decisões, cada uma com exatamente duas opções; vídeos integrais somente no resultado.
- Prévias silenciosas de até cinco segundos, em repetição e com `playsinline`.
- Resultado: “Aqui está a cidade [nome]”, cinco vídeos com áudio na ordem das decisões, avanço automático, sem exportar arquivo.
- Reset de 60 segundos somente durante escolhas e após o término da sequência; não durante reprodução, digitação, recuperação de erro ou espera de rede.
- Preservar caminhos reais e originais dos vídeos. Não alterar arquivos já modificados pelo usuário fora desta entrega.
- Antes da implementação, ler a spec e verificar isolamento conforme `superpowers:using-git-worktrees`. Os vídeos locais precisam estar acessíveis no checkout usado; não assumir que estejam versionados.

## Pontos de atenção da revisão

1. Atualização de tempo salta sobre a marca: abrir a escolha uma vez, sem exigir igualdade; teste na tarefa 2.
2. Dois toques rápidos: registrar uma escolha e avançar uma etapa; teste na tarefa 2.
3. Nome com espaços, acentos ou marcação HTML: validar e renderizar texto literal; teste na tarefa 2.
4. Autoplay negado ou rede interrompida no resultado: recuperar o mesmo vídeo sem duplicar ou perder escolhas; teste na tarefa 3.
5. Reinício com callbacks pendentes: um evento antigo não deve reabrir escolhas ou avançar a nova partida; teste na tarefa 3.

## Arquivos e responsabilidades

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Configuração, interface e estado da partida; funções de validação dos dados |
| `validar.html` | Relatório dos dados, disponibilidade dos vídeos e duração do principal |
| `tests/jogo.html` | Verificações executáveis sem framework, carregando o jogo por iframe local |
| `README.md` | Execução local, publicação, edição de decisões e registro de aceite |

Os MP4 e prints existentes são entradas. Não criar módulo genérico de fluxogramas, backend, pipeline de renderização ou estrutura de aplicação além desses arquivos.

## Task 1 — Calibrar decisões e validar o acervo

**Arquivos:** criar `index.html`, `validar.html` e `tests/jogo.html`; atualizar `README.md` com a tabela de tempos medidos.

**Interfaces:** `window.jogo = { principal, decisoes, validarDados }`. `principal` é o caminho `videos/principal/INDEX.mp4`; `decisoes` é a lista da spec; `validarDados(decisoes, duracao)` retorna uma lista de mensagens de erro. O jogo não começa automaticamente quando carregado no iframe.

- [ ] Servir o projeto com `rtk proxy python3 -m http.server 8000 --bind 127.0.0.1`. Abrir o principal no navegador e conferir os cinco prints em `videos/escolhas/`. Usar o FFmpeg disponível para extrair quadros e localizar os trechos antes de conferir falas e transições no navegador.
- [ ] Usar um elemento de vídeo com controles no validador para mostrar o tempo e a duração. Pausar e avançar para encontrar início e término de cada tela de decisão, ouvindo as falas antes e depois. Registrar `pausaEm` e `retomaEm` em segundos no README e na configuração; ordenar pelo principal, não pela ordem das pastas. Não publicar com valores aproximados sem conferência audiovisual.

```js
video.addEventListener('timeupdate', () => {
  tempo.textContent = `${video.currentTime.toFixed(2)} / ${video.duration.toFixed(2)} s`;
});
```

- [ ] Criar uma página de testes com iframe apontando para `../index.html` e um relatório visível. Primeiro escrever o teste abaixo e verificar que falha antes de existir `window.jogo.validarDados`. Usar `structuredClone` para não modificar os dados do jogo.

```js
const jogo = iframe.contentWindow.jogo;
const assert = (ok, mensagem) => { if (!ok) throw new Error(mensagem); };
const dados = structuredClone(jogo.decisoes);
assert(jogo.validarDados(dados, 1e6).length === 0, 'acervo válido');
dados[0].retomaEm = dados[0].pausaEm;
assert(jogo.validarDados(dados, 1e6).length > 0, 'intervalo vazio rejeitado');
```

- [ ] Implementar `validarDados`: exigir cinco decisões, IDs únicos, títulos não vazios, duas opções com texto e caminho não vazios, tempos finitos, `0 <= pausaEm < retomaEm < duracao`, e início de cada decisão maior ou igual ao término da anterior. Adicionar casos de teste para ID repetido, opção ausente, `NaN`, tempo fora da duração e sobreposição; todos devem produzir erros.

```js
const temposValidos = Number.isFinite(d.pausaEm)
  && Number.isFinite(d.retomaEm)
  && 0 <= d.pausaEm && d.pausaEm < d.retomaEm && d.retomaEm < duracao;
```

- [ ] O validador carrega `index.html` num iframe de mesma origem, lê `contentWindow.jogo` após `load` e verifica a duração com `loadedmetadata`. Conferir os 11 arquivos com requisições HTTP; respostas de erro e HTML retornado no lugar de MP4 precisam aparecer como falhas. Checar metadados dos vídeos sequencialmente, liberando cada player ao terminar. Não manter lista de decisões própria no validador.
- [ ] Confirmar relatório válido para o acervo real e falha visível ao trocar temporariamente um caminho apenas nos dados de teste. Restaurar a cópia e executar a página de testes novamente. Registrar codec não reproduzível como falha, sem esconder a necessidade de conversão.
- [ ] Revisar o diff e criar commit apenas com os arquivos desta tarefa se permitido no ambiente; não incluir alterações previamente preparadas pelo usuário.

## Task 2 — Nome, principal e cinco escolhas

**Arquivos:** modificar `index.html` e `tests/jogo.html`.

**Interfaces:** ampliar `window.jogo` com `estado`, `iniciar(nome)`, `verificarPausa(tempo)` e `escolher(indice)`. Estado: `{ fase, nome, proximaDecisao, escolhas, indiceFinal, sessao }`. Fases: `inicio`, `principal`, `escolha`, `resultado`, `concluido`. Carregamento e erro são condições da fase atual, não devem perder a posição. `escolhas` armazena o objeto de opção selecionado, em ordem.

- [ ] Antes de implementar o fluxo, adicionar verificações de salto de tempo e duplo toque ao teste. Nas verificações de estado, substituir `HTMLMediaElement.prototype.play` dentro do iframe por função que retorna `Promise.resolve()` e `pause` por função vazia; restaurar ambas ao terminar. Isso testa lógica sem depender de autoplay, mas não substitui o teste real de vídeo.

```js
jogo.iniciar('  Cidade Águas  ');
jogo.verificarPausa(jogo.decisoes[0].pausaEm + 0.3);
assert(jogo.estado.fase === 'escolha', 'salto dispara escolha');
jogo.escolher(0);
jogo.escolher(1);
assert(jogo.estado.escolhas.length === 1, 'toque duplicado ignorado');
assert(jogo.estado.nome === 'Cidade Águas', 'nome normalizado');
```

- [ ] Implementar formulário com `required`, `maxlength="60"` e label associado. Revalidar com `trim()` no JavaScript. Nome vazio ou maior que 60 caracteres não inicia a partida. Renderizar o nome com `textContent`; testar espaços, acentos e `<img src=x onerror=alert(1)>` como texto literal, sem criar elementos.
- [ ] Criar layout com vídeo proporcional (`width:100%`, `object-fit:contain`) e duas opções em grid adaptável, botões nativos e foco visível. A camada de escolha deve encobrir a tela de opções embutida. Não exigir rotação nem API de tela cheia.
- [ ] Implementar a verificação no `timeupdate` do principal e ignorá-la em outras fases. Não usar comparação exata nem processar todas as decisões num laço.

```js
function verificarPausa(tempo) {
  if (estado.fase !== 'principal') return;
  const decisao = decisoes[estado.proximaDecisao];
  if (!decisao || tempo < decisao.pausaEm) return;
  estado.fase = 'escolha';
  player.pause();
  mostrarEscolha(decisao);
}
```

- [ ] Implementar `mostrarEscolha(decisao)` preenchendo texto e caminhos dos dois players de prévia. Usar `muted`, `playsInline` e repetição; em `timeupdate`, voltar para zero quando atingir `Math.min(5, duration)`, além de tratar `ended`. Capturar rejeições de `play()` das prévias sem bloquear os botões.
- [ ] Implementar `escolher(indice)` com guarda de fase e índice inteiro 0 ou 1. Mudar a fase de forma síncrona antes de retomar reprodução, parar prévias, registrar opção, incrementar `proximaDecisao`, mover `currentTime` para `retomaEm` e reproduzir o principal.
- [ ] Rodar testes de estado e depois jogar no navegador: cada decisão deve aparecer uma vez; o vídeo escolhido não toca inteiro nessa etapa. Emular viewport estreito e conferir botões, textos e ausência de áudio nas prévias. Rejeição do principal deve mostrar botão para continuar, não erro silencioso.
- [ ] Revisar diff e criar commit limitado à tarefa se permitido.

## Task 3 — Resultado, recuperação e nova partida

**Arquivos:** modificar `index.html` e `tests/jogo.html`.

**Interfaces:** adicionar `encerrarVideo()`, `reiniciar()` e `verificarInatividade(agora)` a `window.jogo`. Implementar internamente `reproduzirAtual()`, `mostrarErro()` e `agendarInatividade()`; eventos e botões chamam essas funções diretamente, sem event bus. `reproduzirAtual` captura a sessão para descartar resoluções/rejeições antigas.

- [ ] Escrever e executar, antes da implementação, teste que percorre cinco decisões, termina o principal, verifica cinco vídeos na ordem e conclui sem sexto vídeo. Usar a mesma substituição temporária de `play/pause` da tarefa 2.

```js
jogo.iniciar('Cidade Teste');
for (let i = 0; i < jogo.decisoes.length; i++) {
  jogo.verificarPausa(jogo.decisoes[i].pausaEm + 0.1);
  jogo.escolher(i % 2);
}
jogo.encerrarVideo();
assert(jogo.estado.fase === 'resultado', 'resultado começou');
assert(jogo.estado.escolhas.every((opcao, i) =>
  opcao.video === jogo.decisoes[i].opcoes[i % 2].video), 'ordem preservada');
for (let i = 0; i < 5; i++) jogo.encerrarVideo();
assert(jogo.estado.fase === 'concluido', 'cinco vídeos encerrados');
```

- [ ] Implementar `encerrarVideo`: em `principal`, exigir cinco escolhas antes de abrir o resultado; em `resultado`, avançar um índice, carregar o próximo vídeo ou exibir “Criar outra cidade”. Conectar `ended` a essa função somente para a fonte e sessão atuais. Remover ouvintes antigos ao trocar a fonte; callbacks antigos devem conferir sessão e índice capturados.
- [ ] Exibir “Aqui está a cidade [nome]” com `textContent`, manter a frase durante os vídeos e iniciar a sequência com áudio automaticamente. Pré-carregar somente o próximo vídeo com um player sem reprodução; não prometer ausência absoluta de intervalos.
- [ ] Implementar `reproduzirAtual` capturando rejeições de `play()`: `NotAllowedError` mostra “Toque para continuar”; erro de mídia mostra “Tentar novamente” e “Voltar ao início”. Para tentar novamente, guardar posição atual, recarregar o mesmo arquivo e restaurar posição após metadados. Mostrar carregamento em `waiting`, limpar em `playing`; não avançar em `error`, `waiting` ou `stalled`.
- [ ] Testar uma promessa rejeitada por `NotAllowedError`, um erro de mídia e uma promessa que rejeita depois de `reiniciar()`. Conferir estado preservado nos dois primeiros e ausência de mensagem antiga após reinício. Interromper a rede durante um vídeo no navegador para verificar a interface real.
- [ ] Implementar reset com um único temporizador nas fases elegíveis. Guardar `ultimoToque` e comparar `agora - ultimoToque >= 60000` em `verificarInatividade(agora)`. Suspender durante carregamento/erro; rearmar após recuperação. Interações por toque ou teclado renovam a contagem. Prévias não contam como interação.
- [ ] Testar `verificarInatividade(ultimoToque + 60001)` em escolha e concluído (reinicia), e em principal, resultado, início e erro/carregamento (preserva). Não esperar um minuto nos testes automatizados.
- [ ] Implementar `reiniciar`: incrementar `sessao`, cancelar temporizador, parar todos os vídeos, remover fontes de prévia/pré-carga, limpar nome e escolhas e focar o campo inicial. Testar callback antigo e nova partida sem escolhas anteriores.
- [ ] Executar a página de testes completa e três partidas reais: primeiras opções, segundas opções e combinação mista. Criar commit limitado à tarefa se permitido.

## Task 4 — Publicar e conferir no celular

**Arquivos:** atualizar `README.md`; modificar os arquivos de mídia de entrega somente se a reprodução real demonstrar necessidade, preservando originais.

**Interfaces:** consome página e vídeos validados; produz URL HTTPS da entrega e registro de testes. Não pressupõe conta, provedor ou domínio já disponíveis.

- [ ] Rodar `rtk proxy git diff --check`, a página `tests/jogo.html` e `validar.html`. Registrar resultados efetivos, sem considerar verificações manuais planejadas como executadas.
- [ ] Documentar no README o comando de servidor local, caminhos de edição dos dados, mapa dos cinco tempos e como abrir `/validar.html` e `/tests/jogo.html`. O servidor ligado em `127.0.0.1` é apenas para o computador; usar a URL publicada para aprovação no celular.
- [ ] Conferir tamanho individual, duração e reprodução dos 11 MP4 no navegador-alvo. Acervo observado no planejamento: aproximadamente 21,8 MB. FFmpeg e FFprobe 8.0.1 foram extraídos dos pacotes oficiais Ubuntu para `/tmp/sesiverso-ffmpeg/local/usr/bin`; executar com `LD_LIBRARY_PATH=/tmp/sesiverso-ffmpeg/local/usr/lib/x86_64-linux-gnu`. A instalação é temporária e pode precisar ser refeita após limpeza de `/tmp`. O principal foi analisado: 89,531667 segundos, H.264, 1024 × 576, áudio AAC. Se ocorrer incompatibilidade, converter cópias e validar novamente, sem sobrescrever originais.
- [ ] Preparar a pasta publicável apenas com `index.html` e os MP4 referenciados, mantendo caminhos relativos. Documentação, prints, testes e validador não são necessários no link de aprovação.
- [ ] Verificar se há hospedagem estática já configurada ou ferramenta de publicação disponível. Usar a existente; caso não haja, apresentar a pasta pronta e pedir somente o destino/acesso necessário. Não criar conta, aceitar custos nem inventar URL. O pedido do MVP online autoriza preparar e publicar a prévia dentro dos acessos disponíveis.
- [ ] Após publicar, verificar HTTPS, URLs diretas dos MP4, MIME de vídeo e resposta a requisição parcial: `curl -I -H 'Range: bytes=0-1023' URL_DO_VIDEO`, substituindo o endereço pelo real. Preferir confirmar um GET parcial e resposta `206` quando o provedor não suporta HEAD. Evitar fallback de SPA que responda HTML para vídeo inexistente.
- [ ] Abrir o link em um celular real e executar o roteiro de aceite da spec, incluindo áudio, retrato/paisagem, prévias, cinco escolhas, sequência final, repetição e recuperação. Se não houver acesso ao aparelho, registrar a pendência e solicitar o teste ao usuário sem afirmar aprovação em hardware real.
- [ ] Registrar no README a URL, data, aparelho/navegador e resultados observados. Entregar o link com eventuais pendências explícitas. Offline permanece fora desta entrega.

## Revisão do plano

Cobertura: nome, tempos e escolhas nas tarefas 1–2; resultado, falhas, inatividade e reinício na tarefa 3; hospedagem e aceite móvel na tarefa 4. O validador lê uma única configuração. Os cinco riscos listados têm verificações nas tarefas responsáveis. A cronologia e os tempos serão medidos como parte da primeira tarefa, sem inventar dados no planejamento.
