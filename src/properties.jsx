// Properties list
const { useState: useStateP } = React;

function Properties(){
  const { PROPERTIES, fmtUSD, fmtARS } = window.AR_DATA;
  const { Topbar, StatusTag, OpTag, Photo, TypeIcon, Tag } = window.UI;
  const { Icons } = window;

  const [op, setOp] = useStateP("Todas");
  const [type, setType] = useStateP("Todos");

  const types = ["Todos","Casa","Departamento","Lote","Local"];
  const rows = PROPERTIES.filter(p =>
    (op==="Todas" || p.op===op) &&
    (type==="Todos" || p.type===type)
  );

  return (
    <>
      <Topbar
        crumb="WORKSPACE · INVENTARIO"
        title="Propiedades"
        right={
          <>
            <button className="btn ghost"><Icons.Download size={15}/>Importar ZonaProp</button>
            <button className="btn primary"><Icons.Plus size={15}/>Nueva Propiedad</button>
          </>
        }
      />
      <div className="content">

        {/* mini stats */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:18}}>
          <MiniStat label="Inventario total" value={PROPERTIES.length} sub="propiedades activas" />
          <MiniStat label="Disponibles" value={PROPERTIES.filter(p=>p.status==="Disponible").length} sub="listas para mostrar" />
          <MiniStat label="Reservadas" value={PROPERTIES.filter(p=>p.status==="Reservada").length} sub="con seña en curso" gold />
          <MiniStat label="Vendidas mes" value={PROPERTIES.filter(p=>p.status==="Vendida").length} sub="cerradas en mayo" success />
          <MiniStat label="En alquiler" value={PROPERTIES.filter(p=>p.op==="Alquiler").length} sub="renta mensual" />
        </div>

        {/* Filters + Table */}
        <div className="card">
          <div style={{padding:"14px 18px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
            <Icons.Filter size={15} style={{color:"var(--ink-3)"}}/>
            <span className="xs" style={{textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--ink-3)", fontWeight:600, marginRight:4}}>Operación</span>
            {["Todas","Venta","Alquiler"].map(o=>(
              <button key={o} className={"chip " + (op===o?"active":"")} onClick={()=>setOp(o)}>{o}</button>
            ))}
            <span style={{width:1, height:22, background:"var(--border)", margin:"0 6px"}}/>
            <span className="xs" style={{textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--ink-3)", fontWeight:600, marginRight:4}}>Tipo</span>
            {types.map(t=>(
              <button key={t} className={"chip " + (type===t?"active":"")} onClick={()=>setType(t)}>{t}</button>
            ))}
            <div style={{marginLeft:"auto"}} className="row xs muted">{rows.length} resultados</div>
          </div>

          <div className="scroll">
            <table className="t">
              <thead>
                <tr>
                  <th style={{width:30}}><input type="checkbox"/></th>
                  <th>Propiedad</th>
                  <th>Tipo</th>
                  <th>Barrio</th>
                  <th style={{textAlign:"right"}}>M²</th>
                  <th style={{textAlign:"right"}}>Amb.</th>
                  <th style={{textAlign:"right"}}>Precio USD</th>
                  <th style={{textAlign:"right"}}>Precio ARS</th>
                  <th>Operación</th>
                  <th>Estado</th>
                  <th style={{textAlign:"right", paddingRight:18}}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(p=>(
                  <tr key={p.id}>
                    <td onClick={e=>e.stopPropagation()}><input type="checkbox"/></td>
                    <td>
                      <div className="row" style={{gap:12}}>
                        <Photo label={p.id} src={p.img} type={p.type}/>
                        <div>
                          <div className="row" style={{gap:6}}>
                            <span className="row-name">{p.addr}</span>
                            {p.premium && <span className="tag gold" style={{padding:"1px 6px", fontSize:10}}>PREMIUM</span>}
                          </div>
                          <div className="row-sub mono">{p.id} · {p.neigh}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="row" style={{gap:8}}>
                        <span style={{width:24, height:24, borderRadius:6, background:"var(--surface)", display:"grid", placeItems:"center", color:"var(--ink-2)"}}>
                          <TypeIcon type={p.type} size={13}/>
                        </span>
                        {p.type}
                      </div>
                    </td>
                    <td>{p.neigh}</td>
                    <td className="num" style={{textAlign:"right"}}>{p.m2.toLocaleString("es-AR")}</td>
                    <td className="num" style={{textAlign:"right"}}>{p.amb || "—"}</td>
                    <td className="num" style={{textAlign:"right", fontWeight: p.ccy==="USD"?700:500, color: p.ccy==="USD"?"var(--ink)":"var(--ink-3)"}}>
                      <div className="row" style={{justifyContent:"flex-end", gap:6}}>
                        {p.ccy==="USD" && <span style={{fontSize:9, fontWeight:700, padding:"1px 4px", borderRadius:3, letterSpacing:"0.08em", background:"var(--ink)", color:"#fff"}}>LISTADO</span>}
                        <span>{p.op==="Alquiler" ? `${fmtUSD(p.usd)}/mes` : fmtUSD(p.usd)}</span>
                      </div>
                    </td>
                    <td className="num" style={{textAlign:"right", fontWeight: p.ccy==="ARS"?700:500, color: p.ccy==="ARS"?"var(--ink)":"var(--ink-3)"}}>
                      <div className="row" style={{justifyContent:"flex-end", gap:6}}>
                        {p.ccy==="ARS" && <span style={{fontSize:9, fontWeight:700, padding:"1px 4px", borderRadius:3, letterSpacing:"0.08em", background:"var(--gold)", color:"var(--ink)"}}>LISTADO</span>}
                        <span>{p.op==="Alquiler" ? `${fmtARS(p.ars)}/mes` : fmtARS(p.ars)}</span>
                      </div>
                    </td>
                    <td><OpTag op={p.op}/></td>
                    <td><StatusTag status={p.status}/></td>
                    <td onClick={e=>e.stopPropagation()} style={{textAlign:"right"}}>
                      <div className="row" style={{justifyContent:"flex-end", gap:6}}>
                        <button className="icon-btn" title="Ver"><Icons.Eye size={15}/></button>
                        <button className="icon-btn" title="Más"><Icons.More size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, sub, gold, success }){
  return (
    <div className="card card-pad">
      <div className="kpi-label">{label}</div>
      <div className="row" style={{justifyContent:"space-between", alignItems:"baseline", marginTop:6}}>
        <div className="num" style={{fontFamily:"'Plus Jakarta Sans'", fontWeight:700, fontSize:24, color: success?"var(--success)": gold?"var(--gold)":"var(--ink)"}}>{value}</div>
      </div>
      <div className="xs muted" style={{marginTop:4}}>{sub}</div>
    </div>
  );
}

window.Properties = Properties;
