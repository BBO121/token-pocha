// Loopback-only preview. Only the four public assets are served, never .git.
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const files={'/':['index.html','text/html; charset=utf-8'],'/index.html':['index.html','text/html; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/data/archive.json':['data/archive.json','application/json; charset=utf-8']};
const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{try{const asset=files[new URL(req.url,'http://127.0.0.1').pathname];if(!asset||!['GET','HEAD'].includes(req.method)){res.writeHead(404);res.end('Not found');return;}const content=await fs.readFile(path.join(__dirname,asset[0]));res.writeHead(200,{'Content-Type':asset[1],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(req.method==='HEAD'?undefined:content);}catch{res.writeHead(500);res.end('Server error');}});
server.on('error',error=>{console.error(error.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`Token Pocha local preview: http://127.0.0.1:${port}`));
