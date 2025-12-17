import React from "react"
export default function Icon({ name, size=18 }){
  const common = { width:size, height:size, viewBox:"0 0 24 24", fill:"none", xmlns:"http://www.w3.org/2000/svg" }
  const s = { stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round" }
  switch(name){
    case "dashboard": return (<svg {...common}><path {...s} d="M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-18h7v7h-7V2Z"/></svg>)
    case "channels": return (<svg {...common}><path {...s} d="M4 7h16M4 12h16M4 17h16"/><path {...s} d="M7 7v10"/></svg>)
    case "lp": return (<svg {...common}><path {...s} d="M7 3h8l4 4v14H7V3Z"/><path {...s} d="M15 3v5h5"/></svg>)
    case "profile": return (<svg {...common}><path {...s} d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"/><path {...s} d="M20 21a8 8 0 0 0-16 0"/></svg>)
    case "reports": return (<svg {...common}><path {...s} d="M4 19V5"/><path {...s} d="M4 19h16"/><path {...s} d="M8 15l3-4 3 2 4-6"/></svg>)
    case "logs": return (<svg {...common}><path {...s} d="M8 6h13M8 12h13M8 18h13"/><path {...s} d="M4 6h.01M4 12h.01M4 18h.01"/></svg>)
    case "settings": return (<svg {...common}><path {...s} d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path {...s} d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-1.7 2.94-.08-.02a2 2 0 0 0-1.86.5l-.06.06-3.1-1.3a7 7 0 0 1-1.2 0l-3.1 1.3-.06-.06a2 2 0 0 0-1.86-.5l-.08.02-1.7-2.94.06-.06A1.7 1.7 0 0 0 4.6 15a7.2 7.2 0 0 1 0-2 1.7 1.7 0 0 0-.34-1.87l-.06-.06 1.7-2.94.08.02a2 2 0 0 0 1.86-.5l.06-.06 3.1 1.3a7 7 0 0 1 1.2 0l3.1-1.3.06.06a2 2 0 0 0 1.86.5l.08-.02 1.7 2.94-.06.06A1.7 1.7 0 0 0 19.4 13a7.2 7.2 0 0 1 0 2Z"/></svg>)
    case "users": return (<svg {...common}><path {...s} d="M17 21a4 4 0 0 0-8 0"/><path {...s} d="M13 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"/><path {...s} d="M21 21a3 3 0 0 0-5-2.2"/></svg>)
    case "approve": return (<svg {...common}><path {...s} d="M20 6 9 17l-5-5"/></svg>)
    case "logout": return (<svg {...common}><path {...s} d="M10 16l-4-4 4-4"/><path {...s} d="M6 12h12"/><path {...s} d="M14 4h6v16h-6"/></svg>)
    case "money": return (<svg {...common}><path {...s} d="M12 1v22"/><path {...s} d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6"/><path {...s} d="M12 1v22"/></svg>)
    case "bot": return (<svg {...common}><path {...s} d="M12 2v2"/><path {...s} d="M7 6h10a4 4 0 0 1 4 4v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a4 4 0 0 1 4-4Z"/><path {...s} d="M8 11h.01M16 11h.01"/><path {...s} d="M9 16h6"/></svg>)
    case "ai": return (<svg {...common}><path {...s} d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2Z"/></svg>)
    default: return (<svg {...common}><path {...s} d="M12 2v20M2 12h20"/></svg>)
  }
}
