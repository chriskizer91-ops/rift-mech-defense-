"""Put a re-rendered stretch of frames into a finished video, keeping its sound.

    python3 game/cinematic/film/splice.py BASE.mp4 PATCH.mp4 START_FRAME OUT.mp4 [FPS]

BASE has picture and sound (record.py's output). PATCH is a silent part from record.py (OUT.partN.mp4, frames N..M).
Frames START..START+len(PATCH) of BASE are replaced; the sound is BASE's, untouched.
"""
import subprocess
import sys

base, patch, start, out = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
fps = int(sys.argv[5]) if len(sys.argv) > 5 else 24
n = int(subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets",
                        "-of", "csv=p=0", patch], capture_output=True, text=True, check=True).stdout.strip())
end = start + n
fc = (f"[0:v]trim=end_frame={start},setpts=PTS-STARTPTS[a];[1:v]setpts=PTS-STARTPTS[b];"
      f"[0:v]trim=start_frame={end},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]")
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", base, "-i", patch, "-filter_complex", fc, "-map", "[v]", "-map", "0:a",
                "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-maxrate", "5M", "-bufsize", "10M", "-pix_fmt", "yuv420p",
                "-r", str(fps), "-c:a", "copy", "-movflags", "+faststart", out], check=True)
print(f"replaced frames {start}..{end - 1} ({start / fps:.1f}–{end / fps:.1f} s) ->", out)
