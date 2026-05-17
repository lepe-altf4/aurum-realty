// Main app shell
function App(){
  const [view, setView] = React.useState("leads");
  const [openLead, setOpenLead] = React.useState(null);

  const { LEADS, PROPERTIES, STAGES } = window.AR_DATA;
  const { Sidebar } = window.UI;

  const counts = {
    leads: LEADS.length,
    pipeline: LEADS.filter(l=>l.stage!=="escritura").length,
    props: PROPERTIES.length,
  };

  const handleMove = (lead) => {
    const idx = STAGES.findIndex(s=>s.key===lead.stage);
    const next = STAGES[Math.min(idx+1, STAGES.length-1)];
    alert(`Mover ${lead.name} → ${next.label}`);
  };

  return (
    <div className="app">
      <Sidebar current={view} onNav={setView} counts={counts}/>
      <div className="main">
        {view==="leads"      && <window.LeadsHub onOpenLead={setOpenLead} onMove={handleMove}/>}
        {view==="pipeline"   && <window.Pipeline onOpenLead={setOpenLead}/>}
        {view==="sales"      && <window.SalesPanel/>}
        {view==="properties" && <window.Properties/>}
        {view==="dashboard"  && <window.ExecutiveDashboard/>}
        {view==="admin"      && <window.AdminSettings/>}
      </div>

      {openLead && <window.LeadDrawer lead={openLead} onClose={()=>setOpenLead(null)} onMove={handleMove}/>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
