import { spawn } from 'node:child_process';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
const cli = resolve('dist/cli.js');
const smokeHome = mkdtempSync(join(tmpdir(), 'bilibili-cli-smoke-'));
const run = (command, prompts, expected, interactive = true, qrStage) => new Promise((done, reject) => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('BILIBILI_')));
  Object.assign(env, { BILIBILI_SESSDATA: 'synthetic-smoke', BILIBILI_BILI_JCT: 'synthetic-csrf', BILIBILI_DEDEUSERID: '10001' });
  Object.assign(env, { HOME: smokeHome, USERPROFILE: smokeHome });
  const code = `
    process.stdin.isTTY=${interactive};
    const qrStage=${JSON.stringify(qrStage)};
    if (qrStage) { process.stdout.isTTY=true; process.stdout.columns=120; process.stdout.rows=60; }
    globalThis.fetch=async(url, options)=>{
      if (String(url).includes('/nav')) return new Response(JSON.stringify({code:0,data:{isLogin:true,mid:10001}}));
      if (!qrStage) process.exit(99); // QR must never be acquired in status/non-TTY paths.
      if ((qrStage==='generate' && String(url).endsWith('/generate')) || String(url).includes('/poll?')) {
        process.emit('SIGINT');
        if (!options.signal.aborted) process.exit(98);
      }
      return new Response(JSON.stringify({code:0,data:{url:'https://account.bilibili.com/h5/account-h5/auth/scan-web?auth_code=synthetic',qrcode_key:'synthetic-key'}}));
    };
    process.argv=[process.execPath,${JSON.stringify(cli)},...${JSON.stringify(command)}];
    await import('node:url').then(({pathToFileURL})=>import(pathToFileURL(${JSON.stringify(cli)}).href));
  `;
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], { env, stdio: ['pipe','pipe','pipe'] });
  let output = ''; let index = 0; if (!prompts.length) child.stdin.end();
  const timer = setTimeout(() => { child.kill(); reject(new Error('smoke timeout: ' + command.join(' ') + ' ' + output)); }, 10000);
  child.stdout.on('data', data => {
    output += data;
    if (index < prompts.length && output.includes(prompts[index][0])) {
      child.stdin.write(prompts[index++][1]); if (index === prompts.length) child.stdin.end();
    }
  });
  child.stderr.on('data', data => { output += data; });
  child.on('error', reject);
  child.on('exit', status => {
    clearTimeout(timer);
    try {
      assert.equal(status, expected);
      assert.equal(index, prompts.length);
      assert.ok(!output.includes('synthetic-smoke'));
      if (expected === 130) assert.ok(!output.includes('正在安装 ASR'));
      done();
    } catch (error) { reject(error); }
  });
});
try {
await run(['config'], [['SESSDATA:', '\x03']], 130);
await run(['setup'], [['重新登录：', '\r'], ['是否现在安装', '\x03']], 130);
await run(['setup'], [['重新登录：', '\r'], ['是否现在安装', 'n\r']], 0);
await run(['setup', '--non-interactive'], [], 0, false);
await run(['setup'], [], 1, false);
const qrPrompts = [['重新登录：', '2\r'], ['输入 y 继续', 'y\r'], ['手动 Cookie：', '\r']];
await run(['setup'], [...qrPrompts, ['r. 重新生成二维码', '\r']], 1);
await run(['setup'], qrPrompts, 130, true, 'generate');
await run(['setup'], qrPrompts, 130, true, 'poll');
console.log('8 built CLI smoke scenarios passed; only synthetic credentials and stubbed fetch used.');
} finally {
  rmSync(smokeHome, { recursive: true, force: true });
}
