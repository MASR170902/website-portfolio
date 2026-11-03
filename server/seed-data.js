export const seedContent = {
  projects: [
    {
      id: 'project-proxmox-automation',
      title: 'Proxmox Automation with Bash',
      category: 'Infra as Code',
      description: 'Automated LXC container and user management suite for Proxmox VE built with professional Bash scripts. Driven by users.txt and centralized config.cfg settings, it enables bulk creation, safe purge removal, power control, and auto-boot scheduling with interactive menus, real-time progress tracking, strict regex validation, and post-operation summary reports.',
      tags: ['Proxmox VE', 'Bash', 'IaC', 'VM/LXC', 'ZFS Pool'],
      links: [{ label: 'GitHub', url: 'https://github.com/MASR170902/Proxmox-automation' }],
      imageUrl: ''
    },
    {
      id: 'project-proxmenux-monitor',
      title: 'ProxMenux Monitor (System Dashboard)',
      category: 'Real-Time Observability',
      description: 'A feature-rich custom management and monitoring web dashboard for Proxmox VE environments. Consolidates real-time node telemetry (CPU load, RAM, network throughput, and hardware temperature) alongside live VM & LXC resource tracking. Features physical disk S.M.A.R.T health monitoring, automated & manual backup management, and an integrated web terminal for seamless host control—all in a unified, modern interface.',
      tags: ['Proxmox UI', 'Native Monitoring', 'Docker Compose', 'Proxmox API', 'Multi-Node'],
      links: [{ label: 'Live demo', url: 'https://proxmoxmenu.abdulrasyid.my.id/' }],
      imageUrl: ''
    },
    {
      id: 'project-linux-server-stack',
      title: 'Linux Server Admin & Monitoring Stack',
      category: 'Linux Stack',
      description: "Ubuntu & Debian server administration: SSH hardening, UFW firewall, Nginx reverse proxy with automated SSL/TLS termination, and containerized Docker services. Utilizes Proxmox's integrated monitoring system for clear, intuitive host and container telemetry.",
      tags: ['Ubuntu', 'Nginx', 'UFW', 'SSL/TLS', 'Proxmox UI', 'Native Monitoring'],
      links: [],
      imageUrl: ''
    },
    {
      id: 'project-website-lab',
      title: 'Website Lab: Lab Management Platform',
      category: 'Full-Stack Lab',
      description: 'A web platform for the PNS Lab at Telkom University Purwokerto, featuring lab profiles, research areas, practicum documentation, and publications. It is built using Next.js 16 and Server Actions, utilizes db.json for data storage (chosen intentionally for low-overhead deployment on LXC without requiring a full database stack), and is hosted in an Ubuntu LXC container with scheduled auto-backups.',
      tags: ['Next.js 16', 'db.json', 'Server Actions', 'Ubuntu LXC'],
      links: [{ label: 'GitHub', url: 'https://github.com/MASR170902/website-lab' }],
      imageUrl: ''
    },
    {
      id: 'project-markitdown-converter',
      title: 'MarkItDown Converter: AI File Pipeline',
      category: 'AI-Optimized CLI',
      description: 'Python CLI utility for batch converting PDF, DOCX, XLSX, PPTX, and media files into structured Markdown—reducing LLM token consumption by 85% per upload. Example: 50MB PDF report = 5,000 tokens → 800 tokens per document. Processed 1,000+ documents across team projects with sub-5% error rate.',
      tags: ['Python', 'CLI', 'File I/O', 'Markdown', 'PyPI Package'],
      links: [{ label: 'GitHub', url: 'https://github.com/MASR170902/converter_markitdown' }],
      imageUrl: ''
    },
    {
      id: 'project-turnitout',
      title: 'Turnitout: Academic AI Humanizer & Layout Preserver',
      category: 'NLP Pipeline',
      description: 'Lightweight self-hosted NLP utility and web interface designed to neutralize AI writing patterns on academic papers and technical manuscripts without generative LLM hallucinations. Employs a multi-standard dictionary rule set (Wikipedia, GPTZero, SearchAtlas, Grammarly) combined with a sentence-splitting burstiness enhancer. Features an in-place OpenXML DOM rewriter for .docx files that preserves complex IEEE two-column formatting, nested tables, captions, and citations intact. Deployed as an isolated systemd microservice inside an unprivileged Proxmox LXC container with sub-second execution overhead.',
      tags: ['Python', 'Streamlit', 'OpenXML / DOCX', 'PyMuPDF', 'Proxmox LXC', 'systemd'],
      links: [{ label: 'GitHub', url: 'https://github.com/MASR170902/Turnitout' }],
      imageUrl: ''
    }
  ],
  experiences: [
    {
      id: 'experience-systems-engineer',
      title: 'Systems Engineer & IoT Developer',
      company: 'Independent / Freelance',
      period: 'Nov 2024 — Present',
      bullets: [
        'Architecting and maintaining 3-node distributed infrastructure supporting 107+ virtualized instances (16 VMs + 39 LXCs on lab cluster; 12 instances on home lab). Implemented multi-subnet routing with MikroTik and traffic shaping across isolated VLANs. Deployed and maintained full observability stack using Proxmox native dashboard monitoring 120+ host and container metrics in real-time, enabling rapid incident detection and resolution.',
        'Developed CLI automation tools including MarkItDown Converter (Python) to batch-convert technical documentation into structured Markdown—slashing LLM token usage by 85% per upload with sub-5% error rate.',
        'Automated daily off-site ZFS snapshot backups and container provisioning workflows using Bash IaC, cutting manual disaster recovery time from 45 minutes to under 5 minutes per host.'
      ]
    },
    {
      id: 'experience-robotics-engineer',
      title: 'Robotics Engineer',
      company: 'CV Solusi Arya Prima',
      period: 'Jul 2022 — Oct 2024',
      bullets: [
        'Engineered and deployed 12+ custom automation systems for industrial clients (manufacturing, material handling, inspection), reducing customer production downtime by an average of 40% and increasing line throughput by 25%.',
        'Performed root-cause analysis on 20+ complex mechanical and electrical systems, delivering hardware and firmware fixes that elevated system uptime from 85% to 99%+ within 6 months.',
        'Managed end-to-end project delivery across 5 simultaneous client engagements from scoping to production deployment, consistently hitting a 3-month turnaround from kickoff to field handoff.',
        'Authored 15+ comprehensive technical specification documents, electrical schematics, and maintenance procedures—enabling clients to operate independently with zero vendor lock-in.'
      ]
    }
  ],
  certificates: [
    {
      id: 'certificate-linux-course',
      title: 'Belajar Linux dari Nol',
      issuer: 'LMS ID-Networkers',
      credentialId: 'IDN-1779383590-11033-77240',
      fileType: 'pdf',
      previewUrl: '/certificates/linux-course-certificate-preview.png',
      fileUrl: '/certificates/linux-course-certificate.pdf',
      verificationUrl: 'https://lms.idn.id/?p=1065&certificate_id=IDN-1779383590-11033-77240',
      date: '',
      note: ''
    },
    {
      id: 'certificate-mikrotik-basics',
      title: 'Mikrotik Dasar',
      issuer: 'ID-Networkers Learning Portal',
      date: '20 Oktober 2026',
      credentialId: 'LIDN-6183773712',
      fileType: 'pdf',
      previewUrl: '/certificates/mikrotik-dasar-certificate-preview.png',
      fileUrl: '/certificates/mikrotik-dasar.pdf',
      verificationUrl: '',
      note: ''
    },
    {
      id: 'certificate-huawei-ai',
      title: 'Artificial Intelligence Technology and Applications',
      issuer: 'Huawei ICT Academy',
      date: 'October 19, 2026',
      credentialId: 'ICT20261019000179',
      fileType: 'image',
      previewUrl: '/certificates/huawei-ai-technology.png',
      fileUrl: '/certificates/huawei-ai-technology.png',
      verificationUrl: '',
      note: 'Course completion certificate; it does not represent passing the Huawei Certification exam.'
    },
    {
      id: 'certificate-kubernetes',
      title: 'Introduction to Kubernetes (LFS158)',
      issuer: 'The Linux Foundation',
      date: 'October 26, 2026',
      credentialId: 'LF-gh41ro6qg5',
      fileType: 'image',
      previewUrl: '/certificates/introduction-to-kubernetes.jpeg',
      fileUrl: '/certificates/introduction-to-kubernetes.jpeg',
      verificationUrl: '',
      note: ''
    }
  ]
};
