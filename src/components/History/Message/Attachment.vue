<template>
  <div>
      <div v-if="inline && attachment.meta.preview">
        <a class="attachment-wrap" :href="prefixAttachmentUrl(attachment.downloadUrl)">
          <img :width="(attachment.meta.preview.image || {}).width || 320"
               :height="(attachment.meta.preview.image || {}).height || 180"
               @error.once="reloadBrokenImage"
               :src="prefixAttachmentUrl(attachment.previewUrl)">
        </a>
      </div>
      <!-- @todo : added file has no size so probably error, maybe other possible errors -->
      <span class="missing" v-else-if="!attachment.size">
        <i>Oups...{{attachment.name}} is no longer here...</i>
      </span>
      <!-- file has size but not image -->
      <pre v-else-if="attachment">
        <a v-bind:href="attachment.download">Download {{attachment.name}}</a> ({{attachment.mimetype}}, size: {{ numeral(attachment.size).format('0b') }} )
        <i>@todo preview; if not available, we need to get appropriate image/icon from font-awesome (file-*)</i>
      </pre>
      <!--{{msg}}-->
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
</style>
