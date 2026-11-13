import fs from 'fs';
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
const d = JSON.parse(fs.readFileSync('data.json'));
const W=1000,H=520;
const proj = geoNaturalEarth1().fitExtent([[6,6],[W-6,H-6]],{type:'Sphere'});
const path = geoPath(proj).digits?geoPath(proj).digits(1):geoPath(proj);
const out={};
const P=geoPath(proj).digits?geoPath(proj).digits(1):geoPath(proj);
out.sphere=P({type:'Sphere'});
out.grat=P(geoGraticule10());
for(const g in d.fills){ out[g]=P(d.fills[g]); }
const pt=(lon,lat)=>{const [x,y]=proj([lon,lat]);return [+(x/W*100).toFixed(1),+(y/H*100).toFixed(1)];};
out.pins={br:pt(-52,-12),na:pt(-100,40),na2:pt(-80,35),eu:pt(10,48),af:pt(20,2),as:pt(100,30),as2:pt(78,22),oc:pt(135,-25),sa:pt(-70,-30)};
fs.writeFileSync('map.json',JSON.stringify(out));
for(const k in out) console.log(k, typeof out[k]==='string'?out[k].length:out[k]);
