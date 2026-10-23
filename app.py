"""
app.py - Streamlit web interface for the YouTube Video & Audio Downloader.
"""

import os
import time
import shutil
from pathlib import Path
import streamlit as st
from downloader import get_video_info, download_media, format_size

# Setup page configuration
st.set_page_config(
    page_title="YouTube Video & Audio Downloader",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded"
)

DOWNLOADS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)


def cleanup_old_files(max_age_seconds: int = 1800):
    """Remove files in DOWNLOADS_DIR older than max_age_seconds (default 30 mins)."""
    try:
        now = time.time()
        for root, _, files in os.walk(DOWNLOADS_DIR):
            for file in files:
                file_path = os.path.join(root, file)
                if os.path.isfile(file_path):
                    if now - os.path.getmtime(file_path) > max_age_seconds:
                        try:
                            os.remove(file_path)
                        except Exception:
                            pass
    except Exception:
        pass


def delete_file(file_path: str):
    """Safely delete a single file."""
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass


# Automatically cleanup files older than 30 minutes on each run
cleanup_old_files(max_age_seconds=1800)

# Custom CSS for styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }
    .sub-header {
        color: #6c757d;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    .meta-box {
        background-color: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        padding: 16px;
        margin-top: 10px;
    }
    .badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 600;
        background-color: #2b3945;
        color: #ffffff;
        margin-right: 8px;
    }
    .success-box {
        padding: 15px;
        border-radius: 8px;
        background-color: rgba(40, 167, 69, 0.15);
        border: 1px solid #28a745;
        margin: 15px 0;
    }
</style>
""", unsafe_allow_html=True)

# Application Header
st.markdown('<div class="main-header">🎬 YouTube Video & Audio Downloader</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-header">Download videos in MP4 format with audio merged or extract high-quality MP3 audio files seamlessly.</div>',
    unsafe_allow_html=True
)

# Sidebar with application details & maintenance tools
with st.sidebar:
    st.header("⚙️ Settings & Tools")
    st.info("**Engine:** `yt-dlp` + `ffmpeg`\n\n**Environment:** Managed via `uv`\n\n**Format Support:** MP4 Video / MP3 Audio")
    
    st.divider()
    st.subheader("🧹 Storage Management")
    downloads_count = len([f for f in os.listdir(DOWNLOADS_DIR) if os.path.isfile(os.path.join(DOWNLOADS_DIR, f))])
    st.write(f"Temporary files cached: **{downloads_count}**")
    
    if st.button("🗑️ Clear Cache / Downloads", use_container_width=True):
        cleaned = 0
        for f in os.listdir(DOWNLOADS_DIR):
            fp = os.path.join(DOWNLOADS_DIR, f)
            if os.path.isfile(fp):
                try:
                    os.remove(fp)
                    cleaned += 1
                except Exception:
                    pass
        st.session_state.pop("processed_file", None)
        st.success(f"Cleaned {cleaned} file(s).")
        st.rerun()

# Initialize session state keys
if "cached_url" not in st.session_state:
    st.session_state.cached_url = ""
if "video_info" not in st.session_state:
    st.session_state.video_info = None
if "fetch_error" not in st.session_state:
    st.session_state.fetch_error = None
if "processed_file" not in st.session_state:
    st.session_state.processed_file = None

# Input Section
col1, col2 = st.columns([5, 1], gap="small")
with col1:
    url_input = st.text_input(
        "YouTube Video URL:",
        placeholder="https://www.youtube.com/watch?v=...",
        help="Paste any standard YouTube video, Shorts, or Music URL."
    )
with col2:
    st.write("")
    st.write("")
    fetch_btn = st.button("🔍 Fetch Info", use_container_width=True)

# Trigger metadata fetch if URL changed or user clicked Fetch Info
normalized_url = url_input.strip() if url_input else ""
should_fetch = (fetch_btn or (normalized_url and normalized_url != st.session_state.cached_url))

if should_fetch and normalized_url:
    st.session_state.cached_url = normalized_url
    st.session_state.processed_file = None  # Reset previous download
    with st.spinner("Fetching video information and available formats..."):
        try:
            info = get_video_info(normalized_url)
            st.session_state.video_info = info
            st.session_state.fetch_error = None
        except Exception as e:
            st.session_state.video_info = None
            st.session_state.fetch_error = str(e)
elif not normalized_url:
    st.session_state.cached_url = ""
    st.session_state.video_info = None
    st.session_state.fetch_error = None

# Show error if fetching failed
if st.session_state.fetch_error:
    st.error(f"❌ {st.session_state.fetch_error}")

# Display Metadata & Download Controls if video info is available
video_info = st.session_state.video_info
if video_info:
    st.markdown("---")
    st.subheader("📺 Video Preview & Details")

    meta_col1, meta_col2 = st.columns([1, 2], gap="medium")
    
    with meta_col1:
        if video_info.get("thumbnail"):
            st.image(video_info["thumbnail"], use_container_width=True, caption="Video Thumbnail")
        else:
            st.info("No thumbnail available.")

    with meta_col2:
        st.markdown(f"### {video_info.get('title')}")
        st.markdown(f"**Channel:** {video_info.get('author')}")
        st.markdown(f"**Duration:** `{video_info.get('duration_str')}`")
        if video_info.get("view_count"):
            st.markdown(f"**Views:** `{video_info.get('view_count'):,}`")

    st.markdown("---")
    st.subheader("⚙️ Download Options")

    opt_col1, opt_col2 = st.columns(2)
    with opt_col1:
        download_mode = st.radio(
            "Select Format Mode:",
            options=["Video (MP4)", "Audio Only (MP3)"],
            help="Choose Video for merged video + audio MP4 file, or Audio Only for extracted MP3."
        )

    with opt_col2:
        if download_mode == "Video (MP4)":
            available_res = video_info.get("resolutions", ["Best Available"])
            selected_res = st.selectbox(
                "Select Resolution:",
                options=available_res,
                index=0,
                help="Select video resolution. The highest quality audio will be automatically merged into an MP4 container."
            )
        else:
            selected_res = None
            st.info("🎵 Audio will be downloaded in the best quality and converted to **192 kbps MP3** using FFmpeg.")

    # Processing & Download Action
    st.markdown("### 📥 Download Media")
    
    if st.button("🚀 Process & Prepare Download", type="primary", use_container_width=True):
        # Progress indication
        progress_placeholder = st.empty()
        status_placeholder = st.empty()
        
        with st.spinner("Processing download with yt-dlp... Please wait."):
            try:
                file_path, mime_type = download_media(
                    url=normalized_url,
                    mode=download_mode,
                    resolution=selected_res,
                    output_dir=DOWNLOADS_DIR
                )
                
                file_size = os.path.getsize(file_path)
                file_name = os.path.basename(file_path)
                
                # Store in session state so download button persists
                st.session_state.processed_file = {
                    "path": file_path,
                    "filename": file_name,
                    "mime_type": mime_type,
                    "size_str": format_size(file_size)
                }
                st.success("🎉 Media successfully processed and ready!")
            except Exception as e:
                st.error(f"❌ Download failed: {str(e)}")

    # Present browser download button when processed file is ready
    processed = st.session_state.get("processed_file")
    if processed and os.path.exists(processed["path"]):
        st.markdown(
            f"""
            <div class="success-box">
                <strong>Ready for download:</strong> {processed['filename']}<br>
                <strong>File Size:</strong> {processed['size_str']} | <strong>Format:</strong> {processed['mime_type']}
            </div>
            """,
            unsafe_allow_html=True
        )
        
        with open(processed["path"], "rb") as f:
            file_bytes = f.read()

        col_dl, col_del = st.columns([3, 1])
        with col_dl:
            st.download_button(
                label=f"💾 Save {processed['filename']} ({processed['size_str']})",
                data=file_bytes,
                file_name=processed["filename"],
                mime=processed["mime_type"],
                use_container_width=True
            )
        with col_del:
            if st.button("🗑️ Delete from Server", use_container_width=True, help="Removes the temporary file from the server immediately."):
                delete_file(processed["path"])
                st.session_state.processed_file = None
                st.info("Temporary file deleted from server.")
                st.rerun()

else:
    if not normalized_url and not st.session_state.fetch_error:
        st.info("💡 Paste a YouTube URL above and click **Fetch Info** or press Enter to preview metadata and select download options.")
