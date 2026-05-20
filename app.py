import requests
import streamlit as st

def get_bse_notices(script_code):
    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Referer": "https://www.bseindia.com/markets/marketinfo/noticescirculars_archive"
    }
    session.get("https://www.bseindia.com", headers=headers)
    url = f"https://api.bseindia.com/BseIndiaAPI/api/getDataAdvance/w?strTxtNoticeNo=&strTxtDate=&strTxtTodate=&strScripcode={script_code}&strDep=&strSegment=&subject=&category=&containgtext="
    response = session.get(url, headers=headers, timeout=10)
    data = response.json()
    all_notices = data.get("Table", [])
    return [n for n in all_notices if str(n.get("Scrip_cd")) == str(script_code)]

def get_nse_board_meetings(symbol):
    session = requests.Session()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "identity",
        "Connection": "keep-alive",
        "Referer": "https://www.nseindia.com"
    }
    session.get("https://www.nseindia.com", headers=headers)
    url = f"https://www.nseindia.com/api/NextApi/apiClient/GetQuoteApi?functionName=getCorpBoardMeeting&symbol={symbol}&marketApiType=equities&type=W&noOfRecords=999"
    r = session.get(url, headers=headers, timeout=10)
    return r.json()

st.title("BSE & NSE Corporate Actions Lookup")

tab1, tab2 = st.tabs(["BSE Notices", "NSE Board Meetings"])

with tab1:
    st.subheader("BSE Notices & Circulars")
    st.info("💡 Find script code on bseindia.com. Example: Reliance = 500325")
    script_input = st.text_input("Enter BSE Script Code (e.g. 500325)")
    bse_button = st.button("Search BSE")

    if bse_button and script_input:
        with st.spinner("Fetching from BSE..."):
            try:
                notices = get_bse_notices(script_input.strip())
                if not notices:
                    st.warning("No notices found.")
                else:
                    st.success(f"Found {len(notices)} notices")
                    for notice in notices:
                        date = notice.get("Notice_Date", "")[:10]
                        subject = notice.get("Subject", "")
                        notice_no = notice.get("Notice_no", "")
                        category = notice.get("category_name", "N/A")
                        has_pdf = notice.get("Attach_Flag") == 1
                        with st.expander(f"{date} | {subject}"):
                            st.write(f"**Notice No:** {notice_no}")
                            st.write(f"**Category:** {category}")
                            st.write(f"**Date:** {date}")
                            if has_pdf:
                                pdf_url = f"https://www.bseindia.com/markets/marketinfo/dispnewnoticescirculars?page={notice_no}"
                                st.markdown(f"[📄 View Notice & PDF]({pdf_url})")
                            else:
                                st.write("No PDF attached")
            except Exception as e:
                st.error(f"Something went wrong: {e}")

with tab2:
    st.subheader("NSE Board Meetings & Corporate Actions")
    st.info("💡 Enter NSE symbol. Example: Reliance = RELIANCE")
    symbol_input = st.text_input("Enter NSE Symbol (e.g. RELIANCE)")
    nse_button = st.button("Search NSE")

    if nse_button and symbol_input:
        with st.spinner("Fetching from NSE..."):
            try:
                meetings = get_nse_board_meetings(symbol_input.strip().upper())
                if not meetings:
                    st.warning("No records found.")
                else:
                    st.success(f"Found {len(meetings)} board meeting records")
                    for item in meetings:
                        date = item.get("bm_date", "")
                        purpose = item.get("bm_purpose", "")
                        desc = item.get("bm_desc", "")
                        ixbrl = item.get("ixbrl")
                        attachment = item.get("attachment")
                        with st.expander(f"{date} | {purpose}"):
                            st.write(f"**Date:** {date}")
                            st.write(f"**Purpose:** {purpose}")
                            st.write(f"**Description:** {desc}")
                            if ixbrl:
                                st.markdown(f"[📄 View Document]({ixbrl})")
                            if attachment:
                                st.markdown(f"[📎 Download Attachment]({attachment})")
                            if not ixbrl and not attachment:
                                st.write("No document attached")
            except Exception as e:
                st.error(f"Something went wrong: {e}")