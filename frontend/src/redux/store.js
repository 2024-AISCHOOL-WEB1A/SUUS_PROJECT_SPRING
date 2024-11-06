import { configureStore } from "@reduxjs/toolkit"
import controlReducer from "./reducer/controlSlice"

const store = configureStore({
    reducer : {
        control : controlReducer 
    },
})

export default store