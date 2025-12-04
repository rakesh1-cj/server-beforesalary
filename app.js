import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const Categories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [selectedCat, setSelectedCat] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loanForm, setLoanForm] = useState({
    name: '',
    description: '',
    type: '',
    interestRateMin: '',
    interestRateMax: '',
    interestRateDefault: '',
    minLoanAmount: '',
    maxLoanAmount: '',
    minTenure: '',
    maxTenure: ''
  });
  const [savingCat, setSavingCat] = useState(false);
  const [savingLoan, setSavingLoan] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoadingCats(true);
    setError(null);
    try {
      const res = await api.get('/categories?withCounts=1');
      setCategories(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setLoadingCats(false);
    }
  };

  const submitCategory = async () => {
    setSavingCat(true);
    setError(null);
    setMsg(null);
    try {
      const res = await api.post('/categories', catForm);
      setMsg('Category created');
      setCatForm({ name: '', description: '' });
      setCategories(prev => [...prev, { ...res.data.data, loanCount: 0 }]);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSavingCat(false);
    }
  };

  const selectCategory = async (cat) => {
    setSelectedCat(cat);
    setLoans([]);
    setError(null);
    setMsg(null);
    try {
      const res = await api.get(`/categories/${cat._id}/loans`);
      setLoans(res.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    }
  };

  const submitLoan = async () => {
    if (!selectedCat) return;
    setSavingLoan(true);
    setError(null);
    setMsg(null);
    try {
      const res = await api.post(`/categories/${selectedCat._id}/loans`, loanForm);
      setMsg('Loan created');
      setLoanForm({
        name: '',
        description: '',
        type: '',
        interestRateMin: '',
        interestRateMax: '',
        interestRateDefault: '',
        minLoanAmount: '',
        maxLoanAmount: '',
        minTenure: '',
        maxTenure: ''
      });
      setLoans(prev => [res.data.data, ...prev]);
      // increment count locally
      setCategories(prev => prev.map(c => c._id === selectedCat._id
        ? { ...c, loanCount: (c.loanCount || 0) + 1 }
        : c));
    } catch (e) {
      setError(e.response?.data?.message || e.message);
    } finally {
      setSavingLoan(false);
    }
  };

  if (!isAdmin) {
    return <div className="p-6 text-sm text-red-600">Admin access required.</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Loan Categories</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-lg font-medium">Create Category</h2>
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="Name"
            value={catForm.name}
            onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
          />
          <textarea
            className="w-full border px-3 py-2 rounded"
            placeholder="Description"
            value={catForm.description}
            onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
          />
          <button
            disabled={savingCat || !catForm.name}
            onClick={submitCategory}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {savingCat ? 'Saving...' : 'Add Category'}
          </button>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-lg font-medium mb-2">Categories</h2>
            {loadingCats && <div className="text-sm text-gray-500">Loading...</div>}
            <div className="space-y-2">
              {categories.map(c => (
                <div
                  key={c._id}
                  className={`border rounded p-3 cursor-pointer ${selectedCat?._id === c._id ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}
                  onClick={() => selectCategory(c)}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-xs text-gray-500">{c.loanCount || 0} loans</span>
                  </div>
                  {c.description && <p className="text-xs text-gray-600 mt-1">{c.description}</p>}
                </div>
              ))}
              {!loadingCats && categories.length === 0 && (
                <div className="text-xs text-gray-500">No categories yet.</div>
              )}
            </div>
        </div>
      </div>

      {selectedCat && (
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">
            Category: {selectedCat.name}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-3">
              <h3 className="text-sm font-medium">Add Loan</h3>
              <input
                className="w-full border px-2 py-1 rounded text-sm"
                placeholder="Loan Name"
                value={loanForm.name}
                onChange={e => setLoanForm(f => ({ ...f, name: e.target.value }))}
              />
              <textarea
                className="w-full border px-2 py-1 rounded text-sm"
                placeholder="Description"
                value={loanForm.description}
                onChange={e => setLoanForm(f => ({ ...f, description: e.target.value }))}
              />
              <input
                className="w-full border px-2 py-1 rounded text-sm"
                placeholder="Type"
                value={loanForm.type}
                onChange={e => setLoanForm(f => ({ ...f, type: e.target.value }))}
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  className="border px-2 py-1 rounded text-xs"
                  placeholder="Rate Min %"
                  value={loanForm.interestRateMin}
                  onChange={e => setLoanForm(f => ({ ...f, interestRateMin: e.target.value }))}
                />
                <input
                  className="border px-2 py-1 rounded text-xs"
                  placeholder="Rate Max %"
                  value={loanForm.interestRateMax}
                  onChange={e => setLoanForm(f => ({ ...f, interestRateMax: e.target.value }))}
                />
                <input
                  className="border px-2 py-1 rounded text-xs"
                  placeholder="Rate Default %"
                  value={loanForm.interestRateDefault}
                  onChange={e => setLoanForm(f => ({ ...f, interestRateDefault: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="border px-2 py-1 rounded text-xs"
                  placeholder="Min Amount"
                  value={loanForm.minLoanAmount}
                  onChange={e => setLoanForm(f => ({ ...f, minLoanAmount: e.target.value }))}
                />
                <input
                  className="border px-2 py-1 rounded text-xs"
                  placeholder="Max Amount"
                  value={loanForm.maxLoanAmount}
                  onChange={e => setLoanForm(f => ({ ...f, maxLoanAmount: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="border px-2 py-1 rounded text-xs"
                  placeholder="Min Tenure"
                  value={loanForm.minTenure}
                  onChange={e => setLoanForm(f => ({ ...f, minTenure: e.target.value }))}
                />
                <input
                  className="border px-2 py-1 rounded text-xs"
                  placeholder="Max Tenure"
                  value={loanForm.maxTenure}
                  onChange={e => setLoanForm(f => ({ ...f, maxTenure: e.target.value }))}
                />
              </div>
              <button
                disabled={savingLoan || !loanForm.name}
                onClick={submitLoan}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
              >
                {savingLoan ? 'Saving...' : 'Create Loan'}
              </button>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium mb-2">Loans in {selectedCat.name}</h3>
              <div className="space-y-2 max-h-[400px] overflow-auto">
                {loans.map(l => (
                  <div key={l._id} className="border rounded p-3 bg-white">
                    <div className="flex justify-between">
                      <span className="font-medium text-sm">{l.name}</span>
                      <span className="text-xs text-gray-500">{l.type}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{l.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Rate: {l.interestRate.min}%–{l.interestRate.max}% (default {l.interestRate.default}%)
                    </p>
                    <p className="text-xs text-gray-500">
                      Amount: ₹{l.minLoanAmount} - ₹{l.maxLoanAmount} | Tenure: {l.minTenure}-{l.maxTenure} months
                    </p>
                  </div>
                ))}
                {loans.length === 0 && (
                  <div className="text-xs text-gray-500">No loans yet in this category.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {(error || msg) && (
        <div className="pt-2 text-sm">
          {error && <span className="text-red-600">{error}</span>}
          {msg && <span className="text-green-600 ml-4">{msg}</span>}
        </div>
      )}
    </div>
  );
};

export default Categories;