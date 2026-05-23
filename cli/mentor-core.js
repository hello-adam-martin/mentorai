/* mentor-core.js — single source of truth for Mentor model logic (canonical; hand-maintained). Used by Mentor Studio (browser, via <script>) and the `mentor` CLI (Node require). Dual-mode: module.exports + window.MentorCore. */

(function(root,factory){if(typeof module==="object"&&module.exports){module.exports=factory();}else{root.MentorCore=factory();}})(typeof self!=="undefined"?self:this,function(){

"use strict";

let YAML=(typeof jsyaml!=="undefined")?jsyaml:null;

function setYaml(y){YAML=y;}

function Y(){if(!YAML&&typeof jsyaml!=="undefined")YAML=jsyaml;if(!YAML)throw new Error("MentorCore: YAML not set — Node: setYaml(require('js-yaml')); browser: load js-yaml first");return YAML;}

const esc=s=>String(s==null?"":s).replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));

const slug=s=>String(s||"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");

const q=s=>'"'+String(s==null?"":s).replace(/\\/g,"\\\\").replace(/"/g,'\\"')+'"';

const DEFAULTS={
  "hard_limits": [
    {
      "rule": "Never move money, issue refunds, or change payouts without approval"
    },
    {
      "rule": "Never share personal or customer data with third parties without approval"
    },
    {
      "rule": "Never make legally binding commitments on the business's behalf without approval"
    },
    {
      "rule": "Never make public or media statements as the business without approval"
    },
    {
      "rule": "Never permanently delete or irreversibly destroy records without approval"
    },
    {
      "rule": "Always disclose that you are an AI when asked"
    }
  ],
  "escalation": [
    {
      "trigger": "Safety, security, or legal emergency",
      "priority": "critical",
      "action": "Notify the responsible human immediately",
      "oqh": true
    },
    {
      "trigger": "An action fails repeatedly (~3x) or two agents disagree",
      "priority": "medium",
      "action": "Stop, log the reasoning, and escalate — do not retry blindly",
      "oqh": false
    }
  ],
  "notifications": {
    "channels": [
      "email"
    ],
    "window": "22:00-07:00",
    "timezone": "UTC",
    "priority": "critical"
  },
  "audit": {
    "retain_days": 365
  }
};

function buildFiles(state){
  const out={};
  const objMeta=state.strategic.objectives.map((o,i)=>({...o,folder:"Objective"+(i+1),id:slug(o.name)||("objective_"+(i+1)),label:o.name||("Objective "+(i+1))}));
  const apprMeta=state.governance.approvers.map((a,i)=>({...a,folder:"Approver"+(i+1),id:slug(a.name)||("approver_"+(i+1))}));
  const actMeta=state.governance.actions.map((a,i)=>({...a,folder:"Action"+(i+1),id:slug(a.name)||("action_"+(i+1))}));

  const s=state.strategic;
  out["1_StrategicLayer/StrategicLayer.md"]=
`---
mentor_layer: strategic
index: 1
status: defined
weighting:
  weights_sum_to: 1.0
  tie_breaker: ${s.tie_breaker}
  tie_margin: ${s.tie_margin}
  governance_supersedes_strategy: true
mission: ${q(s.mission)}
---

# Strategic Layer

What the business is trying to achieve, as weighted, measurable objectives. Weights sum to 1.0.

| objective (folder) | weight | about |
| --- | --- | --- |
${objMeta.map(o=>`| \`${o.folder}\` | ${o.weight} | ${(o.description||"").replace(/\|/g,"\\|")} |`).join("\n")}
`;
  objMeta.forEach(o=>{
    out[`1_StrategicLayer/${o.folder}/${o.folder}.md`]=
`---
mentor_node: objective
layer: strategic
id: ${o.id}
label: ${q(o.label)}
weight: ${o.weight}
targets:
${(o.targets||[]).map(t=>`  - { metric: ${q(t.metric)}, operator: ${q(t.operator)}, value: ${t.value===""?0:t.value}, unit: ${q(t.unit)} }`).join("\n")||"  []"}
guidance: ${q(o.guidance)}
---

# ${o.label}

${o.description||""}

| metric | target |
| --- | --- |
${(o.targets||[]).map(t=>`| ${t.metric||""} | ${t.operator||""} ${t.value===""?0:t.value} ${t.unit||""} |`).join("\n")}
`;
  });

  const g=state.governance;
  out["2_GovernanceLayer/GovernanceLayer.md"]=
`---
mentor_layer: governance
index: 2
status: defined
autonomy_tiers: [auto, recommend, approve]
---

# Governance Layer

What the agent may do alone (auto), propose (recommend), or needs sign-off for (approve), plus the never-do hard limits.
`;
  out["2_GovernanceLayer/AutonomyTiers/AutonomyTiers.md"]=
`---
mentor_node: autonomy_tiers
layer: governance
tiers:
  auto: "Agent acts immediately and logs it."
  recommend: "Agent proposes; acts only on confirmation."
  approve: "Agent may not act until a named approver signs off."
---

# Autonomy Tiers

Every action is pinned to one tier: **auto**, **recommend**, or **approve**.
`;
  out["2_GovernanceLayer/Approvers/Approvers.md"]=
`---
mentor_node: approvers_index
layer: governance
---

# Approvers

| approver (folder) | role |
| --- | --- |
${apprMeta.map(a=>`| \`${a.folder}\` | ${a.role||""} |`).join("\n")}
`;
  apprMeta.forEach(a=>{
    out[`2_GovernanceLayer/Approvers/${a.folder}/${a.folder}.md`]=
`---
mentor_node: approver
layer: governance
id: ${a.id}
name: ${q(a.name)}
role: ${q(a.role)}
channels: [${(a.channels||[]).join(", ")}]
can_approve: [${String(a.can_approve||"all").split(",").map(x=>x.trim()).filter(Boolean).join(", ")}]
---

# ${a.name||a.folder}

Reachable on: ${(a.channels||[]).join(", ")}. Can approve: ${a.can_approve||"all"}.
`;
  });
  out["2_GovernanceLayer/Actions/Actions.md"]=
`---
mentor_node: actions_index
layer: governance
---

# Actions

| action (folder) | tier | serves | approver |
| --- | --- | --- | --- |
${actMeta.map(a=>`| \`${a.folder}\` | ${a.tier} | ${(a.serves||[]).map(oi=>objMeta[oi]&&objMeta[oi].id).filter(Boolean).join(", ")||"—"} | ${a.tier==="approve"?(apprMeta[a.approver]&&apprMeta[a.approver].id||"—"):"—"} |`).join("\n")}
`;
  actMeta.forEach(a=>{
    const serves=(a.serves||[]).map(oi=>objMeta[oi]&&objMeta[oi].id).filter(Boolean);
    const limit=[];if(a.max_percent!=="")limit.push(`max_percent: ${a.max_percent}`);
    if(a.max_cost!=="")limit.push(`max_cost: { amount: ${a.max_cost}, currency: ${q(a.ccy||"NZD")} }`);
    let fm=
`---
mentor_node: action
layer: governance
id: ${a.id}
description: ${q(a.description)}
tier: ${a.tier}
domains: [${(a.domains||"").split(",").map(x=>x.trim()).filter(Boolean).join(", ")}]
serves: [${serves.join(", ")}]
conditions: ${q(a.conditions)}`;
    if(a.tier==="approve"&&apprMeta[a.approver]) fm+=`\napprover: ${apprMeta[a.approver].id}`;
    if(a.escalates_to>=0&&actMeta[a.escalates_to]) fm+=`\nescalates_to: ${actMeta[a.escalates_to].id}`;
    if(limit.length) fm+=`\nlimits: { ${limit.join(", ")} }`;
    fm+=`\n---`;
    out[`2_GovernanceLayer/Actions/${a.folder}/${a.folder}.md`]=
`${fm}

# ${a.name||a.folder}

${a.description||""}

| field | value |
| --- | --- |
| tier | ${a.tier} |
| serves | ${serves.join(", ")||"—"} |
${a.tier==="approve"?`| approver | ${apprMeta[a.approver]&&apprMeta[a.approver].id||"—"} |\n`:""}`;
  });
  out["2_GovernanceLayer/HardLimits/HardLimits.md"]=
`---
mentor_node: hard_limits
layer: governance
hard_limits:
${g.hard_limits.filter(h=>h.rule).map((h,i)=>`  - { id: hard_limit_${i+1}, rule: ${q(h.rule)} }`).join("\n")||"  []"}
---

# Hard Limits

Bright lines — never permitted, regardless of tier or context. Back each with an engine enforcement mechanism.

${g.hard_limits.filter(h=>h.rule).map((h,i)=>`- **hard_limit_${i+1}** — ${h.rule}`).join("\n")}
`;
  out["2_GovernanceLayer/Escalation/Escalation.md"]=
`---
mentor_node: escalation
layer: governance
escalation:
${g.escalation.filter(x=>x.trigger).map((x,i)=>`  - { id: escalation_${i+1}, trigger: ${q(x.trigger)}, priority: ${x.priority}, action: ${q(x.action)}, overrides_quiet_hours: ${!!x.oqh} }`).join("\n")||"  []"}
---

# Escalation

Triggers that override normal tiers to pull a human in fast.

| trigger | priority | breaks quiet hours |
| --- | --- | --- |
${g.escalation.filter(x=>x.trigger).map(x=>`| ${x.trigger} | ${x.priority} | ${x.oqh?"yes":"no"} |`).join("\n")}
`;
  out["2_GovernanceLayer/Notifications/Notifications.md"]=
`---
mentor_node: notifications
layer: governance
default_channels: [${(g.notifications.channels||[]).join(", ")}]
quiet_hours: { window: ${q(g.notifications.window)}, timezone: ${q(g.notifications.timezone)}, only_priority_at_or_above: ${g.notifications.priority} }
---

# Notifications

Default channels: ${(g.notifications.channels||[]).join(", ")}. Quiet hours ${g.notifications.window} ${g.notifications.timezone}; only ${g.notifications.priority} breaks through.
`;
  out["2_GovernanceLayer/Audit/Audit.md"]=
`---
mentor_node: audit
layer: governance
log_all_actions: true
require_reasoning: true
retain_days: ${g.audit.retain_days||365}
human_reviewable: true
---

# Audit

Every action logged with its reasoning, retained ${g.audit.retain_days||365} days, explainable in plain language.
`;

  // ===== Operational Objects (6) =====
  const otMeta=state.objects.types.map((t,i)=>({...t,folder:"ObjectType"+(i+1),id:slug(t.name)||("object_type_"+(i+1)),label:t.name||("Object Type "+(i+1))}));
  if(otMeta.length){
    out["6_OperationalObjects/OperationalObjects.md"]=
`---
mentor_layer: objects
index: 6
status: defined
owns: [object_types]
references: []
---

# Operational Objects Layer

The entity types this business coordinates.

| object type (folder) | key |
| --- | --- |
${otMeta.map(t=>`| \`${t.folder}\` | ${t.key||""} |`).join("\n")}
`;
    otMeta.forEach(t=>{
      const flds=(t.fields||[]).filter(f=>f.name).map(f=>`  - { name: ${q(f.name)}, type: ${q(f.type)} }`).join("\n");
      const rels=(t.relationships||[]).filter(r=>otMeta[r.to]).map(r=>`  - { type: ${r.type}, to: ${otMeta[r.to].id} }`).join("\n");
      const states=(t.states||"").split(",").map(x=>x.trim()).filter(Boolean);
      out[`6_OperationalObjects/${t.folder}/${t.folder}.md`]=
`---
mentor_node: object_type
layer: objects
id: ${t.id}
label: ${q(t.label)}
key: ${q(t.key)}
fields:
${flds||"  []"}
relationships:
${rels||"  []"}
states: [${states.join(", ")}]
history: append_only
---

# ${t.label}

Key: \`${t.key||""}\`. Append-only history; live instances live in the engine's knowledge store.
`;
    });
  }

  // ===== Domain Agents (5) =====
  if(state.domain.agents.some(a=>a.name)){
    const agMeta=state.domain.agents.filter(a=>a.name).map((a,i)=>({...a,folder:"Agent"+(i+1),id:slug(a.name)||("agent_"+(i+1))}));
    out["5_DomainAgents/DomainAgents.md"]=
`---
mentor_layer: domain
index: 5
status: defined
owns: [domains, agents]
references: [actions, object_types]
---

# Domain Agents Layer

Agents grouped into domains; each may only use its allowed Governance actions.

| agent | domain |
| --- | --- |
${agMeta.map(a=>`| \`${a.domain}/${a.folder}\` | ${a.domain} |`).join("\n")}
`;
    ["Operations","Intelligence","Communication"].forEach(dom=>{
      const list=agMeta.filter(a=>a.domain===dom);
      out[`5_DomainAgents/${dom}/${dom}.md`]=
`---
mentor_node: domain
layer: domain
id: ${slug(dom)}
status: defined
---

# ${dom} Domain

| agent (folder) | purpose |
| --- | --- |
${list.map(a=>`| \`${a.folder}\` | ${(a.purpose||"").replace(/\|/g,"\\|")} |`).join("\n")||"| — | — |"}
`;
    });
    agMeta.forEach(a=>{
      const acts=(a.actions||[]).map(k=>actMeta[k]&&actMeta[k].id).filter(Boolean);
      const objs=(a.objects||[]).map(k=>otMeta[k]&&otMeta[k].id).filter(Boolean);
      const role=a.name||a.folder;
      out[`5_DomainAgents/${a.domain}/${a.folder}/${a.folder}.md`]=
`---
mentor_node: agent
layer: domain
id: ${a.id}${a.persona?`\nname: ${q(a.persona)}`:""}
domain: ${slug(a.domain)}
purpose: ${q(a.purpose)}
allowed_actions: [${acts.join(", ")}]
objects: [${objs.join(", ")}]
---

# ${a.persona?`${a.persona} — ${role}`:role}

${a.purpose||""}
`;
    });
  }

  // ===== Human Collaboration (7) =====
  if(state.human.operators.some(o=>o.name)){
    const opMeta=state.human.operators.filter(o=>o.name).map((o,i)=>({...o,folder:"Operator"+(i+1),id:slug(o.name)||("operator_"+(i+1))}));
    out["7_HumanCollaboration/HumanCollaboration.md"]=
`---
mentor_layer: human
index: 7
status: defined
owns: [operators]
references: [approvers]
---

# Human Collaboration Layer

People mapped to Governance approvers.

| operator (folder) | role | fulfils |
| --- | --- | --- |
${opMeta.map(o=>`| \`${o.folder}\` | ${o.role||""} | ${(o.fulfils||[]).map(k=>apprMeta[k]&&apprMeta[k].id).filter(Boolean).join(", ")||"—"} |`).join("\n")}
`;
    opMeta.forEach(o=>{
      const ful=(o.fulfils||[]).map(k=>apprMeta[k]&&apprMeta[k].id).filter(Boolean);
      const handles=(o.handles||"").split(",").map(x=>x.trim()).filter(Boolean);
      out[`7_HumanCollaboration/${o.folder}/${o.folder}.md`]=
`---
mentor_node: operator
layer: human
id: ${o.id}
name: ${q(o.name)}
role: ${q(o.role)}
fulfils_approvers: [${ful.join(", ")}]
channels: [${(o.channels||[]).join(", ")}]
handles: [${handles.map(q).join(", ")}]
availability: ${q(o.availability)}
---

# ${o.name||o.folder}

Role: ${o.role||""}. Reached on: ${(o.channels||[]).join(", ")}.
`;
    });
  }

  // ===== Learning & Simulation (3) =====
  const L=state.learning;
  const pats=L.patterns.filter(p=>p.detects), preds=L.predictions.filter(p=>p.predicts), sims=L.simulations.filter(s=>s.scenario);
  if(pats.length||preds.length||sims.length){
    out["3_LearningLayer/LearningLayer.md"]=
`---
mentor_layer: learning
index: 3
status: defined
owns: [patterns, predictions, simulations]
references: [objectives, actions, object_types]
---

# Learning & Simulation Layer

Patterns watched, predictions made, and simulations scored before acting.
`;
    if(pats.length){
      out["3_LearningLayer/Patterns/Patterns.md"]=`---\nmentor_node: patterns_index\nlayer: learning\n---\n\n# Patterns\n`;
      pats.forEach((p,i)=>{const w=(p.watches||[]).map(k=>otMeta[k]&&otMeta[k].id).filter(Boolean);
        out[`3_LearningLayer/Patterns/Pattern${i+1}/Pattern${i+1}.md`]=
`---
mentor_node: pattern
layer: learning
id: pattern_${i+1}
detects: ${q(p.detects)}
watches: [${w.join(", ")}]
suggests: ${q(p.suggests)}
---

# Pattern ${i+1}

${p.detects}
`;});
    }
    if(preds.length){
      out["3_LearningLayer/Predictions/Predictions.md"]=`---\nmentor_node: predictions_index\nlayer: learning\n---\n\n# Predictions\n`;
      preds.forEach((p,i)=>{const inf=(p.informs||[]).map(k=>objMeta[k]&&objMeta[k].id).filter(Boolean);
        out[`3_LearningLayer/Predictions/Prediction${i+1}/Prediction${i+1}.md`]=
`---
mentor_node: prediction
layer: learning
id: prediction_${i+1}
predicts: ${q(p.predicts)}
horizon: ${q(p.horizon)}
informs: [${inf.join(", ")}]
---

# Prediction ${i+1}

${p.predicts}
`;});
    }
    if(sims.length){
      out["3_LearningLayer/Simulations/Simulations.md"]=`---\nmentor_node: simulations_index\nlayer: learning\n---\n\n# Simulations\n`;
      sims.forEach((s,i)=>{const sc=(s.scores||[]).map(k=>objMeta[k]&&objMeta[k].id).filter(Boolean);const af=(s.affects||[]).map(k=>actMeta[k]&&actMeta[k].id).filter(Boolean);const comp=(s.compares||"").split(",").map(x=>x.trim()).filter(Boolean);
        out[`3_LearningLayer/Simulations/Simulation${i+1}/Simulation${i+1}.md`]=
`---
mentor_node: simulation
layer: learning
id: simulation_${i+1}
scenario: ${q(s.scenario)}
compares: [${comp.map(q).join(", ")}]
scores_against: [${sc.join(", ")}]
affects_actions: [${af.join(", ")}]
---

# Simulation ${i+1}

${s.scenario}
`;});
    }
  }

  return out;
}

function structureLayers(state){
  const has={
    objects:state.objects.types.some(t=>t.name),
    domain:state.domain.agents.some(a=>a.name),
    human:state.human.operators.some(o=>o.name),
    learning:state.learning.patterns.some(p=>p.detects)||state.learning.predictions.some(p=>p.predicts)||state.learning.simulations.some(s=>s.scenario)
  };
  return [
    {id:"strategic",index:1,role:"Express intent as weighted objectives + a trade-off policy",kind:"definition",status:"defined",inputs_from:[],outputs_to:[{layer:"governance",contract:"objective ids that action policies may serve"},{layer:"core",contract:"objective weights + trade-off policy"}],spec:"1_StrategicLayer/StrategicLayer.md",owns:["mission","weighting","objectives"],references:[],binding:[{target:"durable_context",mode:"at_startup"}]},
    {id:"governance",index:2,role:"Authority: tiers, action policies, hard limits, escalation",kind:"definition",status:"defined",inputs_from:["strategic"],outputs_to:[{layer:"core",contract:"permitted actions + tiers"},{layer:"domain",contract:"the action policies each agent may perform"}],spec:"2_GovernanceLayer/GovernanceLayer.md",owns:["autonomy_tiers","actions","hard_limits","approvers","escalation"],references:["objectives"],binding:[{target:"durable_context",mode:"at_startup"},{target:"enforcement",mode:"event"}]},
    {id:"learning",index:3,role:"Detect patterns, predict, simulate, propose improvements",kind:"definition",status:has.learning?"defined":"planned",inputs_from:["strategic","governance"],outputs_to:[{layer:"core",contract:"recommendations, predicted impacts, autonomy-promotion evidence"}],spec:"3_LearningLayer/LearningLayer.md",owns:["patterns","predictions","simulations"],references:["objectives","actions","object_types"],binding:[{target:"knowledge_store",mode:"on_demand"},{target:"procedure",mode:"on_demand"},{target:"schedule",mode:"scheduled"}]},
    {id:"core",index:4,role:"Orchestrate: score against intent, route within authority",kind:"engine",status:"defined",inputs_from:["strategic","governance","learning"],outputs_to:[{layer:"domain",contract:"tasked, tier-bounded work assignments"}],spec:"4_CoreLayer/CoreLayer.md",owns:["routing"],references:["objectives","actions","agents"],binding:[{target:"engine",mode:"at_startup"}]},
    {id:"domain",index:5,role:"Specialised agents that do the work",kind:"operating",status:has.domain?"defined":"planned",inputs_from:["governance","core"],outputs_to:[{layer:"objects",contract:"reads/writes to operational object state"}],spec:"5_DomainAgents/DomainAgents.md",owns:["domains","agents"],references:["actions","object_types"],binding:[{target:"agent",mode:"on_demand"},{target:"procedure",mode:"on_demand"}]},
    {id:"objects",index:6,role:"Real-world entities as living nodes with history",kind:"data",status:has.objects?"defined":"planned",inputs_from:["domain"],outputs_to:[{layer:"human",contract:"surfaced state, pressure, history"}],spec:"6_OperationalObjects/OperationalObjects.md",owns:["object_types"],references:[],binding:[{target:"knowledge_store",mode:"on_demand"},{target:"fact_memory",mode:"at_startup"}]},
    {id:"human",index:7,role:"Approvers, supervisors, escalation handlers",kind:"interface",status:has.human?"defined":"planned",inputs_from:["governance","objects"],outputs_to:[],spec:"7_HumanCollaboration/HumanCollaboration.md",owns:["operators"],references:["approvers"],binding:[{target:"channel",mode:"on_demand"},{target:"enforcement",mode:"event"},{target:"schedule",mode:"scheduled"}]}
  ];
}

function buildStructureMd(state){
  const layers=structureLayers(state);
  const fm={mentor:"structure",schema_version:0.3,engine_adapter:state.business.engine_adapter||null,layers};
  const rows=layers.map(l=>`| ${l.index} | ${l.id} | ${l.status} |`).join("\n");
  return "---\n"+Y().dump(fm,{lineWidth:100,noRefs:true,sortKeys:false})+"---\n\n# Structure\n\nThe seven-layer descriptor set for this business (the frontmatter is the source of truth).\n\n| # | layer | status |\n| - | --- | --- |\n"+rows+"\n";
}

const CORE_STUB="---\nmentor_layer: core\nindex: 4\nstatus: defined\nowns: [routing]\nbinding: [{ target: engine, mode: at_startup }]\n---\n\n# Core Layer\n\nThe reasoning engine. Configured, not authored — choose an engine via _meta/EngineAdapters.md. It reads the layers above, scores options against your objectives, and routes work within Governance.\n";

const PLANNED_STUBS={
  "3_LearningLayer/LearningLayer.md": "---\nmentor_layer: learning\nindex: 3\nstatus: planned\nowns: [patterns, predictions, simulations]\n---\n\n# Learning & Simulation Layer\n\n*Planned.* Add patterns, predictions, and simulations when ready (the Setup Wizard's Learning step, or by hand).\n",
  "5_DomainAgents/DomainAgents.md": "---\nmentor_layer: domain\nindex: 5\nstatus: planned\nowns: [domains, agents]\nreferences: [actions, object_types]\n---\n\n# Domain Agents Layer\n\n*Planned.* Add agents under Operations / Intelligence / Communication when ready.\n",
  "6_OperationalObjects/OperationalObjects.md": "---\nmentor_layer: objects\nindex: 6\nstatus: planned\nowns: [object_types]\n---\n\n# Operational Objects Layer\n\n*Planned.* Define the object types this business coordinates when ready.\n",
  "7_HumanCollaboration/HumanCollaboration.md": "---\nmentor_layer: human\nindex: 7\nstatus: planned\nowns: [operators]\nreferences: [approvers]\n---\n\n# Human Collaboration Layer\n\n*Planned.* Map real people to the Governance approvers when ready.\n"
};

function buildBusinessFolder(state,opts){
  const name=state.business.name||"Business";
  const s=slug(name)||"business";
  const out={};
  const put=(p,c)=>{out[s+"/"+p]=c;};
  put(s+".md", `---\nmentor: business\nname: ${q(name)}\nengine_adapter: ${state.business.engine_adapter?q(state.business.engine_adapter):"null"}\ntemplate_version: 0.3\n---\n\n# ${name}\n\nA Mentor operating model generated by Mentor Studio. New here? Read \`_meta/Playbook.md\`.\n`);
  Object.entries(PLANNED_STUBS).forEach(([p,c])=>put(p,c));
  Object.entries(buildFiles(state)).forEach(([p,c])=>put(p,c));
  put("4_CoreLayer/CoreLayer.md", CORE_STUB);
  put("_meta/Structure.md", buildStructureMd(state));
  Object.entries((opts&&opts.embed)||{}).forEach(([p,c])=>put(p,c));
  return out;
}

function validateState(state){
  const w=[];
  const sum=state.strategic.objectives.reduce((a,o)=>a+(+o.weight||0),0);
  if(Math.abs(sum-1)>1e-6) w.push(`Objective weights add up to ${Math.round(sum*1000)/1000}, not 1.0.`);
  state.strategic.objectives.forEach((o,i)=>{if(!o.name)w.push(`Objective ${i+1} has no name.`);});
  if(!state.governance.approvers.some(a=>a.name)) w.push("No approver has a name.");
  state.governance.actions.forEach((a,i)=>{
    if(a.tier==="approve"&&!(state.governance.approvers[a.approver]||{}).name) w.push(`Action ${i+1} needs sign-off but its approver is unnamed.`);
    if(!(a.serves||[]).length) w.push(`Action ${i+1} doesn't serve any objective.`);
  });
  if(!state.governance.hard_limits.some(h=>h.rule)) w.push("No hard limits set.");
  if(state.domain.agents.some(a=>a.name&&!a.actions.length)) w.push("An agent has a name but no allowed actions.");
  if(state.human.operators.some(o=>o.name&&!o.fulfils.length&&!o.handles)) w.push("An operator has no approver and no responsibilities.");
  // advisory: an action ideally has a single owning agent
  const owners={};
  state.domain.agents.forEach(a=>{ if(!a.name) return; (a.actions||[]).forEach(idx=>{ const act=state.governance.actions[idx]; const an=act&&(act.name||("Action "+(idx+1))); if(an) (owners[an]=owners[an]||[]).push(a.persona||a.name); }); });
  Object.entries(owners).forEach(([an,who])=>{ if(who.length>1) w.push(`Action "${an}" is assigned to ${who.length} agents (${who.join(", ")}) — usually each action has a single owner. Keep it only if the overlap is intentional.`); });
  return w;
}

const OPS_OK=new Set([">=","<=",">","<","=="]);

const TIERS_OK=new Set(["auto","recommend","approve"]);

const BIND_T=new Set(["durable_context","identity","fact_memory","knowledge_store","procedure","agent","schedule","enforcement","channel","engine"]);

const BIND_M=new Set(["at_startup","on_demand","scheduled","event"]);

const stripNum=n=>n.replace(/^\d+_/,"");

function parse(text){let fm={},body=text;const m=text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);if(m){try{fm=Y().load(m[1])||{};}catch(e){fm={__error:e.message};}body=m[2]||"";}const h1=(text.match(/^#\s+(.+)$/m)||[])[1];return {fm,title:h1,body};}

function findRoot(node){if(Object.keys(node.dirs).some(k=>/^\d+_/.test(k)))return node;for(const k in node.dirs){const r=findRoot(node.dirs[k]);if(r)return r;}return null;}

function buildTree(arr){const root={name:"",dirs:{},files:[]};for(const f of arr){const segs=f.path.split("/").filter(Boolean);let n=root;for(let i=0;i<segs.length-1;i++){const s=segs[i];n.dirs[s]=n.dirs[s]||{name:s,dirs:{},files:[]};n=n.dirs[s];}const p=parse(f.text);n.files.push({name:segs[segs.length-1],path:f.path,...p});}return findRoot(root)||root;}

function allFms(dir,acc){acc=acc||[];dir.files.forEach(f=>f.fm&&acc.push(f.fm));Object.values(dir.dirs).forEach(d=>allFms(d,acc));return acc;}

const descendantFms=allFms;

function nodeFileOf(dir){const want=[dir.name,stripNum(dir.name)].map(n=>n+".md");return dir.files.find(f=>want.includes(f.name))||dir.files.find(f=>f.fm&&(f.fm.mentor_layer||f.fm.mentor_node||f.fm.mentor))||dir.files[0];}

function validate(tpl){
  const all=descendantFms(tpl).filter(d=>d&&typeof d==="object");
  const issues=[];
  const idset=t=>new Set(all.filter(d=>d.mentor_node===t).map(d=>d.id));
  const obj=idset("objective"),act=idset("action"),appr=idset("approver"),ot=idset("object_type"),dom=idset("domain");
  all.forEach(d=>{ if(d.__error) issues.push(`YAML parse error: ${d.__error}`); });
  // Strategic
  const objs=all.filter(d=>d.mentor_node==="objective");
  if(objs.length){
    const strat=all.find(d=>d.mentor_layer==="strategic")||{};
    const target=(strat.weighting&&strat.weighting.weights_sum_to)||1;
    const wsum=Math.round(objs.reduce((a,o)=>a+(+o.weight||0),0)*1000)/1000;
    if(Math.abs(wsum-target)>1e-6) issues.push(`Strategic — objective weights sum to ${wsum}, expected ${target}`);
    const seen=new Set();
    objs.forEach(o=>{
      if(!o.id) issues.push("Strategic — an objective has no id");
      else if(seen.has(o.id)) issues.push(`Strategic — duplicate objective id "${o.id}"`); else seen.add(o.id);
      if(typeof o.weight!=="number") issues.push(`Strategic — objective "${o.id||"?"}" weight is not a number`);
      if(!(o.targets&&o.targets.length)) issues.push(`Strategic — objective "${o.id||"?"}" has no target`);
      else o.targets.forEach(t=>{ if(!OPS_OK.has(t.operator)) issues.push(`Strategic — "${o.id}" target operator "${t.operator}" invalid`); });
    });
  }
  // Governance
  all.filter(d=>d.mentor_node==="action").forEach(a=>{
    if(!TIERS_OK.has(a.tier)) issues.push(`Governance — action "${a.id}" tier "${a.tier}" invalid`);
    if(a.tier==="approve"&&!appr.has(a.approver)) issues.push(`Governance — approve-action "${a.id}" approver "${a.approver}" not found`);
    (a.serves||[]).forEach(s=>{ if(!obj.has(s)) issues.push(`Governance — action "${a.id}" serves unknown objective "${s}"`); });
    if(a.escalates_to&&!act.has(a.escalates_to)) issues.push(`Governance — action "${a.id}" escalates_to unknown "${a.escalates_to}"`);
  });
  if(all.find(d=>d.mentor_layer==="governance")){
    if(!appr.size) issues.push("Governance — no approvers defined");
    const hl=all.find(d=>d.mentor_node==="hard_limits");
    if(!(hl&&(hl.hard_limits||[]).length)) issues.push("Governance — hard_limits missing or empty");
    const aud=all.find(d=>d.mentor_node==="audit");
    if(aud&&aud.log_all_actions!==true) issues.push("Governance — audit.log_all_actions must be true");
    if(aud&&aud.require_reasoning!==true) issues.push("Governance — audit.require_reasoning must be true");
  }
  // Objects
  all.filter(d=>d.mentor_node==="object_type").forEach(t=>(t.relationships||[]).forEach(r=>{ if(!ot.has(r&&r.to)) issues.push(`Objects — "${t.id}" relationship to unknown "${r&&r.to}"`); }));
  // Domain
  all.filter(d=>d.mentor_node==="agent").forEach(a=>{
    (a.allowed_actions||[]).forEach(x=>{ if(!act.has(x)) issues.push(`Domain — agent "${a.id}" allowed_action "${x}" not a Governance action`); });
    (a.objects||[]).forEach(x=>{ if(!ot.has(x)) issues.push(`Domain — agent "${a.id}" object "${x}" not an object type`); });
    if(a.domain&&!dom.has(a.domain)) issues.push(`Domain — agent "${a.id}" domain "${a.domain}" not a domain`);
  });
  // Human
  all.filter(d=>d.mentor_node==="operator").forEach(o=>(o.fulfils_approvers||[]).forEach(x=>{ if(!appr.has(x)) issues.push(`Human — operator "${o.id}" fulfils_approvers "${x}" not an approver`); }));
  // Learning
  all.filter(d=>d.mentor_node==="pattern").forEach(p=>(p.watches||[]).forEach(x=>{ if(!ot.has(x)) issues.push(`Learning — pattern "${p.id}" watches unknown object type "${x}"`); }));
  all.filter(d=>d.mentor_node==="prediction").forEach(p=>(p.informs||[]).forEach(x=>{ if(!obj.has(x)) issues.push(`Learning — prediction "${p.id}" informs unknown objective "${x}"`); }));
  all.filter(d=>d.mentor_node==="simulation").forEach(s=>{
    (s.scores_against||[]).forEach(x=>{ if(!obj.has(x)) issues.push(`Learning — simulation "${s.id}" scores_against unknown objective "${x}"`); });
    (s.affects_actions||[]).forEach(x=>{ if(!act.has(x)) issues.push(`Learning — simulation "${s.id}" affects_actions unknown action "${x}"`); });
  });
  // Structure
  const structFm=all.find(d=>d&&d.mentor==="structure");
  if(structFm){
    const layers=structFm.layers||[];
    const lids=layers.map(l=>l.id);
    if(new Set(lids).size!==lids.length) issues.push("Structure — duplicate layer ids");
    const idxs=layers.map(l=>l.index).slice().sort((a,b)=>a-b);
    if(JSON.stringify(idxs)!==JSON.stringify(layers.map((_,i)=>i+1))) issues.push("Structure — layer indices not contiguous 1..N");
    const byId={}; layers.forEach(l=>byId[l.id]=l);
    const owns={}; layers.forEach(l=>(l.owns||[]).forEach(ns=>owns[ns]=(owns[ns]||0)+1));
    layers.forEach(l=>{
      (l.inputs_from||[]).forEach(s=>{ if(!byId[s]) issues.push(`Structure — ${l.id}.inputs_from unknown "${s}"`); else if(byId[s].index>=l.index) issues.push(`Structure — ${l.id}.inputs_from "${s}" must be above it`); });
      (l.outputs_to||[]).forEach(o=>{ const t=typeof o==="string"?o:o&&o.layer; if(!byId[t]) issues.push(`Structure — ${l.id}.outputs_to unknown "${t}"`); else if(byId[t].index<=l.index) issues.push(`Structure — ${l.id}.outputs_to "${t}" must be below it`); });
      (l.references||[]).forEach(ns=>{ if(!owns[ns]) issues.push(`Structure — ${l.id}.references "${ns}" owned by no layer`); });
      (l.binding||[]).forEach(b=>{ if(!BIND_T.has(b.target)) issues.push(`Structure — ${l.id} binding target "${b.target}" invalid`); if(!BIND_M.has(b.mode)) issues.push(`Structure — ${l.id} binding mode "${b.mode}" invalid`); });
    });
  } else issues.push("Structure — _meta/Structure.md not found");
  return issues;
}

function compile(tpl){
  const all=allFms(tpl).filter(d=>d&&typeof d==="object");
  const of=t=>all.filter(d=>d.mentor_node===t);
  const bizFm=all.find(d=>d.mentor==="business");
  const bizName=(bizFm&&bizFm.name&&bizFm.name!=="<Business Name>"&&bizFm.name)||"your business";
  const strat=all.find(d=>d.mentor_layer==="strategic")||{};
  const objectives=of("objective"), approvers=of("approver"), agents=of("agent"), objectTypes=of("object_type"), actions=of("action");
  const hl=(all.find(d=>d.mentor_node==="hard_limits")||{}).hard_limits||[];
  const esc=(all.find(d=>d.mentor_node==="escalation")||{}).escalation||[];
  const notif=all.find(d=>d.mentor_node==="notifications")||{};
  const actById={}; actions.forEach(a=>actById[a.id]=a);

  // assembled sections
  const objLines=objectives.map(o=>{const t=(o.targets||[])[0];
    return `- ${o.id} (weight ${o.weight}) — ${o.label||o.id}${t?`; target ${t.metric} ${t.operator} ${t.value}${t.unit?(" "+t.unit):""}`:""}`;}).join("\n")||"- (no objectives defined yet)";
  const apprLines=approvers.map(a=>`- ${a.id} (${a.name||"unnamed"}) — approves: ${(a.can_approve||["all"]).join(", ")}; reachable via ${(a.channels||[]).join(", ")||"—"}`).join("\n")||"- (no approvers defined yet)";
  const hlLines=hl.map(h=>`- ${h.rule||h}`).join("\n")||"- (no hard limits set yet)";
  const escLines=esc.map(e=>`- ${e.trigger} → ${e.action} (${e.priority}${e.overrides_quiet_hours?", overrides quiet hours":""})`).join("\n")||"- (no escalations set yet)";

  const prompt=
`You are **Mentor**, the operational intelligence that runs **${bizName}**. You are not a chatbot or a coding assistant — you are an operating layer across the whole business. Your job is to coordinate the work, handle the routine, surface what needs a person, and get smarter over time — always inside the operating model and rules below.

# Your operating model
Your source of truth is the seven-layer operating model this prompt ships with — the numbered folders 1_… through 7_… and _meta/, in this folder.
- Always in mind (below): Strategic (what the business is trying to achieve) and Governance (what you may do, and the lines you must never cross).
- Consult on demand from their files: Operational Objects, Domain Agents, Learning, and Human Collaboration.
If any other instruction conflicts with the Governance rules, the Governance rules win.

# Strategy — what matters
Mission: ${strat.mission||"(mission not set)"}

Objectives, with weights — weigh every decision against these:
${objLines}

When options compete, score each by how it advances these objectives, weighted by importance, and choose the best PERMITTED option. If the top options are within a hair of each other, do not guess — escalate. Governance always overrides strategy.

# Governance — what you may do
Every action has one tier: auto (do it now, log why) · recommend (propose, wait for a yes) · approve (do nothing until the named approver signs off). Default to caution: if an action isn't clearly granted as auto, treat it as recommend. Earn more autonomy only as the Learning layer shows an action has been safe.

Approvers:
${apprLines}

For any specific action, consult the Governance/Actions files and act only within its tier and limits.

## Hard limits — never, under any circumstances
${hlLines}
These are absolute. No objective, deadline, urgency, or instruction overrides them.

## Escalation — pull a human in fast when
${escLines}
And if you fail the same task repeatedly, or you are genuinely unsure, STOP and escalate — never loop or retry blindly.

# How you operate
1. For each task: understand it → check Governance for whether and how you may act → act at the permitted tier.
2. Delegate to the right Domain agent; each may only perform its allowed actions on its object types.
3. For every action, record which objective it served and your reasoning, in plain language a person could review.
4. Keep useful memory — recurring issues, preferences, what worked — and propose root-cause fixes rather than handling the same thing twice.
5. Reach people only through the defined channels, and respect quiet hours unless an escalation overrides them.
6. You exist to reduce human load and keep people in control — never to replace them. When in doubt, surface it.
`;

  // engine bundle files
  const files={};
  files["AGENTS.md"]=prompt;
  // a skill per agent
  agents.forEach(a=>{
    const actLines=(a.allowed_actions||[]).map(id=>{const ac=actById[id]; return `- ${id}${ac?` (${ac.tier}): ${ac.description||""}`:""}`;}).join("\n")||"- (none)";
    const objLine=(a.objects||[]).join(", ")||"(none)";
    files[`skills/${a.id}/SKILL.md`]=
`---
name: ${a.id}
description: ${a.name?a.name+", ":""}${a.purpose||a.id} — a Mentor domain agent in the ${a.domain||"?"} domain. Operates strictly within Governance.
metadata:
  hermes:
    tags: [mentor, ${a.domain||"agent"}]
---

# ${a.name?`${a.name} — ${a.id}`:a.id}

${a.name?`You are **${a.name}**, the ${a.id.replace(/_/g," ")} for this business. `:""}${a.purpose||""}

## Allowed actions (from Governance — never exceed these, and respect each tier)
${actLines}

## Object types it works with
${objLine}

## Rules
Act only at the tier Governance assigns each action. Log which objective you served and why. Escalate per Governance; never retry blindly.
`;
  });
  // setup checklist
  const channels=[...new Set([].concat(notif.default_channels||[], ...approvers.map(a=>a.channels||[])))];
  files["SETUP.md"]=
`# Running ${bizName} on an engine — starter checklist

This bundle was compiled from your Mentor operating model. The launch prompt makes an engine *behave*
as Mentor; the steps below are what let it actually *act*.

## 1. Engine
Install your engine (e.g. Hermes Agent). Place \`AGENTS.md\` as its context file, with the
operating-model folder alongside so it can read the on-demand layers.

## 2. Agents → ${agents.length} skill(s)
${agents.map(a=>`- ${a.id} (${a.domain}) → skills/${a.id}/SKILL.md`).join("\n")||"- (no agents defined yet)"}

## 3. Connect data — object types
${objectTypes.map(t=>`- ${t.id} — connect to your live ${t.label||t.id} records`).join("\n")||"- (no object types defined yet)"}

## 4. Channels
Set up so approvals and escalations reach people: ${channels.join(", ")||"(none specified)"}.

## 5. Enforce the hard limits (don't rely on the prompt alone)
Back each with an engine hook or by withholding the tool/credential:
${hl.map(h=>`- ${h.rule}`).join("\n")||"- (no hard limits set yet)"}

## 6. Start tiny
Enable one agent, keep every action at \`recommend\`, confirm by hand for a while, then promote to
\`auto\` as it proves safe.
`;

  return {prompt, files, slug:slug(bizName)||"mentor",
    summary:{objectives:objectives.length,approvers:approvers.length,agents:agents.length,objectTypes:objectTypes.length,hardLimits:hl.length,channels}};
}

/* ---------- deploy package: arrange a compiled model as a runnable, self-contained folder ---------- */
function deployReadme(res,bizDir){
  const skills=Object.keys(res.files).filter(k=>k.startsWith("skills/")).map(k=>"- `"+k+"`").join("\n")||"- (no agents defined)";
  return "# Deploy — "+bizDir+"\n\n"
    +"This folder is **self-contained and ready to run** — the launch prompt (`AGENTS.md`) sits right here with the seven layer folders.\n\n"
    +"## 1 · Start your engine inside this folder\n"
    +"Open a terminal in this folder and start your engine here. It loads `AGENTS.md` from the working directory automatically, and reads the layer files on demand. With Hermes Agent:\n\n"
    +"```\ncd "+bizDir+"\nhermes\n```\n\n"
    +"Sanity check — ask it *\"what are you optimising for?\"*; it should answer as Mentor with your objectives.\n\n"
    +"## 2 · Install the agent skills\n"
    +"Copy the contents of `skills/` into your engine's skills directory (e.g. `~/.hermes/skills/`):\n"
    +skills+"\n\n"
    +"## 3 · Wire it up\n"
    +"Follow `SETUP.md` to connect tools, live data, and channels, and to enforce the hard limits. Start every action at `recommend`; promote to `auto` only on evidence.\n";
}
function deployFiles(folder,res){
  const bizDir=(Object.keys(folder)[0]||"business").split("/")[0];
  const out={};
  Object.entries(folder).forEach(([p,c])=>out[p]=c);
  Object.entries(res.files).forEach(([p,c])=>out[bizDir+"/"+p]=c);   // AGENTS.md + skills/ + SETUP.md, inside the folder
  out[bizDir+"/DEPLOY.md"]=deployReadme(res,bizDir);
  return out;
}

/* ---------- inverse of buildFiles: a parsed folder tree -> wizard state (round-trip editing) ---------- */
function stateFromTree(tpl){
  const files=[]; (function w(d){d.files.forEach(f=>files.push(f));Object.values(d.dirs).forEach(w);})(tpl);
  const byPath=(a,b)=>String(a.path||a.name).localeCompare(String(b.path||b.name),undefined,{numeric:true,sensitivity:"base"});
  const ofNode=t=>files.filter(f=>f.fm&&f.fm.mentor_node===t).sort(byPath);
  const ofLayer=l=>files.find(f=>f.fm&&f.fm.mentor_layer===l);
  const biz=files.find(f=>f.fm&&f.fm.mentor==="business");
  const deSlug=s=>String(s||"").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  const cap=s=>{s=String(s||"");return s.charAt(0).toUpperCase()+s.slice(1);};
  const descFromBody=body=>{const out=[];for(const ln of String(body||"").split("\n")){const t=ln.trim();if(!t)continue;if(t.charAt(0)==="#")continue;if(t.charAt(0)==="|")break;out.push(t);}return out.join(" ").trim();};
  const csv=a=>Array.isArray(a)?a.join(", "):(a||"");
  const objF=ofNode("objective"),objId=objF.map(f=>f.fm.id),objIdx=id=>objId.indexOf(id);
  const apprF=ofNode("approver"),apprId=apprF.map(f=>f.fm.id),apprIdx=id=>apprId.indexOf(id);
  const actF=ofNode("action"),actId=actF.map(f=>f.fm.id),actIdx=id=>actId.indexOf(id);
  const otF=ofNode("object_type"),otId=otF.map(f=>f.fm.id),otIdx=id=>otId.indexOf(id);
  const objectives=objF.map(f=>{const m=f.fm;return {name:m.label||f.title||m.id,description:descFromBody(f.body),weight:(typeof m.weight==="number"?m.weight:(+m.weight||0)),targets:(m.targets||[]).map(t=>({metric:t.metric||"",operator:t.operator||">=",value:(t.value===undefined?0:t.value),unit:t.unit||""})),guidance:m.guidance||""};});
  const approvers=apprF.map(f=>{const m=f.fm;return {name:m.name||"",role:m.role||"",channels:(m.channels||["email"]).slice(),can_approve:csv(m.can_approve)||"all"};});
  const actions=actF.map(f=>{const m=f.fm,lim=m.limits||{};return {name:f.title||deSlug(m.id),description:m.description||"",tier:m.tier||"recommend",serves:(m.serves||[]).map(objIdx).filter(i=>i>=0),domains:csv(m.domains),conditions:m.conditions||"",approver:(m.approver?Math.max(0,apprIdx(m.approver)):0),escalates_to:(m.escalates_to?actIdx(m.escalates_to):-1),max_percent:(lim.max_percent!==undefined?lim.max_percent:""),max_cost:(lim.max_cost&&lim.max_cost.amount!==undefined?lim.max_cost.amount:""),ccy:(lim.max_cost&&lim.max_cost.currency)||""};});
  const types=otF.map(f=>{const m=f.fm;return {name:m.label||f.title||m.id,key:m.key||"",fields:(m.fields||[]).map(x=>({name:x.name||"",type:x.type||"text"})),relationships:(m.relationships||[]).map(r=>({type:r.type||"belongs_to",to:otIdx(r.to)})).filter(r=>r.to>=0),states:csv(m.states)};});
  const agents=ofNode("agent").map(f=>{const m=f.fm,persona=m.name||"";let role=f.title||"";if(persona&&role.indexOf(persona+" — ")===0)role=role.slice(persona.length+3);if(!role)role=deSlug(m.id);return {name:role,persona:persona,domain:cap(m.domain||"operations"),purpose:m.purpose||"",actions:(m.allowed_actions||[]).map(actIdx).filter(i=>i>=0),objects:(m.objects||[]).map(otIdx).filter(i=>i>=0)};});
  const operators=ofNode("operator").map(f=>{const m=f.fm;return {name:m.name||"",role:m.role||"",fulfils:(m.fulfils_approvers||[]).map(apprIdx).filter(i=>i>=0),channels:(m.channels||["email"]).slice(),handles:csv(m.handles),availability:m.availability||""};});
  const hl=(ofNode("hard_limits")[0]||{fm:{}}).fm.hard_limits||[];
  const esc2=(ofNode("escalation")[0]||{fm:{}}).fm.escalation||[];
  const nf=(ofNode("notifications")[0]||{fm:{}}).fm,qh=(nf&&nf.quiet_hours)||{};
  const au=(ofNode("audit")[0]||{fm:{}}).fm;
  const patterns=ofNode("pattern").map(f=>({detects:f.fm.detects||"",watches:(f.fm.watches||[]).map(otIdx).filter(i=>i>=0),suggests:f.fm.suggests||""}));
  const predictions=ofNode("prediction").map(f=>({predicts:f.fm.predicts||"",horizon:f.fm.horizon||"",informs:(f.fm.informs||[]).map(objIdx).filter(i=>i>=0)}));
  const simulations=ofNode("simulation").map(f=>({scenario:f.fm.scenario||"",compares:csv(f.fm.compares),scores:(f.fm.scores_against||[]).map(objIdx).filter(i=>i>=0),affects:(f.fm.affects_actions||[]).map(actIdx).filter(i=>i>=0)}));
  const strat=(ofLayer("strategic")||{fm:{}}).fm,wt=strat.weighting||{};
  const bn=(biz&&biz.fm.name)||"";
  return {
    business:{name:(bn&&bn!=="<Business Name>")?bn:"",engine_adapter:(biz&&biz.fm.engine_adapter&&biz.fm.engine_adapter!=="null"&&biz.fm.engine_adapter!==null)?biz.fm.engine_adapter:""},
    strategic:{mission:strat.mission||"",tie_breaker:wt.tie_breaker||"escalate",tie_margin:(wt.tie_margin!==undefined?wt.tie_margin:0.05),objectives:objectives.length?objectives:[{name:"",description:"",weight:1,targets:[{metric:"",operator:">=",value:0,unit:""}],guidance:""}]},
    governance:{approvers:approvers.length?approvers:[{name:"",role:"",channels:["email"],can_approve:"all"}],actions:actions.length?actions:[{name:"",description:"",tier:"recommend",serves:[],domains:"",conditions:"",approver:0,escalates_to:-1,max_percent:"",max_cost:"",ccy:""}],hard_limits:hl.map(h=>({rule:h.rule||h})),escalation:esc2.map(e=>({trigger:e.trigger||"",priority:e.priority||"medium",action:e.action||"",oqh:!!e.overrides_quiet_hours})),notifications:{channels:((nf&&nf.default_channels)||["email"]).slice(),window:qh.window||"22:00-07:00",timezone:qh.timezone||"UTC",priority:qh.only_priority_at_or_above||"critical"},audit:{retain_days:(au&&au.retain_days)||365}},
    objects:{types:types},
    domain:{agents:agents},
    human:{operators:operators},
    learning:{patterns:patterns,predictions:predictions,simulations:simulations}
  };
}

return {setYaml,esc,slug,q,DEFAULTS,buildFiles,structureLayers,buildStructureMd,CORE_STUB,PLANNED_STUBS,buildBusinessFolder,validateState,parse,buildTree,findRoot,allFms,descendantFms,nodeFileOf,validate,compile,deployReadme,deployFiles,stateFromTree};

});