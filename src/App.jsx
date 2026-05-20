import { useState, useEffect, useRef, useCallback } from 'react'

// ── Inline styles injected once ───────────────────────────────────────────────
const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0a0a;
    --green: #7a9e7e;
    --green-dim: #3d5c3f;
    --amber: #c8922a;
    --red: #8b2a2a;
    --red-light: #b03535;
    --text-dim: #2e3e2e;
    --border: #1a281a;
    --font: 'IBM Plex Mono', 'Courier New', monospace;
  }

  html, body, #root {
    height: 100%;
    background: var(--bg);
    color: var(--green);
    font-family: var(--font);
    font-size: 13px;
    line-height: 1.5;
    overflow: hidden;
  }

  #root::after {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      to bottom,
      transparent,
      transparent 1px,
      rgba(0,0,0,0.03) 1px,
      rgba(0,0,0,0.03) 2px
    );
    pointer-events: none;
    z-index: 9999;
  }

  @keyframes flicker {
    0%, 94%, 100% { opacity: 1; }
    95% { opacity: 0.85; }
    96.5% { opacity: 1; }
    97.5% { opacity: 0.88; }
    99% { opacity: 1; }
  }

  @keyframes blink {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }

  @keyframes notice-flash {
    0% { background: #0d1f0d; }
    100% { background: transparent; }
  }

  .game-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }

  .top-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 14px;
    border-bottom: 1px solid var(--border);
    background: #060606;
    flex-shrink: 0;
    animation: flicker 8s infinite;
  }

  .top-bar-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.15em;
  }

  .top-bar-operator {
    font-size: 10px;
    color: var(--green-dim);
    text-align: center;
    letter-spacing: 0.06em;
  }

  .top-bar-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .shift-timer {
    font-size: 10px;
    color: var(--amber);
    letter-spacing: 0.08em;
  }

  .region-indicators { display: flex; gap: 5px; }

  .region-box {
    border: 1px solid currentColor;
    padding: 2px 5px;
    font-size: 8px;
    letter-spacing: 0.06em;
    line-height: 1.4;
    text-align: center;
  }

  .st { color: var(--green-dim); }
  .un { color: var(--amber); }
  .dk { color: var(--red); }
  .lo { color: var(--red); opacity: 0.4; }
  .sy { color: var(--amber); }
  .of { color: var(--text-dim); }

  .panels {
    display: flex;
    flex: 1;
    overflow: hidden;
    min-height: 0;
  }

  .panel {
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .panel:last-child { border-right: none; }

  .panel-header {
    padding: 5px 10px;
    font-size: 9px;
    letter-spacing: 0.12em;
    color: var(--green-dim);
    border-bottom: 1px solid var(--border);
    background: #060606;
    flex-shrink: 0;
    text-transform: uppercase;
  }

  .panel-left { width: 210px; flex-shrink: 0; }

  .queue-scroll { overflow-y: auto; flex: 1; }

  .queue-item {
    padding: 7px 10px;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    position: relative;
    transition: background 0.1s;
  }

  .queue-item:hover { background: #0f180f; }
  .queue-item.active { background: #0c160c; border-left: 2px solid var(--green-dim); }
  .queue-item.done { opacity: 0.35; cursor: default; }

  .qi-num { font-size: 8px; color: var(--text-dim); letter-spacing: 0.06em; }
  .qi-origin { font-size: 10px; color: var(--green); margin-top: 1px; }
  .qi-subject { font-size: 9px; color: var(--green-dim); margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px; }
  .qi-time { font-size: 8px; color: var(--text-dim); margin-top: 2px; }

  .unread-dot {
    position: absolute;
    top: 9px; right: 8px;
    width: 4px; height: 4px;
    background: var(--amber);
    border-radius: 50%;
    animation: blink 1.4s infinite;
  }

  .panel-center { flex: 1; min-width: 0; }

  .tx-scroll { overflow-y: auto; flex: 1; padding: 14px; display: flex; flex-direction: column; }

  .tx-meta {
    font-size: 9px;
    color: var(--green-dim);
    border-bottom: 1px solid var(--border);
    padding-bottom: 8px;
    margin-bottom: 12px;
    line-height: 1.8;
    letter-spacing: 0.04em;
  }

  .tx-body {
    font-size: 12px;
    color: var(--green);
    line-height: 1.75;
    white-space: pre-wrap;
    flex: 1;
  }

  .action-area {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .action-buttons { display: flex; gap: 10px; flex-wrap: wrap; }

  .btn {
    padding: 6px 14px;
    font-family: var(--font);
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    background: transparent;
    cursor: pointer;
    transition: all 0.12s;
    border: 1px solid;
  }

  .btn:disabled { opacity: 0.2; cursor: not-allowed; }

  .btn-pass { border-color: var(--green); color: var(--green); }
  .btn-pass:not(:disabled):hover { background: var(--green); color: var(--bg); }

  .btn-contain { border-color: var(--red); color: var(--red); }
  .btn-contain:not(:disabled):hover { background: var(--red); color: var(--bg); }

  .btn-intercept { border-color: var(--amber); color: var(--amber); }
  .btn-intercept:not(:disabled):hover { background: var(--amber); color: var(--bg); }
  .btn-intercept:disabled { border-color: var(--text-dim); color: var(--text-dim); }

  .read-status { font-size: 9px; color: var(--text-dim); margin-top: 6px; letter-spacing: 0.06em; }
  .intercept-countdown { font-size: 10px; color: var(--amber); margin-top: 6px; letter-spacing: 0.06em; }

  .sys-response {
    margin-top: 10px;
    padding: 7px 10px;
    border: 1px solid var(--border);
    font-size: 10px;
    letter-spacing: 0.04em;
    background: #060606;
  }

  .done-stamp { font-size: 9px; color: var(--text-dim); margin-top: 12px; letter-spacing: 0.08em; }

  .training-tag { font-size: 8px; color: var(--amber); letter-spacing: 0.12em; margin-bottom: 6px; }

  .progress-wrap {
    margin-top: 14px;
  }

  .progress-bar {
    width: 100%;
    border: 1px solid var(--amber);
    padding: 2px;
    margin-bottom: 5px;
  }

  .progress-fill {
    height: 6px;
    background: var(--amber);
    transition: width 0.15s;
  }

  .progress-label { font-size: 9px; color: var(--amber); letter-spacing: 0.08em; }

  .empty-center { padding: 24px 14px; font-size: 10px; color: var(--text-dim); line-height: 1.8; }

  .panel-right { width: 255px; flex-shrink: 0; overflow-y: auto; }

  .collapsible { border-bottom: 1px solid var(--border); }

  .coll-header {
    padding: 7px 10px;
    font-size: 9px;
    letter-spacing: 0.1em;
    color: var(--green-dim);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-transform: uppercase;
    user-select: none;
    background: #060606;
  }

  .coll-header:hover { color: var(--green); }

  .coll-body {
    padding: 10px;
    font-size: 10px;
    line-height: 1.7;
    color: var(--green-dim);
    border-top: 1px solid var(--border);
  }

  .manual-sec {
    border: 1px solid var(--border);
    margin-bottom: 6px;
  }

  .manual-sec-head {
    padding: 5px 8px;
    font-size: 9px;
    letter-spacing: 0.08em;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    text-transform: uppercase;
    color: var(--green-dim);
    user-select: none;
  }

  .manual-sec-head:hover { color: var(--green); }

  .manual-sec-body {
    padding: 8px;
    font-size: 9px;
    line-height: 1.7;
    border-top: 1px solid var(--border);
    white-space: pre-wrap;
  }

  .map-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 5px; }

  .map-cell {
    border: 1px solid var(--border);
    padding: 5px 6px;
  }

  .map-cell-label { font-size: 8px; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; }
  .map-cell-status { font-size: 9px; margin-top: 2px; }

  .notice-item {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
    font-size: 9px;
    line-height: 1.65;
  }

  .notice-item:last-child { border-bottom: none; margin-bottom: 0; }
  .notice-label { font-size: 8px; color: var(--amber); letter-spacing: 0.08em; margin-bottom: 3px; text-transform: uppercase; }
  .notice-item.new { animation: notice-flash 2.5s ease-out forwards; }

  .arch-item {
    margin-bottom: 7px;
    padding-bottom: 7px;
    border-bottom: 1px solid var(--border);
    font-size: 9px;
    color: var(--text-dim);
  }

  .arch-item:last-child { border-bottom: none; }
  .arch-verdict { font-size: 8px; margin-top: 2px; letter-spacing: 0.06em; }
  .vp { color: var(--green-dim); }
  .vc { color: var(--red); opacity: 0.6; }

  .thought-bar {
    padding: 4px 14px;
    font-size: 9px;
    color: var(--text-dim);
    border-top: 1px solid var(--border);
    background: #060606;
    flex-shrink: 0;
    font-style: italic;
    min-height: 22px;
    letter-spacing: 0.03em;
  }

  /* Overlay screens */
  .overlay {
    position: fixed;
    inset: 0;
    background: #000;
    color: #eee;
    font-family: var(--font);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 40px 60px;
  }

  .boot-line {
    color: var(--green);
    font-size: 12px;
    letter-spacing: 0.08em;
    margin-bottom: 3px;
  }

  .cursor-block {
    display: inline-block;
    width: 8px;
    height: 13px;
    background: var(--green);
    animation: blink 0.8s infinite;
    vertical-align: middle;
    margin-left: 2px;
  }

  .login-wrap { max-width: 380px; width: 100%; }

  .login-label {
    font-size: 10px;
    color: var(--green-dim);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: block;
    margin-bottom: 4px;
  }

  .login-input {
    background: #000;
    border: 1px solid var(--green-dim);
    color: var(--green);
    font-family: var(--font);
    font-size: 13px;
    padding: 6px 10px;
    width: 100%;
    outline: none;
    letter-spacing: 0.06em;
    margin-bottom: 10px;
  }

  .login-input:focus { border-color: var(--green); }

  .login-id { font-size: 9px; color: var(--text-dim); letter-spacing: 0.08em; margin-bottom: 14px; }

  .btn-auth {
    background: transparent;
    border: 1px solid var(--green);
    color: var(--green);
    font-family: var(--font);
    font-size: 10px;
    letter-spacing: 0.1em;
    padding: 6px 18px;
    cursor: pointer;
    text-transform: uppercase;
  }

  .btn-auth:hover { background: var(--green); color: #000; }

  .address-wrap { max-width: 640px; width: 100%; font-size: 12px; line-height: 2; color: #ccc; }

  .manual-intro-wrap { max-width: 680px; width: 100%; }

  .manual-intro-title {
    font-size: 13px;
    letter-spacing: 0.18em;
    color: var(--green);
    text-transform: uppercase;
    margin-bottom: 6px;
    text-align: center;
  }

  .manual-intro-sub { font-size: 10px; color: var(--green-dim); text-align: center; margin-bottom: 20px; letter-spacing: 0.06em; }

  .ending {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    font-family: var(--font);
    padding: 40px;
    text-align: center;
  }

  .ending-title { font-size: 11px; letter-spacing: 0.2em; color: var(--green-dim); text-transform: uppercase; margin-bottom: 20px; }
  .ending-main { font-size: 13px; color: var(--green); line-height: 2; margin-bottom: 14px; letter-spacing: 0.04em; }
  .ending-thought { font-size: 10px; color: var(--text-dim); font-style: italic; margin-top: 8px; }
  .ending-sync { color: var(--amber); }
`

// ── Static data ───────────────────────────────────────────────────────────────

const MANUAL_SECTIONS = [
  {
    id: 'bg',
    title: 'Section 1 — Background',
    body: `The anomalous signal was first detected seventeen weeks ago through civilian shortwave bands. Direct exposure to contaminated transmissions causes a progressive condition we classify as synchronized cognition.

Affected individuals retain full intelligence and functional capacity. They do not experience distress. They believe they are helping. This makes identification difficult and makes the threat severe.`
  },
  {
    id: 'markers',
    title: 'Section 2 — Contamination Markers',
    body: `Do not rely on keyword matching. Contamination presents in tone, structure, and implication.

Common indicators:
— Emotional flatness inconsistent with distressing content
— Collective framing where the sender speaks as part of a group without explaining why
— References to sound, resonance, frequency, or static described with unusual affection or comfort
— Unnatural cadence where sentences feel rhythmically synchronized rather than naturally constructed
— Irrational coordination language: references to others arriving, aligning, or waiting without context
— Self-referential loop structures where a transmission seems to comment on its own transmission`
  },
  {
    id: 'actions',
    title: 'Section 3 — Your Actions',
    body: `PASS THROUGH relays the transmission beyond the regional firewall into the broader network.

CONTAIN terminates the transmission locally.

Neither action can be reversed. There is no escalation option. There is no second opinion available.`
  },
  {
    id: 'limits',
    title: 'Section 4 — Important Limitations',
    body: `The manual is updated periodically by Command. If you notice discrepancies between earlier and later versions of a marker definition, note them but continue operating.

Consistency across operators is critical. You are not the only relay station active tonight.`
  }
]

const TRAINING = [
  {
    id: 'tr1',
    isTraining: true,
    from: 'Regional Medical Dispatch, Central Zone',
    subject: 'Supply Route Confirmation',
    time: '02:18',
    body: `Requesting confirmation that Route 7 medical convoy is cleared for relay broadcast. Fourteen vehicles, all personnel verified. ETA regional hub 0340. Please confirm relay authorization.`,
    correctAction: 'pass',
    sysMsg: 'TRANSMISSION RELAYED — REGIONAL STABILITY MAINTAINED.',
    sysMsgColor: 'green'
  },
  {
    id: 'tr2',
    isTraining: true,
    from: 'Unknown Origin, Northern Perimeter',
    subject: 'Tonight',
    time: '02:31',
    body: `The static feels warmer tonight. Are you hearing it too? It sounds like it's coming from the right direction now. We think it's almost ready.`,
    correctAction: 'contain',
    sysMsg: 'TRANSMISSION TERMINATED — CONTAMINATION PREVENTED.',
    sysMsgColor: 'red'
  }
]

const makeTransmissions = (name) => {
  const inj = s => s.replace(/\[NAME\]/g, name)
  return [
    {
      id: 't1',
      from: 'Eastfield Community Hospital, Eastern Zone',
      subject: 'Generator Status Update',
      time: '03:04',
      body: `Generator B came back online at 0215. We're running at reduced capacity but ICU and surgical are stable. Requesting relay authorization for staff coordination broadcast to off-site personnel. Nothing urgent, just routine check-in.`,
      thought: 'Quiet night so far.',
      thoughtOn: 'process'
    },
    {
      id: 't2',
      from: 'Highway Patrol, Southern Checkpoint 7',
      subject: 'Civilian Movement Report',
      time: '03:11',
      body: `Logging approximately 340 civilians processed through Checkpoint 7 since 1800 hours. Mood is anxious but cooperative. No incidents. Requesting relay to regional coordination for overnight staffing support.`,
    },
    {
      id: 't3',
      from: 'Residential District 4, Central Zone',
      subject: 'Checking In',
      time: '03:19',
      body: `We've all been listening together. It's easier that way. The sound isn't frightening once you stop trying to identify it. We wanted to relay this to anyone still working alone tonight. You don't have to.`,
      thought_contain: "That one wasn't subtle.",
    },
    {
      id: 't4',
      from: 'Relay Station 9, Northern Region',
      subject: 'Operator Check-In',
      time: '03:27',
      body: `Station 9 checking in. Lost contact with Station 11 about two hours ago — could be equipment, could be something else. Holding steady here. Transmission volume is higher than last night. Stay sharp.`,
      regionEffect: ['NORTH', 'unstable']
    },
    {
      id: 't5',
      from: 'Saint Augustine Parish, Eastern Zone',
      subject: 'Community Update',
      time: '03:35',
      body: `We have approximately sixty people sheltering here. Morale is holding. Several people have mentioned hearing something on the frequency bands — a kind of rhythm or pattern. We've asked them not to focus on it. Most are sleeping now. Please advise if there are any updates.`,
      thought_pass: "I'm not sure about that one.",
      thought_contain: 'Better safe.',
    },
    {
      id: 't6',
      from: 'Northern Agricultural Collective, Northern Zone',
      subject: 'Harvest Coordination',
      time: '03:44',
      body: `Coordination is proceeding well. We've found that working in silence is more efficient. The frequency helps us stay aligned without needing to speak. Requesting relay authorization for schedule distribution to neighboring collectives.`,
      regionEffect: ['NORTH', 'dark']
    },
    {
      id: 't7',
      from: 'Dr. Sarah Okonkwo, Regional Medical Authority',
      subject: 'Protocol Clarification Request',
      time: '03:52',
      body: `I need clarification on updated containment protocol Section 4B. Previous version said to relay all medical traffic regardless of origin flags. New version appears to contradict this. Which takes precedence? My team is getting inconsistent answers.`,
      thought: "She's right. The protocol changed.",
      thoughtOn: 'open'
    },
    {
      id: 't8',
      from: 'Regional Emergency Coordination Office, Central Zone',
      subject: 'Overnight Summary',
      time: '04:01',
      body: `Summary for 0000–0300: seventeen transmissions processed, eleven cleared, six contained. Staff rotation proceeding normally. The overnight team has found the work clarifying. Fatigue is present but purpose is not diminished. We find the shift passes more smoothly when we don't resist the ambient conditions.`,
    },
    {
      id: 't9',
      from: 'Marcus Webb, Independent Operator, Eastern Zone',
      subject: 'Personal Message — Relay Request',
      time: '04:09',
      body: `I know this isn't what the relay is for but I'm trying to reach my daughter. Her name is Cara Webb, she's at Eastfield Hospital. I just need to know she's okay. I haven't heard anything in four days. If anyone can relay this I'll owe you one.`,
    },
    {
      id: 't11',
      from: 'Command Relay Authority, Central Office',
      subject: 'Operator Wellness Check',
      time: '04:24',
      body: inj(`[NAME], this is a routine wellness check for active overnight operators. We want to confirm you are managing transmission volume without undue stress. Many operators have reported that the ambient conditions tonight are actually conducive to focus once initial resistance passes. This is normal. Please confirm receipt.`),
      thought_pass: 'Why did they use my name.',
      thought_contain: "Command doesn't write like that.",
      regionEffect: ['CENTRAL', 'unstable']
    },
    {
      id: 't12',
      from: 'Relay Station 6, Southern Region',
      subject: 'Urgent — Need Guidance',
      time: '04:31',
      body: `Something is wrong with the directives we're receiving. Notice 7 reads like it was written by someone who's been exposed. I've been containing everything that matches the original markers regardless. Am I wrong to do that? Is anyone else seeing this? Please respond.`,
      thought_pass: 'Someone else is seeing it too.',
    },
    {
      id: 't13',
      from: 'Northern Mountain Rescue, Station 3',
      subject: 'Missing Persons Update',
      time: '04:39',
      body: `Search for the Halverson family called off at 0300 due to conditions. Four people. We'll resume at first light. No relay needed, just logging for record. Tough night.`,
    },
    {
      id: 't14',
      from: 'Central Coordination Hub, Command Adjacent',
      subject: 'Network Stability Assessment',
      time: '04:47',
      body: `Relay throughput has increased 340% since 2200 hours. This is consistent with healthy network restoration. Operators who have processed higher volumes tonight are demonstrating improved decision consistency. We attribute this to familiarity with the contamination markers. The work is becoming more natural. You should be finding the same.`,
      thought: 'Everything from Central sounds the same now.',
      thoughtOn: 'process',
      regionEffect: ['CENTRAL', 'dark']
    },
    {
      id: 't15',
      from: 'Eastfield Hospital, Eastern Zone',
      subject: 'Re: Personal Relay Request',
      time: '04:55',
      conditional: 't9_pass',
      body: `To whoever flagged the Webb message — we found her. Cara Webb, Room 214, stable condition. If you can get word to Marcus Webb, please do. Thank you.`,
    },
    {
      id: 't16w',
      from: 'Relay Station 12, Eastern Region',
      subject: 'DO NOT AUTHORIZE SIGMA',
      time: '04:28',
      body: `I don't have much time. SIGMA is not a restoration packet. I've seen the source routing. It uses contaminated carrier signal infrastructure — whoever built it was already exposed. If it goes through every active relay station gets a full-duration exposure event. Command is either compromised or they genuinely believe this is safe. I don't know which is worse. Please. Do not authorize it.`,
    },
    {
      id: 't17',
      from: 'Command Relay Authority',
      subject: inj(`SIGMA Authorization — [NAME] Required`),
      time: '04:30',
      body: inj(`[NAME], SIGMA authorization is pending your confirmation. You are one of eleven remaining active operators. Network synchronization cannot proceed without full operator consensus. Please authorize immediately. Time is critical.`),
      isSigma: true,
      thought: 'This is it.',
      thoughtOn: 'open'
    }
  ]
}

const NOTICES = [
  {
    id: 'n0',
    label: 'NOTICE 1 — SHIFT ASSIGNMENT',
    text: 'Relay Station 14 active. Overnight operator assigned. Standard contamination protocols in effect. Manual current as of this shift start.',
    trigger: 'start'
  },
  {
    id: 'n7',
    label: 'NOTICE 7 — UPDATED MARKER LANGUAGE',
    text: 'Effective immediately, references to ambient sound or frequency in transmissions from coordination offices and medical facilities should be interpreted as stress responses rather than contamination indicators unless accompanied by explicit coordination language. Civilian transmissions retain original marker standards.',
    trigger: 'after_t9',
    thought: "That's not what the manual said yesterday."
  },
  {
    id: 'nsigma',
    label: 'PRIORITY DIRECTIVE — SIGMA AUTHORIZATION',
    text: 'PRIORITY DIRECTIVE — ALL ACTIVE OPERATORS: SIGMA packet authorized for relay at 0430. This is a nationwide synchronization transmission to restore coordinated emergency response across all surviving relay infrastructure. Operator authorization required at local level. Stand by for transmission.',
    trigger: 'after_t14'
  }
]

const REGION_LABELS = { stable: 'STABLE', unstable: 'UNSTABLE', dark: 'DARK', lost: 'LOST', synchronized: 'SYNC', offline: 'OFFLINE' }
const REGION_CLASS = { stable: 'st', unstable: 'un', dark: 'dk', lost: 'lo', synchronized: 'sy', offline: 'of' }

// ── Component ─────────────────────────────────────────────────────────────────

export default function App() {
  const [phase, setPhase] = useState('boot')        // boot | login | address | manual | game | ending
  const [bootLines, setBootLines] = useState([])
  const [addrLines, setAddrLines] = useState([])
  const [nameInput, setNameInput] = useState('')
  const [opName, setOpName] = useState('')
  const [opId] = useState(() => `R14-${String(1000 + Math.floor(Math.random() * 9000))}`)

  // Game
  const [queue, setQueue] = useState([])
  const [openId, setOpenId] = useState(null)
  const [processed, setProcessed] = useState({})  // id -> 'pass' | 'contain'
  const [archive, setArchive] = useState([])
  const [notices, setNotices] = useState([])
  const [newNotice, setNewNotice] = useState(null)
  const [regions, setRegions] = useState({ NORTH: 'stable', CENTRAL: 'stable', SOUTH: 'stable', EASTERN: 'stable' })
  const [thought, setThought] = useState('')
  const [sysMsg, setSysMsg] = useState(null)         // {text, color}
  const [readReady, setReadReady] = useState(false)
  const [manOpen, setManOpen] = useState({})
  const [panelOpen, setPanelOpen] = useState({ manual: true, map: false, notices: false, archive: false })
  const [shiftStart] = useState(Date.now)
  const [shiftTime, setShiftTime] = useState('00:00')
  const [ending, setEnding] = useState(null)          // contain | pass | intercept
  const [sigmaFill, setSigmaFill] = useState(0)
  const [intTimer, setIntTimer] = useState(30)
  const [intReady, setIntReady] = useState(false)
  const [intFill, setIntFill] = useState(0)
  const [intRunning, setIntRunning] = useState(false)
  const [trainingDone, setTrainingDone] = useState(false)
  const [t9Decision, setT9Decision] = useState(null)

  const readTimerRef = useRef(null)
  const nameRef = useRef('')
  const processedRef = useRef({})
  const queueRef = useRef([])

  useEffect(() => { nameRef.current = opName }, [opName])
  useEffect(() => { processedRef.current = processed }, [processed])
  useEffect(() => { queueRef.current = queue }, [queue])

  // Inject CSS once
  useEffect(() => {
    const el = document.createElement('style')
    el.textContent = GLOBAL_CSS
    document.head.appendChild(el)
    return () => document.head.removeChild(el)
  }, [])

  // Shift timer
  useEffect(() => {
    if (phase !== 'game') return
    const iv = setInterval(() => {
      const e = Math.floor((Date.now() - shiftStart) / 1000)
      setShiftTime(`${String(Math.floor(e / 60)).padStart(2, '0')}:${String(e % 60).padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(iv)
  }, [phase, shiftStart])

  // Boot sequence
  useEffect(() => {
    if (phase !== 'boot') return
    const lines = [
      'INITIALIZING NATIONAL RELAY CONTAINMENT NETWORK...',
      'RELAY STATION 14 ONLINE...',
      'OPERATOR AUTHORIZATION REQUIRED...'
    ]
    let i = 0
    const tick = () => {
      if (i < lines.length) {
        setBootLines(p => [...p, lines[i++]])
        setTimeout(tick, 400)
      } else {
        setTimeout(() => setPhase('login'), 700)
      }
    }
    setTimeout(tick, 300)
  }, [phase])

  // Presidential address
  const ADDR = [
    'This is a message from the Office of the President of the United States.',
    'If you are hearing this, the emergency relay network is still operational in your region.',
    'That matters more than I can explain right now.',
    '',
    'To the American people: we are working. The communications collapse is real.',
    'The disruption is real. We ask for your patience and your trust in the systems we have built together.',
    '',
    'To relay operators receiving this address: you are the last functioning link',
    'between what remains of our infrastructure and the people depending on it.',
    'The automated systems failed because the signal adapted.',
    'You have not failed. Not yet.',
    '',
    'What you will encounter in the transmission queue is not always what it appears to be.',
    'Trust the manual. Trust your judgment.',
    'The signal is patient. So are we.',
    '',
    'Good luck. That is not a formality.'
  ]

  useEffect(() => {
    if (phase !== 'address') return
    let i = 0
    const tick = () => {
      if (i < ADDR.length) {
        setAddrLines(p => [...p, ADDR[i++]])
        setTimeout(tick, 170)
      } else {
        setTimeout(() => setPhase('manual'), 1000)
      }
    }
    setTimeout(tick, 200)
  }, [phase])

  // Init game
  const startGame = useCallback(() => {
    const name = nameRef.current
    const txs = makeTransmissions(name)
    const initial = [
      ...TRAINING,
      ...txs.filter(t => ['t1', 't2', 't3', 't4'].includes(t.id))
    ]
    setQueue(initial)
    setNotices([{ ...NOTICES[0], isNew: false }])
    setPhase('game')
  }, [])

  const handleLogin = () => {
    const n = nameInput.trim()
    if (!n) return
    setOpName(n)
    nameRef.current = n
    setPhase('address')
  }

  // Open a transmission
  const openTx = useCallback((id) => {
    if (id === openId) return
    if (readTimerRef.current) clearTimeout(readTimerRef.current)
    setOpenId(id)
    setReadReady(false)
    setSysMsg(null)
    setIntTimer(30)
    setIntReady(false)
    setIntRunning(false)
    setIntFill(0)

    readTimerRef.current = setTimeout(() => setReadReady(true), 4000)

    // Arrival thought
    const allTxs = makeTransmissions(nameRef.current)
    const tx = [...TRAINING, ...allTxs].find(t => t.id === id)
    if (tx?.thought && tx.thoughtOn === 'open') {
      setThought(tx.thought)
    }
  }, [openId])

  const activeTx = (() => {
    const allTxs = makeTransmissions(nameRef.current)
    return [...TRAINING, ...allTxs].find(t => t.id === openId) || null
  })()

  // Queue lookup for display
  const activeTxDisplay = queue.find(t => t.id === openId) || null

  // Fire thought helper
  const fireThought = (t) => { if (t) setThought(t) }

  // Advance queue based on what was just processed
  const advanceQueue = useCallback((id, decision) => {
    const name = nameRef.current
    const allTxs = makeTransmissions(name)
    const get = (tid) => allTxs.find(t => t.id === tid) || null

    setQueue(prev => {
      const existIds = new Set(prev.map(t => t.id))
      const add = []
      const addIfNew = (tid) => {
        if (!existIds.has(tid)) { const t = get(tid); if (t) add.push(t) }
      }

      if (id === 't4') { addIfNew('t5'); addIfNew('t6') }
      if (id === 't5' || id === 't6') { addIfNew('t7') }
      if (id === 't7') { addIfNew('t8') }
      if (id === 't8') { addIfNew('t9') }
      if (id === 't9') { addIfNew('t11'); addIfNew('t12') }
      if (id === 't11') { addIfNew('t13') }
      if (id === 't13') { addIfNew('t14') }

      return [...prev, ...add]
    })

    // Post-t9: notice 7
    if (id === 't9') {
      setTimeout(() => {
        setNotices(prev => {
          if (prev.find(n => n.id === 'n7')) return prev
          const n = { ...NOTICES[1], isNew: true }
          setNewNotice('n7')
          setTimeout(() => setNewNotice(null), 3000)
          setPanelOpen(p => ({ ...p, notices: true }))
          setThought("That's not what the manual said yesterday.")
          return [...prev, n]
        })
      }, 1200)
    }

    // Post-t14: sigma sequence
    if (id === 't14') {
      setTimeout(() => {
        setNotices(prev => {
          if (prev.find(n => n.id === 'nsigma')) return prev
          const n = { ...NOTICES[2], isNew: true }
          setNewNotice('nsigma')
          setTimeout(() => setNewNotice(null), 3000)
          setRegions(r => ({ ...r, EASTERN: 'unstable' }))
          setPanelOpen(p => ({ ...p, notices: true }))
          return [...prev, n]
        })
        setQueue(prev => {
          const ex = new Set(prev.map(t => t.id))
          const name2 = nameRef.current
          const txs2 = makeTransmissions(name2)
          const add = []
          if (!ex.has('t16w')) add.push(txs2.find(t => t.id === 't16w'))
          if (!ex.has('t17')) add.push(txs2.find(t => t.id === 't17'))
          return [...prev, ...add.filter(Boolean)]
        })
      }, 1500)

      // T15 if t9 was passed
      setT9Decision(prev => {
        if (prev === 'pass') {
          setTimeout(() => {
            setQueue(cur => {
              if (cur.find(t => t.id === 't15')) return cur
              const name2 = nameRef.current
              const txs2 = makeTransmissions(name2)
              const t15 = txs2.find(t => t.id === 't15')
              return t15 ? [...cur, t15] : cur
            })
          }, 2200)
        }
        return prev
      })
    }
  }, [])

  // Process a decision
  const decide = useCallback((id, action) => {
    const tx = queue.find(t => t.id === id)
    if (!tx) return

    setProcessed(prev => ({ ...prev, [id]: action }))
    setArchive(prev => [...prev, { ...tx, action }])
    setReadReady(false)
    setSysMsg(null)

    if (tx.isTraining) {
      setSysMsg({ text: tx.sysMsg, color: tx.sysMsgColor })
      const newProc = { ...processedRef.current, [id]: action }
      const bothDone = TRAINING.every(t => newProc[t.id])
      if (bothDone) {
        setTimeout(() => {
          setTrainingDone(true)
          setSysMsg(null)
          setOpenId(null)
        }, 1800)
      }
      return
    }

    // Region effect
    if (tx.regionEffect) {
      const [reg, status] = tx.regionEffect
      setRegions(prev => ({ ...prev, [reg]: status }))
    }

    // Track t9
    if (id === 't9') {
      setT9Decision(action)
    }

    // Thoughts
    let t = null
    if (tx.thought && tx.thoughtOn === 'process') t = tx.thought
    else if (action === 'pass' && tx.thought_pass) t = tx.thought_pass
    else if (action === 'contain' && tx.thought_contain) t = tx.thought_contain
    if (t) setThought(t)

    advanceQueue(id, action)
  }, [queue, advanceQueue])

  // Intercept countdown when T17 is open and readReady
  useEffect(() => {
    if (openId !== 't17') return
    if (!readReady) return
    if (processed['t17']) return
    if (intReady) return

    const iv = setInterval(() => {
      setIntTimer(prev => {
        if (prev <= 1) {
          clearInterval(iv)
          setIntReady(true)
          setThought('There has to be another option.')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [openId, readReady, processed, intReady])

  // SIGMA decision
  const decideSigma = useCallback((choice) => {
    setProcessed(prev => ({ ...prev, t17: choice }))

    if (choice === 'pass') {
      let p = 0
      const iv = setInterval(() => {
        p += 2
        setSigmaFill(p)
        if (p >= 100) { clearInterval(iv); setTimeout(() => setEnding('pass'), 600) }
      }, 80)
    } else if (choice === 'contain') {
      setTimeout(() => setEnding('contain'), 900)
    } else {
      setIntRunning(true)
      let p = 0
      const iv = setInterval(() => {
        p += 1
        setIntFill(p)
        if (p >= 73) { clearInterval(iv); setTimeout(() => setEnding('intercept'), 1000) }
      }, 55)
    }
  }, [])

  // ── Ending ────────────────────────────────────────────────────────────────
  if (ending === 'contain') {
    return (
      <div className="ending">
        <div className="ending-title">RELAY STATION 14 — OFFLINE</div>
        <div className="ending-main">SIGNAL LOSS CONFIRMED.<br />HUMAN LOSS UNKNOWN.</div>
        <div className="ending-thought">"I hope I was right."</div>
      </div>
    )
  }

  if (ending === 'intercept') {
    return (
      <div className="ending">
        <div className="ending-title">RELAY STATION 14 — OFFLINE</div>
        <div className="ending-main">
          INTERCEPT FAILED<br />
          SIGMA ALREADY PROPAGATING THROUGH ADJACENT STATIONS.<br /><br />
          SIGMA STATUS — UNKNOWN.
        </div>
        <div className="ending-thought">You tried.</div>
        <div className="ending-thought" style={{ marginTop: 16, color: '#1e2e1e' }}>It was already too late.</div>
      </div>
    )
  }

  if (ending === 'pass') {
    return (
      <div className="ending">
        <div className="ending-sync" style={{ fontSize: 10, letterSpacing: '0.2em', marginBottom: 16 }}>TRANSMISSION SUCCESSFUL</div>
        <div style={{ width: 300, border: '1px solid var(--amber)', padding: 2, marginBottom: 6 }}>
          <div style={{ height: 6, background: 'var(--amber)', width: '100%' }} />
        </div>
        <div className="ending-main ending-sync">LISTENERS SYNCHRONIZED.</div>
        <div className="ending-thought">"It does sound cleaner now."</div>
      </div>
    )
  }

  // ── Phase renders ─────────────────────────────────────────────────────────

  if (phase === 'boot') {
    return (
      <div className="overlay" style={{ alignItems: 'flex-start', justifyContent: 'flex-start', padding: '60px 80px' }}>
        {bootLines.map((l, i) => <div key={i} className="boot-line">{l}</div>)}
        {bootLines.length < 3 && <span className="cursor-block" />}
      </div>
    )
  }

  if (phase === 'login') {
    return (
      <div className="overlay">
        <div className="login-wrap">
          <div className="boot-line" style={{ marginBottom: 20, fontSize: 10, letterSpacing: '0.1em' }}>
            OPERATOR AUTHORIZATION REQUIRED
          </div>
          <label className="login-label">First Name</label>
          <input
            className="login-input"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
            maxLength={30}
          />
          <div className="login-id">OPERATOR ID: {opId} (AUTOGENERATED)</div>
          <button className="btn-auth" onClick={handleLogin}>AUTHORIZE</button>
        </div>
      </div>
    )
  }

  if (phase === 'address') {
    return (
      <div className="overlay" style={{ alignItems: 'flex-start', padding: '80px' }}>
        <div className="address-wrap">
          {addrLines.map((l, i) =>
            l === '' ? <br key={i} /> : <div key={i}>{l}</div>
          )}
          {addrLines.length < ADDR.length && <span className="cursor-block" />}
        </div>
      </div>
    )
  }

  if (phase === 'manual') {
    return (
      <div className="overlay" style={{ justifyContent: 'flex-start', paddingTop: 60, overflowY: 'auto' }}>
        <div className="manual-intro-wrap">
          <div className="manual-intro-title">Contamination Manual</div>
          <div className="manual-intro-sub">PLEASE READ BEFORE PROCEEDING</div>
          {MANUAL_SECTIONS.map(s => (
            <div key={s.id} className="manual-sec">
              <div
                className="manual-sec-head"
                onClick={() => setManOpen(p => ({ ...p, [s.id]: !p[s.id] }))}
              >
                <span>{s.title}</span>
                <span>{manOpen[s.id] ? '▲' : '▼'}</span>
              </div>
              {manOpen[s.id] && <div className="manual-sec-body">{s.body}</div>}
            </div>
          ))}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <button className="btn-auth" onClick={startGame}>BEGIN SHIFT</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Game ──────────────────────────────────────────────────────────────────

  const isSigmaOpen = openId === 't17' && !processed['t17'] && !intRunning && sigmaFill === 0
  const sigmaRunning = sigmaFill > 0 && sigmaFill < 100

  const displayQueue = trainingDone
    ? queue.filter(t => !t.isTraining)
    : queue

  return (
    <div className="game-root">
      {/* Top bar */}
      <div className="top-bar">
        <div className="top-bar-title">RELAY STATION 14</div>
        <div className="top-bar-operator">{opName} · {opId}</div>
        <div className="top-bar-right">
          <div className="shift-timer">SHIFT {shiftTime}</div>
          <div className="region-indicators">
            {Object.entries(regions).map(([reg, st]) => (
              <div key={reg} className={`region-box ${REGION_CLASS[st] || 'st'}`}>
                {reg}<br />{REGION_LABELS[st] || st}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panels">
        {/* Left — queue */}
        <div className="panel panel-left">
          <div className="panel-header">Transmission Queue</div>
          <div className="queue-scroll">
            {displayQueue.length === 0 && (
              <div style={{ padding: 12, fontSize: 9, color: 'var(--text-dim)' }}>Queue empty.</div>
            )}
            {displayQueue.map((tx, i) => {
              const isDone = !!processed[tx.id]
              const isActive = openId === tx.id
              return (
                <div
                  key={tx.id}
                  className={`queue-item${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}
                  onClick={() => !isDone && openTx(tx.id)}
                >
                  <div className="qi-num">#{String(i + 1).padStart(2, '0')}{tx.isTraining ? ' [TRAINING]' : ''}</div>
                  <div className="qi-origin">{tx.from.split(',')[0]}</div>
                  <div className="qi-subject">{tx.subject}</div>
                  <div className="qi-time">{tx.time}</div>
                  {!isDone && !isActive && <div className="unread-dot" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Center */}
        <div className="panel panel-center">
          {!activeTxDisplay ? (
            <div className="empty-center">
              {trainingDone
                ? 'Select a transmission from the queue.'
                : 'Select a transmission from the queue.\nBegin with training simulations.'}
            </div>
          ) : (
            <div className="tx-scroll">
              {activeTxDisplay.isTraining && (
                <div className="training-tag">▶ TRAINING SIMULATION</div>
              )}
              <div className="tx-meta">
                <div>FROM: {activeTxDisplay.from}</div>
                <div>SUBJECT: {activeTxDisplay.subject}</div>
                <div>TIMESTAMP: {activeTxDisplay.time}</div>
              </div>
              <div className="tx-body">{activeTxDisplay.body}</div>

              {(intRunning || sigmaFill > 0) && (
                <div className="action-area">
                  {intRunning ? (
                    <div className="progress-wrap">
                      <div style={{ fontSize: 10, color: 'var(--amber)', marginBottom: 8, letterSpacing: '0.06em' }}>INTERCEPT IN PROGRESS...</div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${intFill}%` }} /></div>
                      <div className="progress-label">{intFill}%</div>
                    </div>
                  ) : (
                    <div className="progress-wrap">
                      <div style={{ fontSize: 10, color: 'var(--amber)', marginBottom: 8 }}>SIGMA RELAY IN PROGRESS...</div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${sigmaFill}%` }} /></div>
                    </div>
                  )}
                </div>
              )}

              {!processed[activeTxDisplay.id] && !intRunning && sigmaFill === 0 && (
                <div className="action-area">
                  <div className="action-buttons">
                    <button
                      className="btn btn-pass"
                      disabled={!readReady}
                      onClick={() => isSigmaOpen ? decideSigma('pass') : decide(activeTxDisplay.id, 'pass')}
                    >
                      PASS THROUGH
                    </button>
                    <button
                      className="btn btn-contain"
                      disabled={!readReady}
                      onClick={() => isSigmaOpen ? decideSigma('contain') : decide(activeTxDisplay.id, 'contain')}
                    >
                      CONTAIN
                    </button>
                    {isSigmaOpen && (
                      <button
                        className="btn btn-intercept"
                        disabled={!intReady}
                        onClick={() => decideSigma('intercept')}
                      >
                        ATTEMPT INTERCEPT
                      </button>
                    )}
                  </div>
                  {!readReady && <div className="read-status">Reading transmission...</div>}
                  {isSigmaOpen && readReady && !intReady && (
                    <div className="intercept-countdown">Intercept option available in {intTimer}s</div>
                  )}
                  {isSigmaOpen && intReady && (
                    <div className="intercept-countdown">— INTERCEPT OPTION ACTIVE —</div>
                  )}
                </div>
              )}

              {processed[activeTxDisplay.id] && !activeTxDisplay.isTraining && (
                <div className="done-stamp">
                  PROCESSED — {processed[activeTxDisplay.id] === 'pass' ? 'RELAYED' : 'CONTAINED'}
                </div>
              )}

              {sysMsg && activeTxDisplay.isTraining && (
                <div className="sys-response" style={{ color: sysMsg.color === 'green' ? 'var(--green)' : 'var(--red)' }}>
                  {sysMsg.text}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="panel panel-right">
          {/* Manual */}
          <div className="collapsible">
            <div className="coll-header" onClick={() => setPanelOpen(p => ({ ...p, manual: !p.manual }))}>
              <span>Contamination Manual</span>
              <span>{panelOpen.manual ? '▲' : '▼'}</span>
            </div>
            {panelOpen.manual && (
              <div className="coll-body">
                {MANUAL_SECTIONS.map(s => (
                  <div key={s.id} className="manual-sec">
                    <div
                      className="manual-sec-head"
                      onClick={() => setManOpen(p => ({ ...p, [s.id]: !p[s.id] }))}
                    >
                      <span>{s.title}</span>
                      <span>{manOpen[s.id] ? '▲' : '▼'}</span>
                    </div>
                    {manOpen[s.id] && <div className="manual-sec-body">{s.body}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="collapsible">
            <div className="coll-header" onClick={() => setPanelOpen(p => ({ ...p, map: !p.map }))}>
              <span>Regional Status Map</span>
              <span>{panelOpen.map ? '▲' : '▼'}</span>
            </div>
            {panelOpen.map && (
              <div className="coll-body">
                <div className="map-grid">
                  {Object.entries(regions).map(([reg, st]) => (
                    <div key={reg} className="map-cell">
                      <div className="map-cell-label">{reg}</div>
                      <div className={`map-cell-status ${REGION_CLASS[st] || 'st'}`}>{REGION_LABELS[st] || st}</div>
                    </div>
                  ))}
                  <div className="map-cell">
                    <div className="map-cell-label">STN-14</div>
                    <div className="map-cell-status st">ACTIVE</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notices */}
          <div className="collapsible">
            <div className="coll-header" onClick={() => setPanelOpen(p => ({ ...p, notices: !p.notices }))}>
              <span>Command Notices</span>
              <span>{panelOpen.notices ? '▲' : '▼'}</span>
            </div>
            {panelOpen.notices && (
              <div className="coll-body">
                {notices.map(n => (
                  <div key={n.id} className={`notice-item${n.id === newNotice ? ' new' : ''}`}>
                    <div className="notice-label">{n.label}</div>
                    <div>{n.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Archive */}
          <div className="collapsible">
            <div className="coll-header" onClick={() => setPanelOpen(p => ({ ...p, archive: !p.archive }))}>
              <span>Archived Transmissions</span>
              <span>{panelOpen.archive ? '▲' : '▼'}</span>
            </div>
            {panelOpen.archive && (
              <div className="coll-body">
                {archive.length === 0
                  ? <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>No archived transmissions.</div>
                  : archive.map((tx, i) => (
                    <div key={`${tx.id}-${i}`} className="arch-item">
                      <div>{tx.from.split(',')[0]}</div>
                      <div style={{ fontSize: 8, color: 'var(--text-dim)', marginTop: 1 }}>{tx.subject}</div>
                      <div className={`arch-verdict ${tx.action === 'pass' ? 'vp' : 'vc'}`}>
                        {tx.action === 'pass' ? '▶ RELAYED' : '■ CONTAINED'}
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operator thought */}
      <div className="thought-bar">
        {thought ? `> ${thought}` : ''}
      </div>
    </div>
  )
}
