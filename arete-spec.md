# Arete — Product Specification v0.3

## 1. Problem Statement

Most runners either follow rigid, generic training plans that don't adapt to their real life, or they run without any structure and plateau or get injured. Existing apps track runs well but don't intelligently plan, schedule, or recover from disruptions. Coaching is expensive and inaccessible.

**Arete** gives every runner a smart, adaptive coach in their pocket — one that builds a scientifically grounded training plan, routes them on real paths, keeps their schedule in sync with their calendar, and responds intelligently to injuries, missed runs, and life getting in the way.

---

## 2. Target Users

| Segment | Description |
|---|---|
| Beginners | Just starting out, need guidance, motivation, and low injury risk |
| Casual runners | Run a few times a week, want structure without obsessing |
| Goal-oriented | Training for a 5K, 10K, half or full marathon with a target date |

All segments share the same core app — the AI adapts its behavior to the user's experience level and goals.

---

## 3. Goals

**Must achieve:**
- Generate a personalized, periodized training plan based on sports science principles
- Generate GPS-navigable routes matched to each training session's distance and type
- Track runs live with useful stats (pace, HR, cadence, elevation, splits)
- Sync with calendar to schedule runs at times the user can actually do them
- Reschedule automatically when meetings, events, or life conflicts arise
- Adapt the plan intelligently in response to injury or illness

**Nice to have (later):**
- Social/competitive features (leaderboards, challenges with friends)
- Apple Watch / Wear OS companion app
- Integration with Strava, Garmin, Whoop, etc.
- Coaching voice cues during the run

**Out of scope (v1):**
- Web app
- Nutrition tracking
- Strength training plans

---

## 4. Core User Flows

### 4.1 Onboarding
1. User creates an account
2. AI conducts a short pre-interview: current fitness level, recent running history, weekly availability, injury history, goal (event + date, or general fitness)
3. HR zones estimated from age (220 − age formula as baseline) and refined by pace data from any recent runs the user logs or imports
4. Grants calendar access (Google Calendar / Apple Calendar)
5. Grants location access
6. AI generates an initial multi-week training plan
7. Runs are automatically added to the user's calendar

### 4.2 Pre-Run: Route Generation
1. User opens today's scheduled run
2. App shows: session type (easy run, tempo, intervals, long run), target distance, target pace zone
3. User taps "Generate Route" — AI proposes a route from current location matching the session distance, surface preference, and elevation profile appropriate for the session type
4. User can regenerate, manually adjust, or select a saved favourite route
5. User starts the run

### 4.3 Active Run: GPS Tracking
1. Map shows the route with turn-by-turn directions
2. Live stats overlay: elapsed time, current pace, target pace zone, distance covered, heart rate (if device connected)
3. Audio cues at key points: km/mile markers, pace alerts, turn warnings
4. User can pause, stop early, or mark a problem (injury / fatigue)

### 4.4 Post-Run: Session Summary
1. Auto-saved: route, splits, avg pace, HR, elevation, effort rating
2. AI comment on the session: "You ran your tempo intervals 8 seconds/km faster than target — good, but watch for fatigue tomorrow"
3. Plan updated if the run deviated significantly
4. HR zone estimates refined if useful data was collected

### 4.5 Calendar & Rescheduling
1. Runs appear in the user's calendar as events
2. Calendar polled continuously in the background; when a conflict is detected (new meeting overlapping a run), app sends a notification: "Looks like your Tuesday tempo is blocked — want to move it to Tuesday evening or Wednesday morning?"
3. User approves or adjusts; calendar updated
4. If a run is missed entirely, plan adapts (doesn't just pile extra miles on the next session)

### 4.6 Injury / Illness Handling
1. User reports an issue: type (knee, shin, fatigue, illness), severity (1–5), duration estimate
2. AI restructures the upcoming plan: reduces load, suggests cross-training (cycling, swimming, aqua jogging) where appropriate
3. Marks a recovery timeline; gradually reintroduces running volume
4. Flags if the user's goal date is now at risk and proposes options (adjusted goal, new race)

### 4.7 Saved Routes
1. After completing any run, user can save the route with a custom name
2. Saved routes appear in a personal library, browsable by distance, surface, and elevation
3. When generating a route for a session, the app may suggest a saved favourite that matches the session's parameters
4. User can set a route as default for a given session type or neighbourhood

---

## 5. Training Plan Engine

The plan engine must follow established sports science principles:

- **Periodization**: base → build → peak → taper phases appropriate to goal distance and timeline
- **80/20 rule**: ~80% of weekly volume at easy/aerobic pace, ~20% at threshold or above
- **Progressive overload**: volume and intensity increase gradually week-on-week, with a recovery week every 3–4 weeks
- **Heart rate zones**: plan targets zones (Z1–Z5) estimated from age and refined continuously from actual run data
- **Recovery awareness**: plan respects back-to-back hard days; hard sessions separated by easy/rest days

The AI layer adapts the plan dynamically based on:
- Actual runs completed vs planned
- Pace and effort data from completed runs
- Reported injuries or fatigue
- Calendar conflicts and available windows
- Proximity to goal date

---

## 6. Long-Term Motivation (No Race Goal)

Research on exercise motivation — particularly Self-Determination Theory (Deci & Ryan) as applied to sport and exercise — identifies three core psychological needs that must be met for sustained engagement: **autonomy** (feeling in control of your own training), **competence** (seeing real progress and mastery), and **relatedness** (feeling connected to something larger than a single session).

For users without a race goal, the app sustains motivation through:

### Layered, rolling goals
Rather than a single distant finish line, the app generates a stack of short, medium, and long-term targets that stay fresh:
- **Weekly**: complete all scheduled sessions; hit a target weekly distance
- **Monthly**: a "fitness milestone" based on pace improvement, longest run to date, or total elevation climbed
- **Seasonal**: a loosely defined 12-week cycle (e.g. "Build your base", "Summer speed block") that gives shape to the training without requiring a race

### Streak & consistency tracking
A visible run streak (days with a completed session this week/month) reinforces habit formation. Critically, the streak measures *consistency*, not perfection — a rest day doesn't break it.

### Progress visibility
The app surfaces improvements the user might not notice themselves: "Your easy pace has improved by 15 seconds/km over the last 6 weeks." Competence feedback is one of the strongest drivers of intrinsic motivation in exercise research.

### Variety via route discovery
Route fatigue is a documented cause of motivation loss. The AI actively varies route suggestions over time, surfacing new paths and occasionally generating "exploration runs" designed to show the user a part of their city they haven't run before.

### Periodic "mini challenges"
Every 4–6 weeks, the app proposes an optional personal challenge: a time trial on a favourite route, a new distance PB attempt, or a themed challenge (e.g. "Run every morning this week"). These are always optional and framed as fun, not obligation.

### Identity reinforcement
The app subtly reinforces the user's identity as a runner — not just someone who exercises. Post-run summaries, streak acknowledgements, and milestone celebrations use language that affirms this ("You've now run more than 100km total — you're a runner").

---

## 7. Route Generation

- Routes generated from the user's current or specified start location
- Match session distance within ±5%
- Appropriate elevation: easy runs = flat; tempo = moderate; long runs = varied
- Prefer dedicated running/cycling paths over roads where possible
- Avoid busy roads, motorways
- Loop routes preferred (start = finish) unless user specifies point-to-point
- Route data sourced from OpenStreetMap / Google Maps API
- Users may save any completed route to their personal library

---

## 8. Data Model (Simplified)

**User**
- id, name, email, auth tokens
- fitness_level, weekly_availability, goal_event, goal_date
- injury_history[], calendar_provider, calendar_token
- age, hr_max_estimated, resting_hr, estimated_threshold_pace
- current_streak, total_distance_lifetime

**TrainingPlan**
- id, user_id, created_at, goal, phase (base/build/peak/taper)
- cycle_label (e.g. "Build your base — Summer 2026")
- sessions[]: scheduled_date, session_type, target_distance, target_pace_zone, status

**Session**
- id, plan_id, scheduled_date, session_type, target_distance, target_pace_zone
- status: scheduled | completed | missed | skipped
- actual_distance, actual_avg_pace, actual_duration, hr_avg
- route_id, notes
- _Detailed telemetry (per-km splits, cadence, HR stream, elevation profile) is recorded as run-sample data linked by `session_id`; this simplified model stores per-session aggregates only._

**Route**
- id, polyline, distance, elevation_gain, surface_type
- generated_at, source
- saved: bool, saved_name, saved_by_user_id

**CalendarEvent**
- id, session_id, external_event_id, calendar_provider, sync_status

**Milestone**
- id, user_id, type (distance_pb | pace_pb | streak | total_km | challenge_complete)
- achieved_at, value, display_message
- challenge_id (nullable — set when `type = challenge_complete`, references the completed Challenge)

**InjuryReport**
- id, user_id, reported_at
- type (knee | shin | calf | hip | foot | fatigue | illness | other)
- severity (1–5), estimated_duration_days
- status: active | recovering | resolved
- recovery_target_date, affected_plan_id (nullable)
- cross_training_suggested[] (e.g. cycling, swimming, aqua_jogging)
- goal_at_risk: bool, notes
- _Populates `User.injury_history[]` once resolved; drives plan restructuring in §4.6._

**Challenge**
- id, user_id, created_at
- type (time_trial | distance_pb_attempt | themed)
- title, description
- start_date, end_date
- target_metric (e.g. distance, pace, sessions_count), target_value
- linked_route_id (nullable — e.g. time trial on a favourite route)
- status: offered | accepted | completed | declined | expired
- _Optional, always user-opt-in (§6). Completion may create a `challenge_complete` Milestone._

---

## 9. AI Integration Points

| Feature | AI Role |
|---|---|
| Onboarding interview | Conversational intake to establish user profile and goal |
| Plan generation | Generate periodized plan from user profile + goal |
| Plan adaptation | Adjust upcoming sessions based on actual performance & life events |
| Route selection | Choose appropriate route profile for session type; explain reasoning |
| Post-run feedback | Natural language insight on the completed run |
| HR zone refinement | Update estimated zones from pace + effort data over time |
| Injury handling | Restructure plan; suggest cross-training; flag goal risk |
| Rescheduling | Detect conflicts, propose alternatives, update plan coherently |
| Motivation system | Generate rolling goals, mini challenges, and milestone messages |
| Coaching cues | Real-time pace and effort guidance during run (v2) |

---

## 10. Integrations

| System | Purpose | Required? |
|---|---|---|
| Google Calendar | Schedule runs, detect conflicts (continuous poll) | Must (v1) |
| Apple Calendar | Schedule runs, detect conflicts (continuous poll) | Must (v1) |
| Google Maps / OSM | Route generation, turn-by-turn | Must (v1) |
| Apple HealthKit | HR, steps, active energy | Should (v1) |
| Google Fit / Health Connect | HR, steps, active energy | Should (v1) |
| Strava | Export completed runs | Nice to have (v2) |
| Garmin Connect | Sync with GPS watches | Nice to have (v2) |

---

## 11. Monetisation

**During development**: fully free, no paywalls. All features available to all users.

**Post-launch**: subscription-only model. No freemium tier — the core value of the app (intelligent planning, route generation, calendar sync) cannot be meaningfully split into free/paid without degrading the experience. Pricing TBD.

---

## 12. Non-Functional Requirements

- **Privacy**: Location and health data stored with encryption at rest; not sold to third parties
- **Offline**: Route and active tracking must work without connectivity (GPS works offline; route pre-downloaded before run starts)
- **Performance**: Route generation < 5 seconds; plan generation < 10 seconds; calendar sync latency < 2 minutes
- **Battery**: GPS tracking must not drain more than ~10% battery per hour
- **Platform**: iOS 16+ and Android 10+ at launch

---

## 13. Open Questions

1. **Coach persona**: Does the AI have a name and personality, or stay neutral? To be decided after initial user testing.

---

*Spec version 0.3 — data model extended with `InjuryReport` and `Challenge` entities, a Session-telemetry note, and Milestone↔Challenge linkage to fully cover §4.6 (injury handling) and §6 (motivation). All major decisions resolved. One open question remains (coach persona); deferred to user testing. Ready for task breakdown.*
