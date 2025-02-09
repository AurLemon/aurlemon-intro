import { defineStore } from "pinia"

export const useHomeCard = defineStore("homeCard", {
    state: () => ({
        basicCard: false,
        abilityCard: false,
        interestCard: false
    }),
    actions: {
        isCardOpen() {
            return this.basicCard || this.abilityCard || this.interestCard
        },
        handleCard(cardName: string) {
            if (this.basicCard && cardName !== 'basic') this.basicCard = false
            if (this.abilityCard && cardName !== 'ability') this.abilityCard = false
            if (this.interestCard && cardName !== 'interest') this.interestCard = false

            switch (cardName) {
                case 'basic':
                    this.basicCard = !this.basicCard
                    break
                case 'ability':
                    this.abilityCard = !this.abilityCard
                    break
                case 'interest':
                    this.interestCard = !this.interestCard
                    break
                default:
                    console.error("Invalid card name.")
                    break
            }
        }
    }
})