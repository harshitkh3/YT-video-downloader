"""
Core YouTube downloader and metadata extractor using yt-dlp.
"""

import os
import re
import glob
import uuid
from pathlib import Path
from typing import Dict, Any, Optional, Tuple
import yt_dlp


def sanitize_filename(name: str) -> str:
    """Sanitize filename to avoid filesystem errors on Windows/Linux."""
    sanitized = re.sub(r'[\\/*?:"<>|]', "", name)
    return sanitized.strip()[:120]


def format_duration(seconds: Optional[int]) -> str:
    """Format duration in seconds into HH:MM:SS or MM:SS."""
    if seconds is None:
        return "Unknown"
    mins, secs = divmod(seconds, 60)
    hours, mins = divmod(mins, 60)
    if hours > 0:
        return f"{hours}:{mins:02d}:{secs:02d}"
    return f"{mins:02d}:{secs:02d}"


def format_size(bytes_val: Optional[int]) -> str:
    """Format bytes into human-readable string."""
    if not bytes_val:
        return "0 B"
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_val < 1024.0:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024.0
    return f"{bytes_val:.1f} TB"


def get_video_info(url: str) -> Dict[str, Any]:
    """
    Fetch video metadata and available resolutions without downloading.
    """
    if not url or not url.strip():
        raise ValueError("URL cannot be empty.")

    ydl_opts = {
        'extract_flat': False,
        'skip_download': True,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url.strip(), download=False)
    except yt_dlp.utils.DownloadError as e:
        msg = str(e)
        if "is not a valid URL" in msg or "Invalid URL" in msg:
            raise ValueError(f"Invalid YouTube URL: {url}")
        elif "Private video" in msg:
            raise ValueError("This video is private and cannot be accessed.")
        elif "Sign in to confirm your age" in msg or "age-restricted" in msg.lower():
            raise ValueError("This video is age-restricted and requires authentication.")
        elif "Video unavailable" in msg:
            raise ValueError("This video is unavailable or has been removed.")
        else:
            raise RuntimeError(f"Failed to fetch video information: {msg}")
    except Exception as e:
        raise RuntimeError(f"An unexpected error occurred while fetching info: {str(e)}")

    if not info:
        raise ValueError("No video information could be retrieved.")

    # Extract unique video resolutions (heights)
    formats = info.get('formats', [])
    available_heights = set()
    for f in formats:
        vcodec = f.get('vcodec')
        height = f.get('height')
        if vcodec and vcodec != 'none' and height and isinstance(height, int) and height > 0:
            available_heights.add(height)

    sorted_heights = sorted(list(available_heights), reverse=True)
    resolution_options = ["Best Available"]
    for h in sorted_heights:
        resolution_options.append(f"{h}p")

    duration_sec = info.get('duration')

    return {
        'id': info.get('id', 'video'),
        'title': info.get('title', 'Unknown Title'),
        'thumbnail': info.get('thumbnail', ''),
        'duration_str': format_duration(duration_sec),
        'duration_seconds': duration_sec,
        'author': info.get('uploader') or info.get('channel') or 'Unknown Channel',
        'view_count': info.get('view_count'),
        'description': info.get('description', '')[:300] if info.get('description') else '',
        'resolutions': resolution_options,
    }


def download_media(
    url: str,
    mode: str,
    resolution: Optional[str] = "Best Available",
    output_dir: Path | str = "downloads",
) -> Tuple[str, str, str]:
    """
    Download video or audio using yt-dlp.
    
    Returns:
      Tuple of (final_file_path, filename, mime_type)
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    unique_suffix = uuid.uuid4().hex[:8]
    outtmpl = str(output_path / f"%(title).80B-%(id)s-{unique_suffix}.%(ext)s")
    
    ydl_opts: Dict[str, Any] = {
        'outtmpl': outtmpl,
        'quiet': True,
        'no_warnings': True,
        'restrictfilenames': True,
        'windowsfilenames': True,
    }

    if mode == "Audio Only (MP3)":
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
        })
        mime_type = "audio/mpeg"
        expected_ext = ".mp3"
    else:
        # Video (MP4)
        if resolution and resolution != "Best Available":
            height_match = re.search(r'(\d+)p?', resolution)
            if height_match:
                height = int(height_match.group(1))
                format_spec = (
                    f"bestvideo[height<={height}][ext=mp4]+bestaudio[ext=m4a]/"
                    f"bestvideo[height<={height}]+bestaudio/"
                    f"best[height<={height}][ext=mp4]/best[height<={height}]/best"
                )
            else:
                format_spec = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
        else:
            format_spec = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best"

        ydl_opts.update({
            'format': format_spec,
            'merge_output_format': 'mp4',
        })
        mime_type = "video/mp4"
        expected_ext = ".mp4"

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url.strip(), download=True)
            prep_filename = ydl.prepare_filename(info)
            base, _ = os.path.splitext(prep_filename)
            final_path = base + expected_ext

            if not os.path.exists(final_path):
                # Check if it was saved without the expected extension
                if os.path.exists(prep_filename):
                    final_path = prep_filename
                else:
                    # Look for file with the unique suffix in output dir
                    matches = list(output_path.glob(f"*{unique_suffix}*"))
                    matches = [str(m) for m in matches if not str(m).endswith('.part')]
                    if matches:
                        final_path = matches[0]

            if not os.path.exists(final_path):
                raise FileNotFoundError(f"Downloaded file could not be located at {final_path}")

            filename = os.path.basename(final_path)
            return final_path, filename, mime_type

    except yt_dlp.utils.DownloadError as e:
        msg = str(e)
        if "Sign in to confirm your age" in msg or "age-restricted" in msg.lower():
            raise ValueError("This video is age-restricted and requires authentication.")
        elif "Private video" in msg:
            raise ValueError("This video is private.")
        elif "HTTP Error 403" in msg:
            raise RuntimeError("Access forbidden (HTTP 403). The video stream is restricted.")
        else:
            raise RuntimeError(f"Download failed: {msg}")
    except Exception as e:
        raise RuntimeError(f"An error occurred during download: {str(e)}")
