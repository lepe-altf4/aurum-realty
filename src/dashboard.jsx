// Executive Dashboard — OWNER view: elegante, sobrio, mucho aire.
// All monetary values are displayed bimonetarily: primary big, secondary small/gray.
// The currency switch in the top bar selects which one is primary.
// Conversion rate comes from Admin Settings (ARS per USD).
const { useState: useStateD } = React;

const RATE_ARS_PER_USD = 1245;  // synced with Admin Settings cotización

// All revenue/values stored in USD canonical. DualPrice converts on render.
function DualPrice({ usd, primary, size="md", suffix="", align="left", inline=false }){
  const ars = usd * RATE_ARS_PER_USD;
  const isUsd = primary === "USD";
  const primaryAmount = isUsd ? usd : ars;
  const primaryLabel  = isUsd ? "USD" : "ARS";
  const secondaryAmount = isUsd ? ars : usd;
  const secondaryLabel  = isUsd ? "ARS" : "USD";

  // Format with es-AR thousands separator, no decimals
  const fmt = (n) => Math.round(n).toLocaleString("es-AR");

  const sizes = {
    hero: { p: 56, s: 15, w: 700, ls:"-0.025em", gap:6 },
    xl:   { p: 42, s: 13, w: 700, ls:"-0.022em", gap:5 },
    lg:   { p: 32, s: 12, w: 700, ls:"-0.02em",  gap:4 },
    md:   { p: 22, s: 11, w: 700, ls:"-0.015em", gap:3 },
    sm:   { p: 16, s: 11, w: 700, ls:"-0.01em",  gap:2 },
    xs:   { p: 14, s: 10, w: 700, ls:"-0.005em", gap:2 },
  };
  const sz = sizes[size] || sizes.md;

  return (
    <div style={{textAlign: align, display: inline ? "inline-block" : "block"}}>
      <div className="num" style={{
        fontFamily: "'Plus Jakarta Sans'",
        fontWeight: sz.w,
        fontSize: sz.p,
        letterSpacing: sz.ls,
        lineHeight: 1.05,
        color: "var(--ink)"
      }}>
        {primaryLabel} {fmt(primaryAmount)}{suffix}
      </div>
      <div className="num" style={{
        color: "var(--ink-3)",
        fontSize: sz.s,
        marginTop: sz.gap,
        fontWeight: 500,
        opacity: 0.85
      }}>
        ≈ {secondaryLabel} {fmt(secondaryAmount)}{suffix}
      </div>
    </div>
  );
}

function CurrencySwitch({ value, onChange }){
  return (
    <div style={{
      display:"inline-flex", padding:3, background:"var(--surface)",
      border:"1px solid var(--border)", borderRadius:10, gap:2
    }}>
      {[
        { k:"USD", label:"USD" },
        { k:"ARS", label:"ARS" },
      ].map(opt => {
        const active = value === opt.k;
        return (
          <button
            key={opt.k}
            onClick={()=>onChange(opt.k)}
            className="focus-ring"
            style={{
              padding:"7px 14px", borderRadius:7, border:0, cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:12,
              letterSpacing:"0.06em",
              background: active ? "var(--ink)" : "transparent",
              color: active ? "#fff" : "var(--ink-2)",
              transition: "background .12s, color .12s",
              boxShadow: active ? "0 1px 0 rgba(36,25,17,0.06), 0 4px 10px -4px rgba(36,25,17,0.18)" : "none"
            }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ExecutiveDashboard(){
  const { AGENTS } = window.AR_DATA;
  const { Topbar, KPI, Spark } = window.UI;
  const { Icons } = window;

  const [primary, setPrimary] = useStateD("USD");

  const months = ["Sep","Oct","Nov","Dic","Ene","Feb","Mar","Abr","May"];
  const revVenta    = [820, 940, 1050, 880, 1180, 1240, 1380, 1450, 1620];
  const revAlquiler = [180, 195, 210, 220, 240, 252, 265, 278, 295];

  const pad = { card: "30px 34px" };

  return (
    <>
      <Topbar
        crumb="LEADERSHIP · ANÁLISIS"
        title="Executive Dashboard"
        right={
          <>
            <div className="row" style={{gap:8, marginRight:4}}>
              <div className="xs muted num" style={{
                padding:"6px 10px", border:"1px solid var(--border)",
                borderRadius:8, background:"var(--surface)",
                fontFamily:"'JetBrains Mono', monospace"
              }}>
                ARS 1.245,00 / USD
              </div>
              <CurrencySwitch value={primary} onChange={setPrimary}/>
            </div>
            <button className="btn ghost"><Icons.Calendar size={15}/>Mayo 2026</button>
            <button className="btn ghost"><Icons.Download size={15}/>Exportar</button>
          </>
        }
      />
      <div className="content" style={{padding:"40px 48px 64px", maxWidth:1440, margin:"0 auto"}}>

        {/* Hero — Revenue */}
        <div style={{display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:22, marginBottom:28}}>

          <div className="card" style={{padding: pad.card}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
              <div>
                <div className="kpi-label" style={{letterSpacing:"0.18em"}}>Revenue del mes</div>
                <div style={{marginTop:14}}>
                  <DualPrice usd={1915000} primary={primary} size="hero"/>
                </div>
                <div className="row" style={{gap:14, marginTop:12}}>
                  <span className="delta up" style={{fontSize:14, fontWeight:700}}>▲ 24.6%</span>
                  <span className="sm muted">vs. abril 2026</span>
                </div>
              </div>

              <div style={{textAlign:"right"}}>
                <div className="kpi-label">Meta mensual</div>
                <div style={{marginTop:8}}>
                  <DualPrice usd={2100000} primary={primary} size="md" align="right"/>
                </div>
                <div className="row" style={{gap:8, marginTop:8, justifyContent:"flex-end"}}>
                  <span className="tag gold">91% alcanzado</span>
                </div>
              </div>
            </div>

            <div style={{height:8, background:"var(--surface)", borderRadius:4, marginTop:30, position:"relative"}}>
              <div style={{position:"absolute", inset:0, width:"91%", background:"var(--ink)", borderRadius:4}}/>
              <div style={{position:"absolute", left:"100%", top:-4, transform:"translateX(-50%)", width:2, height:16, background:"var(--gold)"}}/>
            </div>

            <div className="row" style={{justifyContent:"space-between", marginTop:18}}>
              <div className="row" style={{gap:24}}>
                <div>
                  <div className="xs muted" style={{textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, marginBottom:6}}>Venta</div>
                  <DualPrice usd={1620000} primary={primary} size="sm"/>
                </div>
                <div style={{width:1, height:48, background:"var(--border)"}}/>
                <div>
                  <div className="xs muted" style={{textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, marginBottom:6}}>Alquiler</div>
                  <DualPrice usd={295000} primary={primary} size="sm"/>
                </div>
              </div>
            </div>

            {/* 9-month chart */}
            <div style={{marginTop:36}}>
              <div className="row" style={{justifyContent:"space-between", marginBottom:16}}>
                <div className="kpi-label">Evolución 9 meses</div>
                <div className="row sm" style={{gap:18}}>
                  <span className="row" style={{gap:6}}><span style={{width:10, height:10, background:"var(--ink)", borderRadius:2}}/> Venta</span>
                  <span className="row" style={{gap:6}}><span style={{width:10, height:10, background:"var(--gold)", borderRadius:2}}/> Alquiler</span>
                </div>
              </div>
              <BarChart months={months} venta={revVenta} alq={revAlquiler}/>
            </div>
          </div>

          {/* Right column: operations metrics stacked (non-monetary, no DualPrice) */}
          <div className="col" style={{gap:22}}>
            <KPIBig label="Propiedades vendidas" value="18" delta="+6 vs. abril" />
            <KPIBig label="Alquileres firmados" value="11" delta="+2 vs. abril" accent="gold"/>
            <KPIBig label="Tasa de conversión"   value="14.2%" delta="+1.8pp vs. abril" accent="success"/>
          </div>
        </div>

        {/* Donut & rankings */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:22, marginBottom:28}}>

          {/* Donut */}
          <div className="card" style={{padding: pad.card}}>
            <div className="kpi-label">Mix de operaciones</div>
            <div style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:22, marginTop:6}}>29 cerradas este mes</div>

            <div style={{display:"flex", justifyContent:"center", margin:"36px 0 28px"}}>
              <BigDonut/>
            </div>

            <div className="col" style={{gap:16}}>
              {[
                {l:"Venta · Premium",   sub:"Ticket > USD 500k",   v:"42%", c:"var(--gold)"},
                {l:"Venta · Estándar",  sub:"Ticket < USD 500k",   v:"34%", c:"var(--ink)"},
                {l:"Alquiler residencial", sub:"Departamentos y casas", v:"18%", c:"var(--ink-3)"},
                {l:"Alquiler comercial",   sub:"Locales y oficinas",    v:"6%",  c:"var(--ink-4)"},
              ].map(s=>(
                <div key={s.l} className="row" style={{justifyContent:"space-between", paddingBottom:14, borderBottom:"1px solid var(--border)"}}>
                  <div className="row" style={{gap:12}}>
                    <span style={{width:10, height:10, borderRadius:3, background:s.c, flexShrink:0, marginTop:5, alignSelf:"flex-start"}}/>
                    <div>
                      <div style={{fontWeight:600, fontSize:13.5}}>{s.l}</div>
                      <div className="xs muted" style={{marginTop:2}}>{s.sub}</div>
                    </div>
                  </div>
                  <div className="num" style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:18}}>{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking of agents */}
          <div className="card" style={{padding:0}}>
            <div style={{padding:"28px 34px 18px"}}>
              <div className="kpi-label">Ranking de agentes</div>
              <div className="row" style={{justifyContent:"space-between", alignItems:"flex-end"}}>
                <div style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:22, marginTop:6}}>Top performers · Mayo</div>
                <span className="tag gold" style={{padding:"4px 10px"}}>{AGENTS.length} agentes activos</span>
              </div>
            </div>
            <table className="t">
              <thead>
                <tr>
                  <th style={{width:50, paddingLeft:34}}>#</th>
                  <th>Agente</th>
                  <th style={{textAlign:"right"}}>Operaciones</th>
                  <th style={{textAlign:"right"}}>Revenue</th>
                  <th style={{textAlign:"right", paddingRight:34}}>Performance</th>
                </tr>
              </thead>
              <tbody>
                {AGENTS.map((a,i)=>(
                  <tr key={a.id}>
                    <td style={{paddingLeft:34, verticalAlign:"middle"}}>
                      <div className="num" style={{fontWeight:700, fontFamily:"'Plus Jakarta Sans'", fontSize:18, color: i===0?"var(--gold)":"var(--ink-3)"}}>
                        {String(i+1).padStart(2,"0")}
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{gap:14, padding:"4px 0"}}>
                        <div className="avatar-sm" style={{width:36, height:36, fontSize:13}}>{a.init}</div>
                        <div>
                          <div className="row-name" style={{fontSize:14}}>{a.name}</div>
                          <div className="row-sub">{i===0?"Senior · Aurum BA":"Agente · Aurum BA"}</div>
                        </div>
                        {i===0 && <span className="tag gold" style={{padding:"2px 8px", fontSize:10}}>TOP</span>}
                      </div>
                    </td>
                    <td className="num" style={{textAlign:"right", fontWeight:700, fontFamily:"'Plus Jakarta Sans'", fontSize:16}}>{a.deals}</td>
                    <td style={{textAlign:"right"}}>
                      <DualPrice usd={a.rev} primary={primary} size="xs" align="right"/>
                    </td>
                    <td style={{paddingRight:34}}>
                      <div className="row" style={{justifyContent:"flex-end", gap:10}}>
                        <div style={{width:120, height:6, background:"var(--surface)", borderRadius:3}}>
                          <div style={{width: (a.rev/AGENTS[0].rev*100)+"%", height:"100%", background: i===0?"var(--gold)":"var(--ink)", borderRadius:3}}/>
                        </div>
                        <span className="num muted" style={{minWidth:42, textAlign:"right", fontWeight:600}}>{Math.round(a.rev/AGENTS[0].rev*100)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ticket promedio + Comisiones */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1.2fr", gap:22, marginBottom:28}}>

          <div className="card" style={{padding: pad.card}}>
            <div className="kpi-label">Ticket promedio</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:30, marginTop:18}}>
              <div>
                <div className="xs muted" style={{textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, marginBottom:8}}>Venta</div>
                <DualPrice usd={320400} primary={primary} size="lg"/>
                <div className="xs delta up" style={{marginTop:6}}>▲ 6.2% vs. abril</div>
              </div>
              <div>
                <div className="xs muted" style={{textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600, marginBottom:8}}>Alquiler /mes</div>
                <DualPrice usd={2680} primary={primary} size="lg" suffix=""/>
                <div className="xs delta down" style={{marginTop:6}}>▼ 1.1% vs. abril</div>
              </div>
            </div>

            <div style={{height:1, background:"var(--border)", margin:"32px 0 24px"}}/>

            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:30}}>
              <div>
                <div className="xs muted" style={{textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600}}>Tiempo de cierre</div>
                <div className="num" style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:26, marginTop:8}}>42 <span className="xs muted" style={{fontWeight:500, marginLeft:4}}>días</span></div>
                <div className="xs muted">consulta → escritura</div>
              </div>
              <div>
                <div className="xs muted" style={{textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:600}}>Days on market</div>
                <div className="num" style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:26, marginTop:8}}>61 <span className="xs muted" style={{fontWeight:500, marginLeft:4}}>días</span></div>
                <div className="xs muted">prom. inventario</div>
              </div>
            </div>
          </div>

          {/* Comisiones */}
          <div className="card" style={{padding: pad.card}}>
            <div className="row" style={{justifyContent:"space-between", alignItems:"flex-start"}}>
              <div>
                <div className="kpi-label">Comisiones a liquidar</div>
                <div style={{marginTop:14}}>
                  <DualPrice usd={86400} primary={primary} size="xl"/>
                </div>
                <div className="sm muted" style={{marginTop:8}}>28 operaciones · cierre <b style={{color:"var(--ink)"}}>31/05/2026</b></div>
              </div>
              <span className="tag gold" style={{padding:"4px 12px"}}>PROYECTADO</span>
            </div>

            <div style={{height:1, background:"var(--border)", margin:"28px 0 18px"}}/>

            {AGENTS.slice(0,5).map((a,i)=>{
              const rate = i===0? 0.035 : 0.030;
              const comm = Math.round(a.rev * rate);
              return (
                <div key={a.id} className="row" style={{justifyContent:"space-between", padding:"12px 0", borderBottom: i<4? "1px dashed var(--border)":"0"}}>
                  <div className="row" style={{gap:12}}>
                    <div className="avatar-sm" style={{width:32, height:32, fontSize:11}}>{a.init}</div>
                    <div>
                      <div style={{fontWeight:600, fontSize:13.5}}>{a.name}</div>
                      <div className="xs muted">{a.deals} operaciones · {(rate*100).toFixed(1)}%</div>
                    </div>
                  </div>
                  <DualPrice usd={comm} primary={primary} size="xs" align="right"/>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top barrios + Origen */}
        <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:22}}>
          <div className="card" style={{padding: pad.card}}>
            <div className="kpi-label">Top barrios por revenue</div>
            <div style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:22, marginTop:6, marginBottom:24}}>Distribución geográfica · Mayo</div>
            {[
              {n:"Recoleta",          rev:485000, ops:6, pct:100},
              {n:"Palermo Chico",     rev:412000, ops:4, pct:85},
              {n:"Nordelta",          rev:298000, ops:3, pct:61},
              {n:"Barrio Norte",      rev:215000, ops:5, pct:44},
              {n:"Belgrano",          rev:180000, ops:4, pct:37},
              {n:"Palermo Hollywood", rev:120000, ops:3, pct:25},
            ].map((b,i)=>(
              <div key={b.n} className="row" style={{padding:"14px 0", borderBottom: i<5? "1px solid var(--border)":"0", gap:18}}>
                <span className="num muted" style={{width:28, fontFamily:"'Plus Jakarta Sans'", fontWeight:600}}>{String(i+1).padStart(2,"0")}</span>
                <span style={{fontWeight:600, fontSize:14, width:200}}>{b.n}</span>
                <div style={{flex:1, height:10, background:"var(--surface)", borderRadius:5}}>
                  <div style={{width: b.pct+"%", height:"100%", background: i===0?"var(--gold)":"var(--ink)", borderRadius:5}}/>
                </div>
                <span className="num muted" style={{width:60, textAlign:"right"}}>{b.ops} ops</span>
                <div style={{width:160, textAlign:"right"}}>
                  <DualPrice usd={b.rev} primary={primary} size="xs" align="right"/>
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{padding: pad.card}}>
            <div className="kpi-label">Origen de leads</div>
            <div style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:22, marginTop:6, marginBottom:24}}>238 leads captados</div>
            {[
              {name:"WhatsApp",  pct: 34, color:"var(--success)"},
              {name:"Instagram", pct: 22, color:"var(--ink)"},
              {name:"ZonaProp",  pct: 18, color:"var(--ink-2)"},
              {name:"Web",       pct: 12, color:"var(--ink-3)"},
              {name:"Argenprop", pct:  9, color:"var(--ink-4)"},
              {name:"Referido",  pct:  5, color:"var(--gold)"},
            ].map((s,i,arr)=>(
              <div key={s.name} style={{paddingBottom:18, marginBottom: i<arr.length-1? 18:0, borderBottom: i<arr.length-1?"1px solid var(--border)":"0"}}>
                <div className="row" style={{justifyContent:"space-between"}}>
                  <div className="row" style={{gap:10}}>
                    <span style={{width:10, height:10, borderRadius:3, background:s.color}}/>
                    <span style={{fontWeight:600, fontSize:13.5}}>{s.name}</span>
                  </div>
                  <div className="num" style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:16}}>{s.pct}%</div>
                </div>
                <div style={{height:6, background:"var(--surface)", borderRadius:3, marginTop:8}}>
                  <div style={{width: s.pct+"%", height:"100%", background:s.color, borderRadius:3}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}

function KPIBig({ label, value, delta, accent }){
  const color = accent==="success"? "var(--success)" : accent==="gold"? "var(--gold)" : "var(--ink)";
  return (
    <div className="card" style={{padding:"24px 28px", flex:1, display:"flex", flexDirection:"column", justifyContent:"center"}}>
      <div className="kpi-label">{label}</div>
      <div className="num" style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:36, marginTop:10, letterSpacing:"-0.02em", color}}>{value}</div>
      <div className="row" style={{gap:8, marginTop:6}}>
        <span className="delta up" style={{fontWeight:600}}>▲ {delta}</span>
      </div>
    </div>
  );
}

function BarChart({ months, venta, alq }){
  const max = Math.max(...venta.map((v,i)=>v+alq[i]));
  return (
    <div style={{display:"grid", gridTemplateColumns:`repeat(${months.length}, 1fr)`, gap:18, alignItems:"end", height:170}}>
      {months.map((m,i)=>{
        const ventaH = venta[i]/max*100;
        const alqH = alq[i]/max*100;
        const isCurrent = i===months.length-1;
        return (
          <div key={m} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:10, height:"100%"}}>
            <div style={{flex:1, width:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end", gap:3}}>
              <div style={{height: alqH+"%", background:"var(--gold)", borderRadius:"3px 3px 0 0", opacity: isCurrent?1:0.85}}/>
              <div style={{height: ventaH+"%", background:"var(--ink)", opacity: isCurrent?1:0.85}}/>
            </div>
            <div className="xs" style={{fontWeight: isCurrent?700:500, color: isCurrent?"var(--ink)":"var(--ink-3)", letterSpacing:"0.06em", textTransform:"uppercase"}}>{m}</div>
          </div>
        );
      })}
    </div>
  );
}

function BigDonut(){
  const segs = [
    {pct:42, c:"var(--gold)"},
    {pct:34, c:"var(--ink)"},
    {pct:18, c:"var(--ink-3)"},
    {pct: 6, c:"var(--ink-4)"},
  ];
  let offset = 0;
  const r = 84, C = 2*Math.PI*r;
  return (
    <svg width="260" height="260" viewBox="0 0 260 260">
      <g transform="translate(130,130) rotate(-90)">
        <circle r={r} fill="none" stroke="var(--surface)" strokeWidth="28"/>
        {segs.map((s,i)=>{
          const len = (s.pct/100)*C;
          const dasharray = `${len} ${C-len}`;
          const el = (
            <circle key={i} r={r} fill="none" stroke={s.c} strokeWidth="28"
              strokeDasharray={dasharray} strokeDashoffset={-offset} strokeLinecap="butt"/>
          );
          offset += len;
          return el;
        })}
      </g>
      <text x="130" y="124" textAnchor="middle" style={{fontFamily:"Plus Jakarta Sans", fontWeight:700, fontSize:46, fill:"var(--ink)", letterSpacing:"-0.02em"}}>29</text>
      <text x="130" y="148" textAnchor="middle" style={{fontFamily:"Inter", fontSize:11, fill:"var(--ink-3)", letterSpacing:"0.16em", fontWeight:600}}>OPERACIONES</text>
      <text x="130" y="166" textAnchor="middle" style={{fontFamily:"Inter", fontSize:11, fill:"var(--ink-4)"}}>MAYO 2026</text>
    </svg>
  );
}

window.ExecutiveDashboard = ExecutiveDashboard;
