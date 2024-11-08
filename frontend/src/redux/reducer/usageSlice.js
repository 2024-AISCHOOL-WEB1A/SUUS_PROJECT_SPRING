import { createSlice } from "@reduxjs/toolkit"

let initialState = {
    totalUsageTime: 0
}

export const usageSlice = createSlice({
    name: 'usage',
    initialState,
    reducers: {
        addUsageTime(state, action) {
            state.totalUsageTime += action.payload
        },
    }
})

export const usageActions = usageSlice.actions
export default usageSlice.reducer