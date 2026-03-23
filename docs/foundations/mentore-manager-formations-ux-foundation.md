# Mentore Manager: Formations Feature — UX Foundation Document

**Version:** 1.0  
**Last Updated:** March 2026  
**Purpose:** This document establishes the foundational user understanding, product philosophy, and design principles for Mentore Manager's Formations feature. It serves as the permanent reference for all development decisions.

---

## 1. Product Mission & Philosophy

### 1.1 What Mentore Manager Is

Mentore Manager is not compliance software. It is not project management software. It is not a document repository.

**Mentore Manager is a guide that holds the user's hand through Qualiopi compliance.**

### 1.2 The North Star

Every feature, every screen, every interaction must pass this test:

> "Could a teenager use this on the first try without knowing anything about professional training or Qualiopi, and still feel guided by the app?"

If the answer is no, the design is wrong.

### 1.3 The User Promise

When a formation manager uses Mentore Manager, they should subconsciously think:

1. **"If I had a magic wand, this is what the app should do for me."**  
   → The app anticipates needs and acts proactively
   
2. **"I hope our competitors don't find this app—it's too good."**  
   → The app creates genuine competitive advantage

### 1.4 The Business Model: Productive Dependency

Mentore Manager succeeds when it creates three interdependent feelings:

- **Dependency:** "I can't imagine managing formations without this"
- **Confidence:** "I know everything is working as it should; I feel soothed"
- **Control:** "I am in command of my formations; nothing surprises me"

This is not addiction through artificial engagement. This is utility so profound that reverting to the old way becomes unthinkable.

---

## 2. Understanding the End User

### 2.1 Who They Are

**Primary User Profile: Marie, 34, Administrative Manager**

- Works at a mid-sized professional training organization
- Manages 10-20 formations simultaneously at different lifecycle stages
- No formal training in pedagogy or compliance—learned on the job
- Reports to a director who cares about audit outcomes, not daily processes
- Works with educators, clients, and learners across multiple channels (email, phone, in-person)

**Key Demographics:**
- Age: 28-50
- Education: Often administrative background, not necessarily higher education
- Tech comfort: Uses email, Google Drive, Excel—not power users
- Tenure: 2-10 years in the role, many inherited existing processes
- Work environment: Office-based, frequent interruptions, context switching

### 2.2 What They Actually Do All Day

**Morning (7:45 AM - 10:00 AM):**
- Opens email: client questions, educator requests, deadline reminders
- Checks upcoming sessions: room confirmations, material availability
- Responds to urgent requests: "Did you send the convention?" "Where's the attendance sheet?"
- Mental load: "What am I forgetting? What's going to blow up today?"

**Midday (10:00 AM - 2:00 PM):**
- Phone calls with clients about contracts, schedules, changes
- Preparing materials for upcoming sessions (printing, emailing)
- Chasing missing documents (signatures, evaluations, attendance)
- Putting out fires: educator cancellation, room double-booking, learner complaint

**Afternoon (2:00 PM - 5:30 PM):**
- Data entry: updating records, filing documents
- Planning future formations: scheduling, educator assignment
- Meeting with director: "Are we ready for the audit?"
- End-of-day anxiety: "Did I miss anything critical? Will tomorrow be a disaster?"

**Constant throughout:**
- Context switching between 10-20 formations
- Never quite sure if something is forgotten
- Feeling reactive, not proactive
- Stress about audit readiness

### 2.3 Their Emotional Journey

#### The Pain They Feel Every Day

**Anxiety:**
- "Am I forgetting something important?"
- "Will the auditor find a gap I didn't know existed?"
- "Is this formation going to cause a problem?"

**Overwhelm:**
- Too many formations, too many statuses, too many details
- Every formation feels like juggling multiple balls
- Can't hold the full picture in their head

**Lack of Control:**
- Reactive, not proactive—always responding to crises
- Surprised by deadlines they didn't see coming
- Dependent on others (educators, clients) who don't respond on time

**Professional Insecurity:**
- "Am I doing this right?"
- "What if I'm missing something obvious?"
- "Other centers seem to have this figured out; why is it so hard for me?"

#### What They Want to Feel

**Peace of Mind:**
- "I can trust that nothing is falling through the cracks"
- "The system has my back"
- "I can go home and not worry about tomorrow"

**Competence:**
- "I know what I'm doing"
- "I'm on top of this"
- "I could handle an audit today"

**Control:**
- "I know exactly what needs my attention and what doesn't"
- "I'm ahead of problems, not behind them"
- "I decide what to work on, not the chaos"

**Validation:**
- "I'm making progress"
- "The work I'm doing is actually moving things forward"
- "I'm good at my job"

### 2.4 Their Mental Models

**How They Think About Formations:**

❌ **NOT:** "This is a project with phases, milestones, and deliverables"  
✅ **YES:** "This is a thing I need to tend, like a garden—some need water today, some are thriving, some have problems developing"

❌ **NOT:** "Let me check the Déploiement phase tasks"  
✅ **YES:** "What's happening with this formation this week?"

❌ **NOT:** "I need to review all documentation status"  
✅ **YES:** "Is this formation okay or do I need to worry?"

**Time-Based Thinking:**
- Overdue → Fire to put out
- Today/This Week → Must handle
- Coming Soon → Prepare for
- Future → Ignore for now
- Complete → Reassurance

**Health-Based Thinking:**
- Green → On track, no attention needed
- Yellow → Minor issues, keep an eye on it
- Red → Critical gaps, needs immediate action
- Grey → Blocked/waiting, nothing I can do right now

---

## 3. The Formation Lifecycle & Qualiopi Reality

### 3.1 What Qualiopi Actually Requires

**Qualiopi is France's national quality certification for professional training organizations.**

For each formation, organizations must prove compliance across three audit phases:

**Phase 1: Conception (Design)**
- Program curriculum defined and validated
- Educational objectives documented
- Training contract/convention signed with client
- Pre-formation communication plan

**Phase 2: Déploiement (Delivery)**
- Attendance tracking for all sessions (signed sheets)
- Educational materials provided to learners
- Session schedules documented
- Educator qualifications verified

**Phase 3: Évaluation (Evaluation)**
- Post-training satisfaction surveys ("évaluations à chaud")
- Skills assessment results
- Final pedagogical and financial report
- Complete dossier archiving

**Audit Consequences:**
- Certification valid 3 years, renewable
- Random audits can happen at any time
- Missing documentation = non-compliance = potential certification loss
- Certification loss = can't access public training funds = business death

### 3.2 Why This Creates Stress

**The Uncertainty:**
- Auditors can ask for any formation's documentation at any time
- Users never know which formations will be examined
- Gaps discovered during audit = immediate crisis
- No time to "fix" things—either the proof exists or it doesn't

**The Complexity:**
- Different formations at different lifecycle stages simultaneously
- Each phase has multiple required documents
- Compliance is binary: either you have it or you don't
- Small administrative errors = major compliance gaps

**The Stakes:**
- Organizational survival depends on certification
- Formation managers are personally responsible for compliance
- Boss cares about the outcome, not the daily struggle
- Failure = professional embarrassment, potential job risk

### 3.3 Current Software Failures

**Why Existing Tools Don't Work:**

1. **They're built for experts who already understand Qualiopi**  
   → Assume users know what "Critère 3.2" means
   
2. **They're organized around audit structure, not user workflow**  
   → Force users to navigate by phase when they're thinking "what's urgent?"
   
3. **They're passive databases, not active assistants**  
   → Show information, don't tell users what to DO
   
4. **They create anxiety through overwhelming displays**  
   → Every formation shows every detail, every status, every deadline
   
5. **They don't celebrate progress or build confidence**  
   → Red X's and "missing" labels everywhere, no positive reinforcement

**Result:** Users create parallel systems (Excel, Google Drive, paper notebooks) because the software doesn't match their needs.

---

## 4. Core UX Principles for Mentore Manager

### 4.1 Status-First, Not Data-First

**Anti-Pattern:**  
Show comprehensive information and let users determine what matters.

**Correct Pattern:**  
Immediately communicate health status, then progressively disclose details only as needed.

**Application:**  
When a user opens a formation, the first thing they see must answer: "Is this okay or not?" Everything else is secondary.

---

### 4.2 Proactive Intelligence, Not Passive Display

**Anti-Pattern:**  
Display all tasks/documents/deadlines and let users figure out priorities.

**Correct Pattern:**  
The app watches each formation and surfaces what needs attention NOW, hiding what doesn't.

**Application:**  
- Session tomorrow → App pre-generates attendance sheet, reminds educator
- Document uploaded → App automatically checks it off, updates compliance
- Deadline approaching → App escalates visibility from background to foreground
- No action needed → App confirms "everything on track," user can move on

**Principle:**  
If the app CAN do something proactively, it SHOULD do it. Users should never manually track what a system can track automatically.

---

### 4.3 Context-Appropriate Urgency

**Anti-Pattern:**  
Treat all incomplete items as equally important.

**Correct Pattern:**  
Visual hierarchy reflects actual urgency—critical items dominate, routine items recede.

**Application:**  
- Overdue document for session tomorrow → Large, red, impossible to miss
- Task due next week → Visible but calm
- Future task → Subtle reminder, easily ignored
- Completed item → Quiet confirmation, fades to background

**Principle:**  
The interface should feel as stressed or calm as the user should be about that item.

---

### 4.4 Reward Completion, Don't Punish Incompletion

**Anti-Pattern:**  
Red X's, "missing" labels, negative framing that makes users feel behind.

**Correct Pattern:**  
Progress indicators celebrate what's done, gently surface what remains.

**Application:**  
- Formation reaches 100% compliance → Visual celebration, "Audit-ready!" confirmation
- Phase completes → Brief satisfaction moment, "Phase complete, moving to next"
- Task completed → Checkmark, subtle positive feedback
- Task incomplete → Neutral framing, "Next step ready when you are"

**Principle:**  
Users should feel accomplished for progress made, not guilty for what's left. The app is encouraging, not nagging.

---

### 4.5 Progressive Disclosure: Show Only What's Needed

**Anti-Pattern:**  
Show all information because "users might need it."

**Correct Pattern:**  
Start with minimum viable information, provide clear paths to deeper detail.

**Application:**  
- Default view: Health status + what needs attention now
- One click: Full timeline view with all tasks
- Another click: Complete documentation/details for specific item

**Principle:**  
Information should be available, not visible. The default view should be scannable in seconds, not minutes.

---

### 4.6 Smart Defaults, Zero Configuration

**Anti-Pattern:**  
Require users to set up systems, configure preferences, define templates.

**Correct Pattern:**  
The app knows what's needed and does it automatically, based on formation context.

**Application:**  
- New formation created → App auto-generates checklist based on formation type
- Session scheduled → App auto-creates attendance sheet requirement with deadline
- Phase completes → App auto-unlocks next phase tasks
- Document uploaded → App auto-recognizes type and files accordingly

**Principle:**  
The app should work perfectly with zero setup. Smart behavior is default, not optional.

---

### 4.7 Educational Through Use, Not Documentation

**Anti-Pattern:**  
Assume users need training or manuals to understand Qualiopi.

**Correct Pattern:**  
The interface teaches Qualiopi structure naturally through daily use.

**Application:**  
- User sees phases (Conception, Déploiement, Évaluation) in context of their work
- Phase transitions explain what's changing: "Conception complete. Starting Déploiement."
- Document requirements appear with brief context: "Convention needed for client signature"
- Over time, users absorb Qualiopi logic without studying it

**Principle:**  
Users should become Qualiopi-competent by using the app, not by reading about it.

---

### 4.8 Peace of Mind as Primary Goal

**Anti-Pattern:**  
Maximize engagement, screen time, feature usage.

**Correct Pattern:**  
Minimize anxiety, maximize confidence, optimize for quick check-in + exit.

**Application:**  
- User opens formation, sees green "on track" → Feels relief, closes app, moves on
- User opens formation, sees one clear action → Handles it immediately, feels accomplished
- User checks all formations → System confirms "nothing urgent today" → Can focus elsewhere

**Principle:**  
Success is NOT users spending more time in the app. Success is users feeling confident in LESS time.

---

## 5. Formations Feature: Design Mandate

### 5.1 The Core User Question

When a formation manager opens a specific formation, they have ONE primary question:

> **"Is this formation okay or do I need to do something?"**

The interface must answer this question in less than 3 seconds of visual scanning.

**Secondary questions (only if needed):**
- What specifically needs my attention?
- When is it due?
- What do I need to do about it?
- Where do I get more details if I want them?

### 5.2 The Three Essential States

Every formation exists in one of three states at any moment:

**STATE: On Track**
- All current requirements met
- No immediate action needed
- Next milestone clear and prepared

**User need:** Reassurance + quick exit  
**App response:** "Formation healthy. Next session [date]. Nothing needs attention."  
**User action:** None—closes and moves on

---

**STATE: Needs Attention**
- One or more items require action
- Deadline approaching or recently passed
- Action is possible and within user's control

**User need:** Know what to do + be able to do it quickly  
**App response:** "Action needed: [specific item]. Due [date]. [Quick action buttons]"  
**User action:** Handles the task or schedules it

---

**STATE: Blocked/Waiting**
- Action required but not from user (client signature, external approval)
- User has done their part
- System is tracking the wait

**User need:** Know it's not their fault + know when to follow up  
**App response:** "Waiting on [external party] since [date]. Auto-reminder sent."  
**User action:** None or manual reminder if needed

### 5.3 Information Architecture Principles

**Primary Organization: TIME + URGENCY**
- What needs doing NOW
- What's coming SOON  
- What's COMPLETE
- What's BLOCKED

**Secondary Context: PHASE**
- Phases (Conception, Déploiement, Évaluation) provide structure
- But don't organize the default view by phase
- Phase context appears as supporting information, not primary navigation

**Tertiary Detail: DOCUMENTATION**
- Full task lists, document archives, session history
- Available on demand, not displayed by default

**Mental Model:**
Think of it like a newspaper:
1. Headline → "Formation okay or not?"
2. Lead paragraph → "What's the story today?"
3. Full article → "Complete context when I need it"
4. Archive → "Reference material for deep dive"

### 5.4 The Proactive Assistant Mandate

The app must behave like an assistant who has been watching this formation and knows what needs to happen next.

**Before Every Session:**
- Check: Attendance sheet ready? Educator confirmed? Materials prepared?
- Surface: Any missing items, with quick-action buttons
- Generate: Pre-fill attendance template if needed
- Remind: Auto-message educator 24 hours before

**After Every Session:**
- Prompt: "Upload attendance sheet for [session]"
- Track: If not uploaded within 3 days, escalate to primary attention
- Verify: Count signatures if digital upload possible

**Approaching Deadlines:**
- 1 week before: Appear in "coming soon" area
- 3 days before: Move to primary attention zone
- Overdue: Red flag, top priority with suggested recovery actions

**Phase Transitions:**
- Recognize when phase completes
- Celebrate: "Conception complete! Moving to Déploiement."
- Unlock: Next phase tasks automatically appear
- Guide: "First task: Prepare for Session 1 on [date]"

**Document Intelligence:**
- User uploads file → App recognizes what it is (convention, attendance, evaluation)
- Auto-file: Places in correct category
- Auto-check: Marks corresponding requirement complete
- Auto-update: Recalculates compliance score

**Smart Suggestions:**
- Missing document? → "Generate from template" button appears
- Waiting on signature? → "Send reminder to [contact]" button appears
- All tasks complete? → "Mark phase complete" option appears

### 5.5 Visual Hierarchy Mandate

**80% of screen space = What matters right now**
- Health indicator
- Primary attention zone (urgent items or "all good" confirmation)
- Quick actions

**20% of screen space = Access to everything else**
- Links to detailed views
- Secondary information
- Archive/reference access

**Principle:**  
Users should be able to complete the most common actions without scrolling, without clicking into secondary views, without hunting.

### 5.6 Celebration & Progress Philosophy

**What "rewarding" means in this context:**

❌ NOT: Gamification, points, leaderboards, cartoon characters  
✅ YES: Visceral satisfaction from progress naturally made visible

**Examples:**
- Progress bar filling as tasks complete (not by user action, but by work naturally done)
- Formation reaching 100%: Beautiful visual confirmation + "Audit-ready" badge
- Phase completing: Brief moment of satisfaction, transition animation
- Going home with all formations green: Deep sense of professional confidence

**The reward is:**
- Peace of mind
- Professional confidence
- Time saved
- Stress reduced
- Feeling of competence

**Principle:**  
Fun is not entertainment. Fun is the satisfaction of complex work made simple.

---

## 6. Success Criteria & Anti-Patterns

### 6.1 How We Measure Success

**Metric 1: Time to Status Assessment**
- User opens formation → sees health status in < 3 seconds
- If action needed → understands what to do in < 10 seconds

**Metric 2: Action Immediacy**
- For urgent tasks, can user complete action without navigating away?
- Target: 80% of routine actions completable from main view

**Metric 3: Confidence Level (Qualitative)**
- User closes app → feels confident nothing forgotten
- User approaches audit → feels prepared, not anxious
- User recommends to colleague → "This changed my life"

**Metric 4: Dependency Creation**
- User asked to use old system → visceral resistance
- User on vacation → checks app "just to make sure"
- User's boss asks for status → can answer immediately

**Metric 5: Zero-Surprise Rate**
- Number of times user discovers overdue task they didn't know about → target: zero
- Number of times auditor finds gap user wasn't aware of → target: zero

### 6.2 Anti-Patterns to Avoid

**❌ The Dashboard Fallacy**
- Mistake: Show comprehensive metrics dashboard with charts/graphs
- Why wrong: Users don't want analytics, they want action clarity
- Correct: Simple health indicators + next action

**❌ The Feature Creep Trap**
- Mistake: Add features because they "might be useful"
- Why wrong: Each feature adds cognitive load
- Correct: Only add features that reduce user effort

**❌ The Customization Illusion**
- Mistake: Let users configure views, preferences, layouts
- Why wrong: Choice is burden; smart defaults are better
- Correct: One perfect default experience for everyone

**❌ The Completionist Anxiety**
- Mistake: Show all incomplete items as equal priorities
- Why wrong: Creates overwhelm and paralysis
- Correct: Show only what's urgent, hide the rest

**❌ The Project Manager Mindset**
- Mistake: Organize around phases, milestones, deliverables
- Why wrong: Users aren't managing projects, they're tending formations
- Correct: Organize around time, urgency, health

**❌ The Expert Assumption**
- Mistake: Use Qualiopi terminology without context
- Why wrong: Users are learning Qualiopi through use
- Correct: Use clear language, teach structure implicitly

**❌ The Notification Spam**
- Mistake: Alert for every minor event
- Why wrong: Users tune out noise, miss real urgency
- Correct: Only surface what truly needs immediate attention

**❌ The Delayed Intelligence**
- Mistake: Wait for user to ask before offering help
- Why wrong: Users don't know what they don't know
- Correct: Proactively surface what's needed before they realize it

---

## 7. Implementation Guidance for Development

### 7.1 When Making Any Design Decision

**Ask these questions:**

1. **Could a teenager understand this in 3 seconds?**  
   If no → simplify

2. **Does this reduce anxiety or create it?**  
   If creates → redesign

3. **Is this showing what the user needs NOW or just what's available?**  
   If just available → hide it

4. **Can the app do this automatically instead of asking the user?**  
   If yes → automate it

5. **Does this feel like a helpful assistant or a demanding taskmaster?**  
   If demanding → reframe

### 7.2 The "Magic Wand" Test

For any feature or interaction:

> "If the user had a magic wand, would they want the app to do this for them?"

If yes → that's the right feature  
If no → question whether it should exist

### 7.3 The "Competitor Fear" Test

For the overall experience:

> "Would a competitor be worried if they saw this?"

If yes → on the right track  
If no → not differentiated enough

### 7.4 Priority Hierarchy

When features conflict or resources are limited:

1. **Reduce anxiety** (most important)
2. **Provide clarity** (what to do next)
3. **Enable action** (make it easy to do)
4. **Celebrate progress** (build confidence)
5. **Provide detail** (for those who want it)

Never sacrifice 1-3 for 4-5.

---

## 8. Conclusion: The Formations Experience Promise

**What we're building:**

A formation detail experience where a manager can:
- Open any formation and know its health in 3 seconds
- See exactly what needs attention and when
- Take action immediately without hunting through views
- Feel confident that nothing is being forgotten
- Close the app and go home without anxiety
- Become Qualiopi-competent through daily use
- Wonder how they ever managed formations before

**What we're NOT building:**

- Comprehensive project management software
- Document repository with search
- Analytics dashboard with metrics
- Customizable workflow engine
- Training/educational platform

**The test of success:**

When a formation manager finishes their workday and thinks:

> "Everything's under control. I know exactly what needs doing. Tomorrow will be fine."

That's when we've succeeded.

---

**End of Document**

*This document should be consulted before any Formations feature development, UI design, or user flow creation. The principles here are foundational and should not change unless fundamental user research reveals new insights about formation managers' needs.*
