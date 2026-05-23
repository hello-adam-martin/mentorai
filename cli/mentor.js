#!/usr/bin/env node
/* mentor — command-line pipeline for Mentor operating models. Built on mentor-core.js.
   Usage:
     mentor new <name> [outdir]        scaffold a valid starter business folder
     mentor build <answers.json> [out] build a business folder from a saved model (state JSON)
     mentor validate <folder>          check every cross-layer invariant (exit 1 if issues)
     mentor compile <folder> [out]     emit the engine bundle (AGENTS.md + skills + SETUP.md)
     mentor ship <folder>              validate, then compile (one command end-to-end)
     mentor pack <folder>              make the folder deploy-ready in place (AGENTS.md + skills/ + SETUP.md + DEPLOY.md beside the layers)
     mentor map <folder>               print a quick text summary of the model
*/
"use strict";
const fs=require("fs"), path=require("path");
const MC=require(path.join(__dirname,"mentor-core.js"));
try{ MC.setYaml(require("js-yaml")); }
catch(e){ console.error("mentor: missing dependency 'js-yaml'. Run:  npm install js-yaml"); process.exit(1); }

const C={reset:"\x1b[0m",red:"\x1b[31m",green:"\x1b[32m",yellow:"\x1b[33m",dim:"\x1b[2m",bold:"\x1b[1m"};
const ok=s=>console.log(C.green+"✓ "+C.reset+s);
const bad=s=>console.log(C.red+"✗ "+C.reset+s);
const die=s=>{console.error(C.red+"mentor: "+s+C.reset);process.exit(1);};

function walk(dir,acc=[],rel=""){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name), r=rel?rel+"/"+e.name:e.name;
    if(e.isDirectory()) walk(p,acc,r);
    else if(e.name.toLowerCase().endsWith(".md")) acc.push({path:r,text:fs.readFileSync(p,"utf8")});
  }
  return acc;
}
function readFolder(folder){
  if(!fs.existsSync(folder)) die("folder not found: "+folder);
  const arr=walk(folder);
  if(!arr.length) die("no .md files in "+folder);
  return MC.buildTree(arr);
}
function writeMap(outdir,map){
  let n=0;
  for(const [p,c] of Object.entries(map)){ const out=path.join(outdir,p); fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,c); n++; }
  return n;
}
// reference docs + MissionControl to embed into a generated business (if present beside the CLI)
const REPO_ROOT=path.join(__dirname,"..");   // mentor.js lives in cli/; repo root is its parent
function gatherEmbed(base){
  const embed={};
  // [key inside the generated business] -> [source path relative to the repo root]
  const docs=[
    ["_meta/SpecFormat.md","_meta/SpecFormat.md"],
    ["_meta/EngineAdapters.md","_meta/EngineAdapters.md"],
    ["_meta/Guardrails.md","_meta/Guardrails.md"],
    ["_meta/Defaults.md","_meta/Defaults.md"],
    ["_meta/LaunchPrompt.md","_meta/LaunchPrompt.md"],
    ["_meta/Playbook.md","_meta/Playbook.md"],
    ["MissionControl.html","app/MissionControl.html"],
  ];
  for(const [key,src] of docs){ const p=path.join(base,src); if(fs.existsSync(p)) embed[key]=fs.readFileSync(p,"utf8"); }
  return embed;
}
function seedState(name){
  const D=MC.DEFAULTS;
  return {
    business:{name,engine_adapter:""},
    strategic:{mission:"# replace — one north-star sentence",tie_breaker:"escalate",tie_margin:0.05,objectives:[
      {name:"Objective One",description:"# replace",weight:0.34,targets:[{metric:"metric",operator:">=",value:0,unit:""}],guidance:""},
      {name:"Objective Two",description:"# replace",weight:0.33,targets:[{metric:"metric",operator:">=",value:0,unit:""}],guidance:""},
      {name:"Objective Three",description:"# replace",weight:0.33,targets:[{metric:"metric",operator:">=",value:0,unit:""}],guidance:""}
    ]},
    governance:{
      approvers:[{name:"Owner",role:"Owner",channels:["email"],can_approve:"all"}],
      actions:[
        {name:"Example Auto Action",description:"# replace",tier:"auto",serves:[0],domains:"Operations",conditions:"",approver:0,escalates_to:-1,max_percent:"",max_cost:"",ccy:""},
        {name:"Example Approve Action",description:"# replace",tier:"approve",serves:[1],domains:"Operations",conditions:"",approver:0,escalates_to:-1,max_percent:"",max_cost:"",ccy:""}
      ],
      hard_limits:D.hard_limits,escalation:D.escalation,notifications:D.notifications,audit:D.audit
    },
    objects:{types:[{name:"Customer",key:"customer_id",fields:[{name:"name",type:"text"}],relationships:[],states:"new, active"}]},
    domain:{agents:[{name:"Example Agent",domain:"Operations",purpose:"# replace",actions:[0],objects:[0]}]},
    human:{operators:[{name:"Owner",role:"Owner",fulfils:[0],channels:["email"],handles:"approvals",availability:""}]},
    learning:{patterns:[],predictions:[],simulations:[]}
  };
}

const [cmd,...rest]=process.argv.slice(2);
function usage(){console.log(fs.readFileSync(__filename,"utf8").split("*/")[0].split("Usage:")[1].replace(/\n\s*$/,""));}

if(cmd==="new"){
  const name=rest[0]; if(!name) die("usage: mentor new <name> [outdir]");
  const outdir=rest[1]||".";
  const folder=MC.buildBusinessFolder(seedState(name),{embed:gatherEmbed(REPO_ROOT)});
  const n=writeMap(outdir,folder);
  ok(`scaffolded "${name}" → ${path.join(outdir,MC.slug(name)||"business")}/ (${n} files)`);
  console.log(C.dim+"   edit the # replace values, then:  mentor ship "+path.join(outdir,MC.slug(name)||"business")+C.reset);
}
else if(cmd==="build"){
  const ans=rest[0]; if(!ans) die("usage: mentor build <answers.json> [outdir]");
  const outdir=rest[1]||".";
  let state; try{ state=JSON.parse(fs.readFileSync(ans,"utf8")); }catch(e){ die("can't read/parse "+ans+": "+e.message); }
  const folder=MC.buildBusinessFolder(state,{embed:gatherEmbed(REPO_ROOT)});
  const n=writeMap(outdir,folder);
  const warns=MC.validateState(state);
  ok(`built "${state.business&&state.business.name||"business"}" → ${outdir}/ (${n} files)`);
  if(warns.length){ console.log(C.yellow+"   heads up:"+C.reset); warns.forEach(w=>console.log("   • "+w)); }
}
else if(cmd==="validate"){
  const folder=rest[0]; if(!folder) die("usage: mentor validate <folder>");
  const issues=MC.validate(readFolder(folder));
  if(!issues.length){ ok("valid — all cross-layer invariants pass"); }
  else { bad(`${issues.length} issue(s):`); issues.forEach(i=>console.log("   • "+i)); process.exit(1); }
}
else if(cmd==="compile"){
  const folder=rest[0]; if(!folder) die("usage: mentor compile <folder> [outdir]");
  const outdir=rest[1]||path.join(folder,"_compiled");
  const res=MC.compile(readFolder(folder));
  const n=writeMap(outdir,res.files);
  ok(`compiled → ${outdir}/ (${n} files: AGENTS.md + ${res.summary.agents} skill(s) + SETUP.md)`);
}
else if(cmd==="ship"){
  const folder=rest[0]; if(!folder) die("usage: mentor ship <folder>");
  const tpl=readFolder(folder);
  const issues=MC.validate(tpl);
  if(issues.length){ bad(`${issues.length} issue(s) — fix before shipping:`); issues.forEach(i=>console.log("   • "+i)); process.exit(1); }
  ok("valid");
  const outdir=path.join(folder,"_compiled");
  const res=MC.compile(tpl);
  const n=writeMap(outdir,res.files);
  ok(`compiled → ${outdir}/ (${n} files)`);
  console.log(C.bold+"shipped."+C.reset+C.dim+" load _compiled/AGENTS.md as your engine context file."+C.reset);
}
else if(cmd==="pack"){
  const folder=rest[0]; if(!folder) die("usage: mentor pack <folder>");
  const tpl=readFolder(folder);
  const res=MC.compile(tpl);
  const bizDir=path.basename(path.resolve(folder));
  let n=0;
  for(const [p,c] of Object.entries(res.files)){ const out=path.join(folder,p); fs.mkdirSync(path.dirname(out),{recursive:true}); fs.writeFileSync(out,c); n++; }
  fs.writeFileSync(path.join(folder,"DEPLOY.md"), MC.deployReadme(res,bizDir)); n++;
  ok(`packed ${bizDir} — wrote AGENTS.md + ${res.summary.agents} skill(s) + SETUP.md + DEPLOY.md into ${folder}/ (${n} files).`);
  console.log(C.dim+"   it's deploy-ready: start your engine inside the folder."+C.reset);
}
else if(cmd==="map"){
  const folder=rest[0]; if(!folder) die("usage: mentor map <folder>");
  const tpl=readFolder(folder);
  const all=MC.allFms(tpl).filter(d=>d&&typeof d==="object");
  const count=t=>all.filter(d=>d.mentor_node===t).length;
  const biz=all.find(d=>d.mentor==="business");
  console.log(C.bold+(biz&&biz.name||"Mentor model")+C.reset);
  console.log(`  objectives: ${count("objective")} · actions: ${count("action")} · approvers: ${count("approver")}`);
  console.log(`  object types: ${count("object_type")} · agents: ${count("agent")} · operators: ${count("operator")}`);
  console.log(`  learning: ${count("pattern")} pattern(s), ${count("prediction")} prediction(s), ${count("simulation")} simulation(s)`);
  const issues=MC.validate(tpl);
  console.log(issues.length? C.red+`  validation: ${issues.length} issue(s)`+C.reset : C.green+"  validation: VALID"+C.reset);
}
else { console.log("mentor — pipeline for Mentor operating models\n\nUsage:\n  mentor new <name> [outdir]\n  mentor build <answers.json> [outdir]\n  mentor validate <folder>\n  mentor compile <folder> [outdir]\n  mentor ship <folder>\n  mentor pack <folder>\n  mentor map <folder>"); if(cmd&&cmd!=="help"&&cmd!=="-h"&&cmd!=="--help") process.exit(1); }
