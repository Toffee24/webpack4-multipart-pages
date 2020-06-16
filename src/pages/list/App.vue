<template>
  <div>
    <h1>{{ title }}</h1>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: process.env.NODE_ENV
    }
  }
}
</script>

<style lang="scss" scoped>
    h1 {
        font-size: 50px;
        transform: translate(10px, 20px);
    }
</style>
