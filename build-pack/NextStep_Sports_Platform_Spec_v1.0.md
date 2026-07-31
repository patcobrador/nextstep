---
title: "Next Step Sports Platform"
subtitle: "Business, Product and Technical Specification"
author: "Next Step Sports"
date: "29 July 2026"
version: "1.0"
status: "Founder-aligned build specification"
---

# Next Step Sports Platform

**Business, Product and Technical Specification**  
**Version:** 1.0  
**Date:** 29 July 2026  
**Initial sport:** Basketball  
**Initial audience:** Athletes approximately U8-U12 and their parents/caregivers  
**Initial launch market:** Sydney, Australia, with a founder-led pilot in the North Shore/Hornsby area  
**Primary implementation target:** Responsive web application / installable PWA, with a native mobile application later

> **One-line product definition:** Next Step is a guided youth-sports development platform that turns a comprehensive curriculum into prescribed home practices, verified skill progression and a lifelong private athlete passport.

---

## 1. How to use this specification

This document is intended to be the shared source of truth for product, design, curriculum, engineering, data, security, operations and go-to-market agents.

The following labels are authoritative:

- **[DECISION]** A founder-aligned product or architecture decision. Build agents must not change it without an Architecture Decision Record (ADR) and explicit product approval.
- **[ASSUMPTION]** A practical choice made to create a buildable v1. It may be changed through an ADR when evidence supports a better choice.
- **[OPEN]** A decision that remains unresolved. Agents should preserve configurability rather than hard-code an answer.
- **[OUT OF SCOPE]** Deliberately excluded from the relevant release.

Requirement words have their standard meaning:

- **MUST**: required for release acceptance.
- **SHOULD**: expected unless a documented reason prevents it.
- **MAY**: optional.

When this document conflicts with a companion machine-readable contract, the precedence is:

1. This specification's **[DECISION]** statements.
2. The current accepted ADRs.
3. `contracts/openapi.yaml` for API shape.
4. `data/schema.prisma` for persistence shape.
5. Current implementation.

The implementation must remain traceable to requirement IDs in this document.

---

## 2. Executive summary

Young athletes and their parents can find thousands of drills online, but they rarely have a reliable answer to five basic questions:

1. What should the athlete learn next?
2. What should they practise today?
3. Is the athlete performing the skill correctly?
4. Has the skill genuinely improved or merely been attempted?
5. How does today's work connect to the athlete's development over several years?

Most sports-training products solve only one part of this problem: content, measurement, video feedback, team administration or live coaching. Next Step's core opportunity is to connect those pieces around a **versioned curriculum graph and an athlete-specific pathway**.

The platform begins with basketball for U8-U12 athletes. A parent creates a private athlete profile and completes a short baseline. The product then prescribes a fundamentals campaign. Each training session is a guided sequence of age-appropriate activities, not an open video library. Practice data updates a visual skill tree. Selected checkpoints require a short private video; larger milestones can require a live Next Step coach assessment. Passing a checkpoint unlocks the next section of the pathway and adds a verified achievement to the athlete passport.

The initial wedge is deliberately narrow:

- basketball first;
- U8-U12 first;
- parent-led, at-home practice first;
- a prescribed pathway before open exploration;
- asynchronous video assessment before a large in-person marketplace;
- Sydney founder-led coaching operations before geographic expansion.

The long-term product is sport-agnostic. The platform engine manages households, athletes, curricula, practices, progression, evidence, assessments, coaches, organisations and payments. Each sport is introduced as a versioned **sport pack** containing its skill taxonomy, drill library, progression rules, safety guidance and rubrics.

![Next Step product loop](diagrams/product_loop.png)

---

## 3. Founder-aligned concept

### 3.1 Confirmed decisions from the product discussion

- **[DECISION]** Next Step is not merely a drill catalogue. It is an athlete-development pathway.
- **[DECISION]** The first sport is basketball.
- **[DECISION]** The first age focus is approximately U8-U12. Progression is ability-based, not rigidly age-gated.
- **[DECISION]** The curriculum must be comprehensive across athleticism, ball handling, dribbling, passing, receiving, shooting, finishing, footwork, defence, rebounding, decision-making, game understanding and practice habits.
- **[DECISION]** The child and parent should feel visible progress after repeated practice, without turning every interaction into points, coins or competition.
- **[DECISION]** The early experience is guided. The system prescribes a coherent sequence rather than exposing an unrestricted “open world” of drills.
- **[DECISION]** Choice appears at controlled branch points, such as choosing a recommended focus between dribbling, shooting or athleticism, while the platform maintains curriculum balance.
- **[DECISION]** The visual skill tree is also the progress view. It shows what is mastered, active, available and locked.
- **[DECISION]** Tapping a skill node opens a contextual skill-detail flow and its recommended practice; it does not default to a free-form “add any drill to a queue” experience.
- **[DECISION]** Frequent practice should be low friction. Verification happens occasionally, not after every activity.
- **[DECISION]** Early verification can use short video evidence. More advanced or significant milestones can use in-person coach assessment at longer intervals.
- **[DECISION]** Next Step coaches use standard rubrics so that assessment quality does not depend solely on an individual coach's opinion.
- **[DECISION]** The platform should eventually support a network of coaches, organisations and multiple sports around a common athlete record.
- **[DECISION]** The athlete passport is private by default and accumulates practices, feedback, verified milestones and development history over time.

### 3.2 Recommended decisions added to make v1 buildable

- **[ASSUMPTION]** A parent/caregiver owns the account. Children do not create independent accounts in the MVP.
- **[ASSUMPTION]** The MVP is an installable responsive PWA. Native iOS/Android applications follow after product validation.
- **[ASSUMPTION]** Production evidence uses direct private upload rather than public or unlisted video links. External links may be tolerated only in a controlled internal alpha.
- **[ASSUMPTION]** The initial technical deployment is in the AWS Sydney region to support operational familiarity and data-residency control.
- **[ASSUMPTION]** The MVP uses a modular monolith, not microservices.
- **[ASSUMPTION]** The first commercial model combines a family subscription with separately priced coach assessments.
- **[ASSUMPTION]** The first pilot uses existing Next Step families and local basketball relationships before a broad consumer launch.

---

## 4. Vision, mission and product promise

### 4.1 Vision

Every young athlete has a clear, trusted pathway to develop their potential, regardless of whether they have constant access to an elite private trainer.

### 4.2 Mission

Help families practise the right skills, in the right sequence, with the right feedback, while giving coaches a common system for guiding and verifying development.

### 4.3 Product promise

For every active athlete, Next Step should answer:

- **Where am I now?** A clear, private skill and progress profile.
- **What should I do today?** A prescribed, achievable practice.
- **How do I perform it safely?** Child-friendly demonstrations, cues and parent guidance.
- **How do I know it is improving?** Practice history, observable rubrics and periodic verification.
- **What comes next?** Explicit prerequisites, milestones and unlocked pathways.

### 4.4 Positioning statement

For parents of young athletes who want structured development outside formal team training, Next Step is a youth-sports learning and progression platform that converts a comprehensive curriculum into guided practices and verified milestones. Unlike a video library or isolated coaching app, Next Step maintains the athlete's pathway and long-term development record.

---

## 5. Product principles

1. **Curriculum before content.** Every drill must serve a defined learning objective and progression rule.
2. **Guided before open-ended.** Minimise parent decision fatigue in early stages.
3. **Mastery before completion theatre.** Watching a video or tapping “done” is not equivalent to learning.
4. **Practice often, assess occasionally.** Keep the daily loop easy while preserving credible checkpoints.
5. **Fundamentals before specialisation.** Build movement quality, bilateral coordination and transferable game skills.
6. **Ability bands before rigid age gates.** Age guides safety and language; demonstrated readiness controls progression.
7. **Parent-supported, child-centred.** Instructions serve both the adult facilitator and the young athlete.
8. **Private by default.** No public child profiles, public leaderboards, discoverable videos or unsolicited coach contact.
9. **Human accountability in the critical loop.** Automated analysis may assist later, but high-impact mastery decisions remain explainable and reviewable.
10. **Progress without unhealthy pressure.** Celebrate consistency and improvement; avoid status mechanics that shame, rank or overtrain children.
11. **Sport packs, not sport-specific platform code.** The core engine must support future sports through data and configuration.
12. **Operational quality is a product feature.** Coach screening, rubric calibration, response times and safeguarding materially affect trust.

---

## 6. Problem definition

### 6.1 Parent problems

- Online content is fragmented and varies widely in quality.
- Parents do not know which drill is developmentally appropriate or what sequence to follow.
- It is difficult to distinguish poor execution from insufficient repetition.
- Team practices cannot individualise every child's development.
- Private coaching can be expensive, geographically constrained and inconsistent.
- Progress is usually remembered informally rather than recorded longitudinally.
- Parents may unintentionally overcoach, skip foundations or overtrain one skill.

### 6.2 Athlete problems

- Practice can feel random and disconnected from a bigger goal.
- Improvement is hard to see between games.
- Feedback is often vague: “work harder,” “dribble more,” or “use your left hand.”
- Children may repeat a comfortable skill instead of addressing a prerequisite.
- Traditional ranking can make beginners feel behind before they have built confidence.

### 6.3 Coach problems

- Coaches repeatedly explain the same fundamentals without a shared curriculum.
- Remote feedback arrives through unstructured messages and links.
- Assessment quality varies across coaches.
- Coaches lack a concise history of what an athlete has practised and previously been told.
- Scheduling, payments, evidence and feedback are spread across unrelated tools.

### 6.4 Organisation problems

- Clubs have no consistent development framework across teams and volunteer coaches.
- Athlete development data is not portable between seasons.
- Content and coaching standards are difficult to govern.
- Program outcomes are measured by attendance rather than skill progression.

---

## 7. Target users and jobs to be done

### 7.1 Primary buyer: committed parent/caregiver

**Profile:** Parent of a child approximately 6-12 years old who plays organised basketball or is preparing to do so. The parent is willing to support short home sessions but is not necessarily an expert coach.

**Jobs to be done:**

- “Give me a sensible plan so I am not guessing.”
- “Show me exactly how to run a useful 15-30 minute session.”
- “Tell me whether my child is ready to move on.”
- “Let a credible coach check the important things without requiring weekly private lessons.”
- “Help me see development over a season, not just points scored in a game.”

### 7.2 Primary end user: young athlete

**Profile:** Child in the foundation-to-development stage, using a phone or tablet with a parent nearby.

**Jobs to be done:**

- “Show me what to do in a way I can understand.”
- “Let me see that I am getting better.”
- “Give me a clear next challenge.”
- “Do not make me feel bad because another child is ahead.”

### 7.3 Supply-side user: Next Step coach/assessor

**Jobs to be done:**

- “Give me a clear queue of assigned assessments.”
- “Show me the exact rubric and relevant athlete history.”
- “Make feedback quick, consistent and useful.”
- “Handle availability, bookings and payment without private messaging a child.”
- “Help me build a trusted coaching profile based on quality and reliability.”

### 7.4 Internal user: curriculum lead/content editor

**Jobs to be done:**

- “Create and version a comprehensive sport curriculum without deploying code.”
- “Connect skills, prerequisites, drills, safety cues and assessment rubrics.”
- “Preview the athlete experience before publishing.”
- “Measure where athletes stall and revise content without corrupting historical progress.”

### 7.5 Future user: club or academy administrator

**Jobs to be done:**

- assign a program to a cohort;
- monitor engagement and aggregate progression;
- manage coaches and curriculum variants;
- preserve parent control over child information;
- export reports without exposing unnecessary personal data.

---

## 8. Product scope and boundaries

### 8.1 MVP scope

The MVP includes:

- parent authentication and household management;
- one or more private athlete profiles;
- baseline onboarding and recommended starting point;
- one versioned basketball fundamentals curriculum;
- prescribed campaigns and controlled branch choices;
- Dashboard, Skill Tree & Progress, and Practice as the three core destinations;
- skill-detail pages as contextual subflows;
- guided practice sessions with demonstrations, cues, timers/reps and reflection;
- practice history and athlete-skill state transitions;
- short private video evidence for selected checkpoints;
- asynchronous coach review using a standard rubric;
- basic live-assessment booking for major milestones;
- private athlete passport/timeline;
- coach portal;
- curriculum/admin portal;
- family subscription and assessment payments;
- consent, audit, retention and deletion workflows;
- product analytics without advertising trackers.

### 8.2 Explicitly out of scope for MVP

- **[OUT OF SCOPE]** Public social feed.
- **[OUT OF SCOPE]** Public child profiles or searchable athlete directory.
- **[OUT OF SCOPE]** Direct coach-to-child messaging.
- **[OUT OF SCOPE]** Public leaderboards comparing children.
- **[OUT OF SCOPE]** Team chat, game scheduling and scorekeeping.
- **[OUT OF SCOPE]** Fully open drill-plan builder.
- **[OUT OF SCOPE]** Automated computer-vision mastery decisions.
- **[OUT OF SCOPE]** Recruiting, scouting or public highlight reels.
- **[OUT OF SCOPE]** Wearable integrations.
- **[OUT OF SCOPE]** Multiple sports in the production MVP.
- **[OUT OF SCOPE]** Native mobile applications.
- **[OUT OF SCOPE]** Unmoderated coach marketplace discovery.

### 8.3 Strategic non-goals

Next Step is not intended to replace team practices, games, qualified medical advice, strength-and-conditioning professionals or all live coaching. It coordinates the parts of athlete development that can be practised safely at home and creates a common record around those activities.

---

## 9. Competitive frame and differentiation

The comparison below is an illustrative product-category map, not a claim that any competitor is static or incomplete.

| Product/category | Current strength illustrated by public materials | What Next Step deliberately emphasises instead |
|---|---|---|
| HomeCourt | Camera-based basketball drills, interactive challenges, feedback and tracked performance.[^homecourt] | A versioned youth curriculum, prescribed cross-domain pathway, human verification and private longitudinal passport. |
| DribbleUp | Guided live/on-demand workouts connected to smart sports equipment and performance tracking.[^dribbleup] | No required proprietary equipment; progression is organised around measurable curriculum nodes and coaching rubrics. |
| MOJO Sports | Youth coaching content, practice plans and team-management workflows.[^mojo] | Individual athlete mastery and parent-led home practice rather than primarily team administration. |
| Onform | Recording, analysing and sharing sports video for coach feedback.[^onform] | Video is evidence inside a pathway; it is not the product's organising centre. |
| Generic video libraries | Breadth and ease of access. | Sequence, prerequisites, safety, repeatable assessment and retained progress. |
| Private coaching | High-touch individual feedback. | Lower-frequency, standardised verification wrapped around frequent self-paced practice. |

### 9.1 Defensible product layers

1. **Curriculum graph:** a high-quality, versioned map of capabilities and prerequisites.
2. **Progress engine:** athlete-specific state, retention scheduling, unlock rules and evidence confidence.
3. **Practice engine:** converts the graph into short, coherent sessions rather than isolated drills.
4. **Assessment network:** calibrated coaches using common rubrics.
5. **Athlete passport:** a trusted, private history that becomes more valuable over time.
6. **Operational data:** evidence about where children struggle, which cues work and where curriculum sequencing should improve.

### 9.2 Why “sports operating system” is a useful internal metaphor

The phrase does not mean Next Step must immediately contain every sports feature. It means the athlete pathway becomes the common layer through which home practice, private coaching, camps, team programs and future sport packs can interact. Content is one component; the enduring asset is the athlete's development state and the rules that move it forward.

---

## 10. Business model

### 10.1 Commercial model

**[ASSUMPTION]** The initial model is a hybrid of subscription software and services:

1. **Free foundation access**
   - one athlete;
   - onboarding/baseline;
   - a limited starter campaign;
   - basic practice history;
   - no verified coach reviews, or one promotional review.

2. **Family membership**
   - full basketball pathway;
   - multiple athlete profiles within reasonable limits;
   - complete practice history and progress views;
   - parent insights and retention reminders;
   - discounted assessment credits;
   - private passport exports.

3. **Remote assessment fee**
   - short private video reviewed against a fixed rubric;
   - defined service-level target;
   - structured feedback and retry flow.

4. **In-person milestone assessment**
   - booked with an approved Next Step coach;
   - platform-controlled scheduling, payment and rubric;
   - parent/caregiver present under operating policy.

5. **Coach marketplace take rate**
   - applied to paid reviews and bookings;
   - coach sets availability within platform pricing/quality rules;
   - payout is conditional on completed, auditable service.

6. **Future club/academy licence**
   - cohort assignment;
   - organisation-specific campaigns;
   - aggregate reporting;
   - coach administration;
   - parent-controlled sharing.

### 10.2 Initial pricing hypotheses, not final decisions

Pricing must be validated with the pilot rather than hard-coded into product logic.

| Offer | Test range (AUD) | Primary question |
|---|---:|---|
| Family membership | $15-$25/month or discounted annual | Is the ongoing pathway valuable without weekly live coaching? |
| Remote video assessment | $15-$30 each | What price supports coach time while remaining low-friction? |
| In-person milestone assessment | $35-$70 depending on duration/grouping | Can periodic live verification be both trusted and accessible? |
| Marketplace take rate | 15%-25% | What rate covers payments, support, insurance/operations and quality control? |
| Club licence | Per-athlete or cohort pricing | Does the platform improve consistency and retention for organisations? |

### 10.3 Unit-economics drivers

The business must monitor:

- paid-family retention;
- coach minutes per remote assessment;
- assessment rework/appeal rate;
- video storage and delivery cost per active athlete;
- payment-processing costs;
- support contacts per family;
- coach acquisition and verification cost;
- gross margin by subscription, remote assessment and in-person assessment;
- proportion of progression that can occur without paid human review.

A checkpoint model that requires paid review too frequently will create friction and poor unit economics. The curriculum should use human verification only where it materially increases trust or safety.

### 10.4 Go-to-market sequence

1. Founder-led private alpha with existing Next Step families.
2. Closed pilot across local basketball families in the Hornsby/Waitara/North Shore network.
3. Invitation-only coach-assessor network with calibration and WWCC verification.
4. Referral-led consumer beta.
5. Partnerships with selected clubs, camps or development programs.
6. Geographic expansion after safeguarding and assessment operations are proven.
7. Second sport pack only after the platform engine and basketball retention are validated.

### 10.5 North-star metric

**Weekly Progressing Athletes (WPA):** the number of active athletes who complete at least two meaningful practices in a seven-day window and either:

- advance a skill state;
- complete a retention/revisit activity; or
- receive actionable assessment feedback.

This metric balances engagement with actual development. Raw screen time, video views and login streaks are supporting measures, not the goal.

### 10.6 Core business KPIs

- onboarding-to-first-practice conversion;
- first-practice completion rate;
- week 1, week 4 and week 12 family retention;
- median meaningful practices per athlete per week;
- percentage of sessions completed without parent confusion or support contact;
- time from first attempt to node mastery;
- percentage of mastered nodes retained at revisit;
- evidence submission completion rate;
- median coach review turnaround;
- assessment pass/retry distribution by node and coach;
- inter-rater consistency across coaches;
- subscription conversion and churn;
- remote-assessment gross margin;
- parent trust/NPS and child enjoyment score;
- safeguarding incidents and response time.


---

## 11. Product information architecture

### 11.1 Core parent/athlete navigation

The MVP has three persistent top-level destinations:

1. **Dashboard**
2. **Skill Tree & Progress**
3. **Practice**

Assessment, skill detail, passport, account and support are contextual or secondary flows rather than competing primary tabs.

### 11.2 Navigation intent

| Destination | Primary question answered | What it must not become |
|---|---|---|
| Dashboard | “What matters now?” | A dense analytics screen or promotional feed. |
| Skill Tree & Progress | “Where am I, what is next and why?” | An unrestricted drill catalogue. |
| Practice | “What do I do right now?” | A manual session-planning tool in the early product. |
| Skill detail | “What is this capability and how will it be assessed?” | A detached encyclopedia page. |
| Assessment | “How do I prove this checkpoint and receive feedback?” | A public video-sharing experience. |
| Athlete passport | “What has this athlete done and verified over time?” | A public recruiting profile. |

### 11.3 Product modes

The same application supports two presentation modes:

- **Parent mode:** planning, explanations, consent, settings, payments, detailed progress, coach feedback and history.
- **Practice mode:** large controls, minimal text, spoken/visual cues, timers and child-friendly progress. Parent mode remains accessible behind a deliberate control.

No independent child login is required in the MVP.

---

## 12. Core domain model

![High-level domain model](diagrams/domain_model.png)

### 12.1 Product taxonomy

The following terms are canonical and must be used consistently in product copy, code and data:

- **Sport:** A top-level discipline, such as basketball.
- **Sport pack:** The publishable collection of curriculum, drill media, rubrics and safety metadata for one sport.
- **Curriculum version:** An immutable published version of the sport's development model.
- **Domain:** A broad capability area, such as ball handling or movement.
- **Stage:** An ability band spanning multiple domains, such as Foundation or Builder.
- **Campaign:** A prescribed cross-domain progression sequence within a stage.
- **Skill node:** An atomic, observable capability that can move through progression states.
- **Milestone:** A checkpoint that aggregates or validates several skill nodes and may require coach assessment.
- **Drill:** A repeatable practice activity linked to one primary and optionally several supporting skill nodes.
- **Practice plan:** A generated prescription for a particular athlete and date/context.
- **Practice session:** The athlete's actual execution of a plan.
- **Attempt:** A recorded effort within a practice step, including result or reflection where applicable.
- **Evidence:** Parent-authorised media or structured observation submitted for a checkpoint.
- **Assessment:** A rubric-based decision made by an authorised reviewer or coach.
- **Mastery:** A state supported by configured completion rules and, where required, verified assessment.
- **Revisit:** A scheduled retrieval check intended to confirm retention.
- **Athlete passport:** The private longitudinal view of practices, milestones, feedback and verified progression.

### 12.2 Separation of curriculum and athlete state

Curriculum data describes what should be learned. Athlete state describes what a particular athlete has done and what the system believes they are ready to do next. Published curriculum versions are immutable so historical progress remains explainable.

When a curriculum changes:

- a new curriculum version is published;
- existing athlete progress remains attached to the prior node/version;
- a migration map may recognise equivalent nodes in the new version;
- no previously verified milestone is silently removed;
- the parent sees a plain-language explanation when a pathway changes.

### 12.3 Sport-agnostic platform rule

The platform core must not contain hard-coded basketball assumptions such as “dominant hand,” “layup” or “three-point line.” Those concepts belong to sport-pack metadata and rubrics. Core services may support generic concepts such as laterality, equipment, space, repetitions, time, distance, evidence angle and safety constraints.

---

## 13. Curriculum framework

### 13.1 Stages

The first basketball pack uses four ability stages. The names are working product labels and must be configurable.

| Stage | Typical profile | Development emphasis |
|---|---|---|
| Foundation | Newer U8-U10 athlete or any athlete missing core prerequisites | Movement literacy, bilateral ball familiarity, safe stops/landings, simple passing and close-range scoring. |
| Builder | Athlete who controls basic movements without constant prompting | Movement with the ball, footwork combinations, basic pressure, reliable passing/finishing on both sides. |
| Player | Often U10-U12, ready to combine skills and read simple advantages | Change of pace/direction, catch decisions, finishing options, closeouts, spacing and small-sided reads. |
| Competitor | Advanced U12 pathway and later extension | Execution under pressure, role flexibility, constraint-led decisions, physical preparation and game transfer. |

Age affects language, load, equipment and safety, but does not automatically award or block a stage.

### 13.2 Basketball domains

The v1 curriculum must support the following domains:

1. **Movement & Athletic Foundations**
   - stance, balance, coordination, acceleration, deceleration, change of direction, jumping, landing, lateral movement and body control.

2. **Ball Mastery & Dribbling**
   - hand comfort, force control, protection, direction changes, pace changes, retreat, combination moves and two-ball variants where appropriate.

3. **Passing & Receiving**
   - ready hands, target, pass selection, accuracy, receiving on balance, pivoting, passing on the move and decision timing.

4. **Shooting**
   - stance, alignment, hand placement, force generation, close-range form, catch footwork, balance, repeatability and progressively game-like attempts.

5. **Finishing & Footwork**
   - jump stop, stride stop, pivots, layup coordination, both-side finishing, inside/outside hand, power finish, extension and basic evasive footwork.

6. **Defence & Rebounding**
   - stance, slide, angle, contain, closeout, contest, help position, box-out, pursue, secure and outlet.

7. **Decision-Making & Game Understanding**
   - triple-threat awareness, spacing, advantage recognition, drive/pass/shoot choices, cutting, transition lanes, simple two-player actions and role switching.

8. **Practice Habits, Safety & Reflection**
   - environment check, warm-up, effort control, listening, deliberate repetition, hydration, cooldown and useful reflection.

### 13.3 Curriculum depth versus MVP content depth

**[DECISION]** The data model must support a comprehensive curriculum from day one.  
**[ASSUMPTION]** The public MVP launches with a carefully produced Foundation campaign and a meaningful portion of Builder rather than hundreds of shallow nodes.

The platform should not imply that an unfinished content library is a complete pathway. Unpublished stages appear as “coming later” only to internal users; consumers see only coherent available journeys.

### 13.4 Skill-node content requirements

Every published skill node MUST include:

- unique stable key;
- display name and child-friendly name;
- domain and stage;
- learning objective stated as an observable capability;
- why the capability matters;
- prerequisite nodes;
- age/ability guidance;
- required space and equipment;
- safety checks and contraindication/escalation notes;
- parent instructions;
- child-facing cues, limited to a small memorable set;
- common errors and corrective cues;
- linked drills with primary/supporting relationship;
- minimum practice/completion rule;
- evidence requirement, if any;
- assessment rubric, if any;
- mastery consequences/unlocks;
- retention/revisit interval rule;
- content version and review owner;
- accessibility metadata, captions and transcripts for media.

### 13.5 Drill content requirements

Every drill MUST define:

- purpose and primary node;
- setup diagram or visual;
- demonstration video;
- step-by-step instructions;
- duration, repetitions or success target;
- intensity/load classification;
- easier and harder variants;
- left/right or bilateral rules;
- common mistakes;
- space/equipment needs;
- parent role;
- safety notes;
- what “good enough for today” looks like;
- how the result is logged;
- tags for age band, surface, indoor/outdoor, noise and number of participants.

### 13.6 Campaign design

A campaign is not a straight line through a single domain. It is a curated sequence that interleaves capabilities for balanced development.

Example Foundation campaign structure:

1. safe athletic stance and landing;
2. ball familiarity and fingertip control;
3. stationary right/left pound dribble;
4. ready hands and target passing;
5. jump stop and balance;
6. close-range shooting setup;
7. moving dribble under control;
8. chest and bounce pass accuracy;
9. right and left layup coordination;
10. defensive stance and lateral slide;
11. first controlled branch choice;
12. Foundation milestone assessment.

The branch choice may let the family select one of two or three recommended focuses, but the engine still schedules retention and underrepresented domains.

---

## 14. Seed basketball skill map

The following map is a minimum design target, not a complete coaching manual. It gives content and engineering agents a shared shape for the first sport pack.

### 14.1 Movement & Athletic Foundations

| Foundation | Builder | Player |
|---|---|---|
| Athletic ready stance | Accelerate from varied starts | React to visual/audio cue |
| Stop under control | Decelerate into balanced stop | Change direction under pressure |
| Two-foot jump and soft landing | Single-leg balance and landing | Repeated jump/land quality |
| Lateral shuffle mechanics | Crossover/run transition | Close space then brake |
| Basic coordination patterns | Multi-direction footwork | Movement choice in small-sided game |

### 14.2 Ball Mastery & Dribbling

| Foundation | Builder | Player |
|---|---|---|
| Ball taps, wraps and hand comfort | Moving control with either hand | Change pace to create advantage |
| Right-hand pound control | Crossover with balanced transfer | Retreat and re-attack |
| Left-hand pound control | Protect ball with body/arm position | Combine two changes of direction |
| Eyes-up stationary control | Hesitation and speed change | Read defender angle |
| Walk-to-jog dribble | Direction change while moving | Dribble into pass/finish decision |

### 14.3 Passing & Receiving

| Foundation | Builder | Player |
|---|---|---|
| Ready hands and target | Pivot then pass | Pass on drive/advantage |
| Chest pass mechanics | Pass accurately on the move | One-hand push/pass options |
| Bounce pass mechanics | Receive and square to target | Read help defender |
| Catch on balance | Lead a moving partner | Deliver from varied angles |
| Choose chest versus bounce | Pass after dribble pickup | Connect in two-player action |

### 14.4 Shooting

| Foundation | Builder | Player |
|---|---|---|
| Balanced stance and hand placement | Repeatable close-range form | Catch-to-shot footwork |
| Set point and follow-through | Generate force from legs | Shoot after controlled movement |
| One-hand form near basket | Align feet/hips/shoulders | Relocate and re-square |
| Hold finish and observe result | Self-correct common misses | Make shot/pass/drive decision |
| Consistent short-range routine | Extend range without losing form | Execute under light pressure |

### 14.5 Finishing & Footwork

| Foundation | Builder | Player |
|---|---|---|
| Jump stop | Front and reverse pivot | Finish through legal contact pad |
| Stride stop | Right and left layup at pace | Inside-hand finish |
| Right-side layup sequence | Power finish off two feet | Extension finish |
| Left-side layup sequence | Protect ball on gather | Change finish based on defender |
| Secure gather and balance | Finish from simple angle change | Pass out of stopped drive |

### 14.6 Defence & Rebounding

| Foundation | Builder | Player |
|---|---|---|
| Defensive stance | Closeout under control | Contain first drive angle |
| Lateral slide | Turn and recover | Help and recover positioning |
| Hands active without reaching | Box-out contact and pursue | Read shot and rebound path |
| Locate player and ball | Secure rebound and chin | Outlet decision under pressure |
| Stop at safe distance | Contest without fouling | Communicate in small-sided defence |

### 14.7 Decision-Making & Game Understanding

| Foundation | Builder | Player |
|---|---|---|
| Triple-threat awareness | Pass-cut-replace | Attack a closeout |
| Basic spacing spots | Transition lane recognition | Create and use two-on-one advantage |
| Look before dribbling | Drive/pass/shoot choice | Read help and make next pass |
| Move after passing | Play with width and depth | Switch roles dynamically |
| Identify teammate/defender/basket | Simple give-and-go | Constraint-led small-sided decisions |

### 14.8 Practice Habits & Safety

| Foundation | Builder | Player |
|---|---|---|
| Clear practice area | Select appropriate intensity | Adjust plan based on fatigue/pain |
| Complete simple warm-up | Prepare equipment independently | Lead part of warm-up safely |
| Listen and repeat cue | Rate effort honestly | Identify own next improvement cue |
| Practise both sides | Use deliberate success target | Review evidence constructively |
| Stop and tell adult about pain | Hydrate and recover | Balance training with team load |

---

## 15. Progression and mastery model

### 15.1 Skill states

![Athlete skill-state machine](diagrams/progress_state_machine.png)

The canonical states are:

- `LOCKED`
- `AVAILABLE`
- `ACTIVE`
- `PRACTICE_COMPLETE`
- `EVIDENCE_PENDING`
- `REVIEW_PENDING`
- `NEEDS_WORK`
- `MASTERED`
- `REVISIT_DUE`
- `ARCHIVED`

The user interface may use simpler labels, but persistence and events use these canonical values.

### 15.2 Completion rules

Each skill node owns a configurable completion rule rather than relying on a universal “three sessions equals mastered” rule.

Example rule shape:

```json
{
  "minimumCompletedSessions": 3,
  "minimumCalendarSpanDays": 5,
  "requiredSuccessfulAttempts": 2,
  "requiresEvidence": true,
  "assessmentType": "ASYNC_VIDEO",
  "rubricMinimumOverall": 3,
  "criticalCriteriaMustPass": true,
  "revisitAfterDays": 28
}
```

The engine MUST explain in plain language what remains, for example: “Complete one more practice on a different day, then submit a short video.”

### 15.3 Mastery tiers

The passport may display four confidence tiers while keeping the workflow states above:

1. **Introduced** – athlete has encountered the skill.
2. **Practising** – repetition is underway.
3. **Demonstrated** – configured practice criteria have been met.
4. **Verified** – an approved assessor has confirmed the rubric at a checkpoint.

A skill can be “mastered” for pathway purposes without being independently verified when the curriculum does not require human assessment. Product copy must distinguish demonstrated from verified.

### 15.4 Unlock rules

A node becomes `AVAILABLE` only when:

- every hard prerequisite is mastered or recognised through migration;
- the athlete belongs to a campaign that exposes the node;
- safety/age constraints are satisfied;
- no account or consent condition blocks the activity;
- the relevant content version is published.

Soft prerequisites influence recommendations but do not block access.

### 15.5 Controlled choice

At configured campaign branch points, the platform may offer two or three recommended focus options. The choice changes which node becomes active first, not whether other fundamental domains disappear indefinitely.

The recommendation service should communicate trade-offs, such as:

- “Choose Ball Control for more confidence with the left hand.”
- “Choose Finishing to build both-side layup coordination.”
- “Choose Movement to improve stops and direction changes.”

### 15.6 Retention and regression

Mastery is not assumed permanent. Each node can define a revisit interval based on skill type and stage. A revisit uses a short retrieval activity. Failure does not erase the passport record; it returns the skill to an active improvement state and records that retention needs work.

### 15.7 No opaque global athlete score

**[DECISION]** The MVP must not collapse the athlete into one public rating. Domain summaries may show progress, but the underlying profile remains multidimensional and explainable.

---

## 16. Practice prescription engine

### 16.1 Purpose

The practice engine converts curriculum state into a short session that a parent can run with minimal planning.

### 16.2 Inputs

- athlete age band and stage;
- active campaign and available branch choices;
- current skill states;
- prior practice results;
- revisit-due skills;
- parent-selected session duration;
- available equipment and space;
- indoor/outdoor and noise constraints;
- laterality needs;
- recent training load entered by the parent;
- safety restrictions and coach notes;
- content availability.

### 16.3 Default session composition

A generated session SHOULD include:

1. environment and safety check;
2. brief movement warm-up;
3. primary target skill;
4. supporting skill or prerequisite;
5. retention/retrieval item;
6. optional child-choice challenge from an approved set;
7. cooldown/reflection.

A typical session allocation is configurable. A sensible initial rule is:

- 50%-60% current target;
- 15%-25% prerequisite/supporting work;
- 15%-20% retrieval of a previously learned skill;
- remaining time for warm-up, challenge and reflection.

### 16.4 Session duration presets

- Quick: approximately 10-15 minutes.
- Standard: approximately 20-25 minutes.
- Extended: approximately 30-40 minutes for older/more experienced athletes.

The product must avoid implying that longer is always better. It should suggest stopping when technique degrades, pain appears or attention is lost.

### 16.5 Parent controls

Parents MAY:

- select duration;
- declare space/equipment;
- choose among system-approved branch focuses;
- replace a drill with an equivalent approved variant;
- pause, skip for a stated reason or end early;
- report pain, fatigue, confusion or equipment limitations.

Parents MUST NOT be expected to build a session from a blank canvas in the MVP.

### 16.6 Drill substitution rules

A substitution is allowed only when the replacement:

- targets the same primary skill node;
- does not exceed the athlete's safety/load classification;
- fits available space/equipment;
- preserves required laterality;
- is published for the athlete's stage.

### 16.7 Session completion

Completion requires more than opening every card. The session player records:

- step start/end or explicit skip;
- result type appropriate to the drill;
- parent/athlete difficulty rating;
- pain or safety flag;
- optional note;
- whether cues were understood;
- overall enjoyment/effort reflection.

The platform should minimise taps. Most practice steps require one simple completion interaction.

### 16.8 Offline and low-bandwidth behaviour

A prescribed session and its essential media SHOULD be cacheable before practice. Completion data can queue locally and sync when connectivity returns. Private evidence upload is not required to work offline.

---

## 17. Assessment model

### 17.1 Assessment types

1. **Self/parent observation**
   - low-stakes check;
   - structured prompts;
   - never labelled “verified.”

2. **Asynchronous video assessment**
   - short private clip;
   - assigned to an authorised reviewer;
   - rubric decision and structured feedback;
   - preferred early verification method.

3. **Live remote assessment**
   - future option for selected skills;
   - parent present;
   - controlled platform session.

4. **In-person milestone assessment**
   - higher-trust checkpoint at longer intervals;
   - booked with an approved coach;
   - platform rubric completed during or immediately after the session.

5. **Organisation assessment**
   - future club/camp workflow;
   - still subject to parent visibility and access controls.

### 17.2 Rubric design

Rubrics use observable criteria, not vague labels such as “good handles.” Each criterion contains:

- plain-language criterion;
- child-friendly cue;
- critical/non-critical designation;
- scale anchors;
- acceptable evidence angle/duration;
- common failure reason;
- prescribed remediation nodes/drills.

Recommended four-point scale:

| Score | Meaning |
|---:|---|
| 1 | Not yet demonstrated; substantial prompting or unsafe/uncontrolled execution. |
| 2 | Emerging; correct elements appear inconsistently or only with prompting. |
| 3 | Consistent in the defined drill context with acceptable control. |
| 4 | Consistent with added pace, variation or light pressure appropriate to the node. |

A checkpoint passes when all critical criteria meet their threshold and the configured overall rule is satisfied.

### 17.3 Feedback requirements

Coach feedback MUST include:

- decision: pass, retry or unable to assess;
- criterion scores;
- one to three specific positives;
- one primary next improvement cue;
- prescribed next action;
- optional annotated timestamp or still frame;
- reviewer identity and timestamp;
- disclosure when evidence quality limited the decision.

Feedback must not contain appearance-based commentary, humiliation, recruiting solicitation or requests for off-platform contact.

### 17.4 Retry and appeal

- A retry preserves the prior assessment and creates a new attempt.
- The family sees exactly what must change.
- A parent may request review when the rubric appears incorrectly applied.
- Appeals route to a lead assessor who was not the original reviewer.
- Repeated coach inconsistency triggers calibration review.

### 17.5 Assessment calibration

Coach operations MUST include:

- standard training on the curriculum and rubric;
- sample-video calibration before activation;
- periodic blind double-scoring;
- inter-rater consistency reporting;
- targeted retraining;
- suspension of assessment privileges where quality or conduct fails.

---

## 18. Core user journeys

### 18.1 Parent onboarding to first practice

1. Parent creates an account and verifies email/phone as configured.
2. Parent reviews privacy, consent and safety summary.
3. Parent creates athlete profile using minimum necessary data.
4. Parent chooses basketball, experience level, available equipment and typical practice space.
5. Parent completes a short baseline composed of questions and optional simple activities.
6. System recommends a starting campaign and explains why.
7. Dashboard shows one primary action: **Start first practice**.
8. Parent enters Practice mode and completes the session.
9. System records reflection and updates the skill tree.
10. Dashboard shows the next recommended practice or rest/revisit action.

### 18.2 Daily/weekly practice loop

1. Parent opens dashboard.
2. “Continue your pathway” card shows duration and focus.
3. Parent optionally changes duration or approved branch focus.
4. Practice mode guides each step.
5. Athlete completes a short reflection.
6. Progress animation highlights meaningful changes only.
7. System schedules the next session and displays any checkpoint approaching.

### 18.3 Video checkpoint

1. Skill reaches `EVIDENCE_PENDING`.
2. Parent sees exact recording instructions, privacy notice and example angle.
3. Parent records or uploads a short clip.
4. Client validates duration/file size and confirms consent.
5. Evidence uploads directly to private storage.
6. System creates an assessment and assigns an eligible coach.
7. Coach reviews using rubric.
8. Parent receives structured feedback.
9. Pass unlocks next node; retry generates prescribed remediation.
10. Evidence follows configured retention/deletion policy.

### 18.4 In-person milestone

1. Campaign shows an upcoming milestone and why live assessment is useful.
2. Parent views approved coach availability.
3. Parent books and pays through the platform.
4. Confirmation includes venue, supervision and cancellation rules.
5. Coach verifies attendance and completes rubric.
6. Result updates progress and passport.
7. Payout is released after completion and incident window rules.

### 18.5 Coach asynchronous review

1. Coach opens assigned queue.
2. Queue is ordered by due time and credential match.
3. Coach sees only necessary athlete context and consented evidence.
4. Coach scores each criterion and adds structured feedback.
5. System validates completeness.
6. Coach submits once; edits require an audit reason.
7. Family is notified and the assessment contributes to quality analytics.

### 18.6 Curriculum publishing

1. Editor creates a draft curriculum version or clones an existing version.
2. Editor adds/changes nodes, prerequisites, drills and rubrics.
3. Automated validation detects cycles, missing media, inaccessible content and unreachable nodes.
4. Reviewer previews representative athlete journeys.
5. Curriculum lead approves and schedules publication.
6. Migration map is created for existing athletes.
7. Release is rolled out behind a feature flag/cohort.
8. Metrics and support feedback are monitored before full adoption.


---

## 19. Screen specifications

### 19.1 Dashboard

**Goal:** communicate the one most useful next action without making the parent interpret the entire curriculum.

**Required elements:**

- athlete switcher;
- primary “Continue” practice card with focus, duration and estimated setup;
- current campaign and next milestone;
- concise weekly rhythm, such as practices completed and revisit due;
- pending assessment/feedback card;
- recent meaningful achievement;
- safety/load note when relevant;
- access to parent settings and passport.

**Behaviour:**

- The primary card MUST always have a useful state: start, continue, submit evidence, review feedback, choose a branch or recover/rest.
- Promotional content MUST not displace the primary action.
- Metrics MUST be interpretable without coaching knowledge.
- Streaks MAY be shown gently, but missing a day must not use punitive language.

### 19.2 Skill Tree & Progress

**Goal:** show the athlete's location in the development pathway and make prerequisites understandable.

**Required elements:**

- domain branches and campaign spine;
- clear state styling for locked, available, active, practising, mastered, verified and revisit due;
- progress summary by domain without a single global rank;
- “why locked?” explanation;
- controlled branch-choice interface when eligible;
- filters for stage/domain, with sensible defaults;
- accessible list alternative to the graphical map;
- link to athlete passport/history.

**Behaviour:**

- Tapping an available/active node opens skill detail.
- Tapping a locked node explains prerequisites but does not allow practice launch.
- Mastered nodes show history, assessment evidence status and next revisit.
- The visual map must remain usable on a phone; progressive disclosure is preferable to showing every node at once.

### 19.3 Skill detail

**Goal:** explain what the athlete is learning and launch the recommended action.

**Required elements:**

- child-friendly skill name and objective;
- short demonstration;
- why it matters;
- two or three key cues;
- common mistakes;
- equipment/space and safety;
- current progress state and remaining requirements;
- assessment criteria when applicable;
- one primary call to action: start/continue recommended practice, submit evidence, book assessment or revisit.

The MVP MUST NOT make “add any drill to practice” the primary action.

### 19.4 Practice setup

**Goal:** confirm that the session fits the current environment.

**Required elements:**

- target duration;
- indoor/outdoor and available space;
- equipment confirmation;
- parent supervision acknowledgement;
- recent pain/fatigue check;
- approved branch focus where applicable;
- preview of session steps.

### 19.5 Practice player

**Goal:** guide a parent and child through the session with minimal interaction overhead.

**Required elements:**

- current step and session progress;
- autoplay-disabled demonstration with captions and replay;
- parent cue and child cue separated visually;
- timer, rep counter or success target as relevant;
- pause, repeat, easier variant, skip with reason and stop controls;
- audio/haptic cue optional;
- large touch targets and high contrast;
- clear safety stop instruction.

The player SHOULD keep the device usable from several metres away and SHOULD support landscape tablet use.

### 19.6 Practice reflection

**Required elements:**

- child enjoyment using simple visual scale;
- perceived difficulty;
- parent observation: easier/as expected/harder;
- pain or safety flag;
- optional note;
- concise progress result and next action.

### 19.7 Evidence capture

**Required elements:**

- exact requested movement;
- example framing and maximum duration;
- private-use explanation;
- consent confirmation;
- record/upload controls;
- preview, trim and replace;
- upload progress and retry;
- deletion/retention summary;
- no public-sharing defaults.

### 19.8 Assessment result

**Required elements:**

- pass/retry/unable-to-assess status;
- rubric criteria in plain language;
- positives and primary correction;
- timestamped/annotated feedback if supplied;
- prescribed next practice;
- reviewer identity and credential badge;
- appeal/request-review control;
- evidence retention control where policy permits.

### 19.9 Athlete passport

**Goal:** provide the private longitudinal record that makes Next Step more than a temporary training app.

**Required elements:**

- athlete profile and current stage;
- timeline of practices, milestones and assessments;
- domain summaries;
- verified milestone badges without public ranking;
- coach feedback history;
- curriculum-version provenance;
- parent-controlled export;
- parent-controlled sharing in later phases;
- correction and deletion request controls.

### 19.10 Coach portal

**Required elements:**

- assessment queue and due status;
- athlete context limited to what is necessary;
- secure media viewer;
- rubric form with required criteria;
- structured feedback templates;
- submit/return-unassessable workflow;
- availability and booking management;
- credential/WWCC status;
- earnings and payout status;
- quality/calibration feedback;
- safeguarding/report incident control.

### 19.11 Admin and curriculum CMS

**Required elements:**

- sport, curriculum and version management;
- graph editor or structured prerequisite editor;
- node/drill/rubric/media authoring;
- content review and approval workflow;
- graph validation and preview;
- athlete migration map;
- coach and credential administration;
- assessment quality dashboard;
- consent/evidence audit tools;
- support and incident workflows;
- feature flags and cohort rollout;
- immutable audit history.

---

## 20. Functional requirements

### 20.1 Identity, households and consent

| ID | Requirement |
|---|---|
| FR-ID-001 | The system MUST support parent/caregiver account creation, verification, login, logout and passwordless or secure password recovery. |
| FR-ID-002 | The system MUST support household membership roles: owner and caregiver. |
| FR-ID-003 | The MVP MUST NOT require a child to own login credentials. |
| FR-ID-004 | A household MUST be able to create, edit, archive and request deletion of athlete profiles. |
| FR-ID-005 | Athlete data collection MUST be minimised; exact date of birth is optional unless a documented legal or operational need requires it. An age band or month/year SHOULD be sufficient for MVP progression. |
| FR-ID-006 | Consent records MUST be versioned, timestamped and linked to the consenting adult and purpose. |
| FR-ID-007 | The system MUST support withdrawal of optional consent without blocking unrelated core service use. |
| FR-ID-008 | Coaches and administrators MUST use stronger authentication, including MFA. |
| FR-ID-009 | Household access changes MUST be audited. |

### 20.2 Athlete onboarding and baseline

| ID | Requirement |
|---|---|
| FR-ON-001 | Parent MUST select sport, experience, approximate age band, equipment and practice environment. |
| FR-ON-002 | The baseline SHOULD combine parent questions with simple observable activities. |
| FR-ON-003 | The starting recommendation MUST be explainable and editable by an authorised admin/coach. |
| FR-ON-004 | The parent MUST be able to choose a more foundational start without penalty. |
| FR-ON-005 | Skipping the baseline MUST place the athlete into a safe Foundation start, not an advanced default. |

### 20.3 Curriculum and content

| ID | Requirement |
|---|---|
| FR-CUR-001 | Admin users MUST be able to create draft curriculum versions and publish immutable versions. |
| FR-CUR-002 | The system MUST support domains, stages, campaigns, skill nodes, milestones, prerequisites, drills and rubrics. |
| FR-CUR-003 | The system MUST detect hard-prerequisite cycles before publication. |
| FR-CUR-004 | Unreachable nodes, missing required media, missing safety metadata and invalid completion rules MUST block publication. |
| FR-CUR-005 | Content MUST support captions, transcripts and accessible text alternatives. |
| FR-CUR-006 | Published content changes MUST create a new version rather than mutate historical records. |
| FR-CUR-007 | Curriculum migrations MUST preserve the provenance of prior progress and assessment. |
| FR-CUR-008 | Sport-specific fields MUST be expressible through metadata/configuration without changing core platform code. |

### 20.4 Dashboard, tree and progress

| ID | Requirement |
|---|---|
| FR-PRO-001 | The dashboard MUST calculate one primary next action per athlete. |
| FR-PRO-002 | The skill tree MUST render the active campaign, domain branches and node states. |
| FR-PRO-003 | Locked nodes MUST expose a human-readable reason. |
| FR-PRO-004 | Progress state changes MUST be event-driven, auditable and idempotent. |
| FR-PRO-005 | The system MUST support configured controlled-choice branch points. |
| FR-PRO-006 | The system MUST schedule revisit-due states and surface them in recommendations. |
| FR-PRO-007 | The user interface MUST distinguish demonstrated from coach-verified progress. |
| FR-PRO-008 | The system MUST NOT expose a public global athlete score in MVP. |

### 20.5 Practice planning and execution

| ID | Requirement |
|---|---|
| FR-PRAC-001 | The system MUST generate a practice plan from athlete state, curriculum rules and environment constraints. |
| FR-PRAC-002 | A practice plan MUST be persisted as a snapshot so later curriculum edits do not change a completed session. |
| FR-PRAC-003 | Parents MUST be able to select a duration preset and approved focus branch. |
| FR-PRAC-004 | Parents MAY substitute only an equivalent approved drill variant. |
| FR-PRAC-005 | Practice steps MUST support time-, repetition-, success- and observation-based result types. |
| FR-PRAC-006 | The system MUST record skips with a reason and MUST not treat skipped steps as successful completion. |
| FR-PRAC-007 | A pain/safety flag MUST stop progression and surface appropriate guidance. |
| FR-PRAC-008 | Essential session content SHOULD be available offline after preloading. |
| FR-PRAC-009 | Session completion MUST update attempts and trigger progress evaluation exactly once. |
| FR-PRAC-010 | The engine MUST avoid prescribing the same drill continuously when equivalent variation is available, while preserving learning consistency. |

### 20.6 Evidence and assessment

| ID | Requirement |
|---|---|
| FR-ASMT-001 | Evidence MUST be private and accessible only to authorised household members, assigned reviewers and restricted support/admin roles. |
| FR-ASMT-002 | The client MUST upload evidence directly to object storage using short-lived credentials or pre-signed URLs. |
| FR-ASMT-003 | The system MUST validate MIME type, file signature, duration and size before review. |
| FR-ASMT-004 | Evidence metadata MUST capture consent purpose, uploader, athlete, requested node, capture time and retention policy. |
| FR-ASMT-005 | The assessment service MUST assign only coaches credentialed for the sport/stage/assessment type. |
| FR-ASMT-006 | Rubric submission MUST require every critical criterion and a prescribed next action. |
| FR-ASMT-007 | Assessment state changes MUST be immutable events with correction records rather than silent overwrites. |
| FR-ASMT-008 | A pass MUST trigger progress evaluation and unlock checks. |
| FR-ASMT-009 | A retry MUST create a remediation prescription without deleting earlier evidence or feedback. |
| FR-ASMT-010 | Parents MUST be able to appeal or request review. |
| FR-ASMT-011 | The system MUST measure coach turnaround and inter-rater quality. |
| FR-ASMT-012 | Evidence deletion MUST respect legal holds, disputes and audit requirements while removing media from normal access promptly. |

### 20.7 Coach operations and booking

| ID | Requirement |
|---|---|
| FR-COACH-001 | A coach profile MUST include identity-verification state, credential state, WWCC state, sports/stages, assessment privileges and status. |
| FR-COACH-002 | A coach with invalid/expired required credentials MUST not receive new child-related work. |
| FR-COACH-003 | Parents MUST initiate all bookings and communication in MVP. |
| FR-COACH-004 | Coach feedback MUST stay within structured, audited platform channels. |
| FR-COACH-005 | The booking flow MUST support availability, venue, price, cancellation policy, payment state and attendance state. |
| FR-COACH-006 | In-person assessment instructions MUST require the parent/caregiver presence policy defined by operations. |
| FR-COACH-007 | Payout MUST be linked to completed service and dispute state. |
| FR-COACH-008 | The platform MUST support coach suspension, incident flags and access revocation. |

### 20.8 Passport and exports

| ID | Requirement |
|---|---|
| FR-PASS-001 | The passport MUST show practices, state changes, verified milestones and assessment provenance chronologically. |
| FR-PASS-002 | Parent MUST be able to export a human-readable summary and machine-readable data package. |
| FR-PASS-003 | Sharing MUST be private and parent-controlled; public links are out of scope for MVP. |
| FR-PASS-004 | Corrections MUST preserve audit history. |
| FR-PASS-005 | Archived/deleted curriculum nodes MUST remain intelligible in historical records. |

### 20.9 Billing

| ID | Requirement |
|---|---|
| FR-BILL-001 | Subscription entitlements MUST be separate from payment-provider-specific objects. |
| FR-BILL-002 | The system MUST support free, trial, paid, grace, cancelled and expired entitlement states. |
| FR-BILL-003 | Assessment purchases MUST use idempotent order creation and webhook processing. |
| FR-BILL-004 | Marketplace payouts MUST not expose payment details to other users. |
| FR-BILL-005 | Refunds, credits and disputes MUST be auditable. |
| FR-BILL-006 | Pricing, tax and currency MUST be configuration, not hard-coded UI constants. |

### 20.10 Administration and support

| ID | Requirement |
|---|---|
| FR-ADM-001 | Privileged actions MUST require role/permission checks and produce audit events. |
| FR-ADM-002 | Support access to child data or media MUST be just-in-time, reason-coded and time-limited. |
| FR-ADM-003 | Admins MUST be able to search by internal IDs and parent-approved identifiers without broad data export. |
| FR-ADM-004 | The platform MUST support feature flags and cohort rollout. |
| FR-ADM-005 | Safety incidents MUST have severity, owner, timeline, evidence preservation and resolution workflow. |
| FR-ADM-006 | Content and curriculum publication MUST use maker-checker approval. |

---

## 21. Non-functional requirements

### 21.1 Performance

- Initial authenticated dashboard: p75 Largest Contentful Paint under 2.5 seconds on a representative Australian 4G connection after warm infrastructure.
- Non-media API reads: p95 under 400 ms at expected MVP load.
- Non-media API writes: p95 under 700 ms, excluding external payment or upload completion.
- Skill-tree interactions should respond within 100 ms after data is loaded.
- Practice-session transitions must not depend on a network round trip when content is cached.

Targets are release gates to measure, not guarantees under every client/network condition.

### 21.2 Availability and recovery

- Production availability objective: 99.9% monthly for core authenticated functions.
- Database point-in-time recovery enabled.
- Initial recovery point objective: 15 minutes or better.
- Initial recovery time objective: 4 hours or better.
- Object versioning and lifecycle policies enabled for protected media and exports.
- Restore procedures tested, not merely documented.

### 21.3 Scalability

The modular monolith must scale horizontally at the web/API layer. Expensive media and notification work must run asynchronously. The initial design should support at least tens of thousands of registered families without a redesign, while avoiding premature multi-region or microservice complexity.

### 21.4 Accessibility

The application MUST target WCAG 2.2 Level AA.[^wcag] This includes:

- keyboard operation;
- logical focus order;
- accessible names and validation;
- text alternatives, captions and transcripts;
- reduced-motion support;
- colour not used as the only state indicator;
- adequate target size and contrast;
- accessible list/table alternative for the skill-tree map;
- plain-language parent and child copy;
- screen-reader testing on critical flows.

### 21.5 Compatibility

- Current major versions of Chrome, Safari and Edge on mobile and desktop.
- Responsive phone, tablet and desktop layouts.
- PWA installation where browser support allows.
- Graceful web fallback when installation/offline capabilities are unavailable.

### 21.6 Observability

- structured logs with correlation IDs;
- distributed traces across web/API/jobs where practical;
- error tracking with personal-data scrubbing;
- product event telemetry;
- business and operational dashboards;
- alerts for authentication failures, upload failures, queue age, payment webhook failures, review SLA breaches and permission anomalies.

### 21.7 Maintainability

- TypeScript strict mode;
- documented module boundaries;
- OpenAPI-generated or validated client contracts;
- automated migrations;
- no business logic in UI components;
- no direct cross-module database writes that bypass owning services;
- ADRs for significant architecture decisions;
- minimum test thresholds by risk, not a vanity global percentage.

---

## 22. Child safety, privacy and compliance

### 22.1 Regulatory posture

Australia's Children's Online Privacy Code was still in exposure-draft/consultation form as of this specification date and is required to be finalised and registered by 10 December 2026.[^oaic-code] The product should design to the stricter direction of the draft now: child best interests, data minimisation, age-appropriate transparency, strong defaults and meaningful control, while obtaining Australian legal review before public launch.

The platform should adopt eSafety's **Safety by Design** approach: safety and user rights are embedded in product requirements, defaults and operations rather than added after incidents.[^esafety]

In NSW, people performing child-related coaching work generally require a Working With Children Check. Coach activation and continued eligibility must incorporate formal verification and expiry handling.[^wwcc]

This document is a product specification, not legal advice. Applicability of the Privacy Act, Children's Online Privacy Code, Online Safety Act, consumer law, health information rules, employment/contractor rules, insurance and sport-specific obligations must be reviewed before launch and as the service expands.

### 22.2 Safety architecture decisions

- Parent/caregiver owns the account and athlete relationship.
- No public child profiles or discoverable videos.
- No direct coach-to-child messaging.
- No public comments, likes, follower counts or leaderboards.
- Parent initiates evidence submission, booking and any support interaction.
- Coaches access only assigned athletes/evidence for a defined purpose and period.
- Coach/admin access is logged and reviewable.
- In-person sessions follow a parent-presence and venue policy.
- Incident reporting is visible in coach and parent workflows.
- Product copy avoids medical diagnosis and advises appropriate professional support for pain/injury.

### 22.3 Data minimisation

MVP should avoid collecting:

- full legal child name unless required;
- exact home address;
- school name;
- public username;
- facial templates or biometric identifiers;
- unnecessary health history;
- precise location history;
- social graph;
- contacts;
- advertising identifiers.

Preferred athlete fields are display name/nickname, age band or month/year, sport experience, laterality where useful, equipment/space and parent-entered safety constraints.

### 22.4 Consent model

Consent is purpose-specific. Separate records should cover:

- creation of the athlete profile;
- training personalisation;
- private video capture/upload;
- coach review;
- in-person booking;
- optional product research;
- optional use of de-identified/aggregated data;
- any future use of media for model training or marketing.

Consent for service delivery must not be bundled with marketing or AI-training consent. No child evidence may be used to train a model without a separate, explicit, revocable parent consent and legal review.

### 22.5 Evidence retention recommendation

**[ASSUMPTION]** Initial policy:

- client original is uploaded privately;
- platform creates a review rendition;
- original may be deleted after successful processing and a short recovery window;
- failed/rejected uploads are deleted promptly;
- reviewed evidence is retained only for the period needed for feedback, appeal and passport purpose;
- parent can request earlier deletion unless a dispute/legal hold applies;
- passport retains rubric outcome and minimal provenance even when media is deleted;
- retention periods are configuration and policy, not code constants.

### 22.6 Media safety controls

- pre-signed uploads with short expiry;
- file-signature and codec validation;
- malware scanning;
- duration and size limits;
- private buckets with blocked public access;
- encryption at rest and in transit;
- signed playback URLs with short expiry;
- watermark/identifier optional for reviewer accountability;
- no facial recognition or identity matching;
- reporting and quarantine workflow;
- review access revoked automatically after assignment closure and appeal window.

### 22.7 Coach safeguarding controls

Before a coach receives child-related work:

- identity is verified;
- required WWCC status is verified and expiry captured;
- qualifications/experience are reviewed under platform policy;
- code of conduct and child-safe training are completed;
- assessment calibration is passed;
- bank/payout identity is confirmed separately;
- MFA is enabled.

The platform must re-check expiring credentials and stop new assignments when a required status becomes invalid.

### 22.8 Threats requiring explicit design review

- unauthorised household access after family separation;
- coach account takeover;
- IDOR/broken object-level authorisation exposing child media;
- public object-storage misconfiguration;
- evidence URL leakage through logs or analytics;
- abusive or appearance-based coach feedback;
- payment/booking fraud;
- malicious file upload;
- insider support access;
- parent accidentally uploading unrelated children;
- overtraining or unsafe practice prescription;
- inference of sensitive traits from video;
- curriculum errors leading to unsafe movement progressions.

---

## 23. Product analytics and ethical measurement

### 23.1 Principles

- No advertising SDKs in child-facing flows.
- No sale of athlete data.
- Collect events needed to improve the service, safety and operations.
- Prefer first-party analytics with pseudonymous identifiers.
- Do not record raw text fields, video URLs, names or assessment comments in analytics events.
- Provide a consent-aware research mode for optional studies.

### 23.2 Core event taxonomy

| Event | Minimum properties |
|---|---|
| `athlete_profile_created` | athlete_id, age_band, sport_id, source |
| `baseline_completed` | athlete_id, curriculum_version, recommended_stage |
| `practice_plan_generated` | plan_id, athlete_id, duration, target_node_ids, generation_reason |
| `practice_started` | session_id, plan_id, online/offline |
| `practice_step_completed` | session_id, drill_id, result_type, difficulty, variant_id |
| `practice_completed` | session_id, duration_actual, completion_ratio, enjoyment, safety_flag |
| `skill_state_changed` | athlete_id, node_id, prior_state, new_state, trigger_event_id |
| `branch_option_viewed` | athlete_id, branch_id, options |
| `branch_selected` | athlete_id, branch_id, selected_node_id |
| `evidence_requested` | athlete_id, node_id, evidence_type |
| `evidence_submitted` | evidence_id, node_id, duration_bucket, upload_result |
| `assessment_assigned` | assessment_id, reviewer_id, type, due_at |
| `assessment_completed` | assessment_id, outcome, turnaround_bucket, score_bucket |
| `milestone_verified` | athlete_id, milestone_id, assessment_type |
| `revisit_completed` | athlete_id, node_id, retained_boolean |
| `subscription_state_changed` | household_id, prior_state, new_state, plan_key |
| `safety_incident_created` | incident_id, severity, source_flow |

### 23.3 Curriculum analytics

Curriculum teams need aggregated views of:

- nodes with high abandonment;
- nodes with unusually high retry rates;
- common rubric failure criteria;
- time/attempts to mastery;
- retention failure by node;
- drill variant effectiveness;
- parent confusion/support tags;
- coach disagreement;
- age/stage mismatch indicators;
- safety flags by drill.

Analytics must not automatically change curriculum. It informs reviewed revisions.


---

## 24. Technical architecture

### 24.1 Architecture decision

**[ASSUMPTION]** Build the MVP as a TypeScript modular monolith with a responsive PWA and a separate API process, deployed in the AWS Sydney region.

This architecture optimises for:

- one language and shared contracts across web and API;
- clear domain boundaries without distributed-system overhead;
- controlled data residency and private media;
- horizontal scaling of stateless workloads;
- later extraction of high-volume services only when justified;
- a future native client using the same API.

![Reference system architecture](diagrams/system_architecture.png)

### 24.2 Reference stack

| Layer | Decision |
|---|---|
| Monorepo | pnpm workspaces + Turborepo |
| Web/PWA | Next.js + React + TypeScript |
| UI | Tailwind CSS plus accessible headless primitives; shared design-system package |
| API | NestJS on Node.js, REST/JSON, OpenAPI 3.1 |
| Validation/contracts | Zod at client boundaries; DTO/OpenAPI validation in API; generated or shared contract package |
| Database | PostgreSQL on Amazon RDS, encrypted, Multi-AZ when production economics allow |
| ORM/migrations | Prisma ORM and migration tooling |
| Authentication | Amazon Cognito or equivalent managed identity; parent/caregiver, coach and admin roles |
| Object storage | Private Amazon S3 buckets with blocked public access and lifecycle rules |
| Media delivery | CloudFront signed URLs/cookies or equivalent authorised proxy delivery |
| Async jobs | Amazon SQS; workers on ECS/Lambda according to workload |
| Cache/locks | Redis/ElastiCache when required; not a source of truth |
| Payments | Stripe Billing and Stripe Connect, isolated behind a billing module |
| Email | Amazon SES or a transactional provider behind an adapter |
| Push | Web push in PWA where supported; native push later |
| Observability | OpenTelemetry-compatible traces/logs, CloudWatch, Sentry or equivalent error tracking |
| Infrastructure | Terraform, environment-specific modules, least-privilege IAM |
| CI/CD | GitHub Actions or equivalent with tests, scans, migrations and staged deployment |
| Testing | Vitest/Jest, Supertest, Testcontainers, Playwright, axe-core |

Technology versions must be pinned in the repository and updated through dependency-review automation. The specification intentionally avoids a version number that will become stale.

### 24.3 Why not a single Next.js-only backend

A Next.js-only implementation is possible, but a dedicated NestJS API is recommended because:

- coach/admin/native clients will share a stable API;
- long-running and asynchronous workflows are central;
- module ownership and authorisation are easier to enforce;
- OpenAPI contracts give build agents a clear integration boundary;
- background workers can reuse application services without coupling to page rendering.

### 24.4 Why not microservices

The MVP does not need independently deployed services for curriculum, practice, assessment and billing. Their workflows are highly transactional and the initial team/agent set benefits from one repository, one database and one release train. Module boundaries and domain events should make later extraction possible without imposing distributed consistency now.

### 24.5 Deployment topology

A reference production deployment:

1. Route 53 DNS.
2. CloudFront and AWS WAF.
3. Application Load Balancer.
4. Next.js web containers on ECS Fargate.
5. NestJS API containers on ECS Fargate.
6. RDS PostgreSQL in private subnets.
7. S3 media and static asset buckets.
8. SQS queues and worker/Lambda processing.
9. Cognito identity.
10. SES/notification provider.
11. Stripe external payment services.
12. CloudWatch/Sentry telemetry.

All databases, internal services and worker endpoints should be private. Only the web/API edge is internet-facing.

---

## 25. Application modules

Each module owns its business rules and write paths. Cross-module reads occur through application interfaces or published query services; cross-module writes occur through commands/events.

### 25.1 Identity module

Owns:

- user identity mapping;
- role assignments;
- MFA requirement state;
- session/security events;
- account suspension.

Does not own household or athlete business data.

### 25.2 Household module

Owns:

- households;
- caregiver memberships;
- invitations;
- consent relationships;
- household-level settings and entitlements.

### 25.3 Athlete module

Owns:

- athlete profiles;
- age band and sport preferences;
- baseline inputs;
- safety constraints;
- profile archive/deletion status.

### 25.4 Curriculum module

Owns:

- sports and sport packs;
- curriculum versions;
- domains, stages, campaigns, nodes and milestones;
- prerequisite graph;
- drills, content media and rubrics;
- publication and migration maps.

### 25.5 Recommendation/practice module

Owns:

- campaign assignment;
- branch eligibility and selection;
- practice-plan generation;
- plan snapshots;
- practice sessions, steps and attempts;
- session reflection;
- offline sync reconciliation.

### 25.6 Progress module

Owns:

- athlete skill progress;
- state transitions;
- completion-rule evaluation;
- unlock evaluation;
- revisit scheduling;
- mastery provenance.

Progress is never directly edited by the client. Administrative corrections are explicit commands with audit reason.

### 25.7 Evidence/media module

Owns:

- upload intents;
- media assets and renditions;
- private access grants;
- scanning/processing status;
- retention and deletion;
- evidence submissions.

### 25.8 Assessment module

Owns:

- assessment requests;
- assignment;
- rubric snapshots;
- scores and feedback;
- outcomes;
- retry/appeal;
- calibration sampling.

### 25.9 Coach module

Owns:

- coach profile;
- credential and WWCC records;
- sports/stage privileges;
- status and suspension;
- availability;
- quality indicators.

### 25.10 Booking module

Owns:

- services and appointment slots;
- booking lifecycle;
- venue and attendance;
- cancellation/reschedule;
- links to orders and payouts.

### 25.11 Billing module

Owns:

- plans and entitlements;
- orders and credits;
- payment-provider mapping;
- webhook idempotency;
- refunds/disputes;
- coach payouts.

### 25.12 Passport module

Owns read models and exports assembled from immutable practice/progress/assessment events. It should not duplicate source-of-truth write logic.

### 25.13 Notification module

Owns templates, preferences, scheduled reminders and delivery receipts. It receives domain events and does not decide progression.

### 25.14 Admin/audit module

Owns:

- privileged support access grants;
- feature flags;
- audit-event search;
- incident records;
- operational corrections;
- maker-checker approvals.

---

## 26. Monorepo structure

Recommended repository layout:

```text
nextstep/
  apps/
    web/                 # Next.js parent/athlete/coach/admin UI
    api/                 # NestJS API
    worker/              # asynchronous jobs and event handlers
  packages/
    domain/              # pure domain types, rules, state machines
    contracts/           # OpenAPI-generated/shared client contracts
    database/            # Prisma schema, migrations, repositories
    ui/                  # design system and accessible primitives
    curriculum-sdk/      # graph validation, imports, preview tooling
    config/              # typed environment configuration
    observability/       # logging, tracing, metrics helpers
    testing/             # fixtures, test builders, mocks
  infrastructure/
    terraform/
      modules/
      environments/
  content/
    basketball/
      drafts/
      seed/
  docs/
    adr/
    runbooks/
    threat-models/
  .github/workflows/
  AGENTS.md
```

### 26.1 Boundary rules

- `packages/domain` must not import web frameworks, database clients or cloud SDKs.
- UI code must not contain authoritative progression rules.
- Database models must not be returned directly from API endpoints.
- Billing-provider and identity-provider SDKs must be wrapped behind adapters.
- Every event and API payload must have an explicit schema/version.
- Feature flags must not create permanently divergent data models.

---

## 27. Data architecture

### 27.1 Database principles

- PostgreSQL is the transactional source of truth.
- UUIDs are used for externally visible IDs.
- Timestamps are stored in UTC; display uses household locale/time zone.
- Mutable tables use optimistic concurrency/version fields where race conditions matter.
- Soft archive is distinct from legal deletion.
- Personal data and operational data are separated where practical.
- Audit events are append-only.
- Media bytes are never stored in PostgreSQL.
- Analytics is fed from events/read replicas rather than unrestricted production-table access.

### 27.2 Core entities

The companion `data/schema.prisma` gives a concrete starting schema. Core entities include:

- `User`
- `Household`
- `HouseholdMembership`
- `ConsentRecord`
- `Athlete`
- `AthleteSportProfile`
- `Organisation`
- `CoachProfile`
- `CoachCredential`
- `CoachPrivilege`
- `Sport`
- `CurriculumVersion`
- `SkillDomain`
- `Stage`
- `Campaign`
- `CampaignStep`
- `SkillNode`
- `SkillPrerequisite`
- `Milestone`
- `Drill`
- `SkillDrill`
- `AssessmentRubric`
- `RubricCriterion`
- `AthleteCampaign`
- `AthleteSkillProgress`
- `PracticePlan`
- `PracticePlanStep`
- `PracticeSession`
- `PracticeAttempt`
- `MediaAsset`
- `EvidenceSubmission`
- `Assessment`
- `AssessmentCriterionScore`
- `AssessmentFeedback`
- `Booking`
- `Order`
- `Subscription`
- `Entitlement`
- `Payout`
- `Notification`
- `AuditEvent`
- `SafetyIncident`

### 27.3 Multi-organisation readiness

Even though the consumer MVP is household-centric, the data model SHOULD include optional `organisation_id` relationships for future club programmes. Organisation membership must never implicitly override parent consent or expose athlete data across organisations.

### 27.4 Curriculum graph storage

Prerequisites are stored as edges rather than embedded arrays. Publication validation computes:

- cycle detection;
- reachability from stage/campaign starts;
- orphan nodes;
- missing hard prerequisites;
- invalid cross-version edges;
- branch closure;
- milestone coverage.

A cached materialised graph may improve reads, but relational edges remain authoritative.

### 27.5 Progress provenance

Every `AthleteSkillProgress` record stores or can derive:

- current state;
- state version;
- curriculum/node version;
- first introduced date;
- most recent practice date;
- demonstrated date;
- verified date;
- verifying assessment ID;
- revisit due date;
- transition trigger event ID;
- administrative correction provenance, if any.

### 27.6 Deletion model

Deletion is a workflow, not a single cascade:

1. verify requester authority;
2. freeze new processing;
3. identify legal/dispute holds;
4. revoke access and delete media renditions;
5. anonymise or delete personal rows according to policy;
6. preserve minimal financial/audit records where legally required;
7. remove analytics identifiers or re-key irreversibly;
8. produce completion report.

---

## 28. API design

### 28.1 API style

- REST over HTTPS.
- JSON request/response.
- OpenAPI 3.1 source-controlled contract.
- `/v1` path prefix.
- plural resource names.
- cursor pagination for growing collections.
- idempotency keys for client retries on important writes.
- RFC 7807-style problem details or equivalent consistent error envelope.
- ETags or version fields for concurrent edits where relevant.

### 28.2 Authentication and authorisation

- Browser uses secure, HTTP-only, SameSite cookies or provider-recommended token exchange.
- Native client later uses OAuth/OIDC PKCE.
- API verifies issuer, audience, expiry and revocation/suspension state.
- Authorisation combines RBAC and resource-level policy checks.
- Every athlete-scoped endpoint validates household relationship or explicit authorised assignment.

### 28.3 Representative endpoints

```text
GET    /v1/me
GET    /v1/households/{householdId}
POST   /v1/households/{householdId}/athletes
GET    /v1/athletes/{athleteId}
PATCH  /v1/athletes/{athleteId}
POST   /v1/athletes/{athleteId}/baseline
GET    /v1/athletes/{athleteId}/dashboard
GET    /v1/athletes/{athleteId}/skill-tree
GET    /v1/athletes/{athleteId}/passport
POST   /v1/athletes/{athleteId}/branch-selections
POST   /v1/athletes/{athleteId}/practice-plans
GET    /v1/practice-plans/{planId}
POST   /v1/practice-plans/{planId}/sessions
PATCH  /v1/practice-sessions/{sessionId}
POST   /v1/practice-sessions/{sessionId}/complete
POST   /v1/evidence/upload-intents
POST   /v1/evidence-submissions
GET    /v1/evidence-submissions/{evidenceId}
POST   /v1/assessments/{assessmentId}/appeals
GET    /v1/coach/assessment-queue
GET    /v1/coach/assessments/{assessmentId}
POST   /v1/coach/assessments/{assessmentId}/decision
GET    /v1/coaches/{coachId}/availability
POST   /v1/bookings
POST   /v1/orders
POST   /v1/webhooks/stripe
POST   /v1/admin/curricula
POST   /v1/admin/curricula/{id}/validate
POST   /v1/admin/curricula/{id}/publish
```

### 28.4 Error envelope

Example:

```json
{
  "type": "https://errors.nextstep.example/prerequisite-not-met",
  "title": "Skill is not available",
  "status": 409,
  "code": "SKILL_PREREQUISITE_NOT_MET",
  "detail": "Complete Controlled Jump Stop before starting Crossover on the Move.",
  "correlationId": "01J...",
  "meta": {
    "missingPrerequisiteNodeIds": ["node_123"]
  }
}
```

User-facing text must not expose internal stack traces or sensitive identifiers.

### 28.5 Idempotency

The following writes MUST support idempotency:

- practice session completion;
- evidence-submission creation;
- assessment decision submission;
- order creation;
- payment webhooks;
- booking creation/cancellation;
- curriculum publication.

An idempotency record stores key, actor, endpoint/operation, request hash, response reference and expiry.

### 28.6 API contract companion

`contracts/openapi.yaml` contains an initial contract skeleton. Agents should expand it endpoint by endpoint and keep generated clients/tests in sync.

---

## 29. Domain events and asynchronous processing

### 29.1 Event principles

- Domain events describe facts that have occurred.
- Events are persisted transactionally using an outbox pattern.
- Consumers must be idempotent.
- Event schema includes version, event ID, aggregate ID, actor, correlation ID and timestamp.
- Personally identifying properties are minimised.

### 29.2 Core events

```text
HouseholdCreated
AthleteCreated
AthleteBaselineCompleted
AthleteCampaignAssigned
BranchSelected
PracticePlanGenerated
PracticeSessionStarted
PracticeStepCompleted
PracticeSessionCompleted
SafetyFlagRaised
SkillStateChanged
RevisitScheduled
EvidenceUploadCompleted
EvidenceSubmitted
AssessmentRequested
AssessmentAssigned
AssessmentCompleted
AssessmentAppealed
MilestoneVerified
BookingCreated
BookingCompleted
PaymentCaptured
SubscriptionEntitlementChanged
CoachCredentialExpiring
CoachSuspended
CurriculumPublished
AthleteCurriculumMigrated
DeletionRequested
DeletionCompleted
```

### 29.3 Outbox workflow

Within the same database transaction as a state change:

1. update aggregate tables;
2. insert event into `outbox_events`;
3. commit;
4. dispatcher publishes event to SQS/EventBridge;
5. consumer processes idempotently;
6. event delivery status is observable.

This prevents progress updates from succeeding while notifications or passport projections silently lose the corresponding fact.

---

## 30. Media pipeline

### 30.1 Upload sequence

1. Client requests upload intent with athlete, node, expected type/size/duration and consent reference.
2. API authorises household and evidence eligibility.
3. API creates `MediaAsset` in `UPLOADING` state and returns a short-lived pre-signed multipart upload.
4. Client uploads directly to private S3.
5. Client calls completion endpoint with checksum/parts.
6. Worker verifies object metadata and file signature.
7. Worker scans for malware and probes codec/duration.
8. Worker creates a standard review rendition and thumbnail/still if permitted.
9. Worker marks asset `READY` or `REJECTED` with a safe reason.
10. Evidence submission can then enter assessment assignment.

### 30.2 Initial media constraints

**[ASSUMPTION]**

- maximum evidence duration: 90 seconds;
- target review rendition: 720p H.264/AAC or equivalent broadly supported format;
- client-side trim/compression offered, not trusted as the only validation;
- maximum raw file size configured by environment;
- one primary clip per evidence request, with multiple clips supported later;
- no live streaming in MVP.

### 30.3 Playback

- Reviewer requests authorised playback token.
- API verifies active assignment/role and logs grant.
- Signed URL/cookie expires quickly.
- Browser never receives bucket credentials.
- URLs are redacted from logs, analytics and error reporting.
- Download is disabled in UI where possible, while acknowledging that client-side capture cannot be absolutely prevented.

### 30.4 Media processing failures

The parent receives actionable states:

- upload interrupted;
- unsupported format;
- clip too long;
- corrupt file;
- processing delayed;
- privacy/safety quarantine;
- evidence does not show required movement.

Raw provider errors remain internal.

---

## 31. Recommendation and progress algorithms

### 31.1 Deterministic first

The MVP recommendation engine should be rules-based and explainable. Machine learning is not required to generate useful practices.

### 31.2 Candidate selection

For each athlete:

1. load active campaign and current branch;
2. collect `ACTIVE`, `AVAILABLE` and `REVISIT_DUE` nodes;
3. exclude nodes blocked by safety, environment or recent load;
4. prioritise current campaign target;
5. select a prerequisite/support node where configured;
6. select one due retrieval node;
7. choose drills compatible with space/equipment and recent variation;
8. fit steps to duration while preserving warm-up and reflection;
9. persist the reason for each selected step.

### 31.3 Scoring example

A transparent internal candidate score may be:

```text
score =
  campaignPriority
  + revisitUrgency
  + underrepresentedDomainWeight
  + parentSelectedFocusWeight
  + coachPrescriptionWeight
  - recentRepetitionPenalty
  - loadRiskPenalty
  - environmentMismatchPenalty
```

Weights are configuration. The API returns explanation codes, not the raw score, such as `CURRENT_CAMPAIGN_TARGET`, `REVISIT_DUE` or `COACH_PRESCRIBED`.

### 31.4 Progress evaluation

After a qualifying event, the Progress module:

1. locks the athlete-node version or uses optimistic concurrency;
2. loads immutable completion-rule snapshot;
3. aggregates eligible sessions/attempts;
4. checks minimum calendar span and successful attempts;
5. checks evidence/assessment state;
6. emits at most one valid transition;
7. evaluates downstream unlocks;
8. schedules revisit if mastered;
9. records provenance and explanation.

The same event replay must not duplicate mastery or unlock notifications.

### 31.5 Coach override

A coach may prescribe additional work or return an assessment as `NEEDS_WORK`, but cannot silently mark prerequisites complete outside authorised assessment/correction workflows.

---

## 32. Authorisation model

### 32.1 Roles

- `PARENT_OWNER`
- `CAREGIVER`
- `COACH`
- `LEAD_ASSESSOR`
- `CURRICULUM_EDITOR`
- `CURRICULUM_APPROVER`
- `SUPPORT_AGENT`
- `SAFETY_ADMIN`
- `FINANCE_ADMIN`
- `PLATFORM_ADMIN`
- `ORG_ADMIN` (future)

### 32.2 Policy examples

- Parent owner can manage household athletes and consent.
- Caregiver can practise/log, but destructive/export actions may require owner permission.
- Coach can view an athlete only through an active assessment/booking grant.
- Coach cannot view unrelated household contact or billing information.
- Curriculum editor cannot publish their own change.
- Support agent cannot view evidence without a time-limited approved access grant.
- Finance admin can see payment records but not practice media.
- Platform admin is not automatically a universal media viewer.

### 32.3 Object-level checks

Every athlete, media, assessment, passport and booking request MUST evaluate resource relationship, not merely route-level role. Automated tests must attempt cross-household and cross-coach ID substitution.

---

## 33. Payments and marketplace design

### 33.1 Provider isolation

The platform stores business objects such as order, entitlement, price key, refund and payout. Stripe IDs are adapter references. No core progression logic depends directly on a provider webhook object.

### 33.2 Subscription lifecycle

```text
FREE -> TRIAL -> ACTIVE -> GRACE -> CANCELLED/EXPIRED
```

Entitlements are calculated from subscription state plus promotional/credit grants. A payment webhook changes billing state; a separate entitlement projection decides feature access.

### 33.3 Assessment purchase lifecycle

```text
DRAFT -> PAYMENT_PENDING -> PAID -> SERVICE_PENDING
-> COMPLETED -> PAYOUT_PENDING -> PAID_OUT
```

Alternative states include cancelled, refunded, disputed and expired.

### 33.4 Marketplace controls

- coach onboarding and payout identity are separate from public coaching identity;
- platform sets permitted service categories;
- prices may be platform-fixed in pilot and configurable later;
- parent sees total price before purchase;
- coach sees expected payout;
- platform fee/tax treatment is recorded;
- refunds and cancellations follow published policy;
- payout can be held for incident/dispute review.

---

## 34. Notifications

### 34.1 Notification types

- next practice available;
- revisit due;
- checkpoint ready for evidence;
- upload complete/failed;
- assessment assigned/completed;
- retry feedback available;
- booking confirmation/reminder/change;
- subscription/payment issue;
- credential expiry for coaches;
- safety/support response;
- data export/deletion status.

### 34.2 Rules

- Parent controls optional practice reminders.
- Safety, payment and security messages cannot be disabled when necessary.
- Notifications must not reveal sensitive child details on lock screens.
- No notifications are sent directly to a child identity in MVP.
- Quiet hours use household time zone.
- Each notification links to an authorised in-app destination, not directly to a media URL.

---

## 35. Search and content delivery

The MVP does not need a general public search engine. Internal search supports:

- admin curriculum lookup;
- coach assessment queue filters;
- parent passport filtering;
- support lookup with restricted identifiers.

PostgreSQL full-text/trigram search is sufficient initially. A separate search cluster should be introduced only when scale or relevance needs justify it.

Content videos and images are delivered through a CDN. Public demonstration content may use a separate public asset bucket; child evidence always remains private and uses a distinct access path and lifecycle policy.

---

## 36. Security engineering

### 36.1 Baseline controls

- TLS everywhere;
- encryption at rest using managed keys, with sensitive buckets/databases separated;
- secrets in AWS Secrets Manager/Parameter Store, never in repository;
- least-privilege IAM and short-lived deployment credentials;
- secure headers and content-security policy;
- CSRF protection appropriate to session design;
- output encoding and input validation;
- rate limiting and abuse controls;
- dependency and container scanning;
- infrastructure-policy scanning;
- database network isolation;
- regular restore and incident exercises;
- vulnerability disclosure/contact path.

### 36.2 Secure development requirements

- Threat model each release involving child media, access sharing or coach contact.
- Security-sensitive pull requests require designated review.
- No production data in development/test.
- Synthetic athlete/media fixtures only.
- Logs and traces must use an allow-list of safe fields.
- Penetration testing before public launch and after material auth/media changes.
- Access reviews for privileged roles.
- Automated checks for S3 public-access settings and overly broad IAM.

### 36.3 Abuse controls

- upload and assessment rate limits;
- account lockout and anomaly detection;
- coach feedback text policy and report button;
- quarantine for suspicious media;
- booking velocity/chargeback monitoring;
- ban evasion controls proportionate to risk;
- support escalation for household-access disputes.

---

## 37. Testing strategy

### 37.1 Test pyramid by risk

1. **Pure domain unit tests**
   - graph validation;
   - completion rules;
   - state machines;
   - practice candidate selection;
   - entitlement logic;
   - booking/payment states.

2. **Module integration tests**
   - PostgreSQL repositories with Testcontainers;
   - outbox transactions;
   - object-level authorisation;
   - idempotency;
   - provider adapters using contract mocks.

3. **API contract tests**
   - OpenAPI validation;
   - generated client compatibility;
   - error envelopes;
   - pagination;
   - webhook signature and replay handling.

4. **End-to-end tests**
   - onboarding to first practice;
   - practice completion and progress update;
   - video evidence request/upload simulation;
   - coach review and unlock;
   - booking and payment sandbox;
   - deletion request;
   - curriculum publication/migration.

5. **Accessibility tests**
   - automated axe checks;
   - keyboard-only critical flows;
   - screen-reader manual tests;
   - reduced motion and zoom;
   - accessible skill-tree alternative.

6. **Security tests**
   - cross-household IDOR;
   - cross-coach media access;
   - expired signed URL;
   - privilege escalation;
   - malicious upload metadata;
   - webhook replay;
   - rate-limit bypass.

7. **Operational tests**
   - queue backlog recovery;
   - failed transcode retry;
   - database restore;
   - credential expiry suspension;
   - review SLA alert;
   - deletion workflow.

### 37.2 Golden curriculum fixtures

Maintain small canonical fixtures representing:

- linear path;
- controlled branch;
- soft and hard prerequisite;
- milestone with video assessment;
- retry loop;
- revisit schedule;
- curriculum migration;
- archived node.

These fixtures are used across domain, API and UI tests.

### 37.3 Release acceptance

A release cannot ship when:

- critical object-level authorisation tests fail;
- curriculum graph validation fails;
- practice completion is non-idempotent;
- media can become public;
- coach with invalid credential can receive work;
- key flows fail WCAG critical checks;
- data deletion/export is broken;
- payment webhooks are not replay-safe;
- audit events are missing for privileged actions.

---

## 38. DevOps and environments

### 38.1 Environments

- `local`: Docker Compose, local object-storage emulator where useful, synthetic fixtures.
- `dev`: shared integration environment with fake/sandbox external providers.
- `preview`: per-pull-request web/API where feasible, synthetic data only.
- `staging`: production-like, isolated, payment sandbox, full security configuration.
- `production`: AWS Sydney, tightly controlled access.

### 38.2 CI pipeline

On every pull request:

1. format/lint/type-check;
2. unit tests;
3. schema/OpenAPI validation;
4. integration tests;
5. dependency/secret/container/IaC scans;
6. build web/API/worker;
7. deploy preview where allowed;
8. Playwright smoke/accessibility tests.

On protected deployment:

1. approved migration plan;
2. database backup/checkpoint;
3. deploy canary or rolling update;
4. run smoke tests;
5. monitor errors, latency and business events;
6. rollback application or apply forward database fix according to migration policy.

### 38.3 Database migration rules

Use expand/migrate/contract for breaking changes:

- add compatible schema;
- deploy code supporting old/new;
- backfill asynchronously;
- switch reads/writes;
- verify;
- remove old fields in later release.

No irreversible destructive migration should be coupled to the first code deployment that stops using a field.

### 38.4 Feature flags

Feature flags support:

- cohort curriculum rollout;
- new practice generator;
- video assessment activation;
- payments;
- coach marketplace;
- passport export;
- experimental branch wording.

Flags need owner, expiry/review date and cleanup task.

---

## 39. MVP release definition

### 39.1 MVP user promise

A parent can create a child profile, receive a credible prescribed basketball pathway, complete guided home practices, see the child's progress on a skill tree, submit a private video at a checkpoint, receive structured coach feedback and unlock the next part of the pathway.

### 39.2 MVP functional slice

**Must ship:**

- parent authentication;
- household and athlete profiles;
- consent and safety onboarding;
- Foundation basketball campaign;
- baseline recommendation;
- dashboard;
- skill tree/progress;
- skill detail;
- guided practice player;
- practice logging and progress state machine;
- one controlled branch point;
- one video-assessed checkpoint;
- coach queue and rubric;
- feedback/retry/pass;
- private passport timeline;
- admin curriculum authoring or reliable import workflow;
- audit logs;
- basic subscription/assessment sandbox or production payments according to pilot stage;
- production-grade privacy/media access controls.

**May follow immediately after the first usable slice:**

- additional Foundation campaigns;
- full Builder content;
- in-person booking;
- coach payouts;
- downloadable passport;
- multiple caregivers;
- offline session sync;
- organisation cohorts.

### 39.3 MVP content bar

The MVP is not complete with placeholder drills. At least one end-to-end campaign must have:

- professionally reviewed learning objectives;
- demonstrations and captions;
- child and parent cues;
- safety metadata;
- easier/harder variants;
- completion rules;
- a validated milestone rubric;
- coach calibration examples.

---

## 40. Phased product roadmap

### Phase A: Founder prototype

- clickable UX and domain model;
- small Foundation curriculum fixture;
- no real payments;
- founder/known-family accounts;
- manual coach assignment;
- direct observation of parent-child use.

### Phase B: Closed alpha

- production authentication and private media;
- prescribed practice and progress engine;
- asynchronous assessment;
- admin content workflow;
- audit and deletion basics;
- small invitation-only coach pool.

### Phase C: Paid Sydney pilot

- subscription/assessment payments;
- coach SLA and quality operations;
- in-person milestones;
- calibrated curriculum expansion;
- support/safeguarding runbooks;
- family retention measurement.

### Phase D: Consumer beta

- polished onboarding;
- offline-friendly practice;
- parent referrals;
- broader coach supply;
- passport exports;
- improved recommendations;
- controlled geographic expansion.

### Phase E: Organisation layer

- club/academy tenants;
- cohort assignment;
- organisation dashboards;
- coach management;
- parent-approved data sharing;
- curriculum variants.

### Phase F: Multi-sport platform

- second sport pack;
- reusable sport-pack authoring tools;
- cross-sport movement domains where appropriate;
- native mobile clients;
- carefully governed automated analysis as an assistive feature.

---

## 41. Epic backlog and acceptance criteria

### EPIC-01: Parent account and athlete onboarding

**Acceptance criteria:**

- Parent creates/verifies account and accepts current terms/consents.
- Parent creates athlete with minimum data.
- Baseline returns a starting campaign with explanation.
- Parent can start first practice without admin intervention.
- Cross-household athlete access is denied and tested.

### EPIC-02: Curriculum engine

**Acceptance criteria:**

- Admin imports or authors domains, campaigns, nodes, prerequisites, drills and rubric.
- Validator blocks cycles/unreachable required nodes/missing safety data.
- Published version is immutable.
- UI can render the same data without basketball-specific code in core components.

### EPIC-03: Skill tree and dashboard

**Acceptance criteria:**

- Dashboard always returns one valid next action.
- Tree displays all canonical states with accessible alternative.
- Locked node explains prerequisites.
- Controlled branch can be selected once under configured rules.
- State change updates dashboard/tree consistently.

### EPIC-04: Guided practice

**Acceptance criteria:**

- Parent selects duration/environment.
- System generates a persisted plan.
- Practice mode supports all core result types and easier variant.
- Pause/resume survives refresh or device interruption.
- Completion is idempotent and produces expected attempts/events.
- Safety flag halts progression and is visible to parent/support rules.

### EPIC-05: Progress and retention

**Acceptance criteria:**

- Completion-rule engine handles minimum sessions, calendar span and evidence conditions.
- State transitions are valid and auditable.
- Mastery unlocks only eligible nodes.
- Revisit date is scheduled and can reactivate skill.
- Historical progress survives curriculum version change.

### EPIC-06: Private evidence

**Acceptance criteria:**

- Parent receives recording guide and grants purpose-specific consent.
- Direct upload uses short-lived private credentials.
- Invalid/oversized/corrupt media is rejected safely.
- Only authorised household and assigned reviewer can play evidence.
- Signed URL expiry and cross-reviewer access tests pass.
- Deletion/retention workflow is functional.

### EPIC-07: Coach assessment

**Acceptance criteria:**

- Eligible coach receives assignment queue.
- Rubric snapshot is immutable for the assessment.
- Coach must complete critical criteria and feedback.
- Pass/retry produces expected progression action.
- Parent can appeal.
- Coach turnaround and scoring data are captured.

### EPIC-08: Athlete passport

**Acceptance criteria:**

- Timeline shows practices, state changes and assessments in correct order.
- Verified versus demonstrated is clear.
- Archived curriculum nodes remain understandable.
- Parent can request export.
- No public sharing exists in MVP.

### EPIC-09: Billing

**Acceptance criteria:**

- Subscription entitlement follows provider state idempotently.
- Assessment order cannot be double-created by retry.
- Webhook replay does not duplicate credits or payment state.
- Refund/dispute is audited.
- Sensitive payment data is never stored directly.

### EPIC-10: Admin, safety and audit

**Acceptance criteria:**

- Maker-checker curriculum publish.
- Coach credential expiry prevents new work.
- Privileged support media access is reason-coded and time-limited.
- Safety incident can be created, assigned and resolved.
- Audit search can reconstruct critical actions.

---

## 42. Operational design

### 42.1 Coach service levels

Initial operations should define and measure:

- target response window for remote reviews;
- maximum open queue per coach;
- reassignment threshold;
- unable-to-assess reasons;
- appeal response path;
- review quality sample rate;
- payout timing;
- suspension/escalation criteria.

Exact targets are an **[OPEN]** operating decision and must be configuration.

### 42.2 Content governance

Every published node/drill should have:

- content owner;
- coaching reviewer;
- child-safety reviewer where appropriate;
- last review date;
- next review date;
- evidence of media rights;
- version change notes.

### 42.3 Support model

Support categories:

- account/household access;
- practice/content confusion;
- upload failure;
- assessment question/appeal;
- booking/payment;
- coach conduct;
- child safety;
- privacy/export/deletion.

Child-safety and privacy requests must bypass the general queue according to severity.

### 42.4 Insurance and waivers

Before paid coaching or public launch, operations must confirm:

- public liability and professional indemnity coverage;
- contractor/employee arrangements;
- venue requirements;
- participant waiver and informed-risk wording;
- incident reporting and emergency process;
- limits of home-practice guidance;
- coach scope of practice.

---

## 43. Risk register

| Risk | Impact | Mitigation |
|---|---|---|
| Curriculum is broad but not credible | Low trust and poor outcomes | Launch one deep campaign, use expert review, versioning and outcome data. |
| Too much assessment friction | Families stall and costs rise | Practice often/assess occasionally; reserve human review for meaningful checkpoints. |
| Parents execute drills incorrectly | Technique/safety issues | Strong demos, minimal cues, common errors, easier variants and periodic verification. |
| Video privacy incident | Severe trust/regulatory harm | Parent control, private storage, short-lived access, minimisation, audit and deletion. |
| Coach misconduct or poor feedback | Child harm and brand damage | WWCC, identity, code, calibration, structured channels, reporting and suspension. |
| Inconsistent assessors | Passport loses credibility | Rubrics, double-scoring, inter-rater metrics and lead review. |
| Overtraining | Injury/burnout | Load/fatigue check, duration guidance, rest messaging, safety stop and parent supervision. |
| Gamification creates unhealthy pressure | Child disengagement | No public ranking; celebrate personal progress and consistency. |
| Product becomes another content library | Weak differentiation | Prescribed campaigns, progress rules and assessment as core architecture. |
| Marketplace launched too early | Operational failures | Invitation-only supply and founder-led geography first. |
| Multi-sport scope creep | Delayed basketball product | Sport-agnostic data model but basketball-only public release. |
| Cloud/video cost grows | Poor margins | Short clips, client trim, lifecycle rules, rendition strategy and cost telemetry. |
| AI overreach | Incorrect/opaque decisions and privacy risk | Keep AI out of mastery critical path; explicit consent and human review. |
| Household disputes | Unauthorised access | Membership controls, owner permissions, support verification and audit trail. |
| Curriculum migration corrupts history | Loss of trust | Immutable versions, equivalence maps and provenance. |

---

## 44. Open decisions

These decisions should be resolved through pilot research or ADRs, not hidden assumptions:

1. Final product naming convention: “Next Step” versus “NextStep” in consumer copy and domains.
2. Exact Foundation campaign node count and milestone cadence.
3. How much baseline is observational versus parent questionnaire.
4. Remote assessment price and coach compensation.
5. In-person assessment duration, group size and venue model.
6. Evidence retention duration after review.
7. Whether a caregiver can export/delete or only household owner.
8. Whether multiple children are included in the base subscription.
9. Exact age-band storage (year, month/year or full DOB).
10. Whether the pilot uses manual curriculum import before full CMS.
11. PWA authentication choice within the managed identity boundary.
12. Which practice content is downloadable/offline in the first release.
13. Appeal policy and whether a second review consumes a credit.
14. Organisation/club data-sharing policy.
15. Brand visual system and child-facing tone.
16. Native mobile trigger metrics.
17. Second sport selection.

---

## 45. Definition of done

A feature is done only when:

- linked requirement IDs and acceptance criteria are satisfied;
- product/UX handles loading, empty, error, offline and unauthorised states;
- object-level authorisation is implemented and tested;
- personal data is minimised and telemetry is scrubbed;
- accessibility checks pass for the affected flow;
- domain, integration and relevant E2E tests pass;
- API/OpenAPI and schema changes are documented;
- migrations are forward/rollback-safe according to policy;
- audit/observability is present;
- user-facing copy is reviewed for parent and child clarity;
- safety/content review is complete where relevant;
- runbooks/support notes are updated;
- no unresolved critical/high security issue exists;
- feature flag/rollout and rollback path are defined.

---

## 46. Agent execution model

A companion `AGENTS.md` converts this specification into multi-agent operating instructions. The recommended workstreams are:

1. Product/UX agent.
2. Curriculum/content agent.
3. Domain/data agent.
4. API/backend agent.
5. Web/PWA agent.
6. Media/platform agent.
7. Security/privacy agent.
8. QA/accessibility agent.
9. DevOps/observability agent.
10. Integration/release agent.

Agents must work from shared requirement IDs and contracts, not independently invent parallel domain vocabulary. Significant deviations require an ADR.

---

## Appendix A. Example skill node

```json
{
  "key": "basketball.foundation.dribbling.stationary-left-pound",
  "name": "Stationary Left-Hand Pound Dribble",
  "childName": "Strong Left-Hand Bounces",
  "sport": "basketball",
  "curriculumVersion": "basketball-au-1.0",
  "domain": "ball-mastery-dribbling",
  "stage": "foundation",
  "objective": "Maintain a controlled left-hand dribble at approximately hip height for 20 seconds while staying balanced and looking forward for repeated intervals.",
  "hardPrerequisites": [
    "basketball.foundation.ball-mastery.hand-comfort"
  ],
  "softPrerequisites": [
    "basketball.foundation.movement.athletic-stance"
  ],
  "equipment": ["basketball"],
  "space": "approximately 2m x 2m clear area",
  "safety": [
    "Use a non-slip surface.",
    "Keep the area clear of people and breakable objects.",
    "Stop if wrist, finger or back pain occurs."
  ],
  "childCues": ["Bend", "Bounce hard", "Eyes forward"],
  "completionRule": {
    "minimumCompletedSessions": 3,
    "minimumCalendarSpanDays": 5,
    "requiredSuccessfulAttempts": 2,
    "requiresEvidence": false,
    "revisitAfterDays": 21
  },
  "unlocks": [
    "basketball.foundation.dribbling.moving-left-control"
  ]
}
```

---

## Appendix B. Example practice plan

```json
{
  "athleteId": "ath_01J...",
  "campaignKey": "basketball.foundation.campaign-1",
  "targetDurationMinutes": 20,
  "generationReasons": [
    "CURRENT_CAMPAIGN_TARGET",
    "LEFT_SIDE_DEVELOPMENT",
    "REVISIT_DUE"
  ],
  "steps": [
    {
      "type": "SAFETY_CHECK",
      "durationSeconds": 30
    },
    {
      "type": "DRILL",
      "drillKey": "movement.ready-stop-game",
      "primaryNodeKey": "basketball.foundation.movement.stop-control",
      "durationSeconds": 180
    },
    {
      "type": "DRILL",
      "drillKey": "dribbling.left-pound-three-rounds",
      "primaryNodeKey": "basketball.foundation.dribbling.stationary-left-pound",
      "durationSeconds": 420
    },
    {
      "type": "DRILL",
      "drillKey": "passing.target-gates",
      "primaryNodeKey": "basketball.foundation.passing.chest-accuracy",
      "durationSeconds": 300
    },
    {
      "type": "RETRIEVAL",
      "drillKey": "footwork.jump-stop-freeze",
      "primaryNodeKey": "basketball.foundation.footwork.jump-stop",
      "durationSeconds": 180
    },
    {
      "type": "REFLECTION",
      "durationSeconds": 90
    }
  ]
}
```

---

## Appendix C. Example assessment rubric

**Skill:** Right and left layup coordination  
**Evidence:** One continuous clip showing three attempts on each side, full body and basket visible.

| Criterion | Critical | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| Correct step sequence | Yes | Sequence not established | Correct occasionally with prompts | Correct on most attempts | Correct at pace and from varied start |
| Opposite knee/hand coordination | Yes | Same-side pattern or uncontrolled | Correct intermittently | Correct consistently in drill | Maintains coordination under light pressure |
| Ball control on gather | Yes | Loses/exposes ball often | Inconsistent secure gather | Secure on most attempts | Protects and adjusts to angle |
| Balanced take-off/landing | Yes | Unsafe/uncontrolled | Balance inconsistent | Controlled and safe | Controlled at increased pace |
| Use of both sides | Yes | Avoids one side | One side materially weaker | Both sides meet drill standard | Both sides adapt to varied approach |

Initial pass rule: every critical criterion at least 3. A score of 4 is not required for Foundation verification.

---

## Appendix D. Product copy principles

### Parent copy

- Explain the purpose, not only the instruction.
- Avoid pretending the system has diagnosed talent.
- Use observable language: “kept balance on four of five attempts.”
- Do not imply that more sessions always equal faster improvement.
- Be explicit when a result is parent-observed versus coach-verified.

### Child copy

- One action at a time.
- Two or three cues maximum.
- Prefer verbs: bend, look, push, stop, land.
- Avoid labels such as “bad,” “weak player” or “behind.”
- Celebrate effort plus a specific improvement.

### Coach copy

- Specific, neutral and actionable.
- Comment on movement/decision, never body appearance.
- One primary correction before multiple secondary details.
- No off-platform contact requests.

---

## Appendix E. References

- HomeCourt, public product materials on interactive basketball training, camera-based feedback and tracked performance: https://www.homecourt.ai/
- DribbleUp, public product materials on smart-equipment-guided workouts, live/on-demand classes and tracked performance: https://dribbleup.com/products/smart-basketball
- MOJO Sports, public product materials on youth coaching videos, practice planning and team-management tools: https://mojo.sport/
- Onform, public product materials on private sports-video recording, analysis, coach feedback and sharing: https://onform.com/
- Office of the Australian Information Commissioner, Children's Online Privacy Code: https://www.oaic.gov.au/privacy/privacy-registers/privacy-codes/childrens-online-privacy-code
- Australian eSafety Commissioner, Safety by Design: https://www.esafety.gov.au/industry/safety-by-design
- NSW Office of the Children's Guardian, Who needs a Working with Children Check: https://ocg.nsw.gov.au/working-children-check/who-needs-check
- W3C, Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22/

[^homecourt]: HomeCourt public product materials describe interactive basketball training, camera-based feedback, tracked shots/movements and challenges: https://www.homecourt.ai/

[^dribbleup]: DribbleUp public product materials describe smart-equipment-guided workouts, live/on-demand classes and tracked performance: https://dribbleup.com/products/smart-basketball

[^mojo]: MOJO Sports public materials describe youth coaching videos, practice planning and team-management tools: https://mojo.sport/

[^onform]: Onform public materials describe private recording, video analysis, coach feedback and sharing workflows: https://onform.com/

[^oaic-code]: Office of the Australian Information Commissioner, “Children's Online Privacy Code.” The page states that the Code must be finalised and registered by 10 December 2026 and describes the 2026 exposure-draft consultation: https://www.oaic.gov.au/privacy/privacy-registers/privacy-codes/childrens-online-privacy-code

[^esafety]: Australian eSafety Commissioner, “Safety by Design,” which places user safety and rights at the centre of product and service design: https://www.esafety.gov.au/industry/safety-by-design

[^wwcc]: NSW Office of the Children's Guardian, “Who needs a Check,” including extracurricular coaches and instructors performing child-related work: https://ocg.nsw.gov.au/working-children-check/who-needs-check

[^wcag]: W3C Recommendation, Web Content Accessibility Guidelines (WCAG) 2.2: https://www.w3.org/TR/WCAG22/

