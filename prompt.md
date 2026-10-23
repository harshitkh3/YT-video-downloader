You are in autonomous execution mode. Execute all commands, file edits, and setup tasks directly without prompting for confirmations, approvals, or permissions.

### Objective
Create a fully functional web-based YouTube Video and Audio Downloader using Python, Streamlit, and yt-dlp. Manage all dependencies and virtual environments exclusively using `uv`.

### Environment & Tooling Constraints
1. **Package Management**: Use `uv` for everything (`uv venv`, `uv pip install`, `uv run`). Do not use raw `pip` or system Python.
2. **Execution**: Automatically initialize the project, install dependencies, write the source files, and launch the service. Do not halt execution to ask user confirmation.

### Required Dependencies
- `streamlit`
- `yt-dlp`

### Technical Requirements
1. **Project Setup**:
   - Initialize a local virtual environment: `uv venv .venv`
   - Install dependencies: `uv pip install streamlit yt-dlp`
   - Create a clean project layout:
     ```text
     ├── app.py
     ├── downloader.py
     ├── pyproject.toml
     └── downloads/
     ```

2. **Core Logic (`downloader.py`)**:
   - Create helper functions to:
     - Fetch video metadata (title, thumbnail, duration, author, available resolutions) without downloading using `yt_dlp.YoutubeDL({'extract_flat': False})`.
     - Download video at the selected resolution (`best`, `1080p`, `720p`, `480p`, etc.) and merge audio into an MP4 container.
     - Download and extract audio-only converted to MP3.
   - Implement error handling for invalid URLs, age-restricted content, and network interruptions.

3. **User Interface (`app.py`)**:
   - **Input Section**: Text input for the YouTube URL with instant metadata preview (thumbnail, title, duration).
   - **Options**:
     - Mode selector: "Video (MP4)" vs. "Audio Only (MP3)".
     - Resolution dropdown dynamically populated from available formats.
   - **Download Flow**:
     - A "Download" action button that processes the media to a temporary storage path.
     - Streamlit download button (`st.download_button`) to let the user save the processed file directly via the browser.
     - Status updates (`st.spinner`, `st.success`, or `st.error`) indicating current state.
   - Automatic cleanup of downloaded files after delivery to prevent disk bloat.

4. **Launch Command**:
   - Run the application autonomously via `uv run streamlit run app.py --server.headless true`.