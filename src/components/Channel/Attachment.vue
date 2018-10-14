<template>
  <div>
      <div v-if="msg.type == 'inlineImage' && msg.attachment.meta.preview">
        <a :href="prefixAttachmentUrl(msg.attachment.downloadUrl)">
          <img :width="(msg.attachment.meta.preview.image || {}).width || 320"
               :height="(msg.attachment.meta.preview.image || {}).height || 180"
               @error.once="reloadBrokenImage"
               :src="prefixAttachmentUrl(msg.attachment.previewUrl)">
        </a>
      </div>
      <pre v-else-if="msg.attachment">
        <a v-bind:href="msg.attachment.download">Download {{msg.attachment.name}}</a> ({{msg.attachment.mimetype}}, size: {{ numeral(msg.attachment.size).format('0b') }} )
        <i>@todo preview; if not available, we need to get appropriate image/icon from font-awesome (file-*)</i>
      </pre>
      <!--{{msg}}-->
  </div>
</template>
<script>
import * as numeral from 'numeral'

export default {
  name: 'attachment',
  props: [ 'msg' ],

  methods: {
    prefixAttachmentUrl (url) {
      return this.$rest.baseURL() + url
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
