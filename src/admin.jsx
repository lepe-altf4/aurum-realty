// Admin settings (compact, placeholder-quality but real-feeling)
function AdminSettings(){
  const { AGENTS, SOURCES } = window.AR_DATA;
  const { Topbar, Tag } = window.UI;
  const { Icons } = window;

  return (
    <>
      <Topbar
        crumb="ADMIN · CONFIGURACIÓN"
        title="Admin Settings"
        right={
          <button className="btn primary">Guardar cambios</button>
        }
      />
      <div className="content">
        <div style={{display:"grid", gridTemplateColumns:"220px 1fr", gap:24}}>

          {/* Side nav */}
          <div className="col" style={{gap:2}}>
            {["Organización","Agentes & permisos","Integraciones","Comisiones","Pipeline & etapas","Templates WhatsApp","Cotización USD/ARS","Facturación"].map((s,i)=>(
              <div key={s} className={"nav-item " + (i===0?"active":"")}>{s}</div>
            ))}
          </div>

          <div className="col" style={{gap:18}}>

            {/* Organization card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Organización</div>
                <span className="xs muted" style={{marginLeft:"auto"}}>Plan Premium · 24 usuarios</span>
              </div>
              <div style={{padding:"20px 24px 24px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:18}}>
                <div className="field">
                  <label>Razón social</label>
                  <input className="search focus-ring" style={{minWidth:0, width:"100%"}} defaultValue="Aurum Realty S.A."/>
                </div>
                <div className="field">
                  <label>CUIT</label>
                  <input className="search focus-ring" style={{minWidth:0, width:"100%"}} defaultValue="" placeholder="XX-XXXXXXXX-X"/>
                </div>
                <div className="field">
                  <label>Sucursal principal</label>
                  <input className="search focus-ring" style={{minWidth:0, width:"100%"}} defaultValue="Av. Alvear 1780, CABA"/>
                </div>
                <div className="field">
                  <label>Cotización dólar (manual)</label>
                  <div className="row" style={{gap:8}}>
                    <input className="search focus-ring num" style={{minWidth:0, width:"100%"}} defaultValue="1.245,00"/>
                    <span className="tag gold">ARS/USD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Agents */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Agentes activos</div>
                <button className="btn ghost" style={{marginLeft:"auto"}}><Icons.Plus size={14}/>Invitar</button>
              </div>
              <table className="t">
                <thead>
                  <tr>
                    <th>Nombre</th><th>Rol</th><th>Email</th><th>Comisión</th><th style={{textAlign:"right", paddingRight:18}}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {AGENTS.map((a,i)=>(
                    <tr key={a.id}>
                      <td>
                        <div className="row" style={{gap:10}}>
                          <div className="avatar-sm">{a.init}</div>
                          <span className="row-name">{a.name}</span>
                        </div>
                      </td>
                      <td>{i===0? "Senior" : i<3? "Agente":"Junior"}</td>
                      <td className="muted">{a.name.split(" ")[0].toLowerCase()}@aurum.com.ar</td>
                      <td className="num">{i===0? "3.5%" : "3.0%"}</td>
                      <td style={{textAlign:"right", paddingRight:18}}>
                        <Tag variant="success" dot>ACTIVO</Tag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Integrations */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Integraciones</div>
              </div>
              <div style={{padding:"6px 18px 16px"}}>
                {[
                  {n:"WhatsApp Business",     desc:"Mensajería automática y bot",           on:true,  c:"var(--success)"},
                  {n:"ZonaProp",              desc:"Sincronización de publicaciones",      on:true,  c:"var(--ink)"},
                  {n:"Argenprop",             desc:"Importar leads de avisos",             on:true,  c:"var(--ink)"},
                  {n:"Instagram Lead Ads",    desc:"Captura desde campañas Meta",         on:false, c:"var(--ink-3)"},
                  {n:"DNI scan (AFIP)",       desc:"Validación de identidad",              on:true,  c:"var(--ink)"},
                  {n:"Escribanía Otero",      desc:"Agendamiento de escrituración",        on:false, c:"var(--ink-3)"},
                ].map((it,i,arr)=>(
                  <div key={it.n} className="row" style={{padding:"14px 6px", borderBottom: i<arr.length-1? "1px solid var(--border)":"0", gap:12}}>
                    <div style={{width:36, height:36, borderRadius:8, background:"var(--surface)", display:"grid", placeItems:"center", color:it.c}}>
                      <Icons.Doc size={16}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600}}>{it.n}</div>
                      <div className="xs muted">{it.desc}</div>
                    </div>
                    <Toggle on={it.on}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Toggle({ on }){
  return (
    <div style={{
      width:38, height:22, borderRadius:11,
      background: on? "var(--success)":"var(--surface-2)",
      border: "1px solid " + (on? "var(--success)":"var(--border-strong)"),
      position:"relative", flexShrink:0
    }}>
      <div style={{
        position:"absolute", top:2, left: on? 18: 2,
        width:16, height:16, borderRadius:"50%", background:"#fff",
        boxShadow:"0 1px 2px rgba(0,0,0,0.18)", transition:"left .12s"
      }}/>
    </div>
  );
}

window.AdminSettings = AdminSettings;
