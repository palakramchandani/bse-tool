import requests
import streamlit as st
import pandas as pd

def get_notices(script_code):
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

st.title("BSE Notices & Circulars Lookup")
st.write("Enter a BSE Script Code to fetch all notices and circulars.")
st.info("💡 Find script code on bseindia.com — 6 digit number. Example: Reliance = 500325")

script_input = st.text_input("Enter BSE Script Code (e.g. 500325)")
search_button = st.button("Search")

if search_button and script_input:
    with st.spinner("Fetching notices from BSE..."):
        try:
            notices = get_notices(script_input.strip())

            if not notices:
                st.warning("No notices found for this script code.")
            else:
                st.success(f"Found {len(notices)} notices for script code {script_input.strip()}")

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