<template>
  <div id="app">
    {{ message }}
    <foo></foo>
    <bar></bar>
  </div>
</template>

<script>
import Foo from './components/Foo.vue'
import Bar from './components/Bar.vue'

export default {
  components: { Foo, Bar }, 
  data () {
    return {
      message: 'express + webpack + Vue + SSR + HMR!!'
    }
  }
}
</script>

