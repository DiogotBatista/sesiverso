# Relatório de implementação — MVP online da cidade interativa

## Resultado entregue

Foi implementado um site estático em HTML, CSS e JavaScript, sem framework, build ou backend. O visitante informa o nome da cidade, assiste ao vídeo principal, faz cinco escolhas por meio de prévias animadas e, ao final, assiste aos cinco vídeos escolhidos em sequência.

A versão 1 foi publicada com sucesso em ambiente privado:

- URL: <https://sesiverso-cidade-interativa.diogotbatista.chatgpt.site>
- Projeto Sites: `appgprj_6ab091954b488191a558466c29a7db8e`
- Versão: `appgprj_6ab091954b488191a558466c29a7db8e~appgver_52165d87b64881919d4aa35312abc976`
- Deployment: `appgdep_6ab092a9aca08191ab46b945c5671b88`
- Estado final informado pela plataforma: `succeeded`
- Acesso: privado, restrito ao proprietário autenticado

Uma requisição sem autenticação para a página e para o vídeo principal retornou HTTP `401 text/html`, comportamento esperado para a publicação privada. A plataforma recusou a criação de um token de bypass por segurança; portanto, não foi realizado teste HTTP autenticado automatizado nem validação externa de resposta parcial `206`.

## Escopo implementado

### Tela inicial

- Campo obrigatório “Nome da sua cidade”.
- Remoção de espaços nas extremidades.
- Limite de 60 caracteres.
- Nome renderizado com `textContent`, inclusive quando contém marcação HTML, evitando injeção de elementos.
- Primeiro toque inicia o vídeo principal com áudio; bloqueio de autoplay apresenta “Toque para continuar”.

### Vídeo principal e decisões

- Player responsivo, com reprodução dentro da página e sem controles de avanço.
- Pausa automática ao ultrapassar o tempo configurado de cada decisão; não depende de igualdade exata entre tempos.
- Duas prévias por decisão, silenciosas, com `playsinline` e repetição limitada aos primeiros cinco segundos.
- Opções apresentadas como botões acessíveis e adaptáveis a telas estreitas.
- Duplo toque não registra duas escolhas.
- Depois da escolha, as prévias são interrompidas e liberadas, e o principal avança ao próximo trecho.

### Resultado

- Mensagem “Aqui está a cidade [nome]”.
- Reprodução integral dos cinco vídeos escolhidos, na ordem das decisões.
- Avanço automático no mesmo player, sem gerar ou exportar um novo arquivo de vídeo.
- Pré-carregamento apenas do próximo vídeo.
- Botão “Criar outra cidade” ao final.

### Robustez

- Botão permanente “Recomeçar”.
- Reset após 60 segundos somente durante uma escolha ou depois do término da sequência.
- Inatividade suspensa durante vídeo, carregamento e erro.
- Estado de carregamento para eventos `waiting`.
- Erro de mídia com “Tentar novamente” e “Voltar ao início”.
- Nova tentativa preserva a posição do vídeo.
- Rejeições e eventos antigos são ignorados depois de reiniciar a partida.
- Reinício interrompe players, pré-carga e temporizadores e limpa todo o estado.

## Ordem e calibração das decisões

O vídeo principal possui as cinco telas de escolha consecutivas no final. A ordem foi determinada pelos quadros reais do vídeo, e não pelos nomes das pastas.

| Ordem | Tema | Pausa | Retomada |
|---|---|---:|---:|
| 1 | Áreas verdes | 62,5 s | 67,9 s |
| 2 | Polos industriais | 67,9 s | 73,3 s |
| 3 | Transporte | 73,3 s | 78,8 s |
| 4 | Lixo | 78,8 s | 84,2 s |
| 5 | Saneamento básico | 84,2 s | 89,4 s |

Foram extraídos quadros a cada segundo e executada detecção de mudança de cena. As transições relevantes apareceram aproximadamente em 62,43 s, 67,80 s, 73,20 s, 78,60 s e 84,00 s. Os tempos configurados ficam logo após essas transições, evitando exibir a tela embutida antes da sobreposição do jogo.

## Auditoria dos vídeos

O acervo contém 11 MP4, aproximadamente 21,8 MB. Todos possuem vídeo H.264 e áudio AAC estéreo.

| Arquivo | Duração | Resolução |
|---|---:|---:|
| `principal/INDEX.mp4` | 89,531667 s | 1024 × 576 |
| `LIXO/DESCARTE_CONVENCIONAL.mp4` | 8,083333 s | 864 × 480 |
| `LIXO/ECONOMIA_CIRCULAR.mp4` | 8,041667 s | 1040 × 576 |
| `POLOS_INDUSTRIAIS/POLOS_CONVENCIONAIS.mp4` | 10,1 s | 576 × 576 |
| `POLOS_INDUSTRIAIS/POLOS_SUSTENTAVEIS.mp4` | 10,1 s | 576 × 576 |
| `SANEAMENTO_BASICO/SANEAMENTO_COMPLETO.mp4` | 10,1 s | 576 × 1024 |
| `SANEAMENTO_BASICO/SANEAMENTO_PRECARIO.mp4` | 10,1 s | 576 × 1024 |
| `TRANSPORTE/CIDADE_VOLTADA_PARA_CARROS.mp4` | 10,1 s | 576 × 1024 |
| `TRANSPORTE/MOBILIDADE_SUSTENTAVEL.mp4` | 10,1 s | 576 × 1024 |
| `areas_verdes/EXPEANSAO_URBANA.mp4` | 10,1 s | 576 × 576 |
| `areas_verdes/PARQUES_URBANOS_INTREGRADOS.mp4` | 10,1 s | 576 × 576 |

Os caminhos mantêm a grafia dos arquivos fornecidos, inclusive `EXPEANSAO` e `INTREGRADOS`; os textos visíveis usam a grafia corrigida.

## FFmpeg

A instalação global com `apt-get` não pôde ser concluída porque o ambiente exigia autenticação interativa de administrador. Como alternativa, foram baixados pacotes oficiais do Ubuntu e extraídos em `/tmp/sesiverso-ffmpeg/local`:

- FFmpeg e FFprobe 8.0.1.
- Bibliotecas adicionais: `libavdevice62`, `libxcb-shape0`, `libcdio-paranoia2t64`, `libcdio-cdda2t64`, `libxv1` e `libcdio19t64`.
- Execução com `LD_LIBRARY_PATH=/tmp/sesiverso-ffmpeg/local/usr/lib/x86_64-linux-gnu`.

Essa instalação é temporária e deixa de existir se `/tmp` for limpo.

## Validação e testes

### Testes automatizados

O ambiente não tinha navegador headless. Foi mantida a página manual `tests/jogo.html` e criado `tests/jogo.mjs`, que executa o núcleo JavaScript real de `index.html` com APIs nativas do Node.

Comando final:

```bash
node tests/jogo.mjs
```

Resultado final: **43 verificações aprovadas**. A suíte cobre:

- Dados válidos e cinco classes de configuração inválida.
- Nome vazio, limite, normalização, acentos e marcação HTML literal.
- Salto sobre o timestamp, primeira escolha, duplo toque e retomada correta.
- Liberação das prévias e bloqueio de autoplay.
- Ordem dos cinco vídeos finais e término sem sexto vídeo.
- Reset por inatividade nas fases permitidas e preservação durante reprodução.
- Falha de mídia, nova tentativa e restauração da posição.
- Rejeição de reprodução que não é autoplay.
- Rejeição e evento de mídia atrasados após reinício.

Um teste adicional reproduziu uma falha real: um evento de mídia atrasado podia marcar uma nova partida como quebrada. O teste falhou antes da correção e passou após limitar eventos às fases `principal` e `resultado`.

### Validador no navegador

`validar.html` utiliza a mesma configuração do jogo, sem duplicar a lista de decisões. Ele verifica:

- Quantidade, identificadores, títulos, opções e intervalos.
- Duração do principal.
- HTTP e MIME dos 11 vídeos.
- Carregamento sequencial dos metadados e compatibilidade de reprodução.
- Player com tempo atual para conferência manual dos pontos de pausa.

No servidor HTTP local, as três páginas responderam `200 text/html` e os 11 vídeos responderam `200 video/mp4`. Um caminho propositalmente inexistente respondeu `404 text/html`, permitindo ao validador distinguir vídeo ausente de conteúdo válido.

## Publicação

### Revisão posterior

Na revisão posterior, a marca exibida foi alterada para **Cidade Ideal**. Durante as escolhas, o player principal agora é ocultado e silenciado; ele volta a aparecer com áudio ao retomar. As prévias permanecem sem som para não competir com o vídeo principal.

Foi criado um pacote mínimo, sem documentação, testes, validador ou prints:

```text
.openai/hosting.json
dist/index.html
dist/videos/principal/INDEX.mp4
dist/videos/escolhas/<tema>/*.mp4
```

Dados da versão publicada:

- Commit do pacote: `01cd51d9e11ff0662b25f7b226abc6e021f7d307`.
- Arquivo local: `/tmp/sesiverso-site-01cd51d.tar.gz`.
- SHA-256 local: `5d9cb5f6035be67eab5dd59580a4546a274613fd0725ded53f17157ce253849c`.
- Tamanho recebido pela plataforma: 21.811.200 bytes.
- Conteúdo registrado pela plataforma: `sha256:cb550c3e204b34f61bd20f3670a4b02579ced5e085fefd829dd2b45eb34738f4`.

A primeira tentativa de salvar a versão foi recusada porque `static.directory` estava configurado como `.`. A plataforma aceita diretórios de saída padronizados. O pacote foi reorganizado sob `dist/`, a configuração mudou para `"directory": "dist"`, o novo commit foi enviado e a versão 1 foi aceita e publicada.

## Git e isolamento

A implementação ocorreu na worktree `.worktrees/cidade-interativa-mvp`, branch `feat/cidade-interativa-mvp`, para não misturar o trabalho com a `main`.

Commits criados:

- `f39ce1a` — ignora worktrees locais.
- `7397ce9` — revisa o design e cria o plano do MVP.
- `5c55302` — calibra decisões e implementa o validador.
- `7894575` — adiciona nome da cidade e escolhas com prévias.
- `c5a62a2` — adiciona sequência final, erros, inatividade e reinício.
- `99df6e4` — configura a hospedagem e documenta a publicação.

## Arquivos do projeto

- `index.html`: interface, estilos, dados e lógica do jogo.
- `validar.html`: conferência dos dados, arquivos e timestamps.
- `tests/jogo.html`: verificações visíveis no navegador.
- `tests/jogo.mjs`: suíte automatizada sem dependências.
- `README.md`: execução, tempos e URL de aprovação.
- `docs/superpowers/specs/2026-09-14-jogo-video-interativo-design.md`: design aprovado.
- `docs/superpowers/plans/2026-09-20-cidade-interativa-mvp.md`: plano executado.

## Pendências e limites conhecidos

- Abrir o link autenticado em um celular real e executar uma partida completa em retrato e paisagem.
- Confirmar áudio após o primeiro toque e transições entre os cinco vídeos finais no aparelho-alvo.
- Simular interrupção real de rede no celular e verificar “Tentar novamente”.
- Confirmar requisições parciais de vídeo na hospedagem com uma sessão autenticada.
- A versão offline e o modo quiosque permanecem fora do MVP e serão tratados depois da aprovação online.
