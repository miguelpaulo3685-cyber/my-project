const { chromium } = require('playwright'); const {spawn}=require('child_process');
const [,,html,out,mode]=process.argv; const FPS=30;
(async()=>{
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto('file://'+html); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(800);
 if(mode==='snap'){ const ts=process.argv.slice(5).map(Number); for(const t of ts){await p.evaluate(t=>render(t),t); await p.screenshot({path:`${out}/snap-${t}.jpg`,quality:80});}
   await b.close(); return; }
 const dur=await p.evaluate(()=>DUR); const n=Math.round(dur*FPS);
 const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate',String(FPS),'-c:v','mjpeg','-i','-','-c:v','libx264','-pix_fmt','yuv420p','-crf','18','-preset','medium','-movflags','+faststart',out],{stdio:['pipe','inherit','inherit']});
 for(let i=0;i<n;i++){ await p.evaluate(t=>render(t),i/FPS); const buf=await p.screenshot({type:'jpeg',quality:92}); if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r)); }
 ff.stdin.end(); await new Promise(r=>ff.on('close',r)); await b.close(); console.log('ok',n,'quadros');
})();
