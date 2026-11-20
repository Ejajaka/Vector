"""Build the local template and asset library.

Only public, permissively licensed assets are downloaded. Figma Community
entries are stored as links, not copied files: each file keeps its own license
and must be opened on Figma.
"""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "template-library"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"


def get(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=40) as response:
        return response.read()


FIGMA = [
    # Dashboards
    ("Dashboards", "DashStack - Free Admin Dashboard UI Kit", "https://www.figma.com/community/file/1324762163080748317/dashstack-free-admin-dashboard-ui-kit-admin-dashboard-ui-kit-admin-dashboard"),
    ("Dashboards", "Dashboard UI Kit - Free Admin Dashboard", "https://www.figma.com/community/file/1210542873091115123/dashboard-ui-kit-dashboard-free-admin-dashboard"),
    ("Dashboards", "BankDash - Dashboard UI Kit", "https://www.figma.com/community/file/1323695683687017923/bankdash-dashboard-ui-kit-admin-template-dashboard-admin-dashboard"),
    ("Dashboards", "Free Dark Admin Dashboards", "https://www.figma.com/community/file/1325597018063319916/free-dark-admin-dashboards"),
    ("Dashboards", "Free Figma Tailwind Admin Dashboard - TailAdmin", "https://www.figma.com/community/file/1214477970819985778/free-figma-tailwind-admin-dashboard-tailadmin"),
    ("Dashboards", "SAAS Dashboard by Jiangyu", "https://www.figma.com/community/file/1065510379888107603/saas-dashboard"),
    ("Dashboards", "Metrix SaaS Dashboard UI Kit", "https://www.figma.com/community/file/1149477096761797772/metrix-saas-dashboard-ui-kit"),
    ("Dashboards", "SaaS Selling Dashboard / Admin Dashboard", "https://www.figma.com/community/file/1140272887408902677/saas-selling-dashboard-admin-dashboard"),

    # Landing / marketing
    ("Landing pages", "Positivus Landing Page Design", "https://www.figma.com/community/file/1230604708032389430/positivus-landing-page-design"),
    ("Landing pages", "50+ Landing Page Designs", "https://www.figma.com/community/file/1127302394641561751/50-landing-page-designs"),
    ("Landing pages", "Minimal Landing Page Design", "https://www.figma.com/community/file/1222060007934600841/minimal-landing-page-design-website-home-page-design-agency-website-ui-design"),
    ("Landing pages", "Panto - Furniture Landing Page", "https://www.figma.com/community/file/1061732519182077733/panto-furniture-landing-page-design"),
    ("Landing pages", "16 Free Landing Page Designs", "https://www.figma.com/community/file/1203891414567587586/16-free-landing-page-design"),
    ("Landing pages", "Landing Page Kit - 13 Landing Pages", "https://www.figma.com/community/file/1222100666260862670/landing-page-kit-free-13-landing-pages-collection-for-ui-ux-design"),

    # Commerce
    ("Commerce", "E-commerce UI - Figma Ecommerce UI Kit", "https://www.figma.com/community/file/1102233251923362930/e-commerce-ui-figma-ecommerce-ui-kit-demo-version"),
    ("Commerce", "eCommerce Website - Interior Landing Page", "https://www.figma.com/community/file/1252561852327562039/ecommerce-website-web-page-design-ui-kit-interior-landing-page"),
    ("Commerce", "Ecommerce Website Design", "https://www.figma.com/community/file/1184498378829556800/ecommerce-website-design"),
    ("Commerce", "Shoppe - Clothing Store UI", "https://www.figma.com/community/file/1321464360558173342/shoppe-ecommerce-clothing-fashion-store-multi-purpose-ui-mobile-app-design"),
    ("Commerce", "eCommerce App UI Kit", "https://www.figma.com/community/file/1264098337558102933/ecommerce-app-ui-kit-case-study-ecommerce-mobile-app-ui-kit"),
    ("Commerce", "Mobile eCommerce Clothing Store", "https://www.figma.com/community/file/1169625825293818878/mobile-ecommerce-clothing-store-app-design"),

    # Auth
    ("Auth", "20 Screen Login & Register Mobile App", "https://www.figma.com/community/file/1370757927948360864/20-screen-login-register-mobile-app"),
    ("Auth", "LOGIFY - Web Login UI Kit", "https://www.figma.com/community/file/1019155319918719973/logify-web-login-ui-kit"),
    ("Auth", "Social Login Buttons", "https://www.figma.com/community/file/945702178038082375/social-login-buttons"),
    ("Auth", "Login Page Perfect UI (Freebie)", "https://www.figma.com/community/file/1050476989533233612/login-page-perfect-ui-freebie"),
    ("Auth", "Login Page", "https://www.figma.com/community/file/1249321675959577741/login-page"),
    ("Auth", "Login Page Design", "https://www.figma.com/community/file/872144934711314532/login-page-design"),

    # Data
    ("Data tables", "Figma Data Tables UI Kit - Untitled UI", "https://www.figma.com/community/file/1332203037536263387/figma-data-tables-ui-kit-untitled-ui"),
    ("Data tables", "UI Prep Data Tables", "https://www.figma.com/community/file/888102678933348280/ui-prep-data-tables"),
    ("Data tables", "Data Table Design Components", "https://www.figma.com/community/file/1021406552622495462/data-table-design-components-free-ui-kit"),
    ("Data tables", "Data Table", "https://www.figma.com/community/file/786976918221602322/data-table"),
    ("Data tables", "Data Table v2", "https://www.figma.com/community/file/828671424087108521/data-table-v2"),
    ("Data tables", "Data Table v3 (Interactive)", "https://www.figma.com/community/file/1061557188660055783/data-table-v3-interactive"),

    # Chat / collaboration
    ("Collaboration", "ChatGPT UI Kit - AI Chat", "https://www.figma.com/community/file/1226866936281840601/chatgpt-ui-kit-ai-chat"),
    ("Collaboration", "ChatGPT Chat Bot App UI", "https://www.figma.com/community/file/1212265978123382691/chatgpt-chat-bot-app-ui"),
    ("Collaboration", "ChatGPT v4.5 Chat AI", "https://www.figma.com/community/file/1340700436296746118/chatgpt-v4-5-chat-ai-ai-chatbot"),
    ("Collaboration", "BrainBox AI ChatBot Mobile App", "https://www.figma.com/community/file/1316069776447695879/brainbox-ai-chatbot-mobile-app-full-100-free-ui-kit"),
    ("Collaboration", "iMessage Chat Bubbles", "https://www.figma.com/community/file/985048216078661055/imessage-chat-bubbles"),
    ("Collaboration", "Live Chat / AI Chatbot Component", "https://www.figma.com/community/file/1348071404653891411/live-chat-ai-chatbot-component-for-website-prototypes"),

    # Mobile
    ("Mobile", "Mobile Apps - Prototyping Kit", "https://www.figma.com/community/file/1129468881607079432/mobile-apps-prototyping-kit"),
    ("Mobile", "Coffee Shop Mobile App Design", "https://www.figma.com/community/file/1116708627748807811/coffee-shop-mobile-app-design"),

    # Portfolio / case study
    ("Portfolio", "Portfolio Template - Anima", "https://www.figma.com/community/file/1095695980466714349/portfolio-template-edit-portfolio-export-figma-to-html-publish-portfolio-to-domain-in-no-time"),
    ("Portfolio", "Portfolio Design", "https://www.figma.com/community/file/1182197835889504018/portfolio-design"),
    ("Portfolio", "UX Case Study Template", "https://www.figma.com/community/file/1067428863353945820/ux-case-study-template-free"),

    # Components and utilities
    ("Components", "iOS Keyboards", "https://www.figma.com/community/file/768726574016795759/ios-keyboards"),
    ("Mobile", "Food Delivery App", "https://www.figma.com/community/file/1231521889522325040/food-delivery-app"),
    ("Mobile", "Weather App UI Design", "https://www.figma.com/community/file/1100826294536456295/weather-app-ui-design"),
    ("Mobile", "Task Management & To-do List App", "https://www.figma.com/community/file/1143575071825582037/task-management-to-do-list-app"),
    ("Mobile", "WhatsApp UI Screens", "https://www.figma.com/community/file/874576344344319149/whatsapp-ui-screens"),
    ("Portfolio", "Product Designer Portfolio Website", "https://www.figma.com/community/file/1299737213921915682/portfolio-product-designer-portfolio-website"),
    ("Portfolio", "Personal Website Portfolio", "https://www.figma.com/community/file/1351551318943737601/personal-website-portfolio"),
    ("Portfolio", "Developer Portfolio Website", "https://www.figma.com/community/file/1308487677104759760/developer-portfolio-website-design"),
    ("Components", "Charts UI Kit", "https://www.figma.com/community/file/988105631489720603/charts-ui-kit"),
    ("Components", "Material 3 Design Kit", "https://www.figma.com/community/file/1035203688168086460/material-3-design-kit"),
    ("Components", "Calendar - Auto Layout", "https://www.figma.com/community/file/806493111803401210/calendar-auto-layout"),
    ("Components", "User Journey Map Template", "https://www.figma.com/community/file/891225702324436074/user-journey-map-template"),
    ("Components", "User Persona Template", "https://www.figma.com/community/file/881830156311997001/user-persona-template"),
]

ICONS = [
    "activity", "alert-triangle", "arrow-right", "arrow-up-right", "badge-check", "bar-chart-3",
    "bell", "blocks", "book-open", "calendar", "calendar-days", "check", "check-circle-2",
    "chevron-down", "chevron-right", "circle-check", "circle-help", "circle-x", "clipboard-check",
    "clock", "cloud", "code", "compass", "cpu", "credit-card", "database", "download", "eye",
    "external-link", "file-json", "file-text", "filter", "folder", "folder-open", "gauge",
    "git-branch", "globe", "graduation-cap", "grid-2x2", "heart", "history", "home", "image",
    "info", "key", "layers", "layout-dashboard", "layout-template", "lightbulb", "link", "list",
    "loader", "lock", "mail", "menu", "message-square", "monitor", "moon", "more-horizontal",
    "network", "palette", "panel-left", "play", "plus", "receipt", "refresh-cw", "rocket",
    "search", "server", "settings", "shield-check", "smartphone", "sparkles", "star", "sun",
    "table", "tablet", "terminal", "trash-2", "upload", "user", "users", "wallet", "x", "zap",
]

IMAGE_SEEDS = [
    "vector-abstract-01", "vector-abstract-02", "vector-workspace-01", "vector-workspace-02",
    "vector-product-01", "vector-product-02", "vector-city-01", "vector-city-02",
    "vector-people-01", "vector-people-02", "vector-nature-01", "vector-nature-02",
    "vector-texture-01", "vector-texture-02", "vector-desk-01", "vector-desk-02",
    "vector-glass-01", "vector-glass-02", "vector-light-01", "vector-light-02",
    "vector-night-01", "vector-night-02", "vector-space-01", "vector-space-02",
]


def download_fonts() -> list[dict[str, str]]:
    out = ROOT / "fonts"
    out.mkdir(parents=True, exist_ok=True)
    css_url = (
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700"
        "&family=JetBrains+Mono:wght@400;500&display=swap"
    )
    css = get(css_url).decode("utf-8")
    seen: dict[str, str] = {}
    for url in re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", css):
        if url in seen:
            continue
        name = url.rsplit("/", 1)[-1]
        path = out / name
        if not path.exists():
            path.write_bytes(get(url))
        seen[url] = name
        css = css.replace(url, f"./{name}")
    (out / "fonts.css").write_text(css, encoding="utf-8")
    return [
        {"family": "Inter", "file": "fonts/fonts.css", "license": "SIL Open Font License 1.1"},
        {"family": "JetBrains Mono", "file": "fonts/fonts.css", "license": "SIL Open Font License 1.1"},
    ]


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    (ROOT / "images").mkdir(exist_ok=True)
    (ROOT / "icons").mkdir(exist_ok=True)

    images = []
    for index, seed in enumerate(IMAGE_SEEDS, start=1):
        name = f"{index:02d}-{seed}.jpg"
        path = ROOT / "images" / name
        if not path.exists():
            path.write_bytes(get(f"https://picsum.photos/seed/{seed}/1600/1000"))
        images.append({
            "src": f"images/{name}",
            "alt": f"Placeholder image {index:02d}",
            "source": "https://picsum.photos",
            "license": "Unsplash License via Lorem Picsum",
        })

    icons = []
    for name in ICONS:
        path = ROOT / "icons" / f"{name}.svg"
        if not path.exists():
            path.write_bytes(get(f"https://unpkg.com/lucide-static@0.546.0/icons/{name}.svg"))
        icons.append({"name": name, "src": f"icons/{name}.svg", "license": "ISC (Lucide)"})

    fonts = download_fonts()

    manifest = {
        "name": "Vector Template & Asset Library",
        "generatedAt": "2026-11-20",
        "figma": [{"category": c, "title": t, "url": u} for c, t, u in FIGMA],
        "images": images,
        "icons": icons,
        "fonts": fonts,
    }
    (ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(f"images={len(images)} icons={len(icons)} figma={len(FIGMA)} fonts={len(fonts)}")


if __name__ == "__main__":
    main()
