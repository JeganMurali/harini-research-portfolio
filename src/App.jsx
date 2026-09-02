import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const WdrScene = lazy(() => import('./WdrScene'))
const ZebrafishScene = lazy(() => import('./ZebrafishScene'))

const projects = [
  {
    id: 'split-gfp', number: '01', category: 'Wet lab', world: 'Signals',
    title: 'Making molecular proximity visible', short: 'WDR62 · PDPK1–AKT1 · Split-GFP',
    question: 'Can WDR62 bring two signalling proteins close enough to restore a fluorescent signal?',
    why: 'Spatial proximity can reveal how a scaffold coordinates signalling inside a living cell. Split-GFP turns that otherwise invisible relationship into a readable cellular event.',
    approach: ['Designed split-GFP fusion constructs', 'PCR, digestion, ligation and transformation', 'Screened colonies and prepared sequencing samples', 'Transfected HEK293T cells and established fluorescence controls'],
    contribution: 'I worked across the complete validation chain—from construct logic to mammalian-cell fluorescence controls.',
    evidence: 'The report documents cloning checks, gel validation and split-GFP fluorescence controls.',
    learning: 'A strong molecular tool needs controls that distinguish real complementation from expression, localisation and background fluorescence.',
    next: 'Use the validated platform to test candidate WDR62-mediated PDPK1–AKT1 proximity under defined cellular conditions.',
    methods: ['Molecular cloning', 'HEK293T culture', 'Split-GFP', 'Fluorescence imaging'],
    image: '/assets/wdr62-split-gfp.jpg', secondary: '/assets/wdr62-gel.jpg', visual: 'split',
    report: '/documents/projects/WDR62-split-GFP-report.docx', reportLabel: 'Download project report',
    status: 'Semester project · platform validation',
    period: 'January–March 2026', supervisor: 'Dr Pavithra Lakshminarasimhan Chavali',
  },
  {
    id: 'coral', number: '02', category: 'Wet lab', world: 'Survival',
    title: 'Finding defence in a coral microbiome', short: 'CSIR-NIO · Marine microbiology · May–July 2025',
    question: 'Can coral-associated bacteria produce metabolites that suppress clinically and ecologically relevant pathogens?',
    why: 'Coral microbial communities are chemical ecosystems. Their defensive metabolites may reveal new antimicrobial activity and ecological relationships.',
    approach: ['Cultured seven coral-associated bacterial strains', 'Extracted metabolites with ethyl acetate', 'Screened against V. harveyi, V. cholerae and MRSA', 'Compared culture conditions shaping antimicrobial activity'],
    contribution: 'I handled culture, extraction, disc diffusion, optimisation, TLC preparation and experimental documentation.',
    evidence: 'Assay plates and condition-comparison plots record strain-specific inhibition and optimisation results.',
    learning: 'Bioactivity is conditional: medium, temperature and extraction choices can change the biological story.',
    next: 'Fractionate active extracts, repeat quantitative testing and connect active fractions to chemical identity.',
    methods: ['Aseptic culture', 'Solvent extraction', 'Disc diffusion', 'TLC'],
    image: '/assets/coral-assay-plates.jpg', secondary: '/assets/coral-temperature-chart.jpg', visual: 'coral',
    report: '/documents/projects/coral-microbiome-report.docx', reportLabel: 'Download internship report',
    status: 'Research internship',
    period: '19 May–25 July 2025',
  },
  {
    id: 'tmem135', number: '03', category: 'Computational', world: 'Structures',
    title: 'Reading one membrane protein across species', short: 'TMEM135 · Evolution · Organelle dynamics',
    question: 'Which parts of TMEM135 remain conserved when evolution changes the organism around it?',
    why: 'Conserved sequence, topology and structure can expose regions most likely to carry essential biological function.',
    approach: ['Retrieved orthologous sequences across five model organisms', 'Built alignments and phylogenetic comparisons', 'Examined codon-level selection and conserved domains', 'Compared topology predictions and homology models'],
    contribution: 'I connected sequence, evolutionary constraint, membrane topology and predicted structure into one comparative analysis.',
    evidence: 'The project report contains predicted structures, topology plots, alignments and evolutionary analyses.',
    learning: 'No single prediction is decisive; confidence emerges when independent computational views agree.',
    next: 'Prioritise conserved residues for targeted mutagenesis or functional validation in a cellular model.',
    methods: ['MAFFT', 'MEGA11', 'Datamonkey', 'TOPCONS', 'SWISS-MODEL'],
    image: '/assets/tmem135-structure.jpg', secondary: '/assets/tmem135-topology.jpg', visual: 'protein',
    report: '/documents/projects/TMEM135-report.docx', reportLabel: 'Download project report',
    status: 'Semester computational project',
    period: 'August–November 2025', supervisor: 'Dr Prasanna Katti',
  },
  {
    id: 'bacterial-signals', number: '04', category: 'Literature', world: 'Signals',
    title: 'How bacteria pass a message on', short: 'Bacterial signalling · Comparative review',
    question: 'How do different bacterial systems convert an external cue into an organised response?',
    why: 'Comparing signalling architectures reveals recurring control principles and pathogen-specific vulnerabilities.',
    approach: ['Synthesised primary literature', 'Compared pathway architectures', 'Mapped second-messenger logic', 'Developed mechanistic hypotheses'],
    contribution: 'I translated a dispersed literature into a structured comparison of bacterial signalling strategies.',
    evidence: 'The output is a literature-led mechanistic synthesis rather than an experimental study.',
    learning: 'Comparative reading is most useful when it produces testable contrasts, not only a catalogue of pathways.',
    next: 'Convert one architecture-level contrast into an experimentally testable signalling question.',
    methods: ['Literature synthesis', 'Pathway comparison', 'Scientific writing'], visual: 'signals',
    status: 'Winter literature project',
    period: 'December 2023–January 2024',
  },
  {
    id: 'biocon', number: '05', category: 'Industry', world: 'Scale',
    title: 'Learning the discipline of scale', short: 'Biocon · API R&D · Bengaluru',
    question: 'What changes when experimental chemistry must become traceable, reproducible and safe at industrial scale?',
    why: 'Industrial R&D connects analytical technique with documentation, process discipline, safety and quality systems.',
    approach: ['Observed API R&D workflows', 'Trained in analytical and purification techniques', 'Worked within SOP-led documentation', 'Learned safety and quality expectations'],
    contribution: 'I completed an eight-week immersion in TLC, preparative HPLC, rotary evaporation, vacuum drying and Karl Fischer analysis.',
    evidence: 'The training report records techniques, process context and regulated laboratory practices.',
    learning: 'Reproducibility is a system of decisions—documentation and process control matter as much as technique.',
    next: 'Carry industrial standards of traceability and reproducibility into future experimental research.',
    methods: ['TLC', 'Preparative HPLC', 'Karl Fischer', 'SOP systems'], visual: 'chromatogram',
    report: '/documents/projects/Biocon-training-report.docx', reportLabel: 'Download training report',
    status: 'Industrial training',
    period: '3 June–31 July 2024',
  },
  {
    id: 'neuronexus', number: '06', category: 'Presentation', world: 'Concept',
    title: 'A speculative route into glioblastoma', short: 'NeuroNexus · Team presentation',
    question: 'Could an engineered viral delivery concept connect tumour tropism with targeted protein degradation?',
    cardCopy: 'Conceptualised a PROTAC-inspired precision oncology strategy using engineered Zika virus-like particles for selective targeting of CD44⁺ glioblastoma stem cells, proposing targeted degradation of anti-apoptotic Bcl-2 proteins as a therapeutic approach (conceptual proposal, not experimentally tested).',
    why: 'The presentation explored how ideas from virology, RNA delivery and PROTAC biology might be assembled into a therapeutic concept.',
    approach: ['Team ideation', 'Literature synthesis', 'Mechanism mapping', 'Scientific presentation'],
    contribution: 'I contributed to collaborative concept development and mechanism-focused communication.',
    evidence: 'This is a presentation and speculative design exercise—not experimentally tested research.',
    learning: 'Ambitious translational ideas become credible only when assumptions, safety constraints and validation steps are explicit.',
    next: 'Define feasibility gates and validation experiments before making any claim about therapeutic potential.',
    methods: ['Team ideation', 'Literature review', 'Presentation design'], visual: 'concept',
    report: '/documents/projects/NeuroNexus-presentation.pdf', reportLabel: 'Open team presentation',
    status: 'Concept only · not experimentally tested',
  },
]

const thesisSteps = [
  { title: 'Observe', verb: 'Locate', copy: 'Resolve WDR62 localisation and protrusion architecture in U251 and HeLa cells using phalloidin staining and confocal microscopy.', cue: 'WDR62 distribution', color: '#9fd8c7' },
  { title: 'Perturb', verb: 'Disrupt', copy: 'Use Cytochalasin D and Latrunculin B to ask whether WDR62 sits upstream or downstream of actin organisation.', cue: 'Actin integrity', color: '#ef8d72' },
  { title: 'Measure', verb: 'Track', copy: 'Use FRAP at the leading edge to move from a fixed snapshot to a time-resolved readout of molecular turnover.', cue: 'Molecular turnover', color: '#62c9d0' },
  { title: 'Map', verb: 'Resolve', copy: 'Combine co-immunoprecipitation and WDR62 domain constructs to identify actin-linked regions and candidate interactors.', cue: 'Interaction domains', color: '#f4d27a' },
]

const filters = ['All', 'Wet lab', 'Computational', 'Literature', 'Industry', 'Presentation']

const capabilities = [
  {
    id: 'cell', number: '01', title: 'Cell biology & imaging',
    statement: 'I study cellular organisation as a dynamic process—not only as a fixed image.',
    detail: 'Mammalian cell culture, confocal microscopy, phalloidin staining and FRAP support questions about localisation, actin architecture and molecular turnover.',
    evidence: 'WDR62 MS thesis · U251 and HeLa cells',
    methods: ['Mammalian cell culture', 'Confocal microscopy', 'FRAP', 'Perturbation'],
  },
  {
    id: 'molecular', number: '02', title: 'Molecular experimentation',
    statement: 'I build experimental systems that make otherwise invisible molecular relationships measurable.',
    detail: 'Construct design, cloning, validation and fluorescence controls connect molecular logic to a testable cellular readout.',
    evidence: 'WDR62–PDPK1–AKT1 split-GFP platform',
    methods: ['PCR', 'Cloning', 'Transfection', 'Fluorescence controls'],
  },
  {
    id: 'microbial', number: '03', title: 'Microbiology & chemistry',
    statement: 'I follow biological activity from a microbial community into an experimental assay.',
    detail: 'Culture, extraction, antimicrobial screening and chromatographic preparation reveal how conditions alter biological activity.',
    evidence: 'CSIR-NIO coral microbiome · Biocon API R&D',
    methods: ['Aseptic culture', 'Extraction', 'Disc diffusion', 'TLC / HPLC'],
  },
  {
    id: 'computational', number: '04', title: 'Computational reasoning',
    statement: 'I use sequence, topology and structure as converging lines of evidence.',
    detail: 'Comparative analysis connects evolutionary conservation with predicted molecular form and experimentally useful hypotheses.',
    evidence: 'TMEM135 comparative biology project',
    methods: ['Alignment', 'Phylogeny', 'Topology', 'Structure prediction'],
  },
]

const zebrafishPaper = {
  title: 'Visualizing Cancer Cell Migration and Invasion in Real Time: Mechanistic Principles, Assay Platforms, and Zebrafish In Vivo Models',
  authors: [
    { name: 'Udhayakumar Gopal', role: 'Corresponding author', affiliation: 'Huntsman Cancer Institute, University of Utah' },
    { name: 'Harini Madheswaran', role: 'Co-author', affiliation: 'Department of Biology, IISER Tirupati' },
  ],
  status: 'Manuscript submitted for publication',
  summary: 'Turns a fragmented literature into one decision framework: which assay actually answers which question about cancer cell migration.',
  keywords: ['Migration plasticity', 'Danio rerio', 'Glioblastoma', 'Precision oncology'],
  report: '/documents/projects/zebrafish-cancer-migration-review.docx', reportLabel: 'Read the manuscript',
}

const assayGuide = [
  { id: 'local', label: 'Local invasion', sites: ['Yolk sac', 'Perivitelline space'], platform: 'Yolk sac / perivitelline xenograft', why: 'Cells sit against host epithelium and vasculature. Days of imaging give local outgrowth, radial invasion and angiogenic remodelling.', limit: 'No hematogenous spread or organotropism.', source: '§5.1' },
  { id: 'vascular', label: 'Vascular arrest', sites: ['Duct of Cuvier', 'Caudal vein'], platform: 'Intravascular · duct of Cuvier or caudal vein', why: 'Mimics hematogenous circulation. Vascular reporters resolve arrest sites, extravasation rate and microcolonies across 24–96 h.', limit: 'Skips primary-site biology.', source: '§4.3, 6.1–6.2' },
  { id: 'confinement', label: 'Confined niche', sites: ['Hindbrain ventricle'], platform: 'Hindbrain ventricle microinjection', why: 'Isolates confinement-associated and perivascular motility inside one defined microenvironment.', limit: 'Anatomically narrow.', source: '§4.3' },
  { id: 'brain', label: 'Brain infiltration', sites: ['Optic tectum', 'Midbrain–hindbrain boundary'], platform: 'Orthotopic intracranial xenograft', why: 'Reproduces diffuse infiltration, tumour microtubes and perivascular co-option, using brain parenchyma as a native 3D scaffold.', limit: 'Long-term outgrowth still needs mice.', source: '§5.2' },
  { id: 'metastasis', label: 'Brain metastasis', sites: ['Circulation entry', 'Brain microvessels'], platform: 'Circulation assay in casper larvae', why: 'Transparent larvae show arrest at brain microvessels, blood–brain-barrier contact and extravasation — including fourth-ventricle leptomeningeal models.', limit: 'Early colonisation only.', source: '§6.3' },
  { id: 'screening', label: 'Drug screening', sites: ['zPDX graft · ambient dosing'], platform: 'zPDX · compound dosed through the water', why: 'Few cells needed and drugs diffuse in from the water: a 5–7 day functional triage before mammalian testing.', limit: 'Not yet a standalone predictor of patient outcome.', source: '§4.8, 8' },
]

// Figure 1 — the six motility programs cancer cells interconvert between.
const migrationModes = [
  { id: 'mesenchymal', name: 'Mesenchymal', tag: 'Elongated · protease-led', detail: 'Integrin adhesions and MMP proteolysis carve a path along ECM fibres.' },
  { id: 'amoeboid', name: 'Amoeboid', tag: 'Rounded · squeezes through', detail: 'RhoA–ROCK contractility and blebs exploit existing pores — no matrix digestion needed.' },
  { id: 'collective', name: 'Collective', tag: 'Leader pulls followers', detail: 'Junctions stay intact; leader cells read the gradient and concentrate proteolysis.' },
  { id: 'hybrid', name: 'Hybrid EMT', tag: 'Partial EMT · clusters', detail: 'Keeps epithelial adhesion while running mesenchymal motility — linked to therapy resistance.' },
  { id: 'lobopodial', name: 'Lobopodial', tag: 'Confined · pressure-driven', detail: 'Blunt lobopodia driven by intracellular pressure and a nuclear piston in stiff matrix.' },
  { id: 'perivascular', name: 'Perivascular', tag: 'Tracks along vessels', detail: 'Vessels act as low-resistance conduits and reinforce stem-like, therapy-resistant states.' },
]

// Figure 2 / Table 1 — throughput against physiological fidelity.
const assayLadder = [
  { id: 'scratch', label: 'Scratch 2D', throughput: 95, fidelity: 14 },
  { id: 'transwell', label: 'Transwell', throughput: 82, fidelity: 27 },
  { id: 'spheroid', label: '3D spheroid', throughput: 54, fidelity: 50 },
  { id: 'chip', label: 'Chip', throughput: 38, fidelity: 63 },
  { id: 'zebrafish', label: 'Zebrafish', throughput: 64, fidelity: 79 },
  { id: 'mouse', label: 'Mouse', throughput: 11, fidelity: 96 },
]

const visualInteractions = {
  split: ['Fragments separated', 'Proximity increasing', 'Signal resolves'],
  coral: ['Condition space', 'Activity zone shifts', 'Conditional response'],
  protein: ['Ortholog lens 01 / 05', 'Ortholog lens 03 / 05', 'Ortholog lens 05 / 05'],
  signals: ['External cue', 'Signal relay', 'Organised response'],
  chromatogram: ['Baseline', 'Peak region I', 'Peak region II'],
  concept: ['Starting assumption', 'Mechanism assembled', 'Validation gate'],
}

function Arrow({ down = false }) {
  return <span aria-hidden="true">{down ? '↓' : '↗'}</span>
}

function CellField() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let active = true
    let points = []
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2)
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
      canvas.style.width = `${innerWidth}px`
      canvas.style.height = `${innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      points = Array.from({ length: innerWidth < 700 ? 30 : 72 }, () => ({
        x: Math.random() * innerWidth, y: Math.random() * innerHeight,
        r: Math.random() * 1.6 + .3, speed: Math.random() * .18 + .05,
        phase: Math.random() * Math.PI * 2,
      }))
    }
    const draw = (time = 0) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      points.forEach((p, i) => {
        p.y -= p.speed
        if (p.y < -8) p.y = innerHeight + 8
        const pulse = .35 + Math.sin(time * .001 + p.phase) * .25
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = i % 7 === 0 ? `rgba(239,141,114,${pulse})` : `rgba(159,216,199,${pulse})`
        ctx.fill()
      })
      frame = reduceMotion || !active ? 0 : requestAnimationFrame(draw)
    }
    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting && !document.hidden
      if (!active && frame) { cancelAnimationFrame(frame); frame = 0 }
      if (active && !frame) draw()
    })
    const onVisibility = () => {
      active = !document.hidden && canvas.getBoundingClientRect().bottom > 0
      if (!active && frame) { cancelAnimationFrame(frame); frame = 0 }
      if (active && !frame) draw()
    }
    resize(); draw(); observer.observe(canvas); addEventListener('resize', resize); document.addEventListener('visibilitychange', onVisibility)
    return () => { cancelAnimationFrame(frame); observer.disconnect(); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', onVisibility) }
  }, [])
  return <canvas className="cell-field" ref={ref} aria-hidden="true" />
}

function MiniVisual({ type, activity }) {
  if (type === 'split') return <div className="mini split-mini"><i /><i /><b /></div>
  if (type === 'coral') return <div className="mini coral-mini">{[1,2,3,4,5,6,7].map(i => <i key={i} />)}<b /></div>
  if (type === 'protein') return <div className="mini protein-mini">{[1,2,3,4,5,6].map(i => <i key={i} />)}</div>
  if (type === 'signals') return <div className="mini signal-mini">{[1,2,3,4].map(i => <i key={i} />)}<b /></div>
  if (type === 'chromatogram') return <svg className="mini chart-mini" viewBox="0 0 220 100"><path d="M0 88H48C57 88 59 17 67 17s7 71 17 71h45c9 0 11-43 19-43s8 43 18 43h54" /><line x1={20 + activity * 180} x2={20 + activity * 180} y1="8" y2="92" /><circle cx={20 + activity * 180} cy="88" r="3" /></svg>
  return <div className="mini concept-mini"><i /><i /><i /><b /></div>
}

function ProjectVisual({ project, large = false }) {
  const [activity, setActivity] = useState(.5)
  const move = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setActivity(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)))
  }
  const stage = activity < .34 ? 0 : activity < .67 ? 1 : 2
  const interaction = visualInteractions[project.visual] || visualInteractions.concept
  return (
    <div className={`interactive-visual interactive-visual--${project.visual} ${large ? 'is-large' : ''}`} style={{ '--activity': activity, '--activity-inverse': 1 - activity, '--activity-shift': `${activity * 42}px`, '--inverse-shift': `${activity * -42}px`, '--activity-scale': .72 + activity * .58, '--activity-percent': `${activity * 100}%`, '--activity-angle': `${(activity - .5) * 22}deg`, '--lens-x': `${activity * 100}%` }} onPointerMove={move} onPointerLeave={() => setActivity(.5)}>
      <MiniVisual type={project.visual} activity={activity} />
      <div className="visual-grid" />
      <div className="visual-instrument" aria-hidden="true"><span>Interactive model</span><b>{interaction[stage]}</b><i><em /></i></div>
      <span>{project.world} / {project.category}</span>
      <strong>{project.short}</strong>
    </div>
  )
}

function EvidenceViewer({ project }) {
  const image = project.image
  const move = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`)
    event.currentTarget.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`)
  }
  if (!image) return <div className="evidence-note"><span>Nature of evidence</span><p>{project.evidence}</p><small>This project is represented by an interactive mechanism visual because its output was literature-, training- or concept-led.</small></div>
  return (
    <div className="evidence-viewer" onPointerMove={move} data-cursor="microscope">
      <img src={image} alt={`Source evidence for ${project.title}`} loading="lazy" decoding="async" />
      {project.secondary && <img className="evidence-viewer__secondary" src={project.secondary} alt="Supporting source figure" loading="lazy" decoding="async" />}
      <span className="evidence-viewer__hint">Move to inspect · source figure</span>
    </div>
  )
}

function useDialogA11y(onClose) {
  const dialogRef = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const dialog = dialogRef.current
    document.body.style.overflow = 'hidden'
    dialog?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus()
      }
    }

    addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      removeEventListener('keydown', onKeyDown)
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  return dialogRef
}

function Dossier({ project, onClose }) {
  const [chapter, setChapter] = useState('story')
  const dialogRef = useDialogA11y(onClose)
  useEffect(() => setChapter('story'), [project])
  const chapters = ['story', 'method', 'evidence', 'next']
  return (
    <div className="dossier-backdrop" role="presentation" onMouseDown={onClose}>
      <article ref={dialogRef} className="dossier" role="dialog" aria-modal="true" aria-label={`${project.title} research dossier`} tabIndex={-1} onMouseDown={(e) => e.stopPropagation()}>
        <header className="dossier__header">
          <div><span>{project.number}</span><p>Research dossier<small>{[project.period, project.status].filter(Boolean).join(' · ')}</small></p></div>
          <nav aria-label="Dossier chapters">
            {chapters.map((item, index) => <button key={item} onClick={() => setChapter(item)} className={chapter === item ? 'is-active' : ''}><small>0{index + 1}</small>{item}</button>)}
          </nav>
          <button className="dossier__close" onClick={onClose} aria-label="Close research dossier">Close <b>×</b></button>
        </header>
        <div className="dossier__body">
          <div className="dossier__visual"><ProjectVisual project={project} large /></div>
          <div className="dossier__panel" key={chapter}>
            {chapter === 'story' && <>
              <p className="eyebrow">{project.short}</p><h2>{project.title}</h2>{(project.period || project.supervisor) && <p className="dossier__credit">{project.period}{project.supervisor && ` · Supervised by ${project.supervisor}`}</p>}
              <div className="dossier__question"><span>The question</span><p>{project.question}</p></div>
              <div className="dossier__two"><div><span>Why it matters</span><p>{project.why}</p></div><div><span>My contribution</span><p>{project.contribution}</p></div></div>
            </>}
            {chapter === 'method' && <>
              <p className="eyebrow">From question to approach</p><h2>The experimental logic</h2>
              <ol className="method-flow">{project.approach.map((item, index) => <li key={item}><span>0{index + 1}</span><p>{item}</p></li>)}</ol>
              <div className="tag-row">{project.methods.map(method => <span key={method}>{method}</span>)}</div>
            </>}
            {chapter === 'evidence' && <>
              <p className="eyebrow">Report evidence · contextualised</p><h2>Inspect the trace</h2>
              <EvidenceViewer project={project} />
              <div className="evidence-caption"><p>{project.evidence}</p>{project.report && <a href={project.report} target="_blank" rel="noreferrer">{project.reportLabel} <Arrow /></a>}</div>
            </>}
            {chapter === 'next' && <>
              <p className="eyebrow">Reflection and direction</p><h2>What this question changed</h2>
              <div className="next-panels"><article><span>What I learned</span><p>{project.learning}</p></article><article><span>The next experiment</span><p>{project.next}</p></article></div>
              <button className="dossier__restart" onClick={() => setChapter('story')}>Return to the question <span>↺</span></button>
            </>}
          </div>
        </div>
      </article>
    </div>
  )
}

function ReviewerMode({ onClose }) {
  const dialogRef = useDialogA11y(onClose)
  return (
    <div className="reviewer-backdrop" onMouseDown={onClose}>
      <article ref={dialogRef} className="reviewer" role="dialog" aria-modal="true" aria-label="PhD reviewer quick view" tabIndex={-1} onMouseDown={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close reviewer mode">×</button>
        <p className="eyebrow">90-second view</p><h2>PhD reviewer mode</h2>
        <div className="reviewer__grid">
          <section><span>Current thesis · 24 May 2026–present</span><h3>Mechanistic dissection of WDR62</h3><p>Non-mitotic roles in actin architecture and protrusion dynamics.</p></section>
          <section><span>Research range</span><h3>Wet lab · computation · microbiology</h3><p>I follow questions across molecular, cellular and microbial scales.</p></section>
          <section><span>Core methods</span><h3>Build · perturb · image · compare</h3><p>I work with cloning, mammalian cells, confocal/FRAP, microbial screening and bioinformatics.</p></section>
          <section><span>PhD direction</span><h3>Mechanistic cell biology and disease</h3><p>I am particularly interested in cancer progression and disease-associated cellular remodelling.</p></section>
          <section><span>Peer output · manuscript submitted</span><h3>Zebrafish cancer-migration review</h3><p>Co-authored with Udhayakumar Gopal (Huntsman Cancer Institute)—a cross-platform assay decision framework for cancer cell migration and invasion.</p></section>
        </div>
        <div className="reviewer__actions"><a href="/documents/Harini_Madheswaran_CV.docx" download>Download my CV <Arrow /></a><a href="mailto:harini_20221059@students.iisertirupati.ac.in">Email me <Arrow /></a></div>
      </article>
    </div>
  )
}

// Mount the WebGL canvas once it first comes near the viewport, then keep it
// mounted. Unmounting on scroll-away tears down the GL context, so scrolling
// back showed the loading placeholder again while the scene re-initialised.
// Offscreen we pause the render loop instead, which costs nothing to resume.
function useLazyScene() {
  const host = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting)
      if (entry.isIntersecting) setMounted(true)
    }, { rootMargin: '450px 0px' })
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])

  return { host, mounted, paused: !inView }
}

function DeferredWdrScene({ step }) {
  const { host, mounted, paused } = useLazyScene()

  return (
    <div className="deferred-scene" ref={host}>
      {mounted
        ? <Suspense fallback={<div className="scene-loading"><i /><span>Resolving cell architecture</span></div>}><WdrScene step={step} paused={paused} /></Suspense>
        : <div className="scene-loading"><i /><span>Conceptual cell model waits below</span></div>}
    </div>
  )
}

function CurrentChapter({ step, onStep }) {
  return <>
    <section className="prologue section-pad" id="current-question" data-chapter>
      <div className="chapter-label"><span>Current chapter</span><b>05</b></div>
      <div><p className="eyebrow">Where my journey has led</p><h2 data-reveal>What tells a cell <em>where to move?</em></h2><p className="lead">The experiences before this thesis built my experimental range. My current work brings that range into one mechanistic question at the leading edge—where actin reorganises, proteins exchange and cell movement begins.</p></div>
      <div className="prologue__pulse"><i /><span>experience</span><b>question</b></div>
    </section>

    <section className="thesis" id="thesis">
      <div className="thesis__scene" data-cursor="drag 3D model">
        <DeferredWdrScene step={step} />
        <div className="scene-hud scene-hud--top"><span>Live conceptual model</span><b>WDR62 / leading edge</b></div>
        <div className="scene-hud scene-hud--bottom"><span>{thesisSteps[step].cue}</span><b>Drag to rotate</b></div>
      </div>
      <div className="thesis__story">
        <div className="chapter-label"><span>Present investigation</span><b>06</b></div>
        <p className="eyebrow">Mechanistic dissection of WDR62 · MS thesis · 24 May 2026–present</p>
        <h2 data-reveal>Can a mitotic scaffold also shape <em>how a cell moves?</em></h2>
        <p>WDR62 is classically linked to spindle organisation and primary microcephaly. In this thesis, I test a less explored, non-mitotic role in actin architecture and protrusion dynamics in U251 and HeLa cells.</p>
        <div className="thesis-controls" role="tablist" aria-label="Thesis experimental logic">
          {thesisSteps.map((item, index) => <button key={item.title} onClick={() => onStep(index)} className={step === index ? 'is-active' : ''} role="tab" aria-selected={step === index}><span>0{index + 1}</span><strong>{item.title}</strong><small>{item.verb}</small></button>)}
        </div>
        <div className="thesis-readout" key={step}><span>0{step + 1} / 04</span><p>{thesisSteps[step].copy}</p></div>
        <div className="supervisor"><span>Supervisor</span>Dr. Pavithra Lakshminarasimhan Chavali · IISER Tirupati</div>
      </div>
    </section>
  </>
}

function ModeGlyph({ id }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg className={`mode-glyph mode-glyph--${id}`} viewBox="0 0 64 44" aria-hidden="true">
      {id === 'mesenchymal' && <g {...common}>
        <ellipse cx="31" cy="22" rx="17" ry="5.5" transform="rotate(-8 31 22)" />
        <circle cx="26" cy="21" r="3.2" />
        <path d="M48 18l9-5M49 22h9M48 26l8 5M14 25l-8 4" />
      </g>}
      {id === 'amoeboid' && <g {...common}>
        <path d="M32 10c7 0 12 5 12 11 0 3 3 3 3 6s-4 6-11 6-9-2-13-2-8-3-8-9 6-12 12-12z" />
        <circle cx="46" cy="15" r="3.4" /><circle cx="19" cy="31" r="2.8" />
      </g>}
      {id === 'collective' && <g {...common}>
        <circle cx="18" cy="18" r="5.5" /><circle cx="18" cy="30" r="5" /><circle cx="30" cy="24" r="5.5" />
        <ellipse cx="45" cy="22" rx="8" ry="6" /><path d="M53 20l6-3M53 25l5 3" />
      </g>}
      {id === 'hybrid' && <g {...common}>
        <circle cx="17" cy="19" r="6" /><circle cx="18" cy="31" r="4.5" opacity=".6" />
        <ellipse cx="36" cy="23" rx="9" ry="5" transform="rotate(-12 36 23)" />
        <path d="M47 19l8-4M47 26l7 4" /><path d="M24 20h4" strokeDasharray="2 2" />
      </g>}
      {id === 'lobopodial' && <g {...common}>
        <path d="M6 12h52M6 32h52" opacity=".5" />
        <path d="M18 15h18a7 7 0 0 1 0 14H18z" /><circle cx="25" cy="22" r="3.6" />
        <path d="M43 22h7" strokeDasharray="2 2" />
      </g>}
      {id === 'perivascular' && <g {...common}>
        <path d="M4 26c14-10 30-10 56 2" opacity=".55" /><path d="M4 33c14-10 30-10 56 2" opacity=".55" />
        <ellipse cx="24" cy="18" rx="7" ry="4.5" transform="rotate(-17 24 18)" />
        <ellipse cx="42" cy="17" rx="6" ry="4" transform="rotate(-9 42 17)" />
      </g>}
    </svg>
  )
}

function MigrationModes() {
  const [active, setActive] = useState(0)
  return (
    <div className="mode-strip">
      <div className="mode-strip__head"><span>The problem · Figure 1</span><p>Cancer cells switch between six motility programs. Target one, they use another.</p></div>
      <div className="mode-strip__row" role="tablist" aria-label="Migration modes">
        {migrationModes.map((mode, index) => (
          <button key={mode.id} role="tab" aria-selected={active === index} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}>
            <ModeGlyph id={mode.id} />
            <strong>{mode.name}</strong>
            <small>{mode.tag}</small>
          </button>
        ))}
      </div>
      <p className="mode-strip__detail" key={migrationModes[active].id}>{migrationModes[active].detail}</p>
    </div>
  )
}

function AssayLadder() {
  const [hover, setHover] = useState('zebrafish')
  const current = assayLadder.find(item => item.id === hover) || assayLadder[4]
  const x = (value) => 52 + (value / 100) * 250
  const y = (value) => 156 - (value / 100) * 130
  return (
    <div className="ladder">
      <div className="ladder__head">
        <span>The trade-off · Figure 2</span>
        <p>Throughput falls as physiological complexity rises. Zebrafish keep both.</p>
      </div>
      <svg className="ladder__plot" viewBox="0 0 330 180" role="img" aria-label="Assay platforms plotted by throughput against physiological fidelity">
        <line x1="52" y1="156" x2="318" y2="156" className="ladder__axis" />
        <line x1="52" y1="156" x2="52" y2="20" className="ladder__axis" />
        <text className="ladder__axis-label" x="185" y="174" textAnchor="middle">Throughput →</text>
        <text className="ladder__axis-label" x="14" y="88" textAnchor="middle" transform="rotate(-90 14 88)">Fidelity →</text>
        <path className="ladder__trend" d="M302 148C250 140 180 96 96 30" />
        {assayLadder.map((item) => {
          const isZebrafish = item.id === 'zebrafish'
          const isActive = item.id === hover
          return (
            <g key={item.id} className={`ladder__point${isZebrafish ? ' is-zebrafish' : ''}${isActive ? ' is-active' : ''}`} onPointerEnter={() => setHover(item.id)}>
              <circle cx={x(item.throughput)} cy={y(item.fidelity)} r="13" className="ladder__hit" />
              {isZebrafish && <circle cx={x(item.throughput)} cy={y(item.fidelity)} r="10" className="ladder__halo" />}
              <circle cx={x(item.throughput)} cy={y(item.fidelity)} r={isZebrafish ? 5.5 : 4} className="ladder__dot" />
              <text x={x(item.throughput)} y={y(item.fidelity) - 12} textAnchor="middle" className="ladder__tag">{item.label}</text>
            </g>
          )
        })}
      </svg>
      <p className="ladder__readout" key={current.id}><b>{current.label}</b> · throughput {current.throughput} · fidelity {current.fidelity}</p>
    </div>
  )
}

function DeferredZebrafishScene({ active }) {
  const { host, mounted, paused } = useLazyScene()

  return (
    <div className="deferred-scene" ref={host}>
      {mounted
        ? <Suspense fallback={<div className="scene-loading"><i /><span>Resolving larval anatomy</span></div>}><ZebrafishScene active={active} paused={paused} /></Suspense>
        : <div className="scene-loading"><i /><span>Live larva model loads here</span></div>}
    </div>
  )
}

function PublicationSection() {
  const [active, setActive] = useState(0)
  const current = assayGuide[active]
  return (
    <section className="publication section-pad" id="publication">
      <div className="publication__heading" data-chapter>
        <div className="chapter-label"><span>Peer output</span><b>04</b></div>
        <div>
          <p className="eyebrow">Beyond my own experiments</p>
          <h2 data-reveal>A question I helped answer <em>for the whole field.</em></h2>
          <p className="lead">A co-authored review that turns a scattered literature into one decision framework: which assay actually answers which question.</p>
        </div>
      </div>

      <div className="publication-figures">
        <MigrationModes />
        <AssayLadder />
      </div>

      <div className="publication-lab">
        <div className="lab-rail">
          <span className="lab-rail__eyebrow">The answer · pick a question</span>
          <div className="lab-rail__questions" role="tablist" aria-label="Biological questions">
            {assayGuide.map((item, index) => <button key={item.id} role="tab" aria-selected={active === index} className={active === index ? 'is-active' : ''} onClick={() => setActive(index)}><span>0{index + 1}</span>{item.label}</button>)}
          </div>
          <div className="lab-rail__answer" key={current.id}>
            <span>Recommended platform</span>
            <h3>{current.platform}</h3>
            <p>{current.why}</p>
            <div className="lab-rail__limit"><span>Where it stops</span><p>{current.limit}</p></div>
            <small>Review {current.source}</small>
          </div>
        </div>

        <div className="publication-stage" data-cursor="drag larva model">
          <DeferredZebrafishScene active={current.id} />
          <div className="scene-hud scene-hud--top"><span>Danio rerio larva · 2 dpf</span><b>Drag to rotate</b></div>
          <div className="publication-stage__sites">
            <span>Injection site{current.sites.length > 1 ? 's' : ''}</span>
            <ul>{current.sites.map(site => <li key={site}>{site}</li>)}</ul>
          </div>
          <div className="scene-hud scene-hud--bottom"><span>Red · tumour cells &nbsp;/&nbsp; Teal · vasculature</span></div>
        </div>
      </div>

      <article className="publication-bar">
        <div className="publication-bar__title">
          <span>{zebrafishPaper.status}</span>
          <h3>{zebrafishPaper.title}</h3>
        </div>
        <div className="publication-bar__side">
          <ul className="publication-card__authors">{zebrafishPaper.authors.map(a => <li key={a.name}><b>{a.name}</b><small>{a.role} · {a.affiliation}</small></li>)}</ul>
          <div className="tag-row">{zebrafishPaper.keywords.map(k => <span key={k}>{k}</span>)}</div>
          <a className="publication-card__link" href={zebrafishPaper.report} target="_blank" rel="noreferrer">{zebrafishPaper.reportLabel} <Arrow /></a>
        </div>
      </article>
    </section>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [thesisStep, setThesisStep] = useState(0)
  const [filter, setFilter] = useState('All')
  const [openProject, setOpenProject] = useState(null)
  const [reviewerOpen, setReviewerOpen] = useState(false)
  const [progress, setProgress] = useState(0)
  const [audioOn, setAudioOn] = useState(false)
  const [activeCapability, setActiveCapability] = useState(0)
  const [headerCompact, setHeaderCompact] = useState(false)
  const audio = useRef(null)
  const hero = useRef(null)

  const visibleProjects = useMemo(() => projects.filter(p => filter === 'All' || p.category === filter), [filter])

  useLayoutEffect(() => {
    const previousRestoration = history.scrollRestoration
    history.scrollRestoration = 'manual'

    const navigation = performance.getEntriesByType('navigation')[0]
    if (navigation?.type === 'reload') {
      history.replaceState(null, '', `${location.pathname}${location.search}`)
      scrollTo({ top: 0, left: 0, behavior: 'instant' })
      requestAnimationFrame(() => scrollTo({ top: 0, left: 0, behavior: 'instant' }))
    }

    return () => { history.scrollRestoration = previousRestoration }
  }, [])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined
    const context = gsap.context(() => {
      gsap.to('.hero__art-base', { scale: 1.17, yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 } })
      gsap.to('.hero__art-focus', { scale: 1.25, xPercent: 2.5, yPercent: -2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.1 } })
      gsap.fromTo('.worlds__image', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.research-worlds', start: 'top bottom', end: 'bottom top', scrub: 1 } })
      gsap.from('.hero__copy > *', { y: 38, opacity: 0, duration: .9, stagger: .09, ease: 'power3.out' })
      gsap.utils.toArray('[data-chapter]').forEach((node) => gsap.from(node, { y: 70, opacity: 0, duration: 1, scrollTrigger: { trigger: node, start: 'top 82%' } }))
      gsap.utils.toArray('[data-reveal]').forEach((node) => gsap.fromTo(node, { clipPath: 'inset(0 0 100% 0)', y: 35 }, { clipPath: 'inset(0 0 0% 0)', y: 0, duration: 1.05, ease: 'power3.out', scrollTrigger: { trigger: node, start: 'top 84%' } }))
    }, document.body)
    return () => context.revert()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      setProgress(max ? scrollY / max : 0)
      setHeaderCompact(current => current ? scrollY > 72 : scrollY > 140)
    }
    onScroll(); addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const closeMenu = (event) => event.key === 'Escape' && setMenuOpen(false)
    addEventListener('keydown', closeMenu)
    return () => removeEventListener('keydown', closeMenu)
  }, [])

  const moveHero = (event) => {
    if (!hero.current) return
    const rect = hero.current.getBoundingClientRect()
    hero.current.style.setProperty('--px', `${((event.clientX - rect.left) / rect.width - .5) * 18}px`)
    hero.current.style.setProperty('--py', `${((event.clientY - rect.top) / rect.height - .5) * 12}px`)
  }

  const toggleAudio = async () => {
    if (audioOn) {
      await audio.current?.close(); audio.current = null; setAudioOn(false); return
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    const ctx = new AudioCtx(); const gain = ctx.createGain(); gain.gain.value = .018; gain.connect(ctx.destination)
    const oscA = ctx.createOscillator(); const oscB = ctx.createOscillator(); const filter = ctx.createBiquadFilter()
    oscA.type = 'sine'; oscB.type = 'triangle'; oscA.frequency.value = 52; oscB.frequency.value = 78; filter.type = 'lowpass'; filter.frequency.value = 180
    oscA.connect(filter); oscB.connect(filter); filter.connect(gain); oscA.start(); oscB.start(); audio.current = ctx; setAudioOn(true)
  }

  return (
    <div className="site-shell">
      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} />
      <aside className="signal-nav" aria-label="Story progress"><span style={{ height: `${progress * 100}%` }} />{[
        ['Harini', '#chapter-0'], ['Profile', '#about'], ['Journey', '#journey'], ['Evidence', '#projects'], ['Paper', '#publication'], ['Current', '#current-question'], ['Next', '#chapter-5'],
      ].map(([item, href]) => <a key={item} href={href} aria-label={item}><i />{item}</a>)}</aside>

      <header className={`site-header${headerCompact ? ' is-compact' : ''}${menuOpen ? ' has-menu' : ''}`}>
        <a className="brand" href="#chapter-0"><span className="brand__mark">HM</span><span className="brand__copy"><b>Harini Madheswaran</b><small>Research portfolio · IISER Tirupati</small></span></a>
        <nav id="primary-navigation" className={menuOpen ? 'site-nav is-open' : 'site-nav'}>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a><a href="#journey" onClick={() => setMenuOpen(false)}>Journey</a><a href="#projects" onClick={() => setMenuOpen(false)}>Research</a><a href="#methods" onClick={() => setMenuOpen(false)}>Methods</a><a href="#publication" onClick={() => setMenuOpen(false)}>Publication</a><a href="#current-question" onClick={() => setMenuOpen(false)}>Current thesis</a><a href="/documents/Harini_Madheswaran_CV.docx" download>CV</a>
          <button className="reviewer-trigger" onClick={() => setReviewerOpen(true)}><span>For PhD reviewers</span><Arrow /></button>
          <button className="sound-trigger" onClick={toggleAudio} aria-pressed={audioOn} aria-label={`Ambient audio ${audioOn ? 'on' : 'off'}`} title="Toggle ambient audio"><i /> <span>Sound {audioOn ? 'on' : 'off'}</span></button>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="primary-navigation"><span /><span /><b>Menu</b></button>
      </header>

      <main>
        <section className="hero" id="chapter-0" ref={hero} onPointerMove={moveHero}>
          <div className="hero__art hero__art-base" />
          <div className="hero__art hero__art-focus" />
          <CellField />
          <div className="hero__signals" aria-hidden="true">{[1,2,3,4].map(i => <i key={i} />)}</div>
          <div className="hero__veil" /><div className="hero__copy">
            <p className="eyebrow">BS–MS researcher · Biology major · Chemistry minor</p>
            <h1>Harini <em>Madheswaran.</em></h1>
            <h2 className="hero__role">Experimental biologist investigating how cells organise, communicate and adapt.</h2>
            <p>I combine cell biology, molecular experimentation, microbiology and computational analysis to turn mechanistic questions into testable experiments.</p>
            <blockquote>Inside every cell, structure becomes decision.</blockquote>
            <div className="hero__actions"><a href="#about" className="button button--light">Meet me <Arrow down /></a><a href="#journey" className="button button--ghost">Follow my journey <Arrow /></a></div>
          </div>
          <div className="hero__readout"><span>IISER Tirupati · Cell biology</span><span>Wet lab · Computation · Scientific synthesis</span><button onClick={() => setReviewerOpen(true)}>90-second reviewer view <Arrow /></button></div>
        </section>

        <section className="researcher-profile section-pad" id="about" data-chapter>
          <div className="profile-intro">
            <div className="chapter-label"><span>My profile</span><b>01</b></div>
            <div>
              <p className="eyebrow">Who I am · What I bring</p>
              <h2 data-reveal>I move between biological scales, while keeping the question <em>experimentally grounded.</em></h2>
              <p className="profile-lead">I am a BS–MS student at IISER Tirupati, majoring in Biology with a Chemistry minor. My work spans mammalian cells, molecular signalling, microbial systems and computational biology. Across each setting, I look for the experiment that can turn an observation into a mechanism.</p>
            </div>
          </div>
          <div className="profile-facts" aria-label="My research summary">
            <article><span>Current focus</span><strong>WDR62, actin architecture and cell movement</strong></article>
            <article><span>Research range</span><strong>Cellular · molecular · microbial · computational</strong></article>
            <article><span>PhD direction</span><strong>Mechanistic cell biology and disease</strong><small>Cancer progression and disease-associated cellular remodelling</small></article>
          </div>
          <div className="capability-lab" id="methods">
            <nav aria-label="Research capabilities">
              {capabilities.map((capability, index) => <button key={capability.id} className={activeCapability === index ? 'is-active' : ''} onClick={() => setActiveCapability(index)}><span>{capability.number}</span><strong>{capability.title}</strong><i aria-hidden="true">↗</i></button>)}
            </nav>
            <article className="capability-readout" key={capabilities[activeCapability].id}>
              <p className="eyebrow">What I can do</p>
              <h3>{capabilities[activeCapability].statement}</h3>
              <p>{capabilities[activeCapability].detail}</p>
              <div className="capability-evidence"><span>Demonstrated in</span><strong>{capabilities[activeCapability].evidence}</strong></div>
              <div className="capability-tags">{capabilities[activeCapability].methods.map(method => <span key={method}>{method}</span>)}</div>
            </article>
          </div>
        </section>

        <section className="trajectory section-pad" id="journey">
          <div className="trajectory__heading" data-chapter>
            <div className="chapter-label"><span>Research journey</span><b>02</b></div>
            <div>
              <p className="eyebrow">From foundation to an independent question</p>
              <h2 data-reveal>One journey. <em>A continuously sharper way of asking why.</em></h2>
              <p className="lead">My path moves from interdisciplinary training to industrial discipline, ecological microbiology and mechanistic cell biology.</p>
            </div>
          </div>
          <div className="living-line" aria-label="My research journey timeline">
            <article data-chapter><i aria-hidden="true" /><span>2022–May 2024 · Tirupati</span><h3>IISER foundation</h3><p>My BS–MS training in Biology and Chemistry led into a winter study of bacterial signalling pathways.</p></article>
            <article data-chapter><i aria-hidden="true" /><span>3 Jun–31 Jul 2024 · Bengaluru</span><h3>Biocon</h3><p>At Biocon, I learned how analytical discipline, reproducibility and SOP-led workflows shape industrial API R&amp;D.</p></article>
            <article data-chapter><i aria-hidden="true" /><span>19 May–25 Jul 2025 · Goa</span><h3>CSIR-NIO</h3><p>At CSIR-NIO, I explored antimicrobial activity in coral-associated microbial communities.</p></article>
            <article data-chapter><i aria-hidden="true" /><span>Aug 2025–Mar 2026 · Tirupati</span><h3>Two toolkits converge</h3><p>I brought computational work on TMEM135 together with molecular experimentation using split-GFP.</p></article>
            <article className="is-current" data-chapter><i aria-hidden="true" /><span>24 May 2026–Present</span><h3>WDR62 MS thesis</h3><p>I now ask how a mitotic scaffold influences actin architecture, cell movement and disease-relevant remodelling.</p></article>
          </div>
        </section>

        <section className="research-worlds" id="journey-stories">
          <div className="worlds__sticky"><picture className="worlds__picture"><source media="(max-width: 780px)" srcSet="/assets/research-worlds-mobile.webp" type="image/webp" /><source srcSet="/assets/research-worlds-v2.webp" type="image/webp" /><img className="worlds__image" src="/assets/research-worlds-v2.png" alt="A cinematic biological landscape representing my movement through academic, industrial and marine research environments" loading="lazy" decoding="async" /></picture><div className="worlds__shade" /></div>
          <div className="worlds__intro"><p className="eyebrow">My formation · four environments</p><h2 data-reveal>Every place changed <em>how I ask questions.</em></h2><p>From an interdisciplinary foundation to industrial discipline, marine microbiology and mechanistic cell biology—this is the path that shaped my research practice.</p></div>
          <div className="world-chapters">
            <article data-chapter><span>01 · IISER Tirupati · Foundation</span><h3 data-reveal>Learning to think across disciplines.</h3><p>Biology gave me the living system; chemistry taught me to reason through interactions, conditions and evidence. IISER made asking questions the centre of learning.</p><small>Biology major · Chemistry minor · BS–MS</small></article>
            <article data-chapter><span>02 · Biocon, Bengaluru · 3 June–31 July 2024</span><h3 data-reveal>Precision became part of the experiment.</h3><p>API R&amp;D showed me that reproducibility is built through analytical discipline, documentation, safety and process control—not technique alone.</p><small>Industrial training · TLC · Preparative HPLC · Karl Fischer · SOP-led workflows</small></article>
            <article data-chapter><span>03 · CSIR-NIO, Goa · 19 May–25 July 2025</span><h3 data-reveal>Biology expanded into a community.</h3><p>Working with coral-associated microbes taught me to follow activity through culture conditions, extraction and antimicrobial screening while respecting ecological context.</p><small>Research internship · Marine microbiology · Screening · Extraction · Optimisation</small></article>
            <article data-chapter><span>04 · IISER Tirupati · 2025–present</span><h3 data-reveal>A broader toolkit met a sharper question.</h3><p>Two semester projects sharpened my computational and molecular toolkit before I began the current mechanistic study of WDR62 and cell movement.</p><small>TMEM135 with Dr Prasanna Katti · Aug–Nov 2025 · Split-GFP with Dr Pavithra Chavali · Jan–Mar 2026 · MS thesis · 24 May 2026–present</small></article>
          </div>
        </section>

        <div className="research-verbs" aria-hidden="true"><div><span>observe</span><i>·</i><span>build</span><i>·</i><span>perturb</span><i>·</i><span>measure</span><i>·</i><span>compare</span><i>·</i><span>interpret</span><i>·</i><span>observe</span><i>·</i><span>build</span><i>·</i><span>perturb</span><i>·</i><span>measure</span></div></div>

        <section className="projects section-pad" id="projects">
          <div className="projects__heading" data-chapter><div className="chapter-label"><span>Interactive research archive</span><b>03</b></div><div><p className="eyebrow">Six research encounters</p><h2 data-reveal>Open a question. <em>Enter its evidence.</em></h2></div><p>Each dossier fits the project into four navigable chapters. Select a project—its story opens immediately in place.</p></div>
          <div className="project-filters">{filters.map(item => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'is-active' : ''}>{item}</button>)}</div>
          <div className="project-constellation">
            <svg className="constellation-lines" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path d="M160 150C330 40 410 225 505 290S715 520 865 420"/><path d="M140 455C285 555 370 350 505 290S730 55 860 155"/></svg>
            {visibleProjects.map((project) => <button className={`project-node project-node--${project.number}`} key={project.id} onClick={() => setOpenProject(project)}><ProjectVisual project={project} /><div className="project-node__copy"><div className="project-node__meta"><span>{project.number} · {project.category}{project.period && <small>{project.period}</small>}</span><i>{project.status}</i></div><h3>{project.title}</h3><p>{project.cardCopy || project.question}</p><div className="project-node__methods">{project.methods.slice(0, 2).map(method => <span key={method}>{method}</span>)}</div><b>Open research dossier <Arrow /></b></div></button>)}
          </div>
        </section>

        <PublicationSection />

        <CurrentChapter step={thesisStep} onStep={setThesisStep} />

        <section className="contact" id="chapter-5">
          <div className="contact__field"><span>?</span><div className="contact__rings"><i /><i /><i /></div><p>The next question is still open.</p></div>
          <div className="contact__copy"><p className="eyebrow">Available for PhD conversations</p><h2 data-reveal>Let’s ask what biology reveals next.</h2><p>I am interested in doctoral research exploring how signalling, cellular architecture and tissue environments are remodelled during cancer progression and other disease states.</p><div className="contact__links"><a href="mailto:harini_20221059@students.iisertirupati.ac.in">Email me <Arrow /></a><a href="https://linkedin.com/in/harini3101051926" target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a href="/documents/Harini_Madheswaran_CV.docx" download>Download my CV <Arrow /></a></div><div className="contact__details"><span>+91 94430 82449</span><span>Tirupati, Andhra Pradesh, India</span></div></div>
        </section>
      </main>
      <footer><span>Harini Madheswaran · Research Portfolio</span><span>Biology · Chemistry · 2026</span></footer>
      {openProject && <Dossier project={openProject} onClose={() => setOpenProject(null)} />}
      {reviewerOpen && <ReviewerMode onClose={() => setReviewerOpen(false)} />}
    </div>
  )
}

export default App
