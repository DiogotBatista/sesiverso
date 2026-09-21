import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const codigo = html.match(/<script id="jogo-core">([\s\S]*?)<\/script>/)?.[1];
assert.ok(codigo, 'index.html deve expor o script jogo-core');

function carregarJogo(play = () => Promise.resolve()) {
  const elementos = new Map();
  const elemento = id => {
    if (!elementos.has(id)) {
      const eventos = new Map();
      elementos.set(id, {
      id, hidden: true, textContent: '', value: '', src: '', currentTime: 0,
      muted: false, playsInline: false, dataset: {},
      set innerHTML(_) { throw new Error('innerHTML não é permitido'); },
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener(tipo, fn) { eventos.set(tipo, [...(eventos.get(tipo) || []), fn]); },
      removeEventListener(tipo, fn) { eventos.set(tipo, (eventos.get(tipo) || []).filter(item => item !== fn)); },
      dispatch(tipo) { for (const fn of eventos.get(tipo) || []) fn({ type: tipo, preventDefault() {} }); },
      setAttribute() {},
      removeAttribute(nome) { if (nome === 'src') this.src = ''; },
      play, pause() {}, load() {}, focus() {}
      });
    }
    return elementos.get(id);
  };
  const document = { getElementById: elemento, querySelectorAll: () => [], addEventListener() {} };
  const contexto = { window: {}, document, structuredClone, setTimeout: () => 1, clearTimeout() {}, Date };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  return { jogo: contexto.window.jogo, elemento };
}

const { jogo, elemento } = carregarJogo();

const { decisoes, validarDados } = jogo;
const validar = alteracao => {
  const dados = structuredClone(decisoes);
  alteracao?.(dados);
  return validarDados(dados, 89.531667);
};

assert.equal(validar().length, 0, 'o acervo configurado deve ser válido');
assert.ok(validar(d => { d[0].retomaEm = d[0].pausaEm; }).length, 'rejeita intervalo vazio');
assert.ok(validar(d => { d[1].id = d[0].id; }).length, 'rejeita identificador repetido');
assert.ok(validar(d => { d[0].opcoes.pop(); }).length, 'rejeita decisão sem duas opções');
assert.ok(validar(d => { d[0].pausaEm = Number.NaN; }).length, 'rejeita tempo não finito');
assert.ok(validar(d => { d[4].retomaEm = 90; }).length, 'rejeita tempo após o vídeo');
assert.ok(validar(d => { d[1].pausaEm = d[0].retomaEm - 0.1; }).length, 'rejeita intervalos sobrepostos');

const { estado, iniciar, verificarPausa, escolher } = jogo;
assert.equal(iniciar('   '), false, 'nome vazio não inicia');
assert.equal(iniciar('x'.repeat(61)), false, 'nome acima do limite não inicia');
assert.equal(iniciar('  Cidade Águas  '), true, 'nome válido inicia');
assert.equal(estado.nome, 'Cidade Águas', 'normaliza espaços do nome');
assert.equal(elemento('cidade-atual').textContent, 'Cidade Águas', 'renderiza o nome como texto');
assert.equal(estado.fase, 'principal', 'inicia o vídeo principal');
verificarPausa(decisoes[0].pausaEm + 0.3);
assert.equal(estado.fase, 'escolha', 'salto de tempo dispara a escolha');
escolher(0);
escolher(1);
assert.equal(estado.escolhas.length, 1, 'dois toques registram uma única escolha');
assert.equal(estado.escolhas[0].video, decisoes[0].opcoes[0].video, 'registra a opção tocada');
assert.equal(elemento('player').currentTime, decisoes[0].retomaEm, 'retoma depois da tela de escolha');
assert.equal(elemento('previa-0').src, '', 'interrompe e libera a primeira prévia');

const malicioso = '<img src=x onerror=alert(1)>';
const outro = carregarJogo();
assert.equal(outro.jogo.iniciar(malicioso), true, 'aceita caracteres de marcação no nome');
assert.equal(outro.elemento('cidade-atual').textContent, malicioso, 'exibe marcação como texto literal');

const bloqueioAutoplay = new Error('autoplay bloqueado');
bloqueioAutoplay.name = 'NotAllowedError';
const bloqueado = carregarJogo(() => Promise.reject(bloqueioAutoplay));
bloqueado.jogo.iniciar('Cidade sem autoplay');
await Promise.resolve();
await Promise.resolve();
assert.equal(bloqueado.elemento('continuar').hidden, false, 'oferece continuação quando autoplay é bloqueado');

const final = carregarJogo();
final.jogo.iniciar('Cidade Teste');
for (let i = 0; i < final.jogo.decisoes.length; i += 1) {
  final.jogo.verificarPausa(final.jogo.decisoes[i].pausaEm + 0.1);
  final.jogo.escolher(i % 2);
}
final.jogo.encerrarVideo();
assert.equal(final.jogo.estado.fase, 'resultado', 'inicia o resultado depois do principal');
assert.equal(final.elemento('titulo-resultado').textContent, 'Aqui está a cidade Cidade Teste', 'mostra o nome no resultado');
assert.ok(final.jogo.estado.escolhas.every((opcao, i) =>
  opcao.video === final.jogo.decisoes[i].opcoes[i % 2].video), 'preserva a ordem das escolhas');
for (let i = 0; i < 5; i += 1) final.jogo.encerrarVideo();
assert.equal(final.jogo.estado.fase, 'concluido', 'encerra depois dos cinco vídeos');
assert.equal(final.elemento('nova-cidade').hidden, false, 'oferece uma nova cidade ao concluir');
const fimInativo = final.jogo.estado.ultimoToque + 60001;
assert.equal(final.jogo.verificarInatividade(fimInativo), true, 'reinicia resultado concluído inativo');
assert.equal(final.jogo.estado.escolhas.length, 0, 'reinício limpa as escolhas');

const inativo = carregarJogo();
inativo.jogo.iniciar('Cidade Inativa');
inativo.jogo.verificarPausa(inativo.jogo.decisoes[0].pausaEm + 0.1);
const limite = inativo.jogo.estado.ultimoToque + 60001;
assert.equal(inativo.jogo.verificarInatividade(limite), true, 'reinicia escolha inativa');
assert.equal(inativo.jogo.estado.fase, 'inicio', 'volta à tela inicial por inatividade');

const emVideo = carregarJogo();
emVideo.jogo.iniciar('Cidade Ativa');
assert.equal(emVideo.jogo.verificarInatividade(emVideo.jogo.estado.ultimoToque + 60001), false, 'não reinicia durante o vídeo');
emVideo.elemento('player').currentTime = 12;
emVideo.elemento('player').dispatch('error');
assert.equal(emVideo.jogo.estado.erro, true, 'registra falha do vídeo');
assert.equal(emVideo.elemento('status').hidden, false, 'mostra recuperação da falha');
assert.equal(emVideo.jogo.estado.fase, 'principal', 'falha preserva a fase');
emVideo.elemento('tentar-novamente').dispatch('click');
emVideo.elemento('player').dispatch('loadedmetadata');
await Promise.resolve();
assert.equal(emVideo.elemento('player').currentTime, 12, 'tentativa restaura a posição');

const falhaPlay = carregarJogo(() => Promise.reject(new Error('falha de mídia')));
falhaPlay.jogo.iniciar('Cidade com falha');
await Promise.resolve();
await Promise.resolve();
assert.equal(falhaPlay.jogo.estado.erro, true, 'rejeição que não é autoplay vira erro recuperável');

let rejeitarAntiga;
const tardio = carregarJogo(() => new Promise((_, rejeitar) => { rejeitarAntiga = rejeitar; }));
tardio.jogo.iniciar('Cidade Antiga');
tardio.jogo.reiniciar();
const erroAntigo = new Error('bloqueio antigo');
erroAntigo.name = 'NotAllowedError';
rejeitarAntiga(erroAntigo);
await Promise.resolve();
await Promise.resolve();
assert.equal(tardio.elemento('continuar').hidden, true, 'ignora rejeição de uma sessão encerrada');
assert.equal(tardio.jogo.estado.erro, false, 'rejeição antiga não contamina a nova sessão');
tardio.elemento('player').dispatch('error');
assert.equal(tardio.jogo.estado.erro, false, 'evento de mídia sem partida ativa é ignorado');

console.log('43 verificações passaram');
