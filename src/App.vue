<template>
  <el-container class="app-container">
    <router-view />
  </el-container>
</template>

<script setup lang="ts">
</script>

<style scoped>
.app-container {
  width: 100%;
  height: 100vh;
}
</style>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
}
</style>
