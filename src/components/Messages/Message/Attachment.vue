<template>
  <div class="attachment">
    <div
      v-if="canPreview"
      class="actions">
      <a :href="attachment.downloadUrl">
        <button class="action">
          <font-awesome-icon :icon="['fas', 'file-download']" :title="$t('message.file.download')"></font-awesome-icon>
        </button>
      </a>
    </div>

    <template v-if="canPreview">
      <preview-inline
        @openPreview="openPreview"
        :src="inlineUrl"
        :meta="inlineMeta"
        :name="attachment.name"
        :alt="attachment.name"
        :labels="previewLabels" />

    </template>
    <template v-else-if="attachment.meta.original">
      <span class="no-preview">
        <!-- file has size but not image -->
        <a v-bind:href="attachment.downloadUrl">
          <div>
            <font-awesome-icon
              :icon="['far', 'file-'+ext]"
              :title="$t('message.openBookmarks')"
            ></font-awesome-icon>
          </div>
          <div>
            <span>{{ $t('message.file.download', { label: attachment.name }) }}</span><br>
            <span class="meta">{{ $t('message.file.size', { size: numeral(attachment.meta.original.size).format('0b') }) }}</span>
          </div>
        </a>
      </span>
    </template>
    <template v-else>
      <!-- @todo : added file has no size so probably error, maybe other possible errors -->
      <span class="missing">
        <i18next path="message.file.missing" tag="i">
          <template><br/>{{attachment.name}}<br/></template>
        </i18next>
      </span>
    </template>
  </div>
</template>
<script>
import * as numeral from 'numeral'
import { canPreview } from 'corteza-webapp-common/src/lib/file_preview'
import { PreviewInline } from 'corteza-webapp-common/src/components/FilePreview/index'

export default {
  components: {
    PreviewInline,
  },

  props: [ 'attachment', 'inline' ],

  computed: {
    inlineMeta () {
      // atm only images require special meta; dimensions.
      return (this.attachment.meta.preview || {}).image || {}
    },
    inlineUrl () {
      return this.ext === 'pdf' ? this.attachment.downloadUrl : this.attachment.previewUrl
    },
    canPreview () {
      const meta = this.attachment.meta
      const type = (meta.preview || meta.original || {}).mimetype
      return canPreview({ type, src: this.inlineUrl, name: this.attachment.name })
    },
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

    previewLabels () {
      return {
        loading: this.$t('preview.pdf.loading'),
        firstPagePreview: this.$t('preview.pdf.firstPagePreview'),
        pageLoadFailed: this.$t('preview.pdf.pageLoadFailed'),
        pageLoading: this.$t('preview.pdf.pageLoading'),
      }
    },
  },

  methods: {
    openPreview (e) {
      this.$bus.$emit('$message.previewAttachment', { ...this.attachment, ...e })
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
  display: block;
  color: #000;
  .meta{
    font-weight: 300;
  }
}

.attachment {
  margin-bottom: 5px;

  &:hover .actions {
    display: block;
  }

  .no-preview a {
    display: flex;
  }
  .no-preview .svg-inline--fa{
    height: 30px;
    width: auto;
    margin-right: 10px;
  }
  .actions {
    position: absolute;
    right: 0;
    top: 0;
    padding: 9px 8px;
    display: none;
    z-index: 2;

    button {
      background-color: #FFFFFF;
      border: solid 1px $secondary;
      border-radius: 4px;
      padding: 3px 7px;
      cursor: pointer;
    }

    .action {
      display: inline-block;
      border: solid 1px rgba($secondary, 0.25);
      border-radius: 5px;
      width: 25px;
      height: 25px;
      background-color: $white;
      font-size: 15px;
      text-align: center;
      box-shadow: 0 0 3px 0 rgba($secondary, 0.5);
      cursor: pointer;
      color: $secondary;
      margin-right: 1px;
      &.unread{
        color: $danger;
      }
      &:hover{
        border-color: $secondary;
      }
    }
  }
}

</style>
