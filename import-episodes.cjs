const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const manuscript = fs.readFileSync(path.join(__dirname, 'data', 'episode-manuscript.md'), 'utf8').replace(/\r\n/g, '\n');
const headings = [...manuscript.matchAll(/^## (\d{3})\. (.+)$/gm)];
assert.equal(headings.length, 181);
const episodes = headings.map((h, i) => {
  const sourceExcerpt = manuscript.slice(h.index, headings[i + 1]?.index ?? manuscript.length);
  const participants = sourceExcerpt.match(/^\*\*등장인물:\*\* (.+)$/m)[1].split(' · ');
  const sourceMessage = Number(sourceExcerpt.match(/^\*\*출처:\*\* 공유 대화 메시지 (\d+)/m)[1]);
  const body = sourceExcerpt.slice(sourceExcerpt.indexOf('### 장면 1')).replace(/\n+---\n+$/, '').trimEnd();
  assert(body.startsWith('### 장면 1'));
  return {id:'episode-'+h[1], manuscriptNumber:h[1], title:h[2], category:h[2].match(/《([^》]+)》/)?.[1] || '미정', status:'draft', participants, sourceMessage, source:'https://chatgpt.com/share/6aecae8d-af74-83e8-9722-9793bb0d8526', sourceFile:'토큰포차_에피소드_원고집.md', sourceExcerpt, body};
});
assert.equal(new Set(episodes.map(x=>x.id)).size, 181);
assert.equal(new Set(episodes.map(x=>x.sourceMessage)).size, 181);
for(let i=0;i<181;i++) assert.equal(episodes[i].manuscriptNumber, String(i+1).padStart(3,'0'));
const file = path.join(__dirname, 'data/archive.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
// Retain reviewed records byte-for-byte at the object level, including their order.
for(const old of data.episodes) {
  const incoming = episodes.find(x=>x.id===old.id);
  assert(incoming, 'Unknown existing episode: '+old.id);
  assert.equal(incoming.body, old.body);
  assert.equal(incoming.sourceExcerpt, old.sourceExcerpt);
  assert.equal(incoming.title, old.title);
  assert.deepEqual(incoming.participants, old.participants);
  assert.equal(incoming.sourceMessage, old.sourceMessage);
}
if(process.argv.includes('--write')) {
  const existing = new Set(data.episodes.map(x=>x.id));
  data.episodes.push(...episodes.filter(x=>!existing.has(x.id)));
  fs.writeFileSync(file, JSON.stringify(data,null,2)+'\n');
}
assert.equal(data.episodes.length,181);
for(const expected of episodes) {
  const actual = data.episodes.filter(x=>x.id===expected.id);
  assert.equal(actual.length,1);
  for(const key of ['body','sourceExcerpt','title','sourceMessage','manuscriptNumber']) assert.equal(actual[0][key],expected[key]);
  assert.deepEqual(actual[0].participants,expected.participants);
}
console.log('PASS: 181 consecutive unique manuscript entries and source messages; exact titles, participants, excerpts and scene bodies; reviewed episodes retained.');

