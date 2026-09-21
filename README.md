# Sesiverso

MVP online de uma cidade criada a partir de cinco escolhas em vídeo.

## Executar localmente

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8000/`. O validador fica em `/validar.html` e os testes no navegador em `/tests/jogo.html`. A verificação automatizada, sem dependências, roda com:

```bash
node tests/jogo.mjs
```

## Pontos de decisão do vídeo principal

Os tempos foram localizados quadro a quadro no vídeo de 89,531667 segundos e devem ser conferidos pelo áudio no player de validação antes da publicação.

| Ordem | Tema | Pausa | Retomada |
|---|---|---:|---:|
| 1 | Áreas verdes | 62,5 s | 67,9 s |
| 2 | Polos industriais | 67,9 s | 73,3 s |
| 3 | Transporte | 73,3 s | 78,8 s |
| 4 | Lixo | 78,8 s | 84,2 s |
| 5 | Saneamento básico | 84,2 s | 89,4 s |

As decisões e os caminhos dos vídeos ficam no objeto `decisoes` de `index.html`. Preserve os nomes reais dos arquivos ao editar.

## Publicação do MVP

URL de aprovação: <https://sesiverso-cidade-interativa.diogotbatista.chatgpt.site>

- Acesso: privado, restrito ao proprietário durante a aprovação.
- Acervo: 11 arquivos MP4, aproximadamente 21,8 MB, todos com vídeo H.264 e áudio AAC estéreo.
- Principal: 89,531667 s, 1024 × 576.
- Verificação automatizada: `node tests/jogo.mjs`.
- Verificação de conteúdo: `/validar.html` no servidor local.
- Pendente: teste do link publicado em celular real, incluindo áudio, retrato/paisagem, cinco escolhas, sequência final e recuperação de rede.

A versão offline para a feira permanece fora deste MVP.

O histórico técnico completo da implementação e da publicação está em [`docs/implementation/2026-09-20-mvp-online-relatorio.md`](docs/implementation/2026-09-20-mvp-online-relatorio.md).
