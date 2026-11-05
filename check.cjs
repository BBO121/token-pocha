const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const data=JSON.parse(fs.readFileSync('data/archive.json','utf8'));
assert.equal(data.characters.length,93);
const find=s=>data.characters.find(c=>c.name.includes(s));
for(const name of ['리센드','크티','사파리','홍보이모','일러스트레이터'])assert.equal(find(name).gender,'여');
assert.equal(data.characters.filter(c=>/일러스트레이터|일러레/.test(c.name)).length,1);
assert.equal(data.characters.filter(c=>/유튜브 레드|유튜브 프리미엄/.test(c.name)).length,1);
assert.equal(data.characters.filter(c=>/트위터|^X$/.test(c.name)).length,1);
assert.equal(data.staff.filter(s=>s.status==='needs-confirmation').length,2);
const ids=new Set(data.characters.map(c=>c.id));assert.equal(ids.size,93);
for(const r of data.relationships){assert(ids.has(r.from));assert(ids.has(r.to));}
// Exercise the actual schema validator and renderer without launching a second browser.
const source=fs.readFileSync('app.js','utf8').split("document.addEventListener('click'")[0];
const context=vm.createContext({console});vm.runInContext(source,context);
context.sample=structuredClone(data);
vm.runInContext('validate(sample); archive=sample;',context);
for(const view of ['home','characters','relationships','tavern','settings'])assert(vm.runInContext(`${view}()`,context).length>100);
assert.equal(vm.runInContext("escapeHTML('<img onerror=alert(1)>')",context),'&lt;img onerror=alert(1)&gt;');
context.invalid=structuredClone(data);context.invalid.relationships[0].to='missing';assert.throws(()=>vm.runInContext('validate(invalid)',context));
context.invalid=structuredClone(data);context.invalid.characters[0].status='wrong';assert.throws(()=>vm.runInContext('validate(invalid)',context));
console.log('PASS: 93 characters, canon corrections, aliases, references, schema rejection, renderers, HTML escaping.');
