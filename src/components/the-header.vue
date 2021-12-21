<template>
  <a-layout-header class="header">
    <div id="components-layout-demo-top-side-2">
      <div class="logo" />
    </div>
    <a-menu
        v-model:selectedKeys="selectedKeys1"
        theme="dark"
        mode="horizontal"
        :style="{ lineHeight: '64px' }"
    >
      <a-menu-item key="1">nav1</a-menu-item>
      <a-menu-item key="2">nav2</a-menu-item>
      <a-menu-item key="3">nav3</a-menu-item>
    </a-menu>
  </a-layout-header>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'the-header'
});
</script>