<template>
  <div
    class="droparea"
    @dragend="$emit('close')"
    @dragleave="$emit('close')">

    <div class="message-confirm">
      <vue-dropzone
        v-if="typeSupported"
        ref="dropzone"
        id="dropzone"
        @vdropzone-drop="onDrop"
        @vdropzone-file-added="onFileAdded"
        @vdropzone-file-added-manually="onFileAdded"
        @vdropzone-complete="onComplete"
        :useCustomSlot="true"
        :options="options">

        <i18next path="message.file.uploadHeader" tag="h2">
          <span><br/>
            <template v-if="replyTo">{{ $t('message.file.replyToThread') }}</template>
            <template v-else>{{ label(channel) }}</template>
          <br/></span>
        </i18next>
      </vue-dropzone>

      <div v-else class="dz-message unsupported">
          <h2>{{ $t('message.file.unsupportedType') }}</h2>
          <button class="btn btn-blue" @click="$emit('close')">
            {{ $t('message.file.ok') }}
          </button>
        </div>

      <div class="button-group" v-if="queued && typeSupported">
        <i18next path="message.file.willUploadTo" tag="h3">
          <span>
            <template v-if="replyTo">{{ $t('message.file.uploadedToThread') }}</template>

            <template v-else>
              {{ $t('message.file.uploadToChannel', { label: label(channel) }) }}<br/>
              {{ $t('message.file.uploadTarget') }}
            </template>
          </span>
        </i18next>

        <button class="btn btn-blue" @click="uploadFile">
          {{ $t('message.file.send') }}
        </button>
        <button class="btn" @click="resetUpload">
          {{ $t('message.file.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import vueDropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import '@/assets/sass/file-upload.scss'
import emitCloseOnEscape from '@/mixins/emitCloseOnEscape'

export default {
  components: {
    vueDropzone,
  },

  mixins: [
    emitCloseOnEscape,
  ],

  props: {
    channelID: { type: String, required: true },
    replyTo: { type: String, required: false },
    typeSupported: { type: Boolean, default: true },
  },

  data () {
    return {
      queued: 0,
    }
  },

  computed: {
    ...mapGetters({
      lastMessage: 'channels/lastMessage',
      findChannelByID: 'channels/findByID',
    }),

    channel () {
      return this.findChannelByID(this.channelID)
    },

    options () {
      return {
        paramName: 'upload',
        // @todo make maxFilesize configurable
        maxFilesize: 10, // mb
        url: () => {
          return `${this.$rest.baseURL()}/channels/${this.channelID}/attach`
        },
        params: { replyTo: this.replyTo },
        thumbnailMethod: 'contain',
        thumbnailWidth: 350,
        thumbnailHeight: 400,
        withCredentials: true,
        autoProcessQueue: false,
        maxFiles: 1,
        addRemoveLinks: false,
        disablePreview: true,
        dictRemoveFile: 'Remove',
        headers: {
          // https://github.com/enyo/dropzone/issues/1154
          'Cache-Control': '',
          'X-Requested-With': '',
          'Authorization': 'Bearer ' + this.$auth.JWT,
        },
      }
    },

    dropzone () {
      return this.$refs.dropzone
    },
  },

  methods: {
    onDrop (e) {
      // Check if files are valid; folders won't have a type
      if (![...e.dataTransfer.files].filter(f => f.type).length) this.$emit('update:typeSupported', false)
    },

    // toggleDisabled ({ disabled }) {
    //   this.disabled = disabled
    // },

    openFilePicker () {
      this.dropzone.$el.click()
    },

    uploadFile () {
      this.dropzone.processQueue()
    },

    resetUpload () {
      this.dropzone.removeAllFiles()
      this.queued = 0
      this.$emit('close')
    },

    onFileAdded (file) {
      this.$emit('show', {})

      // If file is already in DZ, remove it and use curent one
      const qFiles = this.dropzone.getQueuedFiles()
      if (qFiles.length > 0) {
        this.dropzone.removeFile(qFiles[0])
      }

      this.queued = 1
    },

    // When maximum files exceed, file uplaod is called and it fails instantly
    onComplete (e) {
      if (e.status !== 'error') {
        this.resetUpload()
      }
    },
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
@import '@/assets/sass/btns.scss';

.droparea {
  position: absolute;
  background: rgba(0,0,0,.8);
  z-index: 5;
}

.message-confirm {
  position: relative;
  top: 50%;
  -webkit-transform: translateY(-50%);
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
  z-index: 10;

  .unsupported {
    text-align: center;
    h2 {
      color: $appred;
    }
  }
}

.vue-dropzone .dz-preview .dz-remove{
  opacity: 1;
  border: none;
  margin-bottom: -40px;
  color: black;
}

.dropzone{
  position: relative;
  z-index: 100;
  width: 100%;
  height: 100vh;
  background: rgba(255,255,255,.1);
  &.dz-started{
    max-width: 800px;
    height: auto;
    margin: 0 auto;
    text-align: center;
    background-color: white;
  }
  .dz-preview{
    .dz-image{
      img{
        margin: 0 auto;
      }
    }
  }
}
.dz-message{
  h2{
    color: $appwhite;
    font-size: 26px;
  }
}
.vue-dropzone{
  color: black;
  border: 0 none;
}

#dropzone * {
  pointer-events: none;
}
.message-input{
  font-size: 1.2rem;
  width: 100%;
  border-radius: 3px;
  border: 1px solid #90A3B1;
  font-size: 1.2rem;
  padding-left: 20px;
  line-height: 2rem;
}
.message-input:focus{
  outline: none;
}
.button-group{
  text-align: center;
  padding: 20px;
  background: white;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 20px 55px rgba(0,0,0,.35), 0 0 1px rgba(0,0,0,.15);
  h3{
    margin-bottom: 30px;
  }
}

@media (min-width: $wideminwidth)
{
  #dropzone.overlayed
  {
    margin-left:320px;
    max-width:calc(100vw - 320px);
  }
}

</style>
