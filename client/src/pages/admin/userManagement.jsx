// src/pages/admin/Users.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getUsers, toggleBlockUser } from '../../features/admin/userSlice';

function Users() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const dispatch = useDispatch();
  const { users, totalPages, totalUsers, status } = useSelector((state) => state.adminUsers);

  useEffect(() => {
    dispatch(getUsers({ search, page }));
  }, [dispatch, search, page]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); 
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  const handleBlockToggle = (userId) => {
    const confirmed = window.confirm('Are you sure you want to change this user\'s access?');
    if (!confirmed) return;
    dispatch(toggleBlockUser(userId));
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Team</p>
          <h1 className="text-3xl font-bold">
            User <span className="text-[#f4511e]">Database</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{totalUsers}</p>
          <p className="text-xs uppercase text-gray-400">Total Customers</p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search users"
          value={search}
          onChange={handleSearchChange}
          className="flex-1 rounded-md border border-gray-200 px-4 py-2 text-sm outline-none"
        />
        {search && (
          <button
            onClick={handleClearSearch}
            className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-500"
          >
            Clear
          </button>
        )}
      </div>

      {status === 'loading' && <p className="text-sm text-gray-400">Loading...</p>}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-xs uppercase text-gray-400">
            <th className="py-2">Customer</th>
            <th>Email</th>
            <th>Joined On</th>
            <th>Orders</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="py-3 font-medium">{user.username}</td>
              <td>{user.email}</td>
              <td>{new Date(user.joinedOn).toLocaleDateString()}</td>
              <td>{user.orderCount ?? 0} Orders</td>
              <td>{user.isBlocked ? 'Blocked' : 'Active'}</td>
              <td>
                <button
                  onClick={() => handleBlockToggle(user.id)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                    user.isBlocked ? 'bg-gray-800' : 'bg-red-600'
                  }`}
                >
                  {user.isBlocked ? 'Unblock' : 'Block Access'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <p>Page {page} of {totalPages}</p>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default Users;