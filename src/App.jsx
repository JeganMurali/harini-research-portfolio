import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap, ease, dur } from './motion'
import Intro, { shouldPlayIntro } from './Intro'
import Journey from './Journey'
import Hero from './Hero'
import Profile from './Profile'
import ReviewerBrief from './ReviewerBrief'
import { useDialogA11y } from './useDialogA11y'

const WdrScene = lazy(() => import('./WdrScene'))
const ZebrafishScene = lazy(() => import('./ZebrafishScene'))

const projects = [
  {
    id: 'split-gfp', number: '01', category: 'Wet lab', world: 'Signals',
    title: 'Making molecular proximity visible', short: 'Molecular cloning · Semester project',
    question: 'Can two signalling proteins be brought close enough to give a readable fluorescent signal in cells?',
    why: 'Spatial proximity can reveal how a scaffold coordinates signalling inside a living cell.',
    approach: ['Designed fusion constructs', 'Cloned and screened colonies', 'Tested fluorescence in HEK293T cells'],
    contribution: 'I worked from construct design through to fluorescence controls in mammalian cells.',
    evidence: 'Cloning checks, gel validation and fluorescence controls.',
    learning: 'A strong molecular tool needs controls that separate a real signal from background.',
    next: 'Apply these controls to test candidate protein interactions under defined cellular conditions.',
    methods: ['Molecular cloning', 'HEK293T culture', 'Fluorescence imaging'],
    visual: 'split',
    status: 'Semester project',
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


// The manuscript is unpublished and under review, so the figure-derived visuals
// (migration modes, assay ladder, 3D larva and the assay decision tool) are kept in
// the codebase but not rendered. Flip to true to restore them once it is published.
const SHOW_PUBLICATION_DETAIL = false

const zebrafishPaper = {
  title: 'Visualizing Cancer Cell Migration and Invasion in Real Time: Mechanistic Principles, Assay Platforms, and Zebrafish In Vivo Models',
  authors: [
    { name: 'Udhayakumar Gopal', role: 'Corresponding author', affiliation: 'Huntsman Cancer Institute, University of Utah' },
    { name: 'Harini Madheswaran', role: 'Co-author', affiliation: 'Department of Biology, IISER Tirupati' },
  ],
  status: 'Manuscript submitted for publication',
  summary: 'A co-authored review on how cancer cells migrate and invade, and how the choice of experimental model shapes what can be observed. It compares two-dimensional, three-dimensional and whole-animal approaches to studying cell motility. It also considers where zebrafish models fit within that landscape. The manuscript is currently under review.',
  keywords: ['Migration plasticity', 'Danio rerio', 'Glioblastoma', 'Precision oncology'],
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
              <p className="eyebrow">Evidence · contextualised</p><h2>Inspect the trace</h2>
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

// Topics a prospective supervisor can match against — the review's own framing of
// "does this person's work touch mine?". Each maps to a ring in the contact orbit.
const researchInterests = [
  { id: 'migration', title: 'Cell migration & cytoskeletal mechanics', line: 'How a scaffold protein and actin architecture decide where a cell moves — the question behind my MS thesis.' },
  { id: 'invasion', title: 'Cancer invasion & the tumour microenvironment', line: 'How invasive programs and host tissue together shape dissemination and therapy resistance.' },
  { id: 'imaging', title: 'Live imaging & in vivo mechanistic models', line: 'Making mechanism observable — confocal, FRAP and zebrafish xenograft models.' },
]

// Chemoattractant sources, in normalised panel coordinates. Shared by the canvas
// simulation and the HTML labels so the two can never drift apart.
const GRADIENT_SOURCES = [{ x: .24, y: .22 }, { x: .79, y: .44 }, { x: .4, y: .79 }]

// A migrating cell that polarises and crawls toward whichever gradient you select.
// Front-biased protrusion, retracted rear, and a trail that is literally the kind of
// single-cell track the thesis work measures.
function ChemotaxisField({ active, onSelect }) {
  const canvasRef = useRef(null)
  const activeRef = useRef(active)
  activeRef.current = active

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let scale = 0
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(devicePixelRatio, 2)
      width = rect.width
      height = rect.height
      scale = Math.min(width, height)
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const cell = { x: .5, y: .52 }
    let heading = 0
    let speed = 0
    const trail = []
    let frame = 0
    let running = true

    const step = (time) => {
      const t = time / 1000
      const target = GRADIENT_SOURCES[activeRef.current]
      const dx = target.x - cell.x
      const dy = target.y - cell.y
      const distance = Math.hypot(dx, dy)

      // Stop short of the source, as a cell arrests once it reaches peak signal.
      if (distance > .12) {
        const stepSize = Math.min(.0028, distance * .022)
        cell.x += (dx / distance) * stepSize
        cell.y += (dy / distance) * stepSize
        speed += (1 - speed) * .05
      } else {
        speed += (0 - speed) * .06
      }

      const desired = Math.atan2(dy, dx)
      const turn = Math.atan2(Math.sin(desired - heading), Math.cos(desired - heading))
      heading += turn * .07

      if (frame % 3 === 0) {
        trail.push({ x: cell.x, y: cell.y })
        if (trail.length > 150) trail.shift()
      }
      frame++

      ctx.clearRect(0, 0, width, height)

      // Migration track left behind the cell.
      if (trail.length > 1) {
        for (let i = 1; i < trail.length; i++) {
          const fade = (i / trail.length) * .5
          ctx.beginPath()
          ctx.moveTo(trail[i - 1].x * width, trail[i - 1].y * height)
          ctx.lineTo(trail[i].x * width, trail[i].y * height)
          ctx.strokeStyle = `rgba(159,216,199,${fade})`
          ctx.lineWidth = 1.1
          ctx.stroke()
        }
      }

      // Gradient sources: the active one emits expanding signal rings.
      GRADIENT_SOURCES.forEach((source, index) => {
        const sx = source.x * width
        const sy = source.y * height
        const isActive = index === activeRef.current
        if (isActive && !reduceMotion) {
          for (let w = 0; w < 3; w++) {
            const phase = ((t * .38 + w / 3) % 1)
            ctx.beginPath()
            ctx.arc(sx, sy, phase * scale * .3, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(239,141,114,${(1 - phase) * .3})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
        ctx.beginPath()
        ctx.arc(sx, sy, isActive ? 7 : 4.5, 0, Math.PI * 2)
        ctx.fillStyle = isActive ? '#ef8d72' : 'rgba(159,216,199,.4)'
        ctx.fill()
      })

      // Cell body: protrusion at the front, retraction at the rear.
      const cx = cell.x * width
      const cy = cell.y * height
      const r0 = scale * .085
      const stretch = .18 + speed * .3
      const points = 84
      ctx.beginPath()
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2
        const align = Math.cos(angle - heading)
        const front = Math.pow(Math.max(0, align), 2.2) * stretch
        const rear = Math.pow(Math.max(0, -align), 2) * .13
        const ripple = reduceMotion ? 0
          : Math.sin(angle * 3 + t * 1.2) * .05 + Math.sin(angle * 5 - t * .9) * .032 + Math.sin(angle * 7 + t * 1.7) * .018
        const r = r0 * (1 + ripple + front - rear)
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = 'rgba(159,216,199,.09)'
      ctx.fill()
      ctx.strokeStyle = 'rgba(159,216,199,.75)'
      ctx.lineWidth = 1.3
      ctx.stroke()

      // Filopodia probing the gradient.
      if (!reduceMotion) {
        for (let f = -1; f <= 1; f++) {
          const angle = heading + f * .42
          const len = r0 * (1.25 + stretch + Math.sin(t * 2.6 + f) * .16)
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(angle) * r0 * .92, cy + Math.sin(angle) * r0 * .92)
          ctx.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len)
          ctx.strokeStyle = 'rgba(159,216,199,.42)'
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      // Nucleus, trailing toward the rear as the cell polarises.
      ctx.beginPath()
      ctx.ellipse(cx - Math.cos(heading) * r0 * .3, cy - Math.sin(heading) * r0 * .3, r0 * .36, r0 * .3, heading, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(239,141,114,.4)'
      ctx.fill()

      if (running && !reduceMotion) requestAnimationFrame(step)
    }

    requestAnimationFrame(step)

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) { running = true; requestAnimationFrame(step) }
      if (!entry.isIntersecting) running = false
    })
    observer.observe(canvas)
    addEventListener('resize', resize)
    return () => { running = false; observer.disconnect(); removeEventListener('resize', resize) }
  }, [])

  return (
    <div className="contact__field">
      <canvas ref={canvasRef} className="field__canvas" aria-hidden="true" />
      <div className="field__sources" role="tablist" aria-label="Research interests">
        {researchInterests.map((item, index) => (
          <button key={item.id} type="button" role="tab" aria-selected={active === index}
            className={`field__source${active === index ? ' is-active' : ''}`}
            style={{ left: `${GRADIENT_SOURCES[index].x * 100}%`, top: `${GRADIENT_SOURCES[index].y * 100}%` }}
            onMouseEnter={() => onSelect(index)} onFocus={() => onSelect(index)} onClick={() => onSelect(index)}>
            {item.title}
          </button>
        ))}
      </div>
      <div className="field__readout" key={researchInterests[active].id}>
        <span>Gradient 0{active + 1} / 03</span>
        <p>{researchInterests[active].line}</p>
      </div>
      <p className="field__hint">Hover a signal · the cell commits to a direction</p>
    </div>
  )
}

function ContactCard({ onReviewer }) {
  const email = 'harini_20221059@students.iisertirupati.ac.in'
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      // Clipboard API needs a secure context; fall back to a temporary selection.
      const field = document.createElement('textarea')
      field.value = email
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      document.execCommand('copy')
      document.body.removeChild(field)
    }
    setCopied(true)
  }

  useEffect(() => {
    if (!copied) return undefined
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const subject = encodeURIComponent('PhD enquiry — Harini Madheswaran')

  return (
    <div className="contact-card">
      <button className="contact-card__brief" onClick={onReviewer}>
        <span><small>Reviewing my application?</small>Read the 90-second brief</span><Arrow />
      </button>
      <div className="contact-card__email">
        <span>Email · the fastest way to reach me</span>
        <a href={`mailto:${email}?subject=${subject}`}>{email}</a>
        <button type="button" onClick={copyEmail} aria-live="polite">{copied ? 'Copied ✓' : 'Copy'}</button>
      </div>
      <div className="contact-card__links">
        <a href="https://linkedin.com/in/harini3101051926" target="_blank" rel="noreferrer">LinkedIn <Arrow /></a>
        <a href="/documents/Harini_Madheswaran_CV.docx" download>Download my CV <Arrow /></a>
      </div>
      <dl className="contact-card__meta">
        <div><dt>Based in</dt><dd>Tirupati, India · IST (UTC+5:30)</dd></div>
        <div><dt>Phone</dt><dd>+91 94430 82449</dd></div>
        <div><dt>Status</dt><dd>BS–MS at IISER Tirupati, completing 2027</dd></div>
      </dl>
    </div>
  )
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

      {SHOW_PUBLICATION_DETAIL && (
        <>
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
        </>
      )}

      <article className="publication-bar">
        <div className="publication-bar__title">
          <span>{zebrafishPaper.status}</span>
          <h3>{zebrafishPaper.title}</h3>
        </div>
        <div className="publication-bar__side">
          <ul className="publication-card__authors">{zebrafishPaper.authors.map(a => <li key={a.name}><b>{a.name}</b><small>{a.role} · {a.affiliation}</small></li>)}</ul>
          <p className="publication-bar__context">{zebrafishPaper.summary}</p>
        </div>
      </article>
    </section>
  )
}

function App() {
  const [thesisStep, setThesisStep] = useState(0)
  const [filter, setFilter] = useState('All')
  const [openProject, setOpenProject] = useState(null)
  const [reviewerOpen, setReviewerOpen] = useState(false)
  const [introPlaying, setIntroPlaying] = useState(shouldPlayIntro)
  const [heroGo, setHeroGo] = useState(() => !introPlaying)
  const [heroOrigin, setHeroOrigin] = useState(null)
  const [interest, setInterest] = useState(0)
  const progressRail = useRef(null)

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
    // A shared link (e.g. /#projects): the browser tried to jump before React rendered the target, so jump
    // once fonts and layout have settled.
    else if (location.hash) {
      const hash = location.hash
      const jump = () => document.querySelector(hash)?.scrollIntoView({ block: 'start', behavior: 'instant' })
      // Content above the target can still settle after the first jump (profile build, late images), so
      // correct once more shortly after — but only if the reader hasn't scrolled in the meantime.
      Promise.resolve(document.fonts?.ready).then(() => requestAnimationFrame(() => requestAnimationFrame(() => {
        jump()
        const landed = scrollY
        setTimeout(() => { if (Math.abs(scrollY - landed) < 2) jump() }, 700)
      })))
    }

    return () => { history.scrollRestoration = previousRestoration }
  }, [])

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined
    const context = gsap.context(() => {
      gsap.to('.hero__art-base', { scale: 1.17, yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 } })
      gsap.to('.hero__art-focus', { scale: 1.25, xPercent: 2.5, yPercent: -2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.1 } })
      // One entrance pattern site-wide (Premium): rise 24px + fade, scale 98%→100%.
      gsap.utils.toArray('[data-chapter]').forEach((node) => gsap.from(node, { y: 24, opacity: 0, scale: .98, duration: dur.slow, ease: ease.enter, scrollTrigger: { trigger: node, start: 'top 84%' } }))
      gsap.utils.toArray('[data-reveal]').forEach((node) => gsap.fromTo(node, { clipPath: 'inset(0 0 100% 0)', y: 20 }, { clipPath: 'inset(0 0 -12% 0)', y: 0, duration: dur.dramatic, ease: ease.enter, scrollTrigger: { trigger: node, start: 'top 86%' } }))
    }, document.body)
    return () => context.revert()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      // Written straight to the DOM: a React re-render of the whole page on every scroll frame is jank.
      if (progressRail.current) progressRail.current.style.height = `${(max ? scrollY / max : 0) * 100}%`
    }
    onScroll(); addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
  }, [])

  // Decorative CSS animations keep restyling (and repainting) the page every frame even when they are
  // off-screen. Pause each section's animations while it is out of view; resume as it scrolls in.
  useEffect(() => {
    const blocks = document.querySelectorAll('main > section:not(.hero), main > div, footer')
    const io = new IntersectionObserver((entries) => entries.forEach(e => e.target.classList.toggle('is-offscreen', !e.isIntersecting)), { rootMargin: '200px 0px' })
    blocks.forEach(b => io.observe(b))
    return () => io.disconnect()
  }, [])

  return (
    <div className="site-shell">
      {introPlaying && <Intro onHandoff={(origin) => { setHeroOrigin(origin); setHeroGo(true) }} onDone={() => { setHeroGo(true); setIntroPlaying(false) }} />}
      <aside className="signal-nav" aria-label="Story progress"><span ref={progressRail} />{[
        ['Harini', '#chapter-0'], ['Profile', '#about'], ['Journey', '#journey'], ['Evidence', '#projects'], ['Paper', '#publication'], ['Current', '#current-question'], ['Next', '#chapter-5'],
      ].map(([item, href]) => <a key={item} href={href} aria-label={item}><i />{item}</a>)}</aside>

      <main>
        <Hero go={heroGo} origin={heroOrigin} onReviewer={() => setReviewerOpen(true)} />

        <Profile />

        <Journey
          projects={projects}
          onOpenProject={(id) => setOpenProject(projects.find(p => p.id === id))}
          onGo={(href) => document.querySelector(href)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}
        />

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
          <ChemotaxisField active={interest} onSelect={setInterest} />
          <div className="contact__copy">
            <p className="eyebrow">Available for PhD conversations</p>
            <h2 data-reveal>Let’s ask what biology reveals next.</h2>
            <p>I am interested in doctoral research exploring how signalling, cellular architecture and tissue environments are remodelled during cancer progression and other disease states.</p>
            <ContactCard onReviewer={() => setReviewerOpen(true)} />
          </div>
        </section>
      </main>
      <footer><span>Harini Madheswaran · Research Portfolio</span><span>Biology · Chemistry · 2026</span></footer>
      {openProject && <Dossier project={openProject} onClose={() => setOpenProject(null)} />}
      {reviewerOpen && (
        <ReviewerBrief
          onClose={() => setReviewerOpen(false)}
          onOpenProject={(id) => setOpenProject(projects.find(p => p.id === id))}
          onGo={(href) => document.querySelector(href)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}
          projects={projects} thesisSteps={thesisSteps} interests={researchInterests} paper={zebrafishPaper}
        />
      )}
    </div>
  )
}

export default App
