import asyncio
import os
import edge_tts

VOICE = "en-IN-PrabhatNeural"  # Clear, natural, warm Indian English voice
RATE = "-3%"  # Measured pace for product and technical clarity

SCENES = [
    {
        "id": "scene-01",
        "title": "Scene 1 — Hook",
        "text": "A delivery record says 100 packets were sent. But when the delivery reaches the Anganwadi, only 80 packets are physically received. What happens to the missing 20?"
    },
    {
        "id": "scene-02",
        "title": "Scene 2 — Problem Statement & Solution",
        "text": "Across Gujarat's 53,000 Anganwadis, paper registers, unverified handovers, and spoilage cause millions of rations to go missing. Meet KHORAK, the supply-chain tracker engineered to close every gap from dispatch to distribution."
    },
    {
        "id": "scene-03",
        "title": "Scene 3 — Receipt & Shortage Verification",
        "text": "Let's follow delivery Challan 4410. Instead of blindly accepting 100 packets, the Anganwadi worker verifies the actual count of 80. The 20-packet shortage is immediately recorded as an auditable discrepancy."
    },
    {
        "id": "scene-04",
        "title": "Scene 4 — Aadhaar QR Scanning & Continuous Distribution",
        "text": "To close the beneficiary verification gap, workers scan the QR code on the Aadhaar card. Entitlements are instantly matched, and through continuous loop scanning, packets are confirmed and stock is deducted in seconds."
    },
    {
        "id": "scene-05",
        "title": "Scene 5 — Live Running Stock Ledger",
        "text": "KHORAK maintains an automated, tamper-proof running ledger. Eighty packets received, minus 15 distributed, leaves exactly 65 remaining balance. No manual arithmetic, and no paper ledger errors."
    },
    {
        "id": "scene-06",
        "title": "Scene 6 — Spoilage Logging & Supervisor Heatmap",
        "text": "Spoilage from moisture or pests is logged with photo evidence and clear reason codes. Supervisors monitor live sector heatmaps, catching stockout risks and shortages before children go hungry."
    },
    {
        "id": "scene-07",
        "title": "Scene 7 — Offline Resilience & One-Click MPR",
        "text": "In remote rural blocks, KHORAK functions completely offline, auto-syncing when connected. And at month-end, tedious pre-sector meetings are gone. Form 6 Monthly Progress Reports generate in a single tap."
    },
    {
        "id": "scene-08",
        "title": "Scene 8 — Expected Outcomes & Closing",
        "text": "No more missing rations. No more manual register burden. From dispatch to distribution, KHORAK ensures every single quantity is accounted for. Seva First Innovation Challenge 2026."
    }
]

async def generate_all():
    out_dir = os.path.join(os.path.dirname(__file__), "public", "audio")
    os.makedirs(out_dir, exist_ok=True)
    
    for scene in SCENES:
        filename = f"{scene['id']}.mp3"
        filepath = os.path.join(out_dir, filename)
        print(f"Generating voiceover for {scene['id']} -> {filename}...")
        communicate = edge_tts.Communicate(scene["text"], VOICE, rate=RATE)
        await communicate.save(filepath)
        print(f"Saved: {filepath}")

    print("All 8 voiceover audio files generated successfully!")

if __name__ == "__main__":
    asyncio.run(generate_all())
