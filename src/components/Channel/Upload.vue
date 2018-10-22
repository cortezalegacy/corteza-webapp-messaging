<template>
  <div
    @dragleave="closeOverlay"
    @dragend="closeOverlay"
    @drop="closeOverlay"
    ref="lightbox" class="lightbox"
    v-show="lightboxShown">

    <lightbox>
      <div class="overlay" v-if="showDndOverlay">
        <img src="/static/pics/target.png">
        <h2>Drop files here to upload</h2>
      </div>

      <vue-dropzone
        ref="dropzone"
        id="dropzone"
        :class="{'overlayed': dropzoneOverlayed}"
        @vdropzone-file-added="fileAdded"
        @vdropzone-complete="fileUploaded"
        :disabled="true"
        :useCustomSlot=true
        :options="options">
        <h2>Upload file</h2>
      </vue-dropzone>

      <div v-if="!dropzoneOverlayed" class="message-confirm">
        <!--<textarea-autosize :min-height="30" :max-height="300"-->
                           <!--class="message-input"-->
                           <!--createImageThumbnails="false"-->
                           <!--rows="1"-->
                           <!--placeholder="Write a message..."></textarea-autosize>-->
        <div class="button-group">
          <button class="btn fill" @click="uploadFile">
            Send
          </button>
          <button class="btn" @click="resetUpload">
            Cancel
          </button>
        </div>
      </div>
    </lightbox>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import vueDropzone from 'vue2-dropzone'
import 'vue2-dropzone/dist/vue2Dropzone.min.css'
import Lightbox from '@/components/Lightbox'

export default {
  name: 'channel-upload',

  props: {
    channelID: { type: String, required: true },
    replyTo: { type: String, required: false },
  },

  data () {
    return {
      fileUpload: null,
      dndOverlay: false,
      dropzoneOverlayed: true,
      disabled: false,
    }
  },

  computed: {
    ...mapGetters({
      lastMessage: 'channels/lastMessage',
    }),

    dropzoneHasFile () {
      return !!this.fileUpload
    },

    showLightbox () {
      return this.dropzoneHasFile
    },

    lightboxShown () {
      return this.showLightbox || this.dndOverlay
    },

    showDndOverlay () {
      return this.dndOverlay && !this.dropzoneHasFile
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
        thumbnailWidth: 150,
        withCredentials: true,
        autoProcessQueue: false,
        maxFiles: 1,
        headers: {
          // https://github.com/enyo/dropzone/issues/1154
          'Cache-Control': '',
          'X-Requested-With': '',
        },
      }
    },
  },

  methods: {
    getDropzone () {
      return this.$refs.dropzone
    },

    toggleDisabled ({ disabled }) {
      this.disabled = disabled
    },

    openFilePicker () {
      this.getDropzone().$el.click()
    },

    uploadFile () {
      this.getDropzone().processQueue()
    },

    resetUpload () {
      this.fileUpload = null
      this.getDropzone().removeAllFiles()
      this.dropzoneOverlayed = true
    },

    fileAdded (file) {
      console.debug('-->> fileAdded()')

      // When dropzone is disabled; remove any newly added file
      if (this.disabled) {
        this.getDropzone().removeFile(file)
        return
      }

      // If file is already in DZ, remove it and use curent one
      if (this.dropzoneHasFile) {
        let files = this.getDropzone().getQueuedFiles()
        this.getDropzone().removeFile(files[0])
      }

      this.$set(this, 'fileUpload', file)
      this.dropzoneOverlayed = false
      this.closeOverlay()
    },

    openOverlay (e) {
      this.dndOverlay = true
    },

    closeOverlay (e) {
      this.dndOverlay = false
    },

    // When maximum files exceed, file uplad is called and it fails instantly
    fileUploaded (e) {
      if (e.status !== 'error') {
        this.resetUpload()
      }
    },
  },

  components: {
    Lightbox,
    vueDropzone,
  },
}
</script>

<style scoped>
  #dropzone.overlayed {
    position: absolute;
    right: 0;
    bottom: 0;
    z-index: 1000;
    background-color: transparent;
    width: 75vw;
    height:calc(100vh - 7rem);

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
  .message-confirm{
    background: white;
    padding: 10px;
  }
  .button-group{
    text-align: center;
    margin-top: 10px;
  }
  .btn {
    height: 40px;
    border-radius: 40px;
    padding: 0 40px;
    color: #ffffff;
    font-size: 16px;
    cursor: pointer;
    border-color: #1397CB;
    color: #1397CB;
  }
  .btn:hover{
    border-color: #0f749c;
  }
  .btn.fill{
    background: #1397CB;
    color: white;
  }
  .btn.fill:hover{
    background: #0f749c;
  }
</style>
