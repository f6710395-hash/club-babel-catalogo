import React, { useMemo, useState } from "react";

const BASE_SIZES = ["27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44"];
const makeStock = (sizes = BASE_SIZES) => Object.fromEntries(sizes.map(s => [s, 0]));
const gs = n => "Gs. " + Number(n || 0).toLocaleString("es-PY");
const today = () => new Date().toISOString().slice(0, 10);
const showDate = d => d ? d.split("-").reverse().join("/") : "";
const stockTotal = p => Object.values(p.stockBySize || {}).reduce((a,b)=>a + Number(b || 0), 0);
const code = (prefix, n, len = 6) => prefix + String(n).padStart(len, "0");
const hasText = (value, q) => String(value || "").toLowerCase().includes(String(q || "").toLowerCase());
const inRange = (date, f) => (!f.from || date >= f.from) && (!f.to || date <= f.to);

const initialProducts = [
  { id:"P000001", name:"Zapatilla Urbana Beige", category:"Dama", price:180000, cost:90000, horma:"Normal", image:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=80", stockBySize:{...makeStock(),35:2,36:3,37:3,38:2,39:1} },
  { id:"P000002", name:"Mocasín Masculino Café", category:"Caballero", price:220000, cost:110000, horma:"Normal", image:"https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=900&q=80", stockBySize:{...makeStock(),39:1,40:2,41:2,42:2,43:1} },
  { id:"P000003", name:"Sandalia Taco Nude", category:"Dama", price:150000, cost:75000, horma:"Horma chica", image:"https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=80", stockBySize:{...makeStock(),36:2,37:4,38:4,39:2,40:2} }
];

const initialVendors = [
  { id:"VD0001", name:"María González", phone:"0981 000 001" },
  { id:"VD0002", name:"Ana López", phone:"0981 000 002" }
];

function Btn({ children, className = "", ...props }) {
  return <button type="button" {...props} className={`rounded-xl px-3 py-2 font-bold ${className}`}>{children}</button>;
}
function Inp({ className = "", ...props }) {
  return <input {...props} className={`w-full rounded-xl border px-3 py-3 ${className}`} />;
}
function Sel({ children, className = "", ...props }) {
  return <select {...props} className={`w-full rounded-xl border bg-white px-3 py-3 ${className}`}>{children}</select>;
}
function Card({ children, className = "" }) {
  return <div className={`rounded-2xl bg-white shadow-md ${className}`}>{children}</div>;
}

export default function App() {
  const [products, setProducts] = useState(initialProducts);
  const [vendors, setVendors] = useState(initialVendors);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [sizes, setSizes] = useState(BASE_SIZES);
  const [categories, setCategories] = useState(["Dama","Caballero","Infantil"]);
  const [hormas, setHormas] = useState(["Normal","Horma chica"]);
  const [expenseTypes, setExpenseTypes] = useState(["Envío","Embalaje","Publicidad","Transferencia","Otro"]);
  const [commissionRules, setCommissionRules] = useState([{min:0,percent:10},{min:1000001,percent:11},{min:2000001,percent:12}]);
  const [bonusRules, setBonusRules] = useState([{pairs:10,amount:50000},{pairs:20,amount:150000},{pairs:30,amount:300000}]);

  const [admin, setAdmin] = useState(false);
  const [tab, setTab] = useState("ventas");
  const [loginOpen, setLoginOpen] = useState(false);
  const [clicks, setClicks] = useState(0);
  const [pass, setPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [savedPass, setSavedPass] = useState(() => localStorage.getItem("clubBabelPass") || "babel123");

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("Todos");
  const [stockOpen, setStockOpen] = useState(null);
  const [showSales, setShowSales] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showCommissions, setShowCommissions] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [commissionSearch, setCommissionSearch] = useState("");
  const [commissionFilter, setCommissionFilter] = useState({from:"", to:""});
  const [commissionStatus, setCommissionStatus] = useState("Pendiente");
  const [commissionVendor, setCommissionVendor] = useState("Todos");
  const [commissionPayments, setCommissionPayments] = useState([]);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [printDoc, setPrintDoc] = useState(null);

  const [saleFilter, setSaleFilter] = useState({text:"",from:"",to:"",vendor:"Todos",product:"Todos",category:"Todos"});
  const [expenseFilter, setExpenseFilter] = useState({text:"",from:"",to:"",type:"Todos"});
  const [profitFilter, setProfitFilter] = useState({text:"",from:"",to:"",vendor:"Todos",product:"Todos",category:"Todos",type:"Todos"});

  const [newCategory, setNewCategory] = useState("");
  const [newHorma, setNewHorma] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newExpenseType, setNewExpenseType] = useState("");
  const [newVendor, setNewVendor] = useState({name:"", phone:""});
  const [editing, setEditing] = useState(null);

  const [saleForm, setSaleForm] = useState({vendorId:"VD0001", productId:"P000001", size:"35", qty:1, customer:""});
  const [expenseForm, setExpenseForm] = useState({type:"Envío", description:"", amount:""});
  const [productForm, setProductForm] = useState({name:"", category:"Dama", price:"", cost:"", horma:"Normal", image:"", stockBySize:makeStock()});

  const selectedProduct = products.find(p => p.id === saleForm.productId) || products[0];
  const availableSizes = Object.entries(selectedProduct?.stockBySize || {}).filter(([,n]) => Number(n) > 0);

  const nextProduct = () => code("P", products.length + 1);
  const nextSale = () => code("V", sales.length + 1);
  const nextExpense = () => code("G", expenses.length + 1);
  const nextCommission = () => code("C", commissionPayments.length + 1);
  const nextVendor = () => code("VD", vendors.length + 1, 4);

  const catalog = useMemo(() => products.filter(p => stockTotal(p) > 0 && (cat === "Todos" || p.category === cat) && hasText(`${p.id} ${p.name} ${p.category}`, query)), [products, cat, query]);
  const productList = products.filter(p => hasText(`${p.id} ${p.name} ${p.category}`, productSearch));
  const rateFor = total => Number([...commissionRules].sort((a,b)=>b.min-a.min).find(r => total >= Number(r.min))?.percent || 0) / 100;
  const bonusFor = pairs => Number([...bonusRules].sort((a,b)=>b.pairs-a.pairs).find(r => pairs >= Number(r.pairs))?.amount || 0);

  const commissionSales = sales.filter(s => inRange(s.date, commissionFilter) && (commissionStatus === "Todos" || (commissionStatus === "Pendiente" ? !s.commissionPaymentId : !!s.commissionPaymentId)) && (commissionVendor === "Todos" || s.vendorId === commissionVendor));
  const reports = vendors.filter(v => commissionVendor === "Todos" || v.id === commissionVendor).map(v => {
    const vs = commissionSales.filter(s => s.vendorId === v.id);
    const total = vs.reduce((a,s)=>a+s.total,0);
    const pairs = vs.reduce((a,s)=>a+s.qty,0);
    const rate = rateFor(total);
    const commission = Math.round(total * rate);
    const bonus = bonusFor(pairs);
    return {...v,total,pairs,rate,commission,bonus,finalTotal:commission+bonus};
  }).filter(r => hasText(`${r.name} ${r.phone}`, commissionSearch));

  const commissionBalanceRows = vendors
    .filter(v => commissionVendor === "Todos" || v.id === commissionVendor)
    .map(v => {
      const pendingSales = sales.filter(s => s.vendorId === v.id && inRange(s.date, commissionFilter) && !s.commissionPaymentId);
      const pendingSalesTotal = pendingSales.reduce((a,s)=>a+s.total,0);
      const pendingPairs = pendingSales.reduce((a,s)=>a+s.qty,0);
      const pendingRate = rateFor(pendingSalesTotal);
      const pendingCommission = Math.round(pendingSalesTotal * pendingRate);
      const pendingBonus = bonusFor(pendingPairs);
      const pending = pendingCommission + pendingBonus;
      const paidPayments = commissionPayments.filter(p => p.vendorId === v.id && inRange(p.date, commissionFilter));
      const paid = paidPayments.reduce((a,p)=>a+Number(p.totalPaid||0),0);
      return {...v,pending,paid,historic:pending+paid,pendingSalesTotal,pendingPairs,pendingRate,pendingCommission,pendingBonus};
    })
    .filter(r => hasText(`${r.name} ${r.phone}`, commissionSearch));
  const commissionSummary = {
    pending: commissionBalanceRows.reduce((a,r)=>a+r.pending,0),
    paid: commissionBalanceRows.reduce((a,r)=>a+r.paid,0),
    vendorsWithBalance: commissionBalanceRows.filter(r=>r.pending>0).length,
    historic: commissionBalanceRows.reduce((a,r)=>a+r.historic,0)
  };

  const saleMatch = (s, f) => {
    const v = vendors.find(x => x.id === s.vendorId);
    const p = products.find(x => x.id === s.productId) || {};
    return hasText(`${s.number} ${s.date} ${v?.name || ""} ${s.customer} ${s.productId} ${s.productName}`, f.text) && inRange(s.date, f) && (f.vendor === "Todos" || s.vendorId === f.vendor) && (f.product === "Todos" || s.productId === f.product) && (f.category === "Todos" || p.category === f.category);
  };
  const expenseMatch = (e, f) => hasText(`${e.number} ${e.date} ${e.type} ${e.description}`, f.text) && inRange(e.date, f) && (f.type === "Todos" || e.type === f.type);

  const reportSales = sales.filter(s => saleMatch(s, saleFilter));
  const reportExpenses = expenses.filter(e => expenseMatch(e, expenseFilter));
  const profitSales = sales.filter(s => saleMatch(s, profitFilter));
  const profitExpenses = expenses.filter(e => expenseMatch(e, {text:profitFilter.text, from:profitFilter.from, to:profitFilter.to, type:profitFilter.type}));

  const totals = useMemo(() => {
    const total = sales.reduce((a,s)=>a+s.total,0);
    const pairs = sales.reduce((a,s)=>a+s.qty,0);
    const cost = sales.reduce((a,s)=>a+s.cost*s.qty,0);
    const gross = total - cost;
    const comm = reports.reduce((a,r)=>a+r.commission,0);
    const bon = reports.reduce((a,r)=>a+r.bonus,0);
    const exp = expenses.reduce((a,e)=>a+Number(e.amount||0),0);
    const net = gross - comm - bon - exp;
    return {total,pairs,cost,gross,comm,bon,exp,net,grossMargin:total?gross/total*100:0,netMargin:total?net/total*100:0};
  }, [sales, expenses, reports]);

  function logoClick() {
    const next = clicks + 1;
    setClicks(next);
    if (next >= 5) { setLoginOpen(true); setClicks(0); }
  }
  function login() {
    if (pass === savedPass) { setAdmin(true); setLoginOpen(false); setPass(""); }
    else alert("Contraseña incorrecta");
  }
  function savePassword() {
    if (newPass.length < 6) return alert("Mínimo 6 caracteres");
    localStorage.setItem("clubBabelPass", newPass);
    setSavedPass(newPass);
    setNewPass("");
  }
  function updateStock(productId, size, delta) {
    setProducts(list => list.map(p => p.id === productId ? {...p, stockBySize:{...p.stockBySize, [size]:Math.max(0, Number(p.stockBySize[size] || 0) + delta)}} : p));
  }
  function uploadImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => setProductForm(f => ({...f, image:e.target.result}));
    reader.readAsDataURL(file);
  }
  function addSize() {
    const value = newSize.trim();
    if (!value) return;
    if (sizes.includes(value)) return alert("Esa talla ya existe");
    const next = [...sizes, value].sort((a,b)=>Number(a)-Number(b));
    setSizes(next);
    setProducts(list => list.map(p => ({...p, stockBySize:{...p.stockBySize, [value]:0}})));
    setProductForm(f => ({...f, stockBySize:{...f.stockBySize, [value]:0}}));
    setNewSize("");
  }
  function removeSize(value) {
    if (!window.confirm(`¿Seguro que quieres eliminar la talla ${value}?`)) return;
    setSizes(sizes.filter(s => s !== value));
    setProducts(list => list.map(p => { const st = {...p.stockBySize}; delete st[value]; return {...p, stockBySize:st}; }));
    setProductForm(f => { const st = {...f.stockBySize}; delete st[value]; return {...f, stockBySize:st}; });
  }
  function resetProduct() {
    setEditing(null);
    setProductForm({name:"", category:categories[0] || "Dama", price:"", cost:"", horma:hormas[0] || "Normal", image:"", stockBySize:makeStock(sizes)});
  }
  function saveProduct() {
    if (!productForm.name.trim()) return alert("Nombre es obligatorio");
    const id = editing || nextProduct();
    const p = {...productForm, id, name:productForm.name.trim(), price:Number(productForm.price||0), cost:Number(productForm.cost||0), stockBySize:{...makeStock(sizes), ...productForm.stockBySize}};
    if (editing) setProducts(list => list.map(x => x.id === editing ? p : x));
    else setProducts([p, ...products]);
    resetProduct();
  }
  function editProduct(p) {
    setProductForm({...p, price:String(p.price), cost:String(p.cost || ""), stockBySize:{...makeStock(sizes), ...p.stockBySize}});
    setEditing(p.id);
    setTab("productos");
  }
  function registerSale() {
    const p = products.find(x => x.id === saleForm.productId);
    const qty = Number(saleForm.qty);
    if (!p || qty <= 0) return alert("Cantidad inválida");
    if ((p.stockBySize[saleForm.size] || 0) < qty) return alert("No hay suficiente stock");
    const sale = {id:Date.now().toString(), number:nextSale(), date:today(), vendorId:saleForm.vendorId, customer:saleForm.customer || "Sin nombre", productId:p.id, productName:p.name, size:saleForm.size, qty, unitPrice:p.price, cost:p.cost || Math.round(p.price*0.5), total:p.price*qty};
    setSales([sale, ...sales]);
    updateStock(p.id, saleForm.size, -qty);
    setSaleForm({...saleForm, qty:1, customer:""});
  }
  function deleteSale(sale) {
    if (!window.confirm("¿Anular esta venta y devolver stock?")) return;
    setSales(sales.filter(s => s.id !== sale.id));
    updateStock(sale.productId, sale.size, sale.qty);
  }
  function addExpenseType() {
    const value = newExpenseType.trim();
    if (!value) return;
    if (!expenseTypes.includes(value)) setExpenseTypes([...expenseTypes, value]);
    setExpenseForm({...expenseForm, type:value});
    setNewExpenseType("");
  }
  function addExpense() {
    const amount = Number(expenseForm.amount);
    if (!expenseForm.description.trim() || !amount) return alert("Completa gasto");
    setExpenses([{id:Date.now().toString(), number:nextExpense(), date:today(), ...expenseForm, amount}, ...expenses]);
    setExpenseForm({type:expenseTypes[0] || "Otro", description:"", amount:""});
  }
  function addVendor() {
    if (!newVendor.name.trim()) return;
    setVendors([...vendors, {id:nextVendor(), name:newVendor.name, phone:newVendor.phone}]);
    setNewVendor({name:"", phone:""});
  }
  function addCategory() {
    const value = newCategory.trim();
    if (!value) return;
    if (!categories.includes(value)) setCategories([...categories, value]);
    setProductForm({...productForm, category:value});
    setNewCategory("");
  }
  function addHorma() {
    const value = newHorma.trim();
    if (!value) return;
    if (!hormas.includes(value)) setHormas([...hormas, value]);
    setProductForm({...productForm, horma:value});
    setNewHorma("");
  }
  function registerCommission(report) {
    const payable = sales.filter(s => s.vendorId === report.id && inRange(s.date, commissionFilter) && !s.commissionPaymentId);
    if (!payable.length) return alert("No hay comisiones pendientes para este vendedor en el periodo seleccionado");
    const salesTotal = payable.reduce((a,s)=>a+s.total,0);
    const pairs = payable.reduce((a,s)=>a+s.qty,0);
    const rate = rateFor(salesTotal);
    const commission = Math.round(salesTotal * rate);
    const bonus = bonusFor(pairs);
    setPendingPayment({id:Date.now().toString(), number:nextCommission(), date:today(), from:commissionFilter.from, to:commissionFilter.to, vendorId:report.id, vendorName:report.name, salesTotal, pairs, rate, commission, bonus, totalPaid:commission+bonus, status:"Pagado", saleIds:payable.map(s=>s.id)});
  }
  function confirmPayment() {
    const payment = pendingPayment;
    if (!payment) return;
    setSales(list => list.map(s => payment.saleIds.includes(s.id) ? {...s, commissionPaymentId:payment.id, commissionPaymentNumber:payment.number} : s));
    setCommissionPayments([payment, ...commissionPayments]);
    setPendingPayment(null);
    setTimeout(()=>setPrintDoc({type:"commission", data:payment}), 100);
  }
  function printSale(sale) {
    const vendor = vendors.find(v => v.id === sale.vendorId);
    setPrintDoc({type:"sale", data:{...sale, vendorName:vendor?.name || ""}});
  }
  function printExpense(expense) { setPrintDoc({type:"expense", data:expense}); }
  function printNow() { setTimeout(()=>window.print(), 100); }
  function csvValue(v) { return `"${String(v ?? "").replaceAll('"','""')}"`; }
  function downloadCSV(filename, rows) {
    const csv = rows.map(row => row.map(csvValue).join(";")).join("\n");
    const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  function exportSalesCSV() {
    downloadCSV("informe_ventas.csv", [["Comprobante","Fecha","Vendedor","Cliente","Producto","Talle","Cantidad","Total"], ...reportSales.map(s => { const v=vendors.find(x=>x.id===s.vendorId); return [s.number, showDate(s.date), v?.name||"", s.customer, `${s.productId} - ${s.productName}`, s.size, s.qty, s.total]; })]);
  }
  function exportExpensesCSV() {
    downloadCSV("informe_gastos.csv", [["Comprobante","Fecha","Tipo","Descripcion","Monto"], ...reportExpenses.map(e => [e.number, showDate(e.date), e.type, e.description, e.amount])]);
  }
  function exportCommissionsCSV() {
    downloadCSV("informe_comisiones.csv", [["Vendedor","Pendiente","Pagado","Historico"], ...commissionBalanceRows.map(r => [r.name, r.pending, r.paid, r.historic])]);
  }

  const MenuButton = ({id, label}) => <button onClick={()=>setTab(id)} className={`w-full text-left px-4 py-3 rounded-xl font-bold ${tab === id ? "bg-purple-700 text-white" : "bg-zinc-100"}`}>{label}</button>;
  const SearchBox = ({value, onChange, placeholder}) => <div className="relative"><span className="absolute left-3 top-3 text-zinc-400">🔍</span><Inp className="pl-10" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></div>;

  function ProductCard({p}) {
    return <Card className="overflow-hidden">
      <div className="aspect-[4/3] bg-zinc-200 overflow-hidden"><img src={p.image || initialProducts[0].image} className="w-full h-full object-cover" /></div>
      <div className="p-5 space-y-3">
        <div className="flex justify-between gap-3"><div><p className="text-xs font-bold text-purple-700">{p.id} · {p.category}</p><h3 className="text-xl font-black">{p.name}</h3></div><span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold h-fit">{gs(p.price)}</span></div>
        <p><b>Horma:</b> {p.horma}</p>
        <b>Disponibilidad por talle:</b>
        <div className="flex flex-wrap gap-2">{Object.entries(p.stockBySize).filter(([,n])=>n>0).map(([s,n])=><span key={s} className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-bold text-sm">{s} ({n})</span>)}</div>
        <p className="text-green-700 font-bold">Stock total: {stockTotal(p)}</p>
        {admin && tab === "stock" && <div className="bg-zinc-100 rounded-xl p-3 space-y-2"><div className="flex justify-between"><b>Editar stock por talle</b><Btn className="border bg-white" onClick={()=>setStockOpen(stockOpen === p.id ? null : p.id)}>{stockOpen === p.id ? "Ocultar" : "Ver / editar"}</Btn></div>{stockOpen === p.id && <div className="max-h-64 overflow-y-auto border-t pt-2 space-y-2">{sizes.map(s=><div key={s} className="flex items-center gap-2"><span className="w-16 font-bold">Talle {s}</span><Btn className="border bg-white" onClick={()=>updateStock(p.id,s,-1)}>-</Btn><span className="flex-1 text-center font-bold">{p.stockBySize[s] || 0}</span><Btn className="border bg-white" onClick={()=>updateStock(p.id,s,1)}>+</Btn></div>)}</div>}<div className="grid grid-cols-2 gap-2"><Btn className="border bg-white" onClick={()=>editProduct(p)}>Editar datos</Btn><Btn className="border bg-white" onClick={()=>setProducts(products.filter(x=>x.id!==p.id))}>Eliminar</Btn></div></div>}
      </div>
    </Card>;
  }

  function ViewCatalog() {
    return <><div className="bg-white rounded-2xl p-4 shadow-sm mb-6 grid md:grid-cols-[1fr_auto] gap-3">{SearchBox({value:query,onChange:setQuery,placeholder:"Buscar modelo, código o categoría"})}<Sel value={cat} onChange={e=>setCat(e.target.value)}><option>Todos</option>{categories.map(c=><option key={c}>{c}</option>)}</Sel></div><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{catalog.map(p=><ProductCard key={p.id} p={p}/>)}</div></>;
  }

  function ViewProducts() {
    return <div className="space-y-6"><Card><div className="p-5 space-y-4"><h3 className="text-2xl font-black">Productos</h3><p className="text-sm text-zinc-500">Código automático: <b>{editing || nextProduct()}</b></p><div className="grid md:grid-cols-3 gap-3"><Inp placeholder="Nombre" value={productForm.name} onChange={e=>setProductForm({...productForm,name:e.target.value})}/><div className="flex gap-2"><Sel value={productForm.category} onChange={e=>setProductForm({...productForm,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</Sel><Inp placeholder="Nueva categoría" value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="w-32"/><Btn className="bg-purple-700 text-white" onClick={addCategory}>+</Btn></div><div className="flex gap-2"><Sel value={productForm.horma} onChange={e=>setProductForm({...productForm,horma:e.target.value})}>{hormas.map(h=><option key={h}>{h}</option>)}</Sel><Inp placeholder="Nueva horma" value={newHorma} onChange={e=>setNewHorma(e.target.value)} className="w-32"/><Btn className="bg-purple-700 text-white" onClick={addHorma}>+</Btn></div><Inp type="number" placeholder="Precio venta" value={productForm.price} onChange={e=>setProductForm({...productForm,price:e.target.value})}/><Inp type="number" placeholder="Costo compra" value={productForm.cost} onChange={e=>setProductForm({...productForm,cost:e.target.value})}/><Inp placeholder="URL imagen" value={productForm.image?.startsWith("data:") ? "Imagen cargada" : productForm.image} onChange={e=>setProductForm({...productForm,image:e.target.value})}/><input type="file" accept="image/*" onChange={e=>uploadImage(e.target.files?.[0])} className="rounded-xl border p-3 md:col-span-3"/></div>{productForm.image && <img src={productForm.image} className="w-40 h-32 object-cover rounded-xl border"/>}<div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3"><b>Tallas del catálogo</b><div className="grid md:grid-cols-[1fr_auto] gap-2"><Inp placeholder="Agregar talla" value={newSize} onChange={e=>setNewSize(e.target.value)} onKeyDown={e=>e.key === "Enter" && addSize()}/><Btn className="bg-purple-700 text-white" onClick={addSize}>Agregar talla</Btn></div><div className="flex flex-wrap gap-2">{sizes.map(s=><span key={s} className="bg-white border rounded-full px-3 py-2 flex gap-2 font-bold">{s}<button className="text-red-600" onClick={()=>removeSize(s)}>x</button></span>)}</div></div><b>Tallas y cantidades</b><div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">{sizes.map(s=><div key={s} className="bg-zinc-100 rounded-xl p-2"><p className="font-bold text-center">Talle {s}</p><div className="flex gap-1 mt-2"><Btn className="border bg-white" onClick={()=>setProductForm(f=>({...f,stockBySize:{...f.stockBySize,[s]:Math.max(0,Number(f.stockBySize[s]||0)-1)}}))}>-</Btn><input className="w-full text-center rounded-lg border" type="number" min="0" value={productForm.stockBySize[s] || 0} onChange={e=>setProductForm(f=>({...f,stockBySize:{...f.stockBySize,[s]:Math.max(0,Number(e.target.value||0))}}))}/><Btn className="border bg-white" onClick={()=>setProductForm(f=>({...f,stockBySize:{...f.stockBySize,[s]:Number(f.stockBySize[s]||0)+1}}))}>+</Btn></div></div>)}</div><div className="flex gap-2"><Btn className="bg-purple-700 text-white" onClick={saveProduct}>{editing ? "Guardar cambios" : "Agregar producto"}</Btn><Btn className="border bg-white" onClick={resetProduct}>Limpiar</Btn></div></div></Card><Card><div className="p-5 space-y-4"><h3 className="text-xl font-black">Productos registrados</h3>{SearchBox({value:productSearch,onChange:setProductSearch,placeholder:"Buscar producto"})}{productList.map(p=><div key={p.id} className="bg-zinc-100 rounded-xl p-3 grid md:grid-cols-[80px_1fr_auto] gap-3 items-center mb-2"><img src={p.image || initialProducts[0].image} className="w-20 h-16 object-cover rounded-lg"/><p><b>{p.id}</b> · {p.name}<br/><span className="text-sm text-zinc-600">{p.category} · {gs(p.price)} · Stock {stockTotal(p)}</span></p><div className="flex gap-2"><Btn className="border bg-white" onClick={()=>editProduct(p)}>Editar</Btn><Btn className="border bg-white" onClick={()=>setProducts(products.filter(x=>x.id!==p.id))}>Eliminar</Btn></div></div>)}</div></Card></div>;
  }

  function ViewSales() {
    return <Card><div className="p-5 space-y-4"><h3 className="text-2xl font-black">Ventas</h3><div className="grid md:grid-cols-5 gap-3"><Sel value={saleForm.vendorId} onChange={e=>setSaleForm({...saleForm,vendorId:e.target.value})}>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</Sel><Inp placeholder="Cliente" value={saleForm.customer} onChange={e=>setSaleForm({...saleForm,customer:e.target.value})}/><Sel value={saleForm.productId} onChange={e=>{const p=products.find(x=>x.id===e.target.value);const first=Object.entries(p.stockBySize).find(([,n])=>n>0)?.[0] || Object.keys(p.stockBySize)[0];setSaleForm({...saleForm,productId:e.target.value,size:first});}}>{products.filter(p=>stockTotal(p)>0).map(p=><option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}</Sel><Sel value={saleForm.size} onChange={e=>setSaleForm({...saleForm,size:e.target.value})}>{availableSizes.map(([s,n])=><option key={s} value={s}>Talle {s} - {n}</option>)}</Sel><Inp type="number" min="1" value={saleForm.qty} onChange={e=>setSaleForm({...saleForm,qty:e.target.value})}/></div><Btn className="bg-purple-700 text-white" onClick={registerSale}>Registrar venta</Btn><div className="border-t pt-3"><Btn className="border bg-white" onClick={()=>setShowSales(!showSales)}>{showSales ? "Ocultar historial de ventas" : `Ver historial de ventas (${sales.length})`}</Btn>{showSales && <div className="mt-3 space-y-2">{sales.length === 0 ? <p className="text-sm text-zinc-500">No hay ventas registradas.</p> : sales.map(s=>{const v=vendors.find(x=>x.id===s.vendorId);return <div key={s.id} className="bg-zinc-100 rounded-xl p-3 grid md:grid-cols-[1fr_auto_auto] gap-2 items-center"><p><b>{s.number}</b> · {showDate(s.date)} · {v?.name} · {s.customer} · {s.productId} · T{s.size} · <b>{gs(s.total)}</b></p><Btn className="border bg-white" onClick={()=>printSale(s)}>Comprobante</Btn><Btn className="border bg-white" onClick={()=>deleteSale(s)}>Anular</Btn></div>})}</div>}</div></div></Card>;
  }

  function ViewExpenses() {
    return <Card><div className="p-5 space-y-4"><h3 className="text-2xl font-black">Gastos</h3><div className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-3"><div className="flex gap-2"><Sel value={expenseForm.type} onChange={e=>setExpenseForm({...expenseForm,type:e.target.value})}>{expenseTypes.map(t=><option key={t}>{t}</option>)}</Sel><Inp className="w-36" placeholder="Nuevo tipo" value={newExpenseType} onChange={e=>setNewExpenseType(e.target.value)}/><Btn className="bg-purple-700 text-white" onClick={addExpenseType}>+</Btn></div><Inp placeholder="Descripción" value={expenseForm.description} onChange={e=>setExpenseForm({...expenseForm,description:e.target.value})}/><Inp type="number" placeholder="Monto" value={expenseForm.amount} onChange={e=>setExpenseForm({...expenseForm,amount:e.target.value})}/><Btn className="bg-purple-700 text-white" onClick={addExpense}>Agregar gasto</Btn></div><div className="border-t pt-3"><Btn className="border bg-white" onClick={()=>setShowExpenses(!showExpenses)}>{showExpenses ? "Ocultar historial de gastos" : `Ver historial de gastos (${expenses.length})`}</Btn>{showExpenses && <div className="mt-3 space-y-2">{expenses.length === 0 ? <p className="text-sm text-zinc-500">No hay gastos registrados.</p> : expenses.map(e=><div key={e.id} className="bg-zinc-100 rounded-xl p-3 grid md:grid-cols-[1fr_auto] gap-2 items-center"><p><b>{e.number}</b> · {showDate(e.date)} · {e.type} · {e.description} · <b>{gs(e.amount)}</b></p><div className="flex gap-2"><Btn className="border bg-white" onClick={()=>printExpense(e)}>Comprobante</Btn><Btn className="border bg-white" onClick={()=>setExpenses(expenses.filter(x=>x.id!==e.id))}>Eliminar</Btn></div></div>)}</div>}</div></div></Card>;
  }

  function ViewCommissions() {
    return <Card><div className="p-5 space-y-5">
      <h3 className="text-2xl font-black">Comisiones y bonos</h3>
      <div className="grid md:grid-cols-4 gap-3">
        <div className="bg-yellow-50 rounded-xl p-4 border"><p className="text-sm">Total pendiente</p><p className="text-2xl font-black">{gs(commissionSummary.pending)}</p></div>
        <div className="bg-green-50 rounded-xl p-4 border"><p className="text-sm">Total pagado</p><p className="text-2xl font-black">{gs(commissionSummary.paid)}</p></div>
        <div className="bg-purple-50 rounded-xl p-4 border"><p className="text-sm">Vendedores con saldo</p><p className="text-2xl font-black">{commissionSummary.vendorsWithBalance}</p></div>
        <div className="bg-zinc-50 rounded-xl p-4 border"><p className="text-sm">Histórico filtrado</p><p className="text-2xl font-black">{gs(commissionSummary.historic)}</p></div>
      </div>
      <div className="grid md:grid-cols-5 gap-2">
        <Inp type="date" value={commissionFilter.from} onChange={e=>setCommissionFilter({...commissionFilter,from:e.target.value})}/>
        <Inp type="date" value={commissionFilter.to} onChange={e=>setCommissionFilter({...commissionFilter,to:e.target.value})}/>
        <Sel value={commissionVendor} onChange={e=>setCommissionVendor(e.target.value)}><option>Todos</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</Sel>
        <Sel value={commissionStatus} onChange={e=>setCommissionStatus(e.target.value)}><option>Pendiente</option><option>Pagado</option><option>Todos</option></Sel>
        <SearchBox value={commissionSearch} onChange={setCommissionSearch} placeholder="Buscar vendedor"/>
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn className={`${commissionStatus==="Todos"?"bg-purple-700 text-white":"border bg-white"}`} onClick={()=>setCommissionStatus("Todos")}>Todos</Btn>
        <Btn className={`${commissionStatus==="Pendiente"?"bg-purple-700 text-white":"border bg-white"}`} onClick={()=>setCommissionStatus("Pendiente")}>Pendientes</Btn>
        <Btn className={`${commissionStatus==="Pagado"?"bg-purple-700 text-white":"border bg-white"}`} onClick={()=>setCommissionStatus("Pagado")}>Pagados</Btn>
        <Btn className="border bg-white" onClick={exportCommissionsCSV}>Exportar comisiones Excel</Btn>
      </div>
      <div className="rounded-xl border overflow-auto">
        <table className="w-full text-sm bg-white">
          <thead><tr className="bg-purple-100"><th className="p-2 text-left">Vendedor</th><th>Pendiente</th><th>Pagado</th><th>Histórico</th><th>Ventas pendientes</th><th>Pares</th><th>Acción</th></tr></thead>
          <tbody>{commissionBalanceRows.map(r=><tr key={r.id} className="border-b"><td className="p-2 font-bold">{r.name}</td><td className="font-black text-yellow-700">{gs(r.pending)}</td><td className="text-green-700 font-bold">{gs(r.paid)}</td><td>{gs(r.historic)}</td><td>{gs(r.pendingSalesTotal)}</td><td>{r.pendingPairs}</td><td>{r.pending<=0?<span className="text-zinc-500 font-bold">Sin saldo</span>:<Btn className="bg-purple-700 text-white" onClick={()=>registerCommissionPayment(r)}>Registrar pago</Btn>}</td></tr>)}</tbody>
        </table>
      </div>
      <p className="text-sm text-zinc-500">Una venta ya pagada no vuelve a entrar como comisión pendiente.</p>
      <div className="border-t pt-3">
        <Btn className="border bg-white" onClick={()=>setShowCommissions(!showCommissions)}>{showCommissions ? "Ocultar historial de comisiones" : "Ver historial de comisiones pagadas / reimpresión"} ({commissionPayments.length})</Btn>
        {showCommissions && <div className="mt-3 space-y-2">{commissionPayments.length === 0 ? <p className="text-sm text-zinc-500">No hay pagos de comisiones registrados.</p> : commissionPayments.map(p=><div key={p.id} className="bg-zinc-100 rounded-xl p-3 grid md:grid-cols-[1fr_auto] gap-2 items-center"><p><b>{p.number}</b> · {showDate(p.date)} · {p.vendorName} · Periodo: {p.from || "Inicio"} al {p.to || "Hoy"} · <b>{gs(p.totalPaid)}</b></p><Btn className="border bg-white" onClick={()=>setPrintDoc({type:"commission",data:p})}>Imprimir comprobante</Btn></div>)}</div>}
      </div>
      <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2 pt-3 border-t">
        <Inp placeholder="Nombre vendedor" value={newVendor.name} onChange={e=>setNewVendor({...newVendor,name:e.target.value})}/>
        <Inp placeholder="Teléfono" value={newVendor.phone} onChange={e=>setNewVendor({...newVendor,phone:e.target.value})}/>
        <Btn className="bg-purple-700 text-white" onClick={addVendor}>Agregar vendedor</Btn>
      </div>
    </div></Card>;
  }

  function SaleFilters({value,onChange,showType=false}) {
    return <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-2"><Inp type="date" value={value.from} onChange={e=>onChange({...value,from:e.target.value})}/><Inp type="date" value={value.to} onChange={e=>onChange({...value,to:e.target.value})}/><Sel value={value.vendor} onChange={e=>onChange({...value,vendor:e.target.value})}><option>Todos</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</Sel><Sel value={value.product} onChange={e=>onChange({...value,product:e.target.value})}><option>Todos</option>{products.map(p=><option key={p.id} value={p.id}>{p.id}</option>)}</Sel><Sel value={value.category} onChange={e=>onChange({...value,category:e.target.value})}><option>Todos</option>{categories.map(c=><option key={c}>{c}</option>)}</Sel>{showType && <Sel value={value.type} onChange={e=>onChange({...value,type:e.target.value})}><option>Todos</option>{expenseTypes.map(t=><option key={t}>{t}</option>)}</Sel>}<Inp className="md:col-span-3 lg:col-span-6" placeholder="Buscar texto" value={value.text} onChange={e=>onChange({...value,text:e.target.value})}/></div>;
  }
  function ExpenseFilters({value,onChange}) {
    return <div className="grid md:grid-cols-4 gap-2"><Inp type="date" value={value.from} onChange={e=>onChange({...value,from:e.target.value})}/><Inp type="date" value={value.to} onChange={e=>onChange({...value,to:e.target.value})}/><Sel value={value.type} onChange={e=>onChange({...value,type:e.target.value})}><option>Todos</option>{expenseTypes.map(t=><option key={t}>{t}</option>)}</Sel><Inp placeholder="Buscar gasto" value={value.text} onChange={e=>onChange({...value,text:e.target.value})}/></div>;
  }
  const Box = ({title,value,sub}) => <div className="bg-purple-50 rounded-xl p-4"><p className="text-sm">{title}</p><p className="text-2xl font-black">{value}</p>{sub && <p>{sub}</p>}</div>;
  function ViewReports() {
    const fs = profitSales.reduce((a,s)=>a+s.total,0);
    const fc = profitSales.reduce((a,s)=>a+s.cost*s.qty,0);
    const fg = fs - fc;
    const fe = profitExpenses.reduce((a,e)=>a+Number(e.amount||0),0);
    return <Card><div className="p-5 space-y-4"><h3 className="text-2xl font-black">Informes</h3><div className="flex flex-wrap gap-2"><Btn className="border bg-white" onClick={()=>window.print()}>Imprimir informe</Btn><Btn className="border bg-white" onClick={exportSalesCSV}>Exportar ventas Excel</Btn><Btn className="border bg-white" onClick={exportExpensesCSV}>Exportar gastos Excel</Btn></div><div className="grid md:grid-cols-3 gap-3">{Box({title:"Ventas totales",value:gs(totals.total)})}{Box({title:"Pares vendidos",value:totals.pairs})}{Box({title:"Ganancia bruta",value:gs(totals.gross),sub:`${totals.grossMargin.toFixed(1)}%`})}{Box({title:"Costo mercadería",value:gs(totals.cost)})}{Box({title:"Comisiones + bonos",value:gs(totals.comm+totals.bon)})}{Box({title:"Gastos",value:gs(totals.exp)})}</div><div className="space-y-4"><div className="bg-white rounded-xl border overflow-hidden"><div className="p-3 font-black bg-zinc-50">Informe de ventas</div><div className="p-3 space-y-3 max-h-96 overflow-auto">{SaleFilters({value:saleFilter,onChange:setSaleFilter})}{reportSales.map(s=>{const v=vendors.find(x=>x.id===s.vendorId);const gross=s.total-s.cost*s.qty;return <p key={s.id} className="border-b py-2 text-sm">{showDate(s.date)} · {v?.name} · {s.productId} T{s.size} · {gs(s.total)} · Gan. {gs(gross)}</p>})}</div></div><div className="bg-white rounded-xl border overflow-hidden"><div className="p-3 font-black bg-zinc-50">Informe de gastos</div><div className="p-3 space-y-3 max-h-96 overflow-auto">{ExpenseFilters({value:expenseFilter,onChange:setExpenseFilter})}{reportExpenses.map(e=><p key={e.id} className="border-b py-2 text-sm">{showDate(e.date)} · {e.type} · {e.description} · {gs(e.amount)}</p>)}</div></div><div className="bg-white rounded-xl border overflow-hidden"><div className="p-3 font-black bg-zinc-50">Informe de rentabilidad</div><div className="p-3 space-y-3 max-h-96 overflow-auto">{SaleFilters({value:profitFilter,onChange:setProfitFilter,showType:true})}<p><b>Ventas filtradas:</b> {gs(fs)}</p><p><b>Costo filtrado:</b> {gs(fc)}</p><p><b>Ganancia bruta filtrada:</b> {gs(fg)}</p><p><b>Gastos filtrados:</b> {gs(fe)}</p><p><b>Rentabilidad filtrada:</b> {gs(fg-fe)}</p></div></div></div><div className="bg-black text-white rounded-2xl p-5"><p className="text-sm text-zinc-300">Rentabilidad neta</p><p className="text-4xl font-black">{gs(totals.net)}</p><p>Margen neto: {totals.netMargin.toFixed(1)}%</p></div></div></Card>;
  }

  function ViewConfig() {
    return <Card><div className="p-5 space-y-5"><h3 className="text-2xl font-black">Configuración</h3><div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3"><h4 className="font-black">Porcentajes de comisión</h4>{commissionRules.map((r,i)=><div key={i} className="grid md:grid-cols-[1fr_1fr_auto] gap-2"><Inp type="number" value={r.min} onChange={e=>setCommissionRules(commissionRules.map((x,idx)=>idx===i?{...x,min:Number(e.target.value)}:x))}/><Inp type="number" value={r.percent} onChange={e=>setCommissionRules(commissionRules.map((x,idx)=>idx===i?{...x,percent:Number(e.target.value)}:x))}/><Btn className="border bg-white" onClick={()=>setCommissionRules(commissionRules.filter((_,idx)=>idx!==i))}>Eliminar</Btn></div>)}<Btn className="bg-purple-700 text-white" onClick={()=>setCommissionRules([...commissionRules,{min:0,percent:10}])}>Agregar regla</Btn></div><div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3"><h4 className="font-black">Bonos por pares vendidos</h4>{bonusRules.map((r,i)=><div key={i} className="grid md:grid-cols-[1fr_1fr_auto] gap-2"><Inp type="number" value={r.pairs} onChange={e=>setBonusRules(bonusRules.map((x,idx)=>idx===i?{...x,pairs:Number(e.target.value)}:x))}/><Inp type="number" value={r.amount} onChange={e=>setBonusRules(bonusRules.map((x,idx)=>idx===i?{...x,amount:Number(e.target.value)}:x))}/><Btn className="border bg-white" onClick={()=>setBonusRules(bonusRules.filter((_,idx)=>idx!==i))}>Eliminar</Btn></div>)}<Btn className="bg-purple-700 text-white" onClick={()=>setBonusRules([...bonusRules,{pairs:10,amount:50000}])}>Agregar bono</Btn></div></div></Card>;
  }

  function PaymentModal() {
    if (!pendingPayment) return null;
    const p = pendingPayment;
    return <div className="fixed inset-0 z-[998] bg-black/70 p-4 flex items-center justify-center"><div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-xl space-y-3"><h2 className="text-2xl font-black text-purple-700">Confirmar pago de comisión</h2><p><b>Vendedor:</b> {p.vendorName}</p><p><b>Periodo:</b> {p.from || "Inicio"} al {p.to || "Hoy"}</p><hr/><p><b>Ventas:</b> {gs(p.salesTotal)}</p><p><b>Pares:</b> {p.pairs}</p><p><b>Comisión:</b> {Math.round(p.rate*100)}% = {gs(p.commission)}</p><p><b>Bono:</b> {gs(p.bonus)}</p><h3 className="text-xl font-black">Total a pagar: {gs(p.totalPaid)}</h3><div className="grid grid-cols-2 gap-2 pt-3"><Btn className="border bg-white" onClick={()=>setPendingPayment(null)}>Cancelar</Btn><Btn className="bg-purple-700 text-white" onClick={confirmPayment}>Confirmar pago</Btn></div></div></div>;
  }

  function PrintModal() {
    if (!printDoc) return null;
    const d = printDoc.data;
    return <div className="fixed inset-0 z-[999] bg-black/70 p-4 overflow-auto"><style>{`@media print{body *{visibility:hidden!important}.print-area,.print-area *{visibility:visible!important}.print-area{position:fixed!important;left:0!important;top:0!important;width:100%!important;max-width:none!important;margin:0!important;border-radius:0!important;box-shadow:none!important}.no-print{display:none!important}}`}</style><div className="no-print max-w-xl mx-auto mb-3 flex gap-2 justify-end"><Btn className="bg-purple-700 text-white" onClick={printNow}>Imprimir</Btn><Btn className="bg-white border" onClick={()=>setPrintDoc(null)}>Cerrar</Btn></div><div className="print-area bg-white max-w-xl mx-auto p-6 rounded-2xl shadow-xl text-black"><h1 className="text-3xl font-black text-purple-700">BABEL CALZADOS</h1>{printDoc.type === "sale" && <div><h2 className="text-xl font-black mt-2">Comprobante de venta</h2><p><b>N°:</b> {d.number}</p><p><b>Fecha:</b> {showDate(d.date)}</p><hr className="my-3"/><p><b>Vendedor:</b> {d.vendorName}</p><p><b>Cliente:</b> {d.customer}</p><p><b>Producto:</b> {d.productId} - {d.productName}</p><p><b>Talle:</b> {d.size}</p><p><b>Cantidad:</b> {d.qty}</p><h2 className="text-2xl font-black mt-3">Total: {gs(d.total)}</h2></div>}{printDoc.type === "expense" && <div><h2 className="text-xl font-black mt-2">Comprobante de gasto</h2><p><b>N°:</b> {d.number}</p><p><b>Fecha:</b> {showDate(d.date)}</p><hr className="my-3"/><p><b>Tipo:</b> {d.type}</p><p><b>Descripción:</b> {d.description}</p><h2 className="text-2xl font-black mt-3">Total gasto: {gs(d.amount)}</h2></div>}{printDoc.type === "commission" && <div><h2 className="text-xl font-black mt-2">Comprobante de pago de comisión</h2><p><b>N°:</b> {d.number}</p><p><b>Fecha de pago:</b> {showDate(d.date)}</p><p><b>Periodo:</b> {d.from || "Inicio"} al {d.to || "Hoy"}</p><hr className="my-3"/><p><b>Vendedor:</b> {d.vendorName}</p><p><b>Ventas liquidadas:</b> {gs(d.salesTotal)}</p><p><b>Pares vendidos:</b> {d.pairs}</p><p><b>Comisión:</b> {Math.round(d.rate*100)}% = {gs(d.commission)}</p><p><b>Bono:</b> {gs(d.bonus)}</p><h2 className="text-2xl font-black mt-3">Total pagado: {gs(d.totalPaid)}</h2></div>}<hr className="my-3"/><p className="text-xs text-zinc-500">Comprobante interno Club Babel.</p></div></div>;
  }

  const content = tab === "ventas" ? ViewSales() : tab === "gastos" ? ViewExpenses() : tab === "productos" ? ViewProducts() : tab === "stock" ? ViewCatalog() : tab === "comisiones" ? ViewCommissions() : tab === "informes" ? ViewReports() : tab === "config" ? ViewConfig() : ViewSales();

  return <div className="min-h-screen bg-zinc-100 text-zinc-950"><header className="bg-gradient-to-r from-black via-purple-950 to-purple-700 text-white"><div className="max-w-7xl mx-auto px-4 py-6"><div onClick={logoClick} className="inline-block bg-black/80 rounded-2xl px-5 py-3 shadow-xl border border-purple-400/40 cursor-default select-none"><p className="tracking-[0.4em] text-sm">CLUB</p><h1 className="text-5xl font-black text-purple-400 leading-none">BABEL</h1><p className="tracking-[0.35em] text-sm">CALZADOS</p></div><h2 className="text-3xl md:text-5xl font-black mt-5">Catálogo Oficial</h2><p className="text-lg mt-2 text-purple-100">Catálogo digital para mostrar modelos, precios, talles y disponibilidad.</p></div></header><main className="max-w-7xl mx-auto px-4 py-8">{loginOpen && !admin && <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><Card className="w-full max-w-sm"><div className="p-5 space-y-4"><p className="font-black text-xl">🔒 Acceso administrador</p><Inp type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key === "Enter" && login()}/><div className="grid grid-cols-2 gap-2"><Btn className="border bg-white" onClick={()=>setLoginOpen(false)}>Cancelar</Btn><Btn className="bg-purple-700 text-white" onClick={login}>Ingresar</Btn></div></div></Card></div>}{admin ? <div className="grid lg:grid-cols-[260px_1fr] gap-6"><aside className="bg-white rounded-2xl p-4 shadow-md h-fit sticky top-4 space-y-2"><p className="font-black text-xl mb-3">Panel administrador</p><MenuButton id="ventas" label="Ventas"/><MenuButton id="gastos" label="Gastos"/><MenuButton id="productos" label="Productos"/><MenuButton id="stock" label="Stock / Catálogo"/><MenuButton id="comisiones" label="Comisiones"/><MenuButton id="informes" label="Informes"/><MenuButton id="config" label="Configuración"/><div className="border-t pt-3 mt-3 space-y-2"><p className="font-bold">Contraseña</p><Inp type="password" placeholder="Nueva contraseña" value={newPass} onChange={e=>setNewPass(e.target.value)}/><Btn className="border bg-white w-full" onClick={savePassword}>Guardar</Btn><Btn className="border bg-white w-full" onClick={()=>setAdmin(false)}>Salir</Btn></div></aside><section>{content}</section></div> : ViewCatalog()}</main>{PaymentModal()}{PrintModal()}<footer className="bg-black text-white mt-10 py-6 text-center"><p className="font-bold">BABEL CALZADOS</p><p className="text-sm text-zinc-400">Catálogo digital de productos</p></footer></div>;
}