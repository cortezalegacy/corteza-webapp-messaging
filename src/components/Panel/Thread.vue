<template>
  <div
    v-if="originalMessage(originalID)"
    class="menu-layer right thread">
    <label class="closer"
           @click="toggleUserPanel(false)"
           aria-label="Close"><i class="icon-close"></i></label>

    <message ref="original"
             :message="originalMessage(originalID)"
             :current-user="user" />

    <message v-for="(msg, index) in replies(originalID)"
             ref="message"
             :message="msg"
             :continued="isContinued(replies(originalID), index)"
             :current-user="user"
             :key="msg.ID" />

    <channel-input />
  </div>
</template>
<script>
import { mapActions, mapGetters } from 'vuex'
import Message from '@/components/History/Message'
import ChannelInput from '../Channel/Input'
import messages from '@/mixins/messages'

export default {
  name: 'panel-user',
  data () {
    return {
      originalID: '60701390380466279',
    }
  },

  computed: {
    ...mapGetters({
      user: 'auth/user',
      originalMessage: 'history/getByID',
      replies: 'history/getRepliesByID',
      isUserPanelOpen: 'ui/isUserPanelOpen',
    }),
  },

  methods: {
    ...mapActions({
      toggleUserPanel: 'ui/toggleUserPanel',
    }),
  },

  mounted () {
    this.$ws.getReplies(this.originalID)
  },

  components: {
    ChannelInput,
    Message,
  },

  mixins: [
    messages,
  ],
}
</script>

<style scoped lang="scss">
//inlude generic definitions
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/menu-layer.scss';

.closer {
  position: fixed;
  top: 5px;
  right: 20px;
  font-size: 20px;
}
</style>
