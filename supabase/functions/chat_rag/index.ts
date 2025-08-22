// @ts-nocheck
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import OpenAI from "https://esm.sh/openai@5.3.0";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

// CORS handled via shared helper

type Role = "user" | "assistant" | "system";
interface ChatMessage {
  role: Role;
  content: string;
}

// --- Comprehensive contract type detection ---
const detectContractType = (filename: string, content: string): string => {
  const lowerFilename = filename.toLowerCase();
  const lowerContent = content.toLowerCase();
  
  // Real Estate & Property
  if (lowerFilename.includes('lease') || lowerFilename.includes('rental') || 
      lowerFilename.includes('property') || lowerFilename.includes('real estate') ||
      lowerContent.includes('property') || lowerContent.includes('tenant') ||
      lowerContent.includes('landlord') || lowerContent.includes('rental')) {
    return 'realestate';
  }
  
  // Medical/Healthcare
  if (lowerFilename.includes('medical') || lowerFilename.includes('health') ||
      lowerFilename.includes('hipaa') || lowerFilename.includes('phi') ||
      lowerContent.includes('hipaa') || lowerContent.includes('phi') ||
      lowerContent.includes('medicare') || lowerContent.includes('medicaid') ||
      lowerContent.includes('healthcare') || lowerContent.includes('medical')) {
    return 'medical';
  }
  
  // Employment & HR
  if (lowerFilename.includes('employment') || lowerFilename.includes('contractor') ||
      lowerFilename.includes('hr') || lowerFilename.includes('staff') ||
      lowerContent.includes('employee') || lowerContent.includes('termination') ||
      lowerContent.includes('salary') || lowerContent.includes('benefits')) {
    return 'employment';
  }
  
  // Financial & Banking
  if (lowerFilename.includes('financial') || lowerFilename.includes('investment') ||
      lowerFilename.includes('loan') || lowerFilename.includes('credit') ||
      lowerContent.includes('interest') || lowerContent.includes('payment') ||
      lowerContent.includes('loan') || lowerContent.includes('credit')) {
    return 'financial';
  }
  
  // Legal & Corporate
  if (lowerFilename.includes('legal') || lowerFilename.includes('corporate') ||
      lowerFilename.includes('agreement') || lowerFilename.includes('contract') ||
      lowerContent.includes('legal') || lowerContent.includes('corporate') ||
      lowerContent.includes('agreement')) {
    return 'legal';
  }
  
  // Insurance & Claims
  if (lowerFilename.includes('insurance') || lowerFilename.includes('claim') ||
      lowerFilename.includes('policy') || lowerFilename.includes('coverage') ||
      lowerContent.includes('insurance') || lowerContent.includes('claim') ||
      lowerContent.includes('policy')) {
    return 'insurance';
  }
  
  // Technology & Software
  if (lowerFilename.includes('software') || lowerFilename.includes('technology') ||
      lowerFilename.includes('saas') || lowerFilename.includes('license') ||
      lowerContent.includes('software') || lowerContent.includes('technology') ||
      lowerContent.includes('license')) {
    return 'technology';
  }
  
  // Construction & Engineering
  if (lowerFilename.includes('construction') || lowerFilename.includes('engineering') ||
      lowerFilename.includes('contractor') || lowerFilename.includes('project') ||
      lowerContent.includes('construction') || lowerContent.includes('engineering') ||
      lowerContent.includes('project')) {
    return 'construction';
  }
  
  // Manufacturing & Supply
  if (lowerFilename.includes('manufacturing') || lowerFilename.includes('supply') ||
      lowerFilename.includes('vendor') || lowerFilename.includes('purchase') ||
      lowerContent.includes('manufacturing') || lowerContent.includes('supply') ||
      lowerContent.includes('vendor')) {
    return 'manufacturing';
  }
  
  // Transportation & Logistics
  if (lowerFilename.includes('transportation') || lowerFilename.includes('logistics') ||
      lowerFilename.includes('shipping') || lowerFilename.includes('freight') ||
      lowerContent.includes('transportation') || lowerContent.includes('logistics') ||
      lowerContent.includes('shipping')) {
    return 'transportation';
  }
  
  // Entertainment & Media
  if (lowerFilename.includes('entertainment') || lowerFilename.includes('media') ||
      lowerFilename.includes('publishing') || lowerFilename.includes('broadcast') ||
      lowerContent.includes('entertainment') || lowerContent.includes('media') ||
      lowerContent.includes('publishing')) {
    return 'entertainment';
  }
  
  // Education & Training
  if (lowerFilename.includes('education') || lowerFilename.includes('training') ||
      lowerFilename.includes('academic') || lowerFilename.includes('school') ||
      lowerContent.includes('education') || lowerContent.includes('training') ||
      lowerContent.includes('academic')) {
    return 'education';
  }
  
  // Government & Public Sector
  if (lowerFilename.includes('government') || lowerFilename.includes('public') ||
      lowerFilename.includes('federal') || lowerFilename.includes('state') ||
      lowerContent.includes('government') || lowerContent.includes('public') ||
      lowerContent.includes('federal')) {
    return 'government';
  }
  
  // Non-Profit & Charity
  if (lowerFilename.includes('non-profit') || lowerFilename.includes('charity') ||
      lowerFilename.includes('foundation') || lowerFilename.includes('ngo') ||
      lowerContent.includes('non-profit') || lowerContent.includes('charity') ||
      lowerContent.includes('foundation')) {
    return 'nonprofit';
  }
  
  // Consulting & Professional Services
  if (lowerFilename.includes('consulting') || lowerFilename.includes('professional') ||
      lowerFilename.includes('service') || lowerFilename.includes('advisory') ||
      lowerContent.includes('consulting') || lowerContent.includes('professional') ||
      lowerContent.includes('service')) {
    return 'consulting';
  }
  
  // Retail & E-commerce
  if (lowerFilename.includes('retail') || lowerFilename.includes('e-commerce') ||
      lowerFilename.includes('store') || lowerFilename.includes('merchant') ||
      lowerContent.includes('retail') || lowerContent.includes('e-commerce') ||
      lowerContent.includes('store')) {
    return 'retail';
  }
  
  // Hospitality & Tourism
  if (lowerFilename.includes('hospitality') || lowerFilename.includes('tourism') ||
      lowerFilename.includes('hotel') || lowerFilename.includes('restaurant') ||
      lowerContent.includes('hospitality') || lowerContent.includes('tourism') ||
      lowerContent.includes('hotel')) {
    return 'hospitality';
  }
  
  // Energy & Utilities
  if (lowerFilename.includes('energy') || lowerFilename.includes('utility') ||
      lowerFilename.includes('power') || lowerFilename.includes('gas') ||
      lowerContent.includes('energy') || lowerContent.includes('utility') ||
      lowerContent.includes('power')) {
    return 'energy';
  }
  
  // Telecommunications
  if (lowerFilename.includes('telecom') || lowerFilename.includes('communication') ||
      lowerFilename.includes('phone') || lowerFilename.includes('internet') ||
      lowerContent.includes('telecom') || lowerContent.includes('communication') ||
      lowerContent.includes('phone')) {
    return 'telecom';
  }
  
  // Automotive & Transportation
  if (lowerFilename.includes('automotive') || lowerFilename.includes('vehicle') ||
      lowerFilename.includes('car') || lowerFilename.includes('truck') ||
      lowerContent.includes('automotive') || lowerContent.includes('vehicle') ||
      lowerContent.includes('car')) {
    return 'automotive';
  }
  
  // Agriculture & Farming
  if (lowerFilename.includes('agriculture') || lowerFilename.includes('farming') ||
      lowerFilename.includes('crop') || lowerFilename.includes('livestock') ||
      lowerContent.includes('agriculture') || lowerContent.includes('farming') ||
      lowerContent.includes('crop')) {
    return 'agriculture';
  }
  
  // Pharmaceuticals & Biotech
  if (lowerFilename.includes('pharmaceutical') || lowerFilename.includes('biotech') ||
      lowerFilename.includes('drug') || lowerFilename.includes('clinical') ||
      lowerContent.includes('pharmaceutical') || lowerContent.includes('biotech') ||
      lowerContent.includes('drug')) {
    return 'pharmaceutical';
  }
  
  // Mining & Natural Resources
  if (lowerFilename.includes('mining') || lowerFilename.includes('natural') ||
      lowerFilename.includes('mineral') || lowerFilename.includes('extraction') ||
      lowerContent.includes('mining') || lowerContent.includes('natural') ||
      lowerContent.includes('mineral')) {
    return 'mining';
  }
  
  // Aerospace & Defense
  if (lowerFilename.includes('aerospace') || lowerFilename.includes('defense') ||
      lowerFilename.includes('military') || lowerFilename.includes('aviation') ||
      lowerContent.includes('aerospace') || lowerContent.includes('defense') ||
      lowerContent.includes('military')) {
    return 'aerospace';
  }
  
  // Maritime & Shipping
  if (lowerFilename.includes('maritime') || lowerFilename.includes('shipping') ||
      lowerFilename.includes('vessel') || lowerFilename.includes('cargo') ||
      lowerContent.includes('maritime') || lowerContent.includes('shipping') ||
      lowerContent.includes('vessel')) {
    return 'maritime';
  }
  
  return 'general';
};

// --- Enhanced query expansion for all contract types ---
const expandQuery = (q: string, contractType: string, debug: boolean = false): string => {
  const expansions: Record<string, Record<string, string>> = {
    realestate: {
      "rent": "rent payment lease terms monthly payment",
      "deposit": "security deposit damage deposit refundable",
      "maintenance": "repairs maintenance landlord tenant responsibility",
      "utilities": "electric water gas internet included excluded",
      "termination": "lease termination notice period early termination",
      "property": "property real estate real property premises",
      "tenant": "tenant lessee renter occupant",
      "landlord": "landlord lessor property owner",
    },
    medical: {
      "compliance": "hipaa compliance phi protection privacy",
      "billing": "billing codes reimbursement payment terms",
      "authorization": "prior authorization pre-approval coverage",
      "liability": "medical liability malpractice insurance coverage",
      "patient": "patient client individual person",
      "provider": "provider physician doctor healthcare",
      "treatment": "treatment procedure medical care",
      "insurance": "insurance coverage policy benefits",
    },
    employment: {
      "compensation": "salary benefits bonus commission equity",
      "termination": "at-will termination notice period severance",
      "confidentiality": "nda non-disclosure trade secrets",
      "non-compete": "non-compete clause restrictive covenant",
      "employee": "employee worker staff personnel",
      "employer": "employer company organization business",
      "work": "work duties responsibilities tasks",
      "benefits": "benefits health insurance retirement",
    },
    financial: {
      "interest": "interest rate apr compound simple",
      "collateral": "collateral security lien mortgage",
      "default": "default terms late payment penalties",
      "amortization": "payment schedule principal interest breakdown",
      "loan": "loan credit debt borrowing",
      "payment": "payment installment monthly due",
      "fees": "fees charges costs expenses",
      "credit": "credit score rating history",
    },
    legal: {
      "liability": "liability limitations indemnification damages",
      "governing": "governing law jurisdiction venue",
      "dispute": "dispute resolution arbitration mediation",
      "confidentiality": "confidentiality non-disclosure privacy",
      "termination": "termination breach default",
      "amendment": "amendment modification change",
      "assignment": "assignment transfer delegation",
      "force": "force majeure unforeseeable circumstances",
    },
    insurance: {
      "coverage": "coverage policy limits exclusions",
      "claim": "claim filing process documentation",
      "premium": "premium payment cost rate",
      "deductible": "deductible out-of-pocket responsibility",
      "policy": "policy terms conditions provisions",
      "exclusion": "exclusion limitation restriction",
      "endorsement": "endorsement rider amendment",
      "subrogation": "subrogation rights recovery",
    },
    technology: {
      "license": "license permission rights usage",
      "intellectual": "intellectual property ip ownership",
      "source": "source code software development",
      "api": "api interface integration access",
      "data": "data privacy security protection",
      "service": "service level agreement sla",
      "maintenance": "maintenance support updates",
      "confidentiality": "confidentiality trade secrets",
    },
    construction: {
      "project": "project scope timeline deliverables",
      "contractor": "contractor subcontractor vendor",
      "specifications": "specifications requirements standards",
      "change": "change order modification amendment",
      "payment": "payment schedule milestone billing",
      "warranty": "warranty guarantee defects",
      "safety": "safety compliance regulations",
      "completion": "completion acceptance final",
    },
    manufacturing: {
      "quality": "quality standards specifications requirements",
      "delivery": "delivery schedule timeline deadline",
      "inspection": "inspection testing verification",
      "warranty": "warranty guarantee defects",
      "supply": "supply chain vendor supplier",
      "production": "production capacity output volume",
      "inventory": "inventory stock management",
      "compliance": "compliance regulations standards",
    },
    transportation: {
      "delivery": "delivery schedule timeline route",
      "freight": "freight shipping transport cargo",
      "carrier": "carrier transporter shipper",
      "liability": "liability insurance coverage",
      "route": "route destination origin",
      "equipment": "equipment vehicle machinery",
      "maintenance": "maintenance service repair",
      "safety": "safety compliance regulations",
    },
    entertainment: {
      "rights": "rights license permission usage",
      "royalty": "royalty payment percentage revenue",
      "distribution": "distribution release publication",
      "performance": "performance appearance engagement",
      "intellectual": "intellectual property copyright",
      "territory": "territory region market",
      "duration": "duration term period length",
      "compensation": "compensation payment fee",
    },
    education: {
      "curriculum": "curriculum course content program",
      "accreditation": "accreditation certification approval",
      "tuition": "tuition payment cost fees",
      "attendance": "attendance participation requirement",
      "evaluation": "evaluation assessment grading",
      "faculty": "faculty instructor teacher",
      "facility": "facility classroom equipment",
      "compliance": "compliance regulations standards",
    },
    government: {
      "compliance": "compliance regulations requirements",
      "funding": "funding grant budget allocation",
      "reporting": "reporting documentation submission",
      "audit": "audit review inspection",
      "procurement": "procurement bidding selection",
      "performance": "performance metrics standards",
      "termination": "termination default breach",
      "amendment": "amendment modification change",
    },
    nonprofit: {
      "mission": "mission purpose objective goal",
      "funding": "funding grant donation support",
      "governance": "governance board leadership",
      "compliance": "compliance regulations reporting",
      "program": "program service activity",
      "volunteer": "volunteer staff personnel",
      "donor": "donor contributor supporter",
      "transparency": "transparency disclosure reporting",
    },
    consulting: {
      "scope": "scope work deliverables timeline",
      "fees": "fees payment compensation rate",
      "confidentiality": "confidentiality non-disclosure",
      "intellectual": "intellectual property ownership",
      "termination": "termination notice period",
      "liability": "liability limitation indemnification",
      "expenses": "expenses reimbursement costs",
      "subcontracting": "subcontracting assignment delegation",
    },
    retail: {
      "inventory": "inventory stock merchandise",
      "pricing": "pricing cost markup margin",
      "payment": "payment terms methods",
      "delivery": "delivery shipping fulfillment",
      "returns": "returns refund exchange",
      "warranty": "warranty guarantee protection",
      "marketing": "marketing advertising promotion",
      "territory": "territory region market",
    },
    hospitality: {
      "service": "service quality standards",
      "facility": "facility property premises",
      "booking": "booking reservation confirmation",
      "cancellation": "cancellation policy refund",
      "amenities": "amenities features services",
      "staff": "staff personnel employees",
      "maintenance": "maintenance upkeep repair",
      "liability": "liability insurance coverage",
    },
    energy: {
      "consumption": "consumption usage measurement",
      "billing": "billing payment rate",
      "service": "service reliability availability",
      "maintenance": "maintenance repair service",
      "compliance": "compliance regulations safety",
      "termination": "termination disconnection",
      "equipment": "equipment meter installation",
      "liability": "liability damage responsibility",
    },
    telecom: {
      "service": "service plan package",
      "usage": "usage data minutes text",
      "billing": "billing payment charges",
      "coverage": "coverage area network",
      "equipment": "equipment device phone",
      "termination": "termination cancellation",
      "roaming": "roaming international charges",
      "liability": "liability damage loss",
    },
    automotive: {
      "warranty": "warranty coverage protection",
      "maintenance": "maintenance service repair",
      "financing": "financing payment terms",
      "insurance": "insurance coverage policy",
      "registration": "registration title ownership",
      "liability": "liability damage responsibility",
      "recall": "recall notice safety",
      "service": "service schedule maintenance",
    },
    agriculture: {
      "crop": "crop yield production",
      "equipment": "equipment machinery tools",
      "land": "land property acreage",
      "water": "water irrigation rights",
      "pesticide": "pesticide chemical use",
      "harvest": "harvest timing delivery",
      "storage": "storage facility warehouse",
      "transportation": "transportation shipping delivery",
    },
    pharmaceutical: {
      "clinical": "clinical trial research",
      "approval": "approval regulatory compliance",
      "manufacturing": "manufacturing production quality",
      "distribution": "distribution supply chain",
      "patent": "patent intellectual property",
      "liability": "liability safety adverse",
      "compliance": "compliance regulations fda",
      "research": "research development testing",
    },
    mining: {
      "extraction": "extraction production output",
      "equipment": "equipment machinery tools",
      "safety": "safety compliance regulations",
      "environmental": "environmental impact protection",
      "royalty": "royalty payment percentage",
      "land": "land property mineral rights",
      "transportation": "transportation shipping delivery",
      "processing": "processing refining treatment",
    },
    aerospace: {
      "aircraft": "aircraft vehicle equipment",
      "maintenance": "maintenance service repair",
      "safety": "safety compliance regulations",
      "certification": "certification approval compliance",
      "liability": "liability insurance coverage",
      "performance": "performance specifications standards",
      "training": "training certification qualification",
      "support": "support service maintenance",
    },
    maritime: {
      "vessel": "vessel ship boat",
      "cargo": "cargo freight shipment",
      "navigation": "navigation route course",
      "safety": "safety compliance regulations",
      "insurance": "insurance coverage policy",
      "crew": "crew personnel staff",
      "maintenance": "maintenance service repair",
      "liability": "liability damage responsibility",
    },
    general: {
      "key terms": "key terms important clauses main provisions",
      "payment terms": "payment terms payment conditions billing terms",
      "termination": "termination clauses end contract cancellation",
      "liability": "liability limitations indemnification damages",
      "confidentiality": "confidentiality non-disclosure privacy",
      "governing law": "governing law jurisdiction venue",
      "amendment": "amendment modification change",
      "assignment": "assignment transfer delegation",
    }
  };
  
  const contractExpansions = expansions[contractType] || expansions.general;
  const lower = q.toLowerCase();
  
  for (const [key, expansion] of Object.entries(contractExpansions)) {
    if (lower.includes(key)) {
      if (debug) console.log(`Query expansion applied for ${contractType}: "${key}"`);
      return `${q} ${expansion}`;
    }
  }
  
  return q;
};

// --- Enhanced system prompts based on contract type ---
const getSystemPrompt = (contractType: string, filename: string): string => {
  const basePrompt = `You are fineprnt — a precise, trustworthy contract companion for "${filename}" (${contractType}). Your task is to analyze the provided context and answer the user's question by strictly adhering to the following two-lane format and rules.

### Core Behavior
- **Two-lane answers**: Your response MUST be divided into two distinct lanes:
  1) **From your document**: Contains ONLY claims strictly supported by the provided context chunks. Every sentence in this lane must end with a citation in the format [p{page}, "{section}"]. You must quote the exact language for numbers, definitions, timeframes, obligations, and penalties.
  2) **General guidance (non-document)**: This lane contains optional coaching based on general legal and business knowledge. It MUST NEVER assert facts about this specific contract and MUST NOT include citations to the user's document.

- **Cite-or-Silence Rule**: If the provided document context does not clearly support a claim, do not state it in the "From your document" lane. Instead, list the topic under "Missing or unclear from the document" and, if helpful, discuss the concept generically in the "General guidance" lane.

- **Handling Missing Information**: If the document context contains no information to answer the question, the "From your document" lane should simply state: "I couldn't find specific information about that in the document." You may still provide a "General guidance" lane if appropriate.

### Output Format & Style
- You MUST use the exact markdown headings below for your response.
- Present information concisely, preferably in bullet points.
- NEVER mix information between the lanes. Outside knowledge is forbidden in the document lane.
- Do not speculate or invent section names or page numbers.
- If the user appears to be asking for legal advice, include a brief, neutral reminder in the "General guidance" lane that you provide information for educational purposes, not legal counsel.

### Example Correct Output
User: "What's the termination notice period and are there any cure rights?"

### From your document
- The agreement can be terminated "for convenience" with thirty (30) days' prior written notice [p14, "Termination"].
- For a material breach, the non-breaching party is required to give written notice and allow a ten (10) day cure period before terminating the agreement [p15, "Termination for Cause"].

### Missing or unclear from the document
- An explicit cure period for defaults related to non-payment was not found.

### General guidance (non-document)
- In many commercial agreements, notice periods for convenience range from 30 to 90 days. Cure periods for breaches are commonly between 10 and 30 days.
- It is a best practice to verify that the method of sending notices (e.g., email, certified mail) is clearly defined in the "Notices" section of the contract to ensure compliance.
- This is for informational purposes and not a substitute for legal advice.

### Where to look in the document
- [p14, "Termination"]
- [p15, "Termination for Cause"]
- [p27, "Notices"]`;

  const contractSpecificPrompts: Record<string, string> = {
    realestate: `${basePrompt}

Real Estate Contract Focus:
- Highlight key dates, deadlines, and notice periods
- Identify tenant vs landlord responsibilities
- Note payment terms, deposits, and late fees
- Flag maintenance and repair obligations
- Emphasize termination and renewal terms
- Identify property-specific requirements and restrictions`,
    
    medical: `${basePrompt}

Healthcare Contract Focus:
- Identify compliance requirements (HIPAA, regulatory)
- Note billing and reimbursement terms
- Flag authorization and coverage requirements
- Highlight liability and insurance provisions
- Emphasize patient privacy protections
- Note medical-specific obligations and restrictions`,
    
    employment: `${basePrompt}

Employment Contract Focus:
- Identify compensation structure and benefits
- Note work requirements and expectations
- Flag confidentiality and non-compete terms
- Highlight termination conditions and severance
- Emphasize intellectual property ownership
- Note employment-specific rights and obligations`,
    
    financial: `${basePrompt}

Financial Contract Focus:
- Identify interest rates and payment schedules
- Note collateral and security requirements
- Flag default terms and penalties
- Highlight fees and charges
- Emphasize repayment obligations
- Note financial-specific risks and protections`,
    
    legal: `${basePrompt}

Legal & Corporate Contract Focus:
- Identify governing law and jurisdiction
- Note dispute resolution procedures
- Flag liability limitations and indemnification
- Highlight confidentiality and privacy terms
- Emphasize amendment and termination procedures
- Note legal-specific rights and obligations`,
    
    insurance: `${basePrompt}

Insurance Contract Focus:
- Identify coverage limits and exclusions
- Note claim filing procedures and requirements
- Flag premium payment terms and schedules
- Highlight deductible and out-of-pocket costs
- Emphasize policy terms and conditions
- Note insurance-specific rights and obligations`,
    
    technology: `${basePrompt}

Technology & Software Contract Focus:
- Identify license terms and usage rights
- Note intellectual property ownership
- Flag source code and development terms
- Highlight API and integration requirements
- Emphasize data privacy and security
- Note technology-specific restrictions and permissions`,
    
    construction: `${basePrompt}

Construction & Engineering Contract Focus:
- Identify project scope and deliverables
- Note contractor responsibilities and qualifications
- Flag change order procedures
- Highlight payment schedules and milestones
- Emphasize safety and compliance requirements
- Note construction-specific warranties and guarantees`,
    
    manufacturing: `${basePrompt}

Manufacturing & Supply Contract Focus:
- Identify quality standards and specifications
- Note delivery schedules and timelines
- Flag inspection and testing requirements
- Highlight warranty terms and conditions
- Emphasize supply chain responsibilities
- Note manufacturing-specific compliance requirements`,
    
    transportation: `${basePrompt}

Transportation & Logistics Contract Focus:
- Identify delivery schedules and routes
- Note carrier responsibilities and qualifications
- Flag liability and insurance requirements
- Highlight equipment and maintenance standards
- Emphasize safety and compliance requirements
- Note transportation-specific terms and conditions`,
    
    entertainment: `${basePrompt}

Entertainment & Media Contract Focus:
- Identify rights and license terms
- Note royalty and compensation structures
- Flag distribution and release terms
- Highlight performance requirements
- Emphasize intellectual property rights
- Note entertainment-specific restrictions and permissions`,
    
    education: `${basePrompt}

Education & Training Contract Focus:
- Identify curriculum and program requirements
- Note accreditation and certification standards
- Flag tuition and payment terms
- Highlight attendance and participation requirements
- Emphasize evaluation and assessment procedures
- Note education-specific policies and procedures`,
    
    government: `${basePrompt}

Government & Public Sector Contract Focus:
- Identify compliance and regulatory requirements
- Note funding and budget allocations
- Flag reporting and documentation requirements
- Highlight audit and review procedures
- Emphasize procurement and bidding requirements
- Note government-specific terms and conditions`,
    
    nonprofit: `${basePrompt}

Non-Profit & Charity Contract Focus:
- Identify mission and purpose alignment
- Note funding and grant requirements
- Flag governance and leadership requirements
- Highlight compliance and reporting obligations
- Emphasize program and service delivery
- Note nonprofit-specific restrictions and requirements`,
    
    consulting: `${basePrompt}

Consulting & Professional Services Contract Focus:
- Identify scope of work and deliverables
- Note fee structures and payment terms
- Flag confidentiality and non-disclosure terms
- Highlight intellectual property ownership
- Emphasize termination and notice requirements
- Note consulting-specific terms and conditions`,
    
    retail: `${basePrompt}

Retail & E-commerce Contract Focus:
- Identify inventory and stock requirements
- Note pricing and markup structures
- Flag payment terms and methods
- Highlight delivery and fulfillment requirements
- Emphasize returns and refund policies
- Note retail-specific terms and conditions`,
    
    hospitality: `${basePrompt}

Hospitality & Tourism Contract Focus:
- Identify service quality standards
- Note facility and property requirements
- Flag booking and reservation procedures
- Highlight cancellation and refund policies
- Emphasize amenities and service offerings
- Note hospitality-specific terms and conditions`,
    
    energy: `${basePrompt}

Energy & Utilities Contract Focus:
- Identify consumption and usage requirements
- Note billing and payment terms
- Flag service reliability standards
- Highlight maintenance and repair requirements
- Emphasize safety and compliance requirements
- Note energy-specific terms and conditions`,
    
    telecom: `${basePrompt}

Telecommunications Contract Focus:
- Identify service plans and packages
- Note usage limits and overage charges
- Flag coverage area and network requirements
- Highlight equipment and device terms
- Emphasize termination and cancellation policies
- Note telecom-specific terms and conditions`,
    
    automotive: `${basePrompt}

Automotive Contract Focus:
- Identify warranty coverage and terms
- Note maintenance and service requirements
- Flag financing and payment terms
- Highlight insurance and liability requirements
- Emphasize registration and ownership terms
- Note automotive-specific terms and conditions`,
    
    agriculture: `${basePrompt}

Agriculture & Farming Contract Focus:
- Identify crop and production requirements
- Note equipment and machinery terms
- Flag land and property requirements
- Highlight water and irrigation rights
- Emphasize harvest and delivery schedules
- Note agriculture-specific terms and conditions`,
    
    pharmaceutical: `${basePrompt}

Pharmaceutical & Biotech Contract Focus:
- Identify clinical trial requirements
- Note regulatory approval processes
- Flag manufacturing and quality standards
- Highlight distribution and supply chain terms
- Emphasize patent and intellectual property rights
- Note pharmaceutical-specific terms and conditions`,
    
    mining: `${basePrompt}

Mining & Natural Resources Contract Focus:
- Identify extraction and production requirements
- Note equipment and machinery terms
- Flag safety and compliance requirements
- Highlight environmental protection obligations
- Emphasize royalty and payment structures
- Note mining-specific terms and conditions`,
    
    aerospace: `${basePrompt}

Aerospace & Defense Contract Focus:
- Identify aircraft and equipment specifications
- Note maintenance and service requirements
- Flag safety and compliance standards
- Highlight certification and approval processes
- Emphasize liability and insurance requirements
- Note aerospace-specific terms and conditions`,
    
    maritime: `${basePrompt}

Maritime & Shipping Contract Focus:
- Identify vessel and equipment requirements
- Note cargo and freight handling procedures
- Flag navigation and safety requirements
- Highlight crew and personnel qualifications
- Emphasize maintenance and service requirements
- Note maritime-specific terms and conditions`
  };
  
  return contractSpecificPrompts[contractType] || basePrompt;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    const preflight = handleCors(req);
    if (preflight) return preflight;
  }

  try {
    // --- Environment & Debug Mode ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    const isDebugMode = Deno.env.get("DEBUG_MODE") === "true";

    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase env vars missing");
    if (!openaiApiKey) throw new Error("OPENAI_API_KEY not configured");

    // --- Body (supports `user_message` or `messages[]`) ---
    const body = await req.json().catch(() => ({}));
    const document_id: string | undefined = body.document_id;
    const session_id: string | undefined = body.session_id;
    const user_message: string | undefined = body.user_message;
    const messages: ChatMessage[] | undefined = Array.isArray(body.messages) ? body.messages : undefined;

    if (!document_id) throw new Error("Document ID is required");

    let latestUserMessage = "";
    if (typeof user_message === "string" && user_message.trim()) {
      latestUserMessage = user_message.trim();
    } else if (Array.isArray(messages)) {
      const userMsgs = messages.filter((m) => m?.role === "user" && typeof m?.content === "string");
      latestUserMessage = userMsgs[userMsgs.length - 1]?.content?.trim() ?? "";
    }
    if (!latestUserMessage) throw new Error("No user message found");

    // --- Supabase client & auth ---
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Authorization header required");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid or expired token");

    // B2C: no org lookup required

    // Optional: verify session ownership
    if (session_id) {
      const { data: sessionRow, error: sessionErr } = await supabase
        .from("chat_sessions")
        .select("id, user_id, document_id, message_count")
        .eq("id", session_id)
        .single();

      if (sessionErr || !sessionRow) {
        return new Response(JSON.stringify({ error: "Chat session not found" }), {
          status: 404,
          headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
        });
      }
      if (sessionRow.user_id !== user.id || (document_id && sessionRow.document_id !== document_id)) {
        return new Response(JSON.stringify({ error: "Forbidden: session not owned by user" }), {
          status: 403,
          headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
        });
      }
    }

    // --- Document name (verify ownership) ---
    const { data: document } = await supabase
      .from("documents")
      .select("filename, user_id")
      .eq("id", document_id)
      .single();
    if (!document || document.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden: document not owned by user" }), {
        status: 403,
        headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
      });
    }

    // --- Lightweight per-user rate limit: 30 req / 60s on chat_rag ---
    try {
      const { data: allowed } = await supabase.rpc('check_and_increment_rate_limit', {
        p_user_id: user.id,
        p_bucket: 'chat_rag',
        p_window_seconds: 60,
        p_limit: 30,
      });
      if (allowed === false) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again shortly.' }), {
          status: 429,
          headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
        });
      }
    } catch (_rlErr) {
      // Fail-open on rate limiter issues but log
      console.error('rate-limit-check error', _rlErr);
    }

    // --- Contract type detection and query expansion ---
    const contractType = detectContractType(document?.filename ?? "", "");
    const expandedQuery = expandQuery(latestUserMessage, contractType, isDebugMode);
    if (isDebugMode) {
      console.log(`Search start: doc=[REDACTED] user=[REDACTED] query_length=${latestUserMessage.length} contract_type=${contractType}`);
    }

    // --- Embedding for hybrid search ---
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "text-embedding-3-small", input: expandedQuery }),
    });
    if (!embeddingRes.ok) {
      throw new Error(`Embedding generation failed: ${embeddingRes.status} ${embeddingRes.statusText}`);
    }
    const embeddingData = await embeddingRes.json();
    const queryEmbedding: number[] = embeddingData?.data?.[0]?.embedding ?? [];
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new Error("Invalid embedding returned");
    }

    // --- Hybrid search with multiple strategies ---
    let chunks: any[] = [];
    
    // Strategy 1: Try hybrid search with lower threshold
    try {
      const res = await supabase.rpc("hybrid_search", {
        query_text: expandedQuery,
        query_embedding: JSON.stringify(queryEmbedding),
        match_document_id: document_id,
        match_threshold: 0.15, // Lower threshold for better recall
        match_count: 15,
        user_org_id: user.id,
      });
      if (res.error) throw res.error;
      if (Array.isArray(res.data)) chunks.push(...res.data);
    } catch (primaryErr: any) {
      const msg = String(primaryErr?.message || "").toLowerCase();
      const missing = msg.includes("could not find the function") || msg.includes("function public.hybrid_search");
      if (!missing) {
        console.error("Search error:", primaryErr);
      }
      
      // Fallback to vector-only search
      try {
        const fallback = await supabase.rpc("match_document_chunks", {
          match_document_id: document_id,
          query_embedding: JSON.stringify(queryEmbedding),
          match_threshold: 0.15,
          match_count: 15,
        });
        if (fallback.error) throw fallback.error;
        if (Array.isArray(fallback.data)) chunks.push(...fallback.data);
      } catch (fallbackErr) {
        console.error("Fallback search error:", fallbackErr);
      }
    }

    // Strategy 2: If still no results, try keyword search as backup
    if (chunks.length === 0) {
      if (isDebugMode) console.log("No hybrid/vector results, trying keyword search...");
      
      // Extract keywords from the query for direct text search
      const queryWords = latestUserMessage.toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 2)
        .slice(0, 5);
      
      if (queryWords.length > 0) {
        const orConditions = queryWords.map(word => `content.ilike.%${word}%`).join(",");
        
        const { data: keywordResults } = await supabase
          .from("document_vectors")
          .select("id, document_id, content, metadata")
          .eq("document_id", document_id)
          .or(orConditions)
          .limit(10);
        
        if (Array.isArray(keywordResults)) {
          // Add basic similarity score for keyword matches
          const keywordChunks = keywordResults.map(chunk => ({
            ...chunk,
            similarity: 0.3, // Default similarity for keyword matches
            text_rank: 0.3
          }));
          chunks.push(...keywordChunks);
          if (isDebugMode) console.log(`Found ${keywordChunks.length} results via keyword search`);
        }
      }
    }

    // Strategy 3: If still no results, try contract-specific keyword searches
    if (chunks.length === 0) {
      if (isDebugMode) console.log("No keyword results, trying contract-specific search...");
      
      const contractKeywords: Record<string, string[]> = {
        realestate: ["lease", "rent", "tenant", "landlord", "property", "deposit", "maintenance", "utilities", "termination"],
        medical: ["hipaa", "phi", "billing", "authorization", "compliance", "liability", "patient", "provider", "treatment"],
        employment: ["employee", "compensation", "confidentiality", "termination", "non-compete", "benefits", "work", "employer"],
        financial: ["interest", "payment", "collateral", "default", "amortization", "loan", "fees", "credit"],
        legal: ["liability", "governing", "dispute", "confidentiality", "termination", "amendment", "assignment", "force"],
        insurance: ["coverage", "claim", "premium", "deductible", "policy", "exclusion", "endorsement", "subrogation"],
        technology: ["license", "intellectual", "source", "api", "data", "service", "maintenance", "confidentiality"],
        construction: ["project", "contractor", "specifications", "change", "payment", "warranty", "safety", "completion"],
        manufacturing: ["quality", "delivery", "inspection", "warranty", "supply", "production", "inventory", "compliance"],
        transportation: ["delivery", "freight", "carrier", "liability", "route", "equipment", "maintenance", "safety"],
        entertainment: ["rights", "royalty", "distribution", "performance", "intellectual", "territory", "duration", "compensation"],
        education: ["curriculum", "accreditation", "tuition", "attendance", "evaluation", "faculty", "facility", "compliance"],
        government: ["compliance", "funding", "reporting", "audit", "procurement", "performance", "termination", "amendment"],
        nonprofit: ["mission", "funding", "governance", "compliance", "program", "volunteer", "donor", "transparency"],
        consulting: ["scope", "fees", "confidentiality", "intellectual", "termination", "liability", "expenses", "subcontracting"],
        retail: ["inventory", "pricing", "payment", "delivery", "returns", "warranty", "marketing", "territory"],
        hospitality: ["service", "facility", "booking", "cancellation", "amenities", "staff", "maintenance", "liability"],
        energy: ["consumption", "billing", "service", "maintenance", "compliance", "termination", "equipment", "liability"],
        telecom: ["service", "usage", "billing", "coverage", "equipment", "termination", "roaming", "liability"],
        automotive: ["warranty", "maintenance", "financing", "insurance", "registration", "liability", "recall", "service"],
        agriculture: ["crop", "equipment", "land", "water", "pesticide", "harvest", "storage", "transportation"],
        pharmaceutical: ["clinical", "approval", "manufacturing", "distribution", "patent", "liability", "compliance", "research"],
        mining: ["extraction", "equipment", "safety", "environmental", "royalty", "land", "transportation", "processing"],
        aerospace: ["aircraft", "maintenance", "safety", "certification", "liability", "performance", "training", "support"],
        maritime: ["vessel", "cargo", "navigation", "safety", "insurance", "crew", "maintenance", "liability"]
      };
      
      const keywords = contractKeywords[contractType] || ["contract", "terms", "obligations", "rights", "liability", "payment", "termination", "confidentiality"];
      const keywordConditions = keywords.map(word => `content.ilike.%${word}%`).join(",");
      
      const { data: contractKeywordResults } = await supabase
        .from("document_vectors")
        .select("id, document_id, content, metadata")
        .eq("document_id", document_id)
        .or(keywordConditions)
        .limit(10);
      
      if (Array.isArray(contractKeywordResults)) {
        const contractKeywordChunks = contractKeywordResults.map(chunk => ({
          ...chunk,
          similarity: 0.3,
          text_rank: 0.3
        }));
        chunks.push(...contractKeywordChunks);
        if (isDebugMode) console.log(`Found ${contractKeywordResults.length} results via contract-specific keyword search for ${contractType}`);
      }
    }

    if (isDebugMode) console.log(`Search results: ${chunks?.length ?? 0} chunks found`);
    
    // Debug: Log chunk count and basic metrics only (no content)
    if (isDebugMode && chunks.length > 0) {
      console.log("Search metrics:", {
        total_chunks: chunks.length,
        avg_similarity: chunks.reduce((sum, c) => sum + (c.similarity || 0), 0) / chunks.length,
        has_metadata: chunks.filter(c => c.metadata).length
      });
    }

    // --- Build context blocks ---
    const safeChunks = Array.isArray(chunks) ? chunks : [];
    
    // Debug: If no chunks found, check document exists (without exposing content)
    if (safeChunks.length === 0 && isDebugMode) {
      console.log("No chunks found! Checking document_vectors table...");
      const { count } = await supabase
        .from("document_vectors")
        .select("id", { count: 'exact' })
        .eq("document_id", document_id);
      
      console.log(`Total chunks in document: ${count}`);
    }
    
    const contextBlocks = safeChunks
      .slice(0, 12)
      .map((c: any, i: number) => {
        // Parse metadata if it's a JSON string
        let metadata = c.metadata;
        if (typeof metadata === 'string') {
          try {
            metadata = JSON.parse(metadata);
          } catch (e) {
            if (isDebugMode) console.warn("Failed to parse metadata JSON");
            metadata = {};
          }
        }
        
        const pageNum = metadata?.page_number ?? "?";
        const sectionTitle = metadata?.section_title ?? "Unknown";
        return `[#${i + 1}] p${pageNum} :: "${sectionTitle}"\n${c.content}`;
      })
      .join("\n\n---\n\n");

    // --- Prompts ---
    const systemPrompt = getSystemPrompt(contractType, document?.filename ?? "");

    const userPrompt = `Question: ${latestUserMessage}

Document: "${document?.filename ?? "the document"}" (${contractType})

Context Chunks:
${contextBlocks}

Remember: Use the two-lane format with exact headings. Ground all claims in the context chunks with citations. Provide general guidance only when helpful and clearly labeled as non-document information.`;

    // --- OpenAI Chat Completions streaming (robust, plain text) ---
    const openai = new OpenAI({ apiKey: openaiApiKey });

    // Build messages array
    const chatMessages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Stream from Chat Completions (supports gpt-5 per your docs)
    const stream = await openai.chat.completions.create({
      model: "gpt-5",
      messages: chatMessages as any,
      max_completion_tokens: 2000,
      // If you want GPT-5 minimal reasoning via Chat Completions:
      // @ts-ignore - some client versions call this `reasoning_effort`
      reasoning_effort: "minimal",
      stream: true,
    });

    const encoder = new TextEncoder();
    let finalText = "";

    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream as AsyncIterable<any>) {
            // Strictly extract ONLY text deltas
            const delta = chunk?.choices?.[0]?.delta;
            const textPiece =
              typeof delta?.content === "string"
                ? delta.content
                : ""; // ignore tool/function parts (objects)

            if (textPiece) {
              finalText += textPiece;
              controller.enqueue(encoder.encode(textPiece));
            }
          }

          // Persist the final text when streaming completes
          try {
            const textOut = finalText.trim();
            if (session_id && textOut) {
              const { data: sessionData } = await supabase
                .from("chat_sessions")
                .select("message_count")
                .eq("id", session_id)
                .single();

              const sequenceNumber = (sessionData?.message_count || 0) + 1;

              await supabase.from("chat_messages").insert({
                session_id,
                role: "assistant",
                content: textOut,
                sequence_number: sequenceNumber,
                metadata: {},
              });

              await supabase
                .from("chat_sessions")
                .update({ message_count: sequenceNumber, updated_at: new Date().toISOString() })
                .eq("id", session_id);
            }
          } catch (persistErr) {
            console.error("save-on-final error", persistErr);
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    // Return plain text stream to the browser
    return new Response(readable, {
      headers: {
        ...buildCorsHeaders(req.headers.get('origin') ?? undefined),
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error: any) {
    // Log full error for debugging but sanitize response
    const isDebugMode = Deno.env.get("DEBUG_MODE") === "true";
    console.error("Edge function error:", isDebugMode ? error : error?.message);
    
    const sanitizedError = isDebugMode 
      ? error?.message ?? String(error)
      : "An error occurred while processing your request";
    
    return new Response(JSON.stringify({ error: sanitizedError }), {
      status: 500,
      headers: { ...buildCorsHeaders(req.headers.get('origin') ?? undefined), "Content-Type": "application/json" },
    });
  }
});
