export const FEEDS: Record<string, { name: string; url: string }[]> = {
  en: [
    { name: "BBC", url: "https://feeds.bbci.co.uk/news/rss.xml" },
    { name: "The Guardian", url: "https://www.theguardian.com/world/rss" },
    { name: "Sky News", url: "https://feeds.skynews.com/feeds/rss/world.xml" },
    { name: "Al Jazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
    { name: "CNN", url: "http://rss.cnn.com/rss/edition.rss" },
    { name: "NPR World", url: "https://feeds.npr.org/1004/rss.xml" },
    { name: "NYTimes World", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml" },
    { name: "Financial Times World", url: "https://www.ft.com/world?format=rss" },
    { name: "PBS NewsHour", url: "https://www.pbs.org/newshour/feeds/rss/headlines" },
    { name: "Politico", url: "https://www.politico.com/rss/politics-news.xml" },
    { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
    { name: "CBC World", url: "https://www.cbc.ca/cmlink/rss-world" },
    { name: "DW (Deutsche Welle)", url: "https://rss.dw.com/rdf/rss-en-all" },
    { name: "ABC News World (US)", url: "https://abcnews.go.com/abcnews/internationalheadlines" },
    { name: "The Independent", url: "https://www.independent.co.uk/news/world/rss" },
    { name: "CNBC World", url: "https://www.cnbc.com/id/100727362/device/rss/rss.html" }
  ],
  ko: [
    { name: "연합뉴스", url: "https://www.yna.co.kr/rss" },
    { name: "KBS 뉴스", url: "https://news.kbs.co.kr/rss/news/main_news.htm" },
    { name: "MBC 뉴스", url: "https://imnews.imbc.com/rss/news/news_00.xml" },
    { name: "SBS 뉴스", url: "https://news.sbs.co.kr/news/newsflash.do?plink=RSSREADER&cooper=SBSNEWS" },
    { name: "한겨레", url: "https://www.hani.co.kr/rss/" },
    { name: "경향신문", url: "https://www.khan.co.kr/rss/rssdata/kh_today.xml" },
    { name: "조선일보", url: "https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml" },
    { name: "중앙일보", url: "https://rss.joongang.co.kr/joongang/news" },
    { name: "동아일보", url: "https://www.donga.com/rss/" },
    { name: "매일경제", url: "https://file.mk.co.kr/news/rss/rss_40300001.xml" },
    { name: "한국경제", url: "https://www.hankyung.com/feed/all-news" },
    { name: "서울신문", url: "https://www.seoul.co.kr/rss/section.xml" },
    { name: "세계일보", url: "https://www.segye.com/rss/allArticle.xml" },
    { name: "국민일보", url: "https://rss.kmib.co.kr/rss/news/all.xml" },
    { name: "YTN", url: "https://www.ytn.co.kr/rss/ytn_all.xml" }
  ],
  ja: [
    { name: "NHK", url: "https://www3.nhk.or.jp/rss/news/cat0.xml" },
    { name: "朝日新聞", url: "https://www.asahi.com/rss/asahi/newsheadlines.rdf" },
    { name: "毎日新聞", url: "https://mainichi.jp/rss/etc/mainichi-flash.rss" },
    { name: "読売新聞", url: "https://www.yomiuri.co.jp/rss/yol_all.rdf" },
    { name: "産経新聞", url: "https://www.sankei.com/rss/news/flash.xml" },
    { name: "共同通信(EN)", url: "https://english.kyodonews.net/rss/news.xml" },
    { name: "Japan Times", url: "https://www.japantimes.co.jp/news/rss" },
    { name: "Nikkei Asia", url: "https://asia.nikkei.com/rss/feed/nar" },
    { name: "時事通信", url: "https://www.jiji.com/rss/ranking.rdf" }
  ],
  fr: [
    { name: "Le Monde", url: "https://www.lemonde.fr/rss/une.xml" },
    { name: "Le Figaro", url: "https://www.lefigaro.fr/rss/figaro_actualites.xml" },
    { name: "France 24", url: "https://www.france24.com/fr/rss" },
    { name: "Le Parisien", url: "https://www.leparisien.fr/arc/outboundfeeds/rss/?outputType=xml" },
    { name: "RFI", url: "https://www.rfi.fr/fr/rss" },
    { name: "Libération", url: "https://www.liberation.fr/arc/outboundfeeds/rss/" },
    { name: "20 Minutes", url: "https://www.20minutes.fr/feeds/rss" },
    { name: "Courrier International", url: "https://www.courrierinternational.com/feed/all/rss.xml" },
    { name: "Le Point", url: "https://www.lepoint.fr/24h-infos/rss.xml" },
    { name: "Euronews (FR)", url: "https://fr.euronews.com/rss?level=theme&name=news" },
    { name: "BFMTV", url: "https://www.bfmtv.com/rss/info/flux-rss/flux-toutes-les-actualites/" },
    { name: "Ouest-France", url: "https://www.ouest-france.fr/rss-en-continu.xml" },
    { name: "L'Obs", url: "https://www.nouvelobs.com/rss.xml" }
  ]
};

export const LANG_LABELS: Record<string, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  fr: "Français"
};

export const LANG_ORDER = ["en", "ko", "ja", "fr"];