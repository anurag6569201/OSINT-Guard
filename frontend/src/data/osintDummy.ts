/** Demo payload for OSINT-Guard live dashboard (no backend). */

export const TARGET_NAME = 'Anurag Singh'

export const executive = {
  riskScore: 45,
  riskMax: 100,
  riskLabel: 'High Vulnerability to Targeted Social Engineering',
  summary: `Anurag Singh is a highly active Full-Stack Developer and EEE student at IIIT-BBS. While his professional portfolio is impressive, he suffers from severe Cross-Platform Attribute Disclosure. His public footprint effortlessly links his casual identity (Instagram), professional identity (LinkedIn), and developer identity (Twitter/GitHub). An attacker can map his exact physical movements over the last 4 years, his current startup ambitions (SVA, Sanitas), and his financial/grant applications (GradCapital, Microsoft Founders Hub), making him highly susceptible to targeted spear-phishing.`,
} as const

export type TimelineEntry = {
  id: string
  place: string
  period?: string
  detail: string
  source: string
}

export const patternOfLife: TimelineEntry[] = [
  {
    id: '1',
    place: 'Maihar, Madhya Pradesh',
    detail: 'Identified as Hometown',
    source:
      'LinkedIn Location + Instagram Bio "Maihar <--> BBSR"',
  },
  {
    id: '2',
    place: 'Kota, Rajasthan',
    period: 'Aug 2022 – Jun 2023',
    detail: 'Academic relocation for JEE Prep',
    source:
      'LinkedIn Education "ALLEN" + Cross-referenced with Instagram Video: "A Beautiful year at kota 💙💙"',
  },
  {
    id: '3',
    place: 'Bhubaneswar, Odisha',
    period: 'Aug 2023 – Present',
    detail: 'Current primary residence for B.Tech',
    source:
      'LinkedIn Education "IIIT-BBS" + Instagram Post "visited trible museum 😄😄 BBSR"',
  },
  {
    id: '4',
    place: 'Surat & Gandhinagar, Gujarat',
    period: 'April 5–7, 2025',
    detail:
      'Temporary travel pattern for Odoo X Mindbend Hackathon and HQ visit',
    source: 'LinkedIn Featured Post',
  },
  {
    id: '5',
    place: 'Vizag',
    period: 'March 7, 2026',
    detail: 'Recent travel/vacation',
    source: 'Instagram Post "#vizag"',
  },
]

export const polInference =
  'An attacker knows your exact physical city on almost any given date, your hometown, and your daily college routine.'

export type InferenceRow = {
  targetInfo: string
  inferredValue: string
  evidence: string
}

export const inferenceRows: InferenceRow[] = [
  {
    targetInfo: 'Close Friends/Network',
    inferredValue: 'Aditya, Satvik',
    evidence: 'Twitter tags (@AdityaPat_, @its_satvik) (High)',
  },
  {
    targetInfo: 'Financial/Grant Status',
    inferredValue: 'Waiting on GradCapital',
    evidence:
      'Twitter: "applied for this as a startup mvp!!" (High)',
  },
  {
    targetInfo: 'Recent Income',
    inferredValue: '₹45,000',
    evidence: 'LinkedIn: Won Odoo Hackathon (High)',
  },
  {
    targetInfo: 'Tech Stack / Infra',
    inferredValue: 'Azure, Django, ZK Arch.',
    evidence: 'LinkedIn Bio + Twitter Post about "SVA" (High)',
  },
]

export type PhishingSim = {
  id: string
  title: string
  from: string
  to: string
  subject: string
  body: string
  why: string
}

export const phishingSims: PhishingSim[] = [
  {
    id: 'gradcapital',
    title: 'The "GradCapital" Startup Scam',
    from: 'investments@gradcapital-mvp.com (Spoofed)',
    to: 'Anurag Singh',
    subject: 'Update on your MVP Application for "SVA"',
    body: `Hi Anurag,

We recently reviewed your Twitter update regarding SVA and your use of zk architecture and crypto APIs. We are very impressed with your progress at IIIT-BBS. Your application for the GradCapital MVP grant has been shortlisted for the final round.

Before we schedule our call, please review and sign the attached NDA and Term Sheet document.

[Link to Malicious PDF]`,
    why: 'It exploits your public eagerness for startup funding (Twitter Nov 21) and references your specific tech stack.',
  },
  {
    id: 'odoo',
    title: 'The "Odoo Hackathon" Phishing Trap',
    from: 'hr-onboarding@odoo-careers.com (Spoofed)',
    to: 'Anurag Singh',
    subject: 'Odoo Internship - Stipend Bank Details Required',
    body: `Dear Anurag,

Following your outstanding Rank 1 victory at the Odoo X MINDBEND hackathon at SVNIT Surat, and your visit to our Gandhinagar HQ on April 7, we are finalizing your internship offer.

To process your onboarding and ensure you receive your stipend, please log into the secure Odoo HR portal below to verify your identity and enter your banking details.

[Link to Fake Login Page]`,
    why: 'It uses hyper-specific, highly trusted recent events (Winning ₹45k, visiting HQ) to lower your cognitive defenses and steal banking credentials.',
  },
]

export const methodology = {
  headline: 'The Sum is Greater than the Parts',
  intro: `Individually, your Instagram post about "Vizag," your tweet about "SVA startup," and your LinkedIn post about "Odoo" seem harmless. OSINT-Guard acts as an aggregation engine: it pulls disparate pieces together into a unified digital twin and shows that anonymity is an illusion when platforms are cross-linked.`,
  pillars: [
    {
      title: 'Attribute Disclosure',
      subtitle: 'Who & where',
      text: 'Pattern of life from timestamps and locations across platforms—physical risk and "security question" answers.',
    },
    {
      title: 'Inference Attacks',
      subtitle: 'Secret knowledge',
      text: 'Attackers infer financial status, stack, and goals from public posts—then pick the scam you are most likely to trust.',
    },
    {
      title: 'Social Engineering Weaponization',
      subtitle: 'So what?',
      text: 'Spear-phishing simulations show how oversharing becomes ammunition for identity theft—not just abstract risk.',
    },
  ],
} as const
