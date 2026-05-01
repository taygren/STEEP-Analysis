// ─────────────────────────────────────────────────────────────────────────────
// SALES ELEVATION SYSTEM — CORE CONTENT
// Generic white-label version for technology resellers and VARs.
// All content in this file — update here, no component changes needed.
// ─────────────────────────────────────────────────────────────────────────────

// ── TALKING POINTS ────────────────────────────────────────────────────────────
export const TALKING_POINTS = [
  {
    id: 'tp1', num: 1,
    title: "Shift from 'what do you buy' to 'what do you need to not fail'",
    body: "Your customers aren't buying servers and firewalls — they're buying uptime, compliance, and the ability to not end up on the front page of the news. A technology partner's differentiation isn't the line card. It's the depth of expertise and care that follows the purchase order. Lead with risk, not product.",
    tags: ['All verticals', 'Executive opener'], tagColors: ['coral', 'teal'],
    cats: ['all', 'cyber', 'healthcare', 'ai', 'scale'],
  },
  {
    id: 'tp2', num: 2,
    title: "Healthcare IT failure isn't a budget problem — it's a patient safety problem",
    body: "When you ask a hospital what keeps them up at night, the answer isn't a vendor contract. It's 'what happens if the EHR goes down during a procedure?' Build your healthcare delivery model around zero-downtime cutovers — because that's the only acceptable standard in clinical environments. That's not a feature. It's the conversation opener.",
    tags: ['Healthcare', 'Services attach'], tagColors: ['teal', 'amber'],
    cats: ['all', 'healthcare'],
  },
  {
    id: 'tp3', num: 3,
    title: "Cybersecurity isn't a security team conversation anymore — it's a board conversation",
    body: "Your IT champion knows the risks. The board doesn't. The opportunity is to help the IT director become the champion who brought this conversation upstairs before the incident made it mandatory. Ask: 'What does your executive team know about your current cyber posture?' Then help them build the answer.",
    tags: ['Cybersecurity', 'C-suite bridge'], tagColors: ['coral', 'purple'],
    cats: ['all', 'cyber'],
  },
  {
    id: 'tp4', num: 4,
    title: "AI is already happening inside your customer — with or without a strategy",
    body: "Every organization has people using ChatGPT, Copilot, and AI tooling informally right now. The question isn't 'are you doing AI?' — it's 'does your leadership know what data those tools are touching?' The infrastructure required to do AI well is a technology partner's sweet spot. Lead with the risk of doing nothing, then introduce the hardware and governance roadmap.",
    tags: ['AI / Infrastructure', 'Risk framing'], tagColors: ['amber', 'coral'],
    cats: ['all', 'ai'],
  },
  {
    id: 'tp5', num: 5,
    title: "Relationship depth is the pitch, not the apology",
    body: "Customers who stay for 8–10 years with a technology partner don't do it because of catalog breadth. They do it because the rep knows their business as well as they do — and when something goes wrong at 2am, someone answers the phone. Frame relationship depth as the differentiator it is, not a consolation for being smaller than a national VAR.",
    tags: ['Competitive', 'Retention story'], tagColors: ['teal', 'teal'],
    cats: ['all', 'scale'],
  },
  {
    id: 'tp6', num: 6,
    title: "Supply chain pressure creates a window — use it to get further into the account",
    body: "Tariff pressure and component shortages mean customers are already making forward-looking procurement decisions. This is a rare moment when the CFO is engaged in hardware timing. Use that urgency to have a strategic budget conversation — not just a quote conversation. 'Given what's happening with lead times, what's your 18-month refresh plan?' is an executive question.",
    tags: ['Supply chain', 'Budget access'], tagColors: ['amber', 'purple'],
    cats: ['all', 'cyber', 'healthcare'],
  },
  {
    id: 'tp7', num: 7,
    title: "The IT director's job is changing — help them get ahead of it",
    body: "C-suites are now asking IT directors to weigh in on AI strategy, cybersecurity posture, and digital transformation. Most IT directors are infrastructure people — not business strategists. A strong pre-sales team can give them the language and framing to walk into those conversations with confidence. That's not selling — that's building a career champion.",
    tags: ['Champion building', 'Long-term relationship'], tagColors: ['teal', 'coral'],
    cats: ['all', 'scale', 'healthcare', 'cyber'],
  },
  {
    id: 'tp8', num: 8,
    title: "Automating the operationalization piece is the new services attach",
    body: "Competitors install and leave. The winning model is to leave customers with tools and processes they can actually run — Ansible playbooks, automated workflows, repeatable runbooks. This is differentiation that competes with firms 10x your size. Lead the post-project conversation with 'here's what we're going to leave behind' before the project starts.",
    tags: ['Services', 'Differentiation'], tagColors: ['amber', 'purple'],
    cats: ['all', 'ai', 'cyber'],
  },
]

// ── PERSONAS ──────────────────────────────────────────────────────────────────
export const PERSONAS = [
  {
    id: 'cio', initials: 'CIO', name: 'CIO / VP of IT', role: 'Strategic decision-maker', color: 'coral',
    whatTheyCare: "Business outcomes, executive credibility, managing risk without disrupting the operation. They're increasingly being asked to weigh in on AI strategy, workforce technology, and digital transformation — areas they may not feel fully equipped for.",
    whatKeepsThemUp: "Getting blindsided by a technology failure that becomes a business headline. Being out of step with what the C-suite needs from IT. Not having a clear answer when the board asks about AI or cybersecurity posture.",
    openingQuestion: '"What\'s the technology conversation your leadership team is having right now that you want to make sure IT has a strong voice in?"',
    avoid: 'Product speeds and feeds. Vendor comparison matrices. Anything that sounds like you\'re there to sell, not advise.',
    edgeAngle: 'Give them the strategic framing and language to show up as an executive, not just a technologist. Reference the "climbing the strategy stack" concept — moving from procurement to advisory.',
  },
  {
    id: 'ciso', initials: 'CSO', name: 'CISO / Security Director', role: 'Risk and compliance owner', color: 'purple',
    whatTheyCare: "Reducing exploitable exposure without creating friction that makes the business want to route around security. Staying ahead of the threat landscape without an infinite budget. Being able to say with confidence what the posture is.",
    whatKeepsThemUp: "An undetected breach already in progress. Audit findings that become board-level issues. Shadow IT and ungoverned AI tools touching sensitive data.",
    openingQuestion: '"If you had to describe your current threat surface to your board in plain language — what would be the most honest version of that conversation?"',
    avoid: "Selling on fear alone. Leading with a vendor before understanding the environment. Proposing anything before you know what's already been tried.",
    edgeAngle: "Bring emerging, differentiated security technology and a story others aren't telling. Position as the partner who shows up with the next-generation answer before the problem becomes public.",
  },
  {
    id: 'itdir', initials: 'DIR', name: 'IT Director / Manager', role: 'Day-to-day champion', color: 'teal',
    whatTheyCare: "Getting things done without breaking what works. Having vendors who show up and know what they're doing. Not being blamed when things go sideways. Building credibility with leadership by solving problems before they escalate.",
    whatKeepsThemUp: "Being handed a problem by the business that they don't have the internal resources or expertise to solve cleanly. Vendors who overpromise and underdeliver.",
    openingQuestion: '"What\'s the thing on your list right now that you\'re not sure how you\'re going to get done with your current resources?"',
    avoid: "Talking over their head into territory they'll feel defensive about. Making them feel like you're trying to go around them to talk to their boss.",
    edgeAngle: "Make IT directors look good — by bringing the right expertise at the right time and leaving behind tools and processes the team can actually run. Build the champion first.",
  },
  {
    id: 'cfo', initials: 'CFO', name: 'CFO / Finance Leadership', role: 'Budget authority', color: 'amber',
    whatTheyCare: "Total cost of ownership, not just the purchase price. Risk exposure that shows up as liability on the balance sheet. Efficiency — getting more from what's already been invested. Predictable spend vs. surprise costs.",
    whatKeepsThemUp: "Technology surprises that become unbudgeted emergency spend. Breach costs, regulatory fines, and reputational damage. Being asked to approve a technology investment they can't evaluate.",
    openingQuestion: '"When IT brings a technology investment request to your desk, what\'s the frame you use to evaluate whether it makes financial sense?"',
    avoid: "Talking about features or architecture. Getting into technical detail. Anything that requires a translator.",
    edgeAngle: "Frame every conversation in terms of risk reduction and efficiency gains. Supply chain pull-forward is particularly relevant — budget is available now, and decision delay has a measurable cost.",
  },
  {
    id: 'ops', initials: 'COO', name: 'VP Operations / COO', role: 'Outcomes and efficiency owner', color: 'purple',
    whatTheyCare: "How reliably the technology supports the operation. Whether systems help or slow the business down. Scalability — does the infrastructure support where the company is going, not just where it is?",
    whatKeepsThemUp: "Critical processes that depend on systems no one fully understands. Scaling the business without scaling the headcount proportionally. Dependencies on key individuals who could leave.",
    openingQuestion: '"What\'s the operational process in your business that would most benefit from being more automated, more reliable, or better documented?"',
    avoid: "Anything that sounds like a technology conversation divorced from how the business actually runs.",
    edgeAngle: "The operationalization model — leaving behind tools, runbooks, and automation — maps directly to the COO's goal of reducing operational dependencies and scaling without proportional headcount growth.",
  },
  {
    id: 'cno', initials: 'CNO', name: 'CNO / Clinical Operations', role: 'Healthcare: patient-facing outcomes', color: 'teal',
    whatTheyCare: "Patient safety and care quality above everything. Clinical workflow continuity — systems that support clinicians, not systems that get in the way. Regulatory compliance (Joint Commission, HIPAA).",
    whatKeepsThemUp: "A technology failure that results in a patient harm event. Being dependent on systems that the IT team can't guarantee uptime on during maintenance. Data breaches that involve patient records.",
    openingQuestion: '"From where you sit, what technology dependency would create the greatest patient safety risk if it had a problem tonight?"',
    avoid: "Tech jargon, infrastructure details, vendor names. Lead entirely in clinical outcome language.",
    edgeAngle: "A zero-downtime healthcare delivery model is the most direct answer to the CNO's primary concern. Frame every conversation in terms of care continuity, not network uptime.",
  },
]

// ── DISCOVERY SEQUENCES ───────────────────────────────────────────────────────
export const DISCOVERY_SEQUENCES = [
  {
    id: 'opener', label: 'Conversation opener', color: 'coral',
    description: "Use this sequence when you're going broad — first meeting or early-stage relationship building. Goal: get them talking about their business, not their tech stack.",
    steps: [
      { num: 1, title: 'Lead with curiosity, not a pitch', text: "Don't open with your capabilities. Open with their world. What changed this year? What's leadership focused on? Let them define what matters before you position anything.", prompt: '"Before I say anything about what we do — help me understand what your last 12 months have looked like and what\'s coming at you in the year ahead."' },
      { num: 2, title: "Surface the gap between IT's priorities and the C-suite's expectations", text: "IT directors are being asked to weigh in on things they weren't trained for — AI strategy, board-level risk conversations, digital transformation. Find this gap and you find the champion opportunity.", prompt: '"What\'s your executive team asking IT to weigh in on that you weren\'t being asked about even two years ago?"' },
      { num: 3, title: "Understand what's operationally fragile", text: "Every organization has something they're worried about breaking — usually something held together with duct tape and one key person. This is where services and operationalization land hardest.", prompt: '"Is there anything in your environment right now that would cause a really bad week if it had a problem?"' },
      { num: 4, title: 'Get to the business outcome, not the technical requirement', text: "Transactional conversations end at the spec. Strategic conversations end at the outcome. Reframe everything through: what does success look like for the business if this works?", prompt: '"If we solve this correctly, what does that allow you or your team to do that you can\'t do today?"' },
      { num: 5, title: 'Close with a specific next step, not a follow-up email', text: "The quality of the next step signals whether this is a real relationship. A named date, a decision, or a person you're going to meet together — not 'let's stay in touch.'", prompt: '"Based on what you\'ve told me — the most useful thing I could do in the next two weeks is ______. Does that resonate?"' },
    ],
  },
  {
    id: 'elevate', label: 'Elevate to executive', color: 'teal',
    description: "Use this when you have an IT relationship but need to break into the executive layer. The goal is to make your IT champion look good upstairs — and get invited along.",
    steps: [
      { num: 1, title: 'Read the annual report or board materials first', text: "Know what the executive team has committed to before the call. Walk in with: 'I saw your CIO mentioned digital resilience as a priority — here's what that usually means for an organization your size and here's where we see the gaps.' That's preparation, not a pitch.", prompt: '"I pulled your recent materials and there were a few things that jumped out as relevant to what we\'re working on together. Can I share what I found?"' },
      { num: 2, title: 'Help your champion build the internal business case', text: "Most IT directors don't know how to translate infrastructure risk into CFO language. Give them the language, the framing, and the one-pager if needed.", prompt: '"Let me give you the language for this — here\'s how I\'d frame it if I were walking into your CFO\'s office."' },
      { num: 3, title: 'Ask to be in the executive meeting — as support, not the pitch', text: "Don't ask to 'present to the CIO.' Ask to help your champion have a better conversation. You're there to support their credibility, not replace it.", prompt: '"Would it be helpful if I sat in when you take this upstairs? I can be a technical resource — you run the meeting."' },
      { num: 4, title: 'In the executive room: lead with risk, end with roadmap', text: "Executive conversations are about avoiding bad outcomes and enabling good ones — in that order. Don't start with products. Start with what could go wrong, then show the path that prevents it.", prompt: '"The question we\'re really trying to answer for you today is: what does responsible technology decision-making look like for an organization at your scale, given where the market is heading?"' },
    ],
  },
  {
    id: 'healthcare', label: 'Healthcare expansion', color: 'purple',
    description: "Use this sequence when expanding within existing health system accounts or breaking into new ones.",
    steps: [
      { num: 1, title: 'Lead with the uptime standard, not the technology', text: "The healthcare differentiator is zero-downtime cutovers. That's not a technical spec — it's a patient safety statement. Say it that way.", prompt: '"Our healthcare customers don\'t take downtime during cutovers. That\'s not a marketing statement — it\'s an engineering discipline we\'ve built into how we deliver."' },
      { num: 2, title: 'Understand the Epic environment before proposing anything', text: "Epic is the center of gravity for most health system IT decisions. Know what version they're on, what their upgrade cycle looks like, and what's upstream and downstream of it.", prompt: '"Can you walk me through how your Epic environment is architected and what the team is responsible for keeping running around it?"' },
      { num: 3, title: 'Surface the IoMT and OT/IT convergence risk', text: "Medical devices are now network-connected and largely unmanaged from a security perspective. This is the emerging conversation in healthcare IT and where cyber intersects with clinical risk.", prompt: '"How are you currently managing the security posture of devices that are connected to the network but not managed by your IT team — infusion pumps, imaging systems, that kind of thing?"' },
      { num: 4, title: 'Scale the model — same problems, different size', text: "A 500-bed regional medical center and a 5,000-bed academic health system have the same problems at different scales. Your playbook from one health system can be packaged and brought to the next. Use reference stories aggressively — with permission.", prompt: '"We did something similar at a comparable health system. Same architecture, different scale. Can I walk you through what that looked like and what we left behind?"' },
    ],
  },
  {
    id: 'cyber', label: 'Cybersecurity entry', color: 'amber',
    description: "Use this for new cybersecurity conversations — especially with IT directors who haven't bought security from your practice before.",
    steps: [
      { num: 1, title: "Start with their current security story, not your line card", text: "Most customers think they're adequately protected. The fastest way to open the conversation is to ask them to explain their posture — not to challenge it, but to understand where they see the gaps themselves.", prompt: '"If your board asked you today what your current cyber posture looks like, what would you say?"' },
      { num: 2, title: 'Identify the last incident or near-miss', text: "Every organization has had something. Asking about it — professionally and confidentially — opens the risk conversation more effectively than any threat briefing you can offer.", prompt: '"What\'s the closest call you\'ve had in the last two years — something that made the team realize things could have gone worse?"' },
      { num: 3, title: 'Anchor to a specific exposure, not a general risk category', text: "Generalized risk conversations don't move. Specific ones do. Map their environment to a named exposure and make it concrete.", prompt: '"Based on what you\'ve described, the exposure I\'d be most focused on in your environment is ______. Has that come up in any conversations internally?"' },
      { num: 4, title: 'Introduce the roadmap as a sequence, not a shopping list', text: "Don't present five vendors. Present a sequence with a reason each one comes before the next.", prompt: '"Here\'s how I\'d think about sequencing this — not all at once, but in an order that makes each investment more effective than the one before it."' },
    ],
  },
]

// ── OBJECTIONS ────────────────────────────────────────────────────────────────
export const OBJECTIONS = [
  {
    id: 'obj0', badgeLabel: 'Relationship', badgeColor: 'coral',
    objection: '"We already have a primary vendor we\'re happy with."',
    context: "This isn't a 'no' — it's an incumbency objection. The goal is to get alongside the incumbent, not displace them. The strongest partners start with one practice and earn their way into others.",
    response: '"That makes sense — we\'re not here to replace anyone. The customers we work with the longest typically came to us for something specific that their primary vendor didn\'t cover as well. What\'s one area where you wish you had more specialized depth or faster response?"',
  },
  {
    id: 'obj1', badgeLabel: 'Size', badgeColor: 'amber',
    objection: '"You\'re a smaller firm — can you actually support an organization our size?"',
    context: "This is one of the most common objections for regional VARs — and it's the easiest to flip. The question is really about trust and reliability. Your reference customers are your answer.",
    response: '"Fair question — and it\'s a good one to ask any vendor. The customers who ask us this question most often end up staying the longest, because they discover that our team-to-account ratio means they\'re never waiting in a queue. Would it be helpful to connect with one of our reference customers in your industry?"',
  },
  {
    id: 'obj2', badgeLabel: 'Budget', badgeColor: 'coral',
    objection: '"We don\'t have budget for this right now."',
    context: "Budget objections at the discovery stage usually mean the pain isn't connected to a dollar cost yet. The question is: what's the cost of not addressing it?",
    response: '"I hear that. Let me ask you a different question — if this problem stays unsolved for another year, what does that cost you? I\'m not talking about a quote number — I mean operationally, what does the team absorb to work around it? Sometimes that math changes the conversation."',
  },
  {
    id: 'obj3', badgeLabel: 'Cyber', badgeColor: 'teal',
    objection: '"We handle security internally — we\'re not looking for outside help."',
    context: "This objection usually comes from IT directors who are protective of their domain. Respect the ownership — position your practice as supplemental capability, not a replacement for the internal team.",
    response: '"That\'s great to hear — most of the customers we work with have strong internal teams. The question I always ask is: are there areas where the threat landscape is changing faster than your team has capacity to stay current? We don\'t come in to run your security program. We come in on the leading edge of what\'s new, so your team isn\'t building from scratch."',
  },
  {
    id: 'obj4', badgeLabel: 'Timing', badgeColor: 'amber',
    objection: '"This isn\'t the right time — we\'re in the middle of another project."',
    context: "Timing objections are often deferral, not real constraints. The goal is to stay in the flow of their business — not disappear and come back in six months.",
    response: '"Understood — and I want to be respectful of your team\'s bandwidth. The project you\'re in the middle of — is that something where having additional horsepower or a specific skill set could actually help? I\'d rather find a way to be useful now than disappear and reappear later."',
  },
  {
    id: 'obj5', badgeLabel: 'AI', badgeColor: 'purple',
    objection: '"We\'re not ready for AI yet — we need to get the basics right first."',
    context: "This is actually alignment, not an objection. AI infrastructure doesn't require the customer to have an AI strategy — it requires them to need the compute that supports it. That procurement decision is already happening.",
    response: '"You\'re right that the strategy conversation can wait. The infrastructure conversation probably can\'t — because the hardware required to run AI workloads is the same infrastructure you need to refresh anyway, and lead times right now mean the decisions you make in the next 90 days determine your options next year. Can I walk you through what that looks like?"',
  },
]

// ── BUYING SIGNALS ────────────────────────────────────────────────────────────
export const SIGNALS = [
  {
    id: 'sig0', tier: 1,
    label: 'They mention a recent incident, near-miss, or outage',
    text: 'This is the highest-value buying signal in cybersecurity and services. Pain is real, memory is fresh, and leadership is paying attention.',
    pivot: 'Pivot: "What did that teach you about where your biggest exposures are? And what\'s been done since to close that gap?"',
  },
  {
    id: 'sig1', tier: 1,
    label: '"Our board is asking about X" (AI, cyber, compliance)',
    text: "Board-level visibility means budget is following the conversation. When the board asks, the CIO has a mandate.",
    pivot: 'Pivot: "What does your CIO or leadership need to be able to say to the board in the next 90 days? Let\'s work backward from that."',
  },
  {
    id: 'sig2', tier: 1,
    label: 'They mention supply chain concerns, tariff pressure, or component lead times',
    text: "This is a live, high-urgency issue. Budget is being pulled forward. CFOs are engaged. This is a rare window to get above the IT layer.",
    pivot: 'Pivot: "Are you under any pressure from leadership to lock in hardware purchases ahead of further price increases? Because the window for that conversation is short right now."',
  },
  {
    id: 'sig3', tier: 2,
    label: 'They mention a contract renewal, refresh cycle, or equipment end-of-life',
    text: "Procurement timing is an opportunity to reframe the scope of the conversation — move from replacement to strategic architecture.",
    pivot: 'Pivot: "When you refresh, are you planning to replace like-for-like or is this an opportunity to rethink the architecture? Because those are very different conversations."',
  },
  {
    id: 'sig4', tier: 2,
    label: 'They mention a key person leaving or a team being reorganized',
    text: "Talent transitions create process gaps and knowledge risk. This is an opening for tribal knowledge capture and operationalization services.",
    pivot: 'Pivot: "When that person leaves, what are they taking with them that isn\'t documented anywhere? How dependent is the operation on their institutional knowledge?"',
  },
  {
    id: 'sig5', tier: 3,
    label: 'They ask for "a quote on X" without a prior conversation',
    text: "This is the transactional trap. Fulfilling it without reframing locks you into vendor-of-record, not strategic partner. Always qualify before quoting.",
    pivot: 'Pivot: "Happy to get you a number — and I want to make sure we\'re quoting the right thing. Can I ask two questions first that might change what I recommend?"',
  },
  {
    id: 'sig6', tier: 3,
    label: "They're frustrated with their current vendor's responsiveness or expertise",
    text: "Dissatisfaction with incumbents is a signal — but don't pile on. Lead with differentiation, not competitive positioning.",
    pivot: 'Pivot: "What would \'great\' look like in a partner relationship for you — not just on the project, but day to day?"',
  },
]

// ── CHECKLIST ─────────────────────────────────────────────────────────────────
export const CHECKLIST_SECTIONS = [
  {
    id: 'account', label: 'Account intelligence',
    items: [
      { id: 'ci0', text: "Read the company's last annual report or publicly available materials for stated technology priorities" },
      { id: 'ci1', text: "Checked LinkedIn for any recent leadership hires, departures, or reorgs in IT/Security" },
      { id: 'ci2', text: "Reviewed press releases for any recent incidents, expansions, or compliance announcements" },
      { id: 'ci3', text: "Identified who the economic buyer is — not just the IT contact" },
    ],
  },
  {
    id: 'healthcare', label: 'Healthcare-specific prep',
    items: [
      { id: 'ci4', text: "Know their EHR platform (Epic, Cerner, Meditech) and current version" },
      { id: 'ci5', text: "Identified any recent uptime incidents, ransomware, or HIPAA compliance issues" },
      { id: 'ci6', text: "Know how many locations/campuses and whether network infrastructure is standardized" },
    ],
  },
  {
    id: 'competitive', label: 'Competitive positioning',
    items: [
      { id: 'ci7', text: "Know who the incumbent is and what they're weak on relative to your practice" },
      { id: 'ci8', text: "Identified one reference customer in the same industry to name if needed" },
      { id: 'ci9', text: "Prepared the 'why us vs. the large nationals' response in one clear sentence" },
    ],
  },
  {
    id: 'conversation', label: 'Conversation readiness',
    items: [
      { id: 'ci10', text: "Defined the single most important question to ask in this meeting" },
      { id: 'ci11', text: "Have a business-language way to describe what your firm does (not a product list)" },
      { id: 'ci12', text: "Prepared a relevant customer story to reference (with names cleared)" },
      { id: 'ci13', text: "Know the next specific action you want to come out of this meeting" },
    ],
  },
  {
    id: 'cyber', label: 'Cybersecurity entry points',
    items: [
      { id: 'ci14', text: "Know whether they've had any recent cyber incidents or are under compliance pressure" },
      { id: 'ci15', text: "Identified whether the cyber conversation is best entered through IT, legal, or operations" },
      { id: 'ci16', text: "Know which security vendors are most relevant to their industry and risk profile" },
    ],
  },
  {
    id: 'logistics', label: 'Meeting logistics',
    items: [
      { id: 'ci17', text: "Know who from your team should be in the room (rep, SE, CTO?) and why" },
      { id: 'ci18', text: "Meeting agenda sent or shared so the customer knows what to expect" },
      { id: 'ci19', text: "Follow-up template or next-step framing ready before the call ends" },
    ],
  },
]
