<template>
  <a-layout-footer style="text-align: center;height: 100px;width: 100%;position: absolute;bottom: 0;left: 0">
    软烧香的Wiki{{ user.name ? "，欢迎：" + user.name : ""}}
  </a-layout-footer>
</template>

<script lang="ts">
import {computed, defineComponent} from 'vue';
import store from "@/store";

export default defineComponent({
  name: 'the-footer',
  setup() {
    const user = computed(() => store.state.user);

    return {
      user
    }
  }
});
</script>