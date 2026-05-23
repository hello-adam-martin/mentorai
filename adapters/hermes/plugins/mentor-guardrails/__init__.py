"""mentor-guardrails — a Hermes Agent plugin that enforces a Mentor model's Governance layer.

It reads the rules LIVE from your model's Governance layer at runtime (see policy.py) — there's
no per-business rules file to drift. Only the engine-specific detection patterns live alongside,
in detectors.json (business-neutral). Maps Mentor's enforcement onto Hermes hooks:

  * pre_tool_call   -> BLOCK hard-limit violations + GATE approve-tier actions
  * post_tool_call  -> append an AUDIT record of every executed tool call

Drop this directory in ~/.hermes/plugins/ and enable it with:
    hermes plugins enable mentor-guardrails
"""

# Support both package import (from . import policy) and flat import, so the plugin loads
# regardless of how Hermes resolves the plugin directory.
try:
    from . import policy
except ImportError:  # pragma: no cover
    import policy


def register(ctx):
    # pre_tool_call is one of the two hooks whose return value affects behaviour:
    # returning {"action": "block", "message": ...} vetoes the tool call.
    ctx.register_hook("pre_tool_call", policy.pre_tool_call)
    # post_tool_call's return value is ignored by Hermes — we use it purely to log.
    ctx.register_hook("post_tool_call", policy.post_tool_call)
