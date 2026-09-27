import { NextRequest, NextResponse } from "next/server";

const headers = (referer: string) => ({
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
  "Accept": "application/json, text/plain, */*", "Accept-Language": "en-US,en;q=0.9", "Referer": referer,
});

function isoDate(value: string | undefined) {
  if (!value) return "Date not provided";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? value : parsed.toISOString();
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ error: "Add an NSE symbol or BSE code." }, { status: 400 });
  try {
    if (/^\d{6}$/.test(query)) {
      const endpoint = "https://api.bseindia.com/BseIndiaAPI/api/getDataAdvance_New/w?strTxtNoticeNo=&strTxtDate=&strTxtTodate=&strScripcode=" + query + "&strDep=&strSegment=&subject=&category=&containgtext=";
      const bseHeaders = headers("https://www.bseindia.com/markets/marketinfo/noticescirculars");
      const landing = await fetch("https://www.bseindia.com/", { headers: bseHeaders, cache: "no-store" });
      const cookie = landing.headers.get("set-cookie");
      const response = await fetch(endpoint, {
        headers: cookie ? { ...bseHeaders, cookie } : bseHeaders,
        cache: "no-store",
      });
      if (!response.ok) throw new Error("BSE is temporarily unavailable.");
      const data = await response.json();
      const notices = (data.Table || []).map((item: { Notice_Date?: string; Subject?: string; category_name?: string; Notice_No?: string; FileName?: string }) => ({
        exchange: "BSE", date: isoDate(item.Notice_Date), title: item.Subject || "Untitled notice", category: item.category_name || "Exchange notice",
        url: item.FileName || (item.Notice_No ? `https://www.bseindia.com/downloads/UploadDocs/Notices/${encodeURIComponent(item.Notice_No)}/${encodeURIComponent(item.Notice_No)}.pdf` : undefined),
      }));
      return NextResponse.json({ query: `BSE ${query}`, notices });
    }
    const symbol = query.toUpperCase();
    const endpoint = "https://www.nseindia.com/api/NextApi/apiClient/GetQuoteApi?functionName=getCorpBoardMeeting&symbol=" + encodeURIComponent(symbol) + "&marketApiType=equities&type=W&noOfRecords=999";
    const response = await fetch(endpoint, { headers: headers("https://www.nseindia.com"), next: { revalidate: 900 } });
    if (!response.ok) throw new Error("NSE is temporarily unavailable.");
    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.data || [];
    const notices = rows.map((item: { bm_date?: string; bm_purpose?: string; bm_desc?: string; ixbrl?: string; attachment?: string }) => {
      const source = item.ixbrl || item.attachment;
      return {
        exchange: "NSE", date: isoDate(item.bm_date), title: item.bm_purpose || "Corporate action", category: "Board meeting & corporate action", description: item.bm_desc,
        url: source ? (source.startsWith("http") ? source : `https://www.nseindia.com${source}`) : undefined,
      };
    });
    return NextResponse.json({ query: `NSE ${symbol}`, notices });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Exchange data could not be loaded." }, { status: 502 });
  }
}
