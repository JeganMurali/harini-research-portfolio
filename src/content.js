// Shared content: used by the profile (four cells) and the reviewer brief, so they can never disagree.
export const capabilities = [
  {
    id: 'cell', number: '01', title: 'Cell biology & imaging', scale: 'Cellular',
    statement: 'I study cellular organisation as a dynamic process—not only as a fixed image.',
    detail: 'Mammalian cell culture, confocal microscopy, phalloidin staining and FRAP support questions about localisation, actin architecture and molecular turnover.',
    evidence: 'WDR62 MS thesis · U251 and HeLa cells',
    methods: ['Mammalian cell culture', 'Confocal microscopy', 'FRAP', 'Perturbation'],
  },
  {
    id: 'molecular', number: '02', title: 'Molecular experimentation', scale: 'Molecular',
    statement: 'I build experimental systems that make otherwise invisible molecular relationships measurable.',
    detail: 'Construct design, cloning and validation connect molecular logic to a testable cellular readout.',
    evidence: 'Semester project · molecular cloning',
    methods: ['PCR', 'Cloning', 'Transfection', 'Fluorescence controls'],
  },
  {
    id: 'microbial', number: '03', title: 'Microbiology & chemistry', scale: 'Microbial',
    statement: 'I follow biological activity from a microbial community into an experimental assay.',
    detail: 'Culture, extraction, antimicrobial screening and chromatographic preparation reveal how conditions alter biological activity.',
    evidence: 'CSIR-NIO coral microbiome · Biocon API R&D',
    methods: ['Aseptic culture', 'Extraction', 'Disc diffusion', 'TLC / HPLC'],
  },
  {
    id: 'computational', number: '04', title: 'Computational reasoning', scale: 'Computational',
    statement: 'I use sequence, topology and structure as converging lines of evidence.',
    detail: 'Comparative analysis connects evolutionary conservation with predicted molecular form and experimentally useful hypotheses.',
    evidence: 'TMEM135 comparative biology project',
    methods: ['Alignment', 'Phylogeny', 'Topology', 'Structure prediction'],
  },
]
