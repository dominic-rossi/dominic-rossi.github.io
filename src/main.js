// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue';
import App from './App';
import router from './router';

import VueResource from 'vue-resource';
import moment from 'moment';
import 'bootstrap/dist/js/bootstrap';
import store from './store';
import { sync } from 'vuex-router-sync';

Vue.config.productionTip = false;

Vue.use(VueResource);

sync(store, router);
/* eslint-disable no-new */
const app = new Vue({
  router,
  store
}).$mount('#app')
