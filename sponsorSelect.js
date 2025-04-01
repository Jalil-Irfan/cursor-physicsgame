class SponsorSelect {
    constructor(onSponsorSelect) {
        this.onSponsorSelect = onSponsorSelect;
        this.container = document.getElementById('sponsor-cards');
    }

    createSponsorCard(sponsorKey, sponsor) {
        const card = document.createElement('div');
        card.className = 'sponsor-card';
        card.innerHTML = `
            <img src="${sponsor.logo}" alt="${sponsor.name} logo" class="sponsor-logo">
            <h3>${sponsor.name}</h3>
            <p>${sponsor.description}</p>
            <div class="mission-objectives">
                <h4>Mission Objectives:</h4>
                <p>Primary: ${sponsor.objectives.main}</p>
                <p>Bonus: ${sponsor.objectives.bonus}</p>
                <p>Time Limit: ${sponsor.objectives.timeLimit}s</p>
            </div>
            <div class="special-abilities">
                <h4>Special Ability:</h4>
                <p>${sponsor.special.name}</p>
            </div>
            <button class="select-sponsor">Select ${sponsor.name}</button>
        `;

        card.querySelector('.select-sponsor').addEventListener('click', () => {
            this.onSponsorSelect(sponsorKey);
        });

        return card;
    }

    show() {
        this.container.innerHTML = '';
        Object.entries(SPONSORS).forEach(([key, sponsor]) => {
            this.container.appendChild(this.createSponsorCard(key, sponsor));
        });
    }

    hide() {
        this.container.innerHTML = '';
    }
}

// Make SponsorSelect available globally
window.SponsorSelect = SponsorSelect; 