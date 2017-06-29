import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

const store = new Vuex.Store({
    state: {
        rows: null,
        schedule_open: null,
        schedule_month: null,
        valid_rows: [],
        validated_names: null,
    },
    mutations: {
        save_rows (state, payload) {
            state.rows = payload
        },
        save_schedule_open (state, payload) {
            state.schedule_open = payload
        },
        save_schedule_month (state, payload) {
            state.schedule_month = payload
        },
        save_valid_rows (state, payload) {
            state.valid_rows = payload
        },
        validated_names (state, validity) {
          state.validated_names = validity
        }
    }
})

export default store