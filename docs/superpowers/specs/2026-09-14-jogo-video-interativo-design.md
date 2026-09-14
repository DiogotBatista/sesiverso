# Sesiverso — Jogo de vídeo interativo para feira de ciências

**Data:** 2026-09-14
**Status:** design aprovado, pronto para plano de implementação

## Objetivo

Transformar os vídeos gravados pelo grupo escolar num jogo de narrativa
ramificada. O visitante assiste a uma cena, escolhe entre duas ou mais opções,
e a escolha determina a próxima cena.

O jogo roda num tablet Android durante a feira, em modo quiosque: o visitante
pega o aparelho e joga sozinho, sem ninguém operando.

## Restrições

**Offline obrigatório.** Wi-Fi de feira de ciências é o ponto de falha mais
provável do dia. O jogo não faz nenhuma requisição de rede.

**Tablet Android, Chrome.** O jogo é uma pasta copiada por cabo USB e aberta
pelo navegador. Sem instalação de aplicativo, sem loja, sem APK.

**Vídeos na horizontal.** Layout em paisagem, tablet apoiado na mesa.

**Sem dependências.** Nenhum framework, nenhum build, nenhum `node_modules`.
Editar o jogo é editar um arquivo de texto.

## Estrutura de arquivos

```
sesiverso/
  index.html        jogo completo: HTML + CSS + JS num arquivo só
  videos/           arquivos .mp4 das cenas
  validar.html      ferramenta de checagem do fluxograma (não vai para a feira)
```

O jogo inteiro cabe em `index.html`. Essa decisão não é estética: em páginas
abertas via `file://`, o Chrome do Android trata cada arquivo como origem
isolada e bloqueia `fetch()` de arquivos vizinhos. Mantendo o fluxograma
embutido no próprio HTML, nenhuma requisição acontece e a restrição deixa de
existir. A tag `<video src="videos/cena.mp4">` não passa por essa checagem e
carrega normalmente.

## Modelo de dados

Um objeto `cenas` no `index.html`, mapeando identificador para cena:

```js
const cenas = {
  inicio: {
    video: "01-abertura.mp4",
    pergunta: "O que fazer?",
    opcoes: [
      { texto: "Investigar o laboratório", vai: "lab" },
      { texto: "Voltar para casa",         vai: "casa" }
    ]
  },
  lab: {
    video: "02-laboratorio.mp4",
    pergunta: "...",
    opcoes: [ /* ... */ ]
  },
  final_a: {
    video: "09-final-a.mp4",
    fim: true
  }
};
```

Campos:

| Campo | Obrigatório | Descrição |
|---|---|---|
| `video` | sim | nome do arquivo dentro de `videos/` |
| `pergunta` | sim, exceto se `fim` | texto exibido acima dos botões |
| `opcoes` | sim, exceto se `fim` | lista de `{ texto, vai }` |
| `fim` | não | `true` marca cena final (mostra "Jogar de novo") |

A cena de partida tem o identificador `inicio`.

Por ser um mapa de identificadores, caminhos distintos podem convergir para a
mesma cena sem custo algum — útil se o roteiro reunir as ramificações num
desfecho comum. A estrutura suporta grafo, não apenas árvore.

O conteúdo do fluxograma (quantas cenas, quais escolhas, quais vídeos) será
escrito conforme o roteiro for definido pelo grupo escolar. O formato acima é
o contrato; o preenchimento é trabalho de conteúdo, não de código.

## Fluxo de execução

1. **Tela inicial** — "Toque para começar"
2. **Reprodução** — a cena toca em tela cheia, sem controles visíveis
3. **Escolha** — ao terminar o vídeo, o último quadro congela e os botões
   aparecem sobrepostos
4. **Transição** — o toque carrega a próxima cena e volta ao passo 2
5. **Final** — cena com `fim: true` mostra "Jogar de novo", que retorna ao
   passo 1

A tela inicial é exigência técnica, não decoração. O Chrome bloqueia
reprodução com áudio sem um gesto prévio do usuário. Esse primeiro toque
libera o áudio para toda a sessão e é também o momento de entrar em tela cheia
(`requestFullscreen`), já que essa chamada também exige gesto.

## Layout

Paisagem, vídeo preenchendo a tela.

Na fase de escolha, os botões ocupam a metade inferior, sobre um gradiente
escuro que garante contraste contra qualquer quadro de vídeo. Alvos de toque
grandes: o público é formado por crianças e por adultos lendo de pé, de lado,
a um metro do aparelho.

## Robustez em modo quiosque

O visitante fica sozinho com o tablet. Três comportamentos decorrem disso:

**Recomeçar** — botão discreto e permanente num canto. Quem se perde ou quer
mostrar para outra pessoa não precisa de ajuda.

**Reset por inatividade** — 60 segundos sem toque devolve o jogo à tela
inicial, para que o próximo visitante encontre-o do começo. O temporizador não
corre durante a reprodução de um vídeo, apenas na fase de escolha e na tela de
final.

**Falha de vídeo** — arquivo ausente ou corrompido exibe "Ops, essa cena não
carregou" com botão de voltar ao início. Sem esse tratamento, a falha aparece
como tela preta e o visitante conclui que o projeto quebrou.

**Pré-carregamento** — enquanto a cena atual toca, os vídeos de todas as
escolhas possíveis a partir dela começam a carregar, para que o corte após o
toque seja imediato.

## Verificação

`validar.html` percorre o objeto `cenas` e reporta:

- opção cujo `vai` aponta para cena inexistente
- cena inalcançável a partir de `inicio`
- cena sem `video`, ou sem `opcoes` e sem `fim`
- arquivo de vídeo referenciado que não existe na pasta `videos/`

Roda no navegador do notebook, em um clique.

A justificativa é concreta: o erro mais provável deste projeto não é lógica de
programação, é digitar `vai: "laboratrio"` e descobrir na feira que o botão não
faz nada. O validador transforma esse erro silencioso em erro imediato.

## Teste em hardware real

O jogo deve ser aberto no tablet Android de destino antes do dia da feira,
verificando: reprodução com áudio após o primeiro toque, tela cheia, transição
entre cenas e reset por inatividade.

Esse teste é o único item do projeto com incerteza genuína. O comportamento do
Chrome do Android com `file://` é conhecido o suficiente para fundamentar as
decisões acima, mas não substitui a execução no aparelho real. Se algo falhar,
a alternativa é servir a pasta por um servidor HTTP local no próprio tablet
(aplicativo gratuito de servidor estático), mantendo o jogo inalterado.

## Fora de escopo

Pontuação, salvamento de progresso, música de fundo, animações de transição,
editor visual de fluxograma, suporte a iPad, múltiplos idiomas.

Nada disso é necessário para o objetivo. Cada item pode ser adicionado depois,
se fizer falta na prática.

## Decisões recusadas

**React + Vite.** O resultado no tablet seria idêntico, ao custo de Node,
etapa de build e `node_modules` entre cada alteração e cada teste no aparelho.
Peso sem retorno para uma tela que toca vídeo e mostra botões.

**Twine / H5P.** Ferramentas de narrativa ramificada prontas, com editor
visual. Recusadas porque são fortes em texto e frágeis com vídeo pesado
offline no Android, e porque entregariam o controle do layout em quiosque
(recomeçar, reset, tratamento de falha) a uma ferramenta que não foi feita
para isso.

**Hospedar os vídeos na internet.** Elimina a cópia de arquivos, mas cria
dependência de Wi-Fi no exato momento em que ela é menos confiável.
