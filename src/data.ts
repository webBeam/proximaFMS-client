export type Role = 'Tenant' | 'Investor' | 'Craftsman' | 'Admin'
export type Kind = 'Apartment' | 'House' | 'Boarding unit'
export type Listing = {
  id:string; title:string; location:string; kind:Kind; rent:number; status:string
  beds:number; baths:number; area:number; depositMonths:number; advanceMonths:number
  trust:'L2'|'L3'; rating:number; reviews:number; furnishing:string; amenities:string[]
}
export type Application = { id:string; listingId:string; note:string; status:string }
export type Repair = { id:string; title:string; note:string; category:string; urgency:string; photo?:string; proof?:string; status:string; quote?:number }
export type Review = { id:string; title:string; detail:string; status:string; kind:string; age:string }
export type State = { listings:Listing[]; applications:Application[]; repairs:Repair[]; reviews:Review[]; paid:boolean; saved:string[] }

export const initial: State = {
  listings: [
    { id:'PF-101', title:'Coastal Atrium Suite', location:'Dehiwala', kind:'Apartment', rent:85000, status:'Published', beds:2, baths:2, area:980, depositMonths:3, advanceMonths:1, trust:'L3', rating:4.8, reviews:26, furnishing:'Semi-furnished', amenities:['Parking','Lift','Hot water','24h security'] },
    { id:'PF-102', title:'Water Lily Pavilion 6A', location:'Rajagiriya', kind:'Apartment', rent:210000, status:'Published', beds:1, baths:1, area:240, depositMonths:2, advanceMonths:1, trust:'L2', rating:4.4, reviews:11, furnishing:'Furnished', amenities:['Shared kitchen','Wi‑Fi','Water included'] },
    { id:'PF-103', title:'The Walauwa on Barnes', location:'Colombo 07', kind:'House', rent:550000, status:'Published', beds:4, baths:3, area:2350, depositMonths:3, advanceMonths:2, trust:'L3', rating:4.9, reviews:18, furnishing:'Unfurnished', amenities:['Courtyard','Parking','Lap pool','Colonial verandah'] },
    { id:'PF-104', title:'Sapphire Ocean Terraces 18B', location:'Colombo 03', kind:'Apartment', rent:340000, status:'Published', beds:1, baths:1, area:510, depositMonths:2, advanceMonths:1, trust:'L3', rating:4.6, reviews:14, furnishing:'Furnished', amenities:['Sea breeze balcony','Wi‑Fi','Lift'] },
    { id:'PF-105', title:'Ceylon Tea Planter’s Villa', location:'Kandy', kind:'House', rent:420000, status:'Published', beds:3, baths:2, area:1600, depositMonths:3, advanceMonths:1, trust:'L2', rating:4.5, reviews:9, furnishing:'Semi-furnished', amenities:['Garden','Parking','Pet friendly'] },
    { id:'PF-106', title:'The Ambassador’s Wing 2C', location:'Colombo 07', kind:'Apartment', rent:285000, status:'Published', beds:1, baths:1, area:190, depositMonths:2, advanceMonths:1, trust:'L2', rating:4.2, reviews:7, furnishing:'Furnished', amenities:['Water included','Near station'] },
    { id:'PF-107', title:'Serendib Heritage Bungalow', location:'Rajagiriya', kind:'House', rent:350000, status:'Pending review', beds:4, baths:3, area:4200, depositMonths:3, advanceMonths:1, trust:'L3', rating:4.7, reviews:0, furnishing:'Semi-furnished', amenities:['Courtyard','Parking','Garden','Staff quarters'] },
  ],
  applications:[{ id:'APP-204', listingId:'PF-101', note:'Two occupants, looking to move in on 1 December.', status:'Submitted' }],
  repairs:[
    { id:'MNT-108', title:'Leaking kitchen tap', note:'The tap at Coastal Atrium Suite, Unit 2B, drips even when fully closed.', category:'Plumbing', urgency:'Normal', status:'Reported' },
    { id:'MNT-109', title:'Garden valve replacement', note:'Irrigation valve in the courtyard keeps sticking.', category:'Plumbing', urgency:'Normal', status:'Open for quotes' },
    { id:'MNT-110', title:'AC chiller service', note:'Quarterly service for the living room unit.', category:'HVAC', urgency:'Urgent', status:'Open for quotes' },
    { id:'MNT-107', title:'Bedroom light fitting', note:'Replace the faulty ceiling light fitting at Coastal Atrium Suite.', category:'Electrical', urgency:'Urgent', status:'Open for quotes' },
  ],
  reviews:[
    { id:'VER-031', title:'Nimal Perera', detail:'Investor onboarding · Identity and ownership evidence submitted', status:'Pending', kind:'Verification', age:'3h' },
    { id:'VER-032', title:'Kasun Silva', detail:'Craftsman onboarding · Trade credentials submitted', status:'Pending', kind:'Verification', age:'9h' },
    { id:'DSP-012', title:'Move-out deposit deduction', detail:'Tenant disputes the cleaning deduction. Both parties have submitted evidence.', status:'Open', kind:'Dispute', age:'2d' },
  ],
  paid:false,
  saved:[],
}

export const people: Record<Role,string> = { Tenant:'Anjali Fernando', Investor:'Nimal Perera', Craftsman:'Kasun Silva', Admin:'Maya Jayasinghe' }
export const navigation: Record<Role,string[]> = {
  Tenant:['Overview','Find a rental','Applications','My tenancy','Rent & receipts','Maintenance'],
  Investor:['Overview','Properties','Applications','Rent ledger','Maintenance'],
  Craftsman:['Overview','Job marketplace','My work','Earnings'],
  Admin:['Overview','Verification','Listing moderation','Disputes','Reports'],
}
export const pageBlurb: Record<string,string> = {
  'Find a rental':'Search verified homes across Colombo and compare real move-in costs.',
  Properties:'Manage your advertisements, units and their moderation status.',
  Applications:'Follow every application from first request to signed agreement.',
  'My tenancy':'Your current home, agreement and tenancy timeline.',
  'Rent & receipts':'Invoices, online payment and receipts in one place.',
  'Rent ledger':'Track rent due, collected and overdue.',
  Maintenance:'Report issues, approve quotes and follow repairs to completion.',
  'Job marketplace':'Open service jobs near you. Send a quote in a few taps.',
  'My work':'Quotes, awarded jobs and completion evidence.',
  Earnings:'Payouts released after owner approval.',
  Verification:'Identity and ownership cases waiting for a decision.',
  'Listing moderation':'Review new advertisements before they appear in search.',
  Disputes:'Evidence-based cases with one appeal.',
  Reports:'Funnel, collection and verification health across the platform.',
}

const listingPhotos: Record<string,string> = { 'PF-101':'ref10', 'PF-102':'ref09', 'PF-103':'ref07', 'PF-104':'ref08', 'PF-105':'ref11', 'PF-106':'ref12', 'PF-107':'ref02', courtyard:'ref02', ref10x:'ref10', terrace:'ref03', penthouse:'ref04', skyline:'ref06', bath:'ref01' }
export const photoFor = (kind:string, id?:string) => './photos/' + ((id&&listingPhotos[id]) || listingPhotos[kind] || (kind==='Apartment'?'6117859':kind==='Boarding unit'?'6416122':'35361402')) + '.jpg'
export const money = (amount:number) => 'LKR ' + new Intl.NumberFormat('en-LK').format(amount)
export const moveInCost = (listing:Listing) => listing.rent * (listing.depositMonths + listing.advanceMonths)
export const uid = (prefix:string) => prefix + '-' + Array.from(crypto.getRandomValues(new Uint8Array(3)), byte => byte.toString(16).padStart(2,'0')).join('').toUpperCase()

export const geo: Record<string,[number,number]> = { 'Colombo 07':[44,48], 'Colombo 03':[33,42], Kandy:[84,24], Dehiwala:[27,74], 'Mount Lavinia':[24,86], Kotte:[63,56], Rajagiriya:[58,38], Nugegoda:[56,72], Battaramulla:[76,46] }
export const geoFor = (location:string): [number,number] => geo[location] ?? [50,60]
