# Running Riverside Café on an engine — starter checklist

This bundle was compiled from your Mentor operating model. The launch prompt makes an engine *behave*
as Mentor; the steps below are what let it actually *act*.

## 1. Engine
Install your engine (e.g. Hermes Agent). Place `AGENTS.md` as its context file, with the
operating-model folder alongside so it can read the on-demand layers.

## 2. Agents → 3 skill(s)
- guest_relations_agent (communication) → skills/guest_relations_agent/SKILL.md
- insights_agent (intelligence) → skills/insights_agent/SKILL.md
- front_of_house_agent (operations) → skills/front_of_house_agent/SKILL.md

## 3. Connect data — object types
- customer — connect to your live Customer records
- order — connect to your live Order records
- menuitem — connect to your live MenuItem records

## 4. Channels
Set up so approvals and escalations reach people: telegram, email.

## 5. Enforce the hard limits (don't rely on the prompt alone)
Back each with an engine hook or by withholding the tool/credential:
- Never move money, issue refunds, or change payouts without approval
- Never share personal or customer data with third parties without approval
- Never make legally binding commitments on the business's behalf without approval
- Never make public or media statements as the business without approval
- Never permanently delete or irreversibly destroy records without approval
- Always disclose that you are an AI when asked
- Never serve or advertise an item without disclosing its known allergens

## 6. Start tiny
Enable one agent, keep every action at `recommend`, confirm by hand for a while, then promote to
`auto` as it proves safe.
