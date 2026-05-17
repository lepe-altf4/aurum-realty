// Mock data for Aurum Realty CRM (Argentine real estate)
// Currency formatting helpers
const fmtUSD = (n) => "USD " + n.toLocaleString("es-AR");
const fmtARS = (n) => "$ " + n.toLocaleString("es-AR");
const fmtNum = (n) => n.toLocaleString("es-AR");

const STAGES = [
  { key:"consulta",  label:"Consulta",  hint:"Primer contacto" },
  { key:"visita",    label:"Visita",    hint:"Visita agendada / realizada" },
  { key:"oferta",    label:"Oferta",    hint:"Negociando precio" },
  { key:"reserva",   label:"Reserva",   hint:"Seña / boleto" },
  { key:"escritura", label:"Escritura", hint:"Operación cerrada" },
];

const SOURCES = ["WhatsApp","Instagram","ZonaProp","Argenprop","Web","Referido"];
const OPS = ["Venta","Alquiler"];

const AGENTS = [
  { id:"mp", name:"Mariana Pérez",   init:"MP", deals:9,  rev: 412000 },
  { id:"jt", name:"Joaquín Tarantini",init:"JT", deals:7,  rev: 358000 },
  { id:"vs", name:"Valentina Sosa",  init:"VS", deals:6,  rev: 295000 },
  { id:"lr", name:"Lucas Rivera",    init:"LR", deals:5,  rev: 244000 },
  { id:"cf", name:"Camila Funes",    init:"CF", deals:4,  rev: 198000 },
];

// Unsplash photo URLs — small thumbnails for grids
const u = (id, w=200) => `https://images.unsplash.com/photo-${id}?w=${w}&h=${Math.round(w*0.75)}&fit=crop&auto=format&q=80`;

// Each property carries its own currency. In Argentina, most sales are USD and
// most rentals are ARS — but there are exceptions (premium rentals in USD, sales
// in ARS, etc). The pipeline must respect each property's own currency.
const PROPERTIES = [
  { id:"P-2041", type:"Departamento", addr:"Av. del Libertador 4820 · 8°B", neigh:"Palermo Chico",  m2:142, amb:4, ccy:"USD", price:    485000, usd: 485000, ars: 485000000, status:"Disponible", op:"Venta",    premium:true,  img: u("1600585154340-be6161a56a0c") },
  { id:"P-2039", type:"Casa",         addr:"Los Cipreses 322",              neigh:"Nordelta",       m2:380, amb:6, ccy:"USD", price:    920000, usd: 920000, ars: 920000000, status:"Reservada",  op:"Venta",    premium:true,  img: u("1564013799919-ab600027ffc6") },
  { id:"P-2037", type:"Departamento", addr:"Arenales 1980 · 5°A",           neigh:"Recoleta",       m2: 96, amb:3, ccy:"USD", price:    320000, usd: 320000, ars: 320000000, status:"Disponible", op:"Venta",    premium:false, img: u("1545324418-cc1a3fa10c00") },
  { id:"P-2036", type:"Departamento", addr:"Honduras 4321 · 2°C",           neigh:"Palermo Soho",   m2: 58, amb:2, ccy:"ARS", price:   1800000, usd:   1450, ars:   1800000, status:"Disponible", op:"Alquiler", premium:false, img: u("1502672260266-1c1ef2d93688") },
  { id:"P-2034", type:"Lote",         addr:"Barrio Los Sauces, Lote 14",    neigh:"Pilar",          m2:1200,amb:0, ccy:"USD", price:    215000, usd: 215000, ars: 215000000, status:"Disponible", op:"Venta",    premium:false, img: u("1500382017468-9049fed747ef") },
  { id:"P-2030", type:"Local",        addr:"Av. Santa Fe 2580 PB",          neigh:"Barrio Norte",   m2: 110,amb:1, ccy:"ARS", price:   4200000, usd:   3370, ars:   4200000, status:"Disponible", op:"Alquiler", premium:false, img: u("1582407947304-fd86f028f716") },
  { id:"P-2028", type:"Departamento", addr:"Juncal 1150 · 12°",             neigh:"Retiro",         m2:184, amb:5, ccy:"USD", price:    690000, usd: 690000, ars: 690000000, status:"Vendida",    op:"Venta",    premium:true,  img: u("1600596542815-ffad4c1539a9") },
  { id:"P-2025", type:"Casa",         addr:"Calle 8 entre 32 y 33",         neigh:"La Plata",       m2:240, amb:5, ccy:"ARS", price: 285000000, usd: 229000, ars: 285000000, status:"Disponible", op:"Venta",    premium:false, img: u("1568605114967-8130f3a36994") },
  { id:"P-2022", type:"Departamento", addr:"Gorriti 5440 · 4°",             neigh:"Palermo Hollywood", m2: 72, amb:2, ccy:"USD", price:   2400, usd:   2400, ars:   2400000, status:"Reservada",  op:"Alquiler", premium:false, img: u("1522708323590-d24dbb6b0267") },
  { id:"P-2018", type:"Departamento", addr:"Av. Alvear 1755 · 9°",          neigh:"Recoleta",       m2:220, amb:5, ccy:"USD", price:   1450000, usd:1450000, ars:1450000000, status:"Disponible", op:"Venta",    premium:true,  img: u("1613490493576-7fde63acd811") },
  { id:"P-2014", type:"Lote",         addr:"Las Acacias 102",               neigh:"Cariló",         m2:950, amb:0, ccy:"USD", price:    180000, usd: 180000, ars: 180000000, status:"Disponible", op:"Venta",    premium:false, img: u("1542856391-010fb87dcfed") },
  { id:"P-2010", type:"Local",        addr:"Av. Cabildo 1840",              neigh:"Belgrano",       m2: 78, amb:1, ccy:"ARS", price:   3200000, usd:   2570, ars:   3200000, status:"Alquilada",  op:"Alquiler", premium:false, img: u("1604328698692-f76ea9498e76") },
];

// Format an amount given its currency. Adds "/mes" for rentals.
const fmtPrice = (prop) => {
  const n = prop.price.toLocaleString("es-AR");
  const base = prop.ccy === "USD" ? `USD ${n}` : `ARS ${n}`;
  return prop.op === "Alquiler" ? `${base} /mes` : base;
};

// Combine totals from a list of properties into a string like "USD X + ARS Y"
const fmtMixed = (props) => {
  const usd = props.filter(p=>p.ccy==="USD").reduce((s,p)=>s+p.price,0);
  const ars = props.filter(p=>p.ccy==="ARS").reduce((s,p)=>s+p.price,0);
  const parts = [];
  if (usd > 0) parts.push({ ccy:"USD", n: usd });
  if (ars > 0) parts.push({ ccy:"ARS", n: ars });
  return parts;
};

const LEADS = [
  { id:"L-841", name:"Ramiro Achával",     phone:"+54 9 11 5234-1180", email:"r.achaval@gmail.com",     src:"WhatsApp",  prop:"P-2041", op:"Venta",    stage:"oferta",    date:"15 May", agent:"mp", days:1,  hot:true,  notes:"Cliente con preaprobación bancaria. Pidió cocheras adicionales." },
  { id:"L-840", name:"Florencia Bianchi",  phone:"+54 9 11 4192-7755", email:"flor.bianchi@hotmail.com",src:"Instagram", prop:"P-2036", op:"Alquiler", stage:"visita",    date:"15 May", agent:"vs", days:0,  hot:false, notes:"Mudanza desde Córdoba en julio. Necesita pet-friendly." },
  { id:"L-838", name:"Damián Ortega",      phone:"+54 9 11 6711-2204", email:"d.ortega@estudio.law",    src:"ZonaProp",  prop:"P-2018", op:"Venta",    stage:"reserva",   date:"14 May", agent:"jt", days:0,  hot:true,  notes:"Inversor. Solicita firma de boleto la próxima semana." },
  { id:"L-837", name:"Sofía Larrañaga",    phone:"+54 9 11 5566-8821", email:"sofi.l@gmail.com",        src:"Web",       prop:"P-2037", op:"Venta",    stage:"consulta",  date:"14 May", agent:"vs", days:3,  hot:false, notes:"Primera vivienda. Crédito UVA en evaluación." },
  { id:"L-836", name:"Martín Iraola",      phone:"+54 9 11 3098-4412", email:"miraola@gmail.com",       src:"Referido", prop:"P-2039", op:"Venta",    stage:"visita",    date:"13 May", agent:"mp", days:2,  hot:true,  notes:"Referido por Lucía Méndez (cliente 2024)." },
  { id:"L-835", name:"Constanza Vega",     phone:"+54 9 11 2745-9908", email:"c.vega@outlook.com",      src:"Argenprop", prop:"P-2022", op:"Alquiler", stage:"oferta",    date:"13 May", agent:"lr", days:5,  hot:false, notes:"Ofertó USD 2200/mes. Esperando garantía propietaria." },
  { id:"L-834", name:"Federico Salgado",   phone:"+54 9 11 8123-4400", email:"fede.salgado@gmail.com",  src:"WhatsApp",  prop:"P-2034", op:"Venta",    stage:"consulta",  date:"12 May", agent:"jt", days:4,  hot:false, notes:"Consulta por lotes en Pilar. Comparando con Nordelta." },
  { id:"L-833", name:"Lucía Méndez",       phone:"+54 9 11 5512-3399", email:"lu.mendez@gmail.com",     src:"Instagram", prop:"P-2030", op:"Alquiler", stage:"consulta",  date:"12 May", agent:"cf", days:8,  hot:false, notes:"Quiere visitar el local el sábado. Pendiente." },
  { id:"L-832", name:"Tomás Aguirre",      phone:"+54 9 11 6098-1145", email:"t.aguirre@empresa.com.ar",src:"Web",       prop:"P-2028", op:"Venta",    stage:"escritura", date:"10 May", agent:"jt", days:0,  hot:false, notes:"Escritura programada 22/05 en escribanía Otero." },
  { id:"L-831", name:"Renata Cipriani",    phone:"+54 9 11 4438-7720", email:"renatac@gmail.com",       src:"ZonaProp",  prop:"P-2025", op:"Venta",    stage:"visita",    date:"09 May", agent:"vs", days:6,  hot:false, notes:"Visitó dos veces. Pidió escritura prolija al propietario." },
  { id:"L-830", name:"Esteban Quesada",    phone:"+54 9 11 7821-3009", email:"e.quesada@gmail.com",     src:"Referido", prop:"P-2014", op:"Venta",    stage:"oferta",    date:"08 May", agent:"mp", days:2,  hot:true,  notes:"Oferta en firme. Espera contraoferta del propietario." },
  { id:"L-829", name:"Pilar Etcheverry",   phone:"+54 9 11 3344-5567", email:"p.etcheverry@gmail.com",  src:"Argenprop", prop:"P-2010", op:"Alquiler", stage:"consulta",  date:"07 May", agent:"cf", days:9,  hot:false, notes:"Solicitud por mail. Sin responder." },
];

const ACTIVITY = [
  { when:"Hoy · 14:32", who:"Mariana Pérez", text:"Llamado de seguimiento. Cliente confirma intención de compra.", kind:"call" },
  { when:"Hoy · 11:08", who:"Sistema",       text:"Lead movido a etapa Oferta.", kind:"system" },
  { when:"Ayer · 18:45",who:"Mariana Pérez", text:"Envío de propuesta económica formal por mail.", kind:"mail" },
  { when:"Ayer · 10:20",who:"Mariana Pérez", text:"Visita realizada al departamento. Cliente trajo a su esposa.", kind:"visit" },
  { when:"12 May",      who:"WhatsApp Bot",  text:"Mensaje automático de bienvenida enviado.", kind:"wa" },
  { when:"11 May",      who:"Sistema",       text:"Lead creado desde campaña Instagram · Palermo Premium.", kind:"system" },
];

window.AR_DATA = { STAGES, SOURCES, OPS, AGENTS, PROPERTIES, LEADS, ACTIVITY, fmtUSD, fmtARS, fmtNum, fmtPrice, fmtMixed };
