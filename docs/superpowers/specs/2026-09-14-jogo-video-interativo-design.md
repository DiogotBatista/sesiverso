# Sesiverso — Construa sua cidade com vídeos interativos

**Data original:** 2026-09-14
**Revisão:** 2026-09-20
**Status:** fluxo aprovado; documento revisado para conferência antes do plano de implementação.

## Objetivo e etapas

O visitante dá um nome à cidade e assiste a um vídeo principal que apresenta cinco decisões sobre seu desenvolvimento. Em cada decisão, escolhe entre duas miniaturas de vídeo em movimento. Ao final, os cinco vídeos selecionados são reproduzidos integralmente na ordem das decisões, apresentando a cidade criada.

O primeiro entregável é um **MVP online, acessível por link no celular para aprovação**. A versão offline para o tablet Android da feira fica para uma etapa posterior.

## Plataforma

- Site estático com HTML, CSS e JavaScript, sem framework, build, backend, conta ou banco de dados.
- Página e vídeos servidos por HTTPS, preferencialmente na mesma origem. O MVP depende de internet.
- Interface responsiva para celular em retrato e paisagem, preservando a proporção dos vídeos. Tela cheia opcional; o jogo funciona dentro da página.
- Nome e escolhas ficam somente na memória da sessão. Recarregar ou reiniciar começa uma nova cidade.

## Fluxo aprovado

1. **Nomear a cidade.** Campo “Nome da sua cidade” e botão “Começar”. Texto livre, obrigatório após remover espaços nas extremidades, com limite de 60 caracteres. Exibir o nome como texto, nunca como HTML.
2. **Assistir ao principal.** O toque em “Começar” inicia `videos/principal/INDEX.mp4` com áudio.
3. **Escolher.** Em cada ponto de decisão, o principal pausa. Uma interface sobreposta apresenta o tema e duas opções com texto e prévia animada.
4. **Continuar.** O toque registra uma opção, interrompe as prévias e retoma o principal após o trecho de escolha embutido no vídeo. O vídeo selecionado não toca integralmente nessa etapa.
5. **Apresentar a cidade.** Quando o principal termina e as cinco escolhas estão registradas, aparece **“Aqui está a cidade [nome]”**. A frase permanece visível durante a apresentação final, que começa automaticamente em condições normais.
6. **Reproduzir o resultado.** Os cinco vídeos escolhidos tocam integralmente, com áudio, na ordem das decisões, avançando automaticamente. O principal não é repetido nessa sequência.
7. **Recomeçar.** Após o último vídeo, “Criar outra cidade” limpa nome, escolhas e posição de reprodução e volta à tela inicial.

As prévias antecipam as opções; os vídeos completos ficam reservados para o resultado, evitando repetição durante as escolhas.

## Acervo disponível

Principal: `videos/principal/INDEX.mp4`. Cada pasta de escolhas contém dois vídeos e um `image.png` de referência do trecho correspondente do principal.

| Pasta em `videos/escolhas/` | Opção 1 / arquivo | Opção 2 / arquivo |
|---|---|---|
| `TRANSPORTE` | Cidade voltada para carros — `CIDADE_VOLTADA_PARA_CARROS.mp4` | Mobilidade sustentável — `MOBILIDADE_SUSTENTAVEL.mp4` |
| `POLOS_INDUSTRIAIS` | Polos sustentáveis — `POLOS_SUSTENTAVEIS.mp4` | Polos convencionais — `POLOS_CONVENCIONAIS.mp4` |
| `areas_verdes` | Parques urbanos integrados — `PARQUES_URBANOS_INTREGRADOS.mp4` | Expansão urbana — `EXPEANSAO_URBANA.mp4` |
| `LIXO` | Economia circular — `ECONOMIA_CIRCULAR.mp4` | Descarte convencional — `DESCARTE_CONVENCIONAL.mp4` |
| `SANEAMENTO_BASICO` | Saneamento precário — `SANEAMENTO_PRECARIO.mp4` | Saneamento completo — `SANEAMENTO_COMPLETO.mp4` |

Preservar a grafia real dos caminhos, inclusive `EXPEANSAO` e `INTREGRADOS`; os rótulos da interface usam português corrigido. A ordem da tabela não define a cronologia, que deve seguir o principal.

## Dados e pontos de decisão

O antigo mapa de cenas ramificadas é substituído por uma lista ordenada de cinco decisões embutida em `index.html`. Todos passam pelos mesmos temas; as escolhas alteram a sequência final.

Cada decisão contém:

- `id` único e `titulo` do tema.
- `pausaEm`: tempo em segundos no principal para abrir a escolha.
- `retomaEm`: tempo após o trecho de escolha embutido, de onde continuar.
- `opcoes`: exatamente duas entradas com `texto` e `video` (caminho relativo completo).

**Calibração obrigatória na implementação:** localizar os cinco trechos em `INDEX.mp4` usando os prints, medir início e término de cada tela de escolha e conferir a continuidade das falas. Os prints não contêm timestamps; não usar tempos presumidos. Registrar os valores medidos na lista em ordem cronológica.

Detectar a passagem por `pausaEm`, sem depender de igualdade exata entre tempos. Cada decisão dispara uma vez por partida; retomar não reabre a mesma escolha. Ocultar controles de avanço do principal para evitar pular decisões.

O estado guarda nome, próxima decisão, opções selecionadas e índice do vídeo final. A apresentação final só começa com cinco escolhas válidas.

## Prévias e reprodução no celular

Mostrar duas prévias de até cinco segundos a partir do início dos respectivos vídeos, em repetição, sem áudio e dentro da página (`muted` e `playsinline`). O MVP usa os próprios arquivos, sem criar vídeos de prévia separados.

As opções são botões com rótulos legíveis, foco visível e área de toque confortável. Em telas estreitas, podem se empilhar. A interface encobre os textos e imagens de escolha já presentes no principal, evitando duplicação.

Somente as duas prévias atuais tocam simultaneamente; ambas param ao sair da escolha. Se o navegador impedir sua reprodução, as opções continuam identificáveis e selecionáveis pelo texto.

O toque inicial solicita reprodução com áudio, mas não garante autorização permanente. Se uma reprodução posterior for bloqueada, mostrar “Toque para continuar” e retomar o mesmo vídeo, preservando a partida.

## Sequência final e carregamento

“Como um vídeo só” significa reprodução sequencial automática no mesmo espaço visual, sem menus ou toques entre os cinco vídeos. Não há concatenação, renderização, exportação ou download de um arquivo novo.

Pré-carregar com moderação as próximas opções e o próximo vídeo da sequência. O navegador pode ignorar sugestões de pré-carregamento e a rede pode causar espera entre arquivos. Exibir carregamento sem perder a ordem nem avançar antes do término do vídeo atual. Continuidade sem qualquer intervalo não é garantida pelo MVP.

Antes de publicar, verificar tamanho, codecs e compatibilidade no celular. Se necessário, produzir cópias otimizadas para web preservando os originais. Escolher hospedagem estática que comporte o acervo e suporte requisições parciais de vídeo para busca por tempo.

## Falhas e reinício

- Falha no principal ou em um vídeo final apresenta “Ops, esse vídeo não carregou”, com “Tentar novamente” e “Voltar ao início”. Tentar novamente preserva a partida e não pula conteúdo.
- Espera de rede apresenta carregamento; não equivale ao término do vídeo.
- Toques repetidos não registram escolhas duplicadas.
- O reset de 60 segundos aplica-se às telas de escolha e à tela final após a sequência. Não corre durante o principal, a apresentação da cidade, a digitação inicial, recuperação de erro ou espera de rede. As prévias animadas não desativam o temporizador.
- Reiniciar interrompe todos os vídeos e temporizadores e limpa o estado.

## Estrutura

```text
sesiverso/
  index.html       interface, estilos, lógica e lista de decisões
  validar.html     checagem dos dados e vídeos para quem edita o jogo
  videos/
    principal/INDEX.mp4
    escolhas/<tema>/*.mp4
    escolhas/<tema>/image.png
```

Os prints são referências de calibração, não substitutos das prévias. O validador consulta os mesmos dados usados pelo jogo, sem manter uma segunda lista manual.

## Verificação e aceite

O validador aponta identificadores repetidos, títulos ausentes, decisões sem exatamente duas opções, rótulos ou caminhos vazios, arquivos indisponíveis e tempos inválidos. Exigir `0 <= pausaEm < retomaEm < duração do principal`, com decisões em ordem e sem sobreposição de intervalos.

Testar pelo link publicado em um celular real:

- Nome obrigatório, com acentos, exibido corretamente e com segurança.
- Cinco pausas no momento correto, sem cortar falas, repetir decisões ou perder escolhas.
- Duas prévias animadas e silenciosas por decisão; botões utilizáveis em retrato e paisagem.
- Principal retomado após cada escolha, sem tocar o vídeo escolhido por inteiro nessa etapa.
- Resultado com exatamente os cinco vídeos selecionados, na ordem, com áudio e avanço automático.
- Recuperação de bloqueio de reprodução e falha de rede preservando a partida.
- Reset somente nas fases previstas e nova partida sem dados anteriores.

Exercitar todas as primeiras opções, todas as segundas e uma combinação mista. Registrar aparelho e navegador da aprovação; verificar outros aparelhos antes de prometer compatibilidade.

## Etapa posterior: offline para a feira

Após aprovar o MVP, preparar a execução offline no tablet Android de destino, incluindo vídeos locais, modo quiosque e teste de áudio, continuidade e reinício sem internet. Definir e testar a distribuição nessa etapa; abrir uma pasta via `file://` não é compatibilidade já comprovada.

## Fora de escopo do MVP

Offline, instalação de aplicativo, pontuação, login, persistência de partidas, editor visual, ramificações que mudam as próximas decisões, compartilhamento ou exportação do vídeo final, geração de vídeo no servidor e múltiplos idiomas.
