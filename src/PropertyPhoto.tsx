const photos = {
  hero: { file:'35361402', alt:'Modern tropical home framed by palm trees' },
  Apartment: { file:'6117859', alt:'Orange and white apartment building with balconies' },
  'Boarding unit': { file:'6416122', alt:'Residential building beside lush palms' },
  House: { file:'35361402', alt:'Contemporary house with a garden' },
}

export default function PropertyPhoto({kind, eager=false}:{kind:string; eager?:boolean}) {
  const photo = photos[kind as keyof typeof photos] ?? photos.House
  return <img className="property-photo" src={'./photos/'+photo.file+'.jpg'} alt={photo.alt} loading={eager?'eager':'lazy'} decoding="async"/>
}
