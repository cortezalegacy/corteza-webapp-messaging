<template>
  <div
    class="droparea"
    @dragleave="closeOverlay"
    @dragend="closeOverlay"
    @drop="closeOverlay">

<!--       <div class="overlay">
        <img src="src="/static/pics/target.png">
        <h2>Drop files here to upload</h2>
      </div> -->

      <div class="message-confirm">
          <vue-dropzone
            ref="dropzone"
            id="dropzone"
            :class="{'overlayed': dropzoneOverlayed}"
            @vdropzone-file-added="fileAdded"
            @vdropzone-complete="fileUploaded"
            :disabled="true"
            :useCustomSlot=true
            :options="options">

            <!-- <img src="/../assets/images/crust-logo-with-tagline.png"> -->
            <h2>Drop files to upload to<br>
              <span v-if="replyTo">thread</span>
              <span v-else>#{{ channel.name || channel.ID }}</span>
            </h2>
            <span v-if="dz-started">test</span>
          </vue-dropzone>

          <div class="button-group" v-if="fileDropped">
            <h3>Your file is going to be uploaded to
              <span v-if="replyTo">thread</span>
              <span v-else>#{{ channel.name || channel.ID }}.<br>
                You can switch the channel on your left.
              </span>
            </h3>
            <button class="btn fill" @click="uploadFile">
              Send
            </button>
            <button class="btn" @click="resetUpload">
              Cancel
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

export default {
  name: 'channel-upload',

  props: {
    channelID: { type: String, required: true },
    replyTo: { type: String, required: false },
  },

  data () {
    return {
      fileDropped: false,
      // fileUpload: null,
      // dndOverlay: true,
      // dropzoneOverlayed: true,
      // disabled: false,
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

    dropzoneHasFile () {
      return !!this.fileUpload
    },

    showLightbox () {
      return this.dropzoneHasFile
    },

    lightboxShown () {
      return this.showLightbox || this.dndOverlay
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
      this.fileDropped = true
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
    vueDropzone,
  },
}
</script>

<style scoped lang="scss">
@import '@/assets/sass/_0.commons.scss';
  .overlay{

  }
  .droparea,
  .message-confirm{
    /*display: none;*/
  }
  .droparea {
    width: 100%;
    height: 100vh;
    height: calc(100vh - 60px);
    top: 60px;
    background: rgba(0,0,0,.4);
    position: relative;
    z-index: 5;
  }

  .message-confirm{
    position: relative;
    top: 50%;
    -webkit-transform: translateY(-50%);
    -ms-transform: translateY(-50%);
    transform: translateY(-50%);
    z-index: 10;
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
    height: calc(100vh - 60px);
    background: white;
    &.dz-started{
      max-width: 800px;
      height: auto;
      margin: 0 auto;
      text-align: center;
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
      font-size: 26px;
    }
  }
  .vue-dropzone{
    color: black;
  }

  #dropzone.overlayed {
    margin-top: 62px;
    z-index: 1000;
    background-color: rgba(0, 0, 0, 0.8);
    height: 100vh;
  }
  .left-panel-open #dropzone.overlayed
  {
    margin-left:320px;
  }

  .right-panel-open #dropzone.overlayed
  {
    margin-right:400px;
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
  .btn {
    height: 40px;
    border-radius: 40px;
    padding: 0 40px;
    color: #ffffff;
    font-size: 16px;
    cursor: pointer;
    border-color: #1397CB;
    color: #1397CB;
    &:hover{
      border-color: #0f749c;
    }
    &:focus{
      outline: none;
    }
    &.fill{
      background: #1397CB;
      color: white;
      margin-right: 10px;
      &:hover{
        background: #0f749c;
      }
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
