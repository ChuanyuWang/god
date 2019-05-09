<style lang="less">

</style>

<template lang="pug">
div.container
  div(style='width:100%;height:400px') {{result}}
  button.btn.btn-primary(@click='createGame', type='button') Create
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
      result: ""
    };
  },
  components: {},
  computed: {},
  filters: {},
  methods: {
    createGame: function(e) {
      var vm = this;
      var request = $.ajax("/wx/creategame", {
        type: "POST",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({
          type: "lyingman",
          player_number: 6,
          wolf_number: 2,
          villager_number: 2,
          wolf_roles: [
            {
              name: "白狼王",
              value: "white",
              checked: true
            }
          ],
          roles: [
            {
              name: "预言家",
              value: "seer",
              checked: "true"
            },
            {
              name: "女巫",
              value: "witch",
              checked: "true"
            }
          ],
          options: {
            witch_save_on_first_night: false
          },
          judge: "xxx"
        }),
        dataType: "json"
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        console.error(
          jqXHR.responseJSON ? jqXHR.responseJSON : jqXHR.responseText
        );
      });
      request.done(function(data, textStatus, jqXHR) {
        vm.result = data;
      });
    }
  },
  created: function() {
    //var vm = this;
  },
  mounted: function() {
    //var vm = this;
  }
};
</script>