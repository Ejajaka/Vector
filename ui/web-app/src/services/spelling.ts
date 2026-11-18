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
};

export interface SpellingIssue {
  from: string;
  to: string;
  index: number;
}

function preservesCase(source: string, replacement: string): string {
  if (source === source.toUpperCase() && source.length > 1) return replacement.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function findSpellingIssues(text: string): SpellingIssue[] {
  if (!text) return [];
  const issues: SpellingIssue[] = [];
  for (const [wrong, right] of Object.entries(CORRECTIONS)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      issues.push({ from: match[0], to: preservesCase(match[0], right), index: match.index });
      if (issues.length > 200) return issues;
    }
  }
  return issues.sort((a, b) => a.index - b.index);
}

export function correctSpelling(text: string): string {
  if (!text) return text;
  let output = text;
  for (const [wrong, right] of Object.entries(CORRECTIONS)) {
    output = output.replace(new RegExp(`\\b${wrong}\\b`, 'gi'), (match) => preservesCase(match, right));
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
