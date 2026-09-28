import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSideBar';
import { fetchAddresses, deleteAddress } from '../features/user/addressSlice'; 

function Addresses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: addresses, status } = useSelector((state) => state.address);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchAddresses());
  }, [status, dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteAddress(id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="container flex-1 py-10">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountSidebar />

          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">
                My <span className="text-[#f4511e]">Addresses</span>
              </h1>
              <Link
                to="/profile/addresses/new"
                className="rounded-md bg-[#f4511e] px-4 py-2 text-xs font-bold uppercase text-white shadow-sm hover:opacity-90 transition"
              >
                + Add New
              </Link>
            </div>

            {/* Address Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
  <div
    key={addr._id}
    className={`rounded-xl border p-5 bg-white transition relative ${
      addr.isDefault
        ? 'border-[#f4511e] shadow-xs ring-1 ring-[#f4511e]/20'
        : 'border-line'
    }`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center text-xs text-[#f4511e]">
          {addr.addressType === 'Home' ? '🏠' : '💼'}
        </div>
        <span className="font-bold text-sm text-ink">{addr.addressType}</span>
      </div>
      {addr.isDefault && (
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f4511e] text-white px-2 py-0.5 rounded">
          Default
        </span>
      )}
    </div>

    <p className="text-xs text-muted leading-relaxed">{addr.detailedAddress}</p>
    <p className="text-xs text-muted leading-relaxed mb-5">
      {addr.city}, {addr.country} - {addr.pinCode}
    </p>

    <div className="border-t border-line/60 pt-3 flex items-center gap-4 text-xs font-bold uppercase">
      <button
        onClick={() => navigate(`/profile/addresses/edit/${addr._id}`)}
        className="text-muted hover:text-ink flex items-center gap-1"
      >
        ✎ Edit
      </button>
      <button
        onClick={() => handleDelete(addr._id)}
        className="text-[#f4511e] hover:underline flex items-center gap-1"
      >
        🗑 Delete
      </button>
    </div>
  </div>
))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Addresses;

