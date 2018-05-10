<style>

</style>

<template lang="pug">
div
  div {{msg}}
</template>

<script>
/**
 * --------------------------------------------------------------------------
 * test-console display a panel for testing robot god
 * --------------------------------------------------------------------------
 */

module.exports = {
  name: "test-console",
  props: {
    //data: Array
  },
  data: function() {
    return {
      msg: "hello world"
    };
  },
  components: {},
  computed: {},
  filters: {},
  methods: {},
  created: function() {
    //var vm = this;
  },
  mounted: function() {
    //var vm = this;
  }
};
</script>