# Prof. Yasmin

Site de uma página (HTML, CSS e JS puros, sem framework) para a Prof. Yasmin | Alfabetização e Matemática. Feito por DC Foundry Digital.

## Seções
Hero, Sobre a Yasmin, Aprender, Cartinhas (Português, Matemática, Alfabetização, Psicomotricidade), Online (globo), Alunos pelo mundo (mapa e relógios de fuso), Presencial, Como começar, Como é uma aula (linha do tempo), Depoimentos (post-its), Dúvidas, Contato e rodapé. Botão fixo "Chamar no Insta" em todas as telas.

## TODOs
- WhatsApp: ainda não há número. Veja o comentário TODO na seção de contato do `index.html`.
- Foto da Prof. Yasmin: o espaço em "Sobre a Yasmin" é um placeholder (comentário TODO no HTML).
- Psicomotricidade: ainda NÃO confirmada pela Prof. Yasmin (comentário TODO e `data-pending` na cartinha). Confirmar ou remover antes de produção.
- Mapa: os pins e os "Olá!" são ilustrativos. Trocar pelos países reais quando ela informar.
- Horários e duração das aulas: "a definir" (linha do tempo e relógios).
- Depoimentos: só espaços reservados. Substituir por relatos reais, com autorização das famílias.
- Valores: propositalmente não informados.
- Logo oficial: o selo é uma aproximação feita em CSS.

## Ferramentas
- `tools/globe/`: gera `globe.js` (globo, d3-geo + esbuild) e `map.svg` (mapa plano) a partir do `world-atlas`.
- Área da professora: link externo para https://crm-yasmin-red.vercel.app.

## Performance (v5)
- O globo e desenhado em `<canvas>` (d3-geo, `tools/globe/globe-entry.js`), carregado sob demanda (`globe.js` injetado perto da viewport) e pausado fora da tela e durante o scroll.
- Mapa-mundi pre-renderizado em `map.svg` (geometria simplificada por `tools/globe/simplify.mjs`).
- Sem filtros pesados (blur/drop-shadow) em SVGs grandes; sombras estaticas por mascara; animacoes apenas com transform/opacity.
- Medido com CPU 4x throttle: sem long tasks no estado estavel; revelacao de #online e #mundo com 0 a 2 tarefas de 50 a 59 ms (ruido de headless).
