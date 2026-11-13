import fs from 'fs';
import * as topojson from 'topojson-client';
import { geoCentroid } from 'd3-geo';
const topo = JSON.parse(fs.readFileSync('node_modules/world-atlas/countries-110m.json'));
const countries = topojson.feature(topo, topo.objects.countries).features;
const geoms = topo.objects.countries.geometries;
function group(f){
  const name=(f.properties&&f.properties.name)||'';
  if(name==='Antarctica') return null;
  if(name==='Brazil') return 'br';
  const [lon,lat]=geoCentroid(f);
  if(lon<-30 && lat>=12) return 'na';
  if(lon<-30) return 'sa';
  if(lon>=110 && lat<-8) return 'oc';
  if(name==='Australia'||name==='New Zealand'||name==='Papua New Guinea'||name==='Fiji') return 'oc';
  if(lon>=-25 && lon<=45 && lat>=36) return 'eu';
  if(name==='Russia') return 'as';
  if(lon>=-20 && lon<=52 && lat<36 && lat>-36 && !(lon>34&&lat>12)) return 'af';
  return 'as';
}
const groups={};
countries.forEach((f,i)=>{const g=group(f); if(!g) return; (groups[g]=groups[g]||[]).push(geoms[i]);});
const out={fills:{}};
const r=(n)=>Math.round(n*10)/10;
function round(c){return Array.isArray(c[0])?c.map(round):[r(c[0]),r(c[1])];}
for(const g in groups){
  const m=topojson.merge(topo,groups[g]);
  out.fills[g]={type:m.type,coordinates:round(m.coordinates)};
}
const mesh=topojson.mesh(topo,topo.objects.countries,(a,b)=>a!==b);
out.borders={type:mesh.type,coordinates:round(mesh.coordinates)};
const bz=countries.find(f=>f.properties.name==='Brazil');
out.brazil=geoCentroid(bz);
fs.writeFileSync('data.json',JSON.stringify(out));
console.log(Object.keys(groups).map(g=>g+':'+groups[g].length).join(' '), fs.statSync('data.json').size, out.brazil);
