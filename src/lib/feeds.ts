export const FEEDS: Record<string, { name: string; url: string }[]> = {
  en: [
    { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/rss.xml' },
    { name: 'The Guardian', url: 'https://www.theguardian.com/world/rss' },
    { name: 'AP', url: 'https://apnews.com/hub/ap-top-news?format=rss' },
    { name: 'Reuters', url: 'https://www.reuters.com/world/rss' },
    { name: 'Sky News', url: 'https://feeds.skynews.com/feeds/rss/world.xml' },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml' },
    { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss' },
    { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml' },
    { name: 'NPR World', url: 'https://feeds.npr.org/1004/rss.xml' },
    { name: 'NYTimes World', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml' },
    { name: 'Financial Times World', url: 'https://www.ft.com/world?format=rss' },
    { name: 'Bloomberg', url: 'https://www.bloomberg.com/feed/podcast/etf-report.xml' }
  ],
  ko: [
    { name: 'Korea Times', url: 'https://www.koreatimes.co.kr/www/rss/rss.xml' },
    { name: 'The Korea Herald', url: 'https://www.koreaherald.com/rss/kherald.xml' },
    { name: 'Yonhap (EN)', url: 'https://en.yna.co.kr/rss/all' },
    { name: 'KBS World', url: 'http://world.kbs.co.kr/rss/news.xml' },
    { name: 'Korea JoongAng Daily', url: 'https://koreajoongangdaily.joins.com/rss' },
    { name: 'Korea.net (Gov)', url: 'http://www.korea.net/rss/rss.xml' },
    { name: 'Hankyoreh (EN)', url: 'https://english.hani.co.kr/rss/' },
    { name: 'Arirang', url: 'http://www.arirang.co.kr/rss/news.xml' },
    { name: 'The Chosun Ilbo (EN)', url: 'https://english.chosun.com/site/data/rss/rss.xml' },
    { name: 'MK English', url: 'https://pulsenews.co.kr/rss/eng' }
  ],
  ja: [
    { name: 'NHK', url: 'https://www3.nhk.or.jp/rss/news/cat0.xml' },
    { name: 'Asahi', url: 'https://www.asahi.com/rss/asahi/newsheadlines.rdf' },
    { name: 'Mainichi', url: 'https://mainichi.jp/rss/etc/mainichi-flash.rss' },
    { name: 'Kyodo (EN)', url: 'https://english.kyodonews.net/rss/news.xml' },
    { name: 'Japan Times', url: 'https://www.japantimes.co.jp/news/rss' },
    { name: 'Nikkei Asia', url: 'https://asia.nikkei.com/rss/feed/nar' },
    { name: 'Reuters Japan', url: 'https://jp.reuters.com/rss' },
    { name: 'Yomiuri (EN)', url: 'https://japannews.yomiuri.co.jp/feed/' },
    { name: 'Sankei (EN)', url: 'https://www.sankei.com/rss/latest.xml' },
    { name: 'NHK World (EN)', url: 'https://www3.nhk.or.jp/nhkworld/en/news/rss/' }
  ],
  fr: [
    { name: 'Le Monde', url: 'https://www.lemonde.fr/rss/une.xml' },
    { name: 'Le Figaro', url: 'https://www.lefigaro.fr/rss/figaro_actualites.xml' },
    { name: 'France 24', url: 'https://www.france24.com/en/rss' },
    { name: 'Le Parisien', url: 'https://www.leparisien.fr/arc/outboundfeeds/rss/?outputType=xml' },
    { name: 'RFI', url: 'https://www.rfi.fr/fr/rss' },
    { name: 'Libération', url: 'https://www.liberation.fr/arc/outboundfeeds/rss/' },
    { name: '20 Minutes', url: 'https://www.20minutes.fr/feeds/rss' },
    { name: 'Courrier International', url: 'https://www.courrierinternational.com/feed/all/rss.xml' },
    { name: 'Le Point', url: 'https://www.lepoint.fr/24h-infos/rss.xml' },
    { name: 'Euronews (FR)', url: 'https://fr.euronews.com/rss?level=theme&name=news' }
  ],
};

export const LANG_ORDER = ["en","ko","ja","fr"];
export const LANG_LABELS: Record<string,string> = { en:"English", ko:"한국어", ja:"日本語", fr:"Français" };