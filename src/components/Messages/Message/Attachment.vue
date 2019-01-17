<template>
  <div>
      <div v-if="inline && attachment.meta.preview">
        <a class="attachment-wrap" @click.prevent="onClick" :href="prefixAttachmentUrl(attachment.downloadUrl)">
          <img :width="(attachment.meta.preview.image || {}).width || 320"
               :height="(attachment.meta.preview.image || {}).height || 180"
               @error.once="reloadBrokenImage"
               :src="prefixAttachmentUrl(attachment.previewUrl)">
        </a>
      </div>
      <!-- file has size but not image -->
      <span v-else-if="attachment.meta.original">
        <a v-bind:href="attachment.downloadUrl">
          <font-awesome-icon
            :icon="['far', 'file-'+ext]"
            title="Open bookmarks"
          ></font-awesome-icon>
          <span>Download {{attachment.name}}</span><br>
          <span class="meta">Size: {{ numeral(attachment.meta.original.size).format('0b') }}</span>
        </a>
      </span>
      <!-- @todo : added file has no size so probably error, maybe other possible errors -->
      <span class="missing" v-else>
        <i>Oups...<br/>{{attachment.name}} <br />is no longer here...</i>
      </span>
  </div>
</template>
<script>
import * as numeral from 'numeral'

export default {
  props: [ 'attachment', 'inline' ],

  computed: {
    ext () {
      const meta = this.attachment.meta
      switch (meta && meta.original ? meta.original.ext : null) {
        case 'odt':
        case 'doc':
        case 'docx':
          return 'word'
        case 'pdf':
          return 'pdf'
        case 'ppt':
        case 'pptx':
          return 'powerpoint'
        case 'zip':
        case 'rar':
          return 'archive'
        case 'xls':
        case 'xlsx':
        case 'csv':
          return 'excel'
        case 'mov':
        case 'mp3':
        case 'mp4':
          return 'video'
        default: return 'alt'
      }
    },
  },

  methods: {
    prefixAttachmentUrl (url) {
      return this.$rest.baseURL() + url
    },

    onClick () {
      this.$bus.$emit('$message.previewAttachment', this.attachment)
    },

    reloadBrokenImage (ev) {
      window.setTimeout(() => {
        ev.target.src = ev.target.src
      }, 500)
    },

    numeral: numeral,
  },
}
</script>

<style lang="scss" scoped>
.missing {
  color: #ccc;
}
.attachment-wrap
{
  min-height:180px;
}

img {
  max-width: 100% !important;
  width:auto;
  max-height: 180px !important;
}

a{
  text-decoration: none;
  font-size: 12px;
  display: block;
  margin-bottom: 15px;
  color: #000;
  .meta{
    font-weight: 300;
  }
}

.svg-inline--fa{
  height: 30px;
  float: left;
  width: auto;
  margin-right: 10px;
}
</style>
