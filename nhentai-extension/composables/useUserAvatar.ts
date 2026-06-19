import { ref } from 'vue'

export const userAvatar = ref<string>('')
export const userName = ref<string>('')

export function setUserAvatar(url: string) {
    userAvatar.value = url
}

export function setUserName(name: string) {
    userName.value = name
}
