/**
 * Database Seed — Creates initial admin user and sample data.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ── Create Organizations ──────────────────────────────
  const techCorp = await prisma.organization.upsert({
    where: { domain: "techcorp.com" },
    update: {},
    create: {
      name: "TechCorp Inc.",
      type: "company",
      domain: "techcorp.com",
    },
  });

  const stateUniv = await prisma.organization.upsert({
    where: { domain: "stateuniv.edu" },
    update: {},
    create: {
      name: "State University",
      type: "college",
      domain: "stateuniv.edu",
    },
  });

  console.log("  Organizations created");

  // ── Create Users ──────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const candidateHash = await bcrypt.hash("Test@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@interviewai.com" },
    update: {},
    create: {
      email: "admin@interviewai.com",
      passwordHash,
      name: "System Admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const hiringManager = await prisma.user.upsert({
    where: { email: "hr@techcorp.com" },
    update: {},
    create: {
      email: "hr@techcorp.com",
      passwordHash: await bcrypt.hash("Manager@123", 12),
      name: "Jane Smith",
      role: "HIRING_MANAGER",
      organizationId: techCorp.id,
      emailVerified: true,
    },
  });

  const collegeProfessor = await prisma.user.upsert({
    where: { email: "prof@stateuniv.edu" },
    update: {},
    create: {
      email: "prof@stateuniv.edu",
      passwordHash: await bcrypt.hash("College@123", 12),
      name: "Dr. Robert Brown",
      role: "COLLEGE",
      organizationId: stateUniv.id,
      emailVerified: true,
    },
  });

  const candidate1 = await prisma.user.upsert({
    where: { email: "candidate@example.com" },
    update: {},
    create: {
      email: "candidate@example.com",
      passwordHash: candidateHash,
      name: "Alex Johnson",
      role: "CANDIDATE",
      organizationId: techCorp.id,
      emailVerified: true,
    },
  });

  const candidate2 = await prisma.user.upsert({
    where: { email: "student@stateuniv.edu" },
    update: {},
    create: {
      email: "student@stateuniv.edu",
      passwordHash: candidateHash,
      name: "Emily Davis",
      role: "CANDIDATE",
      organizationId: stateUniv.id,
      emailVerified: true,
    },
  });

  console.log("  Users created");

  // ── Create Default Settings for all users ─────────────
  for (const user of [admin, hiringManager, collegeProfessor, candidate1, candidate2]) {
    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
  }

  console.log("  User settings created");

  // ── Create Sample Templates ───────────────────────────
  const template1 = await prisma.interviewTemplate.create({
    data: {
      creatorId: hiringManager.id,
      organizationId: techCorp.id,
      name: "Senior Full-Stack Developer",
      aiBehavior: "You are an experienced technical interviewer at TechCorp. Conduct a thorough interview focusing on full-stack development skills, system design, and problem-solving. Be professional, friendly, and ask follow-up questions based on the candidate's responses.",
      customerWants: "A senior developer proficient in React, Node.js, TypeScript, and cloud services. Must demonstrate system design skills and ability to lead technical decisions.",
      candidateOffers: "5+ years of full-stack experience, expertise in React and Node.js ecosystem, experience with AWS/GCP cloud services.",
      isPublic: true,
    },
  });

  const template2 = await prisma.interviewTemplate.create({
    data: {
      creatorId: collegeProfessor.id,
      organizationId: stateUniv.id,
      name: "CS Graduate Interview Practice",
      aiBehavior: "You are a friendly but rigorous mock interviewer helping a computer science graduate prepare for technical interviews. Cover data structures, algorithms, and basic system design. Give constructive feedback.",
      customerWants: "A fresh graduate with strong CS fundamentals, basic knowledge of data structures and algorithms, and good communication skills.",
      candidateOffers: "B.S. in Computer Science, knowledge of Python and Java, completed coursework in algorithms, databases, and operating systems.",
      isPublic: true,
    },
  });

  console.log("  Templates created");

  // ── Pre-built Interview Templates (41 system templates) ─
  const existingSystemTemplates = await prisma.interviewTemplate.count({
    where: { creatorId: admin.id, isPublic: true },
  });
  if (existingSystemTemplates >= 41) {
    console.log("  Pre-built templates already exist, skipping");
  } else {
  try {
    await prisma.interviewTemplate.createMany({
      data: [
        // Software (1-20)
        { creatorId: admin.id, organizationId: null, name: "Software: Software Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Software Engineer position. Ask questions about building scalable applications, debugging code, and cross-functional collaboration. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Software Engineer. Skills: JavaScript, TypeScript, Python, system design. Build scalable web applications, debug production issues, collaborate with cross-functional teams. Experience: 3+ years. Strong problem-solving and code review skills required." },
        { creatorId: admin.id, organizationId: null, name: "Software: Frontend Developer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Frontend Developer position. Ask questions about React/Vue frameworks, responsive UI design, and UX best practices. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Frontend Developer. Skills: React, Vue.js, HTML5, CSS3, responsive design. Build accessible and performant user interfaces. Experience with modern tooling (Webpack, Vite) and UX principles. 2+ years frontend experience required." },
        { creatorId: admin.id, organizationId: null, name: "Software: Backend Developer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Backend Developer position. Ask questions about Java/Python/Node APIs, database design, and system architecture. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Backend Developer. Skills: Java, Python, Node.js, REST APIs, PostgreSQL, Redis. Design scalable services, optimize queries, ensure data integrity. Experience: 3+ years backend development. Strong understanding of distributed systems and caching strategies." },
        { creatorId: admin.id, organizationId: null, name: "Software: Full Stack Developer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Full Stack Developer position. Ask questions about MERN/MEAN stack, end-to-end feature development, and deployment. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Full Stack Developer. Skills: MERN/MEAN stack, MongoDB, Express, React, Node.js. Build complete web applications from frontend to backend. Experience: 3+ years. Ability to work across the entire stack and ship production-ready features." },
        { creatorId: admin.id, organizationId: null, name: "Software: Mobile Developer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Mobile Developer position. Ask questions about Android/iOS development, native and cross-platform frameworks, and API integration. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Mobile Developer. Skills: Android (Kotlin/Java), iOS (Swift), or React Native. Build native mobile apps, integrate REST/GraphQL APIs, handle offline sync. Experience: 2+ years. Knowledge of app store deployment and performance optimization." },
        { creatorId: admin.id, organizationId: null, name: "Software: Data Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Data Engineer position. Ask questions about SQL/Spark pipelines, ETL design, and data quality practices. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Data Engineer. Skills: SQL, Apache Spark, Python, Airflow, dbt. Build and maintain data pipelines, ensure data quality and governance. Experience: 3+ years. Strong understanding of data modeling, warehousing, and streaming architectures." },
        { creatorId: admin.id, organizationId: null, name: "Software: AI/ML Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for an AI/ML Engineer position. Ask questions about training models, deploying ML solutions, and model evaluation. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "AI/ML Engineer. Skills: Python, TensorFlow, PyTorch, scikit-learn. Train and deploy ML models, optimize for production. Experience: 2+ years. Understanding of NLP, computer vision, or recommender systems. MLOps experience preferred." },
        { creatorId: admin.id, organizationId: null, name: "Software: DevOps Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a DevOps Engineer position. Ask questions about CI/CD pipelines, cloud infrastructure, and automation. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "DevOps Engineer. Skills: Docker, Kubernetes, Terraform, Jenkins, AWS/GCP. Build CI/CD pipelines, manage cloud infrastructure, automate deployments. Experience: 3+ years. Strong scripting (Bash, Python) and infrastructure-as-code skills required." },
        { creatorId: admin.id, organizationId: null, name: "Software: QA Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a QA Engineer position. Ask questions about manual and automation testing, test strategy, and defect tracking. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "QA Engineer. Skills: Selenium, Cypress, Jest, manual testing. Design test plans, write automation scripts, ensure product quality. Experience: 2+ years. Knowledge of BDD, API testing, and performance testing preferred." },
        { creatorId: admin.id, organizationId: null, name: "Software: Cloud Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Cloud Engineer position. Ask questions about AWS/Azure/GCP deployments, security, and cost optimization. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Cloud Engineer. Skills: AWS, Azure, or GCP. Design and deploy cloud architectures, manage networking, security, and scaling. Experience: 3+ years. Certifications (Solutions Architect, etc.) preferred. Strong understanding of IAM and compliance." },
        { creatorId: admin.id, organizationId: null, name: "Software: Cybersecurity Analyst", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Cybersecurity Analyst position. Ask questions about threat monitoring, vulnerability assessment, and incident response. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Cybersecurity Analyst. Skills: SIEM, threat hunting, penetration testing basics. Monitor systems for threats, investigate incidents, implement security controls. Experience: 2+ years. Familiarity with SOC operations and security frameworks (NIST, ISO)." },
        { creatorId: admin.id, organizationId: null, name: "Software: Game Developer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Game Developer position. Ask questions about Unity/Unreal engines, game mechanics, and performance optimization. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Game Developer. Skills: Unity, Unreal Engine, C# or C++. Build games across platforms, implement game mechanics, optimize for performance. Experience: 2+ years. Portfolio of shipped games or demos required." },
        { creatorId: admin.id, organizationId: null, name: "Software: Embedded Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for an Embedded Engineer position. Ask questions about C/C++, firmware development, and hardware interaction. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Embedded Engineer. Skills: C/C++, firmware, RTOS, microcontrollers. Develop embedded software for hardware devices. Experience: 3+ years. Knowledge of SPI, I2C, UART, and low-level debugging. ECE or similar degree preferred." },
        { creatorId: admin.id, organizationId: null, name: "Software: Blockchain Developer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Blockchain Developer position. Ask questions about smart contracts, DApps, and Web3 protocols. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Blockchain Developer. Skills: Solidity, Ethereum, smart contracts, DApps. Build decentralized applications and token systems. Experience: 2+ years. Knowledge of Web3.js, Truffle, or Hardhat. Understanding of consensus mechanisms." },
        { creatorId: admin.id, organizationId: null, name: "Software: UI/UX Designer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior design interviewer conducting an interview for a UI/UX Designer position. Ask questions about interface design, usability testing, and design systems. Be professional, probe for depth, and evaluate both design skills and communication ability.", customerWants: "UI/UX Designer. Skills: Figma, Sketch, user research, prototyping. Design intuitive interfaces, conduct usability tests, create design systems. Experience: 3+ years. Strong portfolio demonstrating end-to-end design process and user-centered thinking." },
        { creatorId: admin.id, organizationId: null, name: "Software: Software Architect", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Software Architect position. Ask questions about scalable system design, technology selection, and architectural trade-offs. Be professional, probe for depth, and evaluate both technical vision and communication ability.", customerWants: "Software Architect. Skills: System design, distributed systems, microservices. Design scalable, resilient architectures. Experience: 7+ years. Strong ability to lead technical decisions, document architectures, and mentor engineers." },
        { creatorId: admin.id, organizationId: null, name: "Software: Site Reliability Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Site Reliability Engineer position. Ask questions about uptime, monitoring, incident management, and on-call practices. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "SRE. Skills: Kubernetes, Prometheus, Grafana, on-call. Ensure system uptime, improve reliability, automate operations. Experience: 3+ years. Strong scripting and incident response skills. SLO/SLI definition experience preferred." },
        { creatorId: admin.id, organizationId: null, name: "Software: CRM Developer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a CRM Developer position. Ask questions about Salesforce or Dynamics customization, workflows, and integrations. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "CRM Developer. Skills: Salesforce, Dynamics 365, Apex, Power Automate. Customize CRM platforms, build integrations, automate processes. Experience: 3+ years. Certifications (Salesforce Admin/Developer) preferred. Understanding of sales and marketing workflows." },
        { creatorId: admin.id, organizationId: null, name: "Software: ERP Consultant", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior consultant interviewer conducting an interview for an ERP Consultant position. Ask questions about SAP or Oracle implementation, module configuration, and business process mapping. Be professional, probe for depth, and evaluate both technical and consulting skills.", customerWants: "ERP Consultant. Skills: SAP, Oracle, or similar. Implement and configure ERP modules, map business processes. Experience: 4+ years. Understanding of finance, supply chain, or HR modules. Client-facing consulting experience required." },
        { creatorId: admin.id, organizationId: null, name: "Software: Technical Support Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Technical Support Engineer position. Ask questions about software troubleshooting, customer communication, and escalation procedures. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Technical Support Engineer. Skills: Troubleshooting, SQL, log analysis. Diagnose and resolve software issues, support customers. Experience: 2+ years. Strong written and verbal communication. Familiarity with ticketing systems (Zendesk, Jira) preferred." },
        // MBA / Management (21-30)
        { creatorId: admin.id, organizationId: null, name: "MBA: Marketing Manager", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for a Marketing Manager position. Ask questions about campaigns, brand growth, and go-to-market strategy. Be professional, probe for depth, and evaluate both strategic thinking and communication ability.", customerWants: "Marketing Manager. Skills: Digital marketing, brand strategy, campaign management. Drive brand growth, manage budgets, lead cross-functional campaigns. Experience: 5+ years. MBA or equivalent preferred. Proven track record of successful campaign launches." },
        { creatorId: admin.id, organizationId: null, name: "MBA: Business Analyst", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for a Business Analyst position. Ask questions about data analysis, requirements gathering, and reporting. Be professional, probe for depth, and evaluate both analytical and communication ability.", customerWants: "Business Analyst. Skills: SQL, Excel, data analysis, requirements documentation. Analyze data, create reports, bridge business and tech. Experience: 3+ years. Strong stakeholder management and problem-solving skills." },
        { creatorId: admin.id, organizationId: null, name: "MBA: HR Manager", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for an HR Manager position. Ask questions about hiring, policies, and employee engagement. Be professional, probe for depth, and evaluate both people skills and communication ability.", customerWants: "HR Manager. Skills: Recruitment, policies, engagement, compliance. Lead hiring, implement HR policies, foster culture. Experience: 5+ years. Knowledge of labor laws and HRIS. SHRM or similar certification preferred." },
        { creatorId: admin.id, organizationId: null, name: "MBA: Finance Manager", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for a Finance Manager position. Ask questions about budgeting, financial reporting, and compliance. Be professional, probe for depth, and evaluate both financial acumen and communication ability.", customerWants: "Finance Manager. Skills: Budgeting, financial reporting, compliance. Manage budgets, prepare reports, ensure regulatory compliance. Experience: 5+ years. CPA or CFA preferred. Strong analytical and Excel skills." },
        { creatorId: admin.id, organizationId: null, name: "MBA: Operations Manager", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for an Operations Manager position. Ask questions about process optimization, supply chain, and team leadership. Be professional, probe for depth, and evaluate both operational skills and communication ability.", customerWants: "Operations Manager. Skills: Process optimization, supply chain, lean/Six Sigma. Improve efficiency, manage logistics, lead teams. Experience: 5+ years. Strong problem-solving and stakeholder management. Experience with KPI tracking and continuous improvement." },
        { creatorId: admin.id, organizationId: null, name: "MBA: Sales Manager", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for a Sales Manager position. Ask questions about leading teams, closing deals, and pipeline management. Be professional, probe for depth, and evaluate both sales leadership and communication ability.", customerWants: "Sales Manager. Skills: Sales leadership, pipeline management, CRM. Lead sales teams, close deals, meet targets. Experience: 5+ years. Proven quota achievement. Strong coaching and motivation skills." },
        { creatorId: admin.id, organizationId: null, name: "MBA: Product Manager", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for a Product Manager position. Ask questions about roadmap planning, product launches, and stakeholder alignment. Be professional, probe for depth, and evaluate both product vision and communication ability.", customerWants: "Product Manager. Skills: Roadmap, prioritization, stakeholder management. Define product strategy, launch features, align engineering and business. Experience: 4+ years. Strong analytical and user-focused thinking. Technical background preferred for tech products." },
        { creatorId: admin.id, organizationId: null, name: "MBA: Strategy Consultant", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior consultant conducting an interview for a Strategy Consultant position. Ask questions about market research, competitive analysis, and strategic recommendations. Be professional, probe for depth, and evaluate both analytical rigor and communication ability.", customerWants: "Strategy Consultant. Skills: Market research, competitive analysis, frameworks. Conduct research, develop recommendations, present to executives. Experience: 2-5 years. MBA from top school preferred. Strong slide-making and storytelling skills." },
        { creatorId: admin.id, organizationId: null, name: "MBA: Supply Chain Manager", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for a Supply Chain Manager position. Ask questions about logistics planning, vendor management, and inventory optimization. Be professional, probe for depth, and evaluate both supply chain expertise and communication ability.", customerWants: "Supply Chain Manager. Skills: Logistics, procurement, inventory management. Plan logistics, manage vendors, optimize inventory. Experience: 5+ years. Knowledge of ERP systems and supply chain software. APICS/SCM certification preferred." },
        { creatorId: admin.id, organizationId: null, name: "MBA: Project Manager", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior hiring manager conducting an interview for a Project Manager position. Ask questions about timeline management, risk control, and cross-team coordination. Be professional, probe for depth, and evaluate both project delivery and communication ability.", customerWants: "Project Manager. Skills: Timeline management, risk control, Agile/Scrum. Lead projects, manage timelines, mitigate risks. Experience: 4+ years. PMP or PMI certification preferred. Strong stakeholder and vendor management skills." },
        // VLSI / Semiconductor (31-35)
        { creatorId: admin.id, organizationId: null, name: "VLSI: VLSI Design Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a VLSI Design Engineer position. Ask questions about RTL design, synthesis, and Verilog/SystemVerilog. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "VLSI Design Engineer. Skills: RTL design, Verilog, SystemVerilog, synthesis. Design digital circuits, optimize for power and area. Experience: 3+ years. Understanding of timing closure and design for test. BSEE or MSEE preferred." },
        { creatorId: admin.id, organizationId: null, name: "VLSI: Physical Design Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Physical Design Engineer position. Ask questions about floorplanning, place and route, and timing closure. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Physical Design Engineer. Skills: Floorplanning, P&R, timing closure, EDA tools. Implement physical design from netlist to GDS. Experience: 3+ years. Knowledge of Innovus, ICC2, or similar. Understanding of DRC/LVS and signoff." },
        { creatorId: admin.id, organizationId: null, name: "VLSI: Verification Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a Verification Engineer position. Ask questions about testbenches, UVM, and debugging. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Verification Engineer. Skills: SystemVerilog, UVM, testbenches, coverage. Verify RTL designs, debug failures, achieve coverage targets. Experience: 3+ years. Understanding of constrained random verification. Familiarity with VCS or similar simulators." },
        { creatorId: admin.id, organizationId: null, name: "VLSI: DFT Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for a DFT Engineer position. Ask questions about scan design, ATPG, and test strategy. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "DFT Engineer. Skills: Scan, ATPG, BIST, JTAG. Design for testability, generate test patterns, reduce test cost. Experience: 3+ years. Knowledge of Tessent or similar tools. Understanding of fault models and test coverage." },
        { creatorId: admin.id, organizationId: null, name: "VLSI: Analog Design Engineer", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior technical interviewer conducting an interview for an Analog Design Engineer position. Ask questions about circuit simulation, layout, and analog design trade-offs. Be professional, probe for depth, and evaluate both technical skills and communication ability.", customerWants: "Analog Design Engineer. Skills: Circuit simulation, SPICE, layout. Design analog circuits (op-amps, PLLs, ADCs). Experience: 3+ years. Knowledge of Cadence Virtuoso or similar. Understanding of device physics and parasitics. BSEE or MSEE required." },
        // General (36-40)
        { creatorId: admin.id, organizationId: null, name: "General: General Role Template", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior interviewer conducting a generic role interview. Ask questions about experience, strengths, and fit for the organization. Be professional, probe for depth, and evaluate both competency and communication ability.", customerWants: "Generic role template. Adapt questions to the candidate's background. Focus on experience, problem-solving, teamwork, and cultural fit. Flexible for various roles and industries." },
        { creatorId: admin.id, organizationId: null, name: "General: Position Template", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior interviewer conducting an interview focusing on responsibilities and growth potential. Ask about past achievements, career goals, and how the candidate will contribute. Be professional and evaluate both capability and communication.", customerWants: "Position template emphasizing responsibilities and professional growth. Discuss role expectations, team structure, and advancement opportunities. Suitable for mid-level positions across functions." },
        { creatorId: admin.id, organizationId: null, name: "General: Remote Position", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior interviewer conducting an interview for a remote position. Ask about experience with distributed work, self-management, and communication in remote settings. Be professional and evaluate both productivity and collaboration.", customerWants: "Remote position. Flexible hours, work from home. Strong self-motivation and communication skills required. Experience with async collaboration tools. Must demonstrate ability to deliver independently." },
        { creatorId: admin.id, organizationId: null, name: "General: Internship", isPublic: true, candidateOffers: "", aiBehavior: "You are an interviewer conducting an internship interview. Ask about coursework, projects, and willingness to learn. Be friendly, supportive, and evaluate potential and attitude.", customerWants: "Internship position. Training provided. Ideal for students or recent graduates. Strong learning attitude and basic relevant skills. Duration typically 3-6 months." },
        { creatorId: admin.id, organizationId: null, name: "General: Immediate Hiring", isPublic: true, candidateOffers: "", aiBehavior: "You are a senior interviewer conducting an interview for an immediate hire. Assess readiness to start, availability, and quick ramp-up potential. Be professional and efficient in your evaluation.", customerWants: "Immediate hiring. Competitive salary and benefits. Looking for candidates who can start soon. Prior experience in similar role preferred. Fast onboarding process." },
        // Custom (41)
        { creatorId: admin.id, organizationId: null, name: "Custom: Custom Template", isPublic: true, candidateOffers: "", aiBehavior: "You are a flexible interviewer. Adapt your questions and style to the specific role and candidate. Be professional, probe for depth, and evaluate both skills and communication. Tailor the interview based on the provided job description and context.", customerWants: "Custom template. Fully customizable by the hiring manager. Update AI behavior and job description to match your specific role. Use this when no pre-built template fits your needs." },
      ],
      skipDuplicates: true,
    });
    console.log("  Pre-built templates (41) added");
  } catch (e) {
    console.log("  Pre-built templates already exist or skipped:", (e as Error).message);
  }
  } // end else (existingSystemTemplates < 41)

  console.log("\n✅ Database seeded successfully!\n");
  console.log("Test accounts:");
  console.log("  Admin:          admin@interviewai.com / Admin@123");
  console.log("  Hiring Manager: hr@techcorp.com / Manager@123");
  console.log("  College:        prof@stateuniv.edu / College@123");
  console.log("  Candidate 1:    candidate@example.com / Test@123");
  console.log("  Candidate 2:    student@stateuniv.edu / Test@123");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
