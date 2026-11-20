#!/usr/bin/env node
/**
 * Isolated staging smoke test for the Mesa do Mestre auth boundary.
 * Intentionally refuses any URL other than loopback.
 * Creates test users in the staging SQLite. NEVER run against production.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";

const base = process.env.MDM_TEST_BASE_URL || "http://127.0.0.1:3100";
const parsed = new URL(base);
if (!["127.0.0.1", "localhost", "::1"].includes(parsed.hostname) || parsed.protocol !== "http:") {
  throw new Error("Auth smoke test accepts loopback HTTP only.");
}
if (process.env.NODE_ENV === "production") throw new Error("Do not run smoke tests in production environment.");
const generated = randomBytes(7).toString("hex");
const unique = (name) => `v6-${name}-${generated}@invalid.example`;
const strongPassword = randomBytes(24).toString("base64url");

class Client {
  constructor() { this.cookies = new Map(); }
  async request(endpoint, opts={}) {
    const headers = new Headers(opts.headers);
    if (!headers.has("Origin")) headers.set("Origin", base);
    if (this.cookies.size) headers.set("Cookie", [...this.cookies].map(([k,v])=>`${k}=${v}`).join("; "));
    const res = await fetch(base+endpoint,{...opts,headers,redirect:"manual"});
    for(const raw of res.headers.getSetCookie()){
      const match=raw.match(/^([^=;]+)=([^;]*)/);
      if(match) this.cookies.set(match[1],match[2]);
    }
    return res;
  }
  async register(email,preference){
    return this.request("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"Conta de Teste",email,password:strongPassword,preference})});
  }
  async signIn(email, suppliedPassword = strongPassword){
    const csrf=await this.request("/api/auth/csrf");
    assert.equal(csrf.status,200);
    const token=(await csrf.json()).csrfToken;
    const form=new URLSearchParams({csrfToken:token,email,password:suppliedPassword,callbackUrl:base+"/",json:"true"});
    return this.request("/api/auth/callback/credentials",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:form});
  }
}

const anonymous=new Client();
const anonApi=await anonymous.request("/api/rulebook");
assert.equal(anonApi.status,401,"Unauthenticated cannot read legacy campaigns");
const anonWrite=await anonymous.request("/api/rulebook",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"record-recent"})});
assert.equal(anonWrite.status,401,"Unauthenticated cannot write");
assert.equal((await anonymous.request("/api/releases")).status,401);
assert.equal((await anonymous.request("/api/rulebook?view=players")).status,401,"Player data requires login");
assert.equal((await anonymous.request("/api/rulebook?export=1")).status,401,"Exports require login");
const crossSite = await anonymous.request("/api/auth/register",{
  method:"POST",headers:{"Origin":"https://malicious.invalid","Content-Type":"application/json"},
  body:JSON.stringify({email:unique("evil"),name:"Intruder",password:strongPassword,preference:"gm"})
});
assert.equal(crossSite.status,403,"Cross-site registration denied");

const master=new Client(), player=new Client();
const ownerEmail=unique("owner"), playerEmail=unique("player");
assert.equal((await master.register(ownerEmail,"gm")).status,201,"Master registration");
assert.equal((await player.register(playerEmail,"player")).status,201,"Player registration");
assert.equal((await master.register(ownerEmail,"gm")).status,400,"Duplicate email blocked");
const wrong = new Client();
await wrong.signIn(ownerEmail,"definitely-not-the-right-password");
const wrongSession = await (await wrong.request("/api/auth/session")).json();
assert.ok(!wrongSession?.user?.email,"Invalid password creates no session");
for(const [client,email] of [[master,ownerEmail],[player,playerEmail]]){
  const result=await client.signIn(email);
  assert.ok([200,302,303].includes(result.status),`AuthJS sign-in status ${result.status}`);
  const session=await client.request("/api/auth/session");
  const info=await session.json();
  assert.equal(info?.user?.email,email,`Session authenticated ${email}`);
  assert.equal((await client.request("/api/rulebook")).status,403,"Ordinary account blocked from legacy campaigns");
  assert.equal((await client.request("/api/rulebook?export=1")).status,403,"Ordinary account cannot export data");
  assert.equal((await client.request("/api/releases")).status,200,"Changelog accessible");
}

assert.equal((await master.request("/api/releases/read",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({version:"5.1.0"})})).status,200);
const masterRead=await (await master.request("/api/releases")).json();
const playerRead=await (await player.request("/api/releases")).json();
assert.ok(masterRead.read.includes("5.1.0"));
assert.ok(!playerRead.read.includes("5.1.0"),"Read state isolated per account");

const provisioning=path.join(process.cwd(),"scripts","grant-legacy-owner.mjs");
execFileSync(process.execPath,[provisioning,"--email",ownerEmail,"--confirm"],{cwd:process.cwd(),stdio:"pipe"});
const ownerApi=await master.request("/api/rulebook");
assert.equal(ownerApi.status,200,`Provisioned owner API status: ${ownerApi.status}`);
const afterOwner=await player.request("/api/rulebook");
assert.equal(afterOwner.status,403,"Player remains blocked after owner provisioning");
let takeoverBlocked = false;
try {
  execFileSync(process.execPath,[provisioning,"--email",playerEmail,"--confirm"],{cwd:process.cwd(),stdio:"pipe"});
} catch { takeoverBlocked = true; }
assert.ok(takeoverBlocked,"Cannot provision a second legacy owner");
console.log("PASS: anonymous/exports protected; cross-origin rejected; login credentials; non-owner isolated; changelog reads per-user; owner provision; no second owner.");

