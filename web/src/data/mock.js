const now = new Date()
const iso = (d)=> new Date(d).toISOString()

export const mock = {
  client: {
    name:"Demo Client",
    plan:"Pro",
    retention:{ days_after_expiry: 90 },
    addons:{ dedicatedBots:false },
    bot:{ mode:"universal", name:"UTS Universal Bot", tokenMasked:"****-universal-****" },
    usage:{ channels:3, max_channels:5, landing_pages:8, max_landing_pages:20, tracking_profiles:3, max_tracking_profiles:5 }
  },
  owner:{ name:"Owner Admin", plan:"Owner" },

  trackingProfiles:[
    { id:"tp_1", name:"Rishabh Main", pixelId:"738000021995361", status:"Active", lastEventAt: iso(now-1000*60*9), lastCapi:"OK", usedIn:3 },
    { id:"tp_2", name:"Cricket God Pixel", pixelId:"860983579752966", status:"Active", lastEventAt: iso(now-1000*60*34), lastCapi:"OK", usedIn:2 },
    { id:"tp_3", name:"Test Backup", pixelId:"1340877837162888", status:"Paused", lastEventAt: iso(now-1000*60*60*26), lastCapi:"FAIL", usedIn:1 },
  ],

  channels:[
    { id:"ch_1", name:"SHAJID KHAN (CRICKET GOD)", tgId:"-1002065328175", status:"Active", botMode:"universal", health:"good", joinsToday:41, joins7d:214, lpCount:3 },
    { id:"ch_2", name:"Rishabh Sharma", tgId:"-1003306262140", status:"Active", botMode:"universal", health:"good", joinsToday:17, joins7d:96, lpCount:2 },
    { id:"ch_3", name:"Dilpreet Brar", tgId:"-1001234567890", status:"Paused", botMode:"dedicated_locked", health:"warn", joinsToday:0, joins7d:12, lpCount:3 },
  ],

  landingPages:[
    { id:"lp_1", name:"Cricket LP A", slug:"cricket-a", template:"Neon Card", channelId:"ch_1", trackingProfileId:"tp_2", status:"Active", visitors:920, preleads:188, joins:93 },
    { id:"lp_2", name:"Cricket LP B", slug:"cricket-b", template:"Minimal Hero", channelId:"ch_1", trackingProfileId:"tp_2", status:"Active", visitors:410, preleads:74, joins:35 },
    { id:"lp_3", name:"Trades LP", slug:"trades-a", template:"Signal Pro", channelId:"ch_2", trackingProfileId:"tp_1", status:"Active", visitors:610, preleads:121, joins:58 },
    { id:"lp_4", name:"Trades LP Split", slug:"trades-b", template:"Split CTA", channelId:"ch_2", trackingProfileId:"tp_1", status:"Active", visitors:290, preleads:48, joins:19 },
    { id:"lp_5", name:"Backup LP", slug:"backup", template:"Plain", channelId:"ch_3", trackingProfileId:"tp_3", status:"Paused", visitors:55, preleads:6, joins:1 },
  ],

  events: Array.from({length:60}).map((_,i)=>{
    const types=["pageview","pre_lead","join","capi_sent","capi_ok","capi_fail"]
    const t=types[(i*7)%types.length]
    const lp=["lp_1","lp_2","lp_3","lp_4","lp_5"][i%5]
    const ch= lp==="lp_1"||lp==="lp_2" ? "ch_1" : (lp==="lp_3"||lp==="lp_4" ? "ch_2" : "ch_3")
    const tp= ch==="ch_1" ? "tp_2" : (ch==="ch_2" ? "tp_1" : "tp_3")
    const at=new Date(Date.now()-(i*1000*60*11))
    return { id:"ev_"+(i+1), at:at.toISOString(), type:t, channelId:ch, landingPageId:lp, trackingProfileId:tp,
      country:["IN","AE","GB","US"][i%4], utm:["meta","telegram","google","direct"][i%4],
      status: t.includes("fail") ? "FAIL" : (t.includes("ok") ? "OK" : "—"),
      sessionId:"sess_"+(1000+(i%12))
    }
  }),

  clientsForOwner:[
    { id:"cl_1", name:"Client A", plan:"Starter", status:"ACTIVE", channels:2, lps:4, lastActive:"2h ago", renewal:"2026-01-03" },
    { id:"cl_2", name:"Client B", plan:"Pro", status:"PAST_DUE", channels:5, lps:16, lastActive:"1d ago", renewal:"2025-12-12" },
    { id:"cl_3", name:"Agency X", plan:"Agency", status:"ACTIVE", channels:9, lps:64, lastActive:"10m ago", renewal:"2026-02-01" },
  ],
  approvals:[
    { id:"ap_1", name:"New Client Signup", plan:"Pro", requested:"2025-12-15", note:"Payment screenshot pending" },
    { id:"ap_2", name:"Upgrade Request", plan:"Agency", requested:"2025-12-14", note:"Moving from Pro to Agency" },
  ]
}
