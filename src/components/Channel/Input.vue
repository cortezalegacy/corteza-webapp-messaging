<template>
  <div class="channel-input">
    <trigger-suggestions
      ref="triggerSuggestions"
      @selectSuggestion="selectSuggestion"
      :msg="getCurrentMsgChunk" />

    <div class="wrap">
      <input-rich-text
        @nodeChunkChanged="nodeChunkChanged"
        @navigateSuggestions="navigateSuggestions"
        @selectFocused="selectFocused"
        @submit="onSubmit"
        @editLast="onEditLastPassthrough"
        class="message-input"
        ref="richTextInput" />

      <button class="upload-button" @click="promptFilePicker">
        <span>+</span>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import TriggerSuggestions from './TriggerSuggestions'
import InputRichText from '@/components/Channel/InputRichText'


export default {
  data () {
    return {
      cursorIndex: -1,
      currentChunk: {},
      submitMeta: {},
    }
  },

  computed: {
    ...mapGetters({
      'findByUsername': 'users/findByUsername',
      'findByName': 'channels/findByName',
    }),

    // Gives msg chung where commands are possible
    getCurrentMsgChunk () {
      return this.currentChunk || {}
    },
  },

  methods: {
    nodeChunkChanged (e) {
      this.$set(this, 'currentChunk', e.chunk)
    },

    selectFocused () {
      this.$refs.triggerSuggestions.selectFocused()
    },

    navigateSuggestions (e) {
      switch (e.direction) {
        case 'up':
          this.$refs.triggerSuggestions.previous()
          break

        case 'down':
          this.$refs.triggerSuggestions.next()
          break
      }
    },

    selectSuggestion (e) {
      if (this.$refs.richTextInput.insertTriggeredNode(e)) this.$set(this, 'currentChunk', {})
    },

    promptFilePicker () {
      this.$emit('promptFilePicker', {})
    },

    onEditLastPassthrough (e) {
      console.log('onEditLastPassthrough ', e)
      this.$emit('editLast', e)
    },

    onSubmit (e) {
      console.log('onSubmit', e)
      this.$emit('submit', { message: e.value, meta: this.submitMeta })

      // And reset meta data right after
      this.submitMeta = {}
    },

    setValue (message, submitMeta = {}) {
      this.submitMeta = submitMeta
      this.$refs.richTextInput.setValue(message)
    },
  },

  mounted () {
    console.log('input mounted value', this.value)
  },

  components: {
    TriggerSuggestions,
    InputRichText,
  },
}
</script>

<style lang="scss" scoped>
  @import '@/assets/sass/_0.commons.scss';
  // This component probably won't be used elsewhere,
  // should it be the cas easy to externalize
  .channel-input
  {
    min-height:50px;
    width:100%;
    border:solid 5px $appwhite;
    background-color:$appwhite;
    box-shadow: 0.2rem 0 0.2rem 0 rgba($defaulttextcolor, 0.1);
    .wrap {
      float:left;
      width:100%;
      position:relative;
    }
  }

  .upload-button, .message-input
  {
    border: 1px solid transparent;
    background-color:transparent;
  }

  .upload-button span
  {
    display:inline-block;
    line-height: 1;
  }
  .message-input
  {
    font-family: $crustregular;
    margin-left:50px;
    width:calc(100% - 50px);
    border-radius: 0 5px 5px 0;
    border-left:0;
    float:right;
    font-size:15px;
    padding:11px 5px;
  }

  .upload-button {
    position: absolute;
    height: calc(100%);
    width: 50px;
    color: $appgrey;
    border-radius: 5px 0 0 5px;
    font-size: 1.5rem;
    cursor: pointer;
    text-align: center;
    font-size:30px;
    line-height: 100%;
    float:left;
    z-index: 2;
  }

  .upload-button:focus {
    outline: none;
  }

  .message-input:focus-within {
    outline:none;
    border-color:$appgreen;
    ~ .upload-button
    {
      background-color:rgba($appgreen,0.1);
      border-color:$appgreen;
      color:$appgreen;
    }
  }
  // another background in wide, and no shadow
  @media (min-width: $wideminwidth)
  {
    .channel-input .wrap
    {
      border-radius: 5px;
      border: 1px solid $appgrey;
    }
    .channel-input
    {
      border:solid 15px $appwhite;
      border-top:none;
      border-bottom:none;
      padding-bottom:25px;
      border-color: $mainbgcolor;
      background-color:$mainbgcolor;
      box-shadow: none;
    }
  }
</style>
