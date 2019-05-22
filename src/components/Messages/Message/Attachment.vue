<template>
  <div>
      <div v-if="inline && attachment.meta.preview">
        <a class="attachment-wrap" @click.prevent="onClick" :href="attachment.downloadUrl">
          <img :width="(attachment.meta.preview.image || {}).width || 320"
               :height="(attachment.meta.preview.image || {}).height || 180"
               @error.once="reloadBrokenImage"
               :src="attachment.previewUrl">
        </a>
      </div>
      <!-- file has size but not image -->
      <span v-else-if="attachment.meta.original">
        <a v-bind:href="attachment.downloadUrl">
          <font-awesome-icon
            :icon="['far', 'file-'+ext]"
            :title="$t('message.openBookmarks')"
          ></font-awesome-icon>
          <span>{{ $t('message.file.download', { label: attachment.name }) }}</span><br>

          <span class="meta">{{ $t('message.file.size', { size: numeral(attachment.meta.original.size).format('0b') }) }}</span>
        </a>
      </span>
      <!-- @todo : added file has no size so probably error, maybe other possible errors -->
      <span class="missing" v-else>
        <i18next path="message.file.missing" tag="i">
          <template><br/>{{attachment.name}}<br/></template>
        </i18next>
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
