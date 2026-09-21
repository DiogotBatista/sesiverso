import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const codigo = html.match(/<script id="jogo-core">([\s\S]*?)<\/script>/)?.[1];
assert.ok(codigo, 'index.html deve expor o script jogo-core');

const contexto = { window: {}, structuredClone };
vm.createContext(contexto);
vm.runInContext(codigo, contexto);

const { decisoes, validarDados } = contexto.window.jogo;
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

console.log('7 verificações passaram');
