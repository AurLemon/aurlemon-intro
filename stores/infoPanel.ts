import { defineStore } from "pinia"

export const useInfoPanel = defineStore("infoPanel", {
    state: () => ({
        panelStatus: false
    }),
    actions: {
        togglePanel() {
            this.panelStatus = !this.panelStatus
        }
    }
})