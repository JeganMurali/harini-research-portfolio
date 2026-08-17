import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

const WdrScene = lazy(() => import('./WdrScene'))

const projects = [
  {
    id: 'split-gfp', number: '01', category: 'Wet lab', world: 'Signals',
    title: 'Making molecular proximity visible', short: 'WDR62 · PDPK1–AKT1 · Split-GFP',
    question: 'Can WDR62 bring two signalling proteins close enough to restore a fluorescent signal?',
    why: 'Spatial proximity can reveal how a scaffold coordinates signalling inside a living cell. Split-GFP turns that otherwise invisible relationship into a readable cellular event.',
    approach: ['Designed split-GFP fusion constructs', 'PCR, digestion, ligation and transformation', 'Screened colonies and prepared sequencing samples', 'Transfected HEK293T cells and established fluorescence controls'],
    contribution: 'Harini worked across the complete validation chain—from construct logic to mammalian-cell fluorescence controls.',
    evidence: 'The report documents cloning checks, gel validation and split-GFP fluorescence controls.',
    learning: 'A strong molecular tool needs controls that distinguish real complementation from expression, localisation and background fluorescence.',
    next: 'Use the validated platform to test candidate WDR62-mediated PDPK1–AKT1 proximity under defined cellular conditions.',
    methods: ['Molecular cloning', 'HEK293T culture', 'Split-GFP', 'Fluorescence imaging'],
    image: '/assets/wdr62-split-gfp.jpg', secondary: '/assets/wdr62-gel.jpg', visual: 'split',
    report: '/documents/projects/WDR62-split-GFP-report.docx', reportLabel: 'Download project report',
    status: 'Platform validation',
  },
  {
    id: 'coral', number: '02', category: 'Wet lab', world: 'Survival',
    title: 'Finding defence in a coral microbiome', short: 'CSIR-NIO · Marine microbiology · 2025',
    question: 'Can coral-associated bacteria produce metabolites that suppress clinically and ecologically relevant pathogens?',
    why: 'Coral microbial communities are chemical ecosystems. Their defensive metabolites may reveal new antimicrobial activity and ecological relationships.',
    approach: ['Cultured seven coral-associated bacterial strains', 'Extracted metabolites with ethyl acetate', 'Screened against V. harveyi, V. cholerae and MRSA', 'Compared culture conditions shaping antimicrobial activity'],
    contribution: 'Harini handled culture, extraction, disc diffusion, optimisation, TLC preparation and experimental documentation.',
    evidence: 'Assay plates and condition-comparison plots record strain-specific inhibition and optimisation results.',
    learning: 'Bioactivity is conditional: medium, temperature and extraction choices can change the biological story.',
    next: 'Fractionate active extracts, repeat quantitative testing and connect active fractions to chemical identity.',
    methods: ['Aseptic culture', 'Solvent extraction', 'Disc diffusion', 'TLC'],
    image: '/assets/coral-assay-plates.jpg', secondary: '/assets/coral-temperature-chart.jpg', visual: 'coral',
    report: '/documents/projects/coral-microbiome-report.docx', reportLabel: 'Download internship report',
    status: 'Research internship',
  },
  {
    id: 'tmem135', number: '03', category: 'Computational', world: 'Structures',
    title: 'Reading one membrane protein across species', short: 'TMEM135 · Evolution · Organelle dynamics',
    question: 'Which parts of TMEM135 remain conserved when evolution changes the organism around it?',
    why: 'Conserved sequence, topology and structure can expose regions most likely to carry essential biological function.',
    approach: ['Retrieved orthologous sequences across five model organisms', 'Built alignments and phylogenetic comparisons', 'Examined codon-level selection and conserved domains', 'Compared topology predictions and homology models'],
    contribution: 'Harini connected sequence, evolutionary constraint, membrane topology and predicted structure into one comparative analysis.',
    evidence: 'The project report contains predicted structures, topology plots, alignments and evolutionary analyses.',
    learning: 'No single prediction is decisive; confidence emerges when independent computational views agree.',
    next: 'Prioritise conserved residues for targeted mutagenesis or functional validation in a cellular model.',
    methods: ['MAFFT', 'MEGA11', 'Datamonkey', 'TOPCONS', 'SWISS-MODEL'],
    image: '/assets/tmem135-structure.jpg', secondary: '/assets/tmem135-topology.jpg', visual: 'protein',
    report: '/documents/projects/TMEM135-report.docx', reportLabel: 'Download project report',
    status: 'Computational project',
  },
  {
    id: 'bacterial-signals', number: '04', category: 'Literature', world: 'Signals',
    title: 'How bacteria pass a message on', short: 'Bacterial signalling · Comparative review',
    question: 'How do different bacterial systems convert an external cue into an organised response?',
    why: 'Comparing signalling architectures reveals recurring control principles and pathogen-specific vulnerabilities.',
    approach: ['Synthesised primary literature', 'Compared pathway architectures', 'Mapped second-messenger logic', 'Developed mechanistic hypotheses'],
    contribution: 'Harini translated a dispersed literature into a structured comparison of bacterial signalling strategies.',
    evidence: 'The output is a literature-led mechanistic synthesis rather than an experimental study.',
    learning: 'Comparative reading is most useful when it produces testable contrasts, not only a catalogue of pathways.',
    next: 'Convert one architecture-level contrast into an experimentally testable signalling question.',
    methods: ['Literature synthesis', 'Pathway comparison', 'Scientific writing'], visual: 'signals',
    status: 'Winter literature project',
  },
  {
    id: 'biocon', number: '05', category: 'Industry', world: 'Scale',
    title: 'Learning the discipline of scale', short: 'Biocon · API R&D · Bengaluru',
    question: 'What changes when experimental chemistry must become traceable, reproducible and safe at industrial scale?',
    why: 'Industrial R&D connects analytical technique with documentation, process discipline, safety and quality systems.',
    approach: ['Observed API R&D workflows', 'Trained in analytical and purification techniques', 'Worked within SOP-led documentation', 'Learned safety and quality expectations'],
    contribution: 'An eight-week immersion in TLC, preparative HPLC, rotary evaporation, vacuum drying and Karl Fischer analysis.',
    evidence: 'The training report records techniques, process context and regulated laboratory practices.',
    learning: 'Reproducibility is a system of decisions—documentation and process control matter as much as technique.',
    next: 'Carry industrial standards of traceability and reproducibility into future experimental research.',
    methods: ['TLC', 'Preparative HPLC', 'Karl Fischer', 'SOP systems'], visual: 'chromatogram',
    report: '/documents/projects/Biocon-training-report.docx', reportLabel: 'Download training report',
    status: 'Industrial training',
  },
  {
    id: 'neuronexus', number: '06', category: 'Presentation', world: 'Concept',
    title: 'A speculative route into glioblastoma', short: 'NeuroNexus · Team presentation',
    question: 'Could an engineered viral delivery concept connect tumour tropism with targeted protein degradation?',
    why: 'The presentation explored how ideas from virology, RNA delivery and PROTAC biology might be assembled into a therapeutic concept.',
    approach: ['Team ideation', 'Literature synthesis', 'Mechanism mapping', 'Scientific presentation'],
    contribution: 'Harini contributed to collaborative concept development and mechanism-focused communication.',
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

function Arrow({ down = false }) {
  return <span aria-hidden="true">{down ? '↓' : '↗'}</span>
}

function CellField() {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let frame
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
      frame = requestAnimationFrame(draw)
    }
    resize(); draw(); addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); removeEventListener('resize', resize) }
  }, [])
  return <canvas className="cell-field" ref={ref} aria-hidden="true" />
}

function MiniVisual({ type }) {
  if (type === 'split') return <div className="mini split-mini"><i /><i /><b /></div>
  if (type === 'coral') return <div className="mini coral-mini">{[1,2,3,4,5,6,7].map(i => <i key={i} />)}<b /></div>
  if (type === 'protein') return <div className="mini protein-mini">{[1,2,3,4,5,6].map(i => <i key={i} />)}</div>
  if (type === 'signals') return <div className="mini signal-mini">{[1,2,3,4].map(i => <i key={i} />)}<b /></div>
  if (type === 'chromatogram') return <svg className="mini chart-mini" viewBox="0 0 220 100"><path d="M0 88H48C57 88 59 17 67 17s7 71 17 71h45c9 0 11-43 19-43s8 43 18 43h54" /></svg>
  return <div className="mini concept-mini"><i /><i /><i /><b /></div>
}

function ProjectVisual({ project, large = false }) {
  return (
    <div className={`interactive-visual interactive-visual--${project.visual} ${large ? 'is-large' : ''}`} data-cursor="interact">
      <MiniVisual type={project.visual} />
      <div className="visual-grid" />
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
      <img src={image} alt={`Source evidence for ${project.title}`} />
      {project.secondary && <img className="evidence-viewer__secondary" src={project.secondary} alt="Supporting source figure" />}
      <span className="evidence-viewer__hint">Move to inspect · source figure</span>
    </div>
  )
}

function Dossier({ project, onClose }) {
  const [chapter, setChapter] = useState('story')
  useEffect(() => {
    setChapter('story')
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const close = (event) => event.key === 'Escape' && onClose()
    addEventListener('keydown', close)
    return () => { document.body.style.overflow = previous; removeEventListener('keydown', close) }
  }, [project, onClose])
  const chapters = ['story', 'method', 'evidence', 'next']
  return (
    <div className="dossier-backdrop" role="presentation" onMouseDown={onClose}>
      <article className="dossier" role="dialog" aria-modal="true" aria-label={`${project.title} research dossier`} onMouseDown={(e) => e.stopPropagation()}>
        <header className="dossier__header">
          <div><span>{project.number}</span><p>Research dossier</p></div>
          <nav aria-label="Dossier chapters">
            {chapters.map((item, index) => <button key={item} onClick={() => setChapter(item)} className={chapter === item ? 'is-active' : ''}><small>0{index + 1}</small>{item}</button>)}
          </nav>
          <button className="dossier__close" onClick={onClose} aria-label="Close research dossier">Close <b>×</b></button>
        </header>
        <div className="dossier__body">
          <div className="dossier__visual"><ProjectVisual project={project} large /><span className="dossier__status">{project.status}</span></div>
          <div className="dossier__panel" key={chapter}>
            {chapter === 'story' && <>
              <p className="eyebrow">{project.short}</p><h2>{project.title}</h2>
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
  return (
    <div className="reviewer-backdrop" onMouseDown={onClose}>
      <article className="reviewer" role="dialog" aria-modal="true" aria-label="PhD reviewer quick view" onMouseDown={(e) => e.stopPropagation()}>
        <button onClick={onClose} aria-label="Close reviewer mode">×</button>
        <p className="eyebrow">90-second view</p><h2>PhD reviewer mode</h2>
        <div className="reviewer__grid">
          <section><span>Current thesis</span><h3>Mechanistic dissection of WDR62</h3><p>Non-mitotic roles in actin architecture and protrusion dynamics.</p></section>
          <section><span>Research range</span><h3>Wet lab · computation · microbiology</h3><p>Questions followed across molecular, cellular and microbial scales.</p></section>
          <section><span>Core methods</span><h3>Build · perturb · image · compare</h3><p>Cloning, mammalian cells, confocal/FRAP, microbial screening and bioinformatics.</p></section>
          <section><span>PhD direction</span><h3>Cell biology and disease mechanisms</h3><p>Seeking mechanistic questions with translational relevance.</p></section>
        </div>
        <div className="reviewer__actions"><a href="/documents/Harini_Madheswaran_CV.docx" download>Download CV <Arrow /></a><a href="mailto:harini_20221059@students.iisertirupati.ac.in">Email Harini <Arrow /></a></div>
      </article>
    </div>
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
  const audio = useRef(null)
  const hero = useRef(null)

  const visibleProjects = useMemo(() => projects.filter(p => filter === 'All' || p.category === filter), [filter])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return undefined
    const context = gsap.context(() => {
      gsap.to('.hero__art-base', { scale: 1.17, yPercent: 4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 } })
      gsap.to('.hero__art-focus', { scale: 1.25, xPercent: 2.5, yPercent: -2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.1 } })
      gsap.fromTo('.worlds__image', { scale: 1.14 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.research-worlds', start: 'top bottom', end: 'bottom top', scrub: 1 } })
      gsap.utils.toArray('[data-chapter]').forEach((node) => gsap.from(node, { y: 70, opacity: 0, duration: 1, scrollTrigger: { trigger: node, start: 'top 82%' } }))
    }, document.body)
    return () => context.revert()
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight
      setProgress(max ? scrollY / max : 0)
    }
    onScroll(); addEventListener('scroll', onScroll, { passive: true })
    return () => removeEventListener('scroll', onScroll)
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
        ['Harini', '#chapter-0'], ['Profile', '#about'], ['Question', '#chapter-2'], ['Research', '#chapter-3'], ['Journey', '#trajectory'], ['Next', '#chapter-5'],
      ].map(([item, href]) => <a key={item} href={href} aria-label={item}><i />{item}</a>)}</aside>

      <header className="site-header">
        <a className="brand" href="#chapter-0"><span className="brand__mark">HM</span><span className="brand__copy"><b>Harini Madheswaran</b><small>Research portfolio · IISER Tirupati</small></span></a>
        <nav className={menuOpen ? 'site-nav is-open' : 'site-nav'}>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a><a href="#projects" onClick={() => setMenuOpen(false)}>Research</a><a href="#methods" onClick={() => setMenuOpen(false)}>Methods</a><a href="#trajectory" onClick={() => setMenuOpen(false)}>Journey</a><a href="/documents/Harini_Madheswaran_CV.docx" download>CV</a>
          <button className="reviewer-trigger" onClick={() => setReviewerOpen(true)}><span>For PhD reviewers</span><Arrow /></button>
          <button className="sound-trigger" onClick={toggleAudio} aria-pressed={audioOn} aria-label={`Ambient audio ${audioOn ? 'on' : 'off'}`} title="Toggle ambient audio"><i /> <span>Sound {audioOn ? 'on' : 'off'}</span></button>
        </nav>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><span /><span /></button>
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
            <div className="hero__actions"><a href="#about" className="button button--light">Meet the researcher <Arrow down /></a><a href="#projects" className="button button--ghost">Explore research <Arrow /></a></div>
          </div>
          <div className="hero__readout"><span>IISER Tirupati · Cell biology</span><span>Wet lab · Computation · Scientific synthesis</span><button onClick={() => setReviewerOpen(true)}>90-second reviewer view <Arrow /></button></div>
          <div className="hero__mitochondria"><span>ATP</span><i /><i /><i /></div>
        </section>

        <section className="researcher-profile section-pad" id="about" data-chapter>
          <div className="profile-intro">
            <div className="chapter-label"><span>Researcher profile</span><b>01</b></div>
            <div>
              <p className="eyebrow">Who I am · What I bring</p>
              <h2>I move between biological scales, while keeping the question <em>experimentally grounded.</em></h2>
              <p className="profile-lead">I am a BS–MS student at IISER Tirupati, majoring in Biology with a Chemistry minor. My work spans mammalian cells, molecular signalling, microbial systems and computational biology. Across each setting, I look for the experiment that can turn an observation into a mechanism.</p>
            </div>
          </div>
          <div className="profile-facts" aria-label="Researcher summary">
            <article><span>Current focus</span><strong>WDR62, actin architecture and cell movement</strong></article>
            <article><span>Research range</span><strong>Cellular · molecular · microbial · computational</strong></article>
            <article><span>PhD direction</span><strong>Mechanistic cell biology and disease</strong></article>
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

        <section className="prologue section-pad" id="chapter-2" data-chapter>
          <div className="chapter-label"><span>Prologue</span><b>02</b></div>
          <div><p className="eyebrow">The first question</p><h2>What tells a cell <em>where to move?</em></h2><p className="lead">A migrating cell must turn chemical information into physical direction. Harini’s current thesis enters that decision at the leading edge—where actin reorganises, proteins exchange and a scaffold known for mitosis may have another role.</p></div>
          <div className="prologue__pulse"><i /><span>signal</span><b>response</b></div>
        </section>

        <section className="thesis" id="thesis">
          <div className="thesis__scene" data-cursor="drag 3D model">
            <Suspense fallback={<div className="scene-loading"><i /><span>Resolving cell architecture</span></div>}><WdrScene step={thesisStep} /></Suspense>
            <div className="scene-hud scene-hud--top"><span>Live conceptual model</span><b>WDR62 / leading edge</b></div>
            <div className="scene-hud scene-hud--bottom"><span>{thesisSteps[thesisStep].cue}</span><b>Drag to rotate</b></div>
          </div>
          <div className="thesis__story">
            <div className="chapter-label"><span>Signature investigation</span><b>03</b></div>
            <p className="eyebrow">Mechanistic dissection of WDR62 · ongoing MS thesis</p>
            <h2>Can a mitotic scaffold also shape <em>how a cell moves?</em></h2>
            <p>WDR62 is classically linked to spindle organisation and primary microcephaly. This thesis tests a less explored, non-mitotic role in actin architecture and protrusion dynamics in U251 and HeLa cells.</p>
            <div className="thesis-controls" role="tablist" aria-label="Thesis experimental logic">
              {thesisSteps.map((step, index) => <button key={step.title} onClick={() => setThesisStep(index)} className={thesisStep === index ? 'is-active' : ''} role="tab" aria-selected={thesisStep === index}><span>0{index + 1}</span><strong>{step.title}</strong><small>{step.verb}</small></button>)}
            </div>
            <div className="thesis-readout" key={thesisStep}><span>0{thesisStep + 1} / 04</span><p>{thesisSteps[thesisStep].copy}</p></div>
            <div className="supervisor"><span>Supervisor</span>Dr. Pavithra Lakshminarasimhan Chavali · IISER Tirupati</div>
          </div>
        </section>

        <section className="research-worlds" id="chapter-3">
          <div className="worlds__sticky"><img className="worlds__image" src="/assets/research-worlds-v2.png" alt="Decorative scientific panorama connecting molecular signalling, membrane-protein structure and coral microbial survival" /><div className="worlds__shade" /></div>
          <div className="worlds__intro"><p className="eyebrow">One researcher · three biological scales</p><h2>A question changes shape as you move through the system.</h2></div>
          <div className="world-chapters">
            <article data-chapter><span>Chapter I · Signals</span><h3>Make proximity visible.</h3><p>Follow molecular relationships inside mammalian cells.</p></article>
            <article data-chapter><span>Chapter II · Structures</span><h3>Read conservation in form.</h3><p>Move from sequence to topology and predicted structure.</p></article>
            <article data-chapter><span>Chapter III · Survival</span><h3>Find defence in a community.</h3><p>Screen coral-associated microbes for conditional activity.</p></article>
          </div>
        </section>

        <section className="projects section-pad" id="projects">
          <div className="projects__heading" data-chapter><div className="chapter-label"><span>Interactive research archive</span><b>04</b></div><div><p className="eyebrow">Six research encounters</p><h2>Open a question. <em>Enter its evidence.</em></h2></div><p>Each dossier fits the project into four navigable chapters. Select a project—its story opens immediately in place.</p></div>
          <div className="project-filters">{filters.map(item => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'is-active' : ''}>{item}</button>)}</div>
          <div className="project-constellation">
            <svg className="constellation-lines" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><path d="M160 150C330 40 410 225 505 290S715 520 865 420"/><path d="M140 455C285 555 370 350 505 290S730 55 860 155"/></svg>
            {visibleProjects.map((project) => <button className={`project-node project-node--${project.number}`} key={project.id} onClick={() => setOpenProject(project)} data-cursor="open dossier"><ProjectVisual project={project} /><div className="project-node__copy"><span>{project.number} · {project.category}</span><h3>{project.title}</h3><p>{project.question}</p><b>Open dossier <Arrow /></b></div></button>)}
          </div>
        </section>

        <section className="trajectory section-pad" id="trajectory" data-chapter>
          <div className="trajectory__heading"><div className="chapter-label"><span>Living trajectory</span><b>05</b></div><div><p className="eyebrow">A path across disciplines</p><h2>Each experience changed the next question.</h2></div></div>
          <div className="living-line"><svg viewBox="0 0 1200 360" preserveAspectRatio="none" aria-hidden="true"><path d="M20 310C160 315 168 205 320 220S480 315 610 190 800 62 945 145 1080 120 1180 40"/></svg>{[
            ['Foundation', 'IISER Tirupati', 'BS–MS training · Biology major, Chemistry minor'], ['Industry', 'Biocon, Bengaluru', 'API R&D · analytical workflows · reproducibility'], ['Research', 'CSIR-NIO, Goa', 'Marine microbiology · antimicrobial screening'], ['Now', 'WDR62 thesis · IISER Tirupati', 'Actin architecture and cell movement'], ['Next', 'PhD research', 'Cell biology, disease mechanisms and translation'],
          ].map(([year, place, copy], i) => <article key={place} style={{ '--i': i }}><i /><span>{year}</span><h3>{place}</h3><p>{copy}</p></article>)}</div>
        </section>

        <section className="contact" id="chapter-5">
          <div className="contact__field"><span>?</span><div className="contact__rings"><i /><i /><i /></div><p>The next question is still open.</p></div>
          <div className="contact__copy"><p className="eyebrow">Available for PhD conversations</p><h2>Let’s follow what the cell reveals next.</h2><p>Harini is interested in doctoral research at the intersection of cell biology, disease mechanisms and translational science.</p><div className="contact__links"><a href="mailto:harini_20221059@students.iisertirupati.ac.in">Email Harini <Arrow /></a><a href="https://linkedin.com/in/harini3101051926" target="_blank" rel="noreferrer">LinkedIn <Arrow /></a><a href="/documents/Harini_Madheswaran_CV.docx" download>Download CV <Arrow /></a></div><div className="contact__details"><span>+91 94430 82449</span><span>Tirupati, Andhra Pradesh, India</span></div></div>
        </section>
      </main>
      <footer><span>Harini Madheswaran · Research Portfolio</span><span>Biology · Chemistry · 2026</span></footer>
      {openProject && <Dossier project={openProject} onClose={() => setOpenProject(null)} />}
      {reviewerOpen && <ReviewerMode onClose={() => setReviewerOpen(false)} />}
    </div>
  )
}

export default App
