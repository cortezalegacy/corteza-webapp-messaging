<template>
  <section>
    <div>
      <router-link v-if="link && canCreate" :to="link" @click.native="$emit('close')">
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
        :key="ch.channelID"
        :channel="ch"
        :current="current"
        :index="index"
        v-on="$listeners" />
    </ul>
  </section>
</template>
<script>
import Channel from 'corteza-webapp-messaging/src/components/Panel/Channels/Channel'

export default {
  components: {
    Channel,
  },

  props: {
    list: {
      type: Array,
      required: true,
    },

    link: {
      type: Object,
      required: false,
    },

    current: {
      type: Object,
      required: false,
    },

    canCreate: {
      type: Boolean,
      required: false,
      default: false,
    },
  },

  data () {
    return {
      shown: false,
      expanded: true,
    }
  },

  computed: {},
}
</script>
<style scoped lang="scss">
@import 'corteza-webapp-messaging/src/themes/corteza-base/btns.scss';

div {
  display: block;
  font-size: 14px;
  color: $dark;
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
  font-family: $semibold;
}

.icon-plus {
  &.btn {
    padding: 1px;
    float: right;
    margin-right: 7px;
    margin-top: 6px;
    font-size: 12px;
    &:hover{
      color: $dark;
      background: transparent;
      border-color: $dark;
    }
  }
}
</style>
