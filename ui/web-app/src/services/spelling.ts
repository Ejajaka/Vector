import { COMMON_WORDS } from './commonWords.ts';

const CORRECTIONS: Record<string, string> = {
  teh: 'the',
  recieve: 'receive',
  recieved: 'received',
  recieving: 'receiving',
  seperate: 'separate',
  seperately: 'separately',
  definately: 'definitely',
  occured: 'occurred',
  occuring: 'occurring',
  adress: 'address',
  accomodate: 'accommodate',
  acheive: 'achieve',
  arguement: 'argument',
  begining: 'beginning',
  beleive: 'believe',
  buisness: 'business',
  calender: 'calendar',
  catagory: 'category',
  collegue: 'colleague',
  comming: 'coming',
  commitee: 'committee',
  concious: 'conscious',
  dependancy: 'dependency',
  dependancies: 'dependencies',
  enviroment: 'environment',
  existance: 'existence',
  experiance: 'experience',
  familar: 'familiar',
  finaly: 'finally',
  foriegn: 'foreign',
  goverment: 'government',
  happend: 'happened',
  immediatly: 'immediately',
  independant: 'independent',
  intrest: 'interest',
  langauge: 'language',
  maintainance: 'maintenance',
  managment: 'management',
  neccessary: 'necessary',
  noticable: 'noticeable',
  occassion: 'occasion',
  offical: 'official',
  personel: 'personnel',
  posession: 'possession',
  posible: 'possible',
  prefered: 'preferred',
  priviledge: 'privilege',
  publically: 'publicly',
  recomend: 'recommend',
  recomendation: 'recommendation',
  refered: 'referred',
  relevent: 'relevant',
  responsability: 'responsibility',
  succesful: 'successful',
  sucess: 'success',
  supercede: 'supersede',
  tendancy: 'tendency',
  thier: 'their',
  truely: 'truly',
  untill: 'until',
  wierd: 'weird',
  wich: 'which',
  writting: 'writing',
  alot: 'a lot',
  aquire: 'acquire',
  basicly: 'basically',
  comparision: 'comparison',
  completly: 'completely',
  consitent: 'consistent',
  criterias: 'criteria',
  desciption: 'description',
  diferent: 'different',
  discription: 'description',
  efficent: 'efficient',
  embaress: 'embarrass',
  exmaple: 'example',
  exsisting: 'existing',
  febuary: 'february',
  garantee: 'guarantee',
  harrass: 'harass',
  ignorence: 'ignorance',
  knowlege: 'knowledge',
  liason: 'liaison',
  millenium: 'millennium',
  mispell: 'misspell',
  occurance: 'occurrence',
  paralel: 'parallel',
  perseverence: 'perseverance',
  persistant: 'persistent',
  questionaire: 'questionnaire',
  referance: 'reference',
  rythm: 'rhythm',
  similiar: 'similar',
  speach: 'speech',
  succesfully: 'successfully',
  tommorow: 'tomorrow',
  useable: 'usable',
  vaccum: 'vacuum',
  withholded: 'withheld',
  btn: 'button',
  buton: 'button',
  buttton: 'button',
  labl: 'label',
  lable: 'label',
  lables: 'labels',
  labes: 'labels',
  hieght: 'height',
  heigth: 'height',
  widht: 'width',
  heder: 'header',
  headr: 'header',
  footr: 'footer',
  navigaton: 'navigation',
  navigtion: 'navigation',
  notifcation: 'notification',
  notificaton: 'notification',
  validaton: 'validation',
  autentication: 'authentication',
  permision: 'permission',
  permisions: 'permissions',
  acess: 'access',
  acces: 'access',
  acessible: 'accessible',
  avalable: 'available',
  availble: 'available',
  seach: 'search',
  serach: 'search',
  serch: 'search',
  filtter: 'filter',
  flter: 'filter',
  sortng: 'sorting',
  paginaton: 'pagination',
  paginatton: 'pagination',
  reponsive: 'responsive',
  responsiv: 'responsive',
  moble: 'mobile',
  desktp: 'desktop',
  setings: 'settings',
  settngs: 'settings',
  profil: 'profile',
  usrname: 'username',
  pasword: 'password',
  paswword: 'password',
  emial: 'email',
  adres: 'address',
  submitt: 'submit',
  submmit: 'submit',
  cancle: 'cancel',
  canell: 'cancel',
  confrm: 'confirm',
  confrim: 'confirm',
  delte: 'delete',
  delet: 'delete',
  edt: 'edit',
  updte: 'update',
  upate: 'update',
  crete: 'create',
  craete: 'create',
  chooes: 'choose',
  choos: 'choose',
  selec: 'select',
  selct: 'select',
  clik: 'click',
  clcik: 'click',
  opne: 'open',
  opn: 'open',
  clsoe: 'close',
  sav: 'save',
  lod: 'load',
  loaad: 'load',
  uplod: 'upload',
  uplaod: 'upload',
  downlod: 'download',
  dowload: 'download',
  manag: 'manage',
  maneger: 'manager',
  dashbord: 'dashboard',
  dashbaord: 'dashboard',
  widgte: 'widget',
  widgt: 'widget',
  modle: 'model',
  modul: 'module',
  compnent: 'component',
  componant: 'component',
  componets: 'components',
  requirment: 'requirement',
  requirments: 'requirements',
  specifcation: 'specification',
  accptance: 'acceptance',
  acceptence: 'acceptance',
  criterai: 'criteria',
  ambigous: 'ambiguous',
  ambiguty: 'ambiguity',
  ambiguties: 'ambiguities',
  dependncy: 'dependency',
  dependecies: 'dependencies',
  priorty: 'priority',
  priorties: 'priorities',
  priortize: 'prioritize',
  prioratize: 'prioritize',
  verion: 'version',
  versoin: 'version',
  histroy: 'history',
  histry: 'history',
  analize: 'analyze',
  anaylsis: 'analysis',
  analysis: 'analysis',
  sumary: 'summary',
  descrption: 'description',
  descripion: 'description',
  decription: 'description',
  messsage: 'message',
  mesage: 'message',
  erorr: 'error',
  eror: 'error',
  succes: 'success',
  warining: 'warning',
  warnng: 'warning',
  statment: 'statement',
  statemen: 'statement',
  promt: 'prompt',
  pronpt: 'prompt',
  templete: 'template',
  tempalte: 'template',
  wizrd: 'wizard',
  stepper: 'stepper',
  breadcrumb: 'breadcrumb',
  breadcrums: 'breadcrumbs',
  dropdowm: 'dropdown',
  dropdwon: 'dropdown',
  dropdown: 'dropdown',
  chekbox: 'checkbox',
  checkboks: 'checkbox',
  radoi: 'radio',
  tootlip: 'tooltip',
  tooltpi: 'tooltip',
  sidebaar: 'sidebar',
  sidebr: 'sidebar',
  navbr: 'navbar',
  navba: 'navbar',
  togle: 'toggle',
  toggel: 'toggle',
  sliedr: 'slider',
  slieder: 'slider',
  acordion: 'accordion',
  carosel: 'carousel',
  carousal: 'carousel',
  popver: 'popover',
  popoever: 'popover',
  avatr: 'avatar',
  avatarr: 'avatar',
  badje: 'badge',
  bagde: 'badge',
  taost: 'toast',
  toasst: 'toast',
  placholder: 'placeholder',
  placehoder: 'placeholder',
  placehodler: 'placeholder',
  onbaording: 'onboarding',
  onbording: 'onboarding',
  bretadcrumb: 'breadcrumb',
  wirframe: 'wireframe',
  wrieframe: 'wireframe',
  mockp: 'mockup',
  persoa: 'persona',
  persoan: 'persona',
  scenerio: 'scenario',
  sceanrio: 'scenario',
  worklfow: 'workflow',
  workflw: 'workflow',
  integraton: 'integration',
  integratin: 'integration',
  configuraton: 'configuration',
  environmnet: 'environment',
  enviornment: 'environment',
  dimention: 'dimension',
  dimentions: 'dimensions',
  resoluton: 'resolution',
  breakpiont: 'breakpoint',
  breakpionts: 'breakpoints',
  typograpy: 'typography',
  typograhpy: 'typography',
  color: 'color',

};

const BRITISH_ALLOWED = new Set([
  'colour',
  'colours',
  'coloured',
  'behaviour',
  'behaviours',
  'centre',
  'centres',
  'licence',
  'licences',
  'programme',
  'programmes',
  'organise',
  'organised',
  'organising',
  'organisation',
  'organisations',
  'prioritise',
  'prioritised',
  'prioritising',
  'customise',
  'customised',
  'customising',
  'favourite',
  'favourites',
  'grey',
  'travelling',
  'travelled',
  'cancelled',
  'labelled',
  'modelling',
  'analysing',
  'analysed',
  'analyse',
  'optimise',
  'optimised',
  'recognise',
  'recognised',
  'summarise',
  'summarised',
  'authorise',
  'authorised',
  'personalise',
  'personalised',
  'visualise',
  'visualised',
  'minimise',
  'minimised',
  'maximise',
  'maximised',
  'utilise',
  'utilised',
]);

/**
 * Product and interface vocabulary that is valid in this app even though it is
 * missing from the general-purpose word list.
 */
const UI_TERMS = new Set([
  'navbar',
  'dropdown',
  'checkbox',
  'checkboxes',
  'radio',
  'radios',
  'tooltip',
  'tooltips',
  'sidebar',
  'signup',
  'signin',
  'signout',
  'login',
  'logout',
  'username',
  'password',
  'workflow',
  'workflows',
  'dashboard',
  'dashboards',
  'placeholder',
  'onboarding',
  'pagination',
  'breadcrumb',
  'breadcrumbs',
  'carousel',
  'accordion',
  'popover',
  'toast',
  'toasts',
  'avatar',
  'badge',
  'badges',
  'toggle',
  'toggles',
  'slider',
  'textarea',
  'viewports',
  'viewport',
  'wireframe',
  'wireframes',
  'mockup',
  'mockups',
  'backlog',
  'sprints',
  'roadmap',
  'analytics',
  'metrics',
  'kpi',
  'kpis',
  'personas',
  'persona',
  'stakeholders',
  'stakeholder',
  'microcopy',
  'empty',
  'cta',
  'ctas',
  'ui',
  'ux',
  'api',
  'apis',
  'sdk',
  'json',
  'csv',
  'pdf',
  'url',
  'urls',
  'uri',
  'html',
  'css',
  'svg',
  'png',
  'jpg',
  'jpeg',
  'webhook',
  'webhooks',
  'webcam',
  'dropdowns',
  'tabs',
  'tabbed',
  'multiselect',
  'autocomplete',
  'autofill',
  'autosave',
  'realtime',
  'localhost',
  'frontend',
  'backend',
  'fullstack',
  'devops',
  'qa',
  'repo',
  'repos',
  'config',
  'configs',
  'env',
  'auth',
  'oauth',
  'jwt',
  'supabase',
  'vercel',
  'github',
  'base44',
  'bert',
  'onnx',
  'llm',
  'llms',
  'embeddings',
  'tokenizer',
  'tokenizers',
  'prompts',
  'prompting',
  'workspace',
  'workspaces',
  'dataset',
  'datasets',
  'runtime',
  'runtimes',
  'browser',
  'browsers',
  'desktop',
  'mobile',
  'tablet',
  'responsive',
  'clickable',
  'hover',
  'hovers',
  'modal',
  'modals',
  'overlay',
  'overlays',
  'widget',
  'widgets',
  'timeline',
  'kanban',
  'chips',
  'stepper',
  'nav',
  'navs',
  'footer',
  'header',
  'hero',
  'eyebrow',
  'grid',
  'grids',
  'layout',
  'layouts',
  'spacing',
  'padding',
  'margin',
  'typography',
  'font',
  'fonts',
  'icon',
  'icons',
  'logo',
  'logos',
  'palette',
  'palettes',
  'preset',
  'presets',
  'theme',
  'themes',
  'token',
  'tokens',
  'breakpoint',
  'breakpoints',
  'card',
  'cards',
  'panel',
  'panels',
  'listing',
  'filterable',
  'sortable',
  'scrollable',
  'collapsible',
  'expandable',
  'editable',
  'draggable',
  'resizable',
  'searchable',
  'shareable',
  'exportable',
  'readable',
  'actionable',
  'unusable',
  'readonly',
  'checkbox',
  'dropdown',
  'radiogroup',
  'stepper',
  'timeline',
  'signup',
  'signin',
  'signout',
  'walkthrough',
  'toolbar',
  'sidepanel',
  'breadcrumbs',
  'submenu',
  'submenus',
  'megamenu',
  'lightbox',
  'datagrid',
  'datepicker',
  'timepicker',
  'filepicker',
  'colorpicker',
  'searchbar',
  'statusbar',
  'progressbar',
  'scrollbar',
  'sidebar',
]);

export interface SpellingIssue {
  from: string;
  to: string;
  index: number;
  /** Curated typo or a high-confidence guess from the common-word list. */
  source?: 'dictionary' | 'guess' | 'repeated';
}

const WORD_SET = new Set(COMMON_WORDS);
const EDGE_INDEX = (() => {
  const index = new Map<string, string[]>();
  for (const word of COMMON_WORDS) {
    if (word.length < 3) continue;
    const key = `${word[0]}${word[word.length - 1]}`;
    const bucket = index.get(key);
    if (bucket) bucket.push(word);
    else index.set(key, [word]);
  }
  return index;
})();

const cache = new Map<string, SpellingIssue[]>();

function preservesCase(source: string, replacement: string): string {
  if (source === source.toUpperCase() && source.length > 1) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return false;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  while (i < Math.min(la, lb) && a[i] === b[i]) i += 1;
  if (la === lb) {
    let j = i + 1;
    while (j < la && a[j] === b[j]) j += 1;
    if (j === la) return true;
    return (
      i + 1 < la &&
      a[i] === b[i + 1] &&
      a[i + 1] === b[i] &&
      a.slice(i + 2) === b.slice(i + 2)
    );
  }
  if (la > lb) return a.slice(i + 1) === b.slice(i);
  return a.slice(i) === b.slice(i + 1);
}

function guessCorrection(word: string): string | null {
  const lower = word.toLowerCase();
  if (lower.length < 4) return null;
  if (WORD_SET.has(lower) || UI_TERMS.has(lower) || BRITISH_ALLOWED.has(lower)) return null;
  const bucket = EDGE_INDEX.get(`${lower[0]}${lower[lower.length - 1]}`);
  if (!bucket) return null;
  let match: string | null = null;
  for (const candidate of bucket) {
    if (Math.abs(candidate.length - lower.length) > 1) continue;
    if (!withinOneEdit(lower, candidate)) continue;
    if (match && match !== candidate) return null; // ambiguous, stay quiet
    match = candidate;
  }
  return match ? preservesCase(word, match) : null;
}

function overlaps(issues: SpellingIssue[], index: number, length: number): boolean {
  return issues.some((issue) => index < issue.index + issue.from.length && index + length > issue.index);
}

export function findSpellingIssues(text: string): SpellingIssue[] {
  if (!text) return [];
  const cached = cache.get(text);
  if (cached) return cached;

  const masked = text
    .replace(/\bhttps?:\/\/\S+/gi, (value) => ' '.repeat(value.length))
    .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, (value) => ' '.repeat(value.length));

  const issues: SpellingIssue[] = [];

  for (const [wrong, right] of Object.entries(CORRECTIONS)) {
    if (wrong === right) continue;
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(masked)) !== null) {
      issues.push({
        from: match[0],
        to: preservesCase(match[0], right),
        index: match.index,
        source: 'dictionary',
      });
      if (issues.length > 200) break;
    }
    if (issues.length > 200) break;
  }

  const repeated = /\b([A-Za-z]{2,})\s+\1\b/g;
  let repeatedMatch: RegExpExecArray | null;
  while ((repeatedMatch = repeated.exec(masked)) !== null) {
    if (overlaps(issues, repeatedMatch.index, repeatedMatch[0].length)) continue;
    issues.push({
      from: repeatedMatch[0],
      to: repeatedMatch[1],
      index: repeatedMatch.index,
      source: 'repeated',
    });
  }

  const tokens = /[A-Za-z]+/g;
  let token: RegExpExecArray | null;
  while ((token = tokens.exec(masked)) !== null) {
    const value = token[0];
    if (value.length < 4) continue;
    if (value[0] !== value[0].toLowerCase()) continue;
    if (overlaps(issues, token.index, value.length)) continue;
    const suggestion = guessCorrection(value);
    if (!suggestion) continue;
    issues.push({ from: value, to: suggestion, index: token.index, source: 'guess' });
  }

  issues.sort((a, b) => a.index - b.index);
  const limited = issues.slice(0, 200);
  if (cache.size > 60) cache.clear();
  cache.set(text, limited);
  return limited;
}

export function correctSpelling(text: string): string {
  if (!text) return text;
  const issues = findSpellingIssues(text).slice().sort((a, b) => b.index - a.index);
  let output = text;
  let lowest = text.length;
  for (const issue of issues) {
    if (issue.index + issue.from.length > lowest) continue;
    output = output.slice(0, issue.index) + issue.to + output.slice(issue.index + issue.from.length);
    lowest = issue.index;
  }
  return output;
}

export function uniqueSpellingPairs(issues: SpellingIssue[], limit = 4): SpellingIssue[] {
  const seen = new Set<string>();
  const unique: SpellingIssue[] = [];
  for (const issue of issues) {
    const key = `${issue.from.toLowerCase()}->${issue.to.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(issue);
    if (unique.length >= limit) break;
  }
  return unique;
}
