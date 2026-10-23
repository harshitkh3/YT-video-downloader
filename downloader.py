"""
downloader.py - Core YouTube download and metadata extraction logic using yt-dlp.
"""

import os
import re
import glob
from typing import Dict, Any, Optional, List, Tuple
import yt_dlp


def sanitize_filename(name: str) -> str:
    """Sanitize filename to avoid filesystem errors on Windows/Linux."""
    # Remove invalid characters
    sanitized = re.sub(r'[\\/*?:"<>|]', "", name)
    return sanitized.strip()[:150]


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
        return "Unknown"
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_val < 1024.0:
            return f"{bytes_val:.1f} {unit}"
        bytes_val /= 1024.0
    return f"{bytes_val:.1f} TB"


def get_video_info(url: str) -> Dict[str, Any]:
    """
    Fetch video metadata and available resolutions without downloading.
    
    Returns a dict with:
      - title
      - thumbnail
      - duration (formatted and raw seconds)
      - author (channel / uploader)
      - description
      - views
      - available_resolutions: list of available resolution strings (e.g. ['Best Available', '1080p', '720p', ...])
      - raw_formats: list of raw format dicts
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
        # Check if format has video
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
        'title': info.get('title', 'Unknown Title'),
        'thumbnail': info.get('thumbnail', ''),
        'duration_str': format_duration(duration_sec),
        'duration_seconds': duration_sec,
        'author': info.get('uploader') or info.get('channel') or 'Unknown Author',
        'view_count': info.get('view_count'),
        'description': info.get('description', ''),
        'resolutions': resolution_options,
        'id': info.get('id', 'video'),
    }


def download_media(
    url: str,
    mode: str,
    resolution: Optional[str] = "Best Available",
    output_dir: str = "downloads",
    progress_hook = None,
) -> Tuple[str, str]:
    """
    Download video or audio using yt-dlp.
    
    Parameters:
      - url: The YouTube video URL
      - mode: "Video (MP4)" or "Audio Only (MP3)"
      - resolution: Selected resolution (e.g. "Best Available", "1080p", "720p", etc.)
      - output_dir: Directory where the file should be saved
      - progress_hook: Optional callback for yt-dlp progress
      
    Returns:
      Tuple of (downloaded_file_path, file_mime_type)
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Template to ensure unique and clean output filename
    outtmpl = os.path.join(output_dir, "%(title).100B-%(id)s.%(ext)s")
    
    ydl_opts: Dict[str, Any] = {
        'outtmpl': outtmpl,
        'quiet': True,
        'no_warnings': True,
        'restrictfilenames': True,
        'windowsfilenames': True,
    }

    if progress_hook:
        ydl_opts['progress_hooks'] = [progress_hook]

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

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url.strip(), download=True)
            # Find the final target file
            filename = ydl.prepare_filename(info)
            
            # If audio mode was used, extension will be changed to mp3
            if mode == "Audio Only (MP3)":
                base, _ = os.path.splitext(filename)
                final_path = base + ".mp3"
            else:
                base, _ = os.path.splitext(filename)
                final_path = base + ".mp4"
                if not os.path.exists(final_path) and os.path.exists(filename):
                    final_path = filename

            if not os.path.exists(final_path):
                # Search for any matching file with the same video ID in output_dir
                video_id = info.get('id', '')
                if video_id:
                    matches = [f for f in glob.glob(os.path.join(output_dir, f"*{video_id}*")) if not f.endswith('.part')]
                    if matches:
                        final_path = matches[0]

            if not os.path.exists(final_path):
                raise FileNotFoundError(f"Downloaded file could not be located at {final_path}")

            return final_path, mime_type

    except yt_dlp.utils.DownloadError as e:
        msg = str(e)
        if "Sign in to confirm your age" in msg or "age-restricted" in msg.lower():
            raise ValueError("This video is age-restricted and requires authentication.")
        elif "Private video" in msg:
            raise ValueError("This video is private.")
        elif "HTTP Error 403" in msg:
            raise RuntimeError("Access forbidden (HTTP 403). The video stream might be restricted or blocked.")
        else:
            raise RuntimeError(f"Download failed: {msg}")
    except Exception as e:
        raise RuntimeError(f"An error occurred during download: {str(e)}")

if __name__ == '__main__':
    print(get_video_info("https://youtu.be/PoG5Pnk5t2c"))