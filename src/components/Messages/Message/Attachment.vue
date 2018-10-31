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
      <pre v-else-if="attachment.meta.original">
        <a v-bind:href="attachment.downloadUrl">Download {{attachment.name}}</a> ({{attachment.meta.original.mimetype}}, size: {{ numeral(attachment.meta.original.size).format('0b') }} )
        <!--<i>@todo preview; if not available, we need to get appropriate image/icon from font-awesome (file-*)</i>-->
      </pre>
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
</style>
