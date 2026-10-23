"""
FastAPI application for YouTube Video & Audio Downloader.
"""

import os
import sys
import time
from typing import Optional, List, Dict, Any
from pathlib import Path

# Ensure backend root is in sys.path
backend_root = str(Path(__file__).resolve().parent.parent)
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

try:
    from app.config import DOWNLOADS_DIR, CORS_ORIGINS, MAX_FILE_AGE_SECONDS
    from app.downloader import get_video_info, download_media, format_size
except ImportError:
    from config import DOWNLOADS_DIR, CORS_ORIGINS, MAX_FILE_AGE_SECONDS
    from downloader import get_video_info, download_media, format_size

app = FastAPI(
    title="YouTube Video & Audio Downloader API",
    version="1.0.0",
    description="Clean, modular API for downloading YouTube videos and extracting MP3 audio using yt-dlp.",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def cleanup_expired_files():
    """Delete files in DOWNLOADS_DIR older than MAX_FILE_AGE_SECONDS."""
    try:
        now = time.time()
        for item in DOWNLOADS_DIR.iterdir():
            if item.is_file():
                if now - item.stat().st_mtime > MAX_FILE_AGE_SECONDS:
                    try:
                        item.unlink()
                    except Exception:
                        pass
    except Exception:
        pass


class InfoRequest(BaseModel):
    url: str = Field(..., description="YouTube URL")


class DownloadRequest(BaseModel):
    url: str = Field(..., description="YouTube URL")
    mode: str = Field(default="Video (MP4)", description="'Video (MP4)' or 'Audio Only (MP3)'")
    resolution: Optional[str] = Field(default="Best Available", description="Resolution string (e.g. 1080p, 720p)")


@app.on_event("startup")
async def startup_event():
    cleanup_expired_files()


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time()}


@app.post("/api/info")
async def fetch_info(req: InfoRequest):
    """
    Extract video metadata without downloading.
    """
    try:
        info = get_video_info(req.url)
        return info
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/download")
async def trigger_download(req: DownloadRequest, background_tasks: BackgroundTasks):
    """
    Process and download media to server, returning file details for browser download.
    """
    background_tasks.add_task(cleanup_expired_files)
    
    try:
        file_path, filename, mime_type = download_media(
            url=req.url,
            mode=req.mode,
            resolution=req.resolution,
            output_dir=DOWNLOADS_DIR,
        )
        
        file_size = os.path.getsize(file_path)
        
        return {
            "success": True,
            "filename": filename,
            "download_url": f"/api/file/{filename}",
            "file_size": file_size,
            "size_str": format_size(file_size),
            "mime_type": mime_type,
            "mode": req.mode,
            "resolution": req.resolution,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/file/{filename}")
async def serve_file(filename: str):
    """
    Serve the downloaded file as a browser attachment.
    """
    # Prevent directory traversal
    safe_filename = os.path.basename(filename)
    file_path = DOWNLOADS_DIR / safe_filename
    
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found or has expired.")

    # Determine media type
    if safe_filename.endswith(".mp3"):
        media_type = "audio/mpeg"
    else:
        media_type = "video/mp4"

    return FileResponse(
        path=str(file_path),
        filename=safe_filename,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'},
    )


@app.delete("/api/file/{filename}")
async def delete_file(filename: str):
    """
    Delete a specific file from the server.
    """
    safe_filename = os.path.basename(filename)
    file_path = DOWNLOADS_DIR / safe_filename
    
    if file_path.is_file():
        try:
            file_path.unlink()
            return {"success": True, "message": f"Deleted {safe_filename}"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
    else:
        raise HTTPException(status_code=404, detail="File not found.")


@app.get("/api/cache/stats")
async def cache_stats():
    """
    Return total number of cached files and total size.
    """
    count = 0
    total_bytes = 0
    for item in DOWNLOADS_DIR.iterdir():
        if item.is_file():
            count += 1
            total_bytes += item.stat().st_size
            
    return {
        "file_count": count,
        "total_bytes": total_bytes,
        "size_str": format_size(total_bytes),
    }


@app.delete("/api/cache")
async def clear_cache():
    """
    Clear all cached files in the downloads directory.
    """
    deleted_count = 0
    for item in DOWNLOADS_DIR.iterdir():
        if item.is_file():
            try:
                item.unlink()
                deleted_count += 1
            except Exception:
                pass
    return {"success": True, "deleted_count": deleted_count}


# Optional: Mount built React frontend if dist directory exists
try:
    from fastapi.staticfiles import StaticFiles
    frontend_dist_candidates = [
        Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
        Path(__file__).resolve().parent.parent / "frontend_dist",
        Path("/app/frontend_dist"),
    ]

    for candidate in frontend_dist_candidates:
        if candidate.is_dir() and (candidate / "index.html").is_file():
            app.mount("/", StaticFiles(directory=str(candidate), html=True), name="frontend")
            break
except Exception:
    pass

