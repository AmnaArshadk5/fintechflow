import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { Wallet, History, FileText, Calculator, Landmark, Sun, Moon, ArrowUpCircle, ArrowDownCircle, CheckCircle, Search, Filter, ArrowRight, ArrowLeft } from 'lucide-react';

// --- UTILITIES ---
const formatPKR = (v) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(v);

const useCountUp = (end, duration = 1000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [end]);
  return count;
};

// --- CONTEXT (Toast & Theme) ---
const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <AppContext.Provider value={{ dark, setDark, showToast, formatPKR }}>
      {children}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl text-white font-bold animate-slide-right ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500 animate-shake'}`}>
          {toast.msg}
        </div>
      )}
    </AppContext.Provider>
  );
};

// --- COMPONENTS ---

const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded-xl w-full"></div>)}
  </div>
);

// --- PAGE 1: WALLET DASHBOARD ---
const Dashboard = () => {
  const [wallet, setWallet] = useState({ balance: 0 });
  const [prevBalance, setPrevBalance] = useState(0);
  const [amt, setAmt] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPulse, setIsPulse] = useState(false);
  const { showToast } = useContext(AppContext);
  const count = useCountUp(wallet.balance);

  const fetchWallet = async () => {
    const res = await fetch('http://localhost:5000/api/wallet');
    const data = await res.json();
    setPrevBalance(wallet.balance);
    setWallet(data);
    setLoading(false);
  };

  useEffect(() => { fetchWallet(); }, []);

  const handleAction = async (type) => {
    if (!amt || amt <= 0) return showToast("Enter a valid amount", "error");
    try {
      const res = await fetch(`http://localhost:5000/api/wallet/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(amt) })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setPrevBalance(wallet.balance);
      setWallet(data);
      setAmt('');
      setIsPulse(true);
      showToast(`${type} Successful`);
      setTimeout(() => setIsPulse(false), 600);
    } catch (e) { showToast(e.message, "error"); }
  };

  const balanceColor = wallet.balance >= prevBalance ? 'bg-green-50 dark:bg-green-900/20 border-green-200' : 'bg-red-50 dark:bg-red-900/20 border-red-200';

  return (
    <div className="py-8 space-y-10 animate-fade-in">
      <div className={`p-12 rounded-3xl border-2 text-center transition-all duration-700 ${balanceColor} ${isPulse ? 'animate-pulse-scale' : ''}`}>
        <p className="text-xs font-black uppercase tracking-widest opacity-60">Total Balance</p>
        <h1 className="text-6xl font-black mt-2 text-blue-600">{formatPKR(count)}</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {['deposit', 'withdraw'].map(act => (
          <div key={act} className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold capitalize mb-4">{act}</h3>
            <input type="number" value={amt} onChange={e => setAmt(e.target.value)} className="w-full p-4 rounded-xl border dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="PKR Amount" />
            <button onClick={() => handleAction(act)} className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition active:scale-95 capitalize">{act}</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- PAGE 2: TRANSACTION HISTORY ---
const HistoryPage = () => {
  const [txns, setTxns] = useState([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/transactions').then(r => r.json()).then(data => {
      setTxns(data);
      setLoading(false);
    });
  }, []);

  const filtered = txns.filter(t => 
    t.description.toLowerCase().includes(search.toLowerCase()) && (type === 'all' || t.type === type)
  );

  const summary = useMemo(() => filtered.reduce((acc, t) => {
    if (t.type === 'credit') acc.in += t.amount; else acc.out += t.amount;
    return acc;
  }, { in: 0, out: 0 }), [filtered]);

  return (
    <div className="py-8 space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700"><p className="text-xs font-bold opacity-50">CREDITS</p><p className="text-xl font-bold text-green-500">{formatPKR(summary.in)}</p></div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700"><p className="text-xs font-bold opacity-50">DEBITS</p><p className="text-xl font-bold text-red-500">{formatPKR(summary.out)}</p></div>
        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg"><p className="text-xs font-bold opacity-70">NET</p><p className="text-xl font-bold">{formatPKR(summary.in - summary.out)}</p></div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-4 opacity-30" size={20} />
          <input className="w-full pl-12 p-4 rounded-xl border dark:bg-slate-800" placeholder="Search description..." onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="p-4 rounded-xl border dark:bg-slate-800" onChange={e => setType(e.target.value)}>
          <option value="all">All</option>
          <option value="credit">Credits</option>
          <option value="debit">Debits</option>
        </select>
      </div>

      {loading ? <Skeleton /> : (
        <div className="space-y-4">
          {filtered.map((t, i) => (
            <div key={t.id} className="p-5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl flex justify-between items-center animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center gap-4">
                {t.type === 'credit' ? <ArrowUpCircle className="text-green-500" /> : <ArrowDownCircle className="text-red-500" />}
                <div><p className="font-bold">{t.description}</p><p className="text-xs opacity-50">{new Date(t.timestamp).toLocaleString()}</p></div>
              </div>
              <p className={`text-lg font-bold ${t.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>{t.type === 'credit' ? '+' : '-'}{formatPKR(t.amount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- PAGE 3: LOAN APPLICATION (MULTI-STEP) ---
const LoanApply = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ applicant: '', cnic: '', contact: '', amount: 5000, purpose: 'Personal', tenure: 12 });
  const [errors, setErrors] = useState({});
  const [doneId, setDoneId] = useState(null);
  const { showToast } = useContext(AppContext);

  const validate = () => {
    let e = {};
    if (step === 1) {
      if (!/^\d{5}-\d{7}-\d{1}$/.test(form.cnic)) e.cnic = "Format: XXXXX-XXXXXXX-X";
      if (form.applicant.length < 3) e.applicant = "Name required";
    }
    if (step === 2) {
      if (form.amount < 5000 || form.amount > 5000000) e.amount = "PKR 5,000 to 5,000,000";
      if (form.tenure < 3 || form.tenure > 60) e.tenure = "3 to 60 months";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => validate() && setStep(step + 1);
  const submit = async () => {
    const res = await fetch('http://localhost:5000/api/loans/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) setDoneId(data.id); else showToast(data.error, "error");
  };

  if (doneId) return (
    <div className="py-20 text-center animate-slide-up">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40}/></div>
      <h2 className="text-4xl font-black">Application Successful!</h2>
      <p className="mt-4 opacity-60 text-lg">Your Loan Reference ID is <span className="text-blue-600 font-bold">{doneId}</span></p>
      <Link to="/status" className="mt-8 inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold">Check Status</Link>
    </div>
  );

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="mb-8 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div className="bg-blue-600 h-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 shadow-2xl transition-all">
        {step === 1 && (
          <div className="space-y-5 animate-slide-right">
            <h2 className="text-2xl font-bold">Step 1: Personal Info</h2>
            <Field label="Applicant Name" value={form.applicant} onChange={v => setForm({...form, applicant: v})} error={errors.applicant} />
            <Field label="CNIC" value={form.cnic} onChange={v => setForm({...form, cnic: v})} error={errors.cnic} placeholder="XXXXX-XXXXXXX-X" />
            <Field label="Contact Number" value={form.contact} onChange={v => setForm({...form, contact: v})} />
          </div>
        )}
        {step === 2 && (
          <div className="space-y-5 animate-slide-right">
            <h2 className="text-2xl font-bold">Step 2: Loan Details</h2>
            <Field label="Amount (PKR)" type="number" value={form.amount} onChange={v => setForm({...form, amount: v})} error={errors.amount} />
            <Field label="Tenure (Months)" type="number" value={form.tenure} onChange={v => setForm({...form, tenure: v})} error={errors.tenure} />
            <div>
              <label className="block text-xs font-bold uppercase opacity-50 mb-2">Purpose</label>
              <select className="w-full p-4 rounded-xl border dark:bg-slate-900" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})}>
                <option>Personal</option><option>Education</option><option>Business</option><option>Medical</option>
              </select>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-5 animate-slide-right">
            <h2 className="text-2xl font-bold">Step 3: Review</h2>
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border dark:border-slate-700 space-y-3">
              <p><strong>Name:</strong> {form.applicant}</p>
              <p><strong>Amount:</strong> {formatPKR(form.amount)}</p>
              <p><strong>Tenure:</strong> {form.tenure} Months</p>
              <p><strong>Purpose:</strong> {form.purpose}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-4">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 py-4 border rounded-xl font-bold"><ArrowLeft className="inline mr-2"/> Back</button>}
          {step < 3 ? (
            <button onClick={next} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-bold">Next <ArrowRight className="inline ml-2"/></button>
          ) : (
            <button onClick={submit} className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold">Submit Application</button>
          )}
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, error, type = "text", placeholder = "" }) => (
  <div>
    <label className="block text-xs font-bold uppercase opacity-50 mb-2">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`w-full p-4 rounded-xl border dark:bg-slate-900 focus:ring-2 outline-none transition-all ${error ? 'border-red-500 ring-red-100' : 'focus:ring-blue-500 border-slate-200 dark:border-slate-700'}`} />
    {error && <p className="text-red-500 text-xs mt-1 animate-fade-in">{error}</p>}
  </div>
);

// --- PAGE 4: LOAN STATUS VIEWER ---
const LoanStatus = () => {
  const [loans, setLoans] = useState([]);
  const [sort, setSort] = useState('newest');
  const { showToast } = useContext(AppContext);

  const fetchLoans = () => fetch('http://localhost:5000/api/loans').then(r => r.json()).then(setLoans);
  useEffect(() => { fetchLoans(); }, []);

  const stats = useCountUp(loans.length);
  const pending = loans.filter(l => l.status === 'pending').length;

  const handleStatus = async (id, status) => {
    await fetch(`http://localhost:5000/api/loans/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showToast(`Loan ${status}`);
    fetchLoans();
  };

  const sorted = [...loans].sort((a, b) => sort === 'high' ? b.amount - a.amount : sort === 'low' ? a.amount - b.amount : new Date(b.date) - new Date(a.date));

  return (
    <div className="py-8 space-y-8">
      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 text-center shadow-sm">
          <p className="text-xs font-bold opacity-50">TOTAL APPLICATIONS</p>
          <p className="text-4xl font-black text-blue-600">{stats}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 text-center shadow-sm">
          <p className="text-xs font-bold opacity-50">PENDING</p>
          <p className="text-4xl font-black text-yellow-500">{pending}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 text-center shadow-sm">
          <p className="text-xs font-bold opacity-50">SORTED BY</p>
          <select className="mt-2 p-1 bg-transparent font-bold border-b-2 outline-none" onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="high">High Amount</option>
            <option value="low">Low Amount</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {sorted.map(loan => (
          <div key={loan.id} className="flip-card">
            <div className="flip-card-inner shadow-xl">
              <div className="flip-card-front bg-white dark:bg-slate-800 p-8 flex flex-col justify-between border dark:border-slate-700">
                <div>
                  <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase mb-4 ${loan.status === 'pending' ? 'bg-yellow-100 text-yellow-700 pulse-glow' : loan.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{loan.status}</div>
                  <h3 className="text-xl font-bold">{loan.applicant}</h3>
                  <p className="text-3xl font-black text-blue-600 mt-2">{formatPKR(loan.amount)}</p>
                </div>
                <p className="text-[10px] font-bold opacity-30 italic">Hover to action • ID: {loan.id}</p>
              </div>
              <div className="flip-card-back bg-blue-600 p-8 flex flex-col justify-center gap-4 border-none">
                <button onClick={() => handleStatus(loan.id, 'approved')} className="bg-white text-blue-600 p-4 rounded-xl font-black shadow-lg">APPROVE</button>
                <button onClick={() => handleStatus(loan.id, 'rejected')} className="bg-red-500 text-white p-4 rounded-xl font-black shadow-lg">REJECT</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- PAGE 5: EMI CALCULATOR ---
const EMIPage = () => {
  const [vals, setVals] = useState({ principal: '', rate: '', months: '' });
  const [res, setRes] = useState(null);
  const { showToast } = useContext(AppContext);

  const calculate = async () => {
    if (!vals.principal || !vals.rate || !vals.months) return showToast("All fields required", "error");
    const r = await fetch(`http://localhost:5000/api/loans/emi-calculator?principal=${vals.principal}&annualRate=${vals.rate}&months=${vals.months}`);
    const data = await r.json();
    setRes(data);
    showToast("EMI Calculated");
  };

  const getBreakdown = () => {
    if (!res) return [];
    let bal = parseFloat(vals.principal);
    const r = (parseFloat(vals.rate) / 100) / 12;
    return Array.from({ length: parseInt(vals.months) }).map((_, i) => {
      const interest = bal * r;
      const principal = res.emi - interest;
      bal -= principal;
      return { month: i + 1, principal, interest, bal: Math.max(0, bal) };
    });
  };

  return (
    <div className="py-8 space-y-10 animate-slide-up">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 grid md:grid-cols-4 gap-4 items-end shadow-lg">
        <Field label="Principal" type="number" value={vals.principal} onChange={v => setVals({...vals, principal: v})} />
        <Field label="Rate (%)" type="number" value={vals.rate} onChange={v => setVals({...vals, rate: v})} />
        <Field label="Months" type="number" value={vals.months} onChange={v => setVals({...vals, months: v})} />
        <button onClick={calculate} className="bg-blue-600 text-white h-14 rounded-xl font-bold shadow-lg shadow-blue-500/20">CALCULATE</button>
      </div>

      {res && (
        <div className="space-y-10 animate-fade-in">
          <div className="grid grid-cols-3 gap-6">
            <StatCard label="Monthly EMI" val={res.emi} color="text-blue-600" />
            <StatCard label="Total Interest" val={res.totalInterest} color="text-red-500" />
            <StatCard label="Total Payable" val={res.totalPayable} color="text-green-600" />
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 shadow-xl">
            <h3 className="text-xl font-bold mb-6">Payment Amortization</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="border-b dark:border-slate-700">
                  <tr><th className="p-4">Month</th><th className="p-4">Principal</th><th className="p-4">Interest</th><th className="p-4">Balance</th></tr>
                </thead>
                <tbody>
                  {getBreakdown().map(row => (
                    <tr key={row.month} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors animate-fade-in">
                      <td className="p-4 font-bold">#{row.month}</td>
                      <td className="p-4">{formatPKR(row.principal)}</td>
                      <td className="p-4 text-red-500">{formatPKR(row.interest)}</td>
                      <td className="p-4 font-mono font-bold text-blue-600">{formatPKR(row.bal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, val, color }) => {
  const count = useCountUp(val);
  return (
    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 text-center shadow-lg">
      <p className="text-[10px] font-black uppercase opacity-50 mb-2 tracking-widest">{label}</p>
      <p className={`text-3xl font-black ${color}`}>{formatPKR(count)}</p>
    </div>
  );
};

// --- NAVIGATION ---
const Navbar = () => {
  const { dark, setDark } = useContext(AppContext);
  return (
    <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b dark:border-slate-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
        <Link to="/" className="text-2xl font-black text-blue-600 flex items-center gap-2"><Landmark size={32}/> FintechFlow</Link>
        <div className="flex gap-8 items-center font-bold">
          <NavLink to="/" className={({isActive}) => isActive ? "text-blue-600 scale-110" : "opacity-40"}>Wallet</NavLink>
          <NavLink to="/history" className={({isActive}) => isActive ? "text-blue-600 scale-110" : "opacity-40"}>History</NavLink>
          <NavLink to="/apply" className={({isActive}) => isActive ? "text-blue-600 scale-110" : "opacity-40"}>Apply</NavLink>
          <NavLink to="/status" className={({isActive}) => isActive ? "text-blue-600 scale-110" : "opacity-40"}>Status</NavLink>
          <NavLink to="/emi" className={({isActive}) => isActive ? "text-blue-600 scale-110" : "opacity-40"}>EMI</NavLink>
          <button onClick={() => setDark(!dark)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl transition-transform active:rotate-90">
            {dark ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20}/>}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="min-h-screen">
          <Navbar />
          <main className="max-w-6xl mx-auto px-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/apply" element={<LoanApply />} />
              <Route path="/status" element={<LoanStatus />} />
              <Route path="/emi" element={<EMIPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}