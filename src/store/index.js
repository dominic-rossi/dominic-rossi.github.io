import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    rows: null,
    schedule_open: null,
    schedule_month: null,
    valid_rows: [],
    validated_names: null,
    primaryShifts: null,
    alternateShifts: null,
  },
  mutations: {
    save_rows(state, payload) {
      state.rows = payload;
    },
    save_schedule_open(state, payload) {
      state.schedule_open = payload;
    },
    save_schedule_month(state, payload) {
      state.schedule_month = payload;
    },
    validated_names(state, validity) {
      state.validated_names = validity;
    },
    update_rows(state, payload) {
      state.valid_rows = payload;
    },
    save_primary(state, payload) {
      state.primaryShifts = payload;
    },
    save_alternate(state, payload) {
      state.alternateShifts = payload;
    },
  },
});

export default store;
