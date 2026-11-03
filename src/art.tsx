import type { Role } from './data'

/* Original line-art and flat illustrations. Colours come from CSS classes so both themes work. */

export function Skyline({className=''}:{className?:string}) {
  return <svg className={'skyline '+className} viewBox="0 0 640 170" fill="none" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle className="sk-sun" cx="530" cy="46" r="24"/>
    <g className="sk-line">
      <path d="M-1400 160H2040"/>
      <path d="M30 160V112h38v48M76 160V92h32v68M84 104h4M96 104h4M84 118h4M96 118h4M84 132h4M96 132h4M116 160V122h30v38"/>
      <path d="M420 160V104h34v56M462 160V84h30v76M470 96h4M482 96h4M470 110h4M482 110h4M470 124h4M482 124h4M500 160V118h40v42M548 160V98h34v62"/>
      <path d="M317 160V68M327 160V68M317 96h10M317 124h10"/>
      <path d="M310 68c-8-10-6-23 12-36 18 13 20 26 12 36Z"/>
      <path d="M322 32V8M318 14h8"/>
      <path d="M309 64c-11-2-17-10-17-19 10 0 16 6 18 15M335 64c11-2 17-10 17-19-10 0-16 6-18 15"/>
      <path d="M214 160c5-28 3-48-5-68"/>
      <path d="M209 92c-14-9-31-7-41 2M209 92c-4-15-16-23-31-23M209 92c10-13 27-15 39-9M209 92c14-2 27 6 31 19M209 92c2-15 12-25 25-27"/>
      <path d="M392 160c-4-22-2-38 4-54"/>
      <path d="M396 106c-11-7-24-6-32 2M396 106c-3-12-13-18-24-18M396 106c8-10 21-12 31-7M396 106c11-2 21 5 24 15"/>
      
    </g>
  </svg>
}

export function TukTuk({className=''}:{className?:string}) {
  return <svg className={'tuktuk '+className} viewBox="0 0 124 86" aria-hidden="true">
    <path className="tt-body" d="M20 64V34c0-12 9-21 21-21h38c7 0 12 4 14 10l11 23c2 4 3 8 3 13v5Z"/>
    <path className="tt-roof" d="M16 34c0-16 11-26 27-26h34c9 0 14 5 16 12" fill="none" strokeWidth="6" strokeLinecap="round"/>
    <rect className="tt-glass" x="29" y="24" width="30" height="19" rx="5"/>
    <path className="tt-glass" d="M66 24h12c4 0 6 2 7 5l7 15H66Z"/>
    <path className="tt-stripe" d="M20 53h86" strokeWidth="4"/>
    <circle className="tt-light" cx="104" cy="50" r="3.4"/>
    <g className="tt-wheel"><circle cx="34" cy="68" r="10"/><circle cx="34" cy="68" r="3.6" className="tt-hub"/></g>
    <g className="tt-wheel"><circle cx="96" cy="68" r="10"/><circle cx="96" cy="68" r="3.6" className="tt-hub"/></g>
  </svg>
}

export function Frond({className=''}:{className?:string}) {
  return <svg className={'frond '+className} viewBox="0 0 200 200" aria-hidden="true">
    <path className="fr-stem" d="M20 190C70 140 120 90 190 20" fill="none" strokeWidth="4" strokeLinecap="round"/>
    {Array.from({length:9}).map((_,i)=>{
      const t = .12+i*.095, x = 20+170*t, y = 190-170*t, len = 58-i*3.2
      return <g key={i}>
        <path className="fr-leaf" d={`M${x} ${y}q${-len*.2} ${-len*.75} ${-len*.95} ${-len*.55}q${len*.55} ${len*.05} ${len*.95} ${len*.55}Z`}/>
        <path className="fr-leaf alt" d={`M${x} ${y}q${len*.75} ${len*.2} ${len*.55} ${len*.95}q${-.05*len} ${-len*.55} ${-len*.55} ${-len*.95}Z`}/>
      </g>
    })}
  </svg>
}

export function Sunburst({className=''}:{className?:string}) {
  return <svg className={'sunburst '+className} viewBox="0 0 200 200" aria-hidden="true">
    <g className="sb-rays">{Array.from({length:24}).map((_,i)=><rect key={i} x="98" y="2" width="4" height="26" rx="2" transform={`rotate(${i*15} 100 100)`}/>)}</g>
    <circle className="sb-disc" cx="100" cy="100" r="62"/>
  </svg>
}

export function Squiggle({className=''}:{className?:string}) {
  return <svg className={'squiggle '+className} viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true"><path d="M4 16C40 4 70 22 110 12s70-8 110 0 50 6 76-4" fill="none" strokeWidth="6" strokeLinecap="round"/></svg>
}

export function RoleArt({role}:{role:Role}) {
  if (role==='Tenant') return <svg className="role-art" viewBox="0 0 220 170" aria-hidden="true">
    <circle className="a-sun" cx="160" cy="46" r="30"/>
    <path className="a-cream" d="M40 160V82l60-48 60 48v78Z"/><path className="a-ink-line" d="M40 160V82l60-48 60 48v78M28 92l72-58 72 58" fill="none" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round"/>
    <path className="a-coral" d="M86 160v-36a14 14 0 0 1 28 0v36Z"/>
    <rect className="a-teal" x="56" y="96" width="20" height="20" rx="4"/><rect className="a-teal" x="124" y="96" width="20" height="20" rx="4"/>
    <g className="a-key"><circle cx="186" cy="132" r="12" fill="none" strokeWidth="6"/><path d="M178 140l-22 22M164 154l6 6M158 160l5 5" fill="none" strokeWidth="6" strokeLinecap="round"/></g>
    <path className="a-ink-line" d="M10 160h200" strokeWidth="5" strokeLinecap="round"/>
  </svg>
  if (role==='Investor') return <svg className="role-art" viewBox="0 0 220 170" aria-hidden="true">
    <rect className="a-cream" x="34" y="50" width="56" height="110" rx="6"/><rect className="a-teal" x="98" y="78" width="46" height="82" rx="6"/>
    <path className="a-ink-line" d="M34 160V56a6 6 0 0 1 6-6h44a6 6 0 0 1 6 6v104M98 160V84a6 6 0 0 1 6-6h34a6 6 0 0 1 6 6v76" fill="none" strokeWidth="5"/>
    {[64,86,108,130].map(y=><g key={y}><rect className="a-sun" x="46" y={y} width="10" height="10" rx="2"/><rect className="a-sun" x="68" y={y} width="10" height="10" rx="2"/></g>)}
    <path className="a-coral-line" d="M120 56l22-18 18 12 32-34" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><path className="a-coral" d="M196 8l2 22-20-6Z"/>
    <circle className="a-sun" cx="178" cy="128" r="22"/><path className="a-ink-line" d="M178 116v24M171 121h10a5 5 0 0 1 0 10h-6a5 5 0 0 0 0 10h10" fill="none" strokeWidth="4" strokeLinecap="round"/>
    <path className="a-ink-line" d="M10 160h200" strokeWidth="5" strokeLinecap="round"/>
  </svg>
  if (role==='Craftsman') return <svg className="role-art" viewBox="0 0 220 170" aria-hidden="true">
    <circle className="a-sun" cx="110" cy="80" r="62"/>
    <rect className="a-coral" x="44" y="104" width="132" height="56" rx="10"/><path className="a-ink-line" d="M84 104V92a8 8 0 0 1 8-8h36a8 8 0 0 1 8 8v12M44 126h132" fill="none" strokeWidth="5"/>
    <rect className="a-cream" x="100" y="118" width="20" height="16" rx="4"/>
    <path className="a-ink-line" d="M60 30l46 46M54 44a14 14 0 0 1 20-20l-8 8 2 6 6 2 8-8a14 14 0 0 1-20 20" fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    <path className="a-ink-line" d="M164 28l-44 44" strokeWidth="8" strokeLinecap="round"/><rect className="a-teal" x="150" y="14" width="34" height="18" rx="4" transform="rotate(45 167 23)"/>
    <path className="a-ink-line" d="M10 160h200" strokeWidth="5" strokeLinecap="round"/>
  </svg>
  return <svg className="role-art" viewBox="0 0 220 170" aria-hidden="true">
    <circle className="a-sun" cx="74" cy="72" r="48"/>
    <path className="a-teal" d="M110 18l56 20v42c0 38-26 62-56 74-30-12-56-36-56-74V38Z"/>
    <path className="a-ink-line" d="M110 18l56 20v42c0 38-26 62-56 74-30-12-56-36-56-74V38Z" fill="none" strokeWidth="5" strokeLinejoin="round"/>
    <path className="a-cream-line" d="M86 84l16 16 32-34" fill="none" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round"/>
    <circle className="a-coral-line" cx="176" cy="122" r="18" fill="none" strokeWidth="7"/><path className="a-coral-line" d="M190 136l16 16" strokeWidth="8" strokeLinecap="round"/>
    <path className="a-ink-line" d="M10 160h200" strokeWidth="5" strokeLinecap="round"/>
  </svg>
}
