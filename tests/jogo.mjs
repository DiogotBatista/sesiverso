import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const codigo = html.match(/<script id="jogo-core">([\s\S]*?)<\/script>/)?.[1];
assert.ok(codigo, 'index.html deve expor o script jogo-core');

function carregarJogo(play = () => Promise.resolve()) {
  const elementos = new Map();
  const elemento = id => {
    if (!elementos.has(id)) elementos.set(id, {
      id, hidden: true, textContent: '', value: '', src: '', currentTime: 0,
      muted: false, playsInline: false, dataset: {},
      set innerHTML(_) { throw new Error('innerHTML não é permitido'); },
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, removeEventListener() {}, setAttribute() {},
      removeAttribute(nome) { if (nome === 'src') this.src = ''; },
      play, pause() {}, load() {}, focus() {}
    });
    return elementos.get(id);
  };
  const document = { getElementById: elemento, querySelectorAll: () => [], addEventListener() {} };
  const contexto = { window: {}, document, structuredClone, setTimeout, clearTimeout, Date };
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

const bloqueado = carregarJogo(() => Promise.reject(new Error('autoplay bloqueado')));
bloqueado.jogo.iniciar('Cidade sem autoplay');
await Promise.resolve();
await Promise.resolve();
assert.equal(bloqueado.elemento('continuar').hidden, false, 'oferece continuação quando autoplay é bloqueado');

console.log('21 verificações passaram');
