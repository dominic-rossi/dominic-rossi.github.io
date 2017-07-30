// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import VueResource from 'vue-resource';
import { sync } from 'vuex-router-sync';
import 'bootstrap/dist/js/bootstrap';

import router from './router';
import store from './store';

Vue.config.productionTip = false;

Vue.use(VueResource);

sync(store, router);
/* eslint-disable no-unused-vars */
const app = new Vue({
  router,
  store,
}).$mount('#app');
