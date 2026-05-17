/**
 * Single source of truth for all metric/abbreviation explanations.
 * Used by the `InfoTooltip` component throughout the dashboard.
 *
 * Tone: short, plain Dutch (the audience).
 * Each entry: a title + a 2-4 sentence explanation. Some entries also
 * include a `example` for context.
 */

export interface GlossaryEntry {
  title: string
  body: string
  example?: string
  category?: 'performance' | 'risk' | 'score' | 'execution' | 'metric' | 'concept'
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // ═══ Returns & performance ═══
  twr: {
    category: 'performance',
    title: 'TWR — Time-Weighted Return',
    body: 'Rendement gemeten door de dagelijkse procentuele bewegingen aan elkaar te knopen. Stortingen en opnames worden uitgesloten, dus dit toont de pure performance van de beleggingen — niet hoeveel geld er bij of af is gegaan.',
    example: 'Twee dagen van +1% leveren een TWR van ongeveer +2,01% op.',
  },
  'total-return': {
    category: 'performance',
    title: 'Totaal Rendement',
    body: 'Het totale TWR-rendement sinds de start (1 januari 2026). Dit is hoe je portfolio gegroeid is, ongeacht of je tussendoor geld hebt gestort of opgenomen.',
  },
  'ytd-realized': {
    category: 'performance',
    title: 'YTD Gerealiseerd',
    body: 'De som van alle winsten en verliezen op trades die dit jaar gesloten zijn, uitgedrukt als percentage van de huidige portfoliowaarde.',
  },
  'ytd-unrealized': {
    category: 'performance',
    title: 'YTD Ongerealiseerd',
    body: 'De papieren winst of verlies op de open posities die we nu nog vasthouden. "Ongerealiseerd" omdat de positie nog niet gesloten is.',
  },
  alpha: {
    category: 'performance',
    title: 'Alpha (α)',
    body: 'Hoeveel beter (of slechter) wij presteren dan de markt-benchmark. Positief = we verslaan de index, negatief = we lopen achter. Wordt berekend als ons TWR minus dat van VWCE.',
    example: 'Onze TWR +12%, VWCE +8% → Alpha = +4 procentpunten.',
  },
  vwce: {
    category: 'concept',
    title: 'VWCE',
    body: 'Vanguard FTSE All-World ETF — een wereldwijde aandelen-index van ~3.700 bedrijven uit ontwikkelde én opkomende markten. Wij gebruiken VWCE als benchmark om onze prestaties te vergelijken met "gewoon de markt kopen".',
  },
  benchmark: {
    category: 'concept',
    title: 'Benchmark',
    body: 'De vergelijkings-index waaraan we onze prestaties meten. Voor Fynoy is dat VWCE (Vanguard FTSE All-World). Als wij beter presteren dan VWCE leveren we waarde toe boven passief beleggen.',
  },
  'annualized-return': {
    category: 'performance',
    title: 'Annualized Return',
    body: 'Het rendement omgerekend naar een jaarcijfer. Als we in 6 maanden 5% hebben gehaald, is het geannualiseerde rendement ongeveer 10,25%. Maakt het makkelijker om periodes van verschillende lengte te vergelijken.',
  },

  // ═══ Risk metrics ═══
  sharpe: {
    category: 'risk',
    title: 'Sharpe Ratio',
    body: 'Rendement gedeeld door volatiliteit (na aftrek van risicovrije rente). Meet dus hoeveel rendement we behalen per eenheid risico. Hoger = beter risk/reward.',
    example: '>1 is goed, >2 is uitstekend, <0,5 is matig.',
  },
  sortino: {
    category: 'risk',
    title: 'Sortino Ratio',
    body: 'Zoals Sharpe, maar straft alleen de neerwaartse volatiliteit af. Logisch: opwaartse "ruis" (winnende dagen) is geen risico. Hoger = beter, en meestal hoger dan Sharpe.',
  },
  calmar: {
    category: 'risk',
    title: 'Calmar Ratio',
    body: 'Geannualiseerd rendement gedeeld door de maximum drawdown. Beantwoordt: "voor elke 1% mogelijke daling, hoeveel rendement heb ik gehaald?" Hoger = robuuster.',
  },
  volatility: {
    category: 'risk',
    title: 'Volatiliteit',
    body: 'De standaarddeviatie van het dagelijkse rendement, geannualiseerd. Een grove maat voor hoe wild de portfolio beweegt. Hoger = grilliger.',
  },
  'max-drawdown': {
    category: 'risk',
    title: 'Max Drawdown',
    body: 'De grootste piek-naar-dal daling sinds de start. Toont de "ergste blauwe plek" die de portfolio heeft opgelopen. Belangrijke maat voor neerwaarts risico.',
    example: 'Als de portfolio van 100 naar 85 zakte voor hij weer steeg, is de Max DD -15%.',
  },
  drawdown: {
    category: 'risk',
    title: 'Drawdown',
    body: 'Het percentage onder de vorige piek waar de portfolio nu staat. Een drawdown van 0% betekent dat je op een all-time high zit.',
  },
  'current-drawdown': {
    category: 'risk',
    title: 'Huidige Drawdown',
    body: 'Hoe ver de portfolio op dit moment onder zijn laatste piek staat. 0% betekent we zitten op een all-time high.',
  },
  beta: {
    category: 'risk',
    title: 'Beta (β)',
    body: 'De gevoeligheid van de portfolio voor marktbewegingen. β=1 betekent we bewegen mee met VWCE; β=1,5 betekent we bewegen 50% sterker; β<1 betekent rustiger dan de markt.',
  },
  'risk-free': {
    category: 'concept',
    title: 'Risicovrije Rente',
    body: 'Het rendement dat je risicoloos kunt krijgen — wij gebruiken de 10-jaars Duitse Bund. Dit is de "ondergrens" waartegen al onze prestaties vergeleken worden in Sharpe/Sortino/M².',
  },

  // ═══ Capped M² ═══
  'capped-m2': {
    category: 'risk',
    title: 'Capped M² (Risk-adjusted Return)',
    body: 'Het rendement dat onze portfolio zou hebben behaald op dezelfde volatiliteit als VWCE. Geeft een eerlijke vergelijking: wat als we beide hetzelfde risico namen? Hoger dan VWCE = wij leveren echte alpha; lager = de outperformance kwam alleen door extra risico.',
    example: 'Onze TWR +12% (vol 18%), VWCE +8% (vol 12%) → Capped M² ≈ +8%. Geen extra alpha na risico-correctie.',
  },
  'm-squared': {
    category: 'risk',
    title: 'Modigliani M²',
    body: 'Klassieke risk-adjusted maatstaf bedacht door Franco Modigliani. "Capped" omdat we de hefboom plafonneren op 1 — we boosten nooit kunstmatig met fictieve leverage.',
  },

  // ═══ Trade stats ═══
  'win-rate': {
    category: 'performance',
    title: 'Win Rate',
    body: 'Het percentage van gesloten trades dat met winst is gesloten. Belangrijk: een lage win rate is niet erg als de winsten groter zijn dan de verliezen.',
  },
  'avg-return': {
    category: 'performance',
    title: 'Gemiddeld Rendement per Trade',
    body: 'Gemiddelde procentuele winst/verlies over alle gesloten trades. Niet gewogen naar positiegrootte — puur het gemiddelde.',
  },
  'avg-holding': {
    category: 'performance',
    title: 'Gemiddelde Holding Period',
    body: 'Hoe lang we trades gemiddeld vasthouden voordat we ze sluiten. Korter = sneller schakelend, langer = meer thesis-gedreven.',
  },
  'best-trade': {
    category: 'performance',
    title: 'Beste Trade',
    body: 'De gesloten positie met het hoogste procentuele rendement.',
  },
  'worst-trade': {
    category: 'performance',
    title: 'Slechtste Trade',
    body: 'De gesloten positie met het laagste procentuele rendement (grootste verlies of kleinste winst).',
  },
  'trades-ytd': {
    category: 'performance',
    title: 'Trades YTD',
    body: 'Aantal trades dat dit jaar gesloten is.',
  },

  // ═══ Execution ═══
  tp: {
    category: 'execution',
    title: 'TP — Take Profit',
    body: 'Het prijsdoel waar we de positie willen sluiten met winst. Vaak gebaseerd op fundamentele waarde of een technisch koersdoel.',
  },
  sl: {
    category: 'execution',
    title: 'SL — Stop Loss',
    body: 'Het prijsniveau waar we de positie sluiten om verlies te beperken — onze "exit als de thesis misgaat".',
  },
  rrr: {
    category: 'execution',
    title: 'Risk/Reward Ratio',
    body: 'De potentiële winst (TP - Entry) gedeeld door het potentiële verlies (Entry - SL). 3:1 betekent: voor elke €1 risico mikken we op €3 winst.',
  },
  leverage: {
    category: 'execution',
    title: 'Hefboom (Leverage)',
    body: 'De factor waarmee de positiewaarde is vergroot t.o.v. eigen inleg. 1x = geen hefboom; 2x = je belegt het dubbele van je inleg.',
  },
  'holding-period': {
    category: 'execution',
    title: 'Verwachte Holding Period',
    body: 'Hoe lang we deze positie naar verwachting vasthouden volgens onze thesis. Wordt gebruikt om alerts te geven als een trade te lang openstaat.',
  },

  // ═══ Portfolio composition ═══
  'pct-of-nav': {
    category: 'metric',
    title: '% of NAV',
    body: 'Hoe groot deze positie is t.o.v. de totale portfoliowaarde. Een positie van 8% van NAV betekent dat 8% van het kapitaal in dit aandeel zit.',
  },
  nav: {
    category: 'metric',
    title: 'NAV — Net Asset Value',
    body: 'De totale waarde van de portfolio op marktprijzen. Som van alle posities × huidige prijs (na correctie voor schulden).',
  },
  weight: {
    category: 'metric',
    title: 'Weight (Gewicht)',
    body: 'Hoe groot een positie of sector is binnen de portfolio. Hetzelfde als % of NAV.',
  },
  'open-positions': {
    category: 'metric',
    title: 'Open Posities',
    body: 'Aandelen die we op dit moment vasthouden — niet de cases die we onderzoeken, maar de echte holdings.',
  },

  // ═══ Concentration ═══
  hhi: {
    category: 'risk',
    title: 'HHI — Herfindahl-Hirschman Index',
    body: 'Maat voor concentratie. We berekenen de som van alle posities² × 10.000. Lagere waarde = meer gediversifieerd, hogere = geconcentreerd in weinig namen.',
    example: '10.000 = alles in 1 aandeel; 1.000 = ongeveer 10 even grote posities.',
  },
  'effective-holdings': {
    category: 'risk',
    title: 'Effective Holdings',
    body: '10.000 / HHI. Vertelt: "ware mate van diversificatie alsof alle posities even groot waren". Lager dan het echte aantal posities betekent dat de portfolio in praktijk minder gediversifieerd is.',
  },
  'top-1': {
    category: 'risk',
    title: 'Top 1 Weight',
    body: 'Hoeveel procent van de portfolio in de grootste positie zit. Hoger = kwetsbaarder voor één naam.',
  },
  'top-3': {
    category: 'risk',
    title: 'Top 3 Combined',
    body: 'Het totale gewicht van de drie grootste posities samen.',
  },
  'top-5': {
    category: 'risk',
    title: 'Top 5 Combined',
    body: 'Het totale gewicht van de vijf grootste posities samen.',
  },

  // ═══ Days / time ═══
  'positive-days': {
    category: 'performance',
    title: 'Positieve Dagen',
    body: 'Aantal handelsdagen met een positief dagrendement.',
  },
  'negative-days': {
    category: 'performance',
    title: 'Negatieve Dagen',
    body: 'Aantal handelsdagen met een negatief dagrendement.',
  },
  'best-day': {
    category: 'performance',
    title: 'Beste Dag',
    body: 'De dag met het hoogste dagrendement.',
  },
  'worst-day': {
    category: 'performance',
    title: 'Slechtste Dag',
    body: 'De dag met het laagste dagrendement.',
  },
  'recovery-days': {
    category: 'risk',
    title: 'Recovery Days',
    body: 'Hoeveel dagen we onder water hebben gezeten na de diepste drawdown voordat we de vorige piek weer aantikten.',
  },

  // ═══ Case scores ═══
  'trigger-score': {
    category: 'score',
    title: 'Trigger Score (1-7)',
    body: 'Hoe sterk de catalyst/aanleiding is om naar dit aandeel te kijken. Hoog = duidelijk en hard event (bv. een aankondiging die het narratief verandert).',
  },
  'fundamental-score': {
    category: 'score',
    title: 'Fundamental Score (1-10)',
    body: 'Beoordeling van de onderliggende business: groeivermogen, marges, schuldpositie, concurrentievoordeel. Hoog = sterk en duurzaam bedrijfsmodel.',
  },
  'valuation-score': {
    category: 'score',
    title: 'Valuation Score (1-8)',
    body: 'Hoe aantrekkelijk de waardering is t.o.v. peers en eigen historische multiples. Hoog = aantrekkelijke prijs.',
  },
  'conviction-score': {
    category: 'score',
    title: 'Conviction Score (1-10)',
    body: 'Hoe sterk we in de thesis geloven, gewogen tegen alle risico\'s en catalysts. Drijft positiegrootte.',
  },
  'technical-score': {
    category: 'score',
    title: 'Technical Score (1-6)',
    body: 'Wat de chart en marktstructuur zeggen. Houdt rekening met trend, ondersteuning/weerstand en momentum.',
  },
  'esg-score': {
    category: 'score',
    title: 'ESG / Governance Score (1-10)',
    body: 'Kwaliteit van bestuur, ESG-praktijken en compliance. Lager = rode vlaggen rond integriteit of governance.',
  },
  'confidence-score': {
    category: 'score',
    title: 'Confidence Score (1-10)',
    body: 'Hoe zeker we zijn dat onze analyse klopt — eigen subjectieve inschatting onafhankelijk van de andere scores.',
  },
  'total-score': {
    category: 'score',
    title: 'Total Score (1-48)',
    body: 'Som van Trigger + Fundamental + Valuation + Conviction + Technical. 48 is de theoretische max.',
    example: '≥35 markeren we als top picks.',
  },

  // ═══ Valuation ratios ═══
  pe: {
    category: 'metric',
    title: 'P/E — Price to Earnings',
    body: 'Aandelenprijs gedeeld door winst per aandeel. Hoeveel je betaalt voor €1 winst. Lager = goedkoper, maar context (groei, sector) matters.',
  },
  'forward-pe': {
    category: 'metric',
    title: 'Forward P/E',
    body: 'P/E gebaseerd op verwachte winst volgend jaar in plaats van de afgelopen 12 maanden.',
  },
  'ev-ebitda': {
    category: 'metric',
    title: 'EV/EBITDA',
    body: 'Enterprise Value gedeeld door operationele winst vóór afschrijvingen. Beter dan P/E omdat het schulden meeneemt. Lager = aantrekkelijker.',
  },
  'net-debt-ebitda': {
    category: 'metric',
    title: 'Net Debt / EBITDA',
    body: 'Hoeveel jaar EBITDA er nodig is om alle nettoschuld af te lossen. <2 is gezond; >4 is risky.',
  },
  eps: {
    category: 'metric',
    title: 'EPS — Earnings Per Share',
    body: 'Winst per aandeel. De netto winst gedeeld door het aantal uitstaande aandelen.',
  },
  'operating-margin': {
    category: 'metric',
    title: 'Operating Margin',
    body: 'Operationele winst als percentage van de omzet. Hoe efficiënt het bedrijf is in zijn kernactiviteit.',
  },
  fcf: {
    category: 'metric',
    title: 'FCF — Free Cash Flow',
    body: 'Echte kasstroom die overblijft na alle uitgaven én investeringen. Belangrijker dan winst voor kapitaalallocatie.',
  },
  'layered-fcf': {
    category: 'metric',
    title: 'Layered FCF (TTM)',
    body: 'Free Cash Flow over de afgelopen 12 maanden, "gelayerd" door normalisaties (eenmalige effecten eruit).',
  },
  'analyst-target': {
    category: 'metric',
    title: 'Analyst 1Y Price Target',
    body: 'Consensus prijsdoel van Wall Street-analisten over 12 maanden. Een referentiepunt — geen evangelie.',
  },
  '52-week': {
    category: 'metric',
    title: '52-Week Range',
    body: 'De hoogste en laagste prijs van de afgelopen 12 maanden. Helpt te zien waar het aandeel staat in zijn recente bandbreedte.',
  },

  // ═══ Misc ═══
  'sector-drift': {
    category: 'risk',
    title: 'Sector Drift',
    body: 'Hoe ver onze daadwerkelijke sector-allocatie afwijkt van het doel. >5% drift = signaal om te rebalancen.',
  },
  overweight: {
    category: 'risk',
    title: 'Overweight',
    body: 'Een positie of sector waarvan we meer hebben dan onze target. >5% boven target.',
  },
  underweight: {
    category: 'risk',
    title: 'Underweight',
    body: 'Een positie of sector waarvan we minder hebben dan onze target. >5% onder target.',
  },
  'unrealized-pnl': {
    category: 'performance',
    title: 'Ongerealiseerde P&L',
    body: 'Papieren winst of verlies op een open positie — wat je zou maken/verliezen als je nu zou verkopen.',
  },
  'realized-pnl': {
    category: 'performance',
    title: 'Gerealiseerde P&L',
    body: 'De daadwerkelijk gerealiseerde winst of verlies van trades die we al gesloten hebben.',
  },
  'trading-id': {
    category: 'concept',
    title: 'Trading ID',
    body: 'Unieke identifier per case: `{TICKER}-{TOTALSCORE}-{MMYY}`. Bv. `MSFT-37-0426` = Microsoft case, score 37/48, april 2026.',
  },
  'inception-date': {
    category: 'concept',
    title: 'Inception Date',
    body: 'De datum waarop we begonnen met meten. Voor Fynoy: 1 januari 2026. Alle "since inception" stats worden hiervandaan berekend.',
  },
}

/** Lookup a glossary entry by key. Returns null if unknown. */
export function getGlossaryEntry(key: string): GlossaryEntry | null {
  return GLOSSARY[key] ?? null
}
