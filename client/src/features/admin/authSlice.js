import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const loginAdmin = createAsyncThunk(
    '/admin/auth/login',
    async({email,password},{rejectWithValue})=>{
        try{
        const res = await axiosInstance.post('/admin/auth/login',{email,password});
        return res.data;
        }catch(error){
            return rejectWithValue("Login failed");
        }

    }
)

const authSlice = createSlice({
    name : 'adminAuth',
    initialState : {
        isAdmin: false,
        status : 'idle',
        error : null
    },
    reducers : {
        logout(state){
                state.isAdmin = false;
                state.status= "idle";
                state.error= null;
        },
        clearAuth(state){
            state.error = null;
        }
    },
    extraReducers : (builder)=>{
        builder.addCase(loginAdmin.pending,(state)=>{
                state.status="loading";
                state.error = null;
        })
        .addCase(loginAdmin.fulfilled,(state,action)=>{
            state.isAdmin= true;
            state.status="succeeded";
            state.error=null;
        })
        .addCase(loginAdmin.rejected,(state,action)=>{
            state.status="failed";
            state.error=action.payload;
        })
    }
}
)

export default authSlice.reducer;
export const {logout,clearAuth} = authSlice.actions;
