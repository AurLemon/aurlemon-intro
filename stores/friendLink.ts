import { defineStore } from "pinia"
import utilsConfigData from "~/assets/utils/config.json"

interface FriendLink {
    name: string
    url: string
    desc?: string
    icon?: string
    stationmaster? :{
        name: string
        contact: string
    }
}

export const useFriendLinkStore = defineStore("friendLink", {
    state: () => ({
        friendLink: [] as FriendLink[]
    }),
    actions: {
        getSettingData() {
            this.friendLink = utilsConfigData.friend_link as FriendLink[]
        }
    }
})