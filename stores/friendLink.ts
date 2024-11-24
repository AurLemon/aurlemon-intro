import { defineStore } from "pinia"
import utilsConfigData from "~/assets/utils/config.json"
import type Config from "~/assets/utils/config.d"

const utilsConfig: Config = utilsConfigData

export const useFriendLinkStore = defineStore("friendLink", {
    state: () => ({
        friendLink: [] as Config["friend_link"]
    }),
    actions: {
        getSettingData() {
            this.friendLink = utilsConfig.friend_link
        }
    }
})