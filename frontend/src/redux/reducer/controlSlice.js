import { createSlice } from "@reduxjs/toolkit"

let initialState = {
    currentView: "수어번역",
}

export const controlSlice = createSlice({
    name: 'control',
    initialState,
    reducers: {
        changeView(state, action) {
            state.currentView = action.payload
        },
    }
})

export const controlActions = controlSlice.actions
export default controlSlice.reducer