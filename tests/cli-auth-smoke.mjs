import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const cli = resolve('dist/cli.js');
const run = (command, prompts, expected, interactive = true) => new Promise((done, reject) => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('BILIBILI_')));
  Object.assign(env, { BILIBILI_SESSDATA: 'synthetic-smoke', BILIBILI_BILI_JCT: 'synthetic-csrf', BILIBILI_DEDEUSERID: '10001' });
  const code = `process.stdin.isTTY=${interactive}; globalThis.fetch=async()=>new Response(JSON.stringify({code:0,data:{isLogin:true,mid:10001}}),{headers:{'content-type':'application/json'}}); process.argv=[process.execPath,${JSON.stringify(cli)},...${JSON.stringify(command)}]; await import('node:url').then(({pathToFileURL})=>import(pathToFileURL(${JSON.stringify(cli)}).href));`;
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
await run(['config'], [['SESSDATA:', '\x03']], 130);
await run(['setup'], [['重新登录：', '\r'], ['是否现在安装', '\x03']], 130);
await run(['setup'], [['重新登录：', '\r'], ['是否现在安装', 'n\r']], 0);
await run(['setup', '--non-interactive'], [], 0, false);
await run(['setup'], [], 1, false);
console.log('5 built CLI smoke scenarios passed; only synthetic credentials and stubbed fetch used.');
