const {chromium}=require(process.env.TOKEN_POCHA_PLAYWRIGHT||'playwright');const assert=require('node:assert/strict');const fs=require('fs');
fs.mkdirSync('test-results',{recursive:true});
const preview=require('node:child_process').spawn(process.execPath,[require('node:path').join(__dirname,'server.cjs')],{env:{...process.env,PORT:'4175'},stdio:'ignore',windowsHide:true});process.on('exit',()=>preview.kill());
(async()=>{await new Promise(r=>setTimeout(r,600));const browser=await chromium.launch({headless:true,channel:"chrome"});const page=await browser.newPage({viewport:{width:1280,height:850}});const errors=[];page.on('pageerror',x=>errors.push(x.message));const base=process.env.TOKEN_POCHA_BASE_URL||'http://127.0.0.1:4175/';await page.goto(base);await page.locator('.home-intro').waitFor();assert.equal(await page.locator('h1').innerText(),'내 머릿속 어딘가, 작은 포차 하나.');assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).fontSize),'13px');
assert.equal(await page.locator('.home-drawer').count(),7);assert.equal(await page.locator('.home-stat').count(),4);assert.equal(await page.locator('.home-person').count(),3);assert.equal(await page.locator('.hero').count(),0);
for(const link of await page.locator('.home-drawer').all()){const href=await link.getAttribute('href');assert(href.startsWith('index.html#'));}

await page.goto(base+'#characters');await page.locator('.directory-group').first().waitFor();assert.equal(await page.locator('.directory-group').count(),12);await page.locator('#search').fill('Internet Explorer');assert.equal(await page.locator('.character-row').count(),1);await page.locator('.character-row').click();await page.waitForURL('**/character.html?id=c001');assert((await page.locator('.profile-box').innerText()).includes('Internet Explorer'));await page.reload();await page.locator('.profile-box').waitFor();await page.locator('nav[aria-label="주 메뉴"] a').filter({hasText:'캐릭터 도감'}).click();await page.waitForURL('**/index.html#characters');await page.goto(base+'character.html?id=c001');await page.locator('.profile-box').waitFor();await page.locator('.back-link').click();await page.waitForURL('**/index.html#characters');
await page.goto(base+'index.html#relationships');await page.locator('#relation-person').selectOption('c022');await page.locator('[data-center="c023"]').click();assert.equal(await page.locator('#relation-person').inputValue(),'c023');await page.locator('#relation-search').fill('Internet Explorer');assert.equal(await page.locator('#relation-person option').count(),1);await page.locator('#relation-person').selectOption('c001');assert.equal(await page.locator('#relation-person').inputValue(),'c001');
await page.goto(base+'index.html#families');await page.locator('[data-family="g8"]').click();await page.locator('.fixed-graph svg').waitFor();
await page.goto(base+'index.html#episodes');await page.locator('[data-episode]').first().click();assert(await page.locator('#episode-dialog').evaluate(el=>el.open));assert.equal(await page.locator('.episode-scene').count(),3);
assert.equal(await page.locator('.dialogue').first().evaluate(el=>getComputedStyle(el).borderBottomWidth),'0px');
assert.equal(await page.locator('.dialogue p').first().evaluate(el=>getComputedStyle(el).display),'inline');assert.equal(await page.locator('[data-episode]').count(),181);await page.keyboard.press('Escape');assert.equal(await page.locator('#episode-dialog').evaluate(el=>el.open),false);await page.locator('[data-episode]').first().focus();await page.keyboard.press('Enter');await page.locator('#episode-close').click();assert.equal(await page.locator('[data-episode]').first().evaluate(el=>el===document.activeElement),true);await page.locator('[data-episode]').first().click();await page.mouse.click(3,3);assert.equal(await page.locator('#episode-dialog').evaluate(el=>el.open),false);
const allEpisodes=JSON.parse(fs.readFileSync('data/archive.json','utf8')).episodes;
for(const [index,episode] of allEpisodes.entries()){
 await page.locator('[data-episode]').nth(index).click();
 assert.equal(await page.locator('#episode-title').innerText(),episode.title);
 assert((await page.locator('#episode-content .subtitle').innerText()).includes('원문 메시지 '+episode.sourceMessage));
 const displayed=await page.locator('#episode-content .dialogue, #episode-content .narration, #episode-content .episode-scene').allTextContents();
 assert.deepEqual(displayed,episode.body.split('\n').map(line=>/^### 장면 \d+$/.test(line)?line.slice(4):line),episode.id);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#episode-dialog').evaluate(el=>el.open),false);
}
const longest=allEpisodes.reduce((best,x,i)=>x.body.length>allEpisodes[best].body.length?i:best,0);
for(const width of [320,390,768,1280]){
 await page.setViewportSize({width,height:650});
 await page.locator('[data-episode]').nth(longest).click();
 assert(await page.locator('#episode-dialog').evaluate(el=>el.scrollHeight>el.clientHeight));
 await page.locator('#episode-dialog').evaluate(el=>el.scrollTop=el.scrollHeight);
 assert(await page.locator('#episode-dialog').evaluate(el=>el.scrollTop+el.clientHeight>=el.scrollHeight-2));
 assert(await page.locator('#episode-close').isVisible());
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert(await page.locator('#episode-dialog').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
 await page.screenshot({path:'test-results/episode-'+width+'.png'});
 await page.locator('#episode-close').click();
 await page.locator('[data-episode]').nth(longest).click();
 assert.equal(await page.locator('#episode-dialog').evaluate(el=>el.scrollTop),0);
 await page.mouse.click(1,1);
 assert.equal(await page.locator('#episode-dialog').evaluate(el=>el.open),false);
}
await page.setViewportSize({width:1280,height:850});
await page.goto(base+'index.html#chronology');await page.locator('[data-time-filter="person"]').selectOption('c087');assert.equal(await page.locator('.timeline-entry').count(),10);await page.locator('[data-time-filter="kind"]').selectOption('fiction');assert.equal(await page.locator('.timeline-entry').count(),0);
for(const tab of ['intro','counter','menu','regulars','stories']){await page.goto(base+'index.html#tavern/'+tab);await page.locator('.place-page').waitFor();if(tab==='stories')assert.equal(await page.locator('[data-episode]').count(),181);assert.equal(await page.locator('.grid').count(),0);}
await page.goto(base+'index.html#settings');await page.locator('#editor').waitFor();const original=JSON.parse(await page.locator('#editor').inputValue());original.title='검증 저장';await page.locator('#editor').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));},JSON.stringify(original,null,2));await page.locator('#save').click();await page.reload();await page.locator('#editor').waitFor();assert.equal(JSON.parse(await page.locator('#editor').inputValue()).title,'검증 저장');await page.evaluate(()=>localStorage.clear());
await page.goto(base+'character.html?id=missing');await page.getByRole('heading',{name:'캐릭터를 찾을 수 없어요'}).waitFor();
for(const width of [320,390,768,1280]){await page.setViewportSize({width,height:850});for(const route of ['#home','#characters','#relationships','#families','#episodes','#tavern/counter','#chronology','character.html?id=c046']){await page.goto(base+(route.startsWith('#')?'index.html'+route:route));await page.locator('h1').waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),width+' '+route+' overflow');} }
await page.setViewportSize({width:1280,height:850});await page.goto(base+'index.html#home');await page.locator('.home-drawers').waitFor();await page.screenshot({path:'test-results/verification-desktop.png',fullPage:false});await page.setViewportSize({width:390,height:850});await page.goto(base+'index.html#home');await page.locator('.home-drawers').waitFor();await page.screenshot({path:'test-results/verification-mobile.png',fullPage:true});
assert.deepEqual(errors,[]);assert.equal((await page.request.get(base+'.git/config')).status(),404);assert.equal((await page.request.get(base+'character.html?id=c001')).status(),200);console.log('PASS: browser desktop/mobile, 12 directory groups, search, wiki direct/reload, center graph, groups, modal Escape/X/backdrop/focus, chronology filters, 5 tavern sections, local storage, 404, no page errors or viewport overflow.');await browser.close();preview.kill();})().catch(e=>{console.error(e);process.exit(1)});




