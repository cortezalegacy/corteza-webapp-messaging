<template>
  <li class="member-item">
    <div
      v-if="variant === 'showcase'"
      class="showcase"
    >
      <user-avatar
        :user="user"
        :size="50"
      />
      <h3
        class="member-label"
        :title="user.email"
      >
        {{ user.label }}
      </h3>
      <p
        :title="user.email"
        class="member-email"
      >
        <small>
          {{ user.email }}
        </small>
      </p>
      <span @click.stop.prevent>
        <confirmation-toggle
          :cta="$t('panel.remove')"
          class="confirmation-buttons"
          @confirmed="$emit('removeMember', user)"
        />
      </span>
    </div>
    <div
      v-else
      class="list"
    >
      <span>
        <user-avatar :user="user" />
        {{ user.label }}
      </span>
      <span
        class="actions"
        @click.stop.prevent
      >
        <confirmation-toggle
          :cta="$t('panel.remove')"
          class="confirmation-buttons"
          @confirmed="$emit('removeMember', user)"
        />
      </span>
    </div>
  </li>
</template>

<script>
import Avatar from 'corteza-webapp-messaging/src/components/Avatar'
import { User } from 'corteza-webapp-messaging/src/types'
import ConfirmationToggle from 'corteza-webapp-messaging/src/components/Form/ConfirmationToggle'

export default {

  components: {
    'user-avatar': Avatar,
    ConfirmationToggle,
  },
  props: {
    user: {
      type: User,
      required: true,
    },
    variant: {
      type: String,
      required: false,
      // showcase, inline
      default: 'showcase',
    },
  },
}
</script>

<style lang="scss" scoped>
.member-item {
  .showcase {
    width: 150px;
    overflow: hidden;
    text-align: center;
  }

  .member-label, .member-email {
    margin-top: 5px;
    margin-bottom: 5px;
  }

  .member-email {
    margin-bottom: 15px;
  }

  .member-email, .member-label {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
}

.list {
  display: inline-flex;
  justify-content: space-between;
  width: 100%;
  align-items: center;
}

</style>
