// ─────────────────────────────────────────────────────────────────────────────
// SALES ELEVATION SYSTEM — KNOWLEDGE BASE
// Generic white-label version. No firm-specific references.
// Organized by technology segment, industry vertical, persona, and market signal.
// ─────────────────────────────────────────────────────────────────────────────

// ── TECHNOLOGY SEGMENTS ───────────────────────────────────────────────────────
export const TECH_SEGMENTS = [
  {
    id: 'cybersecurity', label: 'Cybersecurity', color: 'coral',
    tagline: 'The threat landscape is outpacing the defense industry — and the gap is widening.',
    overview: `Enterprise cybersecurity has crossed from IT problem to board-level business risk. Ransomware attacks cost organizations an average of $4.5M per incident in 2024 — and that number excludes reputational damage, regulatory fines, and operational disruption. The challenge for most organizations isn't awareness; it's the overwhelming complexity of a vendor market with 3,000+ point solutions and no clear architectural consensus. The opportunity for a trusted advisor is to cut through that complexity with a sequenced, outcome-oriented roadmap rather than another line card review.`,
    marketDynamics: [
      'The cybersecurity vendor market grew to $188B in 2024 — but consolidation is accelerating as organizations reduce fragmented point solutions in favor of platform approaches.',
      'CISOs report an average of 45 security tools in their environment; most acknowledge they can operationalize fewer than half effectively.',
      'Cyber insurance underwriters now require documented evidence of specific controls (MFA, EDR, network segmentation) as preconditions for coverage — moving compliance from optional to mandatory.',
      'The SEC cybersecurity disclosure rules (effective 2024) require public companies to disclose material incidents within 4 business days — elevating the CISO to a board reporting function.',
      'AI-powered attack tooling has lowered the barrier for sophisticated attacks, enabling threat actors with limited technical skill to execute ransomware and credential theft at scale.',
      'Supply chain attacks (SolarWinds, XZ Utils, MOVEit) have shifted focus from perimeter defense to third-party risk management and software supply chain integrity.',
    ],
    keyCategories: [
      {
        name: 'Identity & Access Management (IAM / PAM)',
        why: 'Compromised credentials are the entry point in over 80% of breaches. Zero-trust architecture is fundamentally an identity problem — you cannot enforce least-privilege access without a governed identity layer. PAM is the highest-ROI control for organizations that have already addressed endpoint and email.',
        vendors: ['CyberArk', 'Okta', 'SailPoint', 'BeyondTrust', 'Delinea'],
        edgeAngle: 'Most organizations have Active Directory but have never audited it. The identity posture conversation — not a product pitch — is the entry point. Ask: "When was the last time you reviewed who has privileged access to your most sensitive systems?"',
      },
      {
        name: 'Endpoint Detection & Response (EDR / XDR)',
        why: 'Next-gen antivirus is table stakes. EDR provides behavioral detection and response capability that catches what signature-based tools miss. XDR extends this across network, email, and cloud telemetry for correlated detection.',
        vendors: ['CrowdStrike', 'SentinelOne', 'Microsoft Defender', 'Palo Alto Cortex'],
        edgeAngle: 'Lead with the consolidation argument — XDR platforms replace 5-8 point tools in one agent, which is a significant operational and cost reduction conversation for organizations over-tooled on endpoint security.',
      },
      {
        name: 'Network Security & SASE',
        why: 'The perimeter is gone. Users work from anywhere, apps live in the cloud, and traditional VPN creates blind-trust access that adversaries exploit. SASE converges networking and security into a cloud-delivered architecture — SD-WAN, NGFW, SWG, ZTNA, and CASB in one policy framework.',
        vendors: ['Palo Alto Networks', 'Zscaler', 'Cisco', 'Fortinet', 'Netskope'],
        edgeAngle: 'The SASE conversation should start with the client\'s remote access pain — not the architecture. Ask: "How many different ways can someone access your network today, and who owns the policy for each one?"',
      },
      {
        name: 'Data Security & DSPM',
        why: 'Data Security Posture Management (DSPM) is the fastest-growing category in cybersecurity. As data sprawls across cloud, SaaS, and on-prem, organizations have lost visibility into where sensitive data lives, who can access it, and whether it\'s protected.',
        vendors: ['Varonis', 'Rubrik', 'Cohesity', 'BigID', 'Cyera'],
        edgeAngle: 'The DSPM conversation is most powerful with healthcare and financial services customers who have specific data classification obligations under HIPAA, PCI-DSS, or state privacy laws. Lead with regulation, not the product.',
      },
      {
        name: 'Security Operations (SIEM / SOAR)',
        why: 'Detection without response is noise. SIEM aggregates logs and surfaces alerts; SOAR automates the response playbook. Most organizations have a SIEM — few have operationalized it. The gap between alert volume and analyst capacity is where breaches happen.',
        vendors: ['Splunk', 'Microsoft Sentinel', 'IBM QRadar', 'Palo Alto XSOAR', 'Exabeam'],
        edgeAngle: 'Open with: "How long does it take your team to investigate a high-priority alert from detection to determination?" Most organizations don\'t know — which is the problem.',
      },
      {
        name: 'GRC & Compliance Automation',
        why: 'AI-powered GRC platforms can automate evidence collection, map controls to multiple frameworks simultaneously, and produce audit-ready reporting — reducing compliance overhead by 60–70%. As AI programs grow, AI-specific GRC tools are becoming a distinct requirement.',
        vendors: ['ServiceNow GRC', 'OneTrust', 'Archer', 'Drata', 'Vanta', 'Truyo'],
        edgeAngle: 'Truyo is a GRC platform designed specifically for AI governance and compliance — a differentiated conversation for customers building AI programs who need to stay ahead of regulatory requirements.',
      },
      {
        name: 'IoMT / OT Security',
        why: 'Internet of Medical Things (IoMT) and Operational Technology (OT) environments represent the largest unmanaged attack surface in enterprise. Hospitals have thousands of connected devices — infusion pumps, imaging systems, monitoring equipment — that run legacy firmware, cannot be patched, and are often invisible to traditional security tools.',
        vendors: ['Claroty', 'Armis', 'Medigate', 'Nozomi Networks', 'Forescout'],
        edgeAngle: 'The IoMT security conversation is a clinical risk conversation, not an IT conversation — it belongs with the CNO and CISO jointly, not just IT.',
      },
    ],
    conversationStarters: [
      '"If your board asked you today what your biggest cyber exposure is — what would you say?"',
      '"What does your current detection-to-response time look like for a high-priority alert?"',
      '"How many vendors are in your current security stack, and how many are you getting full value from?"',
      '"When was the last time you ran a tabletop exercise or tested your incident response plan?"',
      '"What would it cost your organization if operations were taken down for 72 hours?"',
    ],
    landmines: [
      'Don\'t lead with product before you understand what they already have — most organizations are over-tooled, not under-tooled.',
      'Avoid the "compliance is the floor, not the ceiling" speech unless you know they\'re compliance-driven — for risk-driven CISOs, it reads as condescending.',
      'Don\'t assume any specific vendor before qualifying the existing stack — walking into a Defender account pushing an alternative loses the room.',
    ],
  },
  {
    id: 'networking', label: 'Networking & Infrastructure', color: 'teal',
    tagline: 'The network is the foundation — and it\'s changing faster than most organizations can keep up.',
    overview: `Enterprise networking has been transformed by three simultaneous shifts: the move to hybrid work (distributed users), the migration to cloud (distributed apps), and the rise of AI workloads (distributed compute). Traditional hub-and-spoke architectures are being replaced by software-defined, cloud-delivered networking fabric. A strong networking and infrastructure practice sits directly at the center of this transition. The opportunity is to position infrastructure refresh conversations as strategic architecture conversations, not hardware replacement cycles.`,
    marketDynamics: [
      'Cisco\'s acquisition of Splunk ($28B, 2024) signals the convergence of networking and security observability — the "network as a sensor" model is becoming mainstream.',
      'SD-WAN market is projected to reach $25B by 2027 as organizations replace MPLS with intelligent, application-aware routing.',
      'AI infrastructure demand is creating unprecedented compute requirements — NVIDIA GPU servers can cost $250K–$500K per unit with lead times of 6–12 months, making procurement planning a strategic function.',
      'Broadcom\'s acquisition of VMware has created significant disruption — licensing cost increases of 3–5x are forcing organizations to re-evaluate their virtualization strategy.',
      'Hitachi Vantara is seeking a buyer — customers on Hitachi storage should be proactively engaged about migration options.',
      'Dell and HPE have reduced quote validity windows and cannot guarantee component availability post-PO — supply chain uncertainty is now a sales conversation, not just a procurement one.',
    ],
    keyCategories: [
      {
        name: 'Data Center Infrastructure (Compute / Storage)',
        why: 'The data center refresh cycle is accelerating — driven by AI workload requirements, end-of-life hardware, and the Broadcom/VMware licensing shock. Organizations are being forced to make architecture decisions under cost pressure.',
        vendors: ['Dell', 'HPE', 'Nutanix', 'Pure Storage', 'NetApp', 'Hitachi Vantara'],
        edgeAngle: 'The Broadcom/VMware disruption is the most immediate short-term opportunity. Any customer running VMware is either already looking at alternatives or should be. Lead with: "What\'s your VMware renewal date, and have you modeled what the new Broadcom pricing looks like for your environment?"',
      },
      {
        name: 'SD-WAN & Campus Networking',
        why: 'SD-WAN provides application-aware routing across multiple connection types with centralized policy management. For multi-site organizations, it replaces expensive MPLS circuits, improves application performance, and creates the transport foundation for SASE.',
        vendors: ['Cisco Meraki', 'Aruba/HPE', 'Fortinet', 'VMware VeloCloud', 'Versa Networks'],
        edgeAngle: 'SD-WAN maturity is the strongest infrastructure accelerator — a mature SD-WAN deployment compresses the SASE timeline significantly. Always assess SD-WAN posture before positioning SASE.',
      },
      {
        name: 'AI / GPU Infrastructure',
        why: 'AI inference and training workloads require fundamentally different infrastructure — high-bandwidth memory, NVLink interconnects, and GPU cluster management. Organizations building private AI environments need specialized infrastructure design expertise that most resellers lack.',
        vendors: ['NVIDIA (DGX/HGX)', 'Dell AI Factory', 'HPE Cray', 'Supermicro', 'Lenovo'],
        edgeAngle: 'AI infrastructure is a C-suite conversation driven by urgency. The entry question is: "What AI workloads are you running or planning, and where do you envision them running — cloud, on-prem, or hybrid?" The answer shapes the infrastructure story.',
      },
      {
        name: 'Hyper-Converged Infrastructure (HCI)',
        why: 'HCI collapsed compute, storage, and networking into a single software-defined platform. The VMware/Broadcom disruption has accelerated migration from traditional 3-tier architectures to HCI alternatives.',
        vendors: ['Nutanix', 'VMware vSAN (Broadcom)', 'Microsoft Azure Stack HCI', 'Dell VxRail'],
        edgeAngle: 'Nutanix is the primary beneficiary of the VMware exodus. Know the Nutanix licensing model and migration tooling before the customer conversation.',
      },
      {
        name: 'Network Automation & AIOps',
        why: 'Network operations teams are overwhelmed — manual change management, tribal knowledge, and reactive troubleshooting consume capacity. Automation and AIOps platforms reduce MTTR, enable policy-as-code, and free engineers to work on architecture.',
        vendors: ['Cisco (Catalyst Center)', 'Juniper Mist', 'Aruba Central', 'Ansible', 'HashiCorp'],
        edgeAngle: 'Ask: "What percentage of your team\'s time goes to reactive maintenance vs. forward-looking work?" The answer frames the ROI of automation.',
      },
    ],
    conversationStarters: [
      '"What\'s your VMware renewal timeline, and have you modeled what the new Broadcom licensing means for your budget?"',
      '"When you look at your current network architecture, how well does it support users working from anywhere and apps living in the cloud?"',
      '"What percentage of your infrastructure is currently end-of-life or approaching it?"',
      '"If you were designing your network from scratch today, what would you do differently?"',
      '"AI infrastructure lead times are 6–12 months right now — are you in that planning cycle yet?"',
    ],
    landmines: [
      'Don\'t walk into a Cisco account leading with a non-Cisco alternative unless you\'ve established the reason — Cisco loyalty runs deep in networking teams.',
      'Avoid the cloud-first default assumption — many organizations are deliberate on-prem operators for compliance, performance, or cost reasons.',
      'The Hitachi Vantara situation is sensitive — existing customers may feel defensive. Lead with options, not alarm.',
    ],
  },
  {
    id: 'ai', label: 'AI & Automation', color: 'amber',
    tagline: 'Every organization is somewhere on the AI journey — whether they know it or not.',
    overview: `AI has crossed the chasm from innovation experiment to operational reality — but most organizations are navigating it without a strategy. The grassroots adoption pattern is consistent across every customer: individuals using ChatGPT and Copilot informally, small teams building ad hoc tools, and leadership unsure what guardrails to put in place. The opportunity for a technology partner is not to sell AI products — it's to be the trusted advisor who helps customers think clearly about AI readiness, infrastructure requirements, governance, and phased adoption.`,
    marketDynamics: [
      'Gartner estimates that by 2026, more than 80% of enterprises will have deployed generative AI APIs or applications — up from less than 5% in 2023.',
      'Microsoft Copilot surveys show that while 60%+ of enterprise employees have access, fewer than 30% use it weekly — the gap between access and value is where partners win.',
      'Agentic AI (autonomous multi-step AI systems) is moving from research to production — early adopters are building AI agents that can research, analyze, and take action with minimal human oversight.',
      'The EU AI Act enforcement begins 2025, and US state-level AI regulations are proliferating — organizations building AI programs need compliance frameworks before they need models.',
      'NVIDIA\'s GPU supply constraint has created a two-tier market — hyperscalers have priority allocation, while enterprises face 6–12 month lead times or scaling cloud inference costs.',
      'Shadow AI (unsanctioned employee use of AI tools) is the #1 AI risk cited by CISOs — employees routinely paste sensitive customer data, IP, and proprietary information into consumer AI tools.',
    ],
    keyCategories: [
      {
        name: 'AI Foundation & Infrastructure',
        why: 'Running AI workloads — inference for deployed models or training for custom models — requires purpose-built infrastructure. Organizations pursuing private AI need GPU compute, high-bandwidth networking, and storage optimized for model serving.',
        vendors: ['NVIDIA', 'Dell AI Factory', 'HPE AI', 'Supermicro', 'Pure Storage (FlashBlade)'],
        edgeAngle: 'The entry question is: "Where do you envision your AI workloads running in 3 years?" — not "do you need GPUs."',
      },
      {
        name: 'Enterprise AI Platforms & LLM Frameworks',
        why: 'Organizations building AI applications need an orchestration layer — platforms that manage model deployment, prompt engineering, RAG pipelines, and API governance. The shift from off-the-shelf AI tools to custom enterprise AI is where the implementation work lives.',
        vendors: ['Microsoft Azure AI / AI Foundry', 'AWS Bedrock', 'Google Vertex AI', 'Databricks', 'Snowflake Cortex'],
        edgeAngle: 'Reference any internal AI implementations you\'ve done — handbook chatbots, enterprise search, document automation. Firsthand applied experience is a differentiator that product resellers lack.',
      },
      {
        name: 'AI Governance & Responsible AI',
        why: 'Shadow AI, data leakage, model hallucination, and emerging regulatory requirements are creating demand for AI governance frameworks — policies, tools, and workflows that allow organizations to adopt AI without creating unmanaged risk.',
        vendors: ['Truyo', 'OneTrust', 'IBM OpenScale', 'Fiddler AI', 'Arthur AI'],
        edgeAngle: 'The AI governance conversation is a CISO, Legal, and HR conversation — not just IT. Ask: "Do you have a policy that defines what data employees are allowed to put into AI tools? And do you have visibility into whether they\'re following it?"',
      },
      {
        name: 'Process Automation (RPA / Workflow)',
        why: 'RPA and intelligent workflow automation remain high-ROI for organizations with repetitive, rules-based processes. The combination of RPA with AI enables handling of unstructured inputs — emails, documents, images — that traditional RPA couldn\'t process.',
        vendors: ['UiPath', 'Automation Anywhere', 'Microsoft Power Automate', 'Zapier', 'ServiceNow'],
        edgeAngle: 'The most credible automation conversations start with a specific process the customer recognizes as painful. Ask: "What\'s a process your team does every day that you wish just happened automatically?"',
      },
      {
        name: 'Copilot & Productivity AI',
        why: 'Microsoft 365 Copilot is the most widely deployed enterprise AI tool — and the most underutilized. Organizations with Copilot licenses are seeing low adoption because users haven\'t mapped it to specific workflow pain points.',
        vendors: ['Microsoft Copilot', 'Google Workspace AI', 'Salesforce Einstein', 'Zoom AI Companion'],
        edgeAngle: 'Offer a targeted Copilot enablement workshop focused on 3–5 high-value use cases for specific roles. This is a relationship-deepening move that doesn\'t require a procurement conversation.',
      },
    ],
    conversationStarters: [
      '"What AI tools are people on your team using today — including the informal ones they\'ve found on their own?"',
      '"Does your organization have a policy on what data employees can and can\'t put into AI tools?"',
      '"What\'s the one workflow in your business that, if automated, would have the biggest impact on your team\'s capacity?"',
      '"When your leadership asks \'what are we doing about AI?\' — what\'s your current answer?"',
      '"Are you building AI applications internally, buying off-the-shelf, or still in the evaluation phase?"',
    ],
    landmines: [
      'Don\'t assume every customer needs to build — many organizations are better served by configured SaaS AI tools than custom models.',
      'Avoid the "AI will replace your team" framing — frame AI as augmenting capacity, not replacing headcount.',
      'Don\'t treat Copilot as trivial — organizations that have spent on Copilot licenses and aren\'t seeing ROI are frustrated. Take their adoption challenge seriously.',
    ],
  },
  {
    id: 'cloud', label: 'Cloud & Hybrid Infrastructure', color: 'purple',
    tagline: 'Cloud-first was the mandate. Cloud-smart is the reality.',
    overview: `The cloud-first wave has matured into a cloud-smart reckoning. Organizations that migrated aggressively to public cloud are now confronting unexpected costs, performance gaps, compliance constraints, and data gravity that makes moving workloads back expensive. The market has settled into a hybrid multi-cloud operating model — and the winners are organizations with a deliberate strategy for which workloads belong where, rather than a reflexive default to either extreme.`,
    marketDynamics: [
      'Cloud repatriation — moving workloads back from public cloud to on-prem or co-lo — increased 40% in 2024. Rising egress costs and data sovereignty requirements are primary drivers.',
      'FinOps has become a board-level discipline — Gartner estimates 30% of cloud spend is wasted. Organizations are prioritizing optimization over new cloud migration.',
      'Hyperscaler marketplaces (AWS, Azure, GCP) are becoming the preferred procurement channel — EDP commitments mean organizations want to run software through marketplace to burn down committed spend.',
      'Sovereign cloud requirements are expanding — EU data residency, FedRAMP, and HIPAA constraints are driving demand for region-specific, compliance-aware cloud architecture.',
    ],
    keyCategories: [
      {
        name: 'Hybrid Cloud Architecture',
        why: 'Most enterprise organizations operate a hybrid of on-prem, co-lo, and multiple public clouds — but few have a coherent operating model. Hybrid cloud architecture defines the governance, networking, identity, and data management layer that makes the environment manageable.',
        vendors: ['VMware (Broadcom)', 'Nutanix', 'Azure Arc', 'AWS Outposts', 'Google Anthos'],
        edgeAngle: 'The VMware disruption is reshaping hybrid cloud conversations — many organizations are re-evaluating their entire virtualization and hybrid cloud strategy simultaneously. This is an architecture advisory opportunity, not a hardware sale.',
      },
      {
        name: 'Cloud Cost Management (FinOps)',
        why: 'Cloud spend is the fastest-growing line item in IT budgets — and the least governed. FinOps platforms provide visibility into cloud spend by team and workload, enabling organizations to rightsize, eliminate waste, and negotiate better committed-use contracts.',
        vendors: ['CloudHealth (VMware)', 'Apptio Cloudability', 'AWS Cost Explorer', 'Azure Cost Management', 'Spot.io'],
        edgeAngle: 'Open with: "What does your monthly cloud bill look like compared to what you budgeted? And do you know which workloads or teams are driving the overruns?"',
      },
      {
        name: 'Data Backup, Recovery & Resilience',
        why: 'Ransomware has transformed backup from a hygiene checkbox to a strategic capability. Immutable, air-gapped backup that can be recovered in hours — not days — is the difference between surviving a ransomware attack and paying the ransom.',
        vendors: ['Rubrik', 'Cohesity', 'Veeam', 'Zerto', 'Commvault'],
        edgeAngle: 'Open with: "If ransomware encrypted your environment tomorrow, how long would it take to recover, and what would that downtime cost your organization?" Most customers don\'t have a tested answer — which is the problem.',
      },
    ],
    conversationStarters: [
      '"Is your cloud spend where you expected it to be — or has it grown faster than anticipated?"',
      '"Which workloads have you moved to cloud and which are staying on-prem? What drove those decisions?"',
      '"Have you tested your ransomware recovery plan in the last 12 months?"',
      '"What\'s your current RTO for a major outage, and does your business leadership know that number?"',
    ],
    landmines: [
      'Don\'t assume cloud is the right answer — some organizations are deliberate on-prem operators and are proud of it.',
      'Avoid deprecating on-prem infrastructure as "legacy" — it reads as dismissive of thoughtful prior decisions.',
    ],
  },
]

// ── INDUSTRY VERTICALS ─────────────────────────────────────────────────────────
export const INDUSTRIES = [
  {
    id: 'healthcare', label: 'Healthcare', color: 'teal',
    tagline: 'Technology failure in healthcare isn\'t a downtime event — it\'s a patient safety event.',
    edgeCredential: 'Healthcare is the highest-value vertical for most regional technology partners. The combination of clinical risk, regulatory complexity, and infrastructure dependency creates a durable, high-margin engagement model — if the delivery methodology earns the trust.',
    overview: `Healthcare IT is navigating simultaneous pressure from three directions: clinical digitization (EHR optimization, telehealth, AI-assisted diagnostics), operational efficiency mandates (margin compression, workforce shortages), and security threat escalation (healthcare is the most-targeted sector for ransomware). The common denominator is infrastructure — every clinical and operational initiative runs on the network, compute, and security architecture that a technology partner designs and delivers.`,
    keyPressures: [
      'Healthcare ransomware attacks increased 130% from 2022 to 2024 — the average healthcare breach now costs $10.9M, the highest of any industry for the 13th consecutive year.',
      'Epic Systems controls approximately 37% of the US EHR market — Epic environment stability, upgrades, and adjacent tooling are the operational heartbeat of most health systems.',
      'CMS reimbursement models are shifting from fee-for-service to value-based care — requiring health systems to invest in data infrastructure that can measure and report on patient outcomes at scale.',
      'The FDA\'s medical device cybersecurity guidance (effective 2023) requires manufacturers to address cybersecurity in device design — but legacy IoMT devices remain largely unprotected.',
      'Nursing and clinical staff shortages are accelerating technology investment in automation, remote monitoring, and AI-assisted clinical decision support.',
    ],
    technologyPriorities: [
      { area: 'EHR Infrastructure & Epic Optimization', urgency: 'high', detail: 'Epic environments require purpose-built infrastructure — high-IOPS storage, low-latency networking, and availability architecture designed around clinical workflows.' },
      { area: 'IoMT & Medical Device Security', urgency: 'high', detail: 'Thousands of connected medical devices per hospital, most running legacy firmware with no patch path. Visibility and segmentation are the foundational controls.' },
      { area: 'Zero-Downtime Network & Cutovers', urgency: 'high', detail: 'Clinical operations cannot tolerate network downtime — not during maintenance windows, not during upgrades. This is a patient safety standard, not a preference.' },
      { area: 'Ransomware Resilience & Recovery', urgency: 'high', detail: 'Healthcare is the #1 ransomware target. Immutable backup, network segmentation, and a tested recovery plan are non-negotiable controls.' },
      { area: 'Clinical Data & Analytics Infrastructure', urgency: 'medium', detail: 'Value-based care and population health programs require data infrastructure that can ingest, normalize, and analyze clinical and claims data at scale.' },
      { area: 'Telehealth & Remote Monitoring Infrastructure', urgency: 'medium', detail: 'Persistent telehealth programs require reliable connectivity at clinical sites. SD-WAN and edge compute enable consistent performance across distributed care settings.' },
    ],
    personaMap: {
      CIO: 'Balance operational stability with modernization mandate. Wants to enable clinical outcomes without disrupting what works. Key concern: being blamed for a technology failure that affects patient care.',
      CISO: 'Healthcare CISO role has evolved from compliance function to strategic risk officer. Key concern: ransomware, IoMT visibility, and the intersection of clinical risk and cyber risk.',
      'IT Director': 'Day-to-day operational owner of the infrastructure clinical care runs on. Values vendors who show up, know healthcare, and don\'t create new problems while solving old ones.',
      CNO: 'Speaks patient outcomes, not infrastructure. Cares about uptime, clinical workflow continuity, and anything that affects the care team\'s ability to deliver care.',
      CFO: 'Margin pressure is the governing constraint. Every technology investment must be framed in terms of cost avoidance, operational efficiency, or compliance risk reduction.',
    },
    edgeTalkingPoints: [
      'A hospital that takes downtime during a cutover didn\'t have to. Zero-downtime delivery is an engineering discipline, not a lucky streak.',
      'Healthcare infrastructure is a patient safety problem, not a technology problem. Those aren\'t the same conversation.',
      'The same problems that affect a 500-bed regional medical center affect a 5,000-bed academic health system — just at different scale. The playbook is repeatable.',
      'IoMT is the fastest-growing unmanaged attack surface in healthcare. Visibility and segmentation are the foundational controls — and most organizations haven\'t started.',
    ],
    referenceConversations: [
      'Ask about Epic upgrade timelines — every health system on Epic has one, and it\'s almost always an infrastructure conversation.',
      'Ask about IoMT visibility: "Do you know how many devices are on your network that are not managed by your IT team?"',
      'Ask about the last ransomware tabletop: "Has your executive team run a ransomware tabletop exercise? Do they know what the first 4 hours look like?"',
    ],
  },
  {
    id: 'financial', label: 'Financial Services', color: 'amber',
    tagline: 'Regulated, high-stakes, and under constant threat — financial services demands precision, not experimentation.',
    edgeCredential: 'Financial services customers with enterprise-grade security requirements and sophisticated technology environments validate a technology partner\'s ability to operate in complex, compliance-driven settings. These reference relationships are among the strongest proof points available.',
    overview: `Financial services organizations operate under the most complex regulatory technology environment of any industry. FFIEC, SOX, PCI-DSS, DORA (EU), and state-level privacy regulations create a compliance overlay on every technology decision. At the same time, pressure to modernize — digital banking, AI-driven underwriting, real-time payments — is as intense as any sector. The winning conversation acknowledges both the compliance constraint and the modernization mandate simultaneously.`,
    keyPressures: [
      'The Digital Operational Resilience Act (DORA) took effect in the EU in January 2025 — requiring financial institutions to demonstrate ICT risk management, incident reporting, and third-party provider oversight.',
      'Ransomware targeting financial services doubled in 2024 — wire fraud, credential theft, and ransomware are the top three threat vectors.',
      'AI adoption in financial services is accelerating — algorithmic trading, AI-assisted underwriting, fraud detection — but model risk management and explainability requirements create governance complexity.',
      'Third-party risk management requirements are intensifying — financial regulators are holding institutions accountable for the security posture of their vendors and service providers.',
    ],
    technologyPriorities: [
      { area: 'Zero-Trust Architecture', urgency: 'high', detail: 'Regulatory pressure and the shift to hybrid work have made zero-trust a mandate rather than an option. Identity, device posture, and continuous verification are the core controls.' },
      { area: 'Data Loss Prevention & Encryption', urgency: 'high', detail: 'PCI-DSS, SOX, and state privacy laws create specific data handling requirements. DLP, encryption, and data classification are baseline expectations.' },
      { area: 'Operational Resilience & Business Continuity', urgency: 'high', detail: 'Regulators are shifting from "can you recover?" to "can you operate through an incident?" — a much higher bar. Recovery time objectives are now regulatory commitments.' },
      { area: 'AI/ML Infrastructure for Risk & Fraud', urgency: 'medium', detail: 'Real-time fraud detection and credit risk modeling require low-latency inference infrastructure.' },
    ],
    personaMap: {
      CIO: 'Balancing regulatory compliance with the mandate to modernize. Key concern: any technology change that creates regulatory exposure or operational risk.',
      CISO: 'Among the most sophisticated security buyers in any industry. Will test vendor knowledge quickly. Key concern: third-party risk, insider threat, and the intersection of AI and model risk.',
      'IT Director': 'Operational stability is paramount. Values proven solutions and reference customers in similar regulated environments.',
      CFO: 'Technology spend is a compliance cost, a risk management cost, and increasingly a competitive differentiation cost. Framing ROI in terms of regulatory risk avoidance resonates strongly.',
    },
    edgeTalkingPoints: [
      'Regulatory requirements in financial services mean that every technology decision has a compliance dimension. Thinking through both simultaneously is the baseline expectation of a trusted partner.',
      'Third-party risk questionnaires are part of onboarding with every major financial services customer. A technology partner\'s own security posture needs to be able to withstand that scrutiny.',
      'The DORA conversation is just beginning in the US market — proactive partners who understand its implications before customers ask are positioned as advisors, not vendors.',
    ],
  },
  {
    id: 'industrials', label: 'Industrials & Manufacturing', color: 'purple',
    tagline: 'OT and IT are converging — and most organizations aren\'t ready for what that means for security.',
    edgeCredential: 'Global manufacturing organizations with complex OT/IT convergence challenges, multi-site network architecture requirements, and enterprise-grade security posture needs are among the most demanding technology customers — and among the most loyal when served well.',
    overview: `Industrial and manufacturing organizations are navigating the convergence of Operational Technology (OT) — control systems, PLCs, and SCADA systems that run physical operations — with traditional IT infrastructure. This convergence is driven by Industry 4.0 initiatives but creates a security exposure that most organizations are only beginning to understand.`,
    keyPressures: [
      'A cyberattack on OT infrastructure can shut down physical operations — the Colonial Pipeline attack and subsequent incidents have made OT security an executive and board-level concern.',
      'Tariffs and supply chain disruption are forcing manufacturing organizations to reconfigure supply chains, near-shore production, and build more inventory buffer.',
      'Predictive maintenance and quality control AI programs require real-time data from the factory floor — creating demand for edge compute and low-latency networking in operational environments.',
      'Workforce shortages in skilled trades are accelerating automation investment — robotics and AI-assisted quality inspection are moving from pilot to production.',
    ],
    technologyPriorities: [
      { area: 'OT/IT Network Segmentation & Security', urgency: 'high', detail: 'Isolating OT networks from corporate IT — while enabling Industry 4.0 data flows — requires specialized architecture. Purdue Model segmentation and purpose-built OT security tooling are the standard.' },
      { area: 'Edge Compute & Industrial IoT', urgency: 'medium', detail: 'Real-time processing of sensor data from production equipment cannot tolerate cloud round-trip latency. Edge compute nodes on the factory floor enable local processing and anomaly detection.' },
      { area: 'Secure Remote Access for OT', urgency: 'high', detail: 'Remote monitoring and maintenance of industrial equipment requires secure access to OT networks — but traditional VPN creates unacceptable risk in OT environments.' },
      { area: 'Supply Chain Data Integration', urgency: 'medium', detail: 'Real-time visibility into supplier inventory, logistics, and production status requires integration between ERP, SCM, and supplier data feeds.' },
    ],
    personaMap: {
      CIO: 'OT/IT convergence creates tension — OT teams historically operated independently and are resistant to IT governance. The CIO\'s challenge is extending IT architecture standards to OT without disrupting operations.',
      'VP Operations / COO': 'Production uptime is the governing metric. Any technology initiative is evaluated through the lens of operational continuity — downtime has a direct revenue cost.',
      CISO: 'OT security is a newer responsibility for most CISOs — the threat model, tooling, and governance frameworks are fundamentally different from IT security.',
    },
    edgeTalkingPoints: [
      'The OT/IT convergence is creating a security gap that most organizations are behind on. The architecture to address it is well understood — it\'s a sequencing and expertise problem.',
      'Your factory floor and your corporate network are now connected in ways they weren\'t designed for. The goal is to get the operational benefits without inheriting the security liabilities.',
    ],
  },
  {
    id: 'utilities', label: 'Utilities & Critical Infrastructure', color: 'coral',
    tagline: 'Critical infrastructure is the highest-consequence target — and the least-modernized sector.',
    edgeCredential: 'Infrastructure and OT security expertise, combined with a zero-downtime delivery methodology, maps directly to utility environments where operational continuity is a public safety obligation.',
    overview: `Electric utilities, water systems, and energy infrastructure operate at the intersection of physical and digital — their control systems directly manage infrastructure that, if compromised, affects public safety. NERC CIP compliance, aging infrastructure, and the integration of renewable energy sources are driving significant technology modernization investment.`,
    keyPressures: [
      'NERC CIP standards require electric utilities to implement specific cybersecurity controls for high- and medium-impact bulk electric systems — non-compliance results in significant fines.',
      'Grid modernization (smart meters, distributed energy resources, EV charging) is adding millions of new connected endpoints to utility networks, dramatically expanding the attack surface.',
      'Nation-state threat actors have demonstrated sustained interest in pre-positioning in US critical infrastructure — the threat is not theoretical.',
      'Aging OT infrastructure often runs decades-old software with no supported patch path — and cannot be taken offline without disrupting service.',
    ],
    technologyPriorities: [
      { area: 'NERC CIP Compliance Infrastructure', urgency: 'high', detail: 'Electric utilities must implement specific access control, monitoring, and incident response capabilities for critical cyber assets.' },
      { area: 'OT Asset Visibility & Threat Detection', urgency: 'high', detail: 'OT-specific asset discovery and threat detection platforms provide visibility into industrial control system environments without disrupting operations.' },
      { area: 'Secure Remote Operations', urgency: 'medium', detail: 'Remote monitoring and dispatch of field operations requires secure, reliable connectivity — increasingly delivered over private LTE/5G or SD-WAN.' },
    ],
    personaMap: {
      CIO: 'Managing the convergence of IT governance with OT operational independence — a political as much as a technical challenge.',
      CISO: 'NERC CIP compliance is mandatory, but the threat model extends well beyond compliance minimums. Nation-state threat actors require a different conversation than traditional enterprise security.',
      'VP Operations': 'Reliability and uptime are the primary metrics — any security or modernization initiative that creates operational risk is a non-starter without careful change management.',
    },
    edgeTalkingPoints: [
      'NERC CIP compliance is the floor, not the ceiling — nation-state actors targeting the grid are not deterred by regulatory minimums.',
      'Grid modernization is expanding the attack surface faster than most utilities can instrument and monitor it. Visibility comes before defense.',
    ],
  },
]

// ── PERSONA ENRICHMENT ─────────────────────────────────────────────────────────
export const PERSONA_ENRICHMENT = [
  {
    id: 'cio-enriched', personaRef: 'cio', label: 'CIO / VP of IT — Deep Context', color: 'coral',
    roleEvolution: `The CIO role has undergone a fundamental shift in the past five years. What was once a technology operations and cost management function has become a strategic business enablement role — with C-suite peers now expecting IT to drive digital transformation, enable AI adoption, and manage technology risk at a board-reportable level. CIOs who have made this transition are among the most influential executives in their organizations. Those who haven't are being bypassed by CDOs, CTOs, and business unit leaders who are making technology decisions without IT.`,
    whatTheyReadAndWatch: [
      'Gartner research and the annual CIO Agenda report',
      'Harvard Business Review technology leadership content',
      'MIT Sloan Management Review digital transformation content',
      'McKinsey Technology quarterly',
      'Peer CIO networks (Evanta, CIO Executive Council)',
    ],
    languageThatLands: [
      '"Business outcome" over "technical capability"',
      '"Risk reduction" over "security improvement"',
      '"Operational resilience" over "uptime"',
      '"Digital transformation" as context, not buzzword',
      '"Board-level visibility" — CIOs increasingly report to boards',
    ],
    languageToAvoid: [
      'Technical acronyms without business translation',
      '"Best of breed" — reads as fragmentation',
      '"Cloud-first" without context — many CIOs have been burned by unconstrained cloud migration',
      '"AI-powered" without specifics — this is table stakes noise',
    ],
    topChallenges2026: [
      'Translating AI opportunity into a coherent, governable enterprise strategy — not just isolated pilots',
      'Managing cybersecurity risk at board-reportable levels without an unlimited budget',
      'Modernizing legacy infrastructure under cost pressure while maintaining operational continuity',
      'Recruiting and retaining technical talent in a market where hyperscalers pay 2–3x enterprise salaries',
      'Navigating vendor consolidation and licensing disruption (Broadcom/VMware, Microsoft licensing, AI tool sprawl)',
    ],
    conversationAnchor: '"What\'s the technology conversation you\'re having with your CEO or board right now that you\'d like to be better equipped for? That\'s where we can add the most value."',
  },
  {
    id: 'ciso-enriched', personaRef: 'ciso', label: 'CISO — Deep Context', color: 'purple',
    roleEvolution: `The CISO role has evolved from a technical compliance function to a strategic risk management executive. CISOs now report directly to the CEO or board at a growing percentage of enterprises — and the SEC cybersecurity disclosure rules have made CISO accountability a legal matter. The average CISO tenure is 26 months, often driven by burnout, resource constraints, or post-breach accountability. CISOs are making decisions under significant time and resource pressure.`,
    whatTheyReadAndWatch: [
      'Dark Reading, BleepingComputer (threat intelligence)',
      'CISA advisories and threat briefs',
      'SANS Institute research',
      'Gartner security research',
      'Peer CISO networks (ISSA, ISC2, local chapters)',
    ],
    languageThatLands: [
      '"Attack surface reduction" — specific, actionable',
      '"Mean time to detect / mean time to respond (MTTD/MTTR)" — their operational metrics',
      '"Third-party risk" — a persistent top concern',
      '"Threat intelligence" — demonstrates you understand their world',
      '"Regulatory alignment" — compliance is always in the background',
    ],
    languageToAvoid: [
      '"Zero risk" or "fully secure" — no credible CISO believes this',
      'Vendor marketing language that overpromises detection or prevention',
      'Implying their current security posture is inadequate without evidence',
    ],
    topChallenges2026: [
      'Shadow AI — employees using unsanctioned AI tools that touch sensitive data with no governance',
      'Board and regulatory reporting — translating technical risk into language the board can act on',
      'Third-party and supply chain risk — increasingly required by regulators, increasingly complex to manage',
      'Talent gap — the cybersecurity workforce shortage is structural, not cyclical',
      'Alert fatigue and SOC burnout — too many tools, too many alerts, not enough signal',
    ],
    conversationAnchor: '"If you had to pick the one area of your security program where you have the least confidence in your current posture — what would it be? That\'s usually where we can add the most value."',
  },
  {
    id: 'itdir-enriched', personaRef: 'itdir', label: 'IT Director / Manager — Deep Context', color: 'teal',
    roleEvolution: `The IT Director/Manager is the operational center of gravity in most organizations — they own the day-to-day, manage vendor relationships, and translate executive mandates into operational reality. They are the most important relationship to build because they are both the champion who can pull you into more complex work and the gatekeeper who can exclude you from opportunities. Earning their trust requires demonstrating deep operational credibility — knowing how their environment works, respecting their constraints, and never creating new problems while solving old ones.`,
    whatTheyReadAndWatch: [
      'Spiceworks community',
      'Reddit r/sysadmin — operational reality, unfiltered',
      'Vendor-specific communities (Cisco Community, Microsoft Tech Community)',
      'YouTube for technical how-to content',
      'Peer networks within their industry vertical',
    ],
    languageThatLands: [
      '"We\'ve deployed this in environments like yours" — credibility through specificity',
      '"Here\'s what could go wrong, and here\'s how we\'ll handle it" — they respect honesty about risk',
      '"What does your team\'s current workload look like?" — shows you respect their capacity',
      '"We leave behind documentation and runbooks" — reduces long-term dependency',
    ],
    languageToAvoid: [
      'Overpromising timelines or outcomes',
      'Dismissing their current environment as "legacy" without understanding why they built it that way',
      'Implying they made bad decisions',
      'Going around them to their boss without their buy-in',
    ],
    topChallenges2026: [
      'Being asked to do more with the same headcount — AI is being sold to leadership as a way to avoid hiring',
      'Managing vendor complexity — too many portals, too many support contracts, too many tools',
      'Keeping pace with threat evolution while maintaining operational stability',
      'Demonstrating value to leadership in business terms, not technical metrics',
      'Managing change resistance from their own team when introducing new tools',
    ],
    conversationAnchor: '"What\'s the one thing on your plate right now that you wish you had more help with — either more hands, more expertise, or both?"',
  },
  {
    id: 'cfo-enriched', personaRef: 'cfo', label: 'CFO / Finance Leadership — Deep Context', color: 'amber',
    roleEvolution: `CFOs are increasingly expected to weigh in on technology investment decisions — not just approve budgets, but evaluate ROI, risk, and strategic fit. The CFO has become a key stakeholder in cybersecurity (breach cost and regulatory exposure), AI (build/buy decisions, productivity ROI), and infrastructure (cloud cost optimization, refresh cycle planning). The CFO who understands technology investment is a powerful ally; the one who doesn't is a blocker who needs education, not frustration.`,
    whatTheyReadAndWatch: [
      'Wall Street Journal, FT — business and economic news',
      'CFO magazine and CFO.com',
      'Gartner and Forrester analyst content on technology ROI',
      'Peer CFO networks and finance leadership roundtables',
    ],
    languageThatLands: [
      '"Total cost of ownership" vs. purchase price',
      '"Risk-adjusted ROI" — quantifying the cost of inaction',
      '"Operational efficiency" — headcount productivity, process automation',
      '"Regulatory exposure" — breach fines and audit findings as financial liabilities',
      '"Budget certainty" — OpEx vs. CapEx models, subscription vs. perpetual',
    ],
    languageToAvoid: [
      'Technical architecture detail without financial translation',
      '"Cutting edge" or "best of breed" without cost justification',
      'Implying that the current approach is reckless',
    ],
    framingFramework: `When presenting to a CFO, structure every investment conversation through three lenses:
1. Cost of the problem today (operational overhead, manual workaround costs, risk exposure)
2. Cost of the proposed solution (total cost of ownership, not just licensing)
3. Value gap (the difference between those two numbers — the ROI story)

The CFO who can see those three numbers clearly is the one who approves the budget.`,
    topChallenges2026: [
      'Cloud cost management — cloud spend has exceeded projections at most organizations',
      'AI investment ROI — leadership is committing to AI spend but productivity returns are not yet measured',
      'Cyber insurance premium increases and coverage requirements — a growing line item',
      'Macro uncertainty — tariffs, interest rates, and supply chain costs creating planning volatility',
    ],
    conversationAnchor: '"What does the technology investment conversation look like between your CIO and your CFO right now? Is there a disconnect on priorities or budget expectations?"',
  },
]

// ── COMPETITIVE INTEL ──────────────────────────────────────────────────────────
export const COMPETITIVE_INTEL = [
  {
    id: 'vs-cdw', competitor: 'CDW',
    profile: 'The largest US VAR at ~$25B revenue. Unmatched product catalog breadth and logistics. Strong procurement engine. Weak on customization, advisory depth, and post-sale relationship management at the account level.',
    edgeWins: [
      'Relationship depth — CDW reps manage hundreds of accounts; a focused regional partner knows the customer\'s business.',
      'Responsiveness — CDW support tiers mean complex issues get routed through escalation queues. A smaller partner answers the phone.',
      'Vertical specialization — CDW does not build practice-specific delivery methodologies for healthcare, utilities, or industrials.',
      'Customization — CDW sells what\'s on the shelf. A focused partner designs around the customer\'s specific environment.',
    ],
    edgeWeaknesses: [
      'Catalog breadth — CDW can source almost anything.',
      'Brand recognition — in competitive procurement, CDW\'s scale creates perceived safety.',
      'Logistics infrastructure — large, complex deployments at national scale favor CDW\'s fulfillment capabilities.',
    ],
    displacement: '"CDW is a procurement engine, not a partner. When was the last time your CDW rep called you with an insight about your industry — not just a quote on a new product?"',
  },
  {
    id: 'vs-presidio', competitor: 'Presidio',
    profile: 'PE-backed VAR focused on digital infrastructure and cybersecurity. Strong technical depth in Cisco and CrowdStrike. Multiple ownership transitions affect cultural continuity and rep retention.',
    edgeWins: [
      'Cultural stability — PE ownership creates turnover pressure and strategic pivots that disrupt customer relationships.',
      'Customer intimacy — Presidio operates at scale. A self-funded partner operates at depth.',
      'Agility — a focused partner can design and implement solutions that don\'t fit a standardized national playbook.',
    ],
    edgeWeaknesses: [
      'Scale — Presidio has significantly more headcount and bench depth in some practices.',
      'Brand recognition — Presidio is well-known in many southeastern and national markets.',
    ],
    displacement: '"Presidio\'s ownership model creates pressure to hit quarterly numbers. A self-funded organization\'s only pressure is taking care of customers."',
  },
  {
    id: 'vs-shi', competitor: 'SHI',
    profile: 'Large privately-held VAR focused on software licensing, cloud, and services. Strong Microsoft and software estate management. Less differentiated on network infrastructure and security architecture.',
    edgeWins: [
      'Infrastructure depth — SHI is stronger on software/licensing than on network and security architecture.',
      'Vertical specialization — SHI does not build healthcare-specific delivery methodologies.',
      'Pre-sales investment — a focused partner\'s SE-to-account ratio is significantly higher than SHI\'s.',
    ],
    edgeWeaknesses: [
      'Software licensing breadth — SHI has extensive software procurement capabilities.',
      'Microsoft relationship depth — SHI has strong Microsoft EA management capabilities.',
    ],
    displacement: '"SHI is excellent for software estate management. When you need someone who understands your infrastructure architecture and can help you think through the security implications — that\'s a different conversation."',
  },
]

// ── MARKET SIGNALS (2025–2026) ─────────────────────────────────────────────────
export const MARKET_SIGNALS = [
  {
    id: 'signal-broadcom', title: 'Broadcom/VMware licensing disruption',
    urgency: 'immediate', color: 'coral',
    summary: 'Broadcom\'s acquisition of VMware has resulted in 3–5x licensing cost increases for most organizations and the end of perpetual licensing. Organizations relying on VMware are being forced to make architecture decisions under cost pressure, not strategic clarity.',
    opportunity: 'Every VMware customer is a migration opportunity. Nutanix is the primary alternative. Open with: "What\'s your VMware renewal date, and have you modeled the new Broadcom pricing for your environment?"',
    affectedCustomers: 'Any organization running VMware vSphere, vSAN, NSX, or HCX.',
  },
  {
    id: 'signal-supply-chain', title: 'Hardware supply chain & tariff pressure',
    urgency: 'immediate', color: 'amber',
    summary: 'Tariff increases and component shortages are shortening quote validity windows (Dell and HPE now limit quotes to 7–14 days), creating unpredictable pricing, and driving customers to pull forward hardware purchases. AI infrastructure lead times are 6–12 months.',
    opportunity: 'Supply chain urgency is a rare moment when the CFO is engaged in hardware timing. Use procurement pressure as the entry to a strategic budget conversation. Ask about 18-month refresh plans, not just current needs.',
    affectedCustomers: 'All hardware customers — especially those planning data center refreshes or AI infrastructure builds.',
  },
  {
    id: 'signal-hitachi', title: 'Hitachi Vantara strategic uncertainty',
    urgency: 'near-term', color: 'amber',
    summary: 'Hitachi has announced it is seeking a buyer for Hitachi Vantara. Existing customers face uncertainty about future product roadmap, support continuity, and pricing — creating a migration opportunity.',
    opportunity: 'Proactively reach out to known Hitachi Vantara customers with a migration assessment. Frame it as risk management, not an opportunistic pitch.',
    affectedCustomers: 'Organizations running Hitachi Vantara storage arrays (VSP, HCP, etc.).',
  },
  {
    id: 'signal-ai-governance', title: 'AI governance & shadow AI risk',
    urgency: 'near-term', color: 'purple',
    summary: 'Ungoverned employee use of AI tools (ChatGPT, Copilot, Claude) is exposing sensitive data to consumer AI platforms. CISOs are increasingly aware of this risk but lack frameworks to address it without killing adoption.',
    opportunity: 'The AI governance conversation belongs with CISO, Legal, and HR — not just IT. Ask: "Do you have a policy that defines what data employees can put into AI tools, and do you have visibility into whether they\'re following it?"',
    affectedCustomers: 'Any organization where employees have access to generative AI tools — which is essentially all of them.',
  },
  {
    id: 'signal-ransomware-insurance', title: 'Cyber insurance coverage requirements tightening',
    urgency: 'near-term', color: 'coral',
    summary: 'Cyber insurance underwriters now require documented evidence of MFA, EDR, network segmentation, immutable backup, and incident response plans. Premium increases of 50–100% are common for organizations that fail to meet these requirements.',
    opportunity: 'The cyber insurance renewal conversation is one of the best entry points for a security posture discussion — especially with CFOs and COOs. Ask: "When does your cyber insurance renew, and have you gotten the list of controls they\'re now requiring?"',
    affectedCustomers: 'Any organization that carries cyber insurance — especially in healthcare, financial services, and manufacturing.',
  },
  {
    id: 'signal-copilot-adoption', title: 'Microsoft Copilot adoption gap',
    urgency: 'ongoing', color: 'teal',
    summary: 'Most organizations with Microsoft 365 Copilot licenses are seeing low adoption — fewer than 30% of licensed users engage weekly. The ROI gap is creating frustration at the leadership level.',
    opportunity: 'Offer a targeted Copilot enablement workshop focused on 3–5 high-value use cases for specific roles. This is a relationship-deepening move that doesn\'t require a procurement conversation — and it positions you as a trusted AI advisor.',
    affectedCustomers: 'Any Microsoft E3/E5 customer with Copilot licenses.',
  },
]
