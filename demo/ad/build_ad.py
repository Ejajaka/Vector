"""Build a 35-40s Vector advertisement.

Output:
  demo/ad/vector-ad-1080p.mp4
  demo/ad/vector-ad-720p.mp4
  demo/ad/poster.jpg
  demo/ad/captions.srt
"""

from __future__ import annotations

import asyncio
import math
import shutil
import subprocess
import wave
from pathlib import Path

import edge_tts
import imageio_ffmpeg
import numpy as np
from mutagen.mp3 import MP3
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[1]
SCREENS = ROOT / "screens"
AUDIO = ROOT / "audio"
FRAMES = ROOT / "frames"
OUT = ROOT

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1920, 1080, 30
BG = (8, 9, 10)
INK = (247, 248, 248)
MUTED = (138, 143, 152)
FAINT = (98, 102, 109)
ACCENT = (113, 112, 255)
ACCENT_2 = (94, 106, 210)
LINE = (30, 31, 34)

INTER = Path(r"C:\Users\sanje\AppData\Local\Temp\opencode\Inter.ttf")
FALLBACK_BOLD = "C:/Windows/Fonts/seguisb.ttf"
FALLBACK_REG = "C:/Windows/Fonts/segoeui.ttf"

SCENES = [
    {
        "kind": "intro",
        "image": "overview-clean.png",
        "eyebrow": "VECTOR",
        "headline": "Most AI tools start with a prompt.\nVector starts with the truth.",
        "sub": "Requirement engineering for teams who ship.",
        "vo": "Most AI tools start with a prompt. Vector starts with the truth.",
        "caption": "Most AI tools start with a prompt. Vector starts with the truth.",
    },
    {
        "kind": "screen",
        "image": "requirements.png",
        "eyebrow": "01 / BRIEF",
        "headline": "Every requirement.\nEvery source.",
        "sub": "Traceable from page to character.",
        "vo": "Drop in a brief. Vector extracts every requirement, with the source attached.",
        "caption": "Drop in a brief. Vector extracts every requirement, with the source attached.",
    },
    {
        "kind": "screen",
        "image": "review.png",
        "eyebrow": "02 / REVIEW",
        "headline": "Catch what the\nbrief forgot.",
        "sub": "Edge cases stay suggestions until you accept them.",
        "vo": "It finds the gaps a generator would have guessed at. You decide what gets accepted.",
        "caption": "It finds the gaps a generator would have guessed at. You decide what gets accepted.",
    },
    {
        "kind": "screen",
        "image": "prompt.png",
        "eyebrow": "03 / PROMPT",
        "headline": "One complete,\nversioned prompt.",
        "sub": "Ready for Base44, v0, Bolt or Figma.",
        "vo": "Then it writes one complete, versioned prompt. Ready for Base44, v0, Bolt or Figma.",
        "caption": "Then it writes one complete, versioned prompt. Ready for Base44, v0, Bolt or Figma.",
    },
    {
        "kind": "screen",
        "image": "editor.png",
        "eyebrow": "04 / BUILD",
        "headline": "From prompt\nto interface.",
        "sub": "One workspace from brief to build.",
        "vo": "From a rough sentence to an interface your team can defend.",
        "caption": "From a rough sentence to an interface your team can defend.",
    },
    {
        "kind": "outro",
        "image": None,
        "eyebrow": "VECTOR",
        "headline": "The requirement-to-interface system.",
        "sub": "Two projects free. No card required.",
        "vo": "Vector. The requirement-to-interface system. Start free at vector dot I S A dot dev.",
        "caption": "Vector. The requirement-to-interface system. Start free at vector.is-a.dev.",
    },
]

SOURCE_SCREENS = {
    "overview-clean.png": ROOT / "screens" / "overview-clean.png",
    "requirements.png": Path(r"C:\Users\sanje\OneDrive\Desktop\Amrita\Sem 5\NLP\project_NLP\prototype\preview-requirements.png"),
    "review.png": Path(r"C:\Users\sanje\OneDrive\Desktop\Amrita\Sem 5\NLP\project_NLP\prototype\preview-review.png"),
    "prompt.png": Path(r"C:\Users\sanje\OneDrive\Desktop\Amrita\Sem 5\NLP\project_NLP\prototype\preview-prompt.png"),
    "editor.png": Path(r"C:\Users\sanje\OneDrive\Desktop\Amrita\Sem 5\NLP\project_NLP\prototype\preview-editor.png"),
}


def font(size: int, weight: int = 500) -> ImageFont.FreeTypeFont:
    if INTER.exists():
        f = ImageFont.truetype(str(INTER), size)
        try:
            f.set_variation_by_axes([14, weight])
        except Exception:
            pass
        return f
    return ImageFont.truetype(FALLBACK_BOLD if weight >= 600 else FALLBACK_REG, size)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split()
        if not words:
            lines.append("")
            continue
        current = words[0]
        for word in words[1:]:
            trial = f"{current} {word}"
            if draw.textlength(trial, font=f) <= max_width:
                current = trial
            else:
                lines.append(current)
                current = word
        lines.append(current)
    return lines


def draw_text_block(
    overlay: Image.Image,
    x: int,
    y: int,
    lines: list[str],
    f: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int],
    line_height: int,
    alpha: int = 255,
) -> int:
    draw = ImageDraw.Draw(overlay)
    for index, line in enumerate(lines):
        draw.text((x, y + index * line_height), line, font=f, fill=(*fill, alpha))
    return y + len(lines) * line_height


_BG_CACHE: Image.Image | None = None


def make_background() -> Image.Image:
    global _BG_CACHE
    if _BG_CACHE is not None:
        return _BG_CACHE
    bg = Image.new("RGB", (W, H), BG)
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((-360, -420, 900, 760), fill=(*ACCENT, 26))
    gd.ellipse((980, 560, 2100, 1500), fill=(*ACCENT_2, 12))
    glow = glow.filter(ImageFilter.GaussianBlur(170))
    bg = Image.alpha_composite(bg.convert("RGBA"), glow).convert("RGB")

    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, 72):
        gd.line((x, 0, x, H), fill=(255, 255, 255, 5), width=1)
    for y in range(0, H, 72):
        gd.line((0, y, W, y), fill=(255, 255, 255, 5), width=1)
    _BG_CACHE = Image.alpha_composite(bg.convert("RGBA"), grid).convert("RGB")
    return _BG_CACHE


def make_logo(size: int) -> Image.Image:
    logo = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gradient = Image.new("RGB", (size, size), ACCENT_2)
    ld = ImageDraw.Draw(gradient)
    for y in range(size):
        t = y / max(1, size - 1)
        ld.line((0, y, size, y), fill=(int(143 - 49 * t), int(142 - 36 * t), int(255 - 45 * t)))
    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.26), fill=255)
    logo.paste(gradient, (0, 0), mask)
    draw = ImageDraw.Draw(logo)
    c = size // 2
    r = size * 0.22
    draw.line((c, c - r, c + r, c, c, c + r, c - r, c, c, c - r), fill=(255, 255, 255, 255), width=max(2, size // 16))
    return logo


def make_shadow(w: int, h: int, radius: int) -> Image.Image:
    shadow = Image.new("RGBA", (w + 100, h + 100), (0, 0, 0, 0))
    d = ImageDraw.Draw(shadow)
    d.rounded_rectangle((50, 50, 50 + w, 50 + h), radius=radius, fill=(0, 0, 0, 210))
    return shadow.filter(ImageFilter.GaussianBlur(40))


def screenshot_card(path: Path, width: int, height: int, zoom: float, drift: float) -> Image.Image:
    src = Image.open(path).convert("RGB")
    scale = max(width / src.width, height / src.height) * zoom
    resized = src.resize((max(width, int(src.width * scale)), max(height, int(src.height * scale))), Image.LANCZOS)
    left = (resized.width - width) // 2 + int(drift * 8)
    top = (resized.height - height) // 2 + int(drift * -5)
    crop = resized.crop((left, top, left + width, top + height))
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width - 1, height - 1), radius=12, fill=255)
    card = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    card.paste(crop, (0, 0), mask)
    ImageDraw.Draw(card).rounded_rectangle((0, 0, width - 1, height - 1), radius=12, outline=(*LINE, 255), width=1)
    return card


def draw_logo_row(base: Image.Image, x: int, y: int, size: int, label: str, alpha: int = 255) -> None:
    logo = make_logo(size)
    if alpha < 255:
        a = logo.getchannel("A").point(lambda v: int(v * alpha / 255))
        logo.putalpha(a)
    base.alpha_composite(logo, (x, y))
    draw = ImageDraw.Draw(base)
    draw.text((x + size + 12, y + size // 2 - 11), label, font=font(20, 600), fill=(*INK, alpha))


def ease_out(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return 1.0 - (1.0 - value) ** 3


def alpha_at(local_t: float, delay: float, duration: float = 0.42) -> int:
    return int(255 * max(0.0, min(1.0, (local_t - delay) / duration)))


def render_screen_frame(scene: dict, path: Path, local_t: float, duration: float, index: int, total: int) -> Image.Image:
    frame = make_background().convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Card, matched to the 16:10 screenshot so no UI is clipped.
    card_w, card_h = 1230, 769
    card_y = (H - card_h) // 2
    progress = local_t / max(0.001, duration)
    enter = ease_out(local_t / 0.8)
    card_x = 610 + int(46 * (1.0 - enter))
    zoom = 1.0 + 0.03 * progress
    drift = progress - 0.5
    card = screenshot_card(path, card_w, card_h, zoom, drift)
    shadow = make_shadow(card_w, card_h, 12)
    frame.alpha_composite(shadow, (card_x - 50, card_y - 50))
    frame.alpha_composite(card, (card_x, card_y))

    # Text
    eyebrow_font = font(13, 600)
    head_font = font(56, 600)
    sub_font = font(22, 450)
    head_lines = wrap(draw, scene["headline"], head_font, 510)
    sub_lines = wrap(draw, scene["sub"], sub_font, 460)
    block_h = 28 + len(head_lines) * 62 + 24 + len(sub_lines) * 32
    top = max(220, (H - block_h) // 2 - 15)
    text_x = 90

    draw.text((text_x, top), scene["eyebrow"], font=eyebrow_font, fill=(*ACCENT, alpha_at(local_t, 0.10)))
    y = top + 34
    for i, line in enumerate(head_lines):
        draw.text((text_x, y), line, font=head_font, fill=(*INK, alpha_at(local_t, 0.20 + 0.08 * i)))
        y += 62
    y += 18
    for i, line in enumerate(sub_lines):
        draw.text((text_x, y), line, font=sub_font, fill=(*MUTED, alpha_at(local_t, 0.42 + 0.05 * i)))
        y += 32

    # Wordmark + slide count + progress
    draw_logo_row(overlay, 90, 62, 30, "Vector")
    draw.text((text_x, H - 66), f"{index + 1:02d} / {total:02d}", font=font(12, 500), fill=(*FAINT, 255))
    bar_w = int((W - 180) * ((index + progress) / total))
    draw.rectangle((90, H - 36, 90 + bar_w, H - 34), fill=(*ACCENT, 255))
    draw.rectangle((90 + bar_w, H - 36, W - 90, H - 34), fill=(*LINE, 255))

    frame = Image.alpha_composite(frame, overlay).convert("RGB")
    return frame


def render_intro_frame(scene: dict, path: Path, local_t: float, duration: float, index: int, total: int) -> Image.Image:
    frame = make_background().convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # A dimmed product still on the right.
    card_w, card_h = 1000, 625
    enter = ease_out(local_t / 0.9)
    card = screenshot_card(path, card_w, card_h, 1.0 + 0.025 * (local_t / duration), 0)
    dim = Image.new("RGBA", (card_w, card_h), (8, 9, 10, 130))
    card = Image.alpha_composite(card, dim)
    frame.alpha_composite(card, (830 + int(54 * (1.0 - enter)), (H - card_h) // 2 - 10))

    draw_logo_row(overlay, 90, 62, 30, "Vector")
    draw.text((90, 250), "VECTOR", font=font(13, 600), fill=(*ACCENT, alpha_at(local_t, 0.08)))
    grow = font(58, 500)
    lines1 = ["Most AI tools start", "with a prompt."]
    lines2 = ["Vector starts", "with the truth."]
    y = 292
    for i, line in enumerate(lines1):
        draw.text((90, y), line, font=grow, fill=(*MUTED, alpha_at(local_t, 0.18 + 0.09 * i)))
        y += 62
    y += 8
    for i, line in enumerate(lines2):
        draw.text((90, y), line, font=font(58, 600), fill=(*INK, alpha_at(local_t, 0.42 + 0.09 * i)))
        y += 62
    draw.text(
        (90, y + 18),
        "Requirement engineering for teams who ship.",
        font=font(21, 450),
        fill=(*MUTED, alpha_at(local_t, 0.78)),
    )

    draw.text((90, H - 66), f"{index + 1:02d} / {total:02d}", font=font(12, 500), fill=(*FAINT, 255))
    progress = (index + local_t / duration) / total
    draw.rectangle((90, H - 36, 90 + int((W - 180) * progress), H - 34), fill=(*ACCENT, 255))

    return Image.alpha_composite(frame, overlay).convert("RGB")


def render_outro_frame(scene: dict, local_t: float, duration: float, index: int, total: int) -> Image.Image:
    frame = make_background().convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    draw_logo_row(overlay, 90, 70, 44, "Vector")

    # One product still, floating on the right.
    enter = ease_out(local_t / 1.0)
    card_w, card_h = 820, 512
    card = screenshot_card(SCREENS / "prompt.png", card_w, card_h, 1.0 + 0.02 * (local_t / duration), 0.0)
    card = card.rotate(-3, resample=Image.BICUBIC, expand=True)
    alpha = card.getchannel("A").point(lambda v: int(v * 232 / 255))
    card.putalpha(alpha)
    left = 1470 - card.width // 2
    top = 420 - card.height // 2 + int(34 * (1.0 - enter))
    shadow = make_shadow(card.width, card.height, 10)
    frame.alpha_composite(shadow, (left - 50, top - 50))
    frame.alpha_composite(card, (left, top))

    draw.text((90, 250), "VECTOR", font=font(13, 600), fill=(*ACCENT, alpha_at(local_t, 0.10)))
    head_font = font(66, 600)
    lines = wrap(draw, "The requirement-to-interface system.", head_font, 760)
    y = 300
    for i, line in enumerate(lines):
        draw.text((90, y), line, font=head_font, fill=(*INK, alpha_at(local_t, 0.18 + 0.09 * i)))
        y += 74

    draw.text(
        (90, y + 20),
        "Two projects free. No card required.",
        font=font(23, 450),
        fill=(*MUTED, alpha_at(local_t, 0.52)),
    )

    # CTA chip
    cta = "Start free at vector.is-a.dev"
    cta_font = font(20, 600)
    cw = int(draw.textlength(cta, font=cta_font)) + 52
    cta_alpha = alpha_at(local_t, 0.72)
    draw.rounded_rectangle((90, y + 84, 90 + cw, y + 132), radius=8, fill=(*ACCENT_2, cta_alpha))
    draw.text((116, y + 99), cta, font=cta_font, fill=(*INK, cta_alpha))

    draw.text((90, H - 70), "VECTOR / REQUIREMENT-TO-INTERFACE", font=font(11, 500), fill=(*FAINT, 255))
    draw.text((90, H - 54), "20 NOV 2026", font=font(11, 500), fill=(*FAINT, 255))

    return Image.alpha_composite(frame, overlay).convert("RGB")


async def synth(text: str, path: Path) -> None:
    for voice in ("en-US-AndrewNeural", "en-US-AriaNeural", "en-US-AvaNeural"):
        try:
            communicate = edge_tts.Communicate(text, voice, rate="+2%")
            await communicate.save(str(path))
            if path.exists() and path.stat().st_size > 1000:
                return
        except Exception:
            continue
    raise RuntimeError(f"Could not synthesise: {text[:60]}")


def audio_duration(path: Path) -> float:
    return MP3(str(path)).info.length


def run(args: list[str]) -> None:
    result = subprocess.run(args, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(result.stderr[-2000:])


def make_music(duration: float) -> Path:
    sr = 44100
    t = np.arange(int(sr * duration)) / sr
    # Soft minor progression: Am, F, C, G.
    roots = [110.0, 87.31, 130.81, 98.0]
    pad = np.zeros_like(t)
    segment = duration / len(roots)
    for i, root in enumerate(roots):
        start = i * segment
        end = min(duration, (i + 1) * segment + 0.8)
        mask = (t >= start) & (t < end)
        local = t[mask] - start
        env = np.minimum(1.0, local / 1.2) * np.minimum(1.0, (end - start - local) / 1.2)
        env = np.clip(env, 0, 1)
        tone = (
            np.sin(2 * np.pi * root * local) * 0.5
            + np.sin(2 * np.pi * root * 1.5 * local) * 0.22
            + np.sin(2 * np.pi * root * 2 * local) * 0.14
        )
        pad[mask] += tone * env * 0.16
    # Slow pulse.
    pulse = np.exp(-((t % 2.0) / 0.09)) * np.sin(2 * np.pi * 55 * t) * 0.10
    # Air.
    rng = np.random.default_rng(7)
    air = rng.normal(0, 1, len(t))
    air = np.convolve(air, np.ones(600) / 600, mode="same") * 0.02
    mono = pad + pulse + air
    # Gentle fade.
    fade = np.minimum(1.0, t / 1.5) * np.minimum(1.0, (duration - t) / 2.0)
    mono *= fade
    left = mono
    right = np.roll(mono, int(sr * 0.008)) * 0.92
    stereo = np.stack([left, right], axis=1)
    stereo = np.clip(stereo / max(0.001, np.max(np.abs(stereo))) * 0.55, -1, 1)
    path = AUDIO / "music.wav"
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(sr)
        handle.writeframes((stereo * 32767).astype(np.int16).tobytes())
    return path


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    for folder in (SCREENS, AUDIO, FRAMES):
        folder.mkdir(exist_ok=True)
    if FRAMES.exists():
        for f in FRAMES.glob("*.jpg"):
            f.unlink()

    for name, src in SOURCE_SCREENS.items():
        dst = SCREENS / name
        if src.resolve() == dst.resolve():
            continue
        if not dst.exists() or dst.stat().st_size < 1000:
            shutil.copy2(src, dst)

    # Voiceover timing first.
    for i, scene in enumerate(SCENES):
        mp3 = AUDIO / f"{i:02d}.mp3"
        if not mp3.exists() or mp3.stat().st_size < 1000:
            asyncio.run(synth(scene["vo"], mp3))
        scene["audio"] = audio_duration(mp3)
        scene["duration"] = max(4.6, 0.5 + scene["audio"] + 0.55)
        print(f"{i}: {scene['duration']:.2f}s  {scene['vo'][:50]}")

    total_duration = sum(scene["duration"] for scene in SCENES)
    print(f"total {total_duration:.2f}s")

    global_index = 0
    total_frames = sum(round(scene["duration"] * FPS) for scene in SCENES)
    for i, scene in enumerate(SCENES):
        frames = round(scene["duration"] * FPS)
        for f in range(frames):
            local_t = f / FPS
            if scene["kind"] == "intro":
                image = render_intro_frame(scene, SCREENS / scene["image"], local_t, scene["duration"], i, len(SCENES))
            elif scene["kind"] == "outro":
                image = render_outro_frame(scene, local_t, scene["duration"], i, len(SCENES))
            else:
                image = render_screen_frame(scene, SCREENS / scene["image"], local_t, scene["duration"], i, len(SCENES))
            # Fade from/to black for smooth scene transitions.
            fade_in = min(1.0, local_t / 0.35)
            fade_out = min(1.0, (scene["duration"] - local_t) / 0.35)
            alpha = min(fade_in, fade_out)
            if alpha < 1.0:
                black = Image.new("RGB", (W, H), (0, 0, 0))
                image = Image.blend(black, image, max(0.0, alpha))
            image.save(FRAMES / f"{global_index:05d}.jpg", quality=92, optimize=False)
            global_index += 1
        print(f"scene {i + 1}/{len(SCENES)} rendered")

    # Narration track, one padded segment per scene.
    parts: list[Path] = []
    for i, scene in enumerate(SCENES):
        part = AUDIO / f"{i:02d}-pad.wav"
        run([
            FFMPEG, "-y", "-i", str(AUDIO / f"{i:02d}.mp3"),
            "-af", "adelay=500|500,apad=pad_dur=0.55",
            "-t", f"{scene['duration']:.3f}", "-ar", "44100", "-ac", "2", str(part),
        ])
        parts.append(part)
    concat = AUDIO / "parts.txt"
    concat.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
    narration = AUDIO / "narration.wav"
    run([FFMPEG, "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-c", "copy", str(narration)])

    music = make_music(total_duration)

    video_only = OUT / "video-only.mp4"
    run([
        FFMPEG, "-y", "-framerate", str(FPS), "-i", str(FRAMES / "%05d.jpg"),
        "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
        "-movflags", "+faststart", str(video_only),
    ])

    master = OUT / "vector-ad-1080p.mp4"
    run([
        FFMPEG, "-y", "-i", str(video_only), "-i", str(narration), "-i", str(music),
        "-filter_complex",
        f"[2:a]volume=0.15,afade=t=in:st=0:d=1.2,afade=t=out:st={max(0, total_duration - 2):.2f}:d=2[m];"
        "[1:a]volume=1.9,highpass=f=85,acompressor=threshold=-18dB:ratio=2.5:attack=8:release=180:makeup=2[n];"
        "[n][m]amix=inputs=2:duration=first:dropout_transition=2:normalize=0,"
        "loudnorm=I=-16:TP=-1.5:LRA=11[a]",
        "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
        "-shortest", "-movflags", "+faststart", str(master),
    ])

    # 720p web cut.
    web = OUT / "vector-ad-720p.mp4"
    run([
        FFMPEG, "-y", "-i", str(master), "-vf", "scale=1280:720:flags=lanczos",
        "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-c:a", "aac", "-b:a", "128k",
        "-movflags", "+faststart", str(web),
    ])

    # Poster frame.
    posters = sorted(FRAMES.glob("*.jpg"))
    if posters:
        poster_index = min(len(posters) - 1, round(total_frames * 0.06))
        Image.open(posters[poster_index]).save(OUT / "poster.jpg", quality=92)

    # Captions.
    srt = []
    cursor = 0.0
    for i, scene in enumerate(SCENES):
        start = cursor + 0.5
        end = cursor + 0.5 + scene["audio"]
        srt.append(f"{i + 1}\n{to_srt(start)} --> {to_srt(end)}\n{scene['caption']}\n")
        cursor += scene["duration"]
    (OUT / "captions.srt").write_text("\n".join(srt), encoding="utf-8")

    print("wrote", master)
    print("wrote", web)
    print("duration", total_duration)


def to_srt(seconds: float) -> str:
    ms = int(round(seconds * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


if __name__ == "__main__":
    main()
