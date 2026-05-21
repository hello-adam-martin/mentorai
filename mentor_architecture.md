# Mentor — Architecture

**How the whole layered structure is described, and how it is run on an engine.**
Architecture version 0.2 · Engine-agnostic · Companions: `MentorTemplate/_meta/SpecFormat.md`, `MentorTemplate/_meta/EngineAdapters.md`

---

## What this document is

Mentor is described by a structure (the layers and how they connect) and run by binding
that structure to an agent engine. This document covers both at the platform level, and
the principles that hold them together. It is engine-agnostic: Hermes Agent is one supported
engine, but nothing here assumes it.

There are two ideas to hold:

1. **The structure** — one consistent way to describe every layer (a *descriptor*), so the
   layers compose into a single coherent whole and new layers can be added on demand.
2. **The binding** — Mentor specs are Markdown, so binding to an engine is mostly a matter
   of *placement*: which loader (context file, memory, skill, scheduled job, channel) each
   layer's `.md` is fed into. A small per-engine *adapter* records that mapping; the spec
   never changes.

## The layers

Mentor has seven layers. Intent and authority flow **down**; state and outcomes flow **up**.

1. **Strategic** — business intent: weighted, measurable objectives + a trade-off policy.
2. **Governance** — authority: autonomy tiers, action policies, hard limits, escalation.
3. **Learning & Simulation** — pattern detection, prediction, simulation, improvement.
4. **Core** — the reasoning engine: builds context, scores options against intent, routes within authority.
5. **Domain agents** — specialised agents (e.g. operations / intelligence / communication) that do the work.
6. **Operational objects** — real-world entities (properties, jobs, customers, …) as living nodes with history.
7. **Human collaboration** — people as approvers, supervisors, escalation handlers, and source-of-truth contributors.

## The unifying meta-structure: the layer descriptor

Every layer, whatever it does, is described by the same envelope — a **descriptor**
(`id, index, role, kind, status, inputs_from, outputs_to, spec, owns, references, binding`;
full field definitions in `MentorTemplate/_meta/SpecFormat.md`). The descriptor standardises how layers
connect and bind, while each layer keeps its own content file. The full structure is the
ordered set of descriptors plus the shared id namespaces they reference across layers
(Strategy owns `objectives`; Governance's actions reference them via `serves`; agents
reference actions; objects define the entity types agents act on; the Human layer references
the approvers Governance names). These cross-references turn seven files into one graph.

**Adding a layer is mechanical, not architectural.** Write a descriptor, declare what it
consumes from above and hands down, point `spec` at a content file (a stub is fine), declare
its `binding`, and set `status: planned`. As long as references resolve and the up/down
contracts hold, it slots in without disturbing the rest. This is what lets the structure be
built out as needed rather than all at once.

## The portable binding model

A spec does nothing until an engine runs it. Binding is split into an **abstract contract**
(what an engine must provide) and a **per-engine adapter** (how that engine provides it). The
spec only ever references the abstract contract — a small capability vocabulary
(`durable_context, identity, fact_memory, knowledge_store, procedure, agent, schedule,
enforcement, channel, engine`). This is what keeps Mentor portable: to support a new engine
you write a new adapter, not a new spec.

Because Mentor specs are already Markdown, most binding is *placement* — a layer's `.md`
becomes a context file, a memory note, a skill, a scheduled job, or a channel configuration
in the target engine. See `MentorTemplate/_meta/EngineAdapters.md` for the vocabulary and the concrete
maps (Hermes Agent today; a template for adding others).

## Design principles

**Engine-agnostic core.** Nothing in the structure or spec format assumes a particular
engine. Engine specifics live only in adapters, which are swappable.

**Markdown everywhere.** One file type, readable by humans and every engine, checkable by a
tool. No compiler step.

**Governance supersedes strategy.** A strategic weight influences which *permitted* option an
agent prefers; it can never authorise something a hard limit forbids or skip a required
approval. Authority wins over intent, always.

**A single declarative source of truth.** The whole structure reads from the spec files;
behaviour changes by editing them, never by quietly re-prompting an agent.

**Autonomy is earned and migrates.** Actions move toward greater independence
(approve → recommend → auto) as evidence accumulates that they're safe. Nothing starts
trusted by default.

**Intent must be measurable.** Objectives carry targets so the system is judged on outcomes,
not activity.

**Explainability by default.** Every action records which objective it served and why; a
decision that can't be explained in plain language is a governance failure.

**Bright lines are absolute and few.** Hard limits are a short list of genuine prohibitions,
never overridden.

**No blind loops.** Repeated failure or disagreement escalates to a human rather than retrying.

**Separation of definition from instance.** The format and templates are generic; a business
produces an instance by filling them in. The same definitions serve many businesses.

## How it runs end to end

Author the structure and per-layer content as Markdown. Validate the invariants. Bind via an
engine adapter — which, for a Markdown-native engine, mostly means placing each layer's `.md`
into the right loader. Operate: the engine reasons inside the strategy, bounded by governance,
delegating to domain agents, acting on operational objects, escalating to humans. Learn:
outcomes flow back, the Learning layer proposes spec changes, the Markdown is edited, and the
engine picks up the change. The spec stays the single source of truth; the running system is
always a reflection of it.

## Building incrementally

You don't need all seven layers to start. A viable first slice is Strategic + Governance +
Core (intent + authority + the engine that honours them), with Human added for interaction.
The other layers can sit at `status: planned` and be filled in as needed — the order this
architecture is designed to support.
