import Vue from 'vue'
import VueRouter from 'vue-router'
import App from '../App.vue'
import Input from '../components/input.vue'
import Validate from '../components/validate.vue'
import Schedule from '../components/scheduler.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/input', component: Input },
  { path: '/validate', component: Validate},
  { path: '/schedule', component: Schedule},
  { path: '/', component: App }
]
export default new VueRouter({routes})