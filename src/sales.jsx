// Panel de Ventas — VENDEDOR view: agresivo, alarmas, cuellos de botella, eficacia
function SalesPanel(){
  const { LEADS, STAGES, AGENTS, PROPERTIES, fmtUSD } = window.AR_DATA;
  const { Topbar, KPI, Spark } = window.UI;
  const { Icons } = window;

  const total = LEADS.length;
  const byStage = STAGES.map(s => ({ ...s, count: LEADS.filter(l=>l.stage===s.key).length, avgDays: avgDaysInStage(s.key) }));
  const overdue = LEADS.filter(l=>l.days>=5);
  const noAction = LEADS.filter(l=>l.days>=3 && l.stage!=="escritura");
  const closed = LEADS.filter(l=>l.stage==="escritura");
  const dueToday = [
    { name:"Florencia Bianchi", task:"Confirmar visita 16hs", overdue:false, id:"L-840" },
    { name:"Ramiro Achával",    task:"Enviar contrapropuesta",  overdue:true, id:"L-841" },
    { name:"Damián Ortega",     task:"Llamada para firmar seña", overdue:true, id:"L-838" },
    { name:"Martín Iraola",     task:"Re-visita propiedad",      overdue:false, id:"L-836" },
  ];

  // Worst bottleneck = stage with highest count * avgDays (excluding final)
  const bottleneck = byStage.slice(0,4).reduce((max,s)=> s.count*s.avgDays > max.count*max.avgDays ? s : max, byStage[0]);

  return (
    <>
      <Topbar
        crumb="WORKSPACE · PERFORMANCE"
        title="Panel de Ventas"
        right={
          <>
            <button className="btn ghost"><Icons.Calendar size={15}/>Mayo 2026</button>
            <button className="btn primary"><Icons.Whatsapp size={15}/>Contactar atrasados</button>
          </>
        }
      />
      <div className="content">

        {/* RED ALERT BANNER */}
        <div style={{
          display:"flex", alignItems:"center", gap:16,
          background:"linear-gradient(90deg, #FBE8E5 0%, #F8F6F2 60%)",
          border:"1px solid #E9CDC9",
          borderLeft:"4px solid var(--danger)",
          borderRadius:12, padding:"14px 18px", marginBottom:18
        }}>
          <div style={{width:36, height:36, borderRadius:8, background:"#fff", display:"grid", placeItems:"center", color:"var(--danger)", border:"1px solid #E9CDC9", flexShrink:0}}>
            <Icons.Bell size={18}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:14, color:"var(--danger)"}}>
              {overdue.length} leads atrasados · {dueToday.filter(t=>t.overdue).length} tareas vencidas hoy
            </div>
            <div className="xs" style={{color:"var(--ink-2)", marginTop:2}}>
              {overdue.reduce((a,l)=>a+(PROPERTIES.find(p=>p.id===l.prop)?.usd||0),0).toLocaleString("es-AR",{style:"currency",currency:"USD",maximumFractionDigits:0})} en pipeline en riesgo si no contactás en 24hs.
            </div>
          </div>
          <button className="btn" style={{background:"var(--danger)", color:"#fff"}}>Ver todos <Icons.Arrow size={14}/></button>
        </div>

        {/* 5 KPIs — aggressive variant */}
        <div className="kpi-grid" style={{gridTemplateColumns:"repeat(5,1fr)"}}>
          <KPI label="Leads Activos" value="84" delta="+12%" sub="vs. semana pasada" spark={<Spark values={[42,48,55,52,60,66,70,78,84]}/>}/>

          <div className="kpi">
            <div className="kpi-label">Por Etapa</div>
            <div className="row" style={{gap:4, marginTop:10, alignItems:"flex-end", height:38}}>
              {byStage.map((s,i)=>(
                <div key={s.key} style={{flex:1, position:"relative"}}>
                  <div style={{
                    height: Math.max(s.count/Math.max(...byStage.map(b=>b.count))*32, 4)+"px",
                    background: s.key===bottleneck.key ? "var(--danger)" : (i===4?"var(--success)":i===3?"var(--gold)":"var(--ink)"),
                    borderRadius:"2px 2px 0 0"
                  }}/>
                  <div className="xs num" style={{textAlign:"center", marginTop:4, color:"var(--ink-3)", fontWeight: s.key===bottleneck.key?700:500}}>{s.count}</div>
                </div>
              ))}
            </div>
            <div className="kpi-foot" style={{marginTop:6}}>
              <span style={{color:"var(--danger)", fontWeight:600}}>⚠ Cuello en {bottleneck.label}</span>
            </div>
          </div>

          <div className="kpi" style={{borderColor:"#E9CDC9", background:"linear-gradient(180deg, #fff 0%, #FDF5F4 100%)"}}>
            <div className="kpi-label" style={{color:"var(--danger)"}}>⚠ Atrasados</div>
            <div className="kpi-value num" style={{color:"var(--danger)"}}>{overdue.length}</div>
            <div className="kpi-foot">
              <span className="delta down">▲ +3 vs. ayer</span>
              <span>sin contacto +5 días</span>
            </div>
          </div>

          <div className="kpi">
            <div className="kpi-label">Sin Acción 72hs</div>
            <div className="kpi-value num" style={{color:"var(--ink)"}}>{noAction.length}</div>
            <div className="kpi-foot">
              <span style={{color:"var(--gold)", fontWeight:600}}>★ {LEADS.filter(l=>l.hot && l.days>=3).length} HOT</span>
              <span>requieren follow-up</span>
            </div>
          </div>

          <KPI label="Cierres mes" value={closed.length} delta="+2" sub="meta: 8 · 12% ahead" spark={<Spark values={[2,3,3,4,4,5,5,6,closed.length]} color="var(--success)"/>}/>
        </div>

        {/* Tareas hoy + Efectividad agentes */}
        <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:16, marginTop:18}}>

          {/* Tareas vencidas / hoy */}
          <div className="card">
            <div className="card-header">
              <span style={{width:6, height:6, borderRadius:"50%", background:"var(--danger)"}}/>
              <div className="card-title">Tareas de hoy</div>
              <span className="tag danger" style={{marginLeft:"auto"}}>
                {dueToday.filter(t=>t.overdue).length} vencidas
              </span>
            </div>
            <div>
              {dueToday.map((t,i)=>(
                <div key={i} style={{
                  padding:"14px 18px",
                  borderBottom: i<dueToday.length-1? "1px solid var(--border)":"0",
                  display:"flex", alignItems:"center", gap:12,
                  background: t.overdue ? "rgba(122,31,31,0.03)" : "transparent"
                }}>
                  <input type="checkbox"/>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="row" style={{gap:6}}>
                      <span style={{fontWeight:600, fontSize:13.5}}>{t.task}</span>
                      {t.overdue && <span className="tag danger" style={{padding:"1px 6px", fontSize:10}}>VENCIDA</span>}
                    </div>
                    <div className="xs muted">{t.name} · {t.id}</div>
                  </div>
                  <button className="icon-btn" style={{color:"var(--success)"}}><Icons.Whatsapp size={15}/></button>
                  <button className="icon-btn"><Icons.Phone size={15}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Efectividad de agentes */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Efectividad del equipo</div>
              <span className="xs muted" style={{marginLeft:"auto"}}>Tasa de cierre · 30 días</span>
            </div>
            <div style={{padding:"6px 18px 14px"}}>
              {AGENTS.map((a,i)=>{
                const eff = [22, 19, 16, 12, 9][i];
                const responseTime = ["3 min","5 min","8 min","12 min","18 min"][i];
                const tone = eff >= 18 ? "var(--success)" : eff >= 12 ? "var(--ink)" : "var(--danger)";
                return (
                  <div key={a.id} style={{padding:"10px 0", borderBottom: i<AGENTS.length-1? "1px dashed var(--border)":"0"}}>
                    <div className="row" style={{gap:10}}>
                      <div className="avatar-sm">{a.init}</div>
                      <span style={{fontWeight:600, fontSize:13}}>{a.name}</span>
                      <span className="xs muted" style={{marginLeft:"auto"}}>resp. {responseTime}</span>
                      <span className="num" style={{fontWeight:700, color: tone, minWidth:42, textAlign:"right"}}>{eff}%</span>
                    </div>
                    <div style={{height:5, background:"var(--surface)", borderRadius:3, marginTop:6}}>
                      <div style={{width: (eff/22*100)+"%", height:"100%", background: tone, borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Funnel + Stale leads */}
        <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16, marginTop:18}}>

          {/* Funnel with bottleneck highlight */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Embudo · días promedio por etapa</div>
              <span className="tag danger" style={{marginLeft:"auto"}}>⚠ {bottleneck.label} estancado</span>
            </div>
            <div style={{padding:"16px 24px 22px"}}>
              {byStage.map((s,i)=>{
                const pct = Math.round(s.count / total * 100);
                const conv = i>0 ? Math.round(s.count / Math.max(byStage[i-1].count,1) * 100) : 100;
                const width = Math.max(pct*4, 12);
                const isBottle = s.key === bottleneck.key;
                return (
                  <div key={s.key} style={{display:"grid", gridTemplateColumns:"110px 1fr 60px 70px 60px", alignItems:"center", gap:14, padding:"7px 0"}}>
                    <div className="row" style={{gap:8}}>
                      <span style={{width:6,height:6,borderRadius:"50%", background: isBottle?"var(--danger)" : (i===4?"var(--success)":i===3?"var(--gold)":"var(--ink)")}}/>
                      <span style={{fontWeight:600, fontSize:13, color: isBottle? "var(--danger)":"var(--ink)"}}>{s.label}</span>
                    </div>
                    <div style={{position:"relative", height:30, background:"var(--surface)", borderRadius:6}}>
                      <div style={{
                        position:"absolute", inset:0, width: width+"%",
                        background: isBottle?"var(--danger)" : (i===4?"var(--success)":i===3?"var(--gold)":"var(--ink)"),
                        borderRadius:6
                      }}/>
                    </div>
                    <div className="num" style={{fontWeight:700}}>{s.count}</div>
                    <div className="xs muted">{conv}% conv.</div>
                    <div className="xs num" style={{color: isBottle?"var(--danger)":"var(--ink-3)", fontWeight: isBottle?700:500, textAlign:"right"}}>{s.avgDays}d avg</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stale / overdue list */}
          <div className="card" style={{borderColor:"#E9CDC9"}}>
            <div className="card-header" style={{borderBottomColor:"#E9CDC9"}}>
              <span style={{width:6, height:6, borderRadius:"50%", background: "var(--danger)"}}/>
              <div className="card-title" style={{color:"var(--danger)"}}>Atrasados · contactar YA</div>
              <span className="xs muted" style={{marginLeft:"auto"}}>{overdue.length} ítems</span>
            </div>
            <div>
              {overdue.slice(0,5).map(l=>{
                const p = PROPERTIES.find(x=>x.id===l.prop);
                const a = AGENTS.find(x=>x.id===l.agent);
                return (
                  <div key={l.id} style={{padding:"12px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12}}>
                    <div className="avatar-sm">{a?.init}</div>
                    <div style={{flex:1, minWidth:0}}>
                      <div className="row" style={{gap:6}}>
                        <span style={{fontWeight:600, fontSize:13.5}}>{l.name}</span>
                        {l.hot && <span className="tag gold" style={{padding:"1px 6px", fontSize:10}}>HOT</span>}
                      </div>
                      <div className="xs muted">{p?.addr}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div className="num xs" style={{color:"var(--danger)", fontWeight:700}}>{l.days}d</div>
                      <div className="xs muted">{fmtUSD(p?.usd||0).replace("USD ","")}</div>
                    </div>
                    <button className="icon-btn" style={{color:"var(--success)"}}><Icons.Whatsapp size={15}/></button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

function avgDaysInStage(key){
  const map = { consulta: 4, visita: 7, oferta: 12, reserva: 9, escritura: 18 };
  return map[key] || 0;
}

window.SalesPanel = SalesPanel;
