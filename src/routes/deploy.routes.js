import express from "express"
import AdmZip from "adm-zip"
import { requireAuth, requireRole } from "../middleware/auth.js"
import { attachClient } from "../middleware/tenant.js"
import { query } from "../db/pool.js"

const router = express.Router()

// Export LP as HTML ZIP (UI v3 Deploy panel)
// GET /deploy/export/:lp_id
router.get("/export/:lp_id", requireAuth, requireRole("client"), attachClient, async (req,res)=>{
  const lpId = req.params.lp_id
  const { rows } = await query(
    `SELECT lp.*, tp.pixel_id, tp.name as tracking_profile_name
     FROM landing_pages lp
     JOIN tracking_profiles tp ON tp.id=lp.tracking_profile_id
     WHERE lp.id=$1 AND lp.client_id=$2`,
    [lpId, req.client.id]
  )
  if(rows.length===0) return res.status(404).json({ error:"LP not found" })

  const lp = rows[0]
  const html = buildHtml(lp)

  const zip = new AdmZip()
  zip.addFile("index.html", Buffer.from(html, "utf-8"))

  const filename = `${lp.slug || "landing-page"}.zip`
  const buf = zip.toBuffer()

  res.setHeader("Content-Type", "application/zip")
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
  return res.send(buf)
})

function buildHtml(lp){
  const title = escapeHtml(lp.name || "Landing Page")
  const pixelId = escapeHtml(lp.pixel_id || "")
  const slug = escapeHtml(lp.slug || "")

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <style>
    body{margin:0;font-family:system-ui,Segoe UI,Roboto,Arial;background:#0b1020;color:#eaf0ff}
    .wrap{max-width:980px;margin:0 auto;padding:36px}
    .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.10);border-radius:18px;padding:22px}
    .btn{display:inline-block;padding:12px 16px;border-radius:12px;background:#7c5cff;color:white;text-decoration:none;font-weight:800}
    .muted{color:rgba(234,240,255,.7)}
    .grid{display:grid;grid-template-columns:1.3fr .7fr;gap:16px}
    @media(max-width:860px){.grid{grid-template-columns:1fr}}
    ul{padding-left:18px}
    code{background:rgba(255,255,255,.08);padding:2px 6px;border-radius:8px}
  </style>

  <!-- Meta Pixel (client-side) -->
  <script>
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track','PageView');
  </script>
</head>
<body>
  <div class="wrap">
    <div class="grid">
      <div class="card">
        <h1 style="margin:0 0 8px">${title}</h1>
        <div class="muted">Exported from UTS · slug: /${slug}</div>
        <h3>Features</h3>
        <ul class="muted">
          <li>Fast, mobile-first layout</li>
          <li>Pixel PageView included</li>
          <li>Ready to connect with your UTS tracking endpoints</li>
        </ul>

        <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn" id="cta" href="#" onclick="onJoin(event)">Join Telegram</a>
          <span class="muted">Demo export file</span>
        </div>
      </div>

      <div class="card">
        <h3 style="margin-top:0">Tracking (placeholder)</h3>
        <div class="muted" style="line-height:1.6">
          In real deploy, this HTML calls your backend:
          <br/><code>/t/e</code> and <code>/t/prelead</code>
        </div>
      </div>
    </div>
  </div>

  <script>
    function onJoin(e){
      e.preventDefault();
      alert('Demo: Hook pre-lead + redirect here.');
    }
  </script>
</body>
</html>`
}

function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}

export default router
