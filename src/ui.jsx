// Shared UI primitives for Aurum CRM
const { useState, useEffect, useRef, useMemo } = React;
const { Icons } = window;

function Sidebar({ current, onNav, counts }){
  const items = [
    { key:"leads",     label:"Leads Hub",         icon: Icons.Leads,     count: counts.leads },
    { key:"pipeline",  label:"Pipeline",          icon: Icons.Pipeline,  count: counts.pipeline },
    { key:"sales",     label:"Panel de Ventas",   icon: Icons.Sales,     count: null },
    { key:"properties",label:"Propiedades",       icon: Icons.Property,  count: counts.props },
    { key:"dashboard", label:"Executive Dashboard", icon: Icons.Dashboard, count: null },
    { key:"admin",     label:"Admin Settings",    icon: Icons.Settings,  count: null },
  ];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">A</div>
        <div>
          <div className="brand-name">AURUM</div>
          <div className="brand-sub">Realty CRM</div>
        </div>
      </div>

      <div className="nav-section">Workspace</div>
      <div className="col" style={{gap:2}}>
        {items.map(it => {
          const Ic = it.icon;
          const active = current === it.key;
          return (
            <div key={it.key} className={"nav-item " + (active?"active":"")} onClick={()=>onNav(it.key)}>
              <Ic className="nav-icon" />
              <span>{it.label}</span>
              {it.count != null && <span className="nav-count num">{it.count}</span>}
            </div>
          );
        })}
      </div>

      <div className="nav-section">Saved Views</div>
      <div className="col" style={{gap:2}}>
        <div className="nav-item"><Icons.Sparkle className="nav-icon" /><span>Leads premium</span><span className="nav-count num">7</span></div>
        <div className="nav-item"><Icons.Bell className="nav-icon"/><span>Atrasados +5 días</span><span className="nav-count num">4</span></div>
        <div className="nav-item"><Icons.Pin className="nav-icon"/><span>Palermo & Recoleta</span></div>
      </div>

      <div className="sidebar-footer">
        <div className="avatar">JT</div>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:600, fontSize:13, lineHeight:1.1}}>Joaquín Tarantini</div>
          <div className="xs muted" style={{marginTop:2}}>Agente Senior · Aurum BA</div>
        </div>
        <Icons.Chevron size={14} style={{marginLeft:"auto", color:"var(--ink-3)"}}/>
      </div>
    </aside>
  );
}

function Topbar({ title, crumb, right, search=true }){
  return (
    <div className="topbar">
      <div>
        {crumb && <div className="page-crumb">{crumb}</div>}
        <div className="page-title">{title}</div>
      </div>
      <div className="topbar-actions">
        {search && (
          <div className="search">
            <Icons.Search size={15}/>
            <input placeholder="Buscar leads, propiedades, agentes…"/>
            <span className="mono xs" style={{padding:"1px 5px", border:"1px solid var(--border)", borderRadius:4}}>⌘K</span>
          </div>
        )}
        <button className="icon-btn" title="Notificaciones"><Icons.Bell size={16}/></button>
        <button className="icon-btn" title="Calendario"><Icons.Calendar size={16}/></button>
        {right}
      </div>
    </div>
  );
}

function Tag({ children, variant="default", dot=false }){
  return <span className={"tag " + variant}>{dot && <span className="dot"/>}{children}</span>;
}

function SourceTag({ src }){
  const map = {
    "WhatsApp":  { v:"success" },
    "Instagram": { v:"default" },
    "ZonaProp":  { v:"default" },
    "Argenprop": { v:"default" },
    "Web":       { v:"default" },
    "Referido":  { v:"gold" },
  };
  const m = map[src] || { v:"default" };
  return <Tag variant={m.v} dot>{src}</Tag>;
}

function StageTag({ stage }){
  const { STAGES } = window.AR_DATA;
  const meta = STAGES.find(s=>s.key===stage) || STAGES[0];
  const isFinal = stage === "escritura";
  return <span className="pill" style={isFinal?{background:"var(--success-soft)", color:"var(--success)", borderColor:"#C9D9C6"}: stage==="reserva"?{background:"var(--gold-soft)", color:"#6E5630", borderColor:"#E2D4B5"}:{}}>{meta.label}</span>;
}

function OpTag({ op }){
  return <span className="pill" style={ op==="Alquiler" ? {background:"#fff"} : {background:"var(--ink)", color:"#fff", borderColor:"var(--ink)"}}>{op}</span>;
}

function StatusTag({ status }){
  if (status === "Vendida")   return <Tag variant="success" dot>VENDIDA</Tag>;
  if (status === "Reservada") return <Tag variant="gold" dot>RESERVADA</Tag>;
  return <Tag variant="outline" dot>DISPONIBLE</Tag>;
}

function Photo({ label="property", lg=false, src, type }){
  if (src) {
    return (
      <div className={"photo " + (lg?"lg":"")} style={{padding:0, position:"relative", overflow:"hidden", background:"#EFEAE0"}}>
        <img src={src} alt={label} style={{width:"100%", height:"100%", objectFit:"cover", display:"block"}} loading="lazy"
          onError={(e)=>{ e.currentTarget.style.display="none"; }}/>
        {type && <TypeIconBadge type={type}/>}
      </div>
    );
  }
  return <div className={"photo " + (lg?"lg":"")}>{label}</div>;
}

function TypeIcon({ type, size=14 }){
  const { Icons } = window;
  if (type === "Casa")  return <Icons.Home size={size}/>;
  if (type === "Lote")  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8" strokeDasharray="3 3"/>
      <circle cx="12" cy="12" r="2.5"/>
    </svg>
  );
  if (type === "Local") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l1.5-4h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-7h6v7"/>
    </svg>
  );
  // Departamento
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="1"/>
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>
    </svg>
  );
}

function TypeIconBadge({ type }){
  return (
    <div style={{
      position:"absolute", left:6, top:6,
      width:22, height:22, borderRadius:6,
      background:"rgba(255,255,255,0.92)", backdropFilter:"blur(4px)",
      display:"grid", placeItems:"center", color:"var(--ink)",
      border:"1px solid rgba(36,25,17,0.08)"
    }}>
      <TypeIcon type={type} size={12}/>
    </div>
  );
}

function Avatar({ init, size=28 }){
  return <div className="avatar-sm" style={{width:size, height:size, fontSize: size<26?10:11}}>{init}</div>;
}

function KPI({ label, value, sub, delta, deltaDir="up", spark }){
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value num">{value}</div>
      <div className="kpi-foot">
        {delta && <span className={"delta " + deltaDir}>{deltaDir==="up"?"▲":"▼"} {delta}</span>}
        {sub && <span>{sub}</span>}
        {spark && <span style={{marginLeft:"auto"}}>{spark}</span>}
      </div>
    </div>
  );
}

// Tiny inline sparkline (svg)
function Spark({ values=[3,5,4,6,5,7,8,7,9], width=72, height=22, color="var(--ink)" }){
  const max = Math.max(...values), min = Math.min(...values);
  const range = max-min || 1;
  const step = width/(values.length-1);
  const pts = values.map((v,i)=> `${i*step},${height - ((v-min)/range)*height}`).join(" ");
  return (
    <svg width={width} height={height} style={{display:"block"}}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

window.UI = { Sidebar, Topbar, Tag, SourceTag, StageTag, OpTag, StatusTag, Photo, TypeIcon, Avatar, KPI, Spark };
