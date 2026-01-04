const fetch = require('node-fetch');

async function verifyNativeScan() {
    const projectId = "cmjypy7v00001gt3c9kp1032a"; // Sellbetter project from DB

    console.log("🛠️ Switching to NATIVE scan mode...");
    const setRes = await fetch(`http://localhost:5000/api/projects/${projectId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanMode: "NATIVE" })
    });

    if (!setRes.ok) throw new Error("Failed to set scan mode");
    console.log("✅ Scan mode set to NATIVE");

    console.log("🚀 Triggering Native Scan...");
    const scanRes = await fetch('http://localhost:5000/api/quality/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
    });

    if (!scanRes.ok) {
        const err = await scanRes.json();
        console.error("❌ Scan Failed:", err);
        return;
    }

    const report = await scanRes.json();
    console.log("✅ Native Scan Successful!");
    console.log("📊 Report Summary:", {
        score: report.score,
        rating: report.rating,
        highIssues: report.high,
        mediumIssues: report.medium,
        coverage: report.coverage,
        duplications: report.duplications,
        gateStatus: report.gateStatus
    });
}

verifyNativeScan().catch(console.error);
