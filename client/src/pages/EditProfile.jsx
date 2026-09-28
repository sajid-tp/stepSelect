
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import FormField from '../components/FormField';

import {
  updateProfile,
  updatePassword,
  fetchUserProfile,
  uploadProfileImage,
} from '../features/user/accountSlice';

function EditProfile() {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const profile = useSelector((state) => state.account?.profile);

  // --------------------------------------------------
  // Personal Information Form
  // --------------------------------------------------

  const {
    register: registerPersonal,
    reset: resetPersonalForm,
    handleSubmit: handlePersonalFormSubmit,
    formState: {
      errors: personalErrors,
      isSubmitting: isUpdatingProfile,
    },
  } = useForm({
    defaultValues: {
      username: '',
      phoneNumber: '',
    },
  });

  // --------------------------------------------------
  // Security Settings Form
  // --------------------------------------------------

  const {
    register: registerSecurity,
    reset: resetSecurityForm,
    handleSubmit: handleSecurityFormSubmit,
    formState: {
      isSubmitting: isUpdatingPassword,
    },
  } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // --------------------------------------------------
  // Image & Preview States
  // --------------------------------------------------

  const [previewImage, setPreviewImage] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [imageError, setImageError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // --------------------------------------------------
  // Success Messages
  // --------------------------------------------------

  const [personalSuccess, setPersonalSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // --------------------------------------------------
  // Fetch Profile
  // --------------------------------------------------

  useEffect(() => {
    if (!profile) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch, profile]);

  // --------------------------------------------------
  // Populate Personal Form When Profile Loads
  // --------------------------------------------------

  useEffect(() => {
    if (profile) {
      resetPersonalForm({
        username: profile.username || '',
        phoneNumber: profile.phoneNumber || '',
      });

      if (profile.profileImage) {
        setPreviewImage(profile.profileImage);
        setImgError(false);
      }
    }
  }, [profile, resetPersonalForm]);

  // --------------------------------------------------
  // Image Upload
  // --------------------------------------------------

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImageError('');

    if (!file.type.startsWith('image/')) {
      setImageError(
        'Please select a valid image file (PNG, JPG, JPEG, WEBP).'
      );
      return;
    }

    const MAX_SIZE = 3 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      setImageError('Image must be smaller than 3MB.');
      return;
    }

    // Generate instant local preview
    const localUrl = URL.createObjectURL(file);

    setPreviewImage(localUrl);
    setImgError(false);
    setIsUploadingImage(true);

    try {
      await dispatch(uploadProfileImage(file)).unwrap();
    } catch (err) {
      setImageError(
        err || 'Failed to upload image. Please try again.'
      );

      setPreviewImage(profile?.profileImage || null);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // --------------------------------------------------
  // Personal Information Submit
  // --------------------------------------------------

  const onPersonalSubmit = async (data) => {
    setPersonalSuccess('');

    const trimmedName = data.username.trim();
    const trimmedPhone = String(data.phoneNumber).trim();

    try {
      await dispatch(
        updateProfile({
          username: trimmedName,
          phoneNumber: trimmedPhone,
        })
      ).unwrap();

      setPersonalSuccess('Your details have been saved.');

      setTimeout(() => {
        setPersonalSuccess('');
      }, 4000);
    } catch (err) {
      // Redux/API error is handled by RHF submit flow.
      console.error(err);
    }
  };

  // --------------------------------------------------
  // Password Submit
  // --------------------------------------------------

  const onSecuritySubmit = async (data) => {
    setPasswordError('');
    setPasswordSuccess('');

    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      await dispatch(
        updatePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        })
      ).unwrap();

      resetSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setPasswordSuccess(
        'Your password has been updated.'
      );

      setTimeout(() => {
        setPasswordSuccess('');
      }, 4000);
    } catch (err) {
      setPasswordError(
        err || 'Failed to update password'
      );
    }
  };

  // --------------------------------------------------
  // Other UI Values
  // --------------------------------------------------

  const userInitial =
    profile?.username?.charAt(0).toUpperCase() || 'U';

  const hasValidImage =
    previewImage && !imgError;

  // --------------------------------------------------
  // JSX
  // --------------------------------------------------

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfb]">

      <Navbar />

      <main className="container flex-1 py-10 max-w-xl mx-auto">

        <p className="text-xs text-muted mb-6 tracking-wide uppercase">
          Home / Account /{' '}
          <span className="font-semibold text-ink">
            Edit Profile
          </span>
        </p>

        {/* --------------------------------------------- */}
        {/* Personal Information */}
        {/* --------------------------------------------- */}

        <div className="rounded-2xl border border-line bg-white p-8 shadow-xs mb-8">

          <h2 className="text-xl font-bold mb-6">
            Personal{' '}
            <span className="text-[#f4511e]">
              Information
            </span>
          </h2>

          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />

            <div className="relative group">

              {hasValidImage ? (
                <img
                  src={previewImage}
                  alt="Profile"
                  onError={() => setImgError(true)}
                  onClick={() => setIsViewerOpen(true)}
                  className="h-20 w-20 rounded-full object-cover border border-line cursor-pointer hover:opacity-90 transition shadow-xs"
                  title="Click to view full image"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-[#f4511e] flex items-center justify-center text-white font-bold text-2xl shadow-xs">
                  {userInitial}
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 bg-ink text-white p-1.5 rounded-full text-xs shadow hover:bg-black transition disabled:opacity-50"
                aria-label="Upload photo"
              >
                {isUploadingImage ? '⏳' : '📷'}
              </button>

            </div>

            <div className="mt-3 flex items-center gap-3 text-xs">

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={isUploadingImage}
                className="font-bold uppercase tracking-wider text-muted hover:text-ink disabled:opacity-50"
              >
                {isUploadingImage
                  ? 'Uploading...'
                  : 'Upload New Photo'}
              </button>

              {hasValidImage && (
                <>
                  <span className="text-gray-300">|</span>

                  <button
                    type="button"
                    onClick={() =>
                      setIsViewerOpen(true)
                    }
                    className="font-bold uppercase tracking-wider text-[#f4511e] hover:underline"
                  >
                    View Photo
                  </button>
                </>
              )}

            </div>

            {imageError && (
              <p className="mt-2 text-xs text-red-500 font-medium">
                {imageError}
              </p>
            )}

          </div>

          {/* Success Message */}
          {personalSuccess && (
            <p className="mb-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>

              {personalSuccess}
            </p>
          )}

          <form
            onSubmit={handlePersonalFormSubmit(
              onPersonalSubmit
            )}
            noValidate
          >

            <FormField
              label="Name"
              {...registerPersonal('username', {
                required: 'Name is required',
                minLength: {
                  value: 6,
                  message:
                    'Name must be at least 6 characters long',
                },
              })}
              error={personalErrors.username?.message}
            />

            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={profile?.email || ''}
              disabled
            />

            <p className="text-[11px] text-muted -mt-2 mb-4">
              Need to change your email?{' '}
              <Link
                to="/profile/change-email"
                className="text-[#f4511e] font-semibold"
              >
                Update it here
              </Link>
            </p>

            <FormField
              label="Phone Number"
              type="tel"
              {...registerPersonal('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\d{10,15}$/,
                  message:
                    'Phone number must contain only digits and be at least 10 digits long',
                },
              })}
              error={personalErrors.phoneNumber?.message}
            />

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="mt-4 w-full rounded-md bg-ink py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-black disabled:opacity-50"
            >
              {isUpdatingProfile
                ? 'Saving...'
                : '💾 Save Personal Details'}
            </button>

          </form>

        </div>

        {/* --------------------------------------------- */}
        {/* Security Settings */}
        {/* --------------------------------------------- */}

        <div className="rounded-2xl border border-line bg-white p-8 shadow-xs mb-8">

          <h2 className="text-xl font-bold mb-6">
            Security{' '}
            <span className="text-[#f4511e]">
              Settings
            </span>
          </h2>

          {passwordSuccess && (
            <p className="mb-4 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs font-medium text-green-700">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>

              {passwordSuccess}
            </p>
          )}

          {passwordError && (
            <p className="mb-4 text-xs font-semibold text-[#f4511e]">
              {passwordError}
            </p>
          )}

          <form
            onSubmit={handleSecurityFormSubmit(
              onSecuritySubmit
            )}
            noValidate
          >

            <FormField
              label="Current Password"
              type="password"
              placeholder="Enter current password"
              {...registerSecurity('currentPassword', {
                required: 'Current password is required',
              })}
              rightElement={
                <Link
                  to="/forgot-password"
                  className="text-[11px] font-semibold text-[#f4511e]"
                >
                  Forgot Password?
                </Link>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <FormField
                label="New Password"
                type="password"
                placeholder="Enter new password"
                {...registerSecurity('newPassword', {
                  required: 'New password is required',
                })}
              />

              <FormField
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                {...registerSecurity('confirmPassword', {
                  required:
                    'Please confirm your new password',
                })}
              />

            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="mt-4 w-full rounded-md bg-ink py-3 text-xs font-bold uppercase tracking-wider text-white hover:bg-black disabled:opacity-50"
            >
              {isUpdatingPassword
                ? 'Updating...'
                : '🔒 Update Password'}
            </button>

          </form>

        </div>

        <div className="text-center">

          <Link
            to="/profile"
            className="text-xs font-semibold text-muted hover:text-ink uppercase tracking-wider"
          >
            ← Back to My Account
          </Link>

        </div>

      </main>

      {/* --------------------------------------------- */}
      {/* Image Viewer */}
      {/* --------------------------------------------- */}

      {isViewerOpen && hasValidImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          onClick={() => setIsViewerOpen(false)}
        >

          <div
            className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex items-center justify-between px-5 py-4 border-b border-line">

              <h3 className="text-sm font-bold text-ink">
                Profile Picture
              </h3>

              <button
                type="button"
                onClick={() => setIsViewerOpen(false)}
                className="text-gray-400 hover:text-ink text-lg font-bold"
              >
                ✕
              </button>

            </div>

            <div className="p-6 flex justify-center bg-gray-50">

              <img
                src={previewImage}
                alt="Profile Large Preview"
                className="max-h-80 max-w-full rounded-xl object-contain shadow"
              />

            </div>

            <div className="p-4 flex justify-end gap-3 bg-white border-t border-line">

              <button
                type="button"
                onClick={() => {
                  setIsViewerOpen(false);
                  fileInputRef.current?.click();
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#f4511e] text-white rounded-md hover:bg-[#e04515]"
              >
                Change Photo
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsViewerOpen(false)
                }
                className="px-4 py-2 text-xs font-semibold border border-line rounded-md hover:bg-gray-50"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      <Footer />

    </div>
  );
}

export default EditProfile;


// ### One important thing before you paste this

// Your `FormField` component **must forward the `ref`, `name`, `onChange`, and `onBlur` props to its actual `<input>` element**.

// For example, internally it should support something like:

// ```jsx
// <input {...props} ref={ref} />
// ```

// If your `FormField` currently does **not** forward the `ref`, `register()` won't work correctly with it.

// The main changes are:

// ```text
// BEFORE
// watch()
//   ↓
// setValue()
//   ↓
// manual onChange
//   ↓
// component re-renders on typing


// AFTER
// register()
//   ↓
// React Hook Form manages the input
//   ↓
// no full-form watch subscription
//   ↓
// typing does not cause the same whole-component
// subscription-driven re-renders
// ```

// Also, `isSubmitting` replaces your separate `isUpdatingProfile` / `isUpdatingPassword` state, so those extra `useState` variables aren't needed either.