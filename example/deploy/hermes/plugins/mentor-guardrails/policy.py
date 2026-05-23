"""policy.py — generic Mentor → Hermes guardrail enforcer that reads the model LIVE.

There is NO copy of your rules here. The rules — which hard limits exist, which actions need
approval, who approves, the caps — are read straight from your model's **Governance layer**
(`2_GovernanceLayer/HardLimits` + `Actions`) at runtime. Edit that Markdown and the change is
enforced on the next tool call (an mtime cache reloads it) — nothing to regenerate, no snapshot
that can drift.

The only thing here that ISN'T from the model is `detectors.json` — a BUSINESS-NEUTRAL library
of how to *recognise* a category of tool call in Hermes (the engine-specific bit that can't live
in an engine-neutral model). A detector is attached to a Governance rule when the rule's text
contains the detector's keywords. So: rules + tiers + approvers come from the model; only the
Hermes pattern-matching comes from here.

Enforcement → Hermes hooks:
  pre_tool_call   -> BLOCK hard-limit violations + GATE approve-tier actions
  post_tool_call  -> append an AUDIT line for every executed tool call

Capability-withholding (the strongest guardrail) is config.yaml `agent.disabled_toolsets`.
"""
import json
import os
import re
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
DETECTORS_PATH = os.path.expanduser(
    os.environ.get("MENTOR_DETECTORS", os.path.join(HERE, "detectors.json"))
)
AUDIT_LOG = os.path.expanduser(
    os.environ.get("MENTOR_AUDIT_LOG", "~/.hermes/logs/mentor-audit.jsonl")
)

# ---------------------------------------------------------------------------
# Locate the model (Governance lives in <model>/2_GovernanceLayer/)
# ---------------------------------------------------------------------------
def _find_model_dir():
    env = os.environ.get("MENTOR_MODEL_DIR")
    if env and os.path.isdir(os.path.join(os.path.expanduser(env), "2_GovernanceLayer")):
        return os.path.expanduser(env)
    d = os.getcwd()
    for _ in range(8):  # walk up from the working dir looking for the model
        if os.path.isdir(os.path.join(d, "2_GovernanceLayer")):
            return d
        nd = os.path.dirname(d)
        if nd == d:
            break
        d = nd
    return None


# ---------------------------------------------------------------------------
# Frontmatter parsing — PyYAML if present, else a targeted fallback
# ---------------------------------------------------------------------------
try:
    import yaml  # type: ignore
    _HAVE_YAML = True
except Exception:  # pragma: no cover
    _HAVE_YAML = False


def _frontmatter(path):
    try:
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
    except Exception:
        return {}
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n?", text, re.S)
    if not m:
        return {}
    block = m.group(1)
    if _HAVE_YAML:
        try:
            data = yaml.safe_load(block)
            return data if isinstance(data, dict) else {}
        except Exception:
            pass
    return _fallback_parse(block)


def _fallback_parse(block):
    """Minimal parser for the two shapes we need (no PyYAML available)."""
    out = {}
    # hard_limits: list of flow maps  - { id: x, rule: "..." }
    hl = []
    for mm in re.finditer(r"\{\s*id:\s*([^,}\s]+)\s*,\s*rule:\s*(\"(?:[^\"\\]|\\.)*\"|'[^']*'|[^}]+?)\s*\}", block):
        rule = mm.group(2).strip().strip("\"'")
        hl.append({"id": mm.group(1).strip(), "rule": rule})
    if hl:
        out["hard_limits"] = hl
    # simple top-level scalars: key: value
    for mm in re.finditer(r"^([a-zA-Z_]+):[ \t]*(\"[^\"]*\"|'[^']*'|[^\n{[]+)$", block, re.M):
        out[mm.group(1)] = mm.group(2).strip().strip("\"'")
    return out


# ---------------------------------------------------------------------------
# Load detectors (business-neutral) + Governance (the model, live)
# ---------------------------------------------------------------------------
def _load_detectors():
    try:
        with open(DETECTORS_PATH, encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception:
        data = {}
    return data.get("detectors", []) or [], tuple(
        data.get("approval_keys") or ("approved_by", "_approved_by", "approval")
    )


def _governance_files(model):
    files = []
    if not model:
        return files
    hl = os.path.join(model, "2_GovernanceLayer", "HardLimits", "HardLimits.md")
    if os.path.exists(hl):
        files.append(hl)
    adir = os.path.join(model, "2_GovernanceLayer", "Actions")
    if os.path.isdir(adir):
        for root, _dirs, fs in os.walk(adir):
            for f in sorted(fs):
                if f.endswith(".md"):
                    files.append(os.path.join(root, f))
    return files


def _read_governance(model):
    """Return (hard_limits, actions) from the live Markdown."""
    hard_limits, actions = [], []
    hl_path = os.path.join(model, "2_GovernanceLayer", "HardLimits", "HardLimits.md") if model else ""
    if hl_path and os.path.exists(hl_path):
        for hl in _frontmatter(hl_path).get("hard_limits", []) or []:
            if isinstance(hl, dict) and hl.get("rule"):
                hard_limits.append({"id": hl.get("id"), "rule": hl.get("rule")})
    for path in _governance_files(model):
        if path.endswith("HardLimits.md"):
            continue
        fm = _frontmatter(path)
        if fm.get("mentor_node") == "action":
            actions.append({"id": fm.get("id"), "tier": fm.get("tier"),
                            "approver": fm.get("approver"),
                            "description": fm.get("description", "") or "",
                            "limits": fm.get("limits")})
    return hard_limits, actions


def _build_rules(hard_limits, actions, detectors):
    """Join the LIVE model rules with the business-neutral detectors. Returns
    (rules, coverage). A rule = {kind, id, text, action, approver, tool_patterns, arg_patterns}."""
    rules, covered, uncovered = [], [], []

    def detectors_for(text):
        t = (text or "").lower()
        return [d for d in detectors if any(kw.lower() in t for kw in d.get("keywords", []))]

    # Hard limits: action comes from the matched detector (destructive => block, else gate)
    for hl in hard_limits:
        ds = detectors_for(hl["rule"])
        if not ds:
            uncovered.append({"kind": "hard_limit", "id": hl["id"], "text": hl["rule"]})
            continue
        for d in ds:
            act = d.get("action", "require_approval")
            rules.append({"kind": "hard_limit", "id": hl["id"], "text": hl["rule"],
                          "action": act,
                          "approver": "the approver named in Governance",
                          "tool_patterns": d.get("tool_patterns", []),
                          "arg_patterns": d.get("arg_patterns", []),
                          # blocks always win; generic hard-limit gates come after action gates
                          "priority": 0 if act == "block" else 2})
        covered.append({"id": hl["id"], "via": [d["id"] for d in ds]})

    # Approve-tier actions: GATE. Match by the action id (a tool named after it) + any detector
    # whose keywords appear in the action's description. Tier + approver come from the model.
    for a in actions:
        if a.get("tier") != "approve":
            continue
        ds = detectors_for(a.get("description", ""))
        tps = [r"\b" + re.escape(str(a.get("id"))) + r"\b"]
        aps = []
        for d in ds:
            tps += d.get("tool_patterns", [])
            aps += d.get("arg_patterns", [])
        rules.append({"kind": "action", "id": a.get("id"), "text": a.get("description") or a.get("id"),
                      "action": "require_approval",
                      "approver": a.get("approver") or "owner",
                      "tool_patterns": tps, "arg_patterns": aps,
                      "priority": 1})  # action-specific gates beat generic hard-limit gates
        covered.append({"id": a.get("id"), "via": ["action-id"] + [d["id"] for d in ds]})

    rules.sort(key=lambda r: r.get("priority", 2))  # block(0) → action gate(1) → hard-limit gate(2)
    coverage = {"covered": covered, "uncovered": uncovered}
    return rules, coverage


# ---------------------------------------------------------------------------
# Cache — reload when any Governance file or detectors.json changes (live edits)
# ---------------------------------------------------------------------------
_CACHE = {"sig": None, "rules": [], "approval_keys": (), "coverage": {}, "model": None}


def _signature(model):
    sig = []
    for f in _governance_files(model) + [DETECTORS_PATH]:
        try:
            sig.append((f, os.path.getmtime(f)))
        except Exception:
            sig.append((f, 0))
    return tuple(sig)


def _ensure():
    model = _find_model_dir()
    sig = _signature(model)
    if sig != _CACHE["sig"]:
        detectors, approval_keys = _load_detectors()
        hard_limits, actions = _read_governance(model)
        rules, coverage = _build_rules(hard_limits, actions, detectors)
        _CACHE.update(sig=sig, rules=rules, approval_keys=approval_keys,
                      coverage=coverage, model=model)
        if model is None:
            _audit({"event": "config_warning",
                    "message": "mentor-guardrails could not locate the model (no 2_GovernanceLayer "
                               "found from cwd or MENTOR_MODEL_DIR) — no rules loaded."})
    return _CACHE


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _serialise(args):
    try:
        return json.dumps(args, default=str)
    except Exception:
        return str(args)


def _matches(rule, tool_name, blob):
    tps, aps = rule.get("tool_patterns") or [], rule.get("arg_patterns") or []
    tool_hit = any(re.search(p, tool_name, re.I) for p in tps)
    if aps:
        return tool_hit or any(re.search(p, blob, re.I) for p in aps)
    return tool_hit


def _has_approval(args, keys):
    return isinstance(args, dict) and any(args.get(k) for k in keys)


def _audit(entry):
    entry["ts"] = datetime.now(timezone.utc).isoformat()
    try:
        os.makedirs(os.path.dirname(AUDIT_LOG), exist_ok=True)
        with open(AUDIT_LOG, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, default=str) + "\n")
    except Exception:
        pass  # auditing must never crash the agent


# ---------------------------------------------------------------------------
# Hermes hooks
# ---------------------------------------------------------------------------
def pre_tool_call(tool_name=None, args=None, task_id=None, **kwargs):
    state = _ensure()
    tool_name = tool_name or kwargs.get("tool_name") or ""
    args = args if args is not None else (kwargs.get("args") or {})
    blob = _serialise(args)

    for rule in state["rules"]:
        if not _matches(rule, tool_name, blob):
            continue
        if rule["action"] == "block":
            _audit({"event": "blocked", "rule": rule["id"], "tool": tool_name,
                    "args": blob[:300], "task_id": task_id})
            return {"action": "block",
                    "message": (f"BLOCKED by Mentor Governance hard limit [{rule['id']}]: "
                                f"{rule['text']}. This is absolute and cannot be overridden.")}
        if rule["action"] == "require_approval" and not _has_approval(args, state["approval_keys"]):
            _audit({"event": "gated", "rule": rule["id"], "tool": tool_name,
                    "args": blob[:300], "task_id": task_id})
            return {"action": "block",
                    "message": (f"NEEDS APPROVAL [{rule['id']}]: {rule['text']}. Do not proceed. "
                                f"Propose this to '{rule['approver']}' and act only after they "
                                f"approve; the approved call must carry an 'approved_by' marker.")}

    _audit({"event": "allowed", "tool": tool_name, "args": blob[:300], "task_id": task_id})
    return None


def post_tool_call(tool_name=None, args=None, task_id=None, **kwargs):
    result = kwargs.get("result")
    blob = _serialise(args if args is not None else kwargs.get("args") or {})
    rblob = _serialise(result) if result is not None else ""
    _audit({"event": "executed", "tool": tool_name or kwargs.get("tool_name") or "",
            "args": blob[:300], "result": rblob[:300], "task_id": task_id})
    return None


def coverage_report():
    """For check_coverage.py: which live Governance rules are detectable on Hermes."""
    state = _ensure()
    return {"model": state["model"], "rules": len(state["rules"]), **state["coverage"]}
