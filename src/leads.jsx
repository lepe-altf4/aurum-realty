// Leads Hub + Lead detail drawer
const { useState: useStateL, useMemo: useMemoL } = React;

function LeadsHub({ onOpenLead, onMove }){
  const { LEADS, PROPERTIES, AGENTS, SOURCES, OPS, STAGES } = window.AR_DATA;
  const { Topbar, SourceTag, StageTag, OpTag, Tag } = window.UI;
  const { Icons } = window;

  const [op, setOp] = useStateL("Todas");
  const [src, setSrc] = useStateL("Todos");
  const [stage, setStage] = useStateL("Todas");

  const rows = useMemoL(()=> LEADS.filter(l =>
    (op === "Todas" || l.op === op) &&
    (src === "Todos" || l.src === src) &&
    (stage === "Todas" || l.stage === stage)
  ), [op, src, stage]);

  const findProp = (id) => PROPERTIES.find(p=>p.id===id);
  const findAgent = (id) => AGENTS.find(a=>a.id===id);

  return (
    <>
      <Topbar
        crumb="WORKSPACE · LEADS"
        title="Leads Hub"
        right={
          <>
            <button className="btn ghost"><Icons.Download size={15}/>Exportar</button>
            <button className="btn primary"><Icons.Plus size={15}/>Nuevo Lead</button>
          </>
        }
      />
      <div className="content">

        {/* Summary strip */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:18}}>
          <SummaryStat label="Leads activos"    value="84"  sub="+12 esta semana" up />
          <SummaryStat label="Nuevos hoy"       value="9"   sub="6 WhatsApp · 3 Web" />
          <SummaryStat label="Tasa respuesta"   value="92%" sub="< 4 min promedio" up />
          <SummaryStat label="Atrasados"        value="11"  sub="sin contacto +5d" down />
          <SummaryStat label="Premium" value="14" sub="ticket > USD 500k" gold />
        </div>

        {/* Filters */}
        <div className="card">
          <div style={{padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
            <Icons.Filter size={15} style={{color:"var(--ink-3)"}}/>
            <span className="xs" style={{textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--ink-3)", fontWeight:600, marginRight:6}}>Operación</span>
            {["Todas", ...OPS].map(o=>(
              <button key={o} className={"chip " + (op===o?"active":"")} onClick={()=>setOp(o)}>{o}</button>
            ))}
            <span style={{width:1, height:22, background:"var(--border)", margin:"0 6px"}}/>
            <span className="xs" style={{textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--ink-3)", fontWeight:600, marginRight:6}}>Origen</span>
            {["Todos", ...SOURCES].map(s=>(
              <button key={s} className={"chip " + (src===s?"active":"")} onClick={()=>setSrc(s)}>{s}</button>
            ))}
            <span style={{width:1, height:22, background:"var(--border)", margin:"0 6px"}}/>
            <span className="xs" style={{textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--ink-3)", fontWeight:600, marginRight:6}}>Etapa</span>
            <select className="chip" style={{paddingRight:24, appearance:"none"}} value={stage} onChange={e=>setStage(e.target.value)}>
              <option value="Todas">Todas las etapas</option>
              {STAGES.map(s=> <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            <div style={{marginLeft:"auto"}} className="row xs muted">
              <span>{rows.length} de {LEADS.length} leads</span>
            </div>
          </div>

          <div className="scroll">
            <table className="t">
              <thead>
                <tr>
                  <th style={{width:30}}><input type="checkbox"/></th>
                  <th>Nombre</th>
                  <th>Teléfono</th>
                  <th>Origen</th>
                  <th>Propiedad de interés</th>
                  <th>Operación</th>
                  <th>Etapa</th>
                  <th>Agente</th>
                  <th>Fecha</th>
                  <th style={{textAlign:"right", paddingRight:18}}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(l => {
                  const p = findProp(l.prop);
                  const a = findAgent(l.agent);
                  return (
                    <tr key={l.id} onClick={()=>onOpenLead(l)}>
                      <td onClick={e=>e.stopPropagation()}><input type="checkbox"/></td>
                      <td>
                        <div className="row" style={{gap:10}}>
                          <div style={{width:8, height:8, borderRadius:"50%", background: l.hot? "var(--gold)":"transparent", border: l.hot? "0":"1px solid var(--border)"}}/>
                          <div>
                            <div className="row-name">{l.name} {l.hot && <span className="tag gold" style={{marginLeft:6, padding:"1px 6px", fontSize:10}}>HOT</span>}</div>
                            <div className="row-sub mono">{l.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num">{l.phone}</td>
                      <td><SourceTag src={l.src}/></td>
                      <td>
                        <div style={{fontWeight:500, color:"var(--ink)"}}>{p?.addr}</div>
                        <div className="row-sub">{p?.neigh} · {p?.type}</div>
                      </td>
                      <td><OpTag op={l.op}/></td>
                      <td><StageTag stage={l.stage}/></td>
                      <td>
                        <div className="row" style={{gap:8}}>
                          <div className="avatar-sm">{a?.init}</div>
                          <span className="sm">{a?.name.split(" ")[0]}</span>
                        </div>
                      </td>
                      <td className="num muted sm">{l.date} · <span style={{color: l.days>5?"var(--danger)":"var(--ink-3)"}}>{l.days}d</span></td>
                      <td onClick={e=>e.stopPropagation()} style={{textAlign:"right"}}>
                        <div className="row" style={{justifyContent:"flex-end", gap:6}}>
                          <button className="icon-btn" title="WhatsApp" style={{color:"var(--success)"}}><Icons.Whatsapp size={15}/></button>
                          <button className="icon-btn" title="Mover etapa" onClick={()=>onMove(l)}><Icons.Arrow size={15}/></button>
                          <button className="icon-btn" title="Más"><Icons.More size={15}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function SummaryStat({ label, value, sub, up, down, gold }){
  const color = up? "var(--success)": down? "var(--danger)": gold? "var(--gold)":"var(--ink-3)";
  return (
    <div className="card card-pad">
      <div className="kpi-label">{label}</div>
      <div className="row" style={{justifyContent:"space-between", alignItems:"flex-end", marginTop:6}}>
        <div className="kpi-value num" style={{fontSize:24}}>{value}</div>
        <div className="xs" style={{color}}>{up?"▲":down?"▼":gold?"★":""}</div>
      </div>
      <div className="xs muted" style={{marginTop:4}}>{sub}</div>
    </div>
  );
}

function LeadDrawer({ lead, onClose, onMove }){
  if(!lead) return null;
  const { PROPERTIES, AGENTS, ACTIVITY, STAGES, fmtUSD, fmtARS } = window.AR_DATA;
  const { SourceTag, StageTag, OpTag } = window.UI;
  const { Icons } = window;
  const p = PROPERTIES.find(x=>x.id===lead.prop);
  const a = AGENTS.find(x=>x.id===lead.agent);
  const stageIdx = STAGES.findIndex(s=>s.key===lead.stage);

  const [note, setNote] = React.useState("");
  const [timeline, setTimeline] = React.useState(ACTIVITY);
  const registerNote = () => {
    const text = note.trim();
    if(!text) return;
    const now = new Date();
    const hh = now.getHours().toString().padStart(2,"0");
    const mm = now.getMinutes().toString().padStart(2,"0");
    setTimeline([{ when:`Hoy · ${hh}:${mm}`, who:"Joaquín Tarantini", text, kind:"note" }, ...timeline]);
    setNote("");
  };
  const onNoteKey = (e) => { if(e.key==="Enter" && (e.ctrlKey||e.metaKey)) registerNote(); };

  return (
    <>
      <div className="drawer-back" onClick={onClose}/>
      <aside className="drawer">
        {/* Header — name + primary WhatsApp action */}
        <div style={{padding:"16px 22px 14px", borderBottom:"1px solid var(--border)"}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div className="page-crumb">LEAD · {lead.id}</div>
            <button className="icon-btn" onClick={onClose}><Icons.Close size={16}/></button>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:12, marginTop:8}}>
            <div style={{minWidth:0, flex:1}}>
              <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap"}}>
                <h2 style={{fontSize:22, fontWeight:700}}>{lead.name}</h2>
                {lead.hot && <span className="tag gold" style={{padding:"2px 8px"}}>HOT</span>}
                <StageTag stage={lead.stage}/>
              </div>
              <div className="row sm muted num" style={{gap:14, marginTop:4}}>
                <span className="row" style={{gap:6}}><Icons.Phone size={13}/>{lead.phone}</span>
                <span style={{color: lead.days>5?"var(--danger)":"var(--ink-3)"}}>· {lead.days}d sin contacto</span>
              </div>
            </div>
          </div>
          <div style={{display:"flex", gap:8, marginTop:14}}>
            <button className="btn" style={{flex:1, justifyContent:"center", background:"var(--success)", color:"#fff"}}>
              <Icons.Whatsapp size={15}/>Contactar por WhatsApp
            </button>
            <button className="btn ghost"><Icons.Phone size={14}/>Llamar</button>
            <button className="btn ghost"><Icons.Mail size={14}/>Mail</button>
          </div>
        </div>

        <div className="scroll" style={{padding:"18px 22px 22px", flex:1}}>

          {/* Contact */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
            <div className="field">
              <label>Email</label>
              <div className="v row" style={{gap:6}}><Icons.Mail size={14} style={{color:"var(--ink-3)"}}/>{lead.email}</div>
            </div>
            <div className="field">
              <label>Origen</label>
              <div><SourceTag src={lead.src}/></div>
            </div>
            <div className="field">
              <label>Operación</label>
              <div><OpTag op={lead.op}/></div>
            </div>
            <div className="field">
              <label>Agente asignado</label>
              <div className="row" style={{gap:8}}>
                <div className="avatar-sm">{a?.init}</div>
                <div className="v">{a?.name}</div>
              </div>
            </div>
          </div>

          <hr className="hr"/>

          {/* Property of interest */}
          <div className="kpi-label" style={{marginBottom:10}}>Propiedad de interés</div>
          <div className="card" style={{padding:14, display:"flex", gap:14}}>
            <div className="photo" style={{width:96, height:78, padding:0, overflow:"hidden", position:"relative"}}>
              {p?.img
                ? <img src={p.img} alt={p.addr} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
                : <span className="xs mono" style={{color:"var(--ink-4)"}}>{p?.id}</span>}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontWeight:600, color:"var(--ink)"}}>{p?.addr}</div>
              <div className="xs muted">{p?.neigh} · {p?.type} · {p?.m2} m² · {p?.amb} amb.</div>
              <div className="row" style={{gap:6, marginTop:8}}>
                {p?.ccy==="USD"
                  ? <span className="tag ink num">{fmtUSD(p?.usd)}{p?.op==="Alquiler"?" /mes":""}</span>
                  : <span className="tag gold num">{fmtARS(p?.ars)}{p?.op==="Alquiler"?" /mes":""}</span>}
                <span className="tag num xs" style={{opacity:0.7}}>≈ {p?.ccy==="USD" ? fmtARS(p?.ars) : fmtUSD(p?.usd)}</span>
                {p?.premium && <span className="tag gold">PREMIUM</span>}
              </div>
            </div>
          </div>

          {/* Stage tracker */}
          <div className="kpi-label" style={{margin:"22px 0 10px"}}>Etapa actual</div>
          <div className="card" style={{padding:14}}>
            <div style={{display:"flex", gap:6, marginBottom:12}}>
              {STAGES.map((s,i)=>(
                <div key={s.key} style={{flex:1, height:5, borderRadius:3, background: i<=stageIdx ? "var(--ink)" : "var(--border)"}}/>
              ))}
            </div>
            <div className="row" style={{justifyContent:"space-between"}}>
              <div className="xs muted">{STAGES[stageIdx].hint}</div>
              <button className="btn ghost" onClick={()=>onMove(lead)}>Mover etapa <Icons.Arrow size={14}/></button>
            </div>
          </div>

          {/* Meta grid */}
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:18}}>
            <div className="field">
              <label>Próxima acción</label>
              <div className="v">Llamar para confirmar visita</div>
              <div className="xs muted">Mañana · 10:30</div>
            </div>
            <div className="field">
              <label>Score</label>
              <div className="v row" style={{gap:6}}>
                {lead.hot? "92 / 100" : "64 / 100"}
                {lead.hot && <span className="tag gold xs">PREMIUM</span>}
              </div>
            </div>
          </div>

          <hr className="hr"/>

          {/* Quick-add note → above timeline */}
          <div className="kpi-label" style={{marginBottom:10}}>Registrar actividad</div>
          <div className="card" style={{padding:12}}>
            <textarea
              rows={2}
              value={note}
              onChange={e=>setNote(e.target.value)}
              onKeyDown={onNoteKey}
              placeholder='Anotá la interacción: "Llamé, visita el jueves 14:30"'
              style={{
                width:"100%", border:0, outline:0, resize:"none",
                font:"inherit", color:"var(--ink)", background:"transparent",
                padding:"2px 4px 6px"
              }}
            />
            <div className="row" style={{justifyContent:"space-between", paddingTop:8, borderTop:"1px dashed var(--border)"}}>
              <div className="xs muted">{lead.notes}</div>
              <button
                className="btn primary"
                onClick={registerNote}
                style={{padding:"7px 12px", opacity: note.trim()?1:0.45}}
                disabled={!note.trim()}>
                <Icons.Check size={14}/> Registrar
                <span className="mono xs" style={{padding:"1px 5px", border:"1px solid rgba(255,255,255,0.18)", borderRadius:4, marginLeft:4, opacity:0.7}}>⌘↵</span>
              </button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="kpi-label" style={{margin:"22px 0 14px"}}>Historial de actividades</div>
          <div className="tl">
            {timeline.map((ev,i)=>(
              <div key={i} className={"tl-item " + (i===0?"now":i<2?"":"done")}>
                <div className="row" style={{gap:8}}>
                  <div style={{fontWeight:600, fontSize:13}}>{ev.who}</div>
                  <div className="xs muted">{ev.when}</div>
                  {ev.kind==="note" && <span className="tag gold xs" style={{padding:"1px 6px"}}>NOTA</span>}
                </div>
                <div className="sm" style={{color:"var(--ink-2)", marginTop:2}}>{ev.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{padding:"12px 22px", borderTop:"1px solid var(--border)", display:"flex", gap:8, alignItems:"center"}}>
          <button className="btn ghost" style={{flex:1, justifyContent:"center"}}><Icons.Calendar size={14}/>Agendar visita</button>
          <button className="btn ghost" style={{flex:1, justifyContent:"center"}}><Icons.Doc size={14}/>Generar boleto</button>
          <button className="btn subtle" title="Más"><Icons.More size={14}/></button>
        </div>
      </aside>
    </>
  );
}

window.LeadsHub = LeadsHub;
window.LeadDrawer = LeadDrawer;
