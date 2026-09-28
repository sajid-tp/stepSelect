import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AccountSidebar from '../components/AccountSideBar';
import { fetchUserProfile } from '../features/user/accountSlice';



function AccountOverview() {
  const dispatch = useDispatch();
  const profile = useSelector((state) => state.account.profile);
  const status = useSelector((state) => state.account.status);
  const error = useSelector((state) => state.account.error);

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  // Reset image error state whenever a new profile or profileImage arrives
  useEffect(() => {
    setImgError(false);
  }, [profile?.profileImage]);



  const userInitial = profile?.username?.charAt(0).toUpperCase() || 'U';
  const hasValidImage = profile?.profileImage && !imgError;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="container flex-1 py-10">
        <p className="text-xs text-muted mb-6 tracking-wide uppercase">
          Home / Account / <span className="font-semibold text-ink">Profile</span>
        </p>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <AccountSidebar />

          <div className="flex-1 w-full space-y-6">
            <h1 className="text-2xl font-bold">
              Account <span className="text-[#f4511e]">Overview</span>
            </h1>

            {/* Personal Details Card */}
            <div className="rounded-xl border border-line p-6 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold tracking-wider uppercase text-muted">
                  Personal Details
                </span>
                <Link
                  to="/profile/edit"
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#f4511e] hover:underline"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </Link>
              </div>

              {status === 'loading' && !profile && (
                <p className="text-sm text-muted">Loading your details...</p>
              )}

              {status === 'failed' && !profile && (
                <p className="text-sm text-red-600">
                  Couldn't load your profile{error ? `: ${error}` : '.'} Try refreshing the page.
                </p>
              )}

              {profile && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  {/* Profile Picture Display */}
                  <div className="relative shrink-0">
                    {hasValidImage ? (
                      <img
                        src={profile.profileImage}
                        alt={profile.username || 'Profile'}
                        onError={() => setImgError(true)}
                        className="h-18 w-18 sm:h-20 sm:w-20 rounded-full object-cover border border-line shadow-xs"
                      />
                    ) : (
                      <div className="h-18 w-18 sm:h-20 sm:w-20 rounded-full bg-[#f4511e] flex items-center justify-center text-white font-bold text-2xl shadow-xs">
                        {userInitial}
                      </div>
                    )}
                  </div>

                  {/* Name, Email, and Phone */}
                  <div className="space-y-3 flex-1">
                    <div>
                      <span className="text-[11px] text-muted block uppercase tracking-wider font-medium">Name</span>
                      <p className="text-sm font-semibold text-ink">{profile.username}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted block uppercase tracking-wider font-medium">Email</span>
                      <p className="text-sm font-semibold text-ink">{profile.email}</p>
                    </div>
                    {profile.phoneNumber && (
                      <div>
                        <span className="text-[11px] text-muted block uppercase tracking-wider font-medium">Phone Number</span>
                        <p className="text-sm font-semibold text-ink">{profile.phoneNumber}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default AccountOverview;