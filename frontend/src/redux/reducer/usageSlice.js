import { createSlice } from "@reduxjs/toolkit"

let initialState = {
    isModalOpen: false,
    totalUsageTime: 0
}

export const usageSlice = createSlice({
    name: 'usage',
    initialState,
    reducers: {
        openModal: (state) => {
            state.isModalOpen = true; // 모달 열림
        },
        closeModal: (state) => {
            state.isModalOpen = false; // 모달 닫힘
        },
        addUsageTime(state, action) {
            state.totalUsageTime += action.payload
        },
    }
})

export const usageActions = usageSlice.actions
export default usageSlice.reducer