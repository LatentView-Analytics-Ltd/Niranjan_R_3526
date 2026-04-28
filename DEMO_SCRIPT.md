# Campaign Management AI Agent - Demo Script

**Duration:** 5-7 minutes  
**Objective:** Show how AI accelerates campaign planning from ambiguous brief → validated execution plan

---

## Setup Checklist (Before Demo)

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:3000`
- [ ] Browser window open to frontend
- [ ] Azure OpenAI credentials configured and tested
- [ ] Sample briefs loaded and working

---

## Demo Flow

### Act 1: The Problem (30 seconds)

**Show:** Empty Campaign Brief form

**Say:**
> "Marketing campaigns start with rough ideas — often just a few sentences in an email. A campaign manager's job is to turn this into a detailed execution plan with specific channels, timelines, budgets, and copy guidelines. This typically takes 2-3 days of meetings and back-and-forth clarification. Let's see how AI can help."

---

### Act 2: Brief Submission (1 minute)

**Action:** Click "Load B2B SaaS Sample"

**Say:**
> "Here's a typical campaign brief. We have a business objective — convert 200 enterprise trial accounts to paid contracts. We know the target audience and key message. But look at what's missing: the channels are vague ('email, LinkedIn, social'), no budget is specified, and the timeline has no milestones."

**Action:** Scroll through the brief to show the fields

**Say:**
> "A human campaign manager would spend hours in kick-off meetings asking clarifying questions. Let's let AI do that first."

**Action:** Click "Analyze Brief & Continue"

**Wait:** 5-10 seconds for AI to process

---

### Act 3: AI Surfaces Gaps (1.5 minutes)

**Show:** Clarifying Questions page loads

**Say:**
> "The AI identified [X] gaps in our brief and generated specific, answerable questions. Notice these aren't vague — they're contextualized and prioritized. For example..."

**Action:** Point to Question 1 about social channels

**Read Question:**
> "The brief mentions 'social channels' — should this include LinkedIn, Instagram, both, or other platforms?"

**Read Context:**
> "Different social platforms require different content formats and budgets. LinkedIn is B2B-focused; Instagram is visual-first."

**Say:**
> "This is the kind of question a campaign manager would ask in a kick-off meeting. The AI is surfacing it before that meeting even happens."

**Action:** Answer 2-3 critical/high priority questions
- Select "LinkedIn and Instagram" for social channels
- Provide budget estimate if asked
- Clarify audience segmentation if needed

**Say:**
> "I can answer these, or skip them and let the AI make reasonable assumptions. For this demo, I'll answer a few key ones."

**Action:** Click "Generate Execution Plan"

**Wait:** 15-30 seconds for plan generation (this is the longest wait — fill time)

**Say while waiting:**
> "The AI is now generating a complete execution plan. It's creating detailed channel specifications, a week-by-week timeline, budget breakdown, copy guidelines for each audience segment, and a pre-launch verification checklist. In production, this takes a human 4-8 hours."

---

### Act 4: The Generated Plan (1.5 minutes)

**Show:** Execution Plan page loads

**Say:**
> "Here's our plan. Notice it's not a summary of the brief — it's a structured, executable document."

**Action:** Expand "Executive Summary"

**Say:**
> "Clear summary of the strategy."

**Action:** Expand "Channels" section

**Say:**
> "Each channel has specific details: LinkedIn Sponsored Content targeting VP-level roles, with carousel format, copy guidance for that audience, frequency, budget allocation, and success metrics. A copywriter or channel manager can work from this without additional clarification."

**Action:** Scroll to show one channel spec in detail

**Action:** Expand "Timeline" section

**Say:**
> "Week-by-week milestones with deliverables and owners. This isn't 'launch by July 1' — it's a project plan."

**Action:** Scroll through timeline to show milestones

**Action:** Expand "Budget Breakdown"

**Say:**
> "Even though our brief said 'Not specified,' the AI made a reasonable estimate with clear assumptions documented at the bottom."

**Action:** Scroll to "Assumptions Made" section

**Say:**
> "Transparency. The AI tells us exactly what it assumed when information was missing."

---

### Act 5: QA Validation (1.5 minutes)

**Say:**
> "Now, the most important part: Before this goes to a copywriter or gets budgets allocated, we need to check — does this plan actually deliver what the brief asked for?"

**Action:** Click "Run QA Validation"

**Wait:** 10-15 seconds

**Show:** QA Report page loads

**Say:**
> "The AI compares the plan against the brief and gives us an alignment score — [X]/100."

**Action:** Point to the alignment score

**Say:**
> "We have [X] issues: [X] critical, [X] high, [X] medium, [X] low."

**Action:** Scroll to a high-severity misalignment (if any exist)

**Read Issue Title:**
> "[Example: Target audience mismatch on LinkedIn channel]"

**Show:**
> "Brief says: [quote from brief]  
> Plan says: [quote from plan]  
> Impact: [explain why this matters]  
> Suggested fix: [specific correction]"

**Say:**
> "This is the kind of error that would slip through manual review and only get caught after ads are live. The AI catches it before launch."

**Action:** Scroll to "Strengths" section

**Say:**
> "It also tells us what the plan does well — what aligns with the brief."

**Action:** Scroll to "Recommendations"

**Say:**
> "And gives us actionable recommendations."

---

### Act 6: The Value Prop (30 seconds)

**Say:**
> "What we just saw would normally take:
> - 2-3 hours for a kick-off meeting to clarify the brief
> - 4-8 hours to create the execution plan
> - 1-2 hours to QA the plan against the brief
> 
> Total: about a full day of a campaign manager's time.
> 
> With AI: 2-3 minutes."

**Say:**
> "But notice — the AI isn't replacing the campaign manager. It's doing the structured thinking and gap-filling. The human still reviews, approves, modifies, and signs off. This is augmentation, not replacement."

---

### Act 7: Export & Handoff (30 seconds)

**Action:** Click "Export JSON"

**Say:**
> "The plan can be exported as JSON for system integration, or we could add PDF export for stakeholder sharing."

**Action:** Show downloaded file briefly

**Say:**
> "This goes directly to copywriters, channel managers, and project managers. No additional clarification meetings needed."

---

## Q&A Prep

**Q: What if the brief is complete with no gaps?**  
A: The AI will say "Your brief has enough information to generate a plan!" and you can skip straight to plan generation. The questions step is only needed when gaps exist.

**Q: Can the user edit the plan?**  
A: In this prototype, no — but a production version would support inline editing and regeneration of specific sections. The focus here is showing AI's ability to generate quality plans, not editing workflows.

**Q: What about multi-language or multi-market campaigns?**  
A: Great question. This prototype handles single-market campaigns. For multi-market, we'd need to extend the schema to support region-specific messaging, budget allocations, and compliance rules. The AI reasoning logic would still work — it's a data model extension, not a fundamentally different problem.

**Q: How accurate is the QA validation?**  
A: We've tested with ~20 brief/plan pairs. It catches 90%+ of semantic misalignments (audience mismatch, budget conflicts, missing channels). It's not perfect, but it's better than no automated QA.

**Q: Can this integrate with real platforms like LinkedIn Ads or Google Ads?**  
A: Not in this prototype — that's intentionally out of scope. But the structured plan output (JSON) could feed into platform APIs for automated campaign setup. That's a natural next step for production.

**Q: What's the ROI?**  
A: For an enterprise marketing team running 50 campaigns per quarter:
> - Time saved: 50 campaigns × 1 day = 50 days per quarter
> - Cost saved (assuming $100/hour loaded cost): 50 days × 8 hours × $100 = $40,000/quarter
> - Quality improvement: Fewer misalignments caught post-launch (each fix costs ~2-4 hours)

---

## Backup Scenarios

**If AI is slow (>30 seconds):**
- "GPT-4 is doing heavy reasoning here — comparing the brief against best practices, generating structured JSON, ensuring consistency across channels. This is the trade-off for quality."

**If AI returns an error:**
- Have a pre-generated plan ready to show: "Let me show you a plan we generated earlier..."
- Or: Refresh and try the B2C Retail sample instead

**If someone wants to see a different brief:**
- Click "Start New Campaign" → Load B2C Retail Sample
- Show how the tool adapts to B2C vs B2B (different channels, different tone, different metrics)

---

## Key Talking Points to Emphasize

1. **AI surfaces gaps before meetings** — saves 2-3 hours of back-and-forth
2. **Structured, executable plans** — not summaries, but actual deliverables
3. **QA catches errors before launch** — semantic validation, not just formatting
4. **Human stays in control** — AI augments, doesn't replace
5. **Transparent assumptions** — AI documents what it assumed when info was missing

---

## Closing

**Say:**
> "This is a 5-day hackathon prototype, but it demonstrates a core capability: AI can do structured reasoning over marketing strategy and turn ambiguous inputs into actionable plans. The next version could add plan editing, multi-turn clarification, auto-fix for QA issues, and integration with campaign platforms. But the core value is here: faster, more consistent campaign planning with fewer misalignments."

**Thank judges for their time.**

---

**Total Demo Time:** 5-7 minutes  
**Recommended Practice Runs:** 2-3 times before presenting
