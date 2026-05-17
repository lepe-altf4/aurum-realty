// Pipeline Kanban — filter by operation (Todas / Ventas / Alquileres).
// Each property carries its own currency (USD or ARS, independent of operation
// type). Cards show the property's price in its own currency; column totals
// are split per currency in compact notation.
const { useState: useStateK, useMemo: useMemoK } = React;

// Compact currency formatter for column totals. Avoids long numbers overlapping
// in narrow columns. Spanish convention: comma as decimal separator.
//   12.000      → "12K"
//   350.000     → "350K"
//   1.800.000   → "1,8M"
//   485.000.000 → "485M"
//   1.450.000.000 → "1,5B"
const compactNum = (n) => {
  if (n >= 1_000_000_000) {
    const b = n / 1_000_000_000;
    return (b >= 10 ? Math.round(b).toString() : b.toFixed(1).replace(/\.0$/, "")).replace(".", ",") + "B";
  }
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return (m >= 10 ? Math.round(m).toString() : m.toFixed(1).replace(/\.0$/, "")).replace(".", ",") + "M";
  }
  if (n >= 1_000) return Math.round(n / 1000) + "K";
  return n.toString();
};

function Pipeline({ onOpenLead }){
  const { LEADS, STAGES, PROPERTIES, AGENTS, fmtPrice, fmtMixed } = window.AR_DATA;
  const { Topbar } = window.UI;
  const { Icons } = window;

  // Three-state operation filter
  const [op, setOp] = useStateK("Todas"); // 'Todas' | 'Venta' | 'Alquiler'

  const findProp = (id) => PROPERTIES.find(p=>p.id===id);
  const findAgent = (id) => AGENTS.find(a=>a.id===id);

  const leadsFiltered = useMemoK(()=> LEADS.filter(l => op === "Todas" || l.op === op), [op]);

  return (
    <>
      <Topbar
        crumb="WORKSPACE · PIPELINE"
        title="Pipeline de Operaciones"
        right={
          <>
            <button className="btn ghost"><Icons.Filter size={15}/>Filtros</button>
            <button className="btn primary"><Icons.Plus size={15}/>Nuevo Lead</button>
          </>
        }
      />
      <div className="content">

        {/* Operation switch */}
        <div className="row" style={{marginBottom:18, gap:14, flexWrap:"wrap"}}>
          <OpSwitch op={op} onChange={setOp}/>
          <span className="xs muted" style={{marginLeft:6}}>
            Mostrando <b style={{color:"var(--ink)"}}>{leadsFiltered.length}</b> operaciones · cada propiedad en su moneda asignada
          </span>

          <div className="row" style={{gap:14, marginLeft:"auto"}}>
            <div className="row sm muted" style={{gap:18}}>
              <div className="row" style={{gap:6}}><div style={{width:8,height:8, borderRadius:"50%", background:"var(--gold)"}}/> Premium</div>
              <div className="row" style={{gap:6}}><div style={{width:8,height:8, borderRadius:"50%", background:"var(--danger)"}}/> Atrasado</div>
            </div>
            <div className="chip"><Icons.Sparkle size={14}/> Mis leads (12)</div>
            <div className="chip active"><Icons.Pipeline size={14}/> Todos los agentes</div>
          </div>
        </div>

        <div className="kanban">
          {STAGES.map((stage, sIdx)=>{
            const cards = leadsFiltered.filter(l=>l.stage===stage.key);
            const props = cards.map(l => findProp(l.prop)).filter(Boolean);
            const totals = fmtMixed(props);
            return (
              <div key={stage.key} className="kcol">
                <div className="kcol-head" style={{flexDirection:"column", alignItems:"stretch", gap:8, padding:"4px 4px 10px", borderBottom:"1px dashed var(--border)", marginBottom:6}}>
                  <div className="row" style={{justifyContent:"space-between", alignItems:"center"}}>
                    <div className="kcol-title">
                      <span style={{width:6, height:6, borderRadius:"50%", background: sIdx===4?"var(--success)": sIdx===3?"var(--gold)":"var(--ink)"}}/>
                      {stage.label}
                    </div>
                    <div style={{
                      minWidth:22, height:22, padding:"0 7px", borderRadius:11,
                      background: cards.length===0 ? "transparent" : "var(--ink)",
                      color: cards.length===0 ? "var(--ink-3)" : "#fff",
                      border: cards.length===0 ? "1px solid var(--border)" : "0",
                      display:"inline-flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:11.5,
                      fontVariantNumeric:"tabular-nums"
                    }}>{cards.length}</div>
                  </div>
                  <ColumnTotals totals={totals}/>
                </div>

                {cards.map(l=>{
                  const p = findProp(l.prop);
                  const a = findAgent(l.agent);
                  return (
                    <div key={l.id} className="kcard" draggable="true" onClick={()=>onOpenLead(l)}>
                      <div className="row" style={{justifyContent:"space-between", marginBottom:6}}>
                        <span className="mono xs muted">{l.id}</span>
                        <div className="row" style={{gap:5}}>
                          <span className="xs" style={{
                            padding:"1px 5px", borderRadius:3, fontWeight:700, fontSize:9, letterSpacing:"0.08em",
                            background: p?.ccy==="USD"?"var(--ink)":"var(--gold)",
                            color: p?.ccy==="USD"?"#fff":"var(--ink)"
                          }}>{p?.ccy}</span>
                          {p?.premium && <span style={{width:6, height:6, borderRadius:"50%", background:"var(--gold)"}}/>}
                          {l.days>5 && <span style={{width:6, height:6, borderRadius:"50%", background:"var(--danger)"}}/>}
                        </div>
                      </div>
                      <h5>{l.name}</h5>
                      <div className="xs muted" style={{lineHeight:1.4}}>{p?.addr}</div>
                      <div className="xs muted">{p?.neigh} · {p?.type} · <span style={{textTransform:"uppercase", fontWeight:600, letterSpacing:"0.05em"}}>{l.op}</span></div>
                      <div className="row" style={{justifyContent:"space-between", marginTop:10}}>
                        <span className="num xs" style={{fontWeight:700, color:"var(--ink)"}}>
                          {p ? fmtPrice(p) : "—"}
                        </span>
                        <div className="avatar-sm" style={{width:22, height:22, fontSize:10}}>{a?.init}</div>
                      </div>
                      <div className="meta">
                        <span className="xs muted">{l.date}</span>
                        <span style={{marginLeft:"auto"}} className="xs" >
                          {l.days===0? <span style={{color:"var(--success)"}}>Hoy</span>: <span style={{color: l.days>5?"var(--danger)":"var(--ink-3)"}}>{l.days}d sin contacto</span>}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {cards.length===0 && (
                  <div className="xs muted" style={{textAlign:"center", padding:"24px 8px"}}>Vacío</div>
                )}
                <button className="btn subtle" style={{marginTop:"auto", justifyContent:"center"}}>
                  <Icons.Plus size={14}/> Agregar lead
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function ColumnTotals({ totals }){
  if (!totals || totals.length === 0) {
    return <div className="mono xs" style={{color:"var(--ink-4)", fontSize:11}}>—</div>;
  }
  return (
    <div className="col" style={{gap:2}}>
      {totals.map((t,i)=>{
        const prefix = t.ccy === "USD" ? "USD" : "$";
        return (
          <div key={i} className="mono" style={{
            fontSize:11, color:"var(--ink-3)",
            fontFamily:"'JetBrains Mono', monospace",
            fontVariantNumeric:"tabular-nums",
            letterSpacing:"-0.01em"
          }}>
            {prefix} {compactNum(t.n)}
          </div>
        );
      })}
    </div>
  );
}

function OpSwitch({ op, onChange }){
  const opts = [
    { k:"Todas",    label:"Todas",      sub:"Operaciones" },
    { k:"Venta",    label:"Ventas",     sub:"Compraventa" },
    { k:"Alquiler", label:"Alquileres", sub:"Renta mensual" },
  ];
  return (
    <div style={{
      display:"inline-flex", padding:3, background:"var(--surface)",
      border:"1px solid var(--border)", borderRadius:10, gap:2
    }}>
      {opts.map(opt => {
        const active = op === opt.k;
        return (
          <button
            key={opt.k}
            onClick={()=>onChange(opt.k)}
            className="focus-ring"
            style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"8px 14px", borderRadius:7, border:0, cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans'", fontWeight:600, fontSize:13,
              background: active ? "var(--ink)" : "transparent",
              color: active ? "#fff" : "var(--ink-2)",
              transition: "background .12s, color .12s",
              boxShadow: active ? "0 1px 0 rgba(36,25,17,0.06), 0 4px 10px -4px rgba(36,25,17,0.18)" : "none"
            }}>
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

window.Pipeline = Pipeline;
