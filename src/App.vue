<template>
  <div class="row">
    <div class="col-md-4 col-md-offset-4">
      <p>Welcome to Shift Scheduler! Click below to get started.</p>
        <div class="col-md-offset-3">
          <router-link v-show="false" to=""><i class="fa fa-chevron-left fa-2x"></i></router-link>
        </div>
        <div class="col-md-offset-3">
          <router-link to="/input" class="navigation"><i class="fa fa-chevron-right fa-2x"></i></router-link>
        </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'app',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App'
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  font-size: 14px;
  color: #2c3e50;
  margin-top: 60px;
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.navigation {
  background-color: transparent;
  border: none;
  color: #42b983;
}

.navigation :hover {
  color: #23527c;
}
</style>
