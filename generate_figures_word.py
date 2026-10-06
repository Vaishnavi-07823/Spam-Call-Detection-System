import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor, Emu
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

assets_dir = os.path.abspath("research_paper_assets")

figures = [
    {
        "num": 1,
        "path": os.path.join(assets_dir, "figure1_system_architecture.png"),
        "title": "Figure 1: TrueShield AI — End-to-End System Architecture",
        "caption": "Complete 4-tier pipeline showing Real-Time Audio Capture & Streaming ASR → Dual-Engine Hybrid Analysis (Rule Matcher + Gemini LLM) → Maximum-Pooling Threat Arbitration → Live HUD & Supabase Cloud Persistence.",
        "width": 6.3,
    },
    {
        "num": 2,
        "path": os.path.join(assets_dir, "figure2_detection_workflow.png"),
        "title": "Figure 2: Real-Time Detection Workflow & Decision State Machine",
        "caption": "ISO-standard process flowchart illustrating the continuous acoustic stream loop, parallel dual-engine execution, 6000 ms circuit-breaker timeout fallback, and tri-tier risk threshold routing (Safe / Suspicious / Critical).",
        "width": 4.8,
    },
    {
        "num": 3,
        "path": os.path.join(assets_dir, "figure3_hybrid_scoring_pipeline.png"),
        "title": "Figure 3: Hybrid Threat Fusion Pipeline & Max-Pooling Arbitration Model",
        "caption": "Mathematical formulation of lexical weight accumulation (Engine A), Gemini LLM structured JSON inference (Engine B), and the Max-Pooling fusion operator: S_final = max(S_rule, S_AI). Includes worked trace for a real-world CBI/OTP scam transcript.",
        "width": 6.3,
    },
    {
        "num": 4,
        "path": os.path.join(assets_dir, "figure4_scam_threat_taxonomy.png"),
        "title": "Figure 4: TrueShield AI — Phone Scam Threat Taxonomy & Vector Ontology",
        "caption": "Hierarchical 8-class taxonomy of phone fraud vectors modeled by TrueShield AI: Credential Theft, Tech Support/Remote Access, Authority Impersonation (CBI/Police), Financial/Utility Fraud, Verification/KYC, Pressure Tactics, Lottery/Prize Scams, and Safe Baseline.",
        "width": 6.3,
    },
    {
        "num": 5,
        "path": os.path.join(assets_dir, "graphical_abstract.jpg"),
        "title": "Figure 5: Conceptual Graphical Abstract — TrueShield AI Overview",
        "caption": "Conceptual illustration of TrueShield AI real-time in-call acoustic waveform capture, dual AI threat analysis, and holographic cyber-shield HUD.",
        "width": 6.3,
    },
]

def add_hr(doc, color="2563EB"):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(2)
    from docx.oxml import parse_xml
    from docx.oxml.ns import nsdecls
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="6" w:space="1" w:color="{color}"/></w:pBdr>')
    p._p.get_or_add_pPr().append(pBdr)

doc = Document()

# Margins
for s in doc.sections:
    s.top_margin = Inches(0.8)
    s.bottom_margin = Inches(0.8)
    s.left_margin = Inches(0.9)
    s.right_margin = Inches(0.9)

# ─── Cover heading ───────────────────────────────────────────────────────────
p_cov = doc.add_paragraph()
p_cov.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_cov.paragraph_format.space_before = Pt(0)
p_cov.paragraph_format.space_after = Pt(4)
r = p_cov.add_run("TrueShield AI")
r.font.name = "Calibri"
r.font.size = Pt(28)
r.font.bold = True
r.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

p_sub = doc.add_paragraph()
p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_sub.paragraph_format.space_after = Pt(2)
r2 = p_sub.add_run("Real-Time AI-Driven Scam Call Detection System")
r2.font.name = "Calibri"
r2.font.size = Pt(14)
r2.font.italic = True
r2.font.color.rgb = RGBColor(0x25, 0x63, 0xeb)

p_auth = doc.add_paragraph()
p_auth.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_auth.paragraph_format.space_after = Pt(16)
r3 = p_auth.add_run("Vaishnavi Trivedi  |  B.Tech CSE (Cybersecurity)  |  GHRCE Nagpur")
r3.font.name = "Calibri"
r3.font.size = Pt(10.5)
r3.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

add_hr(doc, "2563EB")

p_intro = doc.add_paragraph()
p_intro.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_intro.paragraph_format.space_before = Pt(10)
p_intro.paragraph_format.space_after = Pt(14)
r4 = p_intro.add_run("Research Diagrams & System Architecture Figures")
r4.font.name = "Calibri"
r4.font.size = Pt(12)
r4.font.bold = True
r4.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

# ─── Each figure ─────────────────────────────────────────────────────────────
for fig in figures:
    if not os.path.exists(fig["path"]):
        print(f"WARNING: {fig['path']} not found, skipping.")
        continue

    # Figure number banner
    p_num = doc.add_paragraph()
    p_num.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p_num.paragraph_format.space_before = Pt(14)
    p_num.paragraph_format.space_after = Pt(4)
    rn = p_num.add_run(f"◆  {fig['title']}")
    rn.font.name = "Calibri"
    rn.font.size = Pt(12)
    rn.font.bold = True
    rn.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    # Image (centered)
    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(4)
    p_img.paragraph_format.space_after = Pt(6)
    run_img = p_img.add_run()
    run_img.add_picture(fig["path"], width=Inches(fig["width"]))

    # Caption
    p_cap = doc.add_paragraph()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.space_after = Pt(6)
    rc1 = p_cap.add_run(f"Fig. {fig['num']}. ")
    rc1.font.name = "Calibri"
    rc1.font.size = Pt(9)
    rc1.font.bold = True
    rc1.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)
    rc2 = p_cap.add_run(fig["caption"])
    rc2.font.name = "Calibri"
    rc2.font.size = Pt(9)
    rc2.font.italic = True
    rc2.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    add_hr(doc, "CBD5E1")

    # Page break after each figure (except last)
    if fig["num"] < len(figures):
        doc.add_page_break()

# ─── Quick reference legend ──────────────────────────────────────────────────
doc.add_page_break()

p_leg = doc.add_paragraph()
p_leg.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_leg.paragraph_format.space_after = Pt(12)
r_leg = p_leg.add_run("Quick Legend — TrueShield AI Risk Score Thresholds")
r_leg.font.name = "Calibri"
r_leg.font.size = Pt(14)
r_leg.font.bold = True
r_leg.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

legend_items = [
    ("🟢  SAFE  (Score 0 – 39)",       "Normal conversation. No suspicious keywords detected. Passive monitoring continues silently.", "047857"),
    ("🟡  SUSPICIOUS  (Score 40 – 70)", "Warning banner displayed. Caller should be verified through official channels. Do not share personal data.", "A16207"),
    ("🔴  CRITICAL SCAM  (Score > 70)", "Immediate high-priority alert. Hang up now. Block the number. Do not share OTP, PIN, CVV, or Aadhaar.", "B91C1C"),
]

for icon_title, desc, color_hex in legend_items:
    p_li = doc.add_paragraph()
    p_li.paragraph_format.left_indent = Inches(0.3)
    p_li.paragraph_format.space_after = Pt(6)
    r_t = p_li.add_run(icon_title + "\n")
    r_t.font.name = "Calibri"
    r_t.font.size = Pt(11)
    r_t.font.bold = True
    r_t.font.color.rgb = RGBColor(
        int(color_hex[:2], 16), int(color_hex[2:4], 16), int(color_hex[4:], 16)
    )
    r_d = p_li.add_run(desc)
    r_d.font.name = "Calibri"
    r_d.font.size = Pt(10)
    r_d.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

add_hr(doc, "2563EB")

p_fml = doc.add_paragraph()
p_fml.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_fml.paragraph_format.space_before = Pt(14)
p_fml.paragraph_format.space_after = Pt(6)
r_fml = p_fml.add_run("Core Fusion Formula:   S_final = max( S_rule,  S_AI )")
r_fml.font.name = "Courier New"
r_fml.font.size = Pt(13)
r_fml.font.bold = True
r_fml.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

p_note = doc.add_paragraph()
p_note.alignment = WD_ALIGN_PARAGRAPH.CENTER
r_note = p_note.add_run("Maximum-Pooling ensures zero false negatives — if either engine detects a hard keyword (OTP, AnyDesk, Arrest Warrant), the higher score always wins.")
r_note.font.name = "Calibri"
r_note.font.size = Pt(9.5)
r_note.font.italic = True
r_note.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

# ─── Save ────────────────────────────────────────────────────────────────────
out_path = os.path.abspath("TrueShield_AI_Figures_Only.docx")
assets_path = os.path.join(assets_dir, "TrueShield_AI_Figures_Only.docx")
doc.save(out_path)
doc.save(assets_path)
print(f"SUCCESS: Saved at:\n1. {out_path}\n2. {assets_path}")
