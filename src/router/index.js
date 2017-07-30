import Vue from 'vue';
import Router from 'vue-router';
import App from '@/App';
import Input from '@/components/input';
import Validate from '@/components/validate';
import Schedule from '@/components/scheduler';

Vue.use(Router);

const routes = [
  { path: '/input', component: Input },
  { path: '/validate', component: Validate },
  { path: '/schedule', component: Schedule },
  { path: '/', component: App },
];
export default new Router({ routes });
