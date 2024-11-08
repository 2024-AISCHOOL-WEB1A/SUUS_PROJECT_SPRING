import { configureStore } from "@reduxjs/toolkit"
import controlReducer from "./reducer/controlSlice"
import usageReducer from "./reducer/usageSlice"

const store = configureStore({
    reducer: {
        control: controlReducer,
        usage: usageReducer
    },
})

export default store