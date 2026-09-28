import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';
import {setItem, getItem, removeItem} from '../../utils/localStorage';

// Wired to the routes your backend already exposes:
// POST /login, POST /signup, POST /send-otp, POST /verify-otp
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      return res.data; // { id, username }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/signup', { username, email, password });
      return res.data; // { _id, username }
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/logout');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const googleSignup = createAsyncThunk(
  'auth/googleSignup',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        '/auth/google',
        {
          token,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        'Google signup failed'
      );
    }
  }
);


export const googleLogin = createAsyncThunk(
  'auth/googleLogin',
  async ({ token }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        '/auth/google',
        { token }
      );

      return response.data;

    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        'Google login failed'
      );
    }
  }
);


export const otpSignup = createAsyncThunk(
  'auth/sendOtp',
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/send-otp', { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);




// Same /send-otp endpoint as otpSignup, but carries `type` so the backend
// knows whether this is the signup flow or the forgot-password flow
// re-sending a code — since your routes list only has one send-otp route,
// not two separate ones.
export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async ({ email, type }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/resend-otp', { email, type });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/verify-otp', { email, otp });
      return res.data; // assumed: { id, username } — same shape as login, so verifying logs the user in
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);



export const verifyResetOtp = createAsyncThunk(
  'auth/verifyResetOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/verify-reset-otp', { email, otp });
      return res.data; // expected: some confirmation the code is valid, so resetPassword can be called next
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/forgot-password', { email });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({  newPassword, resetToken }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/auth/reset-password', { newPassword, resetToken });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getItem("user") || null,
    status: 'idle', 
    error: null,
    resetToken : null
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.status = 'idle';
      state.error = null;
      removeItem("user");
    },
    clearAuthError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        setItem("user",action.payload);
        
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(signupUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(otpSignup.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(otpSignup.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(otpSignup.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(verifyOtp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload; 
        setItem("user",action.payload);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      .addCase(resendOtp.pending, (state) => {
        state.error = null;
        // Deliberately not touching state.status here — resend is a
        // background action on the same screen; you don't want the whole
        // verify form to flip to a "loading" UI state over it.
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(verifyResetOtp.pending, (state) => {
  state.status = 'loading';
  state.error = null;
})
.addCase(verifyResetOtp.fulfilled, (state,action) => {
  state.status = 'succeeded';
  state.resetToken = action.payload.resetToken;
  
})
.addCase(verifyResetOtp.rejected, (state, action) => {
  state.status = 'failed';
  state.error = action.payload;
}).addCase(forgotPassword.pending, (state) => {
  state.status = 'loading';
  state.error = null;
})
.addCase(forgotPassword.fulfilled, (state) => {
  state.status = 'succeeded';
})
.addCase(forgotPassword.rejected, (state, action) => {
  state.status = 'failed';
  state.error = action.payload;
})
.addCase(resetPassword.pending, (state) => {
  state.status = 'loading';
  state.error = null;
})
.addCase(resetPassword.fulfilled, (state) => {
  state.status = 'succeeded';
  // no state.user — password reset doesn't log anyone in, they still
  // have to go log in with the new password
})
.addCase(resetPassword.rejected, (state, action) => {
  state.status = 'failed';
  state.error = action.payload;
})
.addCase(googleSignup.pending, (state) => {
  state.status = 'loading';
  state.error = null;
})

.addCase(googleSignup.fulfilled, (state, action) => {
  state.status = 'succeeded';
  state.user = action.payload;
  state.error = null;
})

.addCase(googleSignup.rejected, (state, action) => {
  state.status = 'failed';
  state.error = action.payload;
})
.addCase(googleLogin.pending, (state) => {
      state.status = 'loading';
      state.error = null;
    })

    .addCase(googleLogin.fulfilled, (state, action) => {
      state.status = 'succeeded';
      state.user = action.payload;
      state.error = null;
    })

    .addCase(googleLogin.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    })
    .addCase(logoutUser.fulfilled, (state) => {
  state.user = null;
  state.status = 'idle';
  state.error = null;
});
  }
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;