export function setSnapOffsetExact(){
  const header = document.getElementById('topStoriesHeader');
  if (!header) return;
  const left = Math.round(header.getBoundingClientRect().left);
  document.documentElement.style.setProperty('--rail-left', left + 'px');
}

export function faviconFor(url: string) {
  try{ const d = new URL(url).hostname; return `https://www.google.com/s2/favicons?domain=${d}&sz=64`; }catch{ return ""; }
}

export function upgradeImage(url: string){
  try{
    const u = new URL(url, location.href);
    const host = u.hostname;
    if (/ichef\.bbci\.co\.uk$/.test(host)) {
      u.pathname = u.pathname.replace(/\/news\/\d+\//, '/news/1200/');
      u.pathname = u.pathname.replace(/\/cpsprodpb\/([^/]+)\/\d+\//, '/cpsprodpb/$1/1200/');
      u.pathname = u.pathname.replace(/\/images\/ic\/\d+x\d+\//, '/images/ic/1200x675/');
      return u.toString();
    }
    if (/i\.guim\.co\.uk$/.test(host)) {
      const p = u.searchParams; p.set('width','1200'); p.set('quality','85'); u.search = p.toString(); return u.toString();
    }
    if (u.search) u.search = u.search.replace(/(w|width|size|sz)=\d+/gi, (m,k)=>`${k}=1200`);
    return u.toString();
  }catch{ return url; }
}

export function pickImage(item:any){
  const html = item.content || item.description || '';
  const candidates = [
    item?.enclosure?.link,
    item?.enclosure?.thumbnail,
    item?.thumbnail,
    (html.match(/<img[^>]+src="([^"]+)"/i) || [])[1]
  ].filter(Boolean);
  for (const url of candidates){
    const better = upgradeImage(url as string);
    if (better) return better;
  }
  return null;
}

export function fmtDateKey(d: string|number|Date){ const dt=new Date(d); dt.setHours(0,0,0,0); return dt.toISOString().slice(0,10); }
export function humanDate(key:string){
  const today = fmtDateKey(new Date());
  const yest = fmtDateKey(new Date(Date.now()-86400000));
  if (key===today) return 'Today';
  if (key===yest) return 'Yesterday';
  const [y,m,dd]=key.split('-').map(Number);
  return new Date(y,m-1,dd).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});
}
export function wordCountFromItem(item:any){
  const text = (item.content || item.description || '').replace(/<[^>]+>/g,' ');
  return (text.match(/\b\w+\b/g)||[]).length;
}