# Créditos e licenças

## Professora 3D (`assets/prof-yasmin-3d.vrm`, `assets/prof3d-poster.webp`)
- Modelo: **Victoria Rubin** (ヴィクトリア・ルービン, "AvatarSample_G"), amostra oficial das versões beta/alpha do VRoid Studio.
- Autor: VRoid Project (pixiv Inc.).
- Fonte do arquivo: https://opengameart.org/content/vroid-studio-cc0-models (`avatarsample_g.zip`), publicado como **CC0** (modelos das versões antigas do VRoid Studio liberados pela VRoid em CC0; ver também https://vroid.pixiv.help/hc/en-us/articles/4402614652569).
- Licença gravada pela própria VRoid Project nos metadados do VRM: uso por qualquer pessoa, uso comercial (empresa e pessoa física), redistribuição e modificação permitidas, crédito não obrigatório (https://hub.vroid.com/license?allowed_to_use_user=everyone&characterization_allowed_user=everyone&corporate_commercial_use=allow&credit=unnecessary&modification=allow&personal_commercial_use=profit&redistribution=allow&sexual_expression=allow&version=1&violent_expression=allow).
- Modificações feitas pela DC Foundry Digital: texturas reduzidas/recomprimidas (15,3 MB para 5,7 MB) e física de saia/mangas mais rígida. Animação 100% procedural no código (sem arquivos de animação de terceiros).

## Bibliotecas (embutidas em `prof3d.js`)
- three.js r170, licença MIT, https://github.com/mrdoob/three.js
- @pixiv/three-vrm 3.5, licença MIT, https://github.com/pixiv/three-vrm

Para regerar `prof3d.js`: `cd tools/prof3d && npm i && node build.mjs`.
