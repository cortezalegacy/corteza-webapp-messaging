<template>
  <section>
    <div>
      <router-link v-if="link" :to="link">
        <i class="icon icon-left icon-plus btn"></i>
      </router-link>
      <a @click="expanded=!expanded">
        <slot></slot>
        <span v-if="list">
          <i v-if="expanded" class="icon-chevron-up"></i>
          <i v-else class="icon-chevron-down"></i>
        </span>
      </a>
    </div>
    <ul v-if="list && expanded">
      <channel
        v-for="(ch, index) in list"
        :key="ch.ID"
        :channel="ch"
        :index="index"
        v-on="$listeners" />
    </ul>
  </section>
</template>
<script>
import Channel from '@/components/Panel/Channels/Channel'

export default {
  props: {
    list: {
      type: Array,
      required: true,
    },
    link: {
      type: Object,
      required: false,
    },
  },

  data () {
    return {
      shown: false,
      expanded: true,
    }
  },

  computed: {},

  components: {
    Channel,
  },
}
</script>
<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/btns.scss';

div {
  display: block;
  font-size: 14px;
  color: $defaulttextcolor;
  margin-top: 10px;
  max-width: 100%;
  padding: .35em 0 0 15px;
  line-height: 30px;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

a {
  cursor: pointer;
  font-family: $crustsemibold;
}

.icon-plus {
  &.btn {
    padding: 1px;
    float: right;
    margin-right: 7px;
    margin-top: 6px;
    font-size: 12px;
    &:hover{
      color: $black;
      background: transparent;
      border-color: $black;
    }
  }
}
</style>
